import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RDAircraft, RDAircraftDocument } from './schemas/aircraft.schema';
import { VatsimService } from 'src/vatsim/vatsim.service';
import { RdAircraftDto } from './dto/rdAircraft.dto';
import { User } from 'src/users/schemas/user.schema';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RdService {

  constructor(
    @InjectModel('rd_aircraft') private aircraftModel: Model<RDAircraftDocument>,
    private vatsimService: VatsimService
  ) { }

  async getAircraft(filter: { code: string | undefined, callsign: string | undefined }): Promise<{ rd: RDAircraft[], vatsim: Record<string, any> }> {
    if (!filter.callsign && !filter.code) {
      throw new BadRequestException(
        'Please specify either an aircraft\'s callsign or valid transponder code'
      )
    }

    // Data from RD
    const query = filter.code ? { transponder: filter.code } : { callsign: filter.callsign }

    const rdAircraft = await this.aircraftModel.find(query).exec()
    if (!rdAircraft) throw new NotFoundException()

    // Data from VATSIM
    const vatsimAircraft = (await this.vatsimService.getPilot({ callsign: filter.callsign, transponder: filter.code })).pilot

    return { rd: rdAircraft, vatsim: vatsimAircraft}
  }

  async addAircraftToRD(filter: { code: string | undefined, callsign: string | undefined }, user: User): Promise<{ rd: RDAircraft, vatsim: Record<string, any> }> {
    if (!filter.callsign && !filter.code) {
      throw new BadRequestException(
        'Please specify either an aircraft\'s callsign or valid transponder code'
      )
    }

    // User Data
    if (!user || !user.currentPosition) throw new ForbiddenException()
    let localController: User | null;
    if (user.currentPosition.endsWith('TWR')) localController = user
      else /* placeholder */ throw new ForbiddenException() // check if designated as DEP. If not DEP, Forbidden

    // Data from VATSIM
    const vatsimAircraft = (await this.vatsimService.getPilot({ callsign: filter.callsign, transponder: filter.code })).pilot

    const rdAircraft = new this.aircraftModel({
      addedTimestamp: new Date().toISOString(),
      localController: localController,
      departureController: 'TODO',
      accepted: false,
      callsign: vatsimAircraft.callsign,
      transponder: vatsimAircraft.flight_plan.assigned_transponder
    })
    const savedRdAircraft = await rdAircraft.save()

    return { rd: savedRdAircraft, vatsim: vatsimAircraft }
  }

  async getRdList(controller: string): Promise<{ count: number, data: RDAircraft[] }> {
    const [count, data] = await Promise.all([
      this.aircraftModel.countDocuments({ $or: [{ departureController: controller}, { localController: controller }]}).exec(),
      this.aircraftModel
        .find({ $or: [{ departureController: controller}, { localController: controller }]})
        .exec()
    ])

    return { count, data };
  }

  async updateRdAircraft(filter: { code: string | undefined, callsign: string | undefined }, dto: RdAircraftDto): Promise<{ rd: RDAircraft, vatsim: Record<string, any> }> {
    if (!filter.callsign && !filter.code) {
      throw new BadRequestException(
        'Please specify either an aircraft\'s callsign or valid transponder code'
      )
    }

    // Data from RD
    const query = filter.code ? { transponder: filter.code } : { callsign: filter.callsign }

    const rdAircraft = await this.aircraftModel.findOne(query).exec()
    if (!rdAircraft) throw new NotFoundException()

    rdAircraft.addedTimestamp = dto.addedTimestamp;
    rdAircraft.localController = dto.localController;
    rdAircraft.departureController = dto.departureController;
    rdAircraft.accepted = dto.accepted;
    rdAircraft.transponder = dto.transponder;

    const savedRdAircraft = await rdAircraft.save()

    // Data from VATSIM
    const vatsimAircraft = (await this.vatsimService.getPilot({ callsign: filter.callsign, transponder: filter.code })).pilot

    return { rd: savedRdAircraft, vatsim: vatsimAircraft}
  }

  async deleteRdAircraft(filter: { code: string | undefined, callsign: string | undefined }): Promise<RDAircraft> {
    const query = filter.code ? { transponder: filter.code } : { callsign: filter.callsign }

    return await this.aircraftModel.findOneAndDelete(query).exec()
  }

  @Cron('* * * * *') // Every Minute
  async autoDeleteRdAircraft() {
    const allRdAircraft = await this.aircraftModel.find().exec()

    allRdAircraft.forEach(async aircraft => {
      let vatsimAircraft = await this.vatsimService.getPilot({ callsign: aircraft.callsign })

      if (vatsimAircraft.pilot.length < 1) return this.aircraftModel.deleteOne({ callsign: aircraft.callsign })
      if (vatsimAircraft.pilot.altitude > 2500) return this.aircraftModel.deleteOne({ callsign: aircraft.callsign })
    })
  }
}
