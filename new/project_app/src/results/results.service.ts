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

    async create(resultData: {
        userId: string;
        testName: string;
        difficulty: string;
        score: number;
        correctAnswers: number;
        totalQuestions: number;
        timeSpent: number;
        details: Record<string, any>;
    }): Promise<Result> {
        const createdResult = new this.resultModel(resultData);
        return createdResult.save();
    }
}