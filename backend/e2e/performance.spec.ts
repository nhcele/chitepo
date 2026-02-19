import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load login page within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {
            LCP: 0, // Largest Contentful Paint
            FID: 0, // First Input Delay
            CLS: 0, // Cumulative Layout Shift
          };
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.FID = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift') {
              vitals.CLS += entry.value;
            }
          });
          
          resolve(vitals);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve({ LCP: 0, FID: 0, CLS: 0 }), 5000);
      });
    });
    
    // Performance thresholds
    expect(metrics.LCP).toBeLessThan(2500); // LCP should be < 2.5s
    expect(metrics.FID).toBeLessThan(100);  // FID should be < 100ms
    expect(metrics.CLS).toBeLessThan(0.1);  // CLS should be < 0.1
  });

  test('should handle concurrent users', async ({ browser }) => {
    const concurrentUsers = 5;
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      const promise = (async () => {
        const startTime = Date.now();
        
        await page.goto('/auth/login');
        await page.fill('input[name="email"]', 'instructor@mindelta.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
        
        const loadTime = Date.now() - startTime;
        
        await context.close();
        return loadTime;
      })();
      
      promises.push(promise);
    }
    
    const loadTimes = await Promise.all(promises);
    
    // All users should be able to login within 5 seconds
    loadTimes.forEach(time => {
      expect(time).toBeLessThan(5000);
    });
    
    // Average load time should be reasonable
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    expect(avgLoadTime).toBeLessThan(3000);
  });

  test('should handle large course list efficiently', async ({ page }) => {
    await page.goto('/courses');
    
    const startTime = Date.now();
    
    // Wait for course list to load
    await page.waitForSelector('.course-card');
    
    const loadTime = Date.now() - startTime;
    
    // Course list should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
    
    // Check virtual scrolling or pagination is working
    const courseCards = await page.locator('.course-card').count();
    expect(courseCards).toBeGreaterThan(0);
    
    // Test search performance
    const searchStartTime = Date.now();
    await page.fill('input[placeholder="Search courses..."]', 'Pan-Africanism');
    await page.waitForTimeout(500); // Debounce time
    await page.waitForSelector('.course-card');
    const searchTime = Date.now() - searchStartTime;
    
    // Search should complete within 1 second
    expect(searchTime).toBeLessThan(1000);
  });

  test('should handle video player performance', async ({ page }) => {
    // Login and navigate to course
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'learner@mindelta.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.click('.enrolled-course-card:first-child a');
    await page.waitForSelector('.course-player');
    
    const startTime = Date.now();
    
    // Start video playback
    await page.click('button[aria-label="Play"]');
    await page.waitForSelector('video[playing]');
    
    const loadTime = Date.now() - startTime;
    
    // Video should start playing within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check video metrics
    const videoMetrics = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return null;
      
      return {
        duration: video.duration,
        currentTime: video.currentTime,
        readyState: video.readyState,
        buffered: video.buffered.length
      };
    });
    
    expect(videoMetrics).toBeTruthy();
    expect(videoMetrics!.readyState).toBeGreaterThan(0);
  });

  test('should handle AI companion response time', async ({ page }) => {
    // Login and navigate to AI companion
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'learner@mindelta.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/ai-companion');
    
    const startTime = Date.now();
    
    // Send a message to AI
    await page.fill('textarea[placeholder="Ask me anything..."]', 'What are the key concepts in Pan-Africanism?');
    await page.click('button:has-text("Send")');
    
    // Wait for AI response
    await page.waitForSelector('.ai-message');
    
    const responseTime = Date.now() - startTime;
    
    // AI should respond within 10 seconds
    expect(responseTime).toBeLessThan(10000);
    
    // Check response quality
    const aiResponse = await page.locator('.ai-message').textContent();
    expect(aiResponse).toBeTruthy();
    expect(aiResponse!.length).toBeGreaterThan(50);
  });

  test('should handle memory usage', async ({ page }) => {
    // Monitor memory usage during navigation
    await page.goto('/auth/login');
    
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Navigate through multiple pages
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/ai-companion');
    await page.waitForLoadState('networkidle');
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory usage shouldn't increase dramatically
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
    
    console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`);
    
    // Memory increase should be less than 50MB
    expect(memoryIncreaseMB).toBeLessThan(50);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/auth/login');
    
    // Try to login while offline
    await page.fill('input[name="email"]', 'instructor@mindelta.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show offline error message
    await expect(page.locator('text=Network error')).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await page.context().setOffline(false);
    
    // Retry should work
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });
});
