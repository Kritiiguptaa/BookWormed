import winston from 'winston';

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
  transports: []
});


if (process.env.NODE_ENV === "production") {
  // Vercel → only console logs
  logger.add(new winston.transports.Console());
} else {
  // Local development → file logs + console
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/security.log', level: 'warn' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));

  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

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
