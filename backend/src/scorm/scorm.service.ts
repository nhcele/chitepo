import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as unzipper from 'unzipper';
import { XMLParser } from 'fast-xml-parser';
import { ScormPackage } from './entities/scorm-package.entity';

@Injectable()
export class ScormService {
  constructor(
    @InjectRepository(ScormPackage)
    private readonly scormPackageRepo: Repository<ScormPackage>,
    private readonly configService: ConfigService,
  ) {}

  async importPackage(params: { file: Express.Multer.File; courseId?: string; version?: string }) {
    const { file, courseId, version } = params;
    if (!file) throw new HttpException('Missing file', HttpStatus.BAD_REQUEST);

    const packageId = uuidv4();
    const rootPath = path.join(process.cwd(), 'uploads', 'scorm', packageId);

    await fs.mkdir(rootPath, { recursive: true });

    try {
      const directory = await unzipper.Open.buffer(file.buffer);
      await Promise.all(
        directory.files
          .filter((f) => !f.path.endsWith('/') && f.type === 'File')
          .map(async (entry) => {
            const outPath = path.join(rootPath, entry.path);
            await fs.mkdir(path.dirname(outPath), { recursive: true });
            const content = await entry.buffer();
            await fs.writeFile(outPath, content);
          }),
      );
    } catch (e: any) {
      throw new HttpException(`Unable to unzip SCORM package: ${e?.message || e}` , HttpStatus.BAD_REQUEST);
    }

    const manifestPath = path.join(rootPath, 'imsmanifest.xml');
    let manifestXml: string;
    try {
      manifestXml = await fs.readFile(manifestPath, 'utf-8');
    } catch {
      throw new HttpException('SCORM package missing imsmanifest.xml', HttpStatus.BAD_REQUEST);
    }

    const parser = new XMLParser({ ignoreAttributes: false });
    const manifest = parser.parse(manifestXml);

    const entryPoint = this.findLaunchHref(manifest);
    if (!entryPoint) {
      throw new HttpException('Unable to determine SCORM launch file from manifest', HttpStatus.BAD_REQUEST);
    }

    const saved = await this.scormPackageRepo.save(
      this.scormPackageRepo.create({
        id: packageId,
        courseId: courseId ?? null,
        version: version ?? 'scorm_1_2',
        entryPoint,
        rootPath: path.join('uploads', 'scorm', packageId),
        manifestJson: manifest,
      }),
    );

    const baseUrl = (this.configService.get('API_URL') as string) || 'http://localhost:3001';
    const launchUrl = `${baseUrl}/uploads/scorm/${saved.id}/${saved.entryPoint}`;

    return {
      id: saved.id,
      courseId: saved.courseId,
      version: saved.version,
      entryPoint: saved.entryPoint,
      launchUrl,
      createdAt: saved.createdAt,
    };
  }

  async getPackage(id: string) {
    const pkg = await this.scormPackageRepo.findOne({ where: { id } });
    if (!pkg) throw new HttpException('SCORM package not found', HttpStatus.NOT_FOUND);

    const baseUrl = (this.configService.get('API_URL') as string) || 'http://localhost:3001';
    const launchUrl = `${baseUrl}/uploads/scorm/${pkg.id}/${pkg.entryPoint}`;

    return {
      id: pkg.id,
      courseId: pkg.courseId,
      version: pkg.version,
      entryPoint: pkg.entryPoint,
      launchUrl,
      createdAt: pkg.createdAt,
    };
  }

  private findLaunchHref(manifest: any): string | null {
    const resources = manifest?.manifest?.resources?.resource;
    if (!resources) return null;

    const arr = Array.isArray(resources) ? resources : [resources];

    // Prefer a resource referenced by the first organization item (if present)
    const item = manifest?.manifest?.organizations?.organization?.item;
    const identifierRef = item?.['@_identifierref'] || item?.identifierref;
    if (identifierRef) {
      const match = arr.find((r: any) => r?.['@_identifier'] === identifierRef || r?.identifier === identifierRef);
      const href = match?.['@_href'] || match?.href;
      if (href) return String(href);
    }

    // Fallback: first resource with an href
    for (const r of arr) {
      const href = r?.['@_href'] || r?.href;
      if (href) return String(href);
    }

    return null;
  }
}

