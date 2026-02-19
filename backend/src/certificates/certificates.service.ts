import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { CreateCertificateDto } from '@mindelta/shared';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
let ethers: any;
try {
  // Lazy import so service still runs if ethers isn't installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ethers = require('ethers');
} catch (_) {
  ethers = null;
}

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificatesRepository: Repository<Certificate>,
  ) {}

  async create(createCertificateDto: CreateCertificateDto): Promise<Certificate> {
    const certificate = this.certificatesRepository.create({
      ...createCertificateDto,
      serial: this.generateSerial(),
      issuedAt: new Date(),
    });
    const saved = await this.certificatesRepository.save(certificate);

    // Compute content hash and optionally anchor to blockchain
    try {
      const contentHash = this.computeContentHash(saved);
      const txHash = await this.anchorToBlockchain(contentHash);
      if (txHash) {
        saved.blockchainTxHash = txHash;
        await this.certificatesRepository.save(saved);
      }
    } catch (err) {
      // Non-fatal; proceed without blockchain anchoring
      // eslint-disable-next-line no-console
      console.warn('Blockchain anchoring skipped:', (err as Error).message);
    }

    return saved;
  }

  async findAll(): Promise<Certificate[]> {
    return this.certificatesRepository.find({
      relations: ['user', 'course'],
    });
  }

  async findOne(id: string): Promise<Certificate> {
    return this.certificatesRepository.findOne({
      where: { id },
      relations: ['user', 'course'],
    });
  }

  async findByUser(userId: string): Promise<Certificate[]> {
    return this.certificatesRepository.find({
      where: { userId },
      relations: ['course'],
      order: { issuedAt: 'DESC' },
    });
  }

  async findByCourse(courseId: string): Promise<Certificate[]> {
    return this.certificatesRepository.find({
      where: { courseId },
      relations: ['user'],
      order: { issuedAt: 'DESC' },
    });
  }

  async verify(serial: string): Promise<Certificate | null> {
    return this.certificatesRepository.findOne({
      where: { serial },
      relations: ['user', 'course'],
    });
  }

  private generateSerial(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `MIND-${timestamp}-${random}`.toUpperCase();
  }

  private computeContentHash(cert: Certificate): string {
    const payload = {
      id: cert.id,
      userId: cert.userId,
      courseId: cert.courseId,
      serial: cert.serial,
      finalScore: cert.finalScore,
      issuedAt: cert.issuedAt,
      skillsTags: cert.skillsTags ?? [],
    };
    const json = JSON.stringify(payload);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  private async anchorToBlockchain(contentHashHex: string): Promise<string | null> {
    const rpcUrl = process.env.POLYGON_RPC_URL || process.env.ETH_RPC_URL;
    const privKey = process.env.WALLET_PRIVATE_KEY;
    const toAddress = process.env.CERT_CONTRACT_ADDRESS || process.env.WALLET_ADDRESS; // fallback self-tx
    if (!ethers || !rpcUrl || !privKey || !toAddress) return null;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privKey, provider);
    // Pack hash into data field; prepend 0x and ensure even length
    const data = '0x' + contentHashHex.replace(/^0x/, '');
    const tx = await wallet.sendTransaction({ to: toAddress, value: 0n, data });
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  }

  // Generate a simple PDF certificate. Returns a Uint8Array.
  async generatePdf(cert: Certificate): Promise<Uint8Array> {
    // Ensure relations are present for name/course
    const full = cert.user && cert.course ? cert : await this.certificatesRepository.findOne({
      where: { id: cert.id },
      relations: ['user', 'course'],
    });
    const userName = full?.user?.name || 'Learner';
    const courseTitle = full?.course?.title || 'Course';
    const issuedAt = full?.issuedAt ? new Date(full.issuedAt) : new Date();
    const serial = full?.serial || '';
    const txHash = full?.txHash || '';

    // Build verification URL (frontend preferred)
    const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${site}/verify?serial=${encodeURIComponent(serial)}`;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape (approx) in points
    const { width, height } = page.getSize();
    const margin = 40;
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Background border
    page.drawRectangle({
      x: margin / 2,
      y: margin / 2,
      width: width - margin,
      height: height - margin,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 2,
    });

    // Watermark
    const watermark = 'M I N D E L T A';
    page.drawText(watermark, {
      x: (width - titleFont.widthOfTextAtSize(watermark, 60)) / 2,
      y: (height - 60) / 2,
      size: 60,
      font: titleFont,
      color: rgb(0.9, 0.9, 0.95),
      rotate: { type: 'degrees', angle: -20 },
      opacity: 0.35,
    } as any);

    // Heading
    const heading = 'Certificate of Completion';
    page.drawText(heading, {
      x: (width - titleFont.widthOfTextAtSize(heading, 36)) / 2,
      y: height - 120,
      size: 36,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    const sub = 'This certifies that';
    page.drawText(sub, {
      x: (width - textFont.widthOfTextAtSize(sub, 14)) / 2,
      y: height - 170,
      size: 14,
      font: textFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Name
    page.drawText(userName, {
      x: (width - titleFont.widthOfTextAtSize(userName, 28)) / 2,
      y: height - 210,
      size: 28,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    const body = `has successfully completed the course`;
    page.drawText(body, {
      x: (width - textFont.widthOfTextAtSize(body, 14)) / 2,
      y: height - 245,
      size: 14,
      font: textFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Course title
    page.drawText(courseTitle, {
      x: (width - titleFont.widthOfTextAtSize(courseTitle, 22)) / 2,
      y: height - 275,
      size: 22,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Attempt to place logo at top center
    try {
      const candidates: string[] = [];
      if (process.env.CERT_LOGO_PATH) candidates.push(process.env.CERT_LOGO_PATH);
      const cwd = process.cwd();
      // Common locations in dev (ts) and prod (dist)
      candidates.push(
        path.join(cwd, 'src', 'assets', 'logo.png'),
        path.join(cwd, 'src', 'assets', 'logo.jpg'),
        path.join(cwd, 'assets', 'logo.png'),
        path.join(cwd, 'assets', 'logo.jpg'),
        path.join(cwd, 'dist', 'assets', 'logo.png'),
        path.join(cwd, 'dist', 'assets', 'logo.jpg'),
      );
      const logoPath = candidates.find((p) => fs.existsSync(p));
      if (logoPath) {
        const logoBytes = fs.readFileSync(logoPath);
        // sniff by header
        const isPng = logoBytes[0] === 0x89 && logoBytes[1] === 0x50 && logoBytes[2] === 0x4e && logoBytes[3] === 0x47;
        const isJpg = logoBytes[0] === 0xff && logoBytes[1] === 0xd8;
        let img: any;
        if (isPng) {
          img = await pdfDoc.embedPng(logoBytes);
        } else if (isJpg) {
          img = await pdfDoc.embedJpg(logoBytes);
        }
        if (img) {
          const imgWidth = 120;
          const imgHeight = (img.height / img.width) * imgWidth;
          // Top-left placement
          page.drawImage(img, {
            x: margin + 10,
            y: height - margin - imgHeight - 10,
            width: imgWidth,
            height: imgHeight,
          });
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('Certificate logo not found. Checked paths:', candidates);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to embed logo:', (e as Error).message);
    }

    // Footer info
    const dateStr = issuedAt.toISOString().slice(0, 10);
    const serialStr = `Serial: ${serial}`;
    page.drawText(`Issued: ${dateStr}`, {
      x: margin + 10,
      y: margin + 20,
      size: 12,
      font: textFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(serialStr, {
      x: width - margin - textFont.widthOfTextAtSize(serialStr, 12) - 10,
      y: margin + 20,
      size: 12,
      font: textFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Blockchain tx hash (if available)
    if (txHash) {
      const txLabel = `Tx: ${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`;
      page.drawText(txLabel, {
        x: margin + 10,
        y: margin + 5,
        size: 10,
        font: textFont,
        color: rgb(0.35, 0.35, 0.4),
      });
    }

    // QR code linking to verify URL
    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'M' });
      const qrBase64 = qrDataUrl.split(',')[1];
      const qrBytes = Buffer.from(qrBase64, 'base64');
      const qrPng = await pdfDoc.embedPng(qrBytes);
      const qrSize = 96;
      page.drawImage(qrPng, {
        x: width - margin - qrSize,
        y: margin + 10,
        width: qrSize,
        height: qrSize,
      });
      const verifyLabel = 'Verify: ' + verifyUrl;
      page.drawText(verifyLabel, {
        x: width - margin - Math.min(textFont.widthOfTextAtSize(verifyLabel, 9), 320),
        y: margin + 8 + qrSize,
        size: 9,
        font: textFont,
        color: rgb(0.25, 0.25, 0.3),
      });
    } catch (e) {
      // ignore QR failures
    }

    const bytes = await pdfDoc.save();
    return bytes;
  }
}
