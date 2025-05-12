import { Controller, Get, Post, Body } from '@nestjs/common';
import { ResultsService } from './results.service';
import { Logger } from '@nestjs/common';

@Controller('results')
export class ResultsController {
    private readonly logger = new Logger(ResultsController.name);

    constructor(private readonly resultsService: ResultsService) {}

    @Post()
    async saveResults(@Body() body) {
        try {
            this.logger.log('Saving results...', body);
            const result = await this.resultsService.create(body);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            this.logger.error('Save error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Get('teacher')
    async getTeacherResults() {
        try {
            this.logger.log('Fetching teacher results...');
            const results = await this.resultsService.findAllForTeacher();
            return {
                success: true,
                data: results
            };
        } catch (error) {
            this.logger.error('Fetch error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}