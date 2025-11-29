import { Injectable } from '@nestjs/common';
import { User } from '../../domain/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { UserRepository } from '../../domain/repositories/UserRepository';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
    private users: Map<string, User> = new Map();

    async save(user: User): Promise<void> {
        this.users.set(user.getId().toString(), user);
    }

    async findById(id: UserId): Promise<User | null> {
        return this.users.get(id.toString()) || null;
    }

    async findByEmail(email: Email): Promise<User | null> {
        for (const user of this.users.values()) {
            if (user.getEmail().equals(email)) {
                return user;
            }
        }
        return null;
    }

    async findAll(): Promise<User[]> {
        return Array.from(this.users.values());
    }

    async delete(id: UserId): Promise<void> {
        this.users.delete(id.toString());
    }

    // Helper method for testing
    clear(): void {
        this.users.clear();
    }
}
