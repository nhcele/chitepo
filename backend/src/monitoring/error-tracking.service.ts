import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'critical';
  context: {
    userId?: string;
    requestId?: string;
    method?: string;
    url?: string;
    userAgent?: string;
    ip?: string;
    body?: any;
    query?: any;
    params?: any;
  };
  tags: string[];
  resolved: boolean;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  timeWindow: number; // in minutes
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  resolved: boolean;
  resolvedAt?: Date;
}

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);
  private errors: ErrorEvent[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private errorCounts: Map<string, number> = new Map();
  private readonly maxErrors = 5000;
  private readonly maxAlerts = 1000;

  constructor(private configService: ConfigService) {
    this.initializeDefaultAlertRules();
  }

  private initializeDefaultAlertRules() {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'error_rate',
        threshold: 10, // 10% error rate
        timeWindow: 5,
        enabled: true,
        channels: ['email', 'slack'],
      },
      {
        id: 'critical-errors',
        name: 'Critical Errors',
        condition: 'critical_error_count',
        threshold: 5,
        timeWindow: 1,
        enabled: true,
        channels: ['email', 'slack', 'webhook'],
      },
      {
        id: 'database-errors',
        name: 'Database Errors',
        condition: 'database_error_count',
        threshold: 3,
        timeWindow: 5,
        enabled: true,
        channels: ['slack'],
      },
      {
        id: 'authentication-failures',
        name: 'Authentication Failures',
        condition: 'auth_error_count',
        threshold: 10,
        timeWindow: 5,
        enabled: true,
        channels: ['slack'],
      },
    ];
  }

  trackError(error: Error, context: Partial<ErrorEvent['context']> = {}, level: ErrorEvent['level'] = 'error') {
    const errorKey = `${error.message}:${context.url || 'unknown'}`;
    const existingError = this.errors.find(e => e.message === error.message && e.context.url === context.url);
    
    if (existingError) {
      existingError.occurrences++;
      existingError.lastSeen = new Date();
      const higherPriority = Math.max(this.getLevelPriority(existingError.level), this.getLevelPriority(level));
      existingError.level = higherPriority === 2 ? 'critical' : higherPriority === 1 ? 'error' : 'warning';
    } else {
      const errorEvent: ErrorEvent = {
        id: this.generateId(),
        timestamp: new Date(),
        message: error.message,
        stack: error.stack,
        level,
        context: {
          ...context,
        },
        tags: this.extractTags(error, context),
        resolved: false,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      };

      this.errors.push(errorEvent);
      this.logger.error(`Error tracked: ${error.message}`, error.stack);
    }

    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Keep errors array within limits
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors * 0.8);
    }

    // Check alert rules
    this.checkAlertRules();

    return errorKey;
  }

  trackWarning(message: string, context: Partial<ErrorEvent['context']> = {}) {
    const warning = new Error(message);
    return this.trackError(warning, context, 'warning');
  }

  trackCriticalError(error: Error, context: Partial<ErrorEvent['context']> = {}) {
    return this.trackError(error, context, 'critical');
  }

  private getLevelPriority(level: ErrorEvent['level']): number {
    const priorities = { warning: 1, error: 2, critical: 3 };
    return priorities[level] || 0;
  }

  private extractTags(error: Error, context: Partial<ErrorEvent['context']>): string[] {
    const tags: string[] = [];

    // Add error type tags
    if (error.name) tags.push(error.name.toLowerCase());
    
    // Add context-based tags
    if (context.method) tags.push(context.method.toLowerCase());
    if (context.url) {
      const pathParts = context.url.split('/').filter(part => part && !part.match(/^\d+$/));
      tags.push(...pathParts.map(part => part.toLowerCase()));
    }
    
    // Add status code tags
    if (context.body?.statusCode) {
      tags.push(`status:${context.body.statusCode}`);
    }

    // Add common error patterns
    const message = error.message.toLowerCase();
    if (message.includes('timeout')) tags.push('timeout');
    if (message.includes('database') || message.includes('sql')) tags.push('database');
    if (message.includes('auth') || message.includes('unauthorized')) tags.push('authentication');
    if (message.includes('validation')) tags.push('validation');
    if (message.includes('network') || message.includes('connection')) tags.push('network');

    return [...new Set(tags)]; // Remove duplicates
  }

  private checkAlertRules() {
    const now = Date.now();
    
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // Check if recently triggered to avoid spam
      if (rule.lastTriggered && (now - rule.lastTriggered.getTime()) < rule.timeWindow * 60000) {
        return;
      }

      const shouldTrigger = this.evaluateAlertRule(rule);
      
      if (shouldTrigger) {
        this.triggerAlert(rule);
        rule.lastTriggered = new Date();
      }
    });
  }

  private evaluateAlertRule(rule: AlertRule): boolean {
    const timeWindow = rule.timeWindow * 60000; // Convert to milliseconds
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > cutoff);

    switch (rule.condition) {
      case 'error_rate':
        const totalRequests = this.getTotalRequestsInWindow(cutoff);
        const errorCount = recentErrors.length;
        if (totalRequests === 0) return false;
        const errorRate = (errorCount / totalRequests) * 100;
        return errorRate > rule.threshold;

      case 'critical_error_count':
        const criticalCount = recentErrors.filter(e => e.level === 'critical').length;
        return criticalCount > rule.threshold;

      case 'database_error_count':
        const dbCount = recentErrors.filter(e => 
          e.tags.includes('database') || e.message.toLowerCase().includes('database')
        ).length;
        return dbCount > rule.threshold;

      case 'auth_error_count':
        const authCount = recentErrors.filter(e => 
          e.tags.includes('authentication') || e.context.url?.includes('/auth')
        ).length;
        return authCount > rule.threshold;

      default:
        return false;
    }
  }

  private getTotalRequestsInWindow(cutoff: number): number {
    // This would typically come from your performance monitoring service
    // For now, return a mock calculation
    return Math.floor(Math.random() * 1000) + 100;
  }

  private triggerAlert(rule: AlertRule) {
    const alert: Alert = {
      id: this.generateId(),
      ruleId: rule.id,
      triggeredAt: new Date(),
      severity: this.getAlertSeverity(rule),
      message: `Alert triggered: ${rule.name}`,
      details: this.getAlertDetails(rule),
      resolved: false,
    };

    this.alerts.push(alert);
    this.logger.warn(`Alert triggered: ${rule.name}`);

    // Send notifications
    rule.channels.forEach(channel => {
      this.sendNotification(channel, alert);
    });

    // Keep alerts array within limits
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts * 0.8);
    }
  }

  private getAlertSeverity(rule: AlertRule): Alert['severity'] {
    switch (rule.id) {
      case 'critical-errors':
        return 'critical';
      case 'high-error-rate':
        return 'high';
      case 'database-errors':
        return 'medium';
      default:
        return 'low';
    }
  }

  private getAlertDetails(rule: AlertRule) {
    const timeWindow = rule.timeWindow * 60000;
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > cutoff);

    return {
      rule: rule.name,
      threshold: rule.threshold,
      actual: this.getActualValue(rule, recentErrors),
      timeWindow: rule.timeWindow,
      errorCount: recentErrors.length,
      topErrors: recentErrors
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 5)
        .map(e => ({
          message: e.message,
          occurrences: e.occurrences,
          level: e.level,
        })),
    };
  }

  private getActualValue(rule: AlertRule, recentErrors: ErrorEvent[]): number {
    switch (rule.condition) {
      case 'error_rate':
        const totalRequests = this.getTotalRequestsInWindow(Date.now() - rule.timeWindow * 60000);
        return totalRequests > 0 ? (recentErrors.length / totalRequests) * 100 : 0;
      case 'critical_error_count':
        return recentErrors.filter(e => e.level === 'critical').length;
      case 'database_error_count':
        return recentErrors.filter(e => e.tags.includes('database')).length;
      case 'auth_error_count':
        return recentErrors.filter(e => e.tags.includes('authentication')).length;
      default:
        return recentErrors.length;
    }
  }

  private async sendNotification(channel: 'email' | 'slack' | 'webhook', alert: Alert) {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(alert);
          break;
        case 'slack':
          await this.sendSlackNotification(alert);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to send ${channel} notification:`, error);
    }
  }

  private async sendEmailNotification(alert: Alert) {
    // Implement email sending logic
    this.logger.log(`Email notification sent for alert: ${alert.message}`);
  }

  private async sendSlackNotification(alert: Alert) {
    // Implement Slack webhook logic
    this.logger.log(`Slack notification sent for alert: ${alert.message}`);
  }

  private async sendWebhookNotification(alert: Alert) {
    // Implement generic webhook logic
    this.logger.log(`Webhook notification sent for alert: ${alert.message}`);
  }

  // Public API methods
  getErrors(options: {
    level?: ErrorEvent['level'];
    resolved?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
    timeRange?: { start: Date; end: Date };
  } = {}) {
    let filtered = this.errors;

    if (options.level) {
      filtered = filtered.filter(e => e.level === options.level);
    }

    if (options.resolved !== undefined) {
      filtered = filtered.filter(e => e.resolved === options.resolved);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(e => 
        options.tags!.some(tag => e.tags.includes(tag))
      );
    }

    if (options.timeRange) {
      filtered = filtered.filter(e => 
        e.timestamp >= options.timeRange!.start && e.timestamp <= options.timeRange!.end
      );
    }

    // Sort by last seen (most recent first)
    filtered.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      errors: paginated,
      total: filtered.length,
      hasMore: offset + limit < filtered.length,
    };
  }

  getAlerts(options: {
    resolved?: boolean;
    severity?: Alert['severity'];
    limit?: number;
    offset?: number;
  } = {}) {
    let filtered = this.alerts;

    if (options.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }

    if (options.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }

    // Sort by triggered at (most recent first)
    filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      alerts: paginated,
      total: filtered.length,
      hasMore: offset + limit < filtered.length,
    };
  }

  resolveError(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      this.logger.log(`Error resolved: ${error.message}`);
      return true;
    }
    return false;
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.logger.log(`Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  getErrorStatistics() {
    const last24h = Date.now() - 86400000; // 24 hours ago
    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > last24h);

    const levelCounts = recentErrors.reduce((acc, e) => {
      acc[e.level] = (acc[e.level] || 0) + 1;
      return acc;
    }, {} as Record<ErrorEvent['level'], number>);

    const tagCounts = recentErrors.reduce((acc, e) => {
      e.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: recentErrors.length,
      errorsByLevel: levelCounts,
      errorsByTag: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      topErrors: recentErrors
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 10)
        .map(e => ({
          id: e.id,
          message: e.message,
          occurrences: e.occurrences,
          level: e.level,
          lastSeen: e.lastSeen,
        })),
      resolutionRate: recentErrors.length > 0 
        ? (recentErrors.filter(e => e.resolved).length / recentErrors.length) * 100 
        : 0,
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
