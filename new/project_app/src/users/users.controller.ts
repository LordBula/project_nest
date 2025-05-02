import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    async getUsers(@Query('role') role: string) {
        if (role === 'student') {
            return this.usersService.findStudents();
        }
        return [];
    }
}