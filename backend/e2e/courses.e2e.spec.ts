import { test, expect } from '@playwright/test';

test.describe('Courses E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'simbarashe.mumbengegwi@chitepo.co.zw');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display courses list', async ({ page }) => {
    // Navigate to courses page
    await page.goto('/courses');
    
    // Check if courses are displayed
    await expect(page.locator('h1')).toContainText('Courses');
    await expect(page.locator('.course-card')).toHaveCount.greaterThan(0);
  });

  test('should search courses', async ({ page }) => {
    // Navigate to courses page
    await page.goto('/courses');
    
    // Use search functionality
    await page.fill('input[placeholder="Search courses..."]', 'Pan-Africanism');
    await page.click('button[aria-label="Search"]');
    
    // Should show filtered results
    await expect(page.locator('.course-card')).toHaveCount.greaterThan(0);
    await expect(page.locator('.course-card')).toContainText('Pan-Africanism');
  });

  test('should filter courses by difficulty', async ({ page }) => {
    // Navigate to courses page
    await page.goto('/courses');
    
    // Filter by difficulty
    await page.selectOption('select[name="difficulty"]', 'beginner');
    
    // Should show filtered results
    await expect(page.locator('.course-card')).toHaveCount.greaterThan(0);
  });

  test('should view course details', async ({ page }) => {
    // Navigate to courses page
    await page.goto('/courses');
    
    // Click on first course
    await page.click('.course-card:first-child a');
    
    // Should show course details
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.course-description')).toBeVisible();
    await expect(page.locator('.course-modules')).toBeVisible();
  });

  test('should enroll in a course', async ({ page }) => {
    // Navigate to courses page
    await page.goto('/courses');
    
    // Click on first course
    await page.click('.course-card:first-child a');
    
    // Click enroll button
    await page.click('button:has-text("Enroll Now")');
    
    // Should show enrollment confirmation
    await expect(page.locator('text=Successfully enrolled')).toBeVisible();
    await expect(page.locator('button:has-text("Start Learning")')).toBeVisible();
  });

  test('should access enrolled courses from dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Check enrolled courses section
    await expect(page.locator('h2:has-text("My Courses")')).toBeVisible();
    await expect(page.locator('.enrolled-course-card')).toHaveCount.greaterThan(0);
  });

  test('should navigate to course player', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Click on enrolled course
    await page.click('.enrolled-course-card:first-child a');
    
    // Should open course player
    await expect(page.locator('.course-player')).toBeVisible();
    await expect(page.locator('.lesson-content')).toBeVisible();
  });

  test('should complete lesson and mark progress', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Click on enrolled course
    await page.click('.enrolled-course-card:first-child a');
    
    // Mark lesson as complete
    await page.click('button:has-text("Mark as Complete")');
    
    // Should update progress
    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('text=Lesson completed')).toBeVisible();
  });

  test('should navigate between lessons', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Click on enrolled course
    await page.click('.enrolled-course-card:first-child a');
    
    // Click next lesson
    await page.click('button:has-text("Next Lesson")');
    
    // Should load next lesson
    await expect(page.locator('.lesson-content')).toBeVisible();
    await expect(page.locator('.lesson-title')).toBeVisible();
  });
});

test.describe('Instructor Course Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as instructor
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'simbarashe.mumbengegwi@chitepo.co.zw');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should access instructor dashboard', async ({ page }) => {
    // Navigate to instructor dashboard
    await page.goto('/instructor/dashboard');
    
    // Should show instructor-specific content
    await expect(page.locator('h1')).toContainText('Instructor Dashboard');
    await expect(page.locator('text=My Courses')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should create new course', async ({ page }) => {
    // Navigate to instructor dashboard
    await page.goto('/instructor/dashboard');
    
    // Click create course button
    await page.click('button:has-text("Create New Course")');
    
    // Fill course creation form
    await page.fill('input[name="title"]', 'Test E2E Course');
    await page.fill('textarea[name="description"]', 'This is a test course created via E2E testing');
    await page.selectOption('select[name="difficulty"]', 'beginner');
    await page.fill('input[name="price"]', '99.99');
    await page.fill('input[name="estimatedDuration"]', '120');
    
    // Submit form
    await page.click('button:has-text("Create Course")');
    
    // Should show success message and redirect to course editor
    await expect(page.locator('text=Course created successfully')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Course Editor');
  });

  test('should add module to course', async ({ page }) => {
    // Navigate to course editor
    await page.goto('/instructor/courses/test-course/edit');
    
    // Click add module button
    await page.click('button:has-text("Add Module")');
    
    // Fill module form
    await page.fill('input[name="title"]', 'Test Module');
    await page.fill('textarea[name="description"]', 'Test module description');
    
    // Submit form
    await page.click('button:has-text("Add Module")');
    
    // Should show module in course outline
    await expect(page.locator('.module-item')).toContainText('Test Module');
  });

  test('should add lesson to module', async ({ page }) => {
    // Navigate to course editor
    await page.goto('/instructor/courses/test-course/edit');
    
    // Click add lesson button for first module
    await page.click('.module-item:first-child button:has-text("Add Lesson")');
    
    // Fill lesson form
    await page.fill('input[name="title"]', 'Test Lesson');
    await page.selectOption('select[name="type"]', 'video');
    await page.fill('input[name="duration"]', '600');
    
    // Submit form
    await page.click('button:has-text("Add Lesson")');
    
    // Should show lesson in module
    await expect(page.locator('.lesson-item')).toContainText('Test Lesson');
  });

  test('should preview course', async ({ page }) => {
    // Navigate to course editor
    await page.goto('/instructor/courses/test-course/edit');
    
    // Click preview button
    await page.click('button:has-text("Preview Course")');
    
    // Should open course preview
    await expect(page.locator('.course-preview')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Test E2E Course');
  });

  test('should submit course for review', async ({ page }) => {
    // Navigate to course editor
    await page.goto('/instructor/courses/test-course/edit');
    
    // Click submit for review button
    await page.click('button:has-text("Submit for Review")');
    
    // Should show confirmation dialog
    await expect(page.locator('.modal')).toContainText('Submit Course for Review');
    
    // Confirm submission
    await page.click('button:has-text("Submit")');
    
    // Should show success message
    await expect(page.locator('text=Course submitted for review')).toBeVisible();
  });
});
