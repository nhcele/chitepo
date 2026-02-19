import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { FilesService } from './files.service';

@Processor('document-ocr')
export class DocumentOcrProcessor {
  constructor(private readonly filesService: FilesService) {}

  @Process('extract')
  async handleExtract(job: Job<{ docId: string }>) {
    if (!job.data?.docId) return;
    await this.filesService.processDocumentOcr(job.data.docId);
  }
}
