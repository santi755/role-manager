import { IsNotEmpty, IsString } from 'class-validator';

export class SetRoleParentDto {
  @IsNotEmpty()
  @IsString()
  parentRoleId: string;
}
