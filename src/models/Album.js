/**
 * Album Model
 * Container for photos grouped by date with display ordering
 * Based on data-model.md Album entity definition
 */

export class Album {
  /**
   * Create a new Album instance
   * @param {Object} data - Album data object
   * @param {number} data.id - Unique identifier for the album
   * @param {string} data.name - Display name for the album (e.g., "January 2025")
   * @param {string} data.datePeriod - Date period identifier (YYYY-MM format or "undated")
   * @param {number} data.displayOrder - Order position on main page
   * @param {number} data.photoCount - Cached count of photos in album
   * @param {number|null} data.coverPhotoId - Foreign key to photo used as album cover
   * @param {Date} data.createdAt - Album creation timestamp
   * @param {Date} data.updatedAt - Last modification timestamp
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.datePeriod = data.datePeriod || '';
    this.displayOrder = data.displayOrder || 0;
    this.photoCount = data.photoCount || 0;
    this.coverPhotoId = data.coverPhotoId || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate album data according to business rules
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    // Name validation
    if (!this.name || typeof this.name !== 'string' || this.name.trim() === '') {
      errors.push('Album name cannot be empty');
    }

    // Date period validation
    if (!this.datePeriod || typeof this.datePeriod !== 'string') {
      errors.push('Date period is required');
    } else {
      const datePeriodPattern = /^(\d{4}-\d{2}|undated)$/;
      if (!datePeriodPattern.test(this.datePeriod)) {
        errors.push('Date period must follow YYYY-MM format or be "undated"');
      } else if (this.datePeriod !== 'undated') {
        // Validate month is 01-12
        const [year, month] = this.datePeriod.split('-');
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        
        if (monthNum < 1 || monthNum > 12) {
          errors.push('Month must be between 01 and 12');
        }
        
        if (yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
          errors.push('Year must be reasonable (1900 to current year + 1)');
        }
      }
    }

    // Display order validation
    if (typeof this.displayOrder !== 'number' || this.displayOrder < 0) {
      errors.push('Display order must be a non-negative number');
    }

    // Photo count validation
    if (typeof this.photoCount !== 'number' || this.photoCount < 0) {
      errors.push('Photo count must be a non-negative number');
    }

    // Cover photo ID validation (can be null)
    if (this.coverPhotoId !== null && (typeof this.coverPhotoId !== 'number' || this.coverPhotoId <= 0)) {
      errors.push('Cover photo ID must be a positive number or null');
    }

    // Created at validation
    if (!(this.createdAt instanceof Date)) {
      errors.push('Created at must be a Date object');
    }

    // Updated at validation
    if (!(this.updatedAt instanceof Date)) {
      errors.push('Updated at must be a Date object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert album instance to database row format
   * @returns {Object} Database row object
   */
  toDbRow() {
    return {
      id: this.id,
      name: this.name,
      date_period: this.datePeriod,
      display_order: this.displayOrder,
      photo_count: this.photoCount,
      cover_photo_id: this.coverPhotoId,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString()
    };
  }

