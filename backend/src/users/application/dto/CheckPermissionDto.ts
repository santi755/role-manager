import { IsNotEmpty, IsString } from 'class-validator';

export class CheckPermissionDto {
  @IsNotEmpty()
  @IsString()
  resource: string;

  @IsNotEmpty()
  @IsString()
  action: string;
}
