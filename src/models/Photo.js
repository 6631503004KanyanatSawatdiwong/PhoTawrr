/**
 * Photo Model
 * Represents an individual photo file with its metadata and organizational information
 * Based on data-model.md Photo entity definition
 */

export class Photo {
  /**
   * Create a new Photo instance
   * @param {Object} data - Photo data object
   * @param {number} data.id - Unique identifier for the photo
   * @param {string} data.filePath - Absolute path to the photo file on local system
   * @param {string} data.fileName - Original filename of the photo
   * @param {number} data.fileSize - File size in bytes
   * @param {Date|null} data.dateTaken - Date when photo was taken (from EXIF data)
   * @param {Date} data.dateAdded - When photo was added to system
   * @param {number} data.albumId - Foreign key reference to album
   * @param {number} data.width - Original photo width in pixels
   * @param {number} data.height - Original photo height in pixels
   * @param {string|null} data.thumbnailData - Base64 encoded thumbnail image data
   * @param {Object|null} data.exifData - Additional EXIF metadata
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.filePath = data.filePath || '';
    this.fileName = data.fileName || '';
    this.fileSize = data.fileSize || 0;
    this.dateTaken = data.dateTaken || null;
    this.dateAdded = data.dateAdded || new Date();
    this.albumId = data.albumId || null;
    this.width = data.width || 0;
    this.height = data.height || 0;
    this.thumbnailData = data.thumbnailData || null;
    this.exifData = data.exifData || null;
  }

  /**
   * Validate photo data according to business rules
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    // File path validation
    if (!this.filePath || typeof this.filePath !== 'string') {
      errors.push('File path is required and must be a string');
    }

    // File name validation
    if (!this.fileName || typeof this.fileName !== 'string' || this.fileName.trim() === '') {
      errors.push('File name cannot be empty');
    }

    // File size validation
    if (this.fileSize !== null && this.fileSize !== undefined) {
      if (typeof this.fileSize !== 'number' || this.fileSize < 0) {
        errors.push('File size must be a positive number');
      }
    }

    // Date taken validation (can be null)
    if (this.dateTaken !== null && !(this.dateTaken instanceof Date)) {
      errors.push('Date taken must be a Date object or null');
    }

    // Date added validation
    if (!(this.dateAdded instanceof Date)) {
      errors.push('Date added must be a Date object');
    }

    // Album ID validation
    if (this.albumId !== null && (typeof this.albumId !== 'number' || this.albumId <= 0)) {
      errors.push('Album ID must be a positive number or null');
    }

    // Width and height validation
    if (this.width !== null && this.width !== undefined) {
      if (typeof this.width !== 'number' || this.width <= 0) {
        errors.push('Width must be a positive integer');
      }
    }

    if (this.height !== null && this.height !== undefined) {
      if (typeof this.height !== 'number' || this.height <= 0) {
        errors.push('Height must be a positive integer');
      }
    }

    // Thumbnail data validation (can be null)
    if (this.thumbnailData !== null && typeof this.thumbnailData !== 'string') {
      errors.push('Thumbnail data must be a string or null');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert photo instance to database row format
   * @returns {Object} Database row object
   */
  toDbRow() {
    return {
      id: this.id,
      file_path: this.filePath,
      file_name: this.fileName,
      file_size: this.fileSize,
      date_taken: this.dateTaken ? this.dateTaken.toISOString() : null,
      date_added: this.dateAdded.toISOString(),
      album_id: this.albumId,
      width: this.width,
      height: this.height,
      thumbnail_data: this.thumbnailData,
      exif_data: this.exifData ? JSON.stringify(this.exifData) : null
    };
  }

