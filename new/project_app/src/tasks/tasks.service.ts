// tasks.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './task.schema';

@Injectable()
export class TasksService {
    constructor(
        @InjectModel(Task.name, 'connection1')
        private taskModel: Model<TaskDocument>
    ) {}

    async findAll() {
        return this.taskModel.find({ isDeleted: false }).exec();
    }

    async findActive() {
        return this.taskModel.find({ isActive: true, isDeleted: false }).exec();
    }

    async findOne(id: string) {
        return this.taskModel.findById(id).exec();
    }

    async create(createTaskDto) {
        const createdTask = new this.taskModel(createTaskDto);
        return createdTask.save();
    }

    async update(id: string, updateTaskDto) {
        return this.taskModel.findByIdAndUpdate(id, updateTaskDto, { new: true }).exec();
    }

    async archive(id: string) {
        return this.taskModel.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        ).exec();
    }
}