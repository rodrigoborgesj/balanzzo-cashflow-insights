// Security utilities for the application

export const CSP_HEADER = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React development
    "style-src 'self' 'unsafe-inline'", // Required for styled components
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
};

// Rate limiting configuration for authentication endpoints
export const AUTH_RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5, // Max attempts per window
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RESET_PASSWORD_ATTEMPTS: 3,
  SIGNUP_ATTEMPTS: 3
};

// Security headers for enhanced protection
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...CSP_HEADER
};

// Input sanitization for user data
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate file uploads
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Tipo de arquivo não permitido' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Arquivo muito grande (máximo 10MB)' };
  }
  
  return { isValid: true };
}

// Audit logging for sensitive operations
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  metadata?: Record<string, any>
): AuditLog {
  return {
    userId,
    action,
    resource,
    timestamp: new Date(),
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent
  };
}