import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('me/notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findMyNotes(
    @Req() req: any,
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.notesService.findForUser(userId, { courseId, lessonId });
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateNoteDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.notesService.create(userId, dto);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') noteId: string, @Body() dto: UpdateNoteDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return this.notesService.update(userId, noteId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') noteId: string) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }
    await this.notesService.remove(userId, noteId);
    return { deleted: true };
  }
}
