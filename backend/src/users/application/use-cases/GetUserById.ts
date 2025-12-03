import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { UserDto } from '../dto/UserDto';

export interface GetUserByIdQuery {
  userId: string;
}

@Injectable()
export class GetUserById {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserDto> {
    const userId = UserId.fromString(query.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error(`User with id ${query.userId} not found`);
    }

    return {
      id: user.getId().toString(),
      name: user.getName(),
      email: user.getEmail().toString(),
      createdAt: user.getCreatedAt(),
      assignedRoles: Array.from(user.getAssignedRoles()).map((r) =>
        r.toString(),
      ),
    };
  }
}
