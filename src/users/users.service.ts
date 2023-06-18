import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { User, UserDocument } from './schemas/user.schema';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('rd_user') private userModel: Model<UserDocument>) {}

  async findByCid(cid: number): Promise<User> {
    const user = await this.userModel.findOne({ cid });
    if (!user) throw new NotFoundException();
    return user;
  }

  async createUser(dto: UserDto): Promise<User> {
    const user = new this.userModel({
      cid: dto.cid,
      nameFirst: dto.nameFirst,
      nameLast: dto.nameLast,
      nameFull: dto.nameFull,
      currentPosition: null,
    });
    return await user.save();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException();
    return user;
  }

  async findByCidAndUpdate(dto: UserDto): Promise<User> {
    const user = await this.userModel.findOne({ cid: dto.cid });
    if (!user) throw new NotFoundException();

    user.nameFirst = dto.nameFirst;
    user.nameLast = dto.nameLast;
    user.nameFull = dto.nameFull;
    user.currentPosition = dto.currentPosition;

    const savedUser = await user.save();
    return savedUser;
  }
}
