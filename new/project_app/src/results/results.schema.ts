import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResultDocument = Result & Document;

@Schema({ timestamps: true })
export class Result {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    taskId: string;  // Добавляем taskId

    @Prop({ required: true })
    testName: string;

    @Prop({
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    })
    difficulty: string;

    @Prop({ required: true })
    score: number;

    @Prop({ required: true })
    correctAnswers: number;

    @Prop({ required: true })
    totalQuestions: number;

    @Prop({ required: true })
    timeSpent: number;

    @Prop({ type: [{
            question: String,
            userAnswer: String,
            isCorrect: Boolean
        }] })
    answers: {  // Заменяем details на конкретную структуру
        question: string;
        userAnswer: string;
        isCorrect: boolean;
    }[];

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const ResultSchema = SchemaFactory.createForClass(Result);