import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    const note = this.noteRepo.create({
      userId,
      courseId: dto.courseId,
      lessonId: dto.lessonId,
      videoTimestampSeconds: dto.videoTimestampSeconds,
      title: dto.title,
      content: dto.content,
      tags: dto.tags,
    });
    return this.noteRepo.save(note);
  }

  async findForUser(
    userId: string,
    filters: { courseId?: string; lessonId?: string } = {},
  ): Promise<Note[]> {
    const where: any = { userId };
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.lessonId) where.lessonId = filters.lessonId;
    return this.noteRepo.find({
      where,
      relations: ['lesson', 'course'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneForUser(userId: string, noteId: string): Promise<Note> {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note || note.userId !== userId) {
      throw new HttpException('Note not found', HttpStatus.NOT_FOUND);
    }
    return note;
  }

  async update(userId: string, noteId: string, dto: UpdateNoteDto): Promise<Note> {
    const note = await this.findOneForUser(userId, noteId);
    if (dto.videoTimestampSeconds !== undefined) note.videoTimestampSeconds = dto.videoTimestampSeconds;
    if (dto.title !== undefined) note.title = dto.title;
    if (dto.content !== undefined) note.content = dto.content;
    if (dto.tags !== undefined) note.tags = dto.tags;
    return this.noteRepo.save(note);
  }

  async remove(userId: string, noteId: string): Promise<void> {
    const note = await this.findOneForUser(userId, noteId);
    await this.noteRepo.remove(note);
  }
}
