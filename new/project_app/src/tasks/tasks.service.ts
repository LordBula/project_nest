import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task, TaskDocument } from './task.schema';
import { Model } from 'mongoose';

@Injectable()
export class TasksService {
    constructor(@InjectModel(Task.name, 'connection1') private model: Model<TaskDocument>) {}

    async create(title: string, description: string) {
        return this.model.create({ title, description });
    }

    async getAll() {
        return this.model.find();
    }
}
