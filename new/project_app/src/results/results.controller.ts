import { Controller, Get, Query } from '@nestjs/common';
import { ResultsService } from './results.service';

@Controller('results')
export class ResultsController {
    constructor(private readonly resultsService: ResultsService) {}

    @Get()
    async findAll(@Query('userId') userId?: string) {
        return this.resultsService.findAll(userId);
    }
}