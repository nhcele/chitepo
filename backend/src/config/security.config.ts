export default () => ({
  // Rate Limiting Configuration
  rateLimit: {
    // General API rate limiting
    ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000, // 1 minute
    limit: parseInt(process.env.RATE_LIMIT_LIMIT) || 100,
    
    // AI Companion specific rate limiting
    aiCompanion: {
      ttl: parseInt(process.env.AI_RATE_LIMIT_TTL) || 86400000, // 24 hours
      limit: parseInt(process.env.AI_RATE_LIMIT_LIMIT) || 30,
    },
    
    // Authentication endpoints - more restrictive
    auth: {
      ttl: parseInt(process.env.AUTH_RATE_LIMIT_TTL) || 900000, // 15 minutes
      limit: parseInt(process.env.AUTH_RATE_LIMIT_LIMIT) || 5,
    },
    
    // File upload endpoints
    upload: {
      ttl: parseInt(process.env.UPLOAD_RATE_LIMIT_TTL) || 3600000, // 1 hour
      limit: parseInt(process.env.UPLOAD_RATE_LIMIT_LIMIT) || 10,
    },
  },

  // Security Headers Configuration
  securityHeaders: {
    contentSecurityPolicy: {
      enabled: process.env.NODE_ENV === 'production',
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        childSrc: ["'none'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
      },
    },
    hsts: {
      enabled: process.env.NODE_ENV === 'production',
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // CORS Configuration
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://localhost:4200', // Angular dev server
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin', 
      'X-Requested-With',
      'X-Request-ID',
      'X-API-Key'
    ],
    exposedHeaders: ['X-Request-ID', 'X-Response-Time', 'X-Audit-Logged'],
    maxAge: 86400, // 24 hours
  },

  // IP Security
  ipSecurity: {
    blockedIps: process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [],
    allowedIps: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [],
    enableGeoBlocking: process.env.ENABLE_GEO_BLOCKING === 'true',
    allowedCountries: process.env.ALLOWED_COUNTRIES ? process.env.ALLOWED_COUNTRIES.split(',') : [],
  },

  // Audit Logging
  audit: {
    enabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 90,
    logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
    sanitizeSensitiveData: process.env.SANITIZE_AUDIT_DATA !== 'false',
  },

  // Input Validation
  validation: {
    maxStringLength: parseInt(process.env.MAX_STRING_LENGTH) || 10000,
    maxArrayLength: parseInt(process.env.MAX_ARRAY_LENGTH) || 1000,
    maxObjectDepth: parseInt(process.env.MAX_OBJECT_DEPTH) || 10,
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },

  // AI Companion Security
  aiCompanion: {
    enabled: process.env.AI_COMPANION_ENABLED === 'true',
    maxTokensPerRequest: parseInt(process.env.AI_MAX_TOKENS) || 600,
    allowedModels: process.env.AI_ALLOWED_MODELS ? 
      process.env.AI_ALLOWED_MODELS.split(',') : 
      ['gpt-4o', 'gpt-4'],
    contentFiltering: {
      enabled: process.env.AI_CONTENT_FILTERING !== 'false',
      categories: ['violence', 'self_harm', 'sexual', 'hate'],
    },
  },

  // Session Security
  session: {
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    rolling: true,
  },

  // JWT Security
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'mindelta',
    audience: process.env.JWT_AUDIENCE || 'mindelta-users',
  },

  // Encryption
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    key: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production',
    ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH) || 16,
    tagLength: parseInt(process.env.ENCRYPTION_TAG_LENGTH) || 16,
  },
});
