import { IsNotEmpty, IsString } from 'class-validator';

export class AssignRoleDto {
  @IsNotEmpty()
  @IsString()
  roleId: string;
}