  /**
   * Create Album instance from database row
   * @param {Object} row - Database row object
   * @returns {Album} Album instance
   */
  static fromDbRow(row) {
    return new Album({
      id: row.id,
      name: row.name,
      datePeriod: row.date_period,
      displayOrder: row.display_order,
      photoCount: row.photo_count,
      coverPhotoId: row.cover_photo_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  /**
   * Create Album for a specific date period
   * @param {Date|null} photoDate - Date from photo EXIF data
   * @param {Object} options - Additional options
   * @param {number} options.displayOrder - Display order for the album
   * @returns {Album} Album instance
   */
  static createForDate(photoDate, options = {}) {
    let datePeriod, name;

    if (!photoDate || !(photoDate instanceof Date)) {
      datePeriod = 'undated';
      name = 'Undated Photos';
    } else {
      const year = photoDate.getFullYear();
      const month = String(photoDate.getMonth() + 1).padStart(2, '0');
      datePeriod = `${year}-${month}`;
      
      // Create human-readable name
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      name = `${monthNames[photoDate.getMonth()]} ${year}`;
    }

    return new Album({
      name,
      datePeriod,
      displayOrder: options.displayOrder || 0,
      photoCount: 0,
      coverPhotoId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Update album photo count
   * @param {number} count - New photo count
   */
  updatePhotoCount(count) {
    if (typeof count === 'number' && count >= 0) {
      this.photoCount = count;
      this.updatedAt = new Date();
    }
  }

  /**
   * Set cover photo
   * @param {number|null} photoId - ID of photo to use as cover
   */
  setCoverPhoto(photoId) {
    this.coverPhotoId = photoId;
    this.updatedAt = new Date();
  }

  /**
   * Update display order
   * @param {number} order - New display order
   */
  updateDisplayOrder(order) {
    if (typeof order === 'number' && order >= 0) {
      this.displayOrder = order;
      this.updatedAt = new Date();
    }
  }

  /**
   * Check if album has photos
   * @returns {boolean} True if album contains photos
   */
  hasPhotos() {
    return this.photoCount > 0;
  }

  /**
   * Check if album has a cover photo
   * @returns {boolean} True if cover photo is set
   */
  hasCoverPhoto() {
    return this.coverPhotoId !== null && this.coverPhotoId > 0;
  }

  /**
   * Check if album is for undated photos
   * @returns {boolean} True if this is the undated photos album
   */
  isUndatedAlbum() {
    return this.datePeriod === 'undated';
  }

  /**
   * Get the year from the date period
   * @returns {number|null} Year number or null if undated
   */
  getYear() {
    if (this.isUndatedAlbum()) {
      return null;
    }
    const [year] = this.datePeriod.split('-');
    return parseInt(year, 10);
  }

  /**
   * Get the month from the date period
   * @returns {number|null} Month number (1-12) or null if undated
   */
  getMonth() {
    if (this.isUndatedAlbum()) {
      return null;
    }
    const [, month] = this.datePeriod.split('-');
    return parseInt(month, 10);
  }

  /**
   * Get the month name from the date period
   * @returns {string|null} Month name or null if undated
   */
  getMonthName() {
    const month = this.getMonth();
    if (!month) {
      return null;
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return monthNames[month - 1];
  }

  /**
   * Get formatted date range for display
   * @returns {string} Formatted date range string
   */
  getFormattedDateRange() {
    if (this.isUndatedAlbum()) {
      return 'Undated';
    }

    const year = this.getYear();
    const monthName = this.getMonthName();
    return `${monthName} ${year}`;
  }

  /**
   * Compare albums for sorting by date period
   * @param {Album} other - Another album to compare
   * @returns {number} -1, 0, or 1 for sorting
   */
  compareByDatePeriod(other) {
    // Undated albums go to the end
    if (this.isUndatedAlbum() && !other.isUndatedAlbum()) {
      return 1;
    }
    if (!this.isUndatedAlbum() && other.isUndatedAlbum()) {
      return -1;
    }
    if (this.isUndatedAlbum() && other.isUndatedAlbum()) {
      return 0;
    }

    // Compare by date period (more recent first)
    return other.datePeriod.localeCompare(this.datePeriod);
  }

  /**
   * Compare albums for sorting by display order
   * @param {Album} other - Another album to compare
   * @returns {number} -1, 0, or 1 for sorting
   */
  compareByDisplayOrder(other) {
    return this.displayOrder - other.displayOrder;
  }

  /**
   * Clone the album instance
   * @returns {Album} New Album instance with same data
   */
  clone() {
    return new Album({
      id: this.id,
      name: this.name,
      datePeriod: this.datePeriod,
      displayOrder: this.displayOrder,
      photoCount: this.photoCount,
      coverPhotoId: this.coverPhotoId,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt)
    });
  }

  /**
   * Convert to plain object for JSON serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      datePeriod: this.datePeriod,
      displayOrder: this.displayOrder,
      photoCount: this.photoCount,
      coverPhotoId: this.coverPhotoId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Generate suggested album name from date period
   * @param {string} datePeriod - Date period in YYYY-MM format or "undated"
   * @returns {string} Suggested album name
   */
  static generateNameFromDatePeriod(datePeriod) {
    if (datePeriod === 'undated') {
      return 'Undated Photos';
    }

    const [year, month] = datePeriod.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  /**
   * Calculate display order for chronological insertion
   * @param {Album[]} existingAlbums - Array of existing albums
   * @param {string} datePeriod - Date period for new album
   * @returns {number} Suggested display order
   */
  static calculateDisplayOrder(existingAlbums, datePeriod) {
    if (datePeriod === 'undated') {
      // Undated albums go at the end
      const maxOrder = Math.max(...existingAlbums.map(a => a.displayOrder), -1);
      return maxOrder + 1;
    }

    // Find insertion point based on chronological order (newest first)
    const sortedAlbums = existingAlbums
      .filter(a => !a.isUndatedAlbum())
      .sort((a, b) => b.datePeriod.localeCompare(a.datePeriod));

    let insertOrder = 0;
    for (const album of sortedAlbums) {
      if (datePeriod > album.datePeriod) {
        insertOrder = album.displayOrder;
        break;
      }
      insertOrder = album.displayOrder + 1;
    }

    return insertOrder;
  }
}

export default Album;
