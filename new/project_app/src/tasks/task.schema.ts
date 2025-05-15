import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

class QuestionOption {
    @Prop({ required: true })
    text: string;

    @Prop({ required: true })
    correct: boolean;

    @Prop()
    explanation?: string;
}

class Question {
    @Prop({ required: true })
    text: string;

    @Prop({ type: [QuestionOption], required: true })
    options: QuestionOption[];

    @Prop({ required: true })
    difficulty: 'easy' | 'medium' | 'hard';

    @Prop({ required: true, default: 30 })
    timeLimit: number;
}

@Schema({ collection: 'tasks' }) // Явно указываем коллекцию
export class Task {
    @Prop({ required: true })
    name: string;

    @Prop({
        required: true,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    })
    difficulty: string;

    @Prop()
    description?: string;

    @Prop({ type: [Question], required: true })
    questions: Question[];

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);