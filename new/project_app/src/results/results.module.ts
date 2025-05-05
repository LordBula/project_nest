import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { Result, ResultSchema } from './results.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
        [{ name: Result.name, schema: ResultSchema }],
        'connection1' // Указываем имя соединения здесь
    )
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
})
export class ResultsModule {}