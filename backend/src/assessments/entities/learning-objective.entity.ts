import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Question } from './question.entity';
import { QuestionBankItem } from './question-bank-item.entity';

@Entity('learning_objectives')
@Index('IDX_learning_objectives_course', ['courseId'])
export class LearningObjective {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @Column({ nullable: true })
  code: string | null;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @OneToMany(() => Question, (question) => question.objective)
  questions: Question[];

  @OneToMany(() => QuestionBankItem, (item) => item.objective)
  bankItems: QuestionBankItem[];
}
