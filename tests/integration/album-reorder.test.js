// Album Drag-Drop Reordering Integration Test
// This test MUST FAIL until complete drag-drop integration is implemented

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from '../../src/services/DatabaseService.js';
import { AlbumService } from '../../src/services/AlbumService.js';
import { UIController } from '../../src/controllers/UIController.js';
import { DragDropController } from '../../src/controllers/DragDropController.js';

// Mock Sortable.js for testing
const mockSortable = {
  create: vi.fn().mockImplementation((el, options) => {
    const instance = {
      el,
      options,
      destroy: vi.fn(),
      option: vi.fn(),
      toArray: vi.fn().mockReturnValue(['1', '2', '3'])
    };
    el._sortable = instance;
    return instance;
  })
};

global.Sortable = mockSortable;

describe('Album Drag-Drop Reordering Integration Tests', () => {
  let databaseService;
  let albumService;
  let uiController;
  let dragDropController;

  beforeEach(async () => {
    // Set up DOM with album structure
    document.body.innerHTML = `
      <div id="app">
        <div id="main-page">
          <div id="albums-container" class="albums-grid">
            <!-- Albums will be dynamically added -->
          </div>
        </div>
      </div>
    `;

    // Initialize services - these will fail until implemented
    databaseService = new DatabaseService();
    await databaseService.initialize();
    
    albumService = new AlbumService(databaseService);
    uiController = new UIController(null, albumService);
    dragDropController = new DragDropController(albumService);
    
    await uiController.initialize();

    // Create test albums with different display orders
    await createTestAlbums();
  });

  async function createTestAlbums() {
    // Create albums in specific order for testing
    await albumService.createAlbum('2025-01', 'January 2025');
    await albumService.createAlbum('2025-02', 'February 2025');
    await albumService.createAlbum('2025-03', 'March 2025');
    await albumService.createAlbum('2025-04', 'April 2025');
    
    // Set initial display orders
    await albumService.updateAlbumOrder(1, 0); // January first
    await albumService.updateAlbumOrder(2, 1); // February second
    await albumService.updateAlbumOrder(3, 2); // March third
    await albumService.updateAlbumOrder(4, 3); // April fourth
  }

  describe('Drag-Drop Setup and Initialization', () => {
    it('should initialize Sortable.js on albums container', async () => {
      // Integration Test: Sortable.js initialization with correct options
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);

      // Should initialize Sortable with correct configuration
      expect(mockSortable.create).toHaveBeenCalledWith(
        albumsContainer,
        expect.objectContaining({
          animation: expect.any(Number),
          ghostClass: expect.any(String),
          chosenClass: expect.any(String),
          dragClass: expect.any(String),
          onStart: expect.any(Function),
          onEnd: expect.any(Function)
        })
      );

      // Container should have sortable instance
      expect(albumsContainer._sortable).toBeTruthy();
    });

    it('should render albums with correct data attributes for sorting', async () => {
      // Integration Test: Album rendering with drag-drop data attributes
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);

      const albumCards = document.querySelectorAll('.album-card');
      expect(albumCards).toHaveLength(4);

      // Each album card should have data-album-id for sorting
      albumCards.forEach((card, index) => {
        expect(card.dataset.albumId).toBeTruthy();
        expect(card.classList.contains('album-card')).toBe(true);
      });

      // Albums should be in display order
      const albumIds = Array.from(albumCards).map(card => card.dataset.albumId);
      expect(albumIds).toEqual(['1', '2', '3', '4']); // January, Feb, March, April
    });

    it('should maintain album order consistency between database and DOM', async () => {
      // Integration Test: Database and DOM synchronization
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);

      // Verify database order matches DOM order
      const albumCards = document.querySelectorAll('.album-card');
      const domOrder = Array.from(albumCards).map(card => parseInt(card.dataset.albumId));
      const dbOrder = albums.map(album => album.id);

      expect(domOrder).toEqual(dbOrder);
    });
  });

  describe('Drag-Drop Reordering Operations', () => {
    it('should reorder albums when drag-drop completes', async () => {
      // Integration Test: Complete drag-drop reordering workflow
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);

      // Simulate drag-drop: Move March (index 2) to first position (index 0)
      const sortableInstance = albumsContainer._sortable;
      const dragEndEvent = {
        oldIndex: 2, // March was at position 2
        newIndex: 0, // March moved to position 0
        item: albumsContainer.children[2] // March album card
      };

      // Trigger drag end event
      await sortableInstance.options.onEnd(dragEndEvent);

      // Verify albums were reordered in database
      const reorderedAlbums = await albumService.getAllAlbums();
      
      // New order should be: March, January, February, April
      expect(reorderedAlbums[0].name).toBe('March 2025');
      expect(reorderedAlbums[1].name).toBe('January 2025');
      expect(reorderedAlbums[2].name).toBe('February 2025');
      expect(reorderedAlbums[3].name).toBe('April 2025');

      // Display orders should be updated
      expect(reorderedAlbums[0].displayOrder).toBe(0);
      expect(reorderedAlbums[1].displayOrder).toBe(1);
      expect(reorderedAlbums[2].displayOrder).toBe(2);
      expect(reorderedAlbums[3].displayOrder).toBe(3);
    });

    it('should handle multiple rapid reordering operations', async () => {
      // Integration Test: Rapid successive drag-drop operations
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);
      const sortableInstance = albumsContainer._sortable;

      // Perform multiple reordering operations rapidly
      const operations = [
        { oldIndex: 0, newIndex: 3 }, // January to end
        { oldIndex: 2, newIndex: 0 }, // March to beginning
        { oldIndex: 1, newIndex: 2 }  // February to middle
      ];

      for (const operation of operations) {
        await sortableInstance.options.onEnd({
          oldIndex: operation.oldIndex,
          newIndex: operation.newIndex,
          item: albumsContainer.children[operation.oldIndex]
        });
      }

      // Verify final state is consistent
      const finalAlbums = await albumService.getAllAlbums();
      
      // Check that all albums still exist
      expect(finalAlbums).toHaveLength(4);
      
      // Check that display orders are sequential
      const displayOrders = finalAlbums.map(album => album.displayOrder).sort();
      expect(displayOrders).toEqual([0, 1, 2, 3]);
      
      // Check that no albums were lost or duplicated
      const albumNames = finalAlbums.map(album => album.name).sort();
      expect(albumNames).toEqual([
        'April 2025',
        'February 2025', 
        'January 2025',
        'March 2025'
      ]);
    });

    it('should provide visual feedback during drag operations', async () => {
      // Integration Test: Visual feedback and CSS class management
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);
      const sortableInstance = albumsContainer._sortable;

      const draggedCard = albumsContainer.children[1]; // February album

      // Simulate drag start
      if (sortableInstance.options.onStart) {
        sortableInstance.options.onStart({
          item: draggedCard,
          oldIndex: 1
        });
      }

      // Should apply drag visual classes
      expect(draggedCard.classList.contains('sortable-chosen')).toBe(true);
      
      // Simulate drag end
      await sortableInstance.options.onEnd({
        item: draggedCard,
        oldIndex: 1,
        newIndex: 2
      });

      // Should remove drag visual classes
      expect(draggedCard.classList.contains('sortable-chosen')).toBe(false);
    });

    it('should handle edge cases in drag-drop reordering', async () => {
      // Integration Test: Edge cases and error conditions
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);
      const sortableInstance = albumsContainer._sortable;

      // Test case 1: Drag to same position (no-op)
      await sortableInstance.options.onEnd({
        oldIndex: 1,
        newIndex: 1,
        item: albumsContainer.children[1]
      });

      const albumsAfterNoOp = await albumService.getAllAlbums();
      expect(albumsAfterNoOp[1].name).toBe('February 2025'); // Should remain unchanged

      // Test case 2: Drag to invalid index (should be handled gracefully)
      await sortableInstance.options.onEnd({
        oldIndex: 0,
        newIndex: 999, // Invalid index
        item: albumsContainer.children[0]
      });

      const albumsAfterInvalid = await albumService.getAllAlbums();
      expect(albumsAfterInvalid).toHaveLength(4); // All albums should still exist

      // Test case 3: Drag with missing album card
      const mockEvent = {
        oldIndex: 0,
        newIndex: 1,
        item: { dataset: { albumId: 'nonexistent' } }
      };

      // Should not throw error
      await expect(sortableInstance.options.onEnd(mockEvent)).resolves.toBeDefined();
    });
  });

  describe('Persistence and State Management', () => {
    it('should persist album order across browser sessions', async () => {
      // Integration Test: Data persistence verification
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);

      // Reorder albums: April to first position
      const sortableInstance = albumsContainer._sortable;
      await sortableInstance.options.onEnd({
        oldIndex: 3, // April
        newIndex: 0, // Move to first
        item: albumsContainer.children[3]
      });

      // Simulate browser session restart by creating new service instances
      const newDatabaseService = new DatabaseService();
      await newDatabaseService.initialize();
      const newAlbumService = new AlbumService(newDatabaseService);

      // Verify order persisted
      const persistedAlbums = await newAlbumService.getAllAlbums();
      expect(persistedAlbums[0].name).toBe('April 2025');
      expect(persistedAlbums[0].displayOrder).toBe(0);
    });

    it('should handle concurrent reordering operations safely', async () => {
      // Integration Test: Concurrency and data integrity
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);
      const sortableInstance = albumsContainer._sortable;

      // Simulate concurrent reordering (multiple users or rapid operations)
      const concurrentOperations = [
        sortableInstance.options.onEnd({
          oldIndex: 0,
          newIndex: 1,
          item: albumsContainer.children[0]
        }),
        sortableInstance.options.onEnd({
          oldIndex: 2,
          newIndex: 0,
          item: albumsContainer.children[2]
        }),
        sortableInstance.options.onEnd({
          oldIndex: 1,
          newIndex: 3,
          item: albumsContainer.children[1]
        })
      ];

      // All operations should complete without conflict
      await Promise.all(concurrentOperations);

      // Verify data integrity
      const finalAlbums = await albumService.getAllAlbums();
      expect(finalAlbums).toHaveLength(4);

      // Display orders should be unique and sequential
      const displayOrders = finalAlbums.map(album => album.displayOrder);
      const uniqueOrders = [...new Set(displayOrders)];
      expect(uniqueOrders).toHaveLength(4);
      expect(Math.max(...displayOrders)).toBe(3);
      expect(Math.min(...displayOrders)).toBe(0);
    });

    it('should update UI immediately after reordering', async () => {
      // Integration Test: UI responsiveness and immediate feedback
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);

      // Record initial DOM order
      const initialOrder = Array.from(albumsContainer.children).map(card => card.dataset.albumId);
      
      // Perform reordering
      const sortableInstance = albumsContainer._sortable;
      await sortableInstance.options.onEnd({
        oldIndex: 0,
        newIndex: 2,
        item: albumsContainer.children[0]
      });

      // UI should update immediately
      const newOrder = Array.from(albumsContainer.children).map(card => card.dataset.albumId);
      expect(newOrder).not.toEqual(initialOrder);

      // Database should also be updated
      const updatedAlbums = await albumService.getAllAlbums();
      const dbOrder = updatedAlbums.map(album => album.id.toString());
      expect(newOrder).toEqual(dbOrder);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors during reordering gracefully', async () => {
      // Integration Test: Error handling and user feedback
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);

      // Mock database error
      const originalReorderAlbums = albumService.reorderAlbums;
      albumService.reorderAlbums = vi.fn().mockRejectedValue(new Error('Database error'));

      const sortableInstance = albumsContainer._sortable;
      
      // Attempt reordering that should fail
      await expect(sortableInstance.options.onEnd({
        oldIndex: 0,
        newIndex: 1,
        item: albumsContainer.children[0]
      })).rejects.toThrow('Database error');

      // UI should show error feedback
      const errorContainer = document.getElementById('error');
      expect(errorContainer.style.display).not.toBe('none');

      // Restore original method
      albumService.reorderAlbums = originalReorderAlbums;
    });

    it('should revert UI changes if database update fails', async () => {
      // Integration Test: Rollback on failure
      
      const albums = await albumService.getAllAlbums();
      uiController.renderAlbums(albums);
      
      const albumsContainer = document.getElementById('albums-container');
      uiController.enableAlbumDragDrop(albumsContainer);

      // Record initial state
      const initialDomOrder = Array.from(albumsContainer.children).map(card => card.dataset.albumId);
      const initialDbAlbums = await albumService.getAllAlbums();

      // Mock database failure after UI change
      const originalReorderAlbums = albumService.reorderAlbums;
      albumService.reorderAlbums = vi.fn().mockRejectedValue(new Error('Database update failed'));

      const sortableInstance = albumsContainer._sortable;
      
      try {
        await sortableInstance.options.onEnd({
          oldIndex: 0,
          newIndex: 2,
          item: albumsContainer.children[0]
        });
      } catch (error) {
        // Expected to fail
      }

      // UI should revert to original order
      const revertedDomOrder = Array.from(albumsContainer.children).map(card => card.dataset.albumId);
      expect(revertedDomOrder).toEqual(initialDomOrder);

      // Database should remain unchanged
      const currentDbAlbums = await albumService.getAllAlbums();
      expect(currentDbAlbums.map(a => a.displayOrder)).toEqual(
        initialDbAlbums.map(a => a.displayOrder)
      );

      // Restore original method
      albumService.reorderAlbums = originalReorderAlbums;
    });
  });
});
