import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Result, ResultDocument } from './results.schema';

@Injectable()
export class ResultsService {
    constructor(
        @InjectModel(Result.name, 'connection1')
        private resultModel: Model<ResultDocument>
    ) {}

    async findAll(userId?: string) {
        const query: any = {};
        if (userId) query.userId = userId;
        return this.resultModel.find(query).exec();
    }
}