import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SeedDatabase, SeedDataResult } from '../../application/use-cases/SeedDatabase';

@Controller('api/seed')
export class SeedController {
  constructor(private readonly seedDatabase: SeedDatabase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async seed(): Promise<SeedDataResult> {
    return this.seedDatabase.execute();
  }
}
