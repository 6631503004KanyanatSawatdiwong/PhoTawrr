/**
 * AlbumService
 * Album management service for creation, organization, and reordering
 * Implements contract from api-contracts.md
 */

import { Album } from '../models/Album.js';
import { AlbumError, DatabaseError, ValidationError } from '../lib/errors.js';

export class AlbumService {
  constructor(databaseService) {
    this.db = databaseService;
  }

  /**
   * Get all albums with display order
   * @returns {Promise<Album[]>} Array of album objects sorted by display_order
   * @throws {DatabaseError} When query fails
   */
  async getAllAlbums() {
    try {
      const rows = await this.db.all(
        'SELECT * FROM albums ORDER BY display_order ASC, created_at DESC'
      );

      return rows.map(row => Album.fromDbRow(row));
    } catch (error) {
      throw new DatabaseError('Failed to get all albums', 'SELECT * FROM albums', [], error);
    }
  }

  /**
   * Create new album for date period
   * @param {string} datePeriod - Date period in YYYY-MM format or "undated"
   * @param {string} name - Human-readable album name
   * @returns {Promise<Album>} Created album object
   * @throws {AlbumError} When creation fails
   */
  async createAlbum(datePeriod, name) {
    if (!datePeriod || !name) {
      throw new ValidationError('Date period and name are required', 'datePeriod/name', { datePeriod, name });
    }

    // Check if album already exists for this date period
    const existingAlbum = await this.getAlbumByDatePeriod(datePeriod);
    if (existingAlbum) {
      throw new AlbumError(`Album already exists for date period: ${datePeriod}`, existingAlbum.id);
    }

    try {
      // Calculate display order for the new album
      const existingAlbums = await this.getAllAlbums();
      const displayOrder = Album.calculateDisplayOrder(existingAlbums, datePeriod);

      // Create album instance
      const album = new Album({
        name: name.trim(),
        datePeriod,
        displayOrder,
        photoCount: 0,
        coverPhotoId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Validate album data
      const validation = album.validate();
      if (!validation.isValid) {
        throw new AlbumError(`Invalid album data: ${validation.errors.join(', ')}`);
      }

      // Insert into database
      const insertResult = await this.db.execute(
        `INSERT INTO albums (name, date_period, display_order, photo_count, cover_photo_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          album.name,
          album.datePeriod,
          album.displayOrder,
          album.photoCount,
          album.coverPhotoId,
          album.createdAt.toISOString(),
          album.updatedAt.toISOString()
        ]
      );

      album.id = insertResult.lastInsertRowid;
      return album;
    } catch (error) {
      if (error instanceof AlbumError || error instanceof ValidationError) {
        throw error;
      }
      throw new AlbumError(`Failed to create album: ${error.message}`, null, error);
    }
  }

  /**
   * Update album display order
   * @param {number} albumId - Album identifier
   * @param {number} newOrder - New display order position
   * @returns {Promise<boolean>} Success status
   * @throws {DatabaseError} When update fails
   */
  async updateAlbumOrder(albumId, newOrder) {
    if (!albumId || albumId <= 0) {
      throw new ValidationError('Invalid album ID', 'albumId', albumId);
    }

    if (typeof newOrder !== 'number' || newOrder < 0) {
      throw new ValidationError('Invalid display order', 'newOrder', newOrder);
    }

    try {
      const updateResult = await this.db.execute(
        'UPDATE albums SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newOrder, albumId]
      );

      if (updateResult.changes === 0) {
        throw new AlbumError('Album not found', albumId);
      }

      return true;
    } catch (error) {
      if (error instanceof AlbumError) {
        throw error;
      }
      throw new DatabaseError('Failed to update album order', null, [albumId, newOrder], error);
    }
  }

  /**
   * Reorder albums based on drag-drop operation
   * @param {number[]} albumIds - Array of album IDs in new order
   * @returns {Promise<boolean>} Success status
   * @throws {DatabaseError} When reordering fails
   */
  async reorderAlbums(albumIds) {
    if (!Array.isArray(albumIds) || albumIds.length === 0) {
      throw new ValidationError('Invalid album IDs array', 'albumIds', albumIds);
    }

    // Validate all IDs are positive numbers
    for (const id of albumIds) {
      if (!id || id <= 0) {
        throw new ValidationError('Invalid album ID in array', 'albumId', id);
      }
    }

    try {
      const transaction = await this.db.beginTransaction();

      try {
        // Update display order for each album
        for (let i = 0; i < albumIds.length; i++) {
          const updateResult = await this.db.execute(
            'UPDATE albums SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [i, albumIds[i]]
          );

          if (updateResult.changes === 0) {
            throw new AlbumError(`Album not found: ${albumIds[i]}`, albumIds[i]);
          }
        }

        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      if (error instanceof AlbumError) {
        throw error;
      }
      throw new DatabaseError('Failed to reorder albums', null, albumIds, error);
    }
  }

  /**
   * Get or create album for photo date
   * @param {Date|null} photoDate - Photo date from EXIF data
   * @returns {Promise<Album>} Existing or newly created album
   * @throws {AlbumError} When album creation fails
   */
  async getOrCreateAlbumForDate(photoDate) {
    let datePeriod, albumName;

    if (!photoDate || !(photoDate instanceof Date) || isNaN(photoDate.getTime())) {
      datePeriod = 'undated';
      albumName = 'Undated Photos';
    } else {
      const year = photoDate.getFullYear();
      const month = String(photoDate.getMonth() + 1).padStart(2, '0');
      datePeriod = `${year}-${month}`;
      albumName = Album.generateNameFromDatePeriod(datePeriod);
    }

    try {
      // Check if album already exists
      let album = await this.getAlbumByDatePeriod(datePeriod);
      
      if (!album) {
        // Create new album
        album = await this.createAlbum(datePeriod, albumName);
      }

      return album;
    } catch (error) {
      throw new AlbumError(`Failed to get or create album for date: ${error.message}`, null, error);
    }
  }

  /**
   * Get album by date period
   * @param {string} datePeriod - Date period identifier
   * @returns {Promise<Album|null>} Album instance or null if not found
   */
  async getAlbumByDatePeriod(datePeriod) {
    if (!datePeriod) {
      return null;
    }

    try {
      const row = await this.db.get(
        'SELECT * FROM albums WHERE date_period = ?',
        [datePeriod]
      );

      return row ? Album.fromDbRow(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to get album by date period', null, [datePeriod], error);
    }
  }

  /**
   * Get album by ID
   * @param {number} albumId - Album identifier
   * @returns {Promise<Album|null>} Album instance or null if not found
   */
  async getAlbumById(albumId) {
    if (!albumId || albumId <= 0) {
      return null;
    }

    try {
      const row = await this.db.get('SELECT * FROM albums WHERE id = ?', [albumId]);
      return row ? Album.fromDbRow(row) : null;
    } catch (error) {
      throw new DatabaseError('Failed to get album by ID', null, [albumId], error);
    }
  }

  /**
   * Update album metadata
   * @param {number} albumId - Album identifier
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} Success status
   */
  async updateAlbum(albumId, updates) {
    if (!albumId || albumId <= 0) {
      throw new ValidationError('Invalid album ID', 'albumId', albumId);
    }

    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('Invalid updates object', 'updates', updates);
    }

    // Get current album
    const album = await this.getAlbumById(albumId);
    if (!album) {
      throw new AlbumError('Album not found', albumId);
    }

    try {
      const allowedFields = ['name', 'photo_count', 'cover_photo_id'];
      const updateFields = [];
      const updateValues = [];

      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length === 0) {
        return true; // No valid fields to update
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(albumId);

      const sql = `UPDATE albums SET ${updateFields.join(', ')} WHERE id = ?`;
      const updateResult = await this.db.execute(sql, updateValues);

      return updateResult.changes > 0;
    } catch (error) {
      throw new DatabaseError('Failed to update album', null, [albumId, updates], error);
    }
  }

  /**
   * Delete album and handle photo reassignment
   * @param {number} albumId - Album identifier
   * @param {number|null} targetAlbumId - Album to move photos to (null for undated)
   * @returns {Promise<boolean>} Success status
   */
  async deleteAlbum(albumId, targetAlbumId = null) {
    if (!albumId || albumId <= 0) {
      throw new ValidationError('Invalid album ID', 'albumId', albumId);
    }

    // Cannot delete album if it has photos without a target
    const photoCount = await this.getAlbumPhotoCount(albumId);
    if (photoCount > 0 && !targetAlbumId) {
      // Get or create undated album as default target
      const undatedAlbum = await this.getOrCreateAlbumForDate(null);
      targetAlbumId = undatedAlbum.id;
    }

    try {
      const transaction = await this.db.beginTransaction();

      try {
        // Move photos to target album if needed
        if (photoCount > 0 && targetAlbumId) {
          await this.db.execute(
            'UPDATE photos SET album_id = ? WHERE album_id = ?',
            [targetAlbumId, albumId]
          );

          // Update photo counts
          await this.updateAlbumPhotoCount(targetAlbumId);
        }

        // Delete album
        const deleteResult = await this.db.execute(
          'DELETE FROM albums WHERE id = ?',
          [albumId]
        );

        if (deleteResult.changes === 0) {
          throw new AlbumError('Album not found', albumId);
        }

        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      if (error instanceof AlbumError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete album', null, [albumId, targetAlbumId], error);
    }
  }

  /**
   * Get album photo count
   * @param {number} albumId - Album identifier
   * @returns {Promise<number>} Photo count
   */
  async getAlbumPhotoCount(albumId) {
    if (!albumId || albumId <= 0) {
      return 0;
    }

    try {
      const result = await this.db.get(
        'SELECT COUNT(*) as count FROM photos WHERE album_id = ?',
        [albumId]
      );
      return result ? result.count : 0;
    } catch (error) {
      throw new DatabaseError('Failed to get album photo count', null, [albumId], error);
    }
  }

  /**
   * Update album photo count
   * @param {number} albumId - Album identifier
   * @returns {Promise<boolean>} Success status
   */
  async updateAlbumPhotoCount(albumId) {
    const count = await this.getAlbumPhotoCount(albumId);
    return await this.updateAlbum(albumId, { photo_count: count });
  }

  /**
   * Update album cover photo
   * @param {number} albumId - Album identifier
   * @param {number|null} photoId - Photo ID to set as cover (null to auto-select)
   * @returns {Promise<boolean>} Success status
   */
  async updateAlbumCover(albumId, photoId = null) {
    if (!albumId || albumId <= 0) {
      throw new ValidationError('Invalid album ID', 'albumId', albumId);
    }

    let coverPhotoId = photoId;

    if (!coverPhotoId) {
      // Auto-select cover photo (most recent by date taken)
      const coverPhoto = await this.db.get(
        `SELECT id FROM photos 
         WHERE album_id = ? 
         ORDER BY date_taken DESC, date_added DESC 
         LIMIT 1`,
        [albumId]
      );
      coverPhotoId = coverPhoto ? coverPhoto.id : null;
    }

    return await this.updateAlbum(albumId, { cover_photo_id: coverPhotoId });
  }

  /**
   * Get albums with statistics
   * @returns {Promise<Object[]>} Albums with photo counts and date ranges
   */
  async getAlbumsWithStats() {
    try {
      const rows = await this.db.all(`
        SELECT 
          a.*,
          COUNT(p.id) as actual_photo_count,
          MIN(p.date_taken) as earliest_photo,
          MAX(p.date_taken) as latest_photo
        FROM albums a
        LEFT JOIN photos p ON a.id = p.album_id
        GROUP BY a.id
        ORDER BY a.display_order ASC, a.created_at DESC
      `);

      return rows.map(row => {
        const album = Album.fromDbRow(row);
        return {
          ...album.toJSON(),
          actualPhotoCount: row.actual_photo_count || 0,
          earliestPhoto: row.earliest_photo ? new Date(row.earliest_photo) : null,
          latestPhoto: row.latest_photo ? new Date(row.latest_photo) : null
        };
      });
    } catch (error) {
      throw new DatabaseError('Failed to get albums with statistics', null, [], error);
    }
  }

  /**
   * Search albums by name or date period
   * @param {string} query - Search query
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Album[]>} Array of matching albums
   */
  async searchAlbums(query, limit = 20) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      const rows = await this.db.all(
        `SELECT * FROM albums 
         WHERE LOWER(name) LIKE ? 
            OR LOWER(date_period) LIKE ?
         ORDER BY display_order ASC 
         LIMIT ?`,
        [searchTerm, searchTerm, limit]
      );

      return rows.map(row => Album.fromDbRow(row));
    } catch (error) {
      throw new DatabaseError('Failed to search albums', null, [query, limit], error);
    }
  }

  /**
   * Get albums by year
   * @param {number} year - Year to filter by
   * @returns {Promise<Album[]>} Albums for the specified year
   */
  async getAlbumsByYear(year) {
    if (!year || typeof year !== 'number') {
      throw new ValidationError('Invalid year', 'year', year);
    }

    try {
      const rows = await this.db.all(
        `SELECT * FROM albums 
         WHERE date_period LIKE ? 
         ORDER BY date_period DESC`,
        [`${year}-%`]
      );

      return rows.map(row => Album.fromDbRow(row));
    } catch (error) {
      throw new DatabaseError('Failed to get albums by year', null, [year], error);
    }
  }

  /**
   * Get available years from albums
   * @returns {Promise<number[]>} Array of years that have albums
   */
  async getAvailableYears() {
    try {
      const rows = await this.db.all(`
        SELECT DISTINCT SUBSTR(date_period, 1, 4) as year
        FROM albums 
        WHERE date_period != 'undated'
        ORDER BY year DESC
      `);

      return rows.map(row => parseInt(row.year, 10)).filter(year => !isNaN(year));
    } catch (error) {
      throw new DatabaseError('Failed to get available years', null, [], error);
    }
  }

  /**
   * Merge albums (move all photos from source to target album)
   * @param {number} sourceAlbumId - Source album ID
   * @param {number} targetAlbumId - Target album ID
   * @returns {Promise<boolean>} Success status
   */
  async mergeAlbums(sourceAlbumId, targetAlbumId) {
    if (!sourceAlbumId || !targetAlbumId || sourceAlbumId === targetAlbumId) {
      throw new ValidationError('Invalid album IDs for merge', 'albumIds', { sourceAlbumId, targetAlbumId });
    }

    try {
      const transaction = await this.db.beginTransaction();

      try {
        // Move all photos from source to target album
        await this.db.execute(
          'UPDATE photos SET album_id = ? WHERE album_id = ?',
          [targetAlbumId, sourceAlbumId]
        );

        // Update target album photo count
        await this.updateAlbumPhotoCount(targetAlbumId);

        // Update target album cover if it doesn't have one
        const targetAlbum = await this.getAlbumById(targetAlbumId);
        if (targetAlbum && !targetAlbum.hasCoverPhoto()) {
          await this.updateAlbumCover(targetAlbumId);
        }

        // Delete source album
        await this.db.execute('DELETE FROM albums WHERE id = ?', [sourceAlbumId]);

        await transaction.commit();
        return true;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      throw new DatabaseError('Failed to merge albums', null, [sourceAlbumId, targetAlbumId], error);
    }
  }

  /**
   * Helper method to convert database row to Album instance
   * @param {Object} row - Database row
   * @returns {Album} Album instance
   */
  albumFromDbRow(row) {
    return Album.fromDbRow(row);
  }
}

export default AlbumService;
