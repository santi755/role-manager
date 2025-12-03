import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/User';
import { Email } from '../../domain/value-objects/Email';
import type { UserRepository } from '../../domain/repositories/UserRepository';

export interface CreateUserCommand {
  name: string;
  email: string;
}

@Injectable()
export class CreateUser {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const email = Email.create(command.email);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error(`User with email ${command.email} already exists`);
    }

    const user = User.create(command.name, email);

    await this.userRepository.save(user);

    return user;
  }
}
