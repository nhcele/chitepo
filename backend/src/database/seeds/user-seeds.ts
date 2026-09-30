import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '@mindelta/shared';

export async function seedUsers(dataSource: DataSource) {
  console.log('[seeds] Seeding users...');
  
  const userRepository = dataSource.getRepository(User);
  
  // Clear existing users (using DELETE instead of TRUNCATE for foreign key compatibility)
  await dataSource.query('DELETE FROM users');
  
  // Password hashes:
  // Admin@123: $2a$10$kl4dVFjrOJH/gEdZjM46g.7QeyO/ToW4QmrlGuuO7K4GkwWmAfx1a
  // Instructor@123: $2a$10$IcLjFtuA15sLl0ngQzgGFOEL8Y2Fngu.XlD8fW8ze4XsICVYK8cYO
  // Learner@123: $2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u

  const users = [
    // Admin user
    {
      id: 'admin-001',
      email: 'admin@chitepo.co.zw',
      firstName: 'Farai',
      lastName: 'Mushonga',
      password: '$2a$10$kl4dVFjrOJH/gEdZjM46g.7QeyO/ToW4QmrlGuuO7K4GkwWmAfx1a', // Admin@123
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      bio: 'Platform Administrator with full system access',
    },
    // Chitepo Instructor users
    {
      id: 'instructor-001',
      email: 'simbarashe.mumbengegwi@chitepo.co.zw',
      firstName: 'Simbarashe',
      lastName: 'Mumbengegwi',
      password: '$2a$10$IcLjFtuA15sLl0ngQzgGFOEL8Y2Fngu.XlD8fW8ze4XsICVYK8cYO', // Instructor@123
      role: UserRole.INSTRUCTOR,
      isActive: true,
      emailVerified: true,
      bio: 'Leading expert on Zimbabwe\'s liberation struggle and political ideology. Former political commissar with extensive experience in grassroots mobilization and ideological education. Dedicated to preserving revolutionary values and training the next generation of political leaders.',
    },
    {
      id: 'instructor-002',
      email: 'tafadzwa.mupfumira@chitepo.co.zw',
      firstName: 'Tafadzwa',
      lastName: 'Mupfumira',
      password: '$2a$10$IcLjFtuA15sLl0ngQzgGFOEL8Y2Fngu.XlD8fW8ze4XsICVYK8cYO', // Instructor@123
      role: UserRole.INSTRUCTOR,
      isActive: true,
      emailVerified: true,
      bio: 'Former mayor and municipal director with 20+ years experience in local government administration. Specialized in devolution, service delivery, and urban development. Has trained hundreds of councillors and municipal officials across Zimbabwe.',
    },
    {
      id: 'instructor-003',
      email: 'kudzai.nhema@chitepo.co.zw',
      firstName: 'Kudzai',
      lastName: 'Nhema',
      password: '$2a$10$IcLjFtuA15sLl0ngQzgGFOEL8Y2Fngu.XlD8fW8ze4XsICVYK8cYO', // Instructor@123
      role: UserRole.INSTRUCTOR,
      isActive: true,
      emailVerified: true,
      bio: 'Veteran political organizer with expertise in District Coordinating Committee operations, voter mobilization, and party-government coordination. Has successfully led electoral campaigns achieving record voter registration numbers.',
    },
    {
      id: 'instructor-004',
      email: 'rumbidzai.chikwanha@chitepo.co.zw',
      firstName: 'Rumbidzai',
      lastName: 'Chikwanha',
      password: '$2a$10$IcLjFtuA15sLl0ngQzgGFOEL8Y2Fngu.XlD8fW8ze4XsICVYK8cYO', // Instructor@123
      role: UserRole.INSTRUCTOR,
      isActive: true,
      emailVerified: true,
      bio: 'Agricultural economist and rural development expert. Former director at Ministry of Lands, Agriculture and Rural Development. Passionate about transforming rural areas through sustainable agriculture, infrastructure development, and community empowerment.',
    },
    {
      id: 'instructor-005',
      email: 'tendai.moyo@chitepo.co.zw',
      firstName: 'Tendai',
      lastName: 'Moyo',
      password: '$2a$10$IcLjFtuA15sLl0ngQzgGFOEL8Y2Fngu.XlD8fW8ze4XsICVYK8cYO', // Instructor@123
      role: UserRole.INSTRUCTOR,
      isActive: true,
      emailVerified: true,
      bio: 'Economic policy advisor and development strategist. Key architect of Vision 2030 implementation framework. Expert in translating national development goals into actionable provincial and district-level programs.',
    },
    {
      id: 'instructor-006',
      email: 'nyasha.mutasa@chitepo.co.zw',
      firstName: 'Nyasha',
      lastName: 'Mutasa',
      password: '$2a$10$IcLjFtuA15sLl0ngQzgGFOEL8Y2Fngu.XlD8fW8ze4XsICVYK8cYO', // Instructor@123
      role: UserRole.INSTRUCTOR,
      isActive: true,
      emailVerified: true,
      bio: 'Former diaspora coordinator with experience organizing Zimbabweans in UK, USA, and South Africa. Expert in virtual political engagement, heritage preservation, and diaspora investment mobilization. Passionate about maintaining homeland connections.',
    },
    // Learner users
    {
      id: 'learner-001',
      email: 'learner1@chitepo.co.zw',
      firstName: 'Tariro',
      lastName: 'Moyo',
      password: '$2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u', // Learner@123
      role: UserRole.LEARNER,
      isActive: true,
      emailVerified: true,
      bio: 'Political researcher and community organizer',
    },
    {
      id: 'learner-002',
      email: 'learner2@chitepo.co.zw',
      firstName: 'Kudakwashe',
      lastName: 'Ndlovu',
      password: '$2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u', // Learner@123
      role: UserRole.LEARNER,
      isActive: true,
      emailVerified: true,
      bio: 'Student of African political history',
    },
    {
      id: 'learner-003',
      email: 'learner3@chitepo.co.zw',
      firstName: 'Rufaro',
      lastName: 'Chigwedere',
      password: '$2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u', // Learner@123
      role: UserRole.LEARNER,
      isActive: true,
      emailVerified: true,
      bio: 'Software developer interested in career growth',
    },
    {
      id: 'learner-004',
      email: 'learner4@chitepo.co.zw',
      firstName: 'Blessing',
      lastName: 'Sibanda',
      password: '$2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u', // Learner@123
      role: UserRole.LEARNER,
      isActive: true,
      emailVerified: true,
      bio: 'Data Analyst learning new technologies',
    },
    {
      id: 'learner-005',
      email: 'learner5@chitepo.co.zw',
      firstName: 'Chipo',
      lastName: 'Mutasa',
      password: '$2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u', // Learner@123
      role: UserRole.LEARNER,
      isActive: true,
      emailVerified: true,
      bio: 'Activist interested in Pan-Africanism',
    },
    {
      id: 'learner-006',
      email: 'learner6@chitepo.co.zw',
      firstName: 'Tawanda',
      lastName: 'Nyathi',
      password: '$2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u', // Learner@123
      role: UserRole.LEARNER,
      isActive: true,
      emailVerified: true,
      bio: 'IT Manager exploring cloud technologies',
    },
    {
      id: 'learner-007',
      email: 'learner7@chitepo.co.zw',
      firstName: 'Eric',
      lastName: 'Zinyengere',
      password: '$2a$10$5v9FERC55m/bkuPqZb5bMeiyITLkMeDyk5ISdZuy6WqbPVgJ2SM1u', // Learner@123
      role: UserRole.LEARNER,
      isActive: true,
      emailVerified: true,
      bio: 'Marketing professional learning digital skills',
    },
  ];

  const createdUsers = await userRepository.save(users);
  console.log(`[seeds] Created ${createdUsers.length} users`);
  
  return createdUsers;
}
