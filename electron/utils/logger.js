import pino from 'pino';
import path from 'path';
import { app } from 'electron';

/**
 * Centralny logger aplikacji (Pino)
 */

const isDev = process.env.NODE_ENV === 'development';

// Konfiguracja loggera
const loggerConfig = {
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
};

// Dla produkcji dodaj zapis do pliku
if (!isDev) {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  loggerConfig.transport = {
    target: 'pino/file',
    options: {
      destination: path.join(logsDir, 'app.log'),
      mkdir: true,
    },
  };
}

export const logger = pino(loggerConfig);

// Eksportuj funkcje pomocnicze
export const logInfo = (...args) => logger.info(...args);
export const logError = (...args) => logger.error(...args);
export const logWarn = (...args) => logger.warn(...args);
export const logDebug = (...args) => logger.debug(...args);
