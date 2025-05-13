// tasks.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get() // Получение всех тестов
    async findAll() {
        return this.tasksService.findAll();
    }

    @Get('active') // Получение активных тестов
    async findActive() {
        return this.tasksService.findActive();
    }

    @Get(':id') // Получение теста по ID
    async findOne(@Param('id') id: string) {
        return this.tasksService.findOne(id);
    }

    @Post() // Создание теста
    async create(@Body() createTaskDto) {
        return this.tasksService.create(createTaskDto);
    }

    @Patch(':id') // Обновление теста
    async update(@Param('id') id: string, @Body() updateTaskDto) {
        return this.tasksService.update(id, updateTaskDto);
    }

    @Delete(':id') // Архивирование теста
    async remove(@Param('id') id: string) {
        return this.tasksService.archive(id);
    }
}