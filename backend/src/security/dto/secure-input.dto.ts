import { IsString, IsEmail, IsOptional, MaxLength, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class SecureInputDto {
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  subject?: string;

  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => value?.trim())
  message?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SecureSearchDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  query?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Math.min(parseInt(value) || 10, 100))
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sortBy?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'desc' ? 'DESC' : 'ASC')
  sortOrder?: 'ASC' | 'DESC';
}

export class SecureFileUploadDto {
  @IsString()
  @MaxLength(255)
  filename?: string;

  @IsString()
  @MaxLength(50)
  mimeType?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value) || 0)
  size?: number;
}
