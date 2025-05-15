import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ResultsService } from './results.service';
import { Result } from './results.schema';

@Controller('results')
export class ResultsController {
    constructor(private readonly resultsService: ResultsService) {}

    @Get()
    async findAll(@Query('userId') userId?: string) {
        return this.resultsService.findAll(userId);
    }

    @Post()
    async create(@Body() resultData: Result) {
        return this.resultsService.create(resultData);
    }
}