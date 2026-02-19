import { test, expect } from '@playwright/test';

test.describe('AI Companion E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'learner@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should access AI companion from course player', async ({ page }) => {
    // Navigate to enrolled course
    await page.goto('/dashboard');
    await page.click('.enrolled-course-card:first-child a');
    
    // Click AI companion button
    await page.click('button[aria-label="AI Companion"]');
    
    // Should open AI companion panel
    await expect(page.locator('.ai-companion-panel')).toBeVisible();
    await expect(page.locator('h3')).toContainText('AI Learning Assistant');
  });

  test('should ask AI companion questions about course content', async ({ page }) => {
    // Navigate to course player
    await page.goto('/dashboard');
    await page.click('.enrolled-course-card:first-child a');
    
    // Open AI companion
    await page.click('button[aria-label="AI Companion"]');
    
    // Type a question
    await page.fill('textarea[placeholder="Ask me anything about this course..."]', 'Can you explain the key concepts in this lesson?');
    await page.click('button:has-text("Send")');
    
    // Should show AI response
    await expect(page.locator('.ai-message')).toContainText('Here are the key concepts');
    await expect(page.locator('.ai-message')).toBeVisible();
  });

  test('should get personalized learning recommendations', async ({ page }) => {
    // Navigate to AI companion page
    await page.goto('/ai-companion');
    
    // Click on recommendations tab
    await page.click('button:has-text("Recommendations")');
    
    // Should show personalized recommendations
    await expect(page.locator('.recommendation-card')).toHaveCount.greaterThan(0);
    await expect(page.locator('text=Recommended for you')).toBeVisible();
  });

  test('should generate study plan', async ({ page }) => {
    // Navigate to AI companion page
    await page.goto('/ai-companion');
    
    // Click on study plan tab
    await page.click('button:has-text("Study Plan")');
    
    // Click generate study plan button
    await page.click('button:has-text("Generate Study Plan")');
    
    // Should show generated study plan
    await expect(page.locator('.study-plan')).toBeVisible();
    await expect(page.locator('text=Your Personalized Study Plan')).toBeVisible();
  });

  test('should access micro-pacing features', async ({ page }) => {
    // Navigate to course player
    await page.goto('/dashboard');
    await page.click('.enrolled-course-card:first-child a');
    
    // Check if micro-pacing indicator is visible
    await expect(page.locator('.micro-pacing-indicator')).toBeVisible();
    
    // Click on micro-pacing settings
    await page.click('button[aria-label="Micro-pacing settings"]');
    
    // Should show micro-pacing options
    await expect(page.locator('.micro-pacing-modal')).toBeVisible();
    await expect(page.locator('text=Learning Pace')).toBeVisible();
  });

  test('should adjust learning pace', async ({ page }) => {
    // Navigate to course player
    await page.goto('/dashboard');
    await page.click('.enrolled-course-card:first-child a');
    
    // Open micro-pacing settings
    await page.click('button[aria-label="Micro-pacing settings"]');
    
    // Select different pace
    await page.selectOption('select[name="learningPace"]', 'fast');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Should show confirmation
    await expect(page.locator('text=Learning pace updated')).toBeVisible();
  });

  test('should get content suggestions', async ({ page }) => {
    // Navigate to AI companion page
    await page.goto('/ai-companion');
    
    // Click on content suggestions tab
    await page.click('button:has-text("Content Suggestions")');
    
    // Should show suggested content
    await expect(page.locator('.content-suggestion-card')).toHaveCount.greaterThan(0);
    await expect(page.locator('text=Suggested Content')).toBeVisible();
  });

  test('should use AI chat for general questions', async ({ page }) => {
    // Navigate to AI companion page
    await page.goto('/ai-companion');
    
    // Type a general question
    await page.fill('textarea[placeholder="Ask me anything..."]', 'What are the best practices for learning new skills?');
    await page.click('button:has-text("Send")');
    
    // Should show AI response
    await expect(page.locator('.ai-message')).toContainText('Here are some best practices');
    await expect(page.locator('.ai-message')).toBeVisible();
  });

  test('should export conversation history', async ({ page }) => {
    // Navigate to AI companion page
    await page.goto('/ai-companion');
    
    // Have a conversation
    await page.fill('textarea[placeholder="Ask me anything..."]', 'Tell me about Pan-Africanism');
    await page.click('button:has-text("Send")');
    
    // Wait for response
    await expect(page.locator('.ai-message')).toBeVisible();
    
    // Click export button
    await page.click('button:has-text("Export Conversation")');
    
    // Should trigger download (we can't test actual download in E2E, but we can check the button works)
    await expect(page.locator('text=Conversation exported')).toBeVisible();
  });

  test('should clear conversation history', async ({ page }) => {
    // Navigate to AI companion page
    await page.goto('/ai-companion');
    
    // Have a conversation
    await page.fill('textarea[placeholder="Ask me anything..."]', 'Test message');
    await page.click('button:has-text("Send")');
    
    // Wait for response
    await expect(page.locator('.ai-message')).toBeVisible();
    
    // Click clear button
    await page.click('button:has-text("Clear Conversation")');
    
    // Should show confirmation and clear messages
    await expect(page.locator('text=Conversation cleared')).toBeVisible();
    await expect(page.locator('.ai-message')).toHaveCount(0);
  });
});

