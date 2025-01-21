import { logger } from './logger';
import * as path from 'path';

export function normalizePath(filePath: string): string {
  try {
    // Convert to Windows path format and normalize
    const normalized = path.win32.normalize(filePath)
      // Ensure proper capitalization for root parts (C:\Users)
      .replace(/^([a-zA-Z]):\\(users|Users)\\/, 'C:\\Users\\')
      // Replace forward slashes with backslashes
      .replace(/\//g, '\\');
    
    logger.debug(`Normalized path from ${filePath} to ${normalized}`);
    return normalized;
  } catch (error) {
    logger.error(`Path normalization failed for ${filePath}:`, error);
    return filePath;
  }
}
