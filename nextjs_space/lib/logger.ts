
/**
 * 🔍 Centralized Logging System
 * 
 * Winston logger voor error tracking en debugging
 */

import winston from 'winston';


// Winston logger configuratie
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'writgoai' },
  transports: [
    // Console output (altijd)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Helper types
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogMetadata {
  userId?: string;
  clientId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  error?: any;
  duration?: number;
  [key: string]: any;
}

/**
 * Log een event met metadata
 */
export function log(level: LogLevel, message: string, metadata?: LogMetadata) {
  logger.log(level, message, metadata);
}

/**
 * Log een error met volledige stack trace
 */
export function logError(error: Error | any, context?: LogMetadata) {
  logger.error(error instanceof Error ? error.message : String(error), {
    ...context,
    stack: error?.stack,
    errorName: error?.name,
  });
}

/**
 * Log een API call
 */
export function logApiCall(
  endpoint: string,
  method: string,
  userId: string | undefined,
  duration: number,
  success: boolean
) {
  log(success ? 'info' : 'warn', `API Call: ${method} ${endpoint}`, {
    endpoint,
    method,
    userId,
    duration,
    success,
  });
}

/**
 * Log een credit transaction
 */
export async function logCreditTransaction(
  clientId: string,
  amount: number,
  type: string,
  description: string,
  success: boolean
) {
  log('info', `Credit Transaction: ${description}`, {
    clientId,
    amount,
    type,
    success,
  });

  // Ook opslaan in database (al geïmplementeerd in credits.ts)
}

/**
 * Log een failed login poging
 */
export function logFailedLogin(email: string, ip: string, reason: string) {
  log('warn', `Failed login attempt: ${email}`, {
    email,
    ip,
    reason,
    severity: 'security',
  });
}

/**
 * Log een payment event
 */
export function logPayment(
  clientId: string,
  amount: number,
  type: 'subscription' | 'credit_purchase',
  status: 'success' | 'failed',
  stripeId?: string
) {
  log(status === 'success' ? 'info' : 'error', `Payment ${status}: ${type}`, {
    clientId,
    amount,
    type,
    status,
    stripeId,
  });
}

/**
 * Log een AI generation event
 */
export function logAIGeneration(
  clientId: string,
  type: 'chat' | 'blog' | 'video' | 'image',
  model: string,
  credits: number,
  success: boolean,
  error?: string
) {
  log(success ? 'info' : 'error', `AI Generation: ${type}`, {
    clientId,
    type,
    model,
    credits,
    success,
    error,
  });
}

export default logger;
