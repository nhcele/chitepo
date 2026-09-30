import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSeedUserNamesAndEmails20260924002000 implements MigrationInterface {
  name = 'UpdateSeedUserNamesAndEmails20260924002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET email = REPLACE(email, '@mindelta.com', '@chitepo.co.zw')
      WHERE email LIKE '%@mindelta.com'
    `);

    await queryRunner.query(`
      UPDATE users
      SET email = REPLACE(email, '@chitepo.edu.zw', '@chitepo.co.zw')
      WHERE email LIKE '%@chitepo.edu.zw'
    `);

    await queryRunner.query(`
      UPDATE users
      SET email = 'herbert.chitepo@chitepo.co.zw'
      WHERE email = 'ideology.instructor@chitepo.edu'
    `);

    await queryRunner.query(`
      UPDATE users
      SET first_name = CASE id
        WHEN 'admin-001' THEN 'Farai'
        WHEN 'learner-001' THEN 'Tariro'
        WHEN 'learner-002' THEN 'Kudakwashe'
        WHEN 'learner-003' THEN 'Rufaro'
        WHEN 'learner-004' THEN 'Blessing'
        WHEN 'learner-005' THEN 'Chipo'
        WHEN 'learner-006' THEN 'Tawanda'
        WHEN 'learner-007' THEN 'Eric'
        ELSE first_name
      END,
      last_name = CASE id
        WHEN 'admin-001' THEN 'Mushonga'
        WHEN 'learner-001' THEN 'Moyo'
        WHEN 'learner-002' THEN 'Ndlovu'
        WHEN 'learner-003' THEN 'Chigwedere'
        WHEN 'learner-004' THEN 'Sibanda'
        WHEN 'learner-005' THEN 'Mutasa'
        WHEN 'learner-006' THEN 'Nyathi'
        WHEN 'learner-007' THEN 'Zinyengere'
        ELSE last_name
      END
      WHERE id IN (
        'admin-001',
        'learner-001',
        'learner-002',
        'learner-003',
        'learner-004',
        'learner-005',
        'learner-006',
        'learner-007'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET email = REPLACE(email, '@chitepo.co.zw', '@mindelta.com')
      WHERE email IN (
        'learner1@chitepo.co.zw',
        'learner2@chitepo.co.zw',
        'learner3@chitepo.co.zw',
        'learner4@chitepo.co.zw',
        'learner5@chitepo.co.zw',
        'learner6@chitepo.co.zw',
        'learner7@chitepo.co.zw'
      )
    `);
  }
}
