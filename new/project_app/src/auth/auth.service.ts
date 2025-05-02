import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async register(username: string, password: string, role: 'student' | 'teacher') {
        const hash = await bcrypt.hash(password, 10);
        return this.usersService.create( username, hash, role);
    }

    async login(username: string, password: string) {
        const user = await this.usersService.findByUsername(username);
        if (!user) return null;
        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? user : null;
    }
}
