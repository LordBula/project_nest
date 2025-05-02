import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './attendance.schema';

@Injectable()
export class AttendanceService {
    private readonly logger = new Logger(AttendanceService.name);

    constructor(
        @InjectModel(Attendance.name, 'connection1')
        private attendanceModel: Model<AttendanceDocument>
    ) {
        this.logger.log('AttendanceModel initialized');
    }

    async upsert(attendanceData: {
        studentId: string;
        date: string;
        status: 'present' | 'absent';
    }) {
        try {
            const result = await this.attendanceModel.findOneAndUpdate(
                {
                    studentId: attendanceData.studentId,
                    date: attendanceData.date
                },
                { $set: { status: attendanceData.status } },
                { upsert: true, new: true }
            );
            this.logger.log(`Attendance record upserted for student ${attendanceData.studentId}`);
            return result;
        } catch (error) {
            this.logger.error(`Error upserting attendance: ${error.message}`);
            throw error;
        }
    }

    async findAll() {
        return this.attendanceModel.find().exec();
    }

    async findByStudent(studentId: string) {
        return this.attendanceModel.find({ studentId }).exec();
    }
}