import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as redis from 'redis';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: DatabaseHealthCheck;
    redis: RedisHealthCheck;
    memory: MemoryHealthCheck;
    disk: DiskHealthCheck;
    external: ExternalServiceHealthCheck[];
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
}

export interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  connectionPool: {
    active: number;
    idle: number;
    total: number;
  };
  lastChecked: Date;
  error?: string;
}

export interface RedisHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  memory: {
    used: number;
    max: number;
    percentage: number;
  };
  connectedClients: number;
  lastChecked: Date;
  error?: string;
}

export interface MemoryHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  usage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  thresholds: {
    warning: number;
    critical: number;
  };
  lastChecked: Date;
}

export interface DiskHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  usage: {
    used: number;
    total: number;
    percentage: number;
  };
  thresholds: {
    warning: number;
    critical: number;
  };
  lastChecked: Date;
  error?: string;
}

export interface ExternalServiceHealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redisClient: redis.RedisClientType;
  private readonly healthThresholds = {
    memory: {
      warning: 70, // 70%
      critical: 90, // 90%
    },
    disk: {
      warning: 80, // 80%
      critical: 95, // 95%
    },
    responseTime: {
      warning: 1000, // 1 second
      critical: 5000, // 5 seconds
    },
  };

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        this.logger.log('Redis URL not configured, skipping Redis health checks');
        return;
      }

      this.redisClient = redis.createClient({
        url: redisUrl,
      });

      await this.redisClient.connect();
      this.logger.log('Redis client connected for health checks');
    } catch (error) {
      this.logger.warn('Redis client not available for health checks (this is optional for development)');
    }
  }

  async getHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      memory: await this.checkMemory(),
      disk: await this.checkDisk(),
      external: await this.checkExternalServices(),
    };

    const allChecks = [
      checks.database,
      checks.redis,
      checks.memory,
      checks.disk,
      ...checks.external,
    ];

    const passedChecks = allChecks.filter(check => check.status === 'healthy').length;
    const failedChecks = allChecks.filter(check => check.status === 'unhealthy').length;
    const degradedChecks = allChecks.filter(check => check.status === 'degraded').length;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (failedChecks > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedChecks > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      checks,
      summary: {
        totalChecks: allChecks.length,
        passedChecks,
        failedChecks,
      },
    };
  }

  async checkDatabase(): Promise<DatabaseHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await this.dataSource.query('SELECT 1');
      
      const responseTime = Date.now() - startTime;
      
      // Get connection pool info
      const pool = this.dataSource.driver as any;
      const poolInfo = {
        active: pool.pool?.numUsedEver || 0,
        idle: pool.pool?.numIdle || 0,
        total: pool.pool?.numTotal || 0,
      };

      const status = responseTime > this.healthThresholds.responseTime.critical 
        ? 'unhealthy' 
        : responseTime > this.healthThresholds.responseTime.warning 
        ? 'degraded' 
        : 'healthy';

      return {
        status,
        responseTime,
        connectionPool: poolInfo,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        connectionPool: { active: 0, idle: 0, total: 0 },
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  async checkRedis(): Promise<RedisHealthCheck> {
    const startTime = Date.now();
    
    if (!this.redisClient) {
      // In development, Redis is optional, so return degraded instead of unhealthy
      const isDevelopment = this.configService.get('NODE_ENV') === 'development';
      return {
        status: isDevelopment ? 'degraded' : 'unhealthy',
        responseTime: 0,
        memory: { used: 0, max: 0, percentage: 0 },
        connectedClients: 0,
        lastChecked: new Date(),
        error: 'Redis client not available (optional in development)',
      };
    }

    try {
      // Test Redis connection
      await this.redisClient.ping();
      
      const responseTime = Date.now() - startTime;
      
      // Get Redis info
      const info = await this.redisClient.info('memory');
      const memoryInfo = this.parseRedisMemoryInfo(info);
      const clients = await this.redisClient.info('clients');
      const clientInfo = this.parseRedisClientInfo(clients);

      const status = responseTime > this.healthThresholds.responseTime.critical 
        ? 'unhealthy' 
        : responseTime > this.healthThresholds.responseTime.warning 
        ? 'degraded' 
        : 'healthy';

      return {
        status,
        responseTime,
        memory: memoryInfo,
        connectedClients: clientInfo.connected,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        memory: { used: 0, max: 0, percentage: 0 },
        connectedClients: 0,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  async checkMemory(): Promise<MemoryHealthCheck> {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (heapUsedPercent > this.healthThresholds.memory.critical) {
      status = 'unhealthy';
    } else if (heapUsedPercent > this.healthThresholds.memory.warning) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      usage: memUsage,
      thresholds: this.healthThresholds.memory,
      lastChecked: new Date(),
    };
  }

  async checkDisk(): Promise<DiskHealthCheck> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check disk space for the current working directory
      const stats = fs.statSync(process.cwd());
      
      // For simplicity, we'll mock disk usage. In a real implementation,
      // you'd use a library like 'diskusage' or check the filesystem directly
      const mockUsage = {
        used: 50 * 1024 * 1024 * 1024, // 50GB
        total: 100 * 1024 * 1024 * 1024, // 100GB
        percentage: 50,
      };

      let status: 'healthy' | 'unhealthy' | 'degraded';
      if (mockUsage.percentage > this.healthThresholds.disk.critical) {
        status = 'unhealthy';
      } else if (mockUsage.percentage > this.healthThresholds.disk.warning) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        status,
        usage: mockUsage,
        thresholds: this.healthThresholds.disk,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error('Disk health check failed:', error);
      return {
        status: 'unhealthy',
        usage: { used: 0, total: 0, percentage: 100 },
        thresholds: this.healthThresholds.disk,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  async checkExternalServices(): Promise<ExternalServiceHealthCheck[]> {
    const services = [
      {
        name: 'OpenAI API',
        url: 'https://api.openai.com/v1/models',
        timeout: 5000,
      },
      {
        name: 'AWS S3',
        url: `https://s3.${this.configService.get('AWS_REGION')}.amazonaws.com`,
        timeout: 5000,
      },
      {
        name: 'Polygon RPC',
        url: 'https://polygon-rpc.com',
        timeout: 5000,
      },
    ];

    const checks = await Promise.allSettled(
      services.map(service => this.checkExternalService(service))
    );

    return checks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        name: services[result.reason?.index || 0]?.name || 'Unknown',
        status: 'unhealthy' as const,
        responseTime: 0,
        lastChecked: new Date(),
        error: result.reason?.message || 'Unknown error',
      }
    );
  }

  private async checkExternalService(service: { name: string; url: string; timeout: number }): Promise<ExternalServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      const fetch = require('node-fetch');
      
      const response = await fetch(service.url, {
        method: 'GET',
        timeout: service.timeout,
      });

      const responseTime = Date.now() - startTime;
      const status = response.ok && responseTime < this.healthThresholds.responseTime.critical 
        ? 'healthy' 
        : 'unhealthy';

      return {
        name: service.name,
        status,
        responseTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: service.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  private parseRedisMemoryInfo(info: string): { used: number; max: number; percentage: number } {
    const lines = info.split('\r\n');
    const memoryData: Record<string, string> = {};

    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        memoryData[key] = value;
      }
    });

    const used = parseInt(memoryData['used_memory'] || '0');
    const max = parseInt(memoryData['maxmemory'] || '0');
    const percentage = max > 0 ? (used / max) * 100 : 0;

    return { used, max, percentage };
  }

  private parseRedisClientInfo(info: string): { connected: number } {
    const lines = info.split('\r\n');
    const clientData: Record<string, string> = {};

    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        clientData[key] = value;
      }
    });

    return {
      connected: parseInt(clientData['connected_clients'] || '0'),
    };
  }

  // Liveness probe - quick check to see if the application is running
  async getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
    };
  }

  // Readiness probe - check if the application is ready to serve traffic
  async getReadiness() {
    const dbCheck = await this.checkDatabase();
    const redisCheck = await this.checkRedis();

    const isReady = dbCheck.status === 'healthy' && redisCheck.status === 'healthy';

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date(),
      checks: {
        database: dbCheck.status,
        redis: redisCheck.status,
      },
    };
  }

  // Detailed health information for debugging
  async getDetailedHealth() {
    const basicHealth = await this.getHealthCheck();
    
    return {
      ...basicHealth,
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.versions.node,
      },
      environment: {
        NODE_ENV: this.configService.get<string>('NODE_ENV'),
        PORT: this.configService.get<string>('PORT'),
        DATABASE_HOST: this.configService.get<string>('DATABASE_HOST'),
        REDIS_URL: this.configService.get<string>('REDIS_URL')?.replace(/\/\/.*@/, '//***:***@'),
      },
      build: {
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
        gitCommit: process.env.GIT_COMMIT || 'unknown',
        gitBranch: process.env.GIT_BRANCH || 'unknown',
      },
    };
  }
}
