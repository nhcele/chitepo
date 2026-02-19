import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('scorm_packages')
export class ScormPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id', type: 'varchar', length: 36, nullable: true })
  courseId: string | null;

  @Column({ name: 'version', type: 'varchar', length: 20, default: 'scorm_1_2' })
  version: string;

  @Column({ name: 'entry_point', type: 'varchar', length: 500 })
  entryPoint: string;

  @Column({ name: 'root_path', type: 'varchar', length: 500 })
  rootPath: string;

  @Column({ name: 'manifest_json', type: 'json', nullable: true })
  manifestJson: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
