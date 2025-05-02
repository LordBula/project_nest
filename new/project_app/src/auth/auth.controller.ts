import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() body: { username: string, password: string, role: 'student' | 'teacher' }) {
        return this.authService.register(body.username, body.password, body.role);
    }

    @Post('login')
    login(@Body() body: { username: string, password: string }) {
        return this.authService.login(body.username, body.password);
    }
}
