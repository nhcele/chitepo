import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, IsObject, Min, Max, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { LicenseType } from '../entities/team-license.entity';

export class LicenseRestrictionsDto {
  @IsOptional()
  canReassign?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxReassignments?: number = 3;

  @IsOptional()
  requireManagerApproval?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDepartments?: string[] = [];
}

export class LicenseMetadataDto {
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string = 'credit_card';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountApplied?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  bulkDiscount?: number = 0;
}

export class PurchaseLicenseDto {
  @IsEnum(LicenseType, { message: 'Invalid license type' })
  type: LicenseType;

  @IsNumber()
  @Min(1)
  @Max(10000)
  quantity: number;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  learningPathId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  durationMonths?: number = 12;

  @IsOptional()
  @ValidateNested()
  @Type(() => LicenseRestrictionsDto)
  restrictions?: LicenseRestrictionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LicenseMetadataDto)
  metadata?: LicenseMetadataDto;

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'Billing reference cannot exceed 255 characters' })
  billingReference?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}

export class BulkPurchaseLicensesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLicenseDto)
  licenses: PurchaseLicenseDto[];

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'Purchase order cannot exceed 255 characters' })
  purchaseOrder?: string;

  @IsOptional()
  @IsString()
  billingEmail?: string;
}
