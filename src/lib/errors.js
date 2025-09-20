/**
 * Custom Error Classes
 * Based on error types defined in api-contracts.md
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(message, code, details = null, originalError = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    
    // Maintain proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/debugging
   * @returns {Object} Error as JSON object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  constructor(message, query = null, params = null, originalError = null) {
    super(message, 'DATABASE_ERROR', { query, params }, originalError);
  }
}

/**
 * Photo import error
 */
export class ImportError extends AppError {
  constructor(message, fileName = null, originalError = null) {
    super(message, 'IMPORT_ERROR', { fileName }, originalError);
  }
}

/**
 * Album management error
 */
export class AlbumError extends AppError {
  constructor(message, albumId = null, originalError = null) {
    super(message, 'ALBUM_ERROR', { albumId }, originalError);
  }
}

/**
 * UI-specific error for user interface operations
 */
export class UIError extends AppError {
  constructor(message, element = null, originalError = null) {
    super(message, 'UI_ERROR', originalError);
    this.element = element;
    this.details = { element };
  }
}

/**
 * Rendering-specific error for UI rendering operations
 */
export class RenderError extends AppError {
  constructor(message, originalError = null) {
    super(message, 'RENDER_ERROR', originalError);
    this.details = { renderingContext: 'ui' };
  }
}

/**
 * Thumbnail generation error
 */
export class ThumbnailError extends AppError {
  constructor(message, filePath = null, originalError = null) {
    super(message, 'THUMBNAIL_ERROR', { filePath }, originalError);
  }
}

/**
 * File system access error
 */
export class FileSystemError extends AppError {
  constructor(message, filePath = null, originalError = null) {
    super(message, 'FILESYSTEM_ERROR', { filePath }, originalError);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message, field = null, value = null, originalError = null) {
    super(message, 'VALIDATION_ERROR', { field, value }, originalError);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  constructor(message, setting = null, originalError = null) {
    super(message, 'CONFIGURATION_ERROR', { setting }, originalError);
  }
}

/**
 * Network error (for future use with external services)
 */
export class NetworkError extends AppError {
  constructor(message, url = null, statusCode = null, originalError = null) {
    super(message, 'NETWORK_ERROR', { url, statusCode }, originalError);
  }
}

/**
 * Permission error
 */
export class PermissionError extends AppError {
  constructor(message, resource = null, originalError = null) {
    super(message, 'PERMISSION_ERROR', { resource }, originalError);
  }
}

// Export all error types for easy importing
export {
  AppError as default,
  DatabaseError,
  ImportError,
  AlbumError,
  UIError,
  ThumbnailError,
  FileSystemError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  PermissionError
};
