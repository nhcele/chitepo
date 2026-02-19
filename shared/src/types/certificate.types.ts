import { IsUUID, IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  serial: string;
  txHash?: string; // Blockchain transaction hash
  ipfsHash?: string; // IPFS metadata hash
  issuedAt: Date;
  verifiedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateMetadata {
  courseName: string;
  learnerName: string;
  learnerEmail: string;
  instructorName: string;
  skillsTags: string[];
  issuanceDate: string;
  completionDate: string;
  finalScore: number;
  certificateSerial: string;
  verificationUrl: string;
}

export interface BlockchainCertificate {
  tokenId: string;
  owner: string;
  metadataUri: string;
  issuedAt: number;
  isRevoked: boolean;
}

export class IssueCertificateDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;

  @IsString()
  finalScore: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillsTags?: string[];
}

export class CreateCertificateDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;

  @IsString()
  finalScore: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillsTags?: string[];
}

export class VerifyCertificateDto {
  @IsString()
  serial: string;

  @IsOptional()
  @IsString()
  txHash?: string;
}

export interface CertificateVerificationResult {
  isValid: boolean;
  certificate?: Certificate;
  metadata?: CertificateMetadata;
  blockchainData?: BlockchainCertificate;
  verificationErrors?: string[];
}
