import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true }) // Добавляем автоматические поля createdAt/updatedAt
export class Attendance {
    @Prop({ required: true, index: true })
    studentId: string;

    @Prop({ required: true })
    date: string;

    @Prop({
        type: String,
        required: true,
        enum: ['present', 'absent'],
        default: 'absent'
    })
    status: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);