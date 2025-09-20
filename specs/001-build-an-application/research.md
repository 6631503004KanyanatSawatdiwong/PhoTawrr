# Research: Photo Album Organization Application

**Date**: 20 September 2025  
**Feature**: Photo Album Organization Application  
**Phase**: 0 - Outline & Research

## Research Areas

### File System Access API
**Decision**: Use File System Access API for local photo access  
**Rationale**: 
- Modern web API for accessing local files without uploads
- Maintains user privacy (photos stay local)
- Supported in Chrome, Edge, and partial support in other browsers
- Allows reading file metadata including EXIF data

**Alternatives considered**:
- Input file picker: Limited to single-session access
- Drag-and-drop: Requires manual file selection each time
- Electron: Adds significant complexity and size

### SQLite in Browser
**Decision**: Use sql.js with IndexedDB persistence  
**Rationale**:
- SQLite provides relational data structure for photo metadata
- sql.js compiles SQLite to WebAssembly for browser use
- IndexedDB provides persistent storage across sessions
- Familiar SQL syntax for queries and data management

**Alternatives considered**:
- IndexedDB directly: More complex for relational queries
- LocalStorage: Limited storage size and no complex queries
- Web SQL: Deprecated in most browsers

### EXIF Metadata Extraction
**Decision**: Use piexifjs library for EXIF data reading  
**Rationale**:
- Lightweight JavaScript EXIF reader
- Extracts date taken information from photo metadata
- Works with JPEG files (most common photo format)
- No server-side processing needed

**Alternatives considered**:
- exif-js: Larger library with more dependencies
- Custom EXIF parser: Too complex and error-prone
- Server-side processing: Against local-only requirement

### Drag and Drop Implementation
**Decision**: HTML5 Drag and Drop API with sortable.js  
**Rationale**:
- Native HTML5 drag-and-drop for basic functionality
- sortable.js provides smooth animations and cross-browser compatibility
- Lightweight library focused on sorting/reordering
- Integrates well with vanilla JavaScript

**Alternatives considered**:
- Custom drag-drop: Complex to implement smoothly
- interact.js: Larger library with more features than needed
- jQuery UI Sortable: Requires jQuery dependency

### Photo Thumbnails
**Decision**: Canvas API for thumbnail generation  
**Rationale**:
- Generate thumbnails client-side for performance
- Canvas provides image resizing and format conversion
- Reduces memory usage by displaying smaller images
- Immediate thumbnail creation from original files

**Alternatives considered**:
- Display full images: Poor performance with many photos
- Server-side thumbnails: Against local-only architecture
- CSS-only scaling: Still loads full image data

### Build Tool Configuration
**Decision**: Vite with minimal configuration  
**Rationale**:
- Fast development server with hot reload
- Modern ES modules support
- Minimal configuration for vanilla JavaScript
- Good performance optimization for production builds

**Alternatives considered**:
- Webpack: More complex configuration needed
- Parcel: Less control over build process
- No build tool: Missing modern development features

### Browser Storage Strategy
**Decision**: IndexedDB for SQLite persistence + sessionStorage for UI state  
**Rationale**:
- IndexedDB for large, persistent data (photo metadata)
- sessionStorage for temporary UI state (album order, view preferences)
- Separation of concerns between data and UI state
- Better performance with appropriate storage for each use case

**Alternatives considered**:
- localStorage only: Size limitations and performance issues
- All in IndexedDB: Overkill for simple UI state
- No persistence: Poor user experience

## Technical Dependencies Summary

### Core Dependencies
- **Vite**: Build tool and development server
- **sql.js**: SQLite in WebAssembly for browser
- **piexifjs**: EXIF metadata extraction from photos
- **sortable.js**: Drag-and-drop sorting functionality

### Browser APIs Used
- **File System Access API**: Local file access
- **IndexedDB**: Persistent storage for SQLite database
- **Canvas API**: Thumbnail generation
- **sessionStorage**: UI state persistence
- **Drag and Drop API**: Basic drag-and-drop functionality

### Browser Support
- **Primary**: Chrome 86+, Edge 86+ (full File System Access API support)
- **Secondary**: Firefox, Safari (with fallback to file picker)
- **Minimum**: Modern browsers with ES2022 support

## Architecture Decisions

### Single-Page Application Structure
- **Decision**: Vanilla HTML/CSS/JavaScript with module structure
- **Rationale**: Simplicity, no framework overhead, direct control
- **Structure**: Separate modules for photo management, database, UI components

### Data Flow Pattern
- **Decision**: Centralized state management with event-driven updates
- **Rationale**: Predictable data flow, easy debugging, component independence
- **Implementation**: Custom event system for component communication

### Error Handling Strategy
- **Decision**: Graceful degradation with user-friendly error messages
- **Rationale**: Local file access can fail, need robust error handling
- **Implementation**: Try-catch blocks with fallback options

## Performance Considerations

### Large Photo Collections
- **Strategy**: Lazy loading with virtual scrolling for large albums
- **Implementation**: Load thumbnails as they come into view
- **Limit**: 10,000 photos maximum with pagination

### Memory Management
- **Strategy**: Thumbnail caching with LRU eviction
- **Implementation**: Canvas-generated thumbnails cached in memory
- **Limit**: Maximum 100 thumbnails in memory cache

### Database Performance
- **Strategy**: Indexed queries on date fields for fast album grouping
- **Implementation**: SQLite indexes on photo date and album fields
- **Optimization**: Batch inserts for multiple photo imports
