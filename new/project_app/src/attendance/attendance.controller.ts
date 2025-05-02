import { Controller, Post, Body, Get } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) {}

    @Post()
    async createOrUpdate(@Body() body: {
        studentId: string;
        status: 'present' | 'absent';
        date: string;
    }) {
        return this.attendanceService.upsert({
            studentId: body.studentId,
            date: body.date,
            status: body.status
        });
    }

    @Get()
    async getAll() {
        return this.attendanceService.findAll();
    }
}