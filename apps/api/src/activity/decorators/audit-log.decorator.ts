import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogOptions {
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'assigned' | 'commented';
  entity: 'board' | 'list' | 'task' | 'comment';
}

/**
 * Decorator Pattern: Marks controller methods for audit logging.
 * The AuditLogInterceptor reads this metadata and logs activities
 * after successful method execution.
 * 
 * @example
 * @AuditLog({ action: 'created', entity: 'task' })
 * create(@Body() dto: CreateTaskDto) { ... }
 */
export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);
