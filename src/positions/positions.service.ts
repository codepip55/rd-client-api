import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';

import { User, UserDocument } from 'src/users/schemas/user.schema';
import { VatsimService } from 'src/vatsim/vatsim.service';

@Injectable()
export class PositionsService {
  constructor(
    @InjectModel('rd_user') private userSchema: Model<UserDocument>,
    private vatsimService: VatsimService,
  ) {}

  async findAllControllers(): Promise<User[]> {
    const controllers = await this.userSchema.find({
      currentPosition: { $ne: null },
    });
    return controllers;
  }

  async findController(q: { cid: string; callsign: string }): Promise<User[]> {
    const filter = q.cid ? { cid: q.cid } : { currentPosition: q.callsign };

    const controllers = await this.userSchema.find(filter).exec();
    return controllers;
  }

  async logonPosition(user: User): Promise<User> {
    const position = await this.vatsimService.getControllerByCid(user.cid);

    if (position.controller.length < 1)
      throw new NotFoundException('Controller not found');

    const fetchedUser = await this.userSchema.findById(user.id);
    if (!fetchedUser) throw new NotFoundException('User not found');

    fetchedUser.currentPosition = position.controller[0].callsign;

    const savedUser = await fetchedUser.save();
    return savedUser;
  }

  async logoffPosition(user: User): Promise<User> {
    const fetchedUser = await this.userSchema.findById(user.id);
    if (!fetchedUser) throw new NotFoundException('User not found');

    fetchedUser.currentPosition = null;

    const savedUser = await fetchedUser.save();
    return savedUser;
  }

  @Cron('*/5 * * * *')
  async autoLogoff(): Promise<void> {
    const loggedOnUsers = await this.userSchema
      .find({ currentPosition: { $ne: null } })
      .exec();

    loggedOnUsers.forEach(async (user) => {
      const controller = await this.vatsimService.getControllerByCid(user.cid);
      if (controller.controller !== 'none') return;

      user.currentPosition = null;
      user.save();
    });
  }
}
