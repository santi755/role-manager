import { IsNotEmpty, IsString } from 'class-validator';

export class SetPermissionParentDto {
  @IsNotEmpty()
  @IsString()
  parentPermissionId: string;
}
