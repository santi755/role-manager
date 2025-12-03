import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // MongoDB Connection
    MongooseModule.forRoot('mongodb://localhost:27017/role-manager', {
      // Optional: Add connection options
      retryAttempts: 3,
      retryDelay: 1000,
    }),
    RolesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
