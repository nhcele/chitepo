import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Certificate } from '../certificates/entities/certificate.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';

interface CertificateMetadata {
  certificateId: string;
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
  completionDate: string;
  issuerName: string;
  issuerSignature: string;
  skills: string[];
  duration: number;
  score?: number;
}

export interface BlockchainCertificate {
  tokenId: bigint;
  owner: string;
  metadataURI: string;
  issuedAt: bigint;
  verified: boolean;
}

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Certificate) private readonly certificateRepo: Repository<Certificate>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
  ) {
    // Initialize provider and wallet only if private key is provided
    const privateKey = this.configService.get<string>('POLYGON_PRIVATE_KEY') || 
                       this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');
    
    if (privateKey) {
      this.provider = new ethers.JsonRpcProvider(
        this.configService.get<string>('POLYGON_RPC_URL') || 'https://polygon-rpc.com'
      );
      
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contractAddress = this.configService.get<string>('CONTRACT_ADDRESS') || '';
      
      // Contract ABI (simplified for certificate NFT)
      const contractABI = [
        'function mintCertificate(address to, string metadataURI) returns (uint256)',
        'function verifyCertificate(uint256 tokenId) returns (bool)',
        'function ownerOf(uint256 tokenId) returns (address)',
        'function tokenURI(uint256 tokenId) returns (string)',
        'function totalSupply() returns (uint256)',
        'function transferFrom(address from, address to, uint256 tokenId)',
        'event CertificateMinted(uint256 indexed tokenId, address indexed to, string metadataURI)',
        'event CertificateVerified(uint256 indexed tokenId, bool verified)',
      ];

      // Only initialize contract if we have an address
      if (this.contractAddress) {
        this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);
      }
    } else {
      console.log('Blockchain not configured (missing BLOCKCHAIN_PRIVATE_KEY), certificate minting will be disabled');
    }
  }

  async deployCertificateContract(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Blockchain service not configured');
    }
    try {
      // Contract bytecode and ABI for certificate NFT
      const contractSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.0;

        import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
        import "@openzeppelin/contracts/access/Ownable.sol";
        import "@openzeppelin/contracts/utils/Counters.sol";

        contract ChitepoCertificate is ERC721, Ownable {
            using Counters for Counters.Counter;
            Counters.Counter private _tokenIds;

            struct CertificateData {
                string metadataURI;
                uint256 issuedAt;
                bool verified;
            }

            mapping(uint256 => CertificateData) private _certificates;
            mapping(address => uint256[]) private _userCertificates;

            event CertificateMinted(uint256 indexed tokenId, address indexed to, string metadataURI);
            event CertificateVerified(uint256 indexed tokenId, bool verified);

            constructor() ERC721("Chitepo Certificate", "MCERT") {}

            function mintCertificate(address to, string memory metadataURI) public onlyOwner returns (uint256) {
                _tokenIds.increment();
                uint256 newTokenId = _tokenIds.current();

                _mint(to, newTokenId);
                _certificates[newTokenId] = CertificateData({
                    metadataURI: metadataURI,
                    issuedAt: block.timestamp,
                    verified: false
                });

                _userCertificates[to].push(newTokenId);

                emit CertificateMinted(newTokenId, to, metadataURI);
                return newTokenId;
            }

            function verifyCertificate(uint256 tokenId) public onlyOwner {
                require(_exists(tokenId), "Certificate does not exist");
                _certificates[tokenId].verified = true;
                emit CertificateVerified(tokenId, true);
            }

            function getUserCertificates(address user) public view returns (uint256[] memory) {
                return _userCertificates[user];
            }

            function getCertificateData(uint256 tokenId) public view returns (CertificateData memory) {
                require(_exists(tokenId), "Certificate does not exist");
                return _certificates[tokenId];
            }

            function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {
                super._beforeTokenTransfer(from, to, tokenId);
                
                if (from != address(0)) {
                    // Remove from old owner's list
                    uint256[] storage userCerts = _userCertificates[from];
                    for (uint256 i = 0; i < userCerts.length; i++) {
                        if (userCerts[i] == tokenId) {
                            userCerts[i] = userCerts[userCerts.length - 1];
                            userCerts.pop();
                            break;
                        }
                    }
                }
                
                if (to != address(0)) {
                    // Add to new owner's list
                    _userCertificates[to].push(tokenId);
                }
            }
        }
      `;

      // For demonstration, we'll use a mock deployment
      // In production, you would compile and deploy this properly
      console.log('Contract source prepared for deployment');
      
      return '0x1234567890123456789012345678901234567890'; // Mock contract address
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw new Error('Failed to deploy certificate contract');
    }
  }

  async issueCertificateOnBlockchain(
    certificateId: string,
    userId: string,
    courseId: string
  ): Promise<BlockchainCertificate> {
    if (!this.wallet || !this.contract) {
      console.log('Blockchain not configured, skipping certificate minting');
      throw new Error('Blockchain service not configured. Please set BLOCKCHAIN_PRIVATE_KEY in environment variables.');
    }
    try {
      // Get certificate data
      const certificate = await this.certificateRepo.findOne({
        where: { id: certificateId },
        relations: ['user', 'course'],
      });

      if (!certificate) {
        throw new Error('Certificate not found');
      }

      const user = await this.userRepo.findOne({ where: { id: userId } });
      const course = await this.courseRepo.findOne({ where: { id: courseId } });

      if (!user || !course) {
        throw new Error('User or course not found');
      }

      // Prepare metadata
      const metadata: CertificateMetadata = {
        certificateId,
        userId,
        courseId,
        userName: user.name,
        courseName: course.title,
        completionDate: certificate.issuedAt?.toISOString() || new Date().toISOString(),
        issuerName: 'Chitepo Learning Platform',
        issuerSignature: await this.generateIssuerSignature(certificateId),
        skills: course.tags || [],
        duration: course.estimatedDuration,
      };

      // Upload metadata to IPFS (mock implementation)
      const metadataURI = await this.uploadToIPFS(metadata);

      // Get user's wallet address (for demo, we'll use a mock address)
      const userAddress = await this.getUserWalletAddress(userId);

      // Mint certificate NFT
      const tx = await this.contract.mintCertificate(userAddress, metadataURI);
      const receipt = await tx.wait();

      // Extract token ID from events
      const event = receipt?.logs?.find(log => log.topics[0] === 'CertificateMinted(address,uint256,string)');
      const tokenId = event?.args?.tokenId || BigInt(1);

      // Update certificate record
      await this.certificateRepo.update(certificateId, {
        txHash: tx.hash,
        ipfsHash: this.extractIPFSHash(metadataURI),
        verifiedAt: new Date(),
      });

      return {
        tokenId,
        owner: userAddress,
        metadataURI,
        issuedAt: BigInt(Math.floor(Date.now() / 1000)),
        verified: true,
      };
    } catch (error) {
      console.error('Certificate issuance failed:', error);
      throw new Error('Failed to issue certificate on blockchain');
    }
  }

  async verifyCertificateOnBlockchain(tokenId: string): Promise<boolean> {
    if (!this.contract) {
      console.log('Blockchain not configured, cannot verify certificate');
      return false;
    }
    try {
      const verified = await this.contract.verifyCertificate(BigInt(tokenId));
      return verified;
    } catch (error) {
      console.error('Certificate verification failed:', error);
      return false;
    }
  }

  async getCertificateOwner(tokenId: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain service not configured');
    }
    try {
      const owner = await this.contract.ownerOf(BigInt(tokenId));
      return owner;
    } catch (error) {
      console.error('Failed to get certificate owner:', error);
      throw new Error('Certificate not found');
    }
  }

  async getUserCertificates(userId: string): Promise<BlockchainCertificate[]> {
    if (!this.contract) {
      console.log('Blockchain not configured, returning empty certificates');
      return [];
    }
    try {
      const userAddress = await this.getUserWalletAddress(userId);
      const tokenIds = await this.contract.getUserCertificates(userAddress);
      
      const certificates: BlockchainCertificate[] = [];
      
      for (const tokenId of tokenIds) {
        const metadataURI = await this.contract.tokenURI(tokenId);
        const data = await this.contract.getCertificateData(tokenId);
        
        certificates.push({
          tokenId,
          owner: userAddress,
          metadataURI,
          issuedAt: data.issuedAt,
          verified: data.verified,
        });
      }
      
      return certificates;
    } catch (error) {
      console.error('Failed to get user certificates:', error);
      return [];
    }
  }

  async transferCertificate(
    fromUserId: string,
    toUserId: string,
    tokenId: string
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Blockchain service not configured');
    }
    try {
      const fromAddress = await this.getUserWalletAddress(fromUserId);
      const toAddress = await this.getUserWalletAddress(toUserId);

      const tx = await this.contract.transferFrom(fromAddress, toAddress, BigInt(tokenId));
      const receipt = await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Certificate transfer failed:', error);
      throw new Error('Failed to transfer certificate');
    }
  }

  private async uploadToIPFS(metadata: CertificateMetadata): Promise<string> {
    // Mock IPFS upload - in production, you would use IPFS SDK
    const mockIPFSHash = 'QmXxxYyyZzz123456789';
    return `https://ipfs.io/ipfs/${mockIPFSHash}`;
  }

  private extractIPFSHash(uri: string): string {
    const match = uri.match(/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  }

  private async generateIssuerSignature(certificateId: string): Promise<string> {
    // Generate a signature for the certificate
    const message = `Certificate ID: ${certificateId} issued by Chitepo`;
    const signature = await this.wallet.signMessage(message);
    return signature;
  }

  private async getUserWalletAddress(userId: string): Promise<string> {
    // In production, each user would have their own wallet
    // For demo, we'll generate a deterministic address based on user ID
    const privateKey = ethers.keccak256(ethers.toUtf8Bytes(userId));
    const tempWallet = new ethers.Wallet(privateKey);
    return tempWallet.address;
  }

  async getContractInfo(): Promise<any> {
    if (!this.contract) {
      return {
        address: null,
        totalSupply: '0',
        configured: false
      };
    }
    try {
      const totalSupply = await this.contract.totalSupply();
      return {
        address: this.contractAddress,
        totalSupply: totalSupply.toString(),
        network: 'Polygon',
      };
    } catch (error) {
      console.error('Failed to get contract info:', error);
      throw new Error('Failed to get contract information');
    }
  }

  async validateCertificateSignature(
    certificateId: string,
    signature: string
  ): Promise<boolean> {
    if (!this.wallet) {
      console.log('Blockchain not configured, cannot validate signature');
      return false;
    }
    try {
      const message = `Certificate ID: ${certificateId} issued by Chitepo`;
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Check if the signature matches our issuer wallet
      return recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase();
    } catch (error) {
      console.error('Signature validation failed:', error);
      return false;
    }
  }
}
