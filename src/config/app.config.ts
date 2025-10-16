/**
 * Application Configuration
 * Central configuration for the Starter Template
 */

export const APP_CONFIG = {
  // Metadata
  name: 'Starter Template',
  description: 'Electron + React + TypeScript Application',
  version: '1.0.0',
  author: 'Developer',

  // Features
  enableLogging: true,
  enableDevTools: process.env.NODE_ENV === 'development',

  // UI
  theme: 'light' as const,
  accentColor: '#667eea',
} as const;

export type AppConfig = typeof APP_CONFIG;
