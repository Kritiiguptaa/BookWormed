import winston from 'winston';

// Create logger instance for security events
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bookwormed-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `warn` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/security.log', level: 'warn' }),
    // Write all logs to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Security event logging helpers
export const logSecurityEvent = (event, details) => {
  logger.warn('SECURITY_EVENT', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export const logAuthFailure = (email, ip, reason) => {
  logger.warn('AUTH_FAILURE', {
    email,
    ip,
    reason,
    timestamp: new Date().toISOString()
  });
};

export const logAuthSuccess = (userId, email, ip) => {
  logger.info('AUTH_SUCCESS', {
    userId,
    email,
    ip,
    timestamp: new Date().toISOString()
  });
};

export const logAccountLockout = (email, ip) => {
  logger.warn('ACCOUNT_LOCKOUT', {
    event: 'account_locked',
    email,
    ip,
    timestamp: new Date().toISOString()
  });
};

export const logPasswordReset = (email, ip) => {
  logger.info('PASSWORD_RESET_REQUEST', {
    email,
    ip,
    timestamp: new Date().toISOString()
  });
};

export const logPaymentAttempt = (userId, plan, amount, success) => {
  logger.info('PAYMENT_ATTEMPT', {
    userId,
    plan,
    amount,
    success,
    timestamp: new Date().toISOString()
  });
};

export default logger;
