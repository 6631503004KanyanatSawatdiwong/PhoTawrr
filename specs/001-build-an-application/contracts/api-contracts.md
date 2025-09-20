# API Contracts: Photo Album Organization Application

**Date**: 20 September 2025  
**Phase**: 1 - Design & Contracts  
**Note**: This is a local-only application, so these are internal module contracts rather than HTTP API contracts.

## Module Interface Contracts

### PhotoService Contract

```javascript
/**
 * Photo management service interface
 * Handles photo import, metadata extraction, and organization
 */
class PhotoService {
  /**
   * Import photos from file system
   * @param {FileList} files - Selected photo files
   * @returns {Promise<ImportResult>} Import operation result
   * @throws {ImportError} When files cannot be processed
   */
  async importPhotos(files);

  /**
   * Get photos for a specific album
   * @param {number} albumId - Album identifier
   * @param {number} offset - Pagination offset (default: 0)
   * @param {number} limit - Number of photos to return (default: 50)
   * @returns {Promise<Photo[]>} Array of photo objects
   * @throws {DatabaseError} When query fails
   */
  async getPhotosByAlbum(albumId, offset = 0, limit = 50);

  /**
   * Generate thumbnail for photo
   * @param {string} filePath - Path to photo file
   * @param {number} size - Thumbnail size in pixels (default: 200)
   * @returns {Promise<string>} Base64 encoded thumbnail data
   * @throws {ThumbnailError} When thumbnail generation fails
   */
  async generateThumbnail(filePath, size = 200);

  /**
   * Delete photo from system
   * @param {number} photoId - Photo identifier
   * @returns {Promise<boolean>} Success status
   * @throws {DatabaseError} When deletion fails
   */
  async deletePhoto(photoId);
}
```

### AlbumService Contract

```javascript
/**
 * Album management service interface
 * Handles album creation, organization, and reordering
 */
class AlbumService {
  /**
   * Get all albums with display order
   * @returns {Promise<Album[]>} Array of album objects sorted by display_order
   * @throws {DatabaseError} When query fails
   */
  async getAllAlbums();

  /**
   * Create new album for date period
   * @param {string} datePeriod - Date period in YYYY-MM format or "undated"
   * @param {string} name - Human-readable album name
   * @returns {Promise<Album>} Created album object
   * @throws {AlbumError} When creation fails
   */
  async createAlbum(datePeriod, name);

  /**
   * Update album display order
   * @param {number} albumId - Album identifier
   * @param {number} newOrder - New display order position
   * @returns {Promise<boolean>} Success status
   * @throws {DatabaseError} When update fails
   */
  async updateAlbumOrder(albumId, newOrder);

  /**
   * Reorder albums based on drag-drop operation
   * @param {number[]} albumIds - Array of album IDs in new order
   * @returns {Promise<boolean>} Success status
   * @throws {DatabaseError} When reordering fails
   */
  async reorderAlbums(albumIds);

  /**
   * Get or create album for photo date
   * @param {Date|null} photoDate - Photo date from EXIF data
   * @returns {Promise<Album>} Existing or newly created album
   * @throws {AlbumError} When album creation fails
   */
  async getOrCreateAlbumForDate(photoDate);
}
```

### DatabaseService Contract

```javascript
/**
 * Database management service interface
 * Handles SQLite operations and connection management
 */
class DatabaseService {
  /**
   * Initialize database connection and schema
   * @returns {Promise<boolean>} Initialization success status
   * @throws {DatabaseError} When initialization fails
   */
  async initialize();

  /**
   * Execute SQL query with parameters
   * @param {string} sql - SQL query string
   * @param {any[]} params - Query parameters (default: [])
   * @returns {Promise<QueryResult>} Query execution result
   * @throws {DatabaseError} When query execution fails
   */
  async execute(sql, params = []);

  /**
   * Execute SQL query and return first row
   * @param {string} sql - SQL query string
   * @param {any[]} params - Query parameters (default: [])
   * @returns {Promise<Object|null>} First row or null if no results
   * @throws {DatabaseError} When query execution fails
   */
  async get(sql, params = []);

  /**
   * Execute SQL query and return all rows
   * @param {string} sql - SQL query string
   * @param {any[]} params - Query parameters (default: [])
   * @returns {Promise<Object[]>} Array of result rows
   * @throws {DatabaseError} When query execution fails
   */
  async all(sql, params = []);

  /**
   * Begin database transaction
   * @returns {Promise<Transaction>} Transaction object
   * @throws {DatabaseError} When transaction cannot be started
   */
  async beginTransaction();

  /**
   * Close database connection
   * @returns {Promise<boolean>} Close operation success status
   */
  async close();
}
```

### UIController Contract

