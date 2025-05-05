import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type ResultDocument = Result & Document

@Schema()
export class Result {
    @Prop({ required: true })
    userId: string

    @Prop({ required: true })
    testName: string

    @Prop({ required: true })
    difficulty: string

    @Prop({ required: true })
    score: number

    @Prop({ required: true })
    correctAnswers: number

    @Prop({ required: true })
    totalQuestions: number

    @Prop({ required: true })
    timeSpent: number

    @Prop({ type: Object })
    details: Record<string, any>

    @Prop({ default: Date.now })
    createdAt: Date
}

export const ResultSchema = SchemaFactory.createForClass(Result)