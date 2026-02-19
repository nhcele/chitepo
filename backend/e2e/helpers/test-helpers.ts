import { Page, BrowserContext } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page, private context?: BrowserContext) {}

  /**
   * Login with specific credentials
   */
  async login(email: string, password: string) {
    await this.page.goto('/auth/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click('button[aria-label="Logout"]');
    await this.page.waitForURL('/auth/login');
  }

  /**
   * Register a new user with random email
   */
  async registerUser(userData: {
    name: string;
    email?: string;
    password: string;
  }) {
    const email = userData.email || `test${Date.now()}@example.com`;
    
    await this.page.goto('/auth/register');
    await this.page.fill('input[name="name"]', userData.name);
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', userData.password);
    await this.page.fill('input[name="confirmPassword"]', userData.password);
    await this.page.click('button[type="submit"]');
    
    return email;
  }

  /**
   * Navigate to course player for first enrolled course
   */
  async goToFirstCourse() {
    await this.page.goto('/dashboard');
    await this.page.click('.enrolled-course-card:first-child a');
    await this.page.waitForSelector('.course-player');
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string) {
    return this.page.waitForResponse(response => 
      response.url().includes(urlPattern)
    );
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Check if element is visible and contains text
   */
  async expectVisibleWithText(selector: string, text: string) {
    await this.page.waitForSelector(selector);
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await expect(element).toContainText(text);
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`, value);
    }
  }

  /**
   * Create test course for instructor
   */
  async createTestCourse(courseData: {
    title: string;
    description: string;
    difficulty: string;
    price: string;
    estimatedDuration: string;
  }) {
    await this.page.goto('/instructor/dashboard');
    await this.page.click('button:has-text("Create New Course")');
    
    await this.fillForm(courseData);
    await this.page.click('button:has-text("Create Course")');
    
    await this.page.waitForSelector('.course-editor');
    return this.page.url();
  }

  /**
   * Add module to current course
   */
  async addModuleToCourse(moduleData: {
    title: string;
    description: string;
  }) {
    await this.page.click('button:has-text("Add Module")');
    await this.fillForm(moduleData);
    await this.page.click('button:has-text("Add Module")');
    
    await this.page.waitForSelector('.module-item');
  }

  /**
   * Add lesson to current module
   */
  async addLessonToModule(lessonData: {
    title: string;
    type: string;
    duration: string;
  }) {
    await this.page.click('.module-item:first-child button:has-text("Add Lesson")');
    await this.fillForm(lessonData);
    await this.page.click('button:has-text("Add Lesson")');
    
    await this.page.waitForSelector('.lesson-item');
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoading() {
    await this.page.waitForSelector('.loading-spinner', { state: 'detached' });
  }

  /**
   * Check for toast notification
   */
  async expectToast(message: string) {
    await this.page.waitForSelector('.toast-notification');
    await expect(this.page.locator('.toast-notification')).toContainText(message);
  }

  /**
   * Get current user info from localStorage
   */
  async getCurrentUser() {
    return await this.page.evaluate(() => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    });
  }

  /**
   * Set authentication token in localStorage
   */
  async setAuthToken(token: string) {
    await this.page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, token);
  }

  /**
   * Clear browser storage
   */
  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Mock API responses
   */
  async mockApiResponse(url: string, response: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Check accessibility of current page
   */
  async checkAccessibility() {
    // This would integrate with axe-core or similar accessibility testing tool
    // For now, just check for basic accessibility attributes
    const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
    const buttonsWithoutAriaLabel = await this.page.locator('button:not([aria-label]):not([aria-labelledby])').count();
    
    console.log(`Images without alt: ${imagesWithoutAlt}`);
    console.log(`Buttons without aria-label: ${buttonsWithoutAriaLabel}`);
    
    return {
      imagesWithoutAlt,
      buttonsWithoutAriaLabel
    };
  }

  /**
   * Generate random test data
   */
  static generateTestData() {
    const timestamp = Date.now();
    return {
      email: `test${timestamp}@example.com`,
      name: `Test User ${timestamp}`,
      courseTitle: `Test Course ${timestamp}`,
      password: 'password123'
    };
  }
}
