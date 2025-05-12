import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ResultDocument } from './results.schema';

@Injectable()
export class ResultsService {
    constructor(
        @InjectModel(Result.name, 'connection1') // Указываем имя соединения
        private resultModel: Model<ResultDocument>
    ) {}

    async create(resultData: any) {
        const createdResult = new this.resultModel(resultData);
        return createdResult.save();
    }

    async findAllForTeacher() {
        try {
            return await this.resultModel.find()
                .sort({ createdAt: -1 })
                .lean()
                .exec();
        } catch (error) {
            console.error('Error fetching results:', error);
            throw error;
        }
    }
}