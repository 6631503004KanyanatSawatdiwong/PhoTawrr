/**
 * Contract Tests: AlbumService
 * These tests validate the AlbumService interface contract
 * Tests should FAIL initially (no implementation yet)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AlbumService } from '../src/services/AlbumService.js';

describe('AlbumService Contract Tests', () => {
  let albumService;

  beforeEach(async () => {
    albumService = new AlbumService();
    await albumService.initialize();
  });

  afterEach(async () => {
    await albumService.cleanup();
  });

  describe('getAllAlbums', () => {
    it('should return array of albums sorted by display order', async () => {
      const albums = await albumService.getAllAlbums();

      expect(Array.isArray(albums)).toBe(true);
      
      // Verify sorting by display order
      for (let i = 1; i < albums.length; i++) {
        expect(albums[i].displayOrder).toBeGreaterThanOrEqual(albums[i - 1].displayOrder);
      }

      // Verify album structure
      albums.forEach(album => {
        expect(album).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          datePeriod: expect.any(String),
          displayOrder: expect.any(Number),
          photoCount: expect.any(Number),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        });
      });
    });

    it('should return empty array when no albums exist', async () => {
      // Test with fresh database
      const albums = await albumService.getAllAlbums();
      expect(albums).toEqual([]);
    });

    it('should throw DatabaseError when query fails', async () => {
      // Simulate database error by corrupting connection
      await albumService.corruptConnection();
      
      await expect(albumService.getAllAlbums())
        .rejects.toThrow('DatabaseError');
    });
  });

  describe('createAlbum', () => {
    it('should create album with valid date period and name', async () => {
      const datePeriod = '2025-09';
      const name = 'September 2025';

      const album = await albumService.createAlbum(datePeriod, name);

      expect(album).toMatchObject({
        id: expect.any(Number),
        name: name,
        datePeriod: datePeriod,
        displayOrder: expect.any(Number),
        photoCount: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });

      expect(album.id).toBeGreaterThan(0);
    });

    it('should create undated album for photos without date', async () => {
      const datePeriod = 'undated';
      const name = 'Undated Photos';

      const album = await albumService.createAlbum(datePeriod, name);

      expect(album.datePeriod).toBe('undated');
      expect(album.name).toBe(name);
    });

    it('should throw AlbumError for invalid date period format', async () => {
      await expect(albumService.createAlbum('invalid-date', 'Test Album'))
        .rejects.toThrow('AlbumError');
    });

    it('should throw AlbumError for empty album name', async () => {
      await expect(albumService.createAlbum('2025-09', ''))
        .rejects.toThrow('AlbumError');
    });
  });

  describe('updateAlbumOrder', () => {
    it('should update album display order successfully', async () => {
      // Create test album
      const album = await albumService.createAlbum('2025-09', 'Test Album');
      const newOrder = 10;

      const result = await albumService.updateAlbumOrder(album.id, newOrder);
      expect(result).toBe(true);

      // Verify order was updated
      const updatedAlbum = await albumService.getAlbumById(album.id);
      expect(updatedAlbum.displayOrder).toBe(newOrder);
    });

    it('should throw DatabaseError for invalid album ID', async () => {
      await expect(albumService.updateAlbumOrder(-1, 5))
        .rejects.toThrow('DatabaseError');
    });

    it('should handle negative display order values', async () => {
      const album = await albumService.createAlbum('2025-09', 'Test Album');
      
      await expect(albumService.updateAlbumOrder(album.id, -1))
        .rejects.toThrow('AlbumError');
    });
  });

  describe('reorderAlbums', () => {
    it('should reorder multiple albums based on ID array', async () => {
      // Create test albums
      const album1 = await albumService.createAlbum('2025-08', 'August 2025');
      const album2 = await albumService.createAlbum('2025-09', 'September 2025');
      const album3 = await albumService.createAlbum('2025-10', 'October 2025');

      const newOrder = [album3.id, album1.id, album2.id];
      const result = await albumService.reorderAlbums(newOrder);

      expect(result).toBe(true);

      // Verify new order
      const albums = await albumService.getAllAlbums();
      expect(albums[0].id).toBe(album3.id);
      expect(albums[1].id).toBe(album1.id);
      expect(albums[2].id).toBe(album2.id);
    });

    it('should throw DatabaseError for invalid album IDs', async () => {
      await expect(albumService.reorderAlbums([-1, -2, -3]))
        .rejects.toThrow('DatabaseError');
    });

    it('should handle empty album ID array', async () => {
      const result = await albumService.reorderAlbums([]);
      expect(result).toBe(true); // No-op should succeed
    });
  });

  describe('getOrCreateAlbumForDate', () => {
    it('should return existing album for date', async () => {
      const photoDate = new Date('2025-09-15');
      
      // Create album first
      const existingAlbum = await albumService.createAlbum('2025-09', 'September 2025');
      
      const album = await albumService.getOrCreateAlbumForDate(photoDate);
      expect(album.id).toBe(existingAlbum.id);
      expect(album.datePeriod).toBe('2025-09');
    });

    it('should create new album for new date', async () => {
      const photoDate = new Date('2025-11-20');
      
      const album = await albumService.getOrCreateAlbumForDate(photoDate);
      
      expect(album.datePeriod).toBe('2025-11');
      expect(album.name).toBe('November 2025');
      expect(album.id).toBeGreaterThan(0);
    });

    it('should create undated album for null date', async () => {
      const album = await albumService.getOrCreateAlbumForDate(null);
      
      expect(album.datePeriod).toBe('undated');
      expect(album.name).toBe('Undated Photos');
    });

    it('should handle invalid date objects', async () => {
      const invalidDate = new Date('invalid-date-string');
      
      const album = await albumService.getOrCreateAlbumForDate(invalidDate);
      expect(album.datePeriod).toBe('undated');
    });

    it('should throw AlbumError when album creation fails', async () => {
      // Simulate database constraint violation
      await albumService.simulateConstraintViolation();
      
      await expect(albumService.getOrCreateAlbumForDate(new Date()))
        .rejects.toThrow('AlbumError');
    });
  });

  describe('Album name generation', () => {
    it('should generate human-readable names for date periods', () => {
      const testCases = [
        { datePeriod: '2025-01', expected: 'January 2025' },
        { datePeriod: '2025-06', expected: 'June 2025' },
        { datePeriod: '2025-12', expected: 'December 2025' },
        { datePeriod: 'undated', expected: 'Undated Photos' }
      ];

      testCases.forEach(({ datePeriod, expected }) => {
        const name = albumService.generateAlbumName(datePeriod);
        expect(name).toBe(expected);
      });
    });
  });
});
