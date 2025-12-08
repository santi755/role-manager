import { IsArray, IsString } from 'class-validator';

export class SyncUserRolesDto {
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}
