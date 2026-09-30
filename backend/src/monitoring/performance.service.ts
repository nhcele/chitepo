import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface PerformanceMetric {
  timestamp: Date;
  method: string;
  url: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface SystemMetrics {
  timestamp: Date;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
}

@Injectable()
export class PerformanceService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceService.name);
  private metrics: PerformanceMetric[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private requestCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastMinute = Date.now();
  private readonly maxMetrics = 10000;
  private readonly maxSystemMetrics = 1000;
  private lastMemoryWarning = 0;
  private readonly memoryWarningThrottle = 300000; // 5 minutes

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Start collecting system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);

    this.logger.log('Performance monitoring initialized');
  }

  recordRequest(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);
    this.updateRequestCounts(metric.method, metric.statusCode);

    // Keep metrics array within limits
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics * 0.8);
    }

    // Log slow requests
    if (metric.responseTime > 5000) {
      this.logger.warn(`Slow request detected: ${metric.method} ${metric.url} - ${metric.responseTime}ms`);
    }

    // Log errors
    if (metric.statusCode >= 400) {
      this.logger.error(`Error request: ${metric.method} ${metric.url} - ${metric.statusCode}`);
    }
  }

  private updateRequestCounts(method: string, statusCode: number) {
    const key = `${method}:${statusCode}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);

    if (statusCode >= 400) {
      this.errorCounts.set(method, (this.errorCounts.get(method) || 0) + 1);
    }
  }

  private collectSystemMetrics() {
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      activeConnections: this.getActiveConnections(),
      requestsPerSecond: this.calculateRequestsPerSecond(),
      errorRate: this.calculateErrorRate(),
    };

    this.systemMetrics.push(metrics);

    if (this.systemMetrics.length > this.maxSystemMetrics) {
      this.systemMetrics = this.systemMetrics.slice(-this.maxSystemMetrics * 0.8);
    }

    // Alert on high memory usage (throttled to prevent spam)
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    const now = Date.now();
    if (memoryUsagePercent > 95 && (now - this.lastMemoryWarning) > this.memoryWarningThrottle) {
      this.logger.warn(`High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`);
      this.lastMemoryWarning = now;
    }

    // Alert on high error rate
    if (metrics.errorRate > 10) {
      const recentErrors = this.getMostFrequentErrors(
        this.metrics.filter(m => now - m.timestamp.getTime() < 60000),
        3,
      );
      const errorSummary = recentErrors.length
        ? ` Top recent errors: ${recentErrors.map(e => `${e.error} x${e.count}`).join('; ')}`
        : '';
      this.logger.warn(`High error rate detected: ${metrics.errorRate.toFixed(2)}%.${errorSummary}`);
    }
  }

  private getActiveConnections(): number {
    // This would be implemented based on your connection tracking
    // For now, return a mock value
    return Math.floor(Math.random() * 100);
  }

  private calculateRequestsPerSecond(): number {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() < 60000 // Last minute
    );
    return recentMetrics.length;
  }

  private calculateErrorRate(): number {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    if (totalRequests === 0) return 0;
    return (totalErrors / totalRequests) * 100;
  }

  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 3600000;
    
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    
    // Reset counters for the new time window
    this.requestCounts.clear();
    this.errorCounts.clear();
  }

  // Analytics methods
  getPerformanceMetrics(timeRange?: { start: Date; end: Date }) {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return {
      totalRequests: filteredMetrics.length,
      averageResponseTime: this.calculateAverageResponseTime(filteredMetrics),
      requestsPerMinute: this.calculateRequestsPerMinute(filteredMetrics),
      errorRate: this.calculateErrorRateFromMetrics(filteredMetrics),
      slowestRequests: this.getSlowestRequests(filteredMetrics, 10),
      mostFrequentErrors: this.getMostFrequentErrors(filteredMetrics, 10),
      endpointsByResponseTime: this.getEndpointsByResponseTime(filteredMetrics),
    };
  }

  getSystemMetrics(timeRange?: { start: Date; end: Date }) {
    let filteredMetrics = this.systemMetrics;

    if (timeRange) {
      filteredMetrics = this.systemMetrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const latest = filteredMetrics[filteredMetrics.length - 1];
    const average = this.calculateAverageSystemMetrics(filteredMetrics);

    return {
      current: latest,
      average,
      trend: this.calculateTrend(filteredMetrics),
    };
  }

  private calculateAverageResponseTime(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    return total / metrics.length;
  }

  private calculateRequestsPerMinute(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const timeSpan = metrics[metrics.length - 1].timestamp.getTime() - metrics[0].timestamp.getTime();
    if (timeSpan === 0) return metrics.length;
    return (metrics.length / timeSpan) * 60000; // Convert to per minute
  }

  private calculateErrorRateFromMetrics(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const errors = metrics.filter(m => m.statusCode >= 400).length;
    return (errors / metrics.length) * 100;
  }

  private getSlowestRequests(metrics: PerformanceMetric[], limit: number) {
    return metrics
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit)
      .map(m => ({
        url: m.url,
        method: m.method,
        responseTime: m.responseTime,
        timestamp: m.timestamp,
      }));
  }

  private getMostFrequentErrors(metrics: PerformanceMetric[], limit: number) {
    const errorCounts = new Map<string, number>();
    
    metrics
      .filter(m => m.statusCode >= 400)
      .forEach(m => {
        const key = `${m.method} ${m.url} (${m.statusCode})`;
        errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
      });

    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([error, count]) => ({ error, count }));
  }

  private getEndpointsByResponseTime(metrics: PerformanceMetric[]) {
    const endpointStats = new Map<string, { count: number; totalTime: number }>();

    metrics.forEach(m => {
      const key = `${m.method} ${m.url}`;
      const current = endpointStats.get(key) || { count: 0, totalTime: 0 };
      endpointStats.set(key, {
        count: current.count + 1,
        totalTime: current.totalTime + m.responseTime,
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageResponseTime: stats.totalTime / stats.count,
        requestCount: stats.count,
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime);
  }

  private calculateAverageSystemMetrics(metrics: SystemMetrics[]) {
    const sum = metrics.reduce(
      (acc, m) => ({
        memoryUsage: {
          rss: acc.memoryUsage.rss + m.memoryUsage.rss,
          heapTotal: acc.memoryUsage.heapTotal + m.memoryUsage.heapTotal,
          heapUsed: acc.memoryUsage.heapUsed + m.memoryUsage.heapUsed,
          external: acc.memoryUsage.external + m.memoryUsage.external,
          arrayBuffers: acc.memoryUsage.arrayBuffers + m.memoryUsage.arrayBuffers,
        },
        cpuUsage: {
          user: acc.cpuUsage.user + m.cpuUsage.user,
          system: acc.cpuUsage.system + m.cpuUsage.system,
        },
        uptime: acc.uptime + m.uptime,
        activeConnections: acc.activeConnections + m.activeConnections,
        requestsPerSecond: acc.requestsPerSecond + m.requestsPerSecond,
        errorRate: acc.errorRate + m.errorRate,
      }),
      {
        memoryUsage: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
        cpuUsage: { user: 0, system: 0 },
        uptime: 0,
        activeConnections: 0,
        requestsPerSecond: 0,
        errorRate: 0,
      }
    );

    const count = metrics.length;
    return {
      memoryUsage: {
        rss: sum.memoryUsage.rss / count,
        heapTotal: sum.memoryUsage.heapTotal / count,
        heapUsed: sum.memoryUsage.heapUsed / count,
        external: sum.memoryUsage.external / count,
        arrayBuffers: sum.memoryUsage.arrayBuffers / count,
      },
      cpuUsage: {
        user: sum.cpuUsage.user / count,
        system: sum.cpuUsage.system / count,
      },
      uptime: sum.uptime / count,
      activeConnections: sum.activeConnections / count,
      requestsPerSecond: sum.requestsPerSecond / count,
      errorRate: sum.errorRate / count,
    };
  }

  private calculateTrend(metrics: SystemMetrics[]): 'up' | 'down' | 'stable' {
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, m) => sum + m.requestsPerSecond, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.requestsPerSecond, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  }

  // Export metrics for external monitoring systems
  exportMetrics(format: 'json' | 'prometheus' = 'json') {
    const performanceData = this.getPerformanceMetrics();
    const systemData = this.getSystemMetrics();

    if (format === 'prometheus') {
      return this.convertToPrometheusFormat(performanceData, systemData);
    }

    return {
      performance: performanceData,
      system: systemData,
      timestamp: new Date(),
    };
  }

  private convertToPrometheusFormat(performance: any, system: any) {
    const metrics: string[] = [];

    // Performance metrics
    metrics.push(`mindelta_requests_total ${performance.totalRequests}`);
    metrics.push(`mindelta_response_time_avg ${performance.averageResponseTime}`);
    metrics.push(`mindelta_requests_per_minute ${performance.requestsPerMinute}`);
    metrics.push(`mindelta_error_rate ${performance.errorRate}`);

    // System metrics
    if (system?.current) {
      metrics.push(`mindelta_memory_heap_used_bytes ${system.current.memoryUsage.heapUsed}`);
      metrics.push(`mindelta_memory_heap_total_bytes ${system.current.memoryUsage.heapTotal}`);
      metrics.push(`mindelta_uptime_seconds ${system.current.uptime}`);
      metrics.push(`mindelta_active_connections ${system.current.activeConnections}`);
      metrics.push(`mindelta_requests_per_second ${system.current.requestsPerSecond}`);
      metrics.push(`mindelta_error_rate_percent ${system.current.errorRate}`);
    }

    return metrics.join('\n');
  }
}
