export interface Certificate {
    id: string;
    userId: string;
    courseId: string;
    serial: string;
    txHash?: string;
    ipfsHash?: string;
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
export declare class IssueCertificateDto {
    userId: string;
    courseId: string;
    finalScore: number;
    skillsTags?: string[];
}
export declare class CreateCertificateDto {
    userId: string;
    courseId: string;
    finalScore: number;
    skillsTags?: string[];
}
export declare class VerifyCertificateDto {
    serial: string;
    txHash?: string;
}
export interface CertificateVerificationResult {
    isValid: boolean;
    certificate?: Certificate;
    metadata?: CertificateMetadata;
    blockchainData?: BlockchainCertificate;
    verificationErrors?: string[];
}
