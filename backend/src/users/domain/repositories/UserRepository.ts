import { User } from '../User';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(): Promise<User[]>;
  delete(id: UserId): Promise<void>;
}
