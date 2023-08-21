import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';

import { RDAircraft, RDAircraftDocument } from './schemas/aircraft.schema';
import { VatsimService } from 'src/vatsim/vatsim.service';
import { RdAircraftDto } from './dto/rdAircraft.dto';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RdService {
  constructor(
    @InjectModel('rd_aircraft')
    private aircraftModel: Model<RDAircraftDocument>,
    private vatsimService: VatsimService,
    private usersService: UsersService,
  ) {}

  async getAircraft(filter: {
    code: string | undefined;
    callsign: string | undefined;
  }): Promise<RDAircraft[]> {
    if (!filter.callsign && !filter.code) {
      throw new BadRequestException(
        "Please specify either an aircraft's callsign or valid transponder code",
      );
    }

    // Data from RD
    const query = filter.code
      ? { transponder: filter.code }
      : { callsign: filter.callsign };

    const rdAircraft = await this.aircraftModel
      .find(query)
      .populate('departureController')
      .populate('localController')
      .exec();
    if (!rdAircraft) throw new NotFoundException();

    return rdAircraft;
  }

  async addAircraftToRD(
    filter: { code: string | undefined; callsign: string | undefined },
    user: User,
  ): Promise<RDAircraft> {
    if (!filter.callsign && !filter.code) {
      throw new BadRequestException(
        "Please specify either an aircraft's callsign or valid transponder code",
      );
    }

    // User Data
    if (!user || !user.currentPosition) throw new ForbiddenException();
    let localController: User;
    if (user.currentPosition.endsWith('TWR')) localController = user;
      else throw new ForbiddenException('Only TWR can add aircraft to the RD List')

    let departureController: User =  await this.usersService.findDepartureController();
    if (!departureController) throw new ForbiddenException('No departure controller')


    // Data from VATSIM
    const vatsimAircraft = (
      await this.vatsimService.getPilot({
        callsign: filter.callsign,
        transponder: filter.code,
      })
    ).pilot;
    if (!vatsimAircraft || vatsimAircraft.length < 1) throw new NotFoundException('Aircraft not found on the VATSIM Network')

    // Check Duplicate
    // If duplicate exists, delete it
    const query = filter.code
      ? { transponder: filter.code }
      : { callsign: filter.callsign };

    const dupCount = await this.aircraftModel.countDocuments(query).exec()
    if (dupCount > 0) {
      const dup = this.aircraftModel.findOneAndDelete(query).exec()
      return dup;
    }

    const rdAircraft = new this.aircraftModel({
      addedTimestamp: new Date().toISOString(),
      localController: localController,
      departureController: departureController,
      accepted: false,
      callsign: vatsimAircraft[0].callsign,
      transponder: vatsimAircraft[0].flight_plan.assigned_transponder,
    });
    const savedRdAircraft = await rdAircraft.save();
    await savedRdAircraft.populate('departureController')

    return savedRdAircraft;
  }

  async getRdList(
    controller: string,
  ): Promise<{ count: number; data: RDAircraft[] }> {
    const [count, data] = await Promise.all([
      this.aircraftModel
        .countDocuments({
          $or: [
            { departureController: controller },
            { localController: controller },
          ],
        })
        .exec(),
      this.aircraftModel
        .find({
          $or: [
            { departureController: controller },
            { localController: controller },
          ],
        })
        .populate('departureController')
        .populate('localController')
        .exec(),
    ]);

    return { count, data };
  }

  async acceptAircraft(
    filter: { code: string | undefined; callsign: string | undefined },
  ): Promise<RDAircraft> {
    if (!filter.callsign && !filter.code) {
      throw new BadRequestException(
        "Please specify either an aircraft's callsign or valid transponder code",
      );
    }

    // Data from RD
    const query = filter.code
      ? { transponder: filter.code }
      : { callsign: filter.callsign };

    const rdAircraft = await this.aircraftModel.findOne(query).exec();
    if (!rdAircraft) throw new NotFoundException();

    rdAircraft.accepted = true;

    const savedRdAircraft = await rdAircraft.save();
    await savedRdAircraft.populate('departureController');
    await savedRdAircraft.populate('localController');

    return savedRdAircraft;
  }

  async deleteRdAircraft(filter: {
    code: string | undefined;
    callsign: string | undefined;
  }): Promise<RDAircraft> {
    const query = filter.code
      ? { transponder: filter.code }
      : { callsign: filter.callsign };

    return await this.aircraftModel
      .findOneAndDelete(query)
      .populate('departureController')
      .populate('localController')
      .exec();
  }

  @Cron('* * * * *') // Every Minute
  async autoDeleteRdAircraft() {
    const allRdAircraft = await this.aircraftModel.find().exec();

    allRdAircraft.forEach(async (aircraft) => {
      const vatsimAircraft = await this.vatsimService.getPilot({
        callsign: aircraft.callsign,
      });

      if (vatsimAircraft.pilot.length < 1)
        return this.aircraftModel.deleteOne({ callsign: aircraft.callsign });
      if (vatsimAircraft.pilot.altitude > 37) // Altitude greater than 37 feet
        return this.aircraftModel.deleteOne({ callsign: aircraft.callsign });
    });
  }
}
