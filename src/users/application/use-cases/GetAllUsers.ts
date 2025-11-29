import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { UserDto } from '../dto/UserDto';

@Injectable()
export class GetAllUsers {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
    ) { }

    async execute(): Promise<UserDto[]> {
        const users = await this.userRepository.findAll();

        return users.map((user) => ({
            id: user.getId().toString(),
            name: user.getName(),
            email: user.getEmail().toString(),
            createdAt: user.getCreatedAt(),
            assignedRoles: Array.from(user.getAssignedRoles()).map((r) =>
                r.toString(),
            ),
        }));
    }
}
