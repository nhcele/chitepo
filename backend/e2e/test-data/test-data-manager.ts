export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'learner' | 'instructor' | 'admin';
}

export interface TestCourse {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  estimatedDuration: number;
  status: 'draft' | 'published' | 'archived';
  instructorId: string;
}

export class TestDataManager {
  private static users: TestUser[] = [
    {
      id: 'test-instructor-1',
      email: 'instructor@mindelta.com',
      name: 'Test Instructor',
      password: 'password123',
      role: 'instructor'
    },
    {
      id: 'test-learner-1',
      email: 'learner@mindelta.com',
      name: 'Test Learner',
      password: 'password123',
      role: 'learner'
    },
    {
      id: 'test-admin-1',
      email: 'admin@mindelta.com',
      name: 'Test Admin',
      password: 'password123',
      role: 'admin'
    }
  ];

  private static courses: TestCourse[] = [
    {
      id: 'test-course-1',
      title: 'Pan-Africanism and African Unity',
      description: 'Learn the fundamentals of Pan-African movements and continental unity',
      difficulty: 'beginner',
      price: 0,
      estimatedDuration: 420,
      status: 'published',
      instructorId: 'test-instructor-1'
    },
    {
      id: 'test-course-2',
      title: 'Revolutionary Theory and Practice',
      description: 'Advanced study of revolutionary theory and historical materialism',
      difficulty: 'advanced',
      price: 0,
      estimatedDuration: 480,
      status: 'published',
      instructorId: 'test-instructor-1'
    }
  ];

  static getTestUser(role: 'learner' | 'instructor' | 'admin'): TestUser {
    const user = this.users.find(u => u.role === role);
    if (!user) {
      throw new Error(`No test user found for role: ${role}`);
    }
    return user;
  }

  static getAllTestUsers(): TestUser[] {
    return [...this.users];
  }

  static getTestCourses(): TestCourse[] {
    return [...this.courses];
  }

  static getTestCourse(id: string): TestCourse {
    const course = this.courses.find(c => c.id === id);
    if (!course) {
      throw new Error(`No test course found with id: ${id}`);
    }
    return course;
  }

  static generateRandomUser(role: 'learner' | 'instructor' = 'learner'): TestUser {
    const timestamp = Date.now();
    return {
      id: `test-${role}-${timestamp}`,
      email: `test-${role}-${timestamp}@example.com`,
      name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${timestamp}`,
      password: 'password123',
      role
    };
  }

  static generateRandomCourse(instructorId: string): TestCourse {
    const timestamp = Date.now();
    return {
      id: `test-course-${timestamp}`,
      title: `Test Course ${timestamp}`,
      description: `This is a test course created at ${new Date().toISOString()}`,
      difficulty: 'beginner',
      price: 99.99,
      estimatedDuration: 120,
      status: 'draft',
      instructorId
    };
  }

  static getValidCredentials() {
    return {
      email: 'instructor@mindelta.com',
      password: 'password123'
    };
  }

  static getInvalidCredentials() {
    return {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    };
  }
}
