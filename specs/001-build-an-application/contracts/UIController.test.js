/**
 * Contract Tests: UIController
 * These tests validate the UIController interface contract
 * Tests should FAIL initially (no implementation yet)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIController } from '../src/controllers/UIController.js';

// Mock DOM environment for testing
Object.defineProperty(window, 'location', {
  value: { hash: '' },
  writable: true
});

describe('UIController Contract Tests', () => {
  let uiController;
  let mockContainer;

  beforeEach(async () => {
    // Create mock DOM elements
    document.body.innerHTML = `
      <div id="app">
        <div id="albums-container"></div>
        <div id="photos-container"></div>
        <div id="loading-overlay"></div>
        <div id="message-container"></div>
      </div>
    `;

    mockContainer = document.getElementById('albums-container');
    uiController = new UIController();
    await uiController.initialize();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('initialize', () => {
    it('should initialize UI components successfully', async () => {
      expect(uiController.isInitialized).toBe(true);
      expect(document.getElementById('albums-container')).toBeTruthy();
      expect(document.getElementById('photos-container')).toBeTruthy();
    });

    it('should throw UIError if required DOM elements missing', async () => {
      document.body.innerHTML = '<div></div>'; // Remove required elements
      const newController = new UIController();
      
      await expect(newController.initialize())
        .rejects.toThrow('UIError');
    });

    it('should set up event listeners for user interactions', async () => {
      // Verify import button event listener
      const importButton = document.querySelector('[data-action="import"]');
      expect(importButton).toBeTruthy();
      
      // Verify keyboard shortcuts
      expect(uiController.hasKeyboardShortcuts).toBe(true);
    });
  });

  describe('renderAlbums', () => {
    it('should render albums in display order', () => {
      const mockAlbums = [
        {
          id: 1,
          name: 'January 2025',
          datePeriod: '2025-01',
          displayOrder: 0,
          photoCount: 15,
          coverPhotoId: 1
        },
        {
          id: 2,
          name: 'February 2025', 
          datePeriod: '2025-02',
          displayOrder: 1,
          photoCount: 23,
          coverPhotoId: 10
        }
      ];

      uiController.renderAlbums(mockAlbums);

      const albumElements = mockContainer.querySelectorAll('.album');
      expect(albumElements).toHaveLength(2);
      
      // Verify order
      expect(albumElements[0].dataset.albumId).toBe('1');
      expect(albumElements[1].dataset.albumId).toBe('2');
      
      // Verify content
      expect(albumElements[0].textContent).toContain('January 2025');
      expect(albumElements[0].textContent).toContain('15 photos');
    });

    it('should handle empty albums array', () => {
      uiController.renderAlbums([]);
      
      const albumElements = mockContainer.querySelectorAll('.album');
      expect(albumElements).toHaveLength(0);
      
      const emptyMessage = mockContainer.querySelector('.empty-state');
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage.textContent).toContain('No albums');
    });

    it('should throw RenderError for malformed album data', () => {
      const invalidAlbums = [
        { id: 1 } // Missing required fields
      ];

      expect(() => uiController.renderAlbums(invalidAlbums))
        .toThrow('RenderError');
    });

    it('should apply draggable attributes to album elements', () => {
      const mockAlbums = [
        {
          id: 1,
          name: 'Test Album',
          datePeriod: '2025-01',
          displayOrder: 0,
          photoCount: 5,
          coverPhotoId: null
        }
      ];

      uiController.renderAlbums(mockAlbums);

      const albumElement = mockContainer.querySelector('.album');
      expect(albumElement.draggable).toBe(true);
      expect(albumElement.dataset.draggable).toBe('true');
    });
  });

  describe('renderPhotos', () => {
    it('should render photos in tile grid layout', () => {
      const mockPhotos = [
        {
          id: 1,
          fileName: 'photo1.jpg',
          thumbnailData: 'data:image/jpeg;base64,/9j/4AAQ...',
          width: 1920,
          height: 1080
        },
        {
          id: 2,
          fileName: 'photo2.png',
          thumbnailData: 'data:image/png;base64,iVBORw0KGgo...',
          width: 1024,
          height: 768
        }
      ];

      const mockAlbum = {
        id: 1,
        name: 'Test Album',
        photoCount: 2
      };

      const photosContainer = document.getElementById('photos-container');
      uiController.renderPhotos(mockPhotos, mockAlbum);

      const photoElements = photosContainer.querySelectorAll('.photo-tile');
      expect(photoElements).toHaveLength(2);
      
      // Verify grid layout
      expect(photosContainer.classList.contains('photo-grid')).toBe(true);
      
      // Verify photo tiles
      expect(photoElements[0].dataset.photoId).toBe('1');
      expect(photoElements[0].querySelector('img').src).toBe(mockPhotos[0].thumbnailData);
    });

    it('should handle album with no photos', () => {
      const mockAlbum = {
        id: 1,
        name: 'Empty Album',
        photoCount: 0
      };

      const photosContainer = document.getElementById('photos-container');
      uiController.renderPhotos([], mockAlbum);

      const emptyState = photosContainer.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No photos in this album');
    });

    it('should implement lazy loading for large photo sets', () => {
      const mockPhotos = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        fileName: `photo${i + 1}.jpg`,
        thumbnailData: 'data:image/jpeg;base64,test',
        width: 1920,
        height: 1080
      }));

      const mockAlbum = { id: 1, name: 'Large Album', photoCount: 100 };
      
      uiController.renderPhotos(mockPhotos, mockAlbum);

      const photosContainer = document.getElementById('photos-container');
      const visiblePhotos = photosContainer.querySelectorAll('.photo-tile:not(.lazy)');
      
      // Should only render visible photos initially
      expect(visiblePhotos.length).toBeLessThan(100);
      expect(photosContainer.dataset.lazyLoading).toBe('true');
    });

    it('should throw RenderError for invalid photo data', () => {
      const invalidPhotos = [
        { id: 1 } // Missing required fields
      ];
      const mockAlbum = { id: 1, name: 'Test', photoCount: 1 };

      expect(() => uiController.renderPhotos(invalidPhotos, mockAlbum))
        .toThrow('RenderError');
    });
  });

  describe('enableAlbumDragDrop', () => {
    it('should enable drag and drop functionality on container', () => {
      uiController.enableAlbumDragDrop(mockContainer);

      expect(mockContainer.dataset.sortable).toBe('true');
      expect(uiController.sortableInstance).toBeTruthy();
    });

    it('should handle drag start events', () => {
      const mockAlbums = [
        { id: 1, name: 'Album 1', datePeriod: '2025-01', displayOrder: 0, photoCount: 5 }
      ];
      
      uiController.renderAlbums(mockAlbums);
      uiController.enableAlbumDragDrop(mockContainer);

      const albumElement = mockContainer.querySelector('.album');
      const dragEvent = new DragEvent('dragstart');
      
      albumElement.dispatchEvent(dragEvent);
      
      expect(albumElement.classList.contains('dragging')).toBe(true);
    });

    it('should handle drag end events with order update', async () => {
      const mockAlbums = [
        { id: 1, name: 'Album 1', datePeriod: '2025-01', displayOrder: 0, photoCount: 5 },
        { id: 2, name: 'Album 2', datePeriod: '2025-02', displayOrder: 1, photoCount: 3 }
      ];
      
      uiController.renderAlbums(mockAlbums);
      uiController.enableAlbumDragDrop(mockContainer);

      // Simulate reorder event
      const reorderEvent = new CustomEvent('sortable:reorder', {
        detail: { newOrder: [2, 1] }
      });
      
      mockContainer.dispatchEvent(reorderEvent);
      
      // Should trigger album reorder
      expect(uiController.lastReorderOperation).toEqual([2, 1]);
    });

    it('should throw UIError for invalid container element', () => {
      expect(() => uiController.enableAlbumDragDrop(null))
        .toThrow('UIError');
      
      expect(() => uiController.enableAlbumDragDrop(document.createElement('span')))
        .toThrow('UIError');
    });
  });

  describe('showImportDialog', () => {
    it('should show file picker and return selected files', async () => {
      // Mock File System Access API
      const mockFiles = [
        new File(['test'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['test'], 'photo2.png', { type: 'image/png' })
      ];

      window.showOpenFilePicker = vi.fn().mockResolvedValue(
        mockFiles.map(file => ({ getFile: () => Promise.resolve(file) }))
      );

      const result = await uiController.showImportDialog();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('photo1.jpg');
      expect(result[1].name).toBe('photo2.png');
    });

    it('should return null when user cancels dialog', async () => {
      window.showOpenFilePicker = vi.fn().mockRejectedValue(
        new DOMException('User cancelled', 'AbortError')
      );

      const result = await uiController.showImportDialog();
      expect(result).toBeNull();
    });

    it('should fallback to input file picker on unsupported browsers', async () => {
      // Remove File System Access API
      delete window.showOpenFilePicker;

      const result = await uiController.showImportDialog();
      
      // Should create file input fallback
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();
      expect(fileInput.accept).toContain('image/*');
    });

    it('should throw UIError when dialog cannot be shown', async () => {
      window.showOpenFilePicker = vi.fn().mockRejectedValue(
        new Error('Security error')
      );

      await expect(uiController.showImportDialog())
        .rejects.toThrow('UIError');
    });
  });

  describe('showMessage', () => {
    it('should display error message with correct styling', () => {
      const message = 'Test error message';
      uiController.showMessage(message, 'error');

      const messageContainer = document.getElementById('message-container');
      const messageElement = messageContainer.querySelector('.message');
      
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toBe(message);
      expect(messageElement.classList.contains('message-error')).toBe(true);
    });

    it('should display different message types', () => {
      const testCases = [
        { message: 'Success message', type: 'success' },
        { message: 'Warning message', type: 'warning' },
        { message: 'Info message', type: 'info' }
      ];

      testCases.forEach(({ message, type }) => {
        uiController.showMessage(message, type);
        
        const messageElement = document.querySelector('.message');
        expect(messageElement.classList.contains(`message-${type}`)).toBe(true);
      });
    });

    it('should auto-dismiss messages after timeout', async () => {
      uiController.showMessage('Auto-dismiss test', 'info');
      
      const messageElement = document.querySelector('.message');
      expect(messageElement).toBeTruthy();

      // Wait for auto-dismiss timeout
      await new Promise(resolve => setTimeout(resolve, 5100));
      
      expect(document.querySelector('.message')).toBeNull();
    });
  });

  describe('showLoading and hideLoading', () => {
    it('should show loading overlay with message', () => {
      const message = 'Importing photos...';
      uiController.showLoading(message);

      const loadingOverlay = document.getElementById('loading-overlay');
      expect(loadingOverlay.style.display).toBe('flex');
      expect(loadingOverlay.textContent).toContain(message);
      expect(loadingOverlay.classList.contains('active')).toBe(true);
    });

    it('should hide loading overlay', () => {
      uiController.showLoading('Test');
      uiController.hideLoading();

      const loadingOverlay = document.getElementById('loading-overlay');
      expect(loadingOverlay.style.display).toBe('none');
      expect(loadingOverlay.classList.contains('active')).toBe(false);
    });

    it('should use default loading message', () => {
      uiController.showLoading();

      const loadingOverlay = document.getElementById('loading-overlay');
      expect(loadingOverlay.textContent).toContain('Loading...');
    });
  });
});
