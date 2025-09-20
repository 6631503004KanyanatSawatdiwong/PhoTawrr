/**
 * UserPreferences Model
 * Stores user interface preferences and application settings
 * Based on data-model.md UserPreferences entity definition
 */

export class UserPreferences {
  /**
   * Create a new UserPreferences instance
   * @param {Object} data - UserPreferences data object
   * @param {number} data.id - Unique identifier
   * @param {string} data.settingKey - Preference setting name
   * @param {string|Object} data.settingValue - Preference setting value
   * @param {Date} data.updatedAt - Last update timestamp
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.settingKey = data.settingKey || '';
    this.settingValue = data.settingValue || null;
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate user preferences data according to business rules
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    // Setting key validation
    if (!this.settingKey || typeof this.settingKey !== 'string' || this.settingKey.trim() === '') {
      errors.push('Setting key cannot be empty');
    }

    // Setting value validation (can be null)
    if (this.settingValue !== null) {
      // If it's a string, try to parse as JSON to validate
      if (typeof this.settingValue === 'string') {
        try {
          JSON.parse(this.settingValue);
        } catch (e) {
          errors.push('Setting value must be valid JSON string');
        }
      }
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
   * Convert preferences instance to database row format
   * @returns {Object} Database row object
   */
  toDbRow() {
    const settingValue = typeof this.settingValue === 'object' 
      ? JSON.stringify(this.settingValue) 
      : this.settingValue;

    return {
      id: this.id,
      setting_key: this.settingKey,
      setting_value: settingValue,
      updated_at: this.updatedAt.toISOString()
    };
  }

