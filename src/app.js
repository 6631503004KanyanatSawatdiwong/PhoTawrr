// PhoTawrr - Main Application Entry Point
// MVP Implementation - Photo Album Organization Application

import DatabaseService from './services/DatabaseService.js';
import PhotoService from './services/PhotoService.js';
import AlbumService from './services/AlbumService.js';
import UIController from './controllers/UIController.js';
import { UserPreferences } from './models/UserPreferences.js';

console.log('PhoTawrr - Loading application...');

class PhoTawrrApp {
  constructor() {
    this.db = null;
    this.photoService = null;
    this.albumService = null;
    this.uiController = null;
    this.userPreferences = null;
  }

  async initialize() {
    try {
      console.log('Initializing PhoTawrr application...');
      
      // Show loading indicator
      this.showLoading('Initializing application...');
      
      // Initialize database
      this.db = new DatabaseService();
      await this.db.initialize();
      console.log('Database initialized');
      
      // Initialize user preferences
      this.userPreferences = new UserPreferences();
      
      // Initialize services
      this.photoService = new PhotoService(this.db);
      this.albumService = new AlbumService(this.db);
      console.log('Services initialized');
      
      // Initialize UI controller
      this.uiController = new UIController(
        this.photoService,
        this.albumService,
        this.userPreferences
      );
      
      await this.uiController.initialize();
      console.log('UI Controller initialized');
      
      // Load initial data
      await this.loadInitialData();
      
      this.hideLoading();
      console.log('PhoTawrr application ready!');
      
    } catch (error) {
      console.error('Failed to initialize PhoTawrr:', error);
      this.showError(`Failed to start application: ${error.message}`);
    }
  }
  
  async loadInitialData() {
    try {
      // Load existing albums
      const albums = await this.albumService.getAllAlbums();
      console.log(`Loaded ${albums.length} existing albums`);
      
      if (albums.length > 0) {
        await this.uiController.renderAlbums(albums);
      }
    } catch (error) {
      console.warn('Failed to load initial data:', error);
    }
  }
  
  showLoading(message = 'Loading...') {
    const loadingEl = document.getElementById('loading');
    const messageEl = loadingEl?.querySelector('.loading-message');
    
    if (loadingEl) {
      loadingEl.style.display = 'block';
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
  }
  
  hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }
  
  showError(message) {
    const errorEl = document.getElementById('error');
    const messageEl = errorEl?.querySelector('.error-message');
    
    if (errorEl) {
      errorEl.style.display = 'block';
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
    
    this.hideLoading();
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded - initializing PhoTawrr...');
  
  const app = new PhoTawrrApp();
  
  // Make app available globally for debugging
  window.PhoTawrr = app;
  
  await app.initialize();
});
