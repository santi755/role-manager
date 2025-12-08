import {
  IsNotEmpty,
  IsString,
  IsEnum,
  ValidateNested,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScopeDto {
  @IsEnum(['own', 'team', 'org', 'global', 'specific'])
  level: 'own' | 'team' | 'org' | 'global' | 'specific';

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.level === 'specific')
  @IsNotEmpty({
    message: 'Target is required when scope level is "specific"',
  })
  target?: string;
}

export class CreatePermissionDto {
  @IsEnum(['create', 'read', 'update', 'delete', 'execute', 'manage'])
  action: string;

  @ValidateNested()
  @Type(() => ScopeDto)
  scope: ScopeDto;

  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  description: string;
}
