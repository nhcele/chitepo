import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[name="email"]', 'simbarashe.mumbengegwi@chitepo.co.zw');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should navigate to registration page', async ({ page }) => {
    // Click on register link
    await page.click('a[href="/auth/register"]');
    
    // Should be on registration page
    await expect(page).toHaveURL('/auth/register');
    await expect(page.locator('h1')).toContainText('Create Account');
  });

  test('should register new user successfully', async ({ page }) => {
    // Navigate to registration page
    await page.click('a[href="/auth/register"]');
    
    // Fill registration form
    const randomEmail = `test${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', randomEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or onboarding
    await expect(page.locator('h1')).toContainText(/Dashboard|Welcome/);
  });

  test('should show error for existing email during registration', async ({ page }) => {
    // Navigate to registration page
    await page.click('a[href="/auth/register"]');
    
    // Try to register with existing email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'simbarashe.mumbengegwi@chitepo.co.zw');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=User already exists')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'simbarashe.mumbengegwi@chitepo.co.zw');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout button
    await page.click('button[aria-label="Logout"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });

  test('should show password reset option', async ({ page }) => {
    // Click on forgot password link
    await page.click('a[href="/auth/forgot-password"]');
    
    // Should be on password reset page
    await expect(page).toHaveURL('/auth/forgot-password');
    await expect(page.locator('h1')).toContainText('Reset Password');
    
    // Fill email and submit
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });
});
