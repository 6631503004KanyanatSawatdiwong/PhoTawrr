/**
 * DatabaseService
 * Database management service for SQLite operations and connection management
 * Implements contract from api-contracts.md with schema from data-model.md
 */

import { DatabaseError } from '../lib/errors.js';

export class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.SQL = null;
  }

  /**
   * Initialize SQLite database
   * @returns {Promise<boolean>} Success status
   * @throws {DatabaseError} When initialization fails
   */
  async initialize() {
    try {
      // Configure sql.js for test environment
      const config = {};
      
      // In test environment, use local WASM file
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        const path = require('path');
        const fs = require('fs');
        const wasmPath = path.resolve(require.resolve('sql.js'), '../sql-wasm.wasm');
        
        if (fs.existsSync(wasmPath)) {
          config.wasmBinary = fs.readFileSync(wasmPath);
        }
      } else {
        // In browser, use CDN URL
        config.locateFile = file => `https://sql.js.org/dist/${file}`;
      }
      
      const SQL = await initSqlJs(config);
      
      // Try to load existing database from IndexedDB
      const dbData = await this.loadFromIndexedDB();
      this.db = new SQL.Database(dbData);
      
      // Create tables if they don't exist
      await this.createTables();
      
      return true;
    } catch (error) {
      throw new DatabaseError('Failed to initialize database', null, null, error);
    }
  }

  /**
   * Create database schema with tables and indexes
   * @private
   */
  async createSchema() {
    const schema = `
      -- Albums table
      CREATE TABLE albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date_period TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        photo_count INTEGER DEFAULT 0,
        cover_photo_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cover_photo_id) REFERENCES photos(id)
      );

      -- Photos table
      CREATE TABLE photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        date_taken DATETIME,
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
        album_id INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        thumbnail_data BLOB,
        exif_data TEXT,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
      );

      -- User preferences table
      CREATE TABLE user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT NOT NULL UNIQUE,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for performance
      CREATE INDEX idx_photos_album_id ON photos(album_id);
      CREATE INDEX idx_photos_date_taken ON photos(date_taken);
      CREATE INDEX idx_albums_display_order ON albums(display_order);
      CREATE INDEX idx_albums_date_period ON albums(date_period);
      CREATE INDEX idx_user_preferences_key ON user_preferences(setting_key);
    `;

    // Execute schema creation
    this.db.exec(schema);
    
    // Save to IndexedDB after schema creation
    await this.saveToIndexedDB();
  }

  /**
   * Execute SQL query with parameters
   * @param {string} sql - SQL query string
   * @param {any[]} params - Query parameters (default: [])
   * @returns {Promise<QueryResult>} Query execution result
   * @throws {DatabaseError} When query execution fails
   */
  async execute(sql, params = []) {
    this.ensureInitialized();
    
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params);
      stmt.free();

      // Auto-save to IndexedDB after write operations
      if (this.isWriteOperation(sql)) {
        await this.saveToIndexedDB();
      }

      return {
        changes: result.changes || 0,
        lastInsertRowid: result.lastInsertRowid || null,
        rows: []
      };
    } catch (error) {
      throw new DatabaseError(`Query execution failed: ${error.message}`, sql, params, error);
    }
  }

  /**
   * Execute SQL query and return first row
   * @param {string} sql - SQL query string
   * @param {any[]} params - Query parameters (default: [])
   * @returns {Promise<Object|null>} First row or null if no results
   * @throws {DatabaseError} When query execution fails
   */
  async get(sql, params = []) {
    this.ensureInitialized();
    
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.get(params);
      stmt.free();
      
      return result || null;
    } catch (error) {
      throw new DatabaseError(`Query execution failed: ${error.message}`, sql, params, error);
    }
  }

  /**
   * Execute SQL query and return all rows
   * @param {string} sql - SQL query string
   * @param {any[]} params - Query parameters (default: [])
   * @returns {Promise<Object[]>} Array of result rows
   * @throws {DatabaseError} When query execution fails
   */
  async all(sql, params = []) {
    this.ensureInitialized();
    
    try {
      const stmt = this.db.prepare(sql);
      const rows = [];
      
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      
      stmt.free();
      return rows;
    } catch (error) {
      throw new DatabaseError(`Query execution failed: ${error.message}`, sql, params, error);
    }
  }

  /**
   * Begin database transaction
   * @returns {Promise<Transaction>} Transaction object
   * @throws {DatabaseError} When transaction cannot be started
   */
  async beginTransaction() {
    this.ensureInitialized();
    
    try {
      await this.execute('BEGIN TRANSACTION');
      
      return {
        commit: async () => {
          await this.execute('COMMIT');
          await this.saveToIndexedDB();
        },
        rollback: async () => {
          await this.execute('ROLLBACK');
        }
      };
    } catch (error) {
      throw new DatabaseError('Failed to begin transaction', 'BEGIN TRANSACTION', [], error);
    }
  }

  /**
   * Close database connection
   * @returns {Promise<boolean>} Close operation success status
   */
  async close() {
    if (this.db) {
      try {
        await this.saveToIndexedDB();
        this.db.close();
        this.db = null;
        this.isInitialized = false;
        return true;
      } catch (error) {
        console.warn('Error during database close:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Save database to IndexedDB for persistence
   * @private
   */
  async saveToIndexedDB() {
    if (!this.db) return;

    try {
      const data = this.db.export();
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('PhoTawrrDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['database'], 'readwrite');
          const store = transaction.objectStore('database');
          
          store.put(data, 'main');
          
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database');
          }
        };
      });
    } catch (error) {
      console.warn('Failed to save database to IndexedDB:', error);
    }
  }

  /**
   * Load database from IndexedDB
   * @private
   * @returns {Promise<Uint8Array|null>} Database data or null if not found
   */
  async loadFromIndexedDB() {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('PhoTawrrDB', 1);
        
        request.onerror = () => resolve(null);
        request.onsuccess = () => {
          const db = request.result;
          
          if (!db.objectStoreNames.contains('database')) {
            db.close();
            resolve(null);
            return;
          }
          
          const transaction = db.transaction(['database'], 'readonly');
          const store = transaction.objectStore('database');
          const getRequest = store.get('main');
          
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result || null);
          };
          getRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database');
          }
          db.close();
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Failed to load database from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Ensure database is initialized
   * @private
   * @throws {DatabaseError} When database is not initialized
   */
  ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized. Call initialize() first.');
    }
  }

  /**
   * Check if SQL query is a write operation
   * @private
   * @param {string} sql - SQL query string
   * @returns {boolean} True if write operation
   */
  isWriteOperation(sql) {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
    const trimmedSql = sql.trim().toUpperCase();
    return writeKeywords.some(keyword => trimmedSql.startsWith(keyword));
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStatistics() {
    this.ensureInitialized();
    
    try {
      const stats = {
        albums: await this.get('SELECT COUNT(*) as count FROM albums'),
        photos: await this.get('SELECT COUNT(*) as count FROM photos'),
        preferences: await this.get('SELECT COUNT(*) as count FROM user_preferences'),
        databaseSize: this.getDatabaseSize()
      };
      
      return {
        albumCount: stats.albums?.count || 0,
        photoCount: stats.photos?.count || 0,
        preferenceCount: stats.preferences?.count || 0,
        databaseSizeBytes: stats.databaseSize
      };
    } catch (error) {
      throw new DatabaseError('Failed to get database statistics', null, null, error);
    }
  }

  /**
   * Get current database size in bytes
   * @private
   * @returns {number} Database size in bytes
   */
  getDatabaseSize() {
    if (!this.db) return 0;
    try {
      const data = this.db.export();
      return data.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Vacuum database to reclaim space
   * @returns {Promise<boolean>} Success status
   */
  async vacuum() {
    this.ensureInitialized();
    
    try {
      await this.execute('VACUUM');
      return true;
    } catch (error) {
      throw new DatabaseError('Failed to vacuum database', 'VACUUM', [], error);
    }
  }

  /**
   * Check database integrity
   * @returns {Promise<boolean>} True if database is healthy
   */
  async checkIntegrity() {
    this.ensureInitialized();
    
    try {
      const result = await this.get('PRAGMA integrity_check');
      return result && result.integrity_check === 'ok';
    } catch (error) {
      throw new DatabaseError('Failed to check database integrity', 'PRAGMA integrity_check', [], error);
    }
  }

  /**
   * Get database schema version (for future migrations)
   * @returns {Promise<number>} Schema version
   */
  async getSchemaVersion() {
    this.ensureInitialized();
    
    try {
      const result = await this.get('PRAGMA user_version');
      return result ? result.user_version : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Set database schema version
   * @param {number} version - Schema version to set
   * @returns {Promise<boolean>} Success status
   */
  async setSchemaVersion(version) {
    this.ensureInitialized();
    
    try {
      await this.execute(`PRAGMA user_version = ${version}`);
      return true;
    } catch (error) {
      throw new DatabaseError(`Failed to set schema version to ${version}`, `PRAGMA user_version = ${version}`, [], error);
    }
  }

  /**
   * Export database as SQL dump
   * @returns {Promise<string>} SQL dump string
   */
  async exportSQL() {
    this.ensureInitialized();
    
    try {
      // Get all table data and generate INSERT statements
      const tables = await this.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      let sqlDump = '';
      
      for (const table of tables) {
        const rows = await this.all(`SELECT * FROM ${table.name}`);
        
        if (rows.length > 0) {
          sqlDump += `-- Data for table ${table.name}\n`;
          
          for (const row of rows) {
            const columns = Object.keys(row);
            const values = Object.values(row).map(value => 
              value === null ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`
            );
            
            sqlDump += `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          
          sqlDump += '\n';
        }
      }
      
      return sqlDump;
    } catch (error) {
      throw new DatabaseError('Failed to export database as SQL', null, null, error);
    }
  }

  /**
   * Clear all data from database (keep schema)
   * @returns {Promise<boolean>} Success status
   */
  async clearAllData() {
    this.ensureInitialized();
    
    try {
      const transaction = await this.beginTransaction();
      
      try {
        // Delete in correct order to respect foreign keys
        await this.execute('DELETE FROM photos');
        await this.execute('DELETE FROM albums');
        await this.execute('DELETE FROM user_preferences');
        
        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      throw new DatabaseError('Failed to clear all data', null, null, error);
    }
  }
}

export default DatabaseService;
