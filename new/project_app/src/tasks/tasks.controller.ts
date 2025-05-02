import { Controller, Post, Body, Get } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
    constructor(private service: TasksService) {}

    @Post()
    create(@Body() body: { title: string, description: string }) {
        return this.service.create(body.title, body.description);
    }

    @Get()
    getAll() {
        return this.service.getAll();
    }
}
