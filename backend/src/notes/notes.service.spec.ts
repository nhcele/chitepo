import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';

const mockNoteRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('NotesService', () => {
  let service: NotesService;
  let repo: ReturnType<typeof mockNoteRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getRepositoryToken(Note), useValue: mockNoteRepo() },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    repo = module.get(getRepositoryToken(Note));
  });

  it('creates a note for the authenticated user', async () => {
    repo.create.mockImplementation((dto: any) => dto);
    repo.save.mockResolvedValue({ id: 'note-1', userId: 'user-1', content: 'hello' } as any);

    const result = await service.create('user-1', { content: 'hello', lessonId: 'lesson-1' });
    expect(result.id).toBe('note-1');
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', content: 'hello' }));
  });

  it('returns notes for the user with filters', async () => {
    repo.find.mockResolvedValue([{ id: 'note-1' }] as any);

    const result = await service.findForUser('user-1', { lessonId: 'lesson-1' });
    expect(result).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { userId: 'user-1', lessonId: 'lesson-1' },
      relations: ['lesson', 'course'],
      order: { updatedAt: 'DESC' },
    });
  });

  it('throws when updating another users note', async () => {
    repo.findOne.mockResolvedValue({ id: 'note-1', userId: 'user-2' } as any);

    await expect(service.update('user-1', 'note-1', { content: 'updated' })).rejects.toThrow();
  });

  it('updates own note', async () => {
    const note = { id: 'note-1', userId: 'user-1', content: 'old', save: jest.fn() } as any;
    repo.findOne.mockResolvedValue(note);
    repo.save.mockImplementation((value: any) => Promise.resolve(value));

    const result = await service.update('user-1', 'note-1', { content: 'updated' });
    expect(result.content).toBe('updated');
  });

  it('removes own note', async () => {
    const note = { id: 'note-1', userId: 'user-1' } as any;
    repo.findOne.mockResolvedValue(note);

    await service.remove('user-1', 'note-1');
    expect(repo.remove).toHaveBeenCalledWith(note);
  });
});
