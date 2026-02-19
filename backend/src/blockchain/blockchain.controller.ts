import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Query, 
  Req, 
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockchainService, BlockchainCertificate } from './blockchain.service';
import { Request } from 'express';

@Controller('blockchain')
@UseGuards(JwtAuthGuard)
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('deploy')
  async deployContract() {
    const contractAddress = await this.blockchainService.deployCertificateContract();
    return { 
      message: 'Certificate contract deployed successfully',
      contractAddress 
    };
  }

  @Post('certificate/issue')
  async issueCertificate(
    @Req() req: Request,
    @Body() data: {
      certificateId: string;
      userId: string;
      courseId: string;
    }
  ) {
    if (!data.certificateId || !data.userId || !data.courseId) {
      throw new BadRequestException('Certificate ID, user ID, and course ID are required');
    }

    const certificate = await this.blockchainService.issueCertificateOnBlockchain(
      data.certificateId,
      data.userId,
      data.courseId
    );

    return { 
      message: 'Certificate issued on blockchain successfully',
      certificate 
    };
  }

  @Post('certificate/:tokenId/verify')
  async verifyCertificate(@Param('tokenId') tokenId: string) {
    const verified = await this.blockchainService.verifyCertificateOnBlockchain(tokenId);
    return { 
      tokenId,
      verified,
      message: verified ? 'Certificate is valid' : 'Certificate verification failed'
    };
  }

  @Get('certificate/:tokenId/owner')
  async getCertificateOwner(@Param('tokenId') tokenId: string) {
    const owner = await this.blockchainService.getCertificateOwner(tokenId);
    return { 
      tokenId,
      owner 
    };
  }

  @Get('certificates/:userId')
  async getUserCertificates(@Param('userId') userId: string) {
    const certificates = await this.blockchainService.getUserCertificates(userId);
    return { 
      userId,
      certificates 
    };
  }

  @Post('certificate/transfer')
  async transferCertificate(
    @Req() req: Request,
    @Body() data: {
      fromUserId: string;
      toUserId: string;
      tokenId: string;
    }
  ) {
    if (!data.fromUserId || !data.toUserId || !data.tokenId) {
      throw new BadRequestException('From user ID, to user ID, and token ID are required');
    }

    const txHash = await this.blockchainService.transferCertificate(
      data.fromUserId,
      data.toUserId,
      data.tokenId
    );

    return { 
      message: 'Certificate transferred successfully',
      transactionHash: txHash 
    };
  }

  @Get('contract/info')
  async getContractInfo() {
    const info = await this.blockchainService.getContractInfo();
    return { contractInfo: info };
  }

  @Post('certificate/validate-signature')
  async validateCertificateSignature(
    @Body() data: {
      certificateId: string;
      signature: string;
    }
  ) {
    if (!data.certificateId || !data.signature) {
      throw new BadRequestException('Certificate ID and signature are required');
    }

    const isValid = await this.blockchainService.validateCertificateSignature(
      data.certificateId,
      data.signature
    );

    return { 
      certificateId: data.certificateId,
      signature: data.signature,
      isValid,
      message: isValid ? 'Signature is valid' : 'Signature is invalid'
    };
  }

  @Get('my-certificates')
  async getMyCertificates(@Req() req: Request) {
    const userId = (req as any).user?.id;
    const certificates = await this.blockchainService.getUserCertificates(userId);
    return { certificates };
  }

  @Post('certificate/:tokenId/validate')
  async validateCertificate(@Param('tokenId') tokenId: string) {
    try {
      const owner = await this.blockchainService.getCertificateOwner(tokenId);
      const verified = await this.blockchainService.verifyCertificateOnBlockchain(tokenId);
      
      return {
        tokenId,
        owner,
        verified,
        isValid: verified && owner !== undefined,
        message: verified && owner !== undefined 
          ? 'Certificate is valid and verified' 
          : 'Certificate is not valid or not verified'
      };
    } catch (error) {
      return {
        tokenId,
        isValid: false,
        message: 'Certificate not found or invalid'
      };
    }
  }
}