  /**
   * Create UserPreferences instance from database row
   * @param {Object} row - Database row object
   * @returns {UserPreferences} UserPreferences instance
   */
  static fromDbRow(row) {
    let settingValue = row.setting_value;
    
    // Try to parse as JSON
    if (typeof settingValue === 'string') {
      try {
        settingValue = JSON.parse(settingValue);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    return new UserPreferences({
      id: row.id,
      settingKey: row.setting_key,
      settingValue: settingValue,
      updatedAt: new Date(row.updated_at)
    });
  }

  /**
   * Get the parsed setting value
   * @returns {any} Parsed setting value
   */
  getParsedValue() {
    if (typeof this.settingValue === 'string') {
      try {
        return JSON.parse(this.settingValue);
      } catch (e) {
        return this.settingValue;
      }
    }
    return this.settingValue;
  }

  /**
   * Set the setting value (will be JSON stringified if object)
   * @param {any} value - Value to set
   */
  setValue(value) {
    this.settingValue = value;
    this.updatedAt = new Date();
  }

  /**
   * Clone the preferences instance
   * @returns {UserPreferences} New UserPreferences instance with same data
   */
  clone() {
    return new UserPreferences({
      id: this.id,
      settingKey: this.settingKey,
      settingValue: this.settingValue,
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
      settingKey: this.settingKey,
      settingValue: this.settingValue,
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

/**
 * PreferencesManager - Helper class for managing application preferences
 */
export class PreferencesManager {
  constructor() {
    this.preferences = new Map();
    this.defaultPreferences = new Map([
      ['thumbnail_size', { width: 200, height: 200 }],
      ['albums_per_row', 4],
      ['sort_direction', 'desc'],
      ['view_mode', 'grid'],
      ['auto_organize', true],
      ['show_undated_album', true],
      ['thumbnail_quality', 0.8],
      ['max_import_size', 50 * 1024 * 1024], // 50MB
      ['supported_formats', ['jpg', 'jpeg', 'png', 'heic', 'tiff']],
      ['ui_theme', 'light']
    ]);
  }

  /**
   * Load preferences from an array of UserPreferences instances
   * @param {UserPreferences[]} preferencesArray - Array of preferences
   */
  loadPreferences(preferencesArray) {
    this.preferences.clear();
    
    for (const pref of preferencesArray) {
      this.preferences.set(pref.settingKey, pref.getParsedValue());
    }
  }

  /**
   * Get a preference value with fallback to default
   * @param {string} key - Preference key
   * @param {any} fallback - Fallback value if not found
   * @returns {any} Preference value
   */
  get(key, fallback = null) {
    if (this.preferences.has(key)) {
      return this.preferences.get(key);
    }
    
    if (this.defaultPreferences.has(key)) {
      return this.defaultPreferences.get(key);
    }
    
    return fallback;
  }

  /**
   * Set a preference value
   * @param {string} key - Preference key
   * @param {any} value - Preference value
   */
  set(key, value) {
    this.preferences.set(key, value);
  }

  /**
   * Get thumbnail size setting
   * @returns {Object} Thumbnail size with width and height
   */
  getThumbnailSize() {
    return this.get('thumbnail_size', { width: 200, height: 200 });
  }

  /**
   * Get albums per row setting
   * @returns {number} Number of albums per row
   */
  getAlbumsPerRow() {
    return this.get('albums_per_row', 4);
  }

  /**
   * Get sort direction setting
   * @returns {string} Sort direction ('asc' or 'desc')
   */
  getSortDirection() {
    return this.get('sort_direction', 'desc');
  }

  /**
   * Get view mode setting
   * @returns {string} View mode ('grid' or 'list')
   */
  getViewMode() {
    return this.get('view_mode', 'grid');
  }

  /**
   * Check if auto-organize is enabled
   * @returns {boolean} True if auto-organize is enabled
   */
  isAutoOrganizeEnabled() {
    return this.get('auto_organize', true);
  }

  /**
   * Check if undated album should be shown
   * @returns {boolean} True if undated album should be shown
   */
  shouldShowUndatedAlbum() {
    return this.get('show_undated_album', true);
  }

  /**
   * Get thumbnail quality setting
   * @returns {number} Thumbnail quality (0.0 to 1.0)
   */
  getThumbnailQuality() {
    return this.get('thumbnail_quality', 0.8);
  }

  /**
   * Get maximum import file size
   * @returns {number} Maximum file size in bytes
   */
  getMaxImportSize() {
    return this.get('max_import_size', 50 * 1024 * 1024);
  }

  /**
   * Get supported file formats
   * @returns {string[]} Array of supported file extensions
   */
  getSupportedFormats() {
    return this.get('supported_formats', ['jpg', 'jpeg', 'png', 'heic', 'tiff']);
  }

  /**
   * Get UI theme setting
   * @returns {string} UI theme ('light' or 'dark')
   */
  getUITheme() {
    return this.get('ui_theme', 'light');
  }

  /**
   * Convert preferences to UserPreferences instances for database storage
   * @returns {UserPreferences[]} Array of UserPreferences instances
   */
  toUserPreferencesArray() {
    const preferencesArray = [];
    
    for (const [key, value] of this.preferences) {
      preferencesArray.push(new UserPreferences({
        settingKey: key,
        settingValue: value,
        updatedAt: new Date()
      }));
    }
    
    return preferencesArray;
  }

  /**
   * Reset all preferences to defaults
   */
  resetToDefaults() {
    this.preferences.clear();
    for (const [key, value] of this.defaultPreferences) {
      this.preferences.set(key, value);
    }
  }

  /**
   * Get all preference keys
   * @returns {string[]} Array of preference keys
   */
  getAllKeys() {
    const keys = new Set([...this.preferences.keys(), ...this.defaultPreferences.keys()]);
    return Array.from(keys);
  }

  /**
   * Export preferences as JSON
   * @returns {Object} Preferences as JSON object
   */
  exportToJSON() {
    const exported = {};
    
    for (const key of this.getAllKeys()) {
      exported[key] = this.get(key);
    }
    
    return exported;
  }

  /**
   * Import preferences from JSON
   * @param {Object} json - JSON object with preferences
   */
  importFromJSON(json) {
    this.preferences.clear();
    
    for (const [key, value] of Object.entries(json)) {
      this.preferences.set(key, value);
    }
  }

  /**
   * Validate preference value for a given key
   * @param {string} key - Preference key
   * @param {any} value - Value to validate
   * @returns {Object} Validation result with isValid and errors
   */
  validatePreference(key, value) {
    const errors = [];

    switch (key) {
      case 'thumbnail_size':
        if (!value || typeof value !== 'object' || !value.width || !value.height) {
          errors.push('Thumbnail size must have width and height properties');
        } else if (value.width < 50 || value.height < 50 || value.width > 500 || value.height > 500) {
          errors.push('Thumbnail size must be between 50x50 and 500x500 pixels');
        }
        break;

      case 'albums_per_row':
        if (typeof value !== 'number' || value < 1 || value > 10) {
          errors.push('Albums per row must be a number between 1 and 10');
        }
        break;

      case 'sort_direction':
        if (!['asc', 'desc'].includes(value)) {
          errors.push('Sort direction must be "asc" or "desc"');
        }
        break;

      case 'view_mode':
        if (!['grid', 'list'].includes(value)) {
          errors.push('View mode must be "grid" or "list"');
        }
        break;

      case 'thumbnail_quality':
        if (typeof value !== 'number' || value < 0.1 || value > 1.0) {
          errors.push('Thumbnail quality must be a number between 0.1 and 1.0');
        }
        break;

      case 'max_import_size':
        if (typeof value !== 'number' || value < 1024 || value > 100 * 1024 * 1024) {
          errors.push('Max import size must be between 1KB and 100MB');
        }
        break;

      case 'ui_theme':
        if (!['light', 'dark'].includes(value)) {
          errors.push('UI theme must be "light" or "dark"');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default UserPreferences;
