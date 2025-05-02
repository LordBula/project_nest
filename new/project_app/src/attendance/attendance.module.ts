import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceSchema } from './attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
        [{ name: Attendance.name, schema: AttendanceSchema }],
        'connection1' // Указываем имя подключения
    )
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService]
})
export class AttendanceModule {}