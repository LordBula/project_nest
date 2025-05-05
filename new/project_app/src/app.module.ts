import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TasksModule } from './tasks/tasks.module';
import { ResultsModule } from './results/results.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/portal-nest', {
      connectionName: 'connection1'
    }),
    UsersModule,
    AuthModule,
    AttendanceModule,
    TasksModule,
    ResultsModule,
  ],
})
export class AppModule {}
