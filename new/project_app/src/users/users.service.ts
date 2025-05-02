import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name, 'connection1') private userModel: Model<UserDocument>) {}

    async create(username: string, password: string, role: string) {
        const user = await this.userModel.create({
            username,
            password,
            role
        });
        await user.save();
        return user
    }

    async findByUsername(username: string) {
        return this.userModel.findOne({ username });
    }

    async findById(id: string) {
        return this.userModel.findById(id);
    }

    async findStudents() {
        return this.userModel.find({ role: 'student' })
            .select('-password -__v')
            .exec();
    }
}