```javascript
/**
 * UI controller interface
 * Handles user interface interactions and state management
 */
class UIController {
  /**
   * Initialize application UI
   * @returns {Promise<void>}
   * @throws {UIError} When UI initialization fails
   */
  async initialize();

  /**
   * Render albums on main page
   * @param {Album[]} albums - Array of album objects
   * @returns {void}
   * @throws {RenderError} When rendering fails
   */
  renderAlbums(albums);

  /**
   * Render photos in album view
   * @param {Photo[]} photos - Array of photo objects
   * @param {Album} album - Album information
   * @returns {void}
   * @throws {RenderError} When rendering fails
   */
  renderPhotos(photos, album);

  /**
   * Enable drag-and-drop for album reordering
   * @param {HTMLElement} container - Container element with albums
   * @returns {void}
   * @throws {UIError} When drag-drop setup fails
   */
  enableAlbumDragDrop(container);

  /**
   * Show photo import dialog
   * @returns {Promise<FileList|null>} Selected files or null if cancelled
   * @throws {UIError} When dialog cannot be shown
   */
  async showImportDialog();

  /**
   * Display error message to user
   * @param {string} message - Error message text
   * @param {string} type - Error type ('error', 'warning', 'info')
   * @returns {void}
   */
  showMessage(message, type = 'error');

  /**
   * Show loading indicator
   * @param {string} message - Loading message (default: 'Loading...')
   * @returns {void}
   */
  showLoading(message = 'Loading...');

  /**
   * Hide loading indicator
   * @returns {void}
   */
  hideLoading();
}
```

## Data Transfer Objects

### Photo DTO
```javascript
/**
 * Photo data transfer object
 */
interface Photo {
  id: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  dateTaken: Date | null;
  dateAdded: Date;
  albumId: number;
  width: number;
  height: number;
  thumbnailData: string | null;
  exifData: object | null;
}
```

### Album DTO
```javascript
/**
 * Album data transfer object
 */
interface Album {
  id: number;
  name: string;
  datePeriod: string;
  displayOrder: number;
  photoCount: number;
  coverPhotoId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### ImportResult DTO
```javascript
/**
 * Photo import operation result
 */
interface ImportResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  errors: ImportError[];
  newAlbums: Album[];
  importedPhotos: Photo[];
}
```

### QueryResult DTO
```javascript
/**
 * Database query result
 */
interface QueryResult {
  changes: number;
  lastInsertRowid: number | null;
  rows: object[];
}
```

## Error Types

### Custom Error Classes
```javascript
/**
 * Base application error
 */
class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

/**
 * Database operation error
 */
class DatabaseError extends AppError {
  constructor(message, query = null, params = null) {
    super(message, 'DATABASE_ERROR', { query, params });
  }
}

/**
 * Photo import error
 */
class ImportError extends AppError {
  constructor(message, fileName = null, originalError = null) {
    super(message, 'IMPORT_ERROR', { fileName, originalError });
  }
}

/**
 * Album management error
 */
class AlbumError extends AppError {
  constructor(message, albumId = null) {
    super(message, 'ALBUM_ERROR', { albumId });
  }
}

/**
 * UI operation error
 */
class UIError extends AppError {
  constructor(message, element = null) {
    super(message, 'UI_ERROR', { element });
  }
}

/**
 * Thumbnail generation error
 */
class ThumbnailError extends AppError {
  constructor(message, filePath = null) {
    super(message, 'THUMBNAIL_ERROR', { filePath });
  }
}
```

## Event Contracts

### Application Events
```javascript
/**
 * Custom events for application state changes
 */

// Photo events
const PHOTO_EVENTS = {
  IMPORT_STARTED: 'photo:import:started',
  IMPORT_PROGRESS: 'photo:import:progress',
  IMPORT_COMPLETED: 'photo:import:completed',
  IMPORT_ERROR: 'photo:import:error',
  PHOTO_DELETED: 'photo:deleted',
  THUMBNAIL_GENERATED: 'photo:thumbnail:generated'
};

// Album events
const ALBUM_EVENTS = {
  ALBUM_CREATED: 'album:created',
  ALBUM_UPDATED: 'album:updated',
  ALBUM_REORDERED: 'album:reordered',
  ALBUM_SELECTED: 'album:selected'
};

// UI events
const UI_EVENTS = {
  VIEW_CHANGED: 'ui:view:changed',
  LOADING_STARTED: 'ui:loading:started',
  LOADING_FINISHED: 'ui:loading:finished',
  ERROR_DISPLAYED: 'ui:error:displayed'
};
```

## Validation Contracts

### Input Validation Rules
```javascript
/**
 * Validation functions for data integrity
 */
const Validators = {
  /**
   * Validate photo file
   * @param {File} file - File object to validate
   * @returns {ValidationResult} Validation result
   */
  validatePhotoFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/tiff'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    return {
      isValid: allowedTypes.includes(file.type) && file.size <= maxSize,
      errors: []
    };
  },

  /**
   * Validate album name
   * @param {string} name - Album name to validate
   * @returns {ValidationResult} Validation result
   */
  validateAlbumName(name) {
    return {
      isValid: typeof name === 'string' && name.trim().length > 0,
      errors: name.trim().length === 0 ? ['Album name cannot be empty'] : []
    };
  },

  /**
   * Validate date period format
   * @param {string} datePeriod - Date period to validate
   * @returns {ValidationResult} Validation result
   */
  validateDatePeriod(datePeriod) {
    const pattern = /^(\d{4}-\d{2}|undated)$/;
    return {
      isValid: pattern.test(datePeriod),
      errors: pattern.test(datePeriod) ? [] : ['Invalid date period format']
    };
  }
};
```
