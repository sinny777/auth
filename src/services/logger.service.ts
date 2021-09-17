import winston from 'winston';
const path = require('path')

export interface LoggerService {
  logger: winston.Logger;
}

const logFormat = winston.format.printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`)

export class WinstonLoggerService implements LoggerService {
  logger: winston.Logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize({all: true}),
      winston.format.label({label: 'AUTH'}),
      // winston.format.prettyPrint(),
      // winston.format.json(),
      winston.format.splat(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          // winston.format.colorize(),
          logFormat
        ),
      }),
    ],
    exitOnError: false
  });
}
