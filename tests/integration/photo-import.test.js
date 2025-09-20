// Photo Import Workflow Integration Test
// This test MUST FAIL until complete integration is implemented

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from '../../src/services/DatabaseService.js';
import { PhotoService } from '../../src/services/PhotoService.js';
import { AlbumService } from '../../src/services/AlbumService.js';
import { UIController } from '../../src/controllers/UIController.js';

describe('Photo Import Workflow Integration Tests', () => {
  let databaseService;
  let photoService;
  let albumService;
  let uiController;

  beforeEach(async () => {
    // Set up DOM for UI testing
    document.body.innerHTML = `
      <div id="app">
        <div id="loading" style="display: none;"></div>
        <div id="error" style="display: none;"></div>
        <div id="main-page">
          <button id="import-btn">Import Photos</button>
          <div id="albums-container"></div>
        </div>
      </div>
    `;

    // Initialize services - these will fail until implemented
    databaseService = new DatabaseService();
    await databaseService.initialize();
    
    photoService = new PhotoService(databaseService);
    albumService = new AlbumService(databaseService);
    uiController = new UIController(photoService, albumService);
    
    await uiController.initialize();
  });

  describe('Complete Photo Import Flow', () => {
    it('should import photos, create albums, and update UI', async () => {
      // Integration Test: Complete workflow from file selection to UI update
      
      // Step 1: User selects photos with different dates
      const mockFiles = createMockPhotoFiles([
        { name: 'vacation1.jpg', date: '2025-08-15' },
        { name: 'vacation2.jpg', date: '2025-08-15' },
        { name: 'wedding.jpg', date: '2025-09-20' },
        { name: 'no_date.jpg', date: null }
      ]);

      // Step 2: Import photos through PhotoService
      const importResult = await photoService.importPhotos(mockFiles);

      // Verify import was successful
      expect(importResult.success).toBe(true);
      expect(importResult.processedCount).toBe(4);
      expect(importResult.errorCount).toBe(0);
      expect(importResult.importedPhotos).toHaveLength(4);

      // Step 3: Verify albums were created automatically
      const albums = await albumService.getAllAlbums();
      
      expect(albums).toHaveLength(3); // August 2025, September 2025, Undated
      
      const augustAlbum = albums.find(a => a.datePeriod === '2025-08');
      const septemberAlbum = albums.find(a => a.datePeriod === '2025-09');
      const undatedAlbum = albums.find(a => a.datePeriod === 'undated');
      
      expect(augustAlbum).toBeTruthy();
      expect(augustAlbum.photoCount).toBe(2);
      expect(augustAlbum.name).toBe('August 2025');
      
      expect(septemberAlbum).toBeTruthy();
      expect(septemberAlbum.photoCount).toBe(1);
      expect(septemberAlbum.name).toBe('September 2025');
      
      expect(undatedAlbum).toBeTruthy();
      expect(undatedAlbum.photoCount).toBe(1);
      expect(undatedAlbum.name).toBe('Undated Photos');

      // Step 4: Verify UI is updated with new albums
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      const albumCards = albumsContainer.querySelectorAll('.album-card');
      expect(albumCards).toHaveLength(3);

      // Step 5: Verify photos can be viewed in albums
      const augustPhotos = await photoService.getPhotosByAlbum(augustAlbum.id);
      expect(augustPhotos).toHaveLength(2);
      expect(augustPhotos[0].fileName).toBe('vacation1.jpg');
      expect(augustPhotos[1].fileName).toBe('vacation2.jpg');
    });

    it('should handle import errors gracefully and show user feedback', async () => {
      // Integration Test: Error handling throughout the workflow
      
      const mockFiles = createMockPhotoFiles([
        { name: 'valid.jpg', date: '2025-09-20' },
        { name: 'corrupted.jpg', date: '2025-09-20', corrupt: true },
        { name: 'invalid.pdf', date: null, invalidType: true }
      ]);

      // Mock file corruption and invalid types
      const importResult = await photoService.importPhotos(mockFiles);

      // Should partially succeed
      expect(importResult.success).toBe(false); // Overall failure due to errors
      expect(importResult.processedCount).toBe(1); // Only valid file processed
      expect(importResult.errorCount).toBe(2); // Two files failed
      expect(importResult.errors).toHaveLength(2);
      
      // Should still create album for successful import
      expect(importResult.newAlbums).toHaveLength(1);
      expect(importResult.importedPhotos).toHaveLength(1);

      // UI should show error message for failed imports
      uiController.showMessage(`Imported 1 photo. Failed to import 2 files.`, 'warning');
      
      const errorContainer = document.getElementById('error');
      expect(errorContainer.style.display).not.toBe('none');
    });

    it('should handle large photo collections efficiently', async () => {
      // Integration Test: Performance with larger datasets
      
      const largePhotoSet = [];
      for (let i = 0; i < 50; i++) {
        largePhotoSet.push({
          name: `photo_${i}.jpg`,
          date: i < 25 ? '2025-09-20' : '2025-10-15' // Split across two albums
        });
      }
      
      const mockFiles = createMockPhotoFiles(largePhotoSet);

      // Measure import time
      const startTime = Date.now();
      const importResult = await photoService.importPhotos(mockFiles);
      const importTime = Date.now() - startTime;

      // Should complete within reasonable time (< 5 seconds for 50 photos)
      expect(importTime).toBeLessThan(5000);
      
      expect(importResult.success).toBe(true);
      expect(importResult.processedCount).toBe(50);
      expect(importResult.importedPhotos).toHaveLength(50);

      // Should create two albums
      const albums = await albumService.getAllAlbums();
      expect(albums).toHaveLength(2);
      
      const septemberAlbum = albums.find(a => a.datePeriod === '2025-09');
      const octoberAlbum = albums.find(a => a.datePeriod === '2025-10');
      
      expect(septemberAlbum.photoCount).toBe(25);
      expect(octoberAlbum.photoCount).toBe(25);

      // UI should render efficiently
      const renderStart = Date.now();
      uiController.renderAlbums(albums);
      const renderTime = Date.now() - renderStart;
      
      expect(renderTime).toBeLessThan(100); // UI render should be fast
    });

    it('should maintain data consistency across services', async () => {
      // Integration Test: Data consistency between services
      
      const mockFiles = createMockPhotoFiles([
        { name: 'test1.jpg', date: '2025-09-20' },
        { name: 'test2.jpg', date: '2025-09-20' }
      ]);

      await photoService.importPhotos(mockFiles);

      // Verify album photo count matches actual photos
      const albums = await albumService.getAllAlbums();
      const album = albums[0];
      
      const photosInAlbum = await photoService.getPhotosByAlbum(album.id);
      expect(album.photoCount).toBe(photosInAlbum.length);

      // Delete a photo and verify counts update
      await photoService.deletePhoto(photosInAlbum[0].id);
      
      const updatedAlbums = await albumService.getAllAlbums();
      const updatedAlbum = updatedAlbums.find(a => a.id === album.id);
      const remainingPhotos = await photoService.getPhotosByAlbum(album.id);
      
      expect(updatedAlbum.photoCount).toBe(remainingPhotos.length);
      expect(remainingPhotos).toHaveLength(1);
    });
  });

  describe('User Interaction Flow', () => {
    it('should support complete user workflow through UI', async () => {
      // Integration Test: Full user interaction from button click to photo viewing
      
      // Mock File System Access API
      const mockFiles = createMockPhotoFiles([
        { name: 'photo1.jpg', date: '2025-09-20' },
        { name: 'photo2.jpg', date: '2025-09-20' }
      ]);
      
      global.window.showOpenFilePicker = vi.fn().mockResolvedValue(
        mockFiles.map(file => ({ getFile: () => Promise.resolve(file) }))
      );

      // Step 1: User clicks import button
      const importBtn = document.getElementById('import-btn');
      importBtn.click();

      // Should trigger file dialog
      expect(global.window.showOpenFilePicker).toHaveBeenCalled();

      // Step 2: Files are imported and UI updates
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async operations

      const albums = await albumService.getAllAlbums();
      expect(albums).toHaveLength(1);

      // Step 3: User clicks on album to view photos
      uiController.renderAlbums(albums);
      
      const albumCard = document.querySelector('.album-card');
      expect(albumCard).toBeTruthy();
      
      // Simulate album click
      albumCard.click();
      
      // Should switch to album view
      const albumView = document.getElementById('album-view');
      expect(albumView.style.display).not.toBe('none');

      // Step 4: Verify photos are displayed
      const photos = await photoService.getPhotosByAlbum(albums[0].id);
      uiController.renderPhotos(photos, albums[0]);
      
      const photoTiles = document.querySelectorAll('.photo-tile');
      expect(photoTiles).toHaveLength(2);
    });

    it('should handle navigation between views correctly', async () => {
      // Integration Test: View navigation and state management
      
      // Setup data
      const mockFiles = createMockPhotoFiles([{ name: 'test.jpg', date: '2025-09-20' }]);
      await photoService.importPhotos(mockFiles);
      
      const albums = await albumService.getAllAlbums();
      const photos = await photoService.getPhotosByAlbum(albums[0].id);

      // Start on main page
      const mainPage = document.getElementById('main-page');
      const albumView = document.getElementById('album-view');
      
      expect(mainPage.style.display).not.toBe('none');
      expect(albumView.style.display).toBe('none');

      // Navigate to album view
      uiController.renderPhotos(photos, albums[0]);
      
      // Should show album view, hide main page
      expect(albumView.style.display).not.toBe('none');
      expect(mainPage.style.display).toBe('none');

      // Navigate back to main page
      const backBtn = document.getElementById('back-btn');
      backBtn.click();
      
      // Should show main page, hide album view
      expect(mainPage.style.display).not.toBe('none');
      expect(albumView.style.display).toBe('none');
    });
  });
});

// Helper function to create mock photo files
function createMockPhotoFiles(photoSpecs) {
  return photoSpecs.map(spec => {
    const file = {
      name: spec.name,
      type: spec.invalidType ? 'application/pdf' : 'image/jpeg',
      size: 1024 * 100, // 100KB
      lastModified: Date.now(),
      arrayBuffer: vi.fn().mockImplementation(() => {
        if (spec.corrupt) {
          return Promise.reject(new Error('File is corrupted'));
        }
        return Promise.resolve(new ArrayBuffer(1024));
      }),
      stream: vi.fn(),
      text: vi.fn(),
      slice: vi.fn()
    };

    // Add mock EXIF data if date provided
    if (spec.date) {
      file._mockExifDate = new Date(spec.date);
    }

    return file;
  });
}
