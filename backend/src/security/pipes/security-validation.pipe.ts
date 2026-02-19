import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SecurityService } from '../security.service';

@Injectable()
export class SecurityValidationPipe implements PipeTransform {
  private readonly logger = new Logger(SecurityValidationPipe.name);

  constructor(private readonly securityService: SecurityService) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    try {
      // Basic validation
      if (typeof value !== 'object') {
        throw new BadRequestException('Invalid input format');
      }

      // Check for SQL injection patterns
      const stringValue = JSON.stringify(value);
      if (!this.securityService.validateSqlInput(stringValue)) {
        this.logger.warn('SQL injection attempt detected', { value: stringValue.substring(0, 200) });
        throw new BadRequestException('Invalid input detected');
      }

      // Get allowed fields based on DTO type
      const allowedFields = this.getAllowedFields(metadata);
      
      // Validate and sanitize input
      const sanitized = this.securityService.validateAndSanitizeInput(value, allowedFields);

      return sanitized;
    } catch (error) {
      this.logger.error('Security validation failed:', error);
      throw new BadRequestException('Input validation failed');
    }
  }

  private getAllowedFields(metadata: ArgumentMetadata): string[] | undefined {
    // Define allowed fields for different DTO types
    const fieldMappings: Record<string, string[]> = {
      'SecureInputDto': ['name', 'email', 'subject', 'message', 'metadata'],
      'SecureSearchDto': ['query', 'page', 'limit', 'sortBy', 'sortOrder'],
      'SecureFileUploadDto': ['filename', 'mimeType', 'size'],
      'CreateUserDto': ['name', 'email', 'role', 'jobTitle', 'skillInterests'],
      'UpdateUserDto': ['name', 'jobTitle', 'skillInterests'],
      'CreateCourseDto': ['title', 'description', 'category', 'level', 'duration'],
      'UpdateCourseDto': ['title', 'description', 'category', 'level', 'duration'],
    };

    const dtoName = metadata.metatype?.name;
    return dtoName ? fieldMappings[dtoName] : undefined;
  }
}
