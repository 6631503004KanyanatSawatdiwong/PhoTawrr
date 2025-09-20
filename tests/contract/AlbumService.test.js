// AlbumService Contract Test
// This test MUST FAIL until AlbumService is implemented

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlbumService } from '../../src/services/AlbumService.js';

describe('AlbumService Contract Tests', () => {
  let albumService;
  let mockDatabaseService;

  beforeEach(() => {
    // Mock DatabaseService for isolated testing
    mockDatabaseService = {
      initialize: vi.fn().mockResolvedValue(true),
      execute: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 1 }),
      get: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue([])
    };

    // This will fail until AlbumService is implemented
    albumService = new AlbumService(mockDatabaseService);
  });

  describe('getAllAlbums()', () => {
    it('should return array of albums sorted by display_order', async () => {
      // Contract: getAllAlbums() returns Promise<Album[]> sorted by display_order
      const mockAlbums = [
        { id: 1, name: 'January 2025', datePeriod: '2025-01', displayOrder: 0, photoCount: 5 },
        { id: 2, name: 'February 2025', datePeriod: '2025-02', displayOrder: 1, photoCount: 3 },
        { id: 3, name: 'March 2025', datePeriod: '2025-03', displayOrder: 2, photoCount: 8 }
      ];
      mockDatabaseService.all.mockResolvedValue(mockAlbums);

      const albums = await albumService.getAllAlbums();

      expect(Array.isArray(albums)).toBe(true);
      expect(albums).toHaveLength(3);
      
      // Verify Album DTO structure
      albums.forEach(album => {
        expect(album).toHaveProperty('id');
        expect(album).toHaveProperty('name');
        expect(album).toHaveProperty('datePeriod');
        expect(album).toHaveProperty('displayOrder');
        expect(album).toHaveProperty('photoCount');
        expect(album).toHaveProperty('coverPhotoId');
        expect(album).toHaveProperty('createdAt');
        expect(album).toHaveProperty('updatedAt');
      });

      // Verify sorting by display_order
      expect(albums[0].displayOrder).toBeLessThanOrEqual(albums[1].displayOrder);
      expect(albums[1].displayOrder).toBeLessThanOrEqual(albums[2].displayOrder);
    });

    it('should return empty array when no albums exist', async () => {
      // Contract: Must return empty array when no albums found
      mockDatabaseService.all.mockResolvedValue([]);

      const albums = await albumService.getAllAlbums();

      expect(Array.isArray(albums)).toBe(true);
      expect(albums).toHaveLength(0);
    });

    it('should throw DatabaseError on query failure', async () => {
      // Contract: Must throw DatabaseError when query fails
      mockDatabaseService.all.mockRejectedValue(new Error('Database connection failed'));

      await expect(albumService.getAllAlbums()).rejects.toThrow('DatabaseError');
    });
  });

  describe('createAlbum()', () => {
    it('should create new album and return Album object', async () => {
      // Contract: createAlbum(datePeriod, name) returns Promise<Album>
      const mockAlbum = {
        id: 1,
        name: 'September 2025',
        datePeriod: '2025-09',
        displayOrder: 0,
        photoCount: 0,
        coverPhotoId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockDatabaseService.execute.mockResolvedValue({ changes: 1, lastInsertRowid: 1 });
      mockDatabaseService.get.mockResolvedValue(mockAlbum);

      const album = await albumService.createAlbum('2025-09', 'September 2025');

      expect(album).toHaveProperty('id', 1);
      expect(album).toHaveProperty('name', 'September 2025');
      expect(album).toHaveProperty('datePeriod', '2025-09');
      expect(album).toHaveProperty('displayOrder');
      expect(album).toHaveProperty('photoCount', 0);
    });

    it('should handle "undated" album creation', async () => {
      // Contract: Must support "undated" as special date period
      const mockUndatedAlbum = {
        id: 2,
        name: 'Undated Photos',
        datePeriod: 'undated',
        displayOrder: 999,
        photoCount: 0
      };
      mockDatabaseService.execute.mockResolvedValue({ changes: 1, lastInsertRowid: 2 });
      mockDatabaseService.get.mockResolvedValue(mockUndatedAlbum);

      const album = await albumService.createAlbum('undated', 'Undated Photos');

      expect(album).toHaveProperty('datePeriod', 'undated');
      expect(album).toHaveProperty('name', 'Undated Photos');
    });

    it('should throw AlbumError for invalid date period', async () => {
      // Contract: Must throw AlbumError when creation fails
      const invalidDatePeriod = 'invalid-date';

      await expect(albumService.createAlbum(invalidDatePeriod, 'Invalid Album')).rejects.toThrow('AlbumError');
    });

    it('should throw AlbumError for duplicate album', async () => {
      // Contract: Must handle duplicate album creation
      mockDatabaseService.execute.mockRejectedValue(new Error('UNIQUE constraint failed'));

      await expect(albumService.createAlbum('2025-09', 'September 2025')).rejects.toThrow('AlbumError');
    });
  });

  describe('updateAlbumOrder()', () => {
    it('should update album display order and return success', async () => {
      // Contract: updateAlbumOrder(albumId, newOrder) returns Promise<boolean>
      mockDatabaseService.execute.mockResolvedValue({ changes: 1 });

      const result = await albumService.updateAlbumOrder(1, 5);

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
      expect(mockDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([5, 1])
      );
    });

    it('should return false when album not found', async () => {
      // Contract: Must handle non-existent albums gracefully
      mockDatabaseService.execute.mockResolvedValue({ changes: 0 });

      const result = await albumService.updateAlbumOrder(999, 5);

      expect(result).toBe(false);
    });

    it('should throw DatabaseError on update failure', async () => {
      // Contract: Must throw DatabaseError on failure
      mockDatabaseService.execute.mockRejectedValue(new Error('Database error'));

      await expect(albumService.updateAlbumOrder(1, 5)).rejects.toThrow('DatabaseError');
    });
  });

  describe('reorderAlbums()', () => {
    it('should reorder multiple albums and return success', async () => {
      // Contract: reorderAlbums(albumIds) returns Promise<boolean>
      const albumIds = [3, 1, 2]; // New order
      mockDatabaseService.execute.mockResolvedValue({ changes: 1 });

      const result = await albumService.reorderAlbums(albumIds);

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
      
      // Should call execute multiple times for each album
      expect(mockDatabaseService.execute).toHaveBeenCalledTimes(albumIds.length);
    });

    it('should handle empty album list gracefully', async () => {
      // Contract: Must handle edge cases
      const result = await albumService.reorderAlbums([]);

      expect(result).toBe(true);
    });

    it('should throw DatabaseError on reordering failure', async () => {
      // Contract: Must throw DatabaseError when reordering fails
      mockDatabaseService.execute.mockRejectedValue(new Error('Transaction failed'));

      await expect(albumService.reorderAlbums([1, 2, 3])).rejects.toThrow('DatabaseError');
    });
  });

  describe('getOrCreateAlbumForDate()', () => {
    it('should return existing album for known date', async () => {
      // Contract: getOrCreateAlbumForDate(photoDate) returns Promise<Album>
      const existingAlbum = {
        id: 1,
        name: 'September 2025',
        datePeriod: '2025-09',
        displayOrder: 0
      };
      mockDatabaseService.get.mockResolvedValue(existingAlbum);

      const photoDate = new Date('2025-09-15');
      const album = await albumService.getOrCreateAlbumForDate(photoDate);

      expect(album).toEqual(existingAlbum);
      expect(mockDatabaseService.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['2025-09'])
      );
    });

    it('should create new album for unknown date', async () => {
      // Contract: Must create album if it doesn't exist
      mockDatabaseService.get.mockResolvedValue(null); // No existing album
      const newAlbum = {
        id: 2,
        name: 'October 2025',
        datePeriod: '2025-10',
        displayOrder: 1
      };
      mockDatabaseService.execute.mockResolvedValue({ changes: 1, lastInsertRowid: 2 });
      mockDatabaseService.get.mockResolvedValueOnce(null).mockResolvedValueOnce(newAlbum);

      const photoDate = new Date('2025-10-20');
      const album = await albumService.getOrCreateAlbumForDate(photoDate);

      expect(album).toEqual(newAlbum);
    });

    it('should handle null date by creating undated album', async () => {
      // Contract: Must handle photos without date metadata
      const undatedAlbum = {
        id: 3,
        name: 'Undated Photos',
        datePeriod: 'undated',
        displayOrder: 999
      };
      mockDatabaseService.get.mockResolvedValue(undatedAlbum);

      const album = await albumService.getOrCreateAlbumForDate(null);

      expect(album).toEqual(undatedAlbum);
      expect(mockDatabaseService.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['undated'])
      );
    });

    it('should throw AlbumError when album creation fails', async () => {
      // Contract: Must throw AlbumError when album creation fails
      mockDatabaseService.get.mockResolvedValue(null);
      mockDatabaseService.execute.mockRejectedValue(new Error('Creation failed'));

      const photoDate = new Date('2025-11-01');
      
      await expect(albumService.getOrCreateAlbumForDate(photoDate)).rejects.toThrow('AlbumError');
    });
  });
});