test.describe('AI Content Generation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as instructor
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'instructor@mindelta.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should access AI content generation tools', async ({ page }) => {
    // Navigate to instructor dashboard
    await page.goto('/instructor/dashboard');
    
    // Click on AI tools
    await page.click('a[href="/instructor/ai-tools"]');
    
    // Should show AI content generation options
    await expect(page.locator('h1')).toContainText('AI Content Generation');
    await expect(page.locator('button:has-text("Generate Course Outline")')).toBeVisible();
  });

  test('should generate course outline', async ({ page }) => {
    // Navigate to AI tools
    await page.goto('/instructor/ai-tools');
    
    // Click generate course outline
    await page.click('button:has-text("Generate Course Outline")');
    
    // Fill form
    await page.fill('input[name="title"]', 'Advanced Political Theory');
    await page.fill('textarea[name="description"]', 'Comprehensive course on political philosophy and theory');
    await page.selectOption('select[name="difficulty"]', 'advanced');
    await page.fill('input[name="duration"]', '480');
    
    // Generate
    await page.click('button:has-text("Generate Outline")');
    
    // Should show generated outline
    await expect(page.locator('.generated-outline')).toBeVisible();
    await expect(page.locator('text=Course outline generated')).toBeVisible();
  });

  test('should generate lesson content', async ({ page }) => {
    // Navigate to AI tools
    await page.goto('/instructor/ai-tools');
    
    // Click generate lesson content
    await page.click('button:has-text("Generate Lesson Content")');
    
    // Fill form
    await page.fill('input[name="title"]', 'Introduction to Revolutionary Theory');
    await page.fill('textarea[name="topic"]', 'Historical Materialism and Social Change');
    await page.selectOption('select[name="type"]', 'video');
    await page.fill('input[name="duration"]', '900');
    
    // Generate
    await page.click('button:has-text("Generate Content")');
    
    // Should show generated content
    await expect(page.locator('.generated-content')).toBeVisible();
    await expect(page.locator('text=Lesson content generated')).toBeVisible();
  });

  test('should generate quiz questions', async ({ page }) => {
    // Navigate to AI tools
    await page.goto('/instructor/ai-tools');
    
    // Click generate quiz
    await page.click('button:has-text("Generate Quiz")');
    
    // Fill form
    await page.fill('textarea[name="topic"]', 'Pan-African movements');
    await page.fill('input[name="questionCount"]', '5');
    await page.selectOption('select[name="difficulty"]', 'medium');
    
    // Generate
    await page.click('button:has-text("Generate Quiz")');
    
    // Should show generated quiz
    await expect(page.locator('.generated-quiz')).toBeVisible();
    await expect(page.locator('.quiz-question')).toHaveCount(5);
  });

  test('should improve existing content', async ({ page }) => {
    // Navigate to AI tools
    await page.goto('/instructor/ai-tools');
    
    // Click improve content
    await page.click('button:has-text("Improve Content")');
    
    // Fill form with existing content
    await page.fill('textarea[name="content"]', 'This is basic content about Pan-Africanism.');
    await page.selectOption('select[name="improvementType"]', 'expand');
    
    // Improve
    await page.click('button:has-text("Improve Content")');
    
    // Should show improved content
    await expect(page.locator('.improved-content')).toBeVisible();
    await expect(page.locator('text=Content improved')).toBeVisible();
  });
});