  /**
   * Create Photo instance from database row
   * @param {Object} row - Database row object
   * @returns {Photo} Photo instance
   */
  static fromDbRow(row) {
    return new Photo({
      id: row.id,
      filePath: row.file_path,
      fileName: row.file_name,
      fileSize: row.file_size,
      dateTaken: row.date_taken ? new Date(row.date_taken) : null,
      dateAdded: new Date(row.date_added),
      albumId: row.album_id,
      width: row.width,
      height: row.height,
      thumbnailData: row.thumbnail_data,
      exifData: row.exif_data ? JSON.parse(row.exif_data) : null
    });
  }

  /**
   * Create Photo instance from File object
   * @param {File} file - Browser File object
   * @param {Object} options - Additional options
   * @param {number} options.albumId - Album ID to assign
   * @param {Date|null} options.dateTaken - Date taken from EXIF
   * @param {number|null} options.width - Image width
   * @param {number|null} options.height - Image height
   * @param {Object|null} options.exifData - EXIF metadata
   * @returns {Photo} Photo instance
   */
  static fromFile(file, options = {}) {
    return new Photo({
      filePath: file.name, // Will be updated with actual path during import
      fileName: file.name,
      fileSize: file.size,
      dateTaken: options.dateTaken || null,
      dateAdded: new Date(),
      albumId: options.albumId || null,
      width: options.width || null,
      height: options.height || null,
      thumbnailData: null, // Generated later
      exifData: options.exifData || null
    });
  }

  /**
   * Check if photo has valid image dimensions
   * @returns {boolean} True if width and height are set and positive
   */
  hasValidDimensions() {
    return this.width > 0 && this.height > 0;
  }

  /**
   * Check if photo has thumbnail data
   * @returns {boolean} True if thumbnail data is available
   */
  hasThumbnail() {
    return this.thumbnailData !== null && this.thumbnailData.length > 0;
  }

  /**
   * Check if photo has EXIF metadata
   * @returns {boolean} True if EXIF data is available
   */
  hasExifData() {
    return this.exifData !== null && Object.keys(this.exifData).length > 0;
  }

  /**
   * Get photo aspect ratio
   * @returns {number|null} Aspect ratio (width/height) or null if dimensions not available
   */
  getAspectRatio() {
    if (!this.hasValidDimensions()) {
      return null;
    }
    return this.width / this.height;
  }

  /**
   * Get formatted file size
   * @returns {string} Human-readable file size
   */
  getFormattedFileSize() {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if photo has thumbnail data
   * @returns {boolean} Whether photo has thumbnail
   */
  hasThumbnail() {
    return !!(this.thumbnailData && this.thumbnailData.length > 0);
  }

  /**
   * Get photo file extension
   * @returns {string} File extension in lowercase
   */
  getFileExtension() {
    if (!this.fileName) {
      return '';
    }
    const lastDot = this.fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : this.fileName.slice(lastDot + 1).toLowerCase();
  }

  /**
   * Check if photo is a supported image format
   * @returns {boolean} True if photo format is supported
   */
  isSupportedFormat() {
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'tiff', 'tif'];
    return supportedExtensions.includes(this.getFileExtension());
  }

  /**
   * Clone the photo instance
   * @returns {Photo} New Photo instance with same data
   */
  clone() {
    return new Photo({
      id: this.id,
      filePath: this.filePath,
      fileName: this.fileName,
      fileSize: this.fileSize,
      dateTaken: this.dateTaken ? new Date(this.dateTaken) : null,
      dateAdded: new Date(this.dateAdded),
      albumId: this.albumId,
      width: this.width,
      height: this.height,
      thumbnailData: this.thumbnailData,
      exifData: this.exifData ? { ...this.exifData } : null
    });
  }

  /**
   * Convert to plain object for JSON serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      filePath: this.filePath,
      fileName: this.fileName,
      fileSize: this.fileSize,
      dateTaken: this.dateTaken ? this.dateTaken.toISOString() : null,
      dateAdded: this.dateAdded.toISOString(),
      albumId: this.albumId,
      width: this.width,
      height: this.height,
      thumbnailData: this.thumbnailData,
      exifData: this.exifData
    };
  }
}

export default Photo;
