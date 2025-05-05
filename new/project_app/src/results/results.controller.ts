import { Controller, Post, Body } from '@nestjs/common';
import { ResultsService } from './results.service';
import { Logger } from '@nestjs/common';

@Controller('results')
export class ResultsController {
    private readonly logger = new Logger(ResultsController.name);

    constructor(private readonly resultsService: ResultsService) {}

    @Post()
    async saveResults(@Body() body) {
        try {
            this.logger.log('Attempting to save results...');
            const result = await this.resultsService.create(body);
            this.logger.log('Results saved successfully');
            return { success: true, data: result };
        } catch (error) {
            this.logger.error('Failed to save results', error.stack);
            return {
                success: false,
                message: 'Failed to save results',
                error: error.message
            };
        }
    }
}