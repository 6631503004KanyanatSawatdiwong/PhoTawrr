# Tasks: Photo Album Organization Application (MVP)

**Input**: Design documents from `/specs/001-build-an-application/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Target**: MVP version testable locally in browser

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Vite + vanilla JS + sql.js + minimal dependencies
   → Structure: Single project (frontend-only)
2. Load design documents:
   → data-model.md: Photo, Album, UserPreferences entities
   → contracts/: PhotoService, AlbumService, DatabaseService, UIController
   → quickstart.md: Validation scenarios for MVP
3. Generate MVP-focused tasks:
   → Setup: Vite project with dependencies
   → Tests: Contract tests (TDD approach)
   → Core: Database, services, UI controllers
   → Integration: File system access, drag-drop
   → MVP: Basic photo import, album organization, local testing
4. Task ordering: Setup → Tests → Models → Services → UI → Integration → MVP
5. Parallel execution where files are independent [P]
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths for each task

## Path Conventions (Single Project Structure)
```
src/
├── models/          # Data models
├── services/        # Business logic services  
├── controllers/     # UI controllers
└── lib/            # Utilities and helpers
tests/
├── contract/       # Contract tests (TDD)
├── integration/    # Integration tests
└── unit/          # Unit tests
```

## Phase 3.1: Project Setup
- [x] **T001** Create Vite project structure with index.html, package.json, vite.config.js
- [x] **T002** Install core dependencies: sql.js, sortable.js for MVP functionality
- [x] **T003** [P] Setup basic HTML template with main page structure in index.html
- [x] **T004** [P] Create base CSS styles for responsive layout in src/styles/main.css

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] **T005** [P] Contract test for DatabaseService.initialize() in tests/contract/DatabaseService.test.js
- [x] **T006** [P] Contract test for PhotoService.importPhotos() in tests/contract/PhotoService.test.js  
- [x] **T007** [P] Contract test for AlbumService.getAllAlbums() in tests/contract/AlbumService.test.js
- [x] **T008** [P] Contract test for UIController.initialize() in tests/contract/UIController.test.js
- [x] **T009** [P] Integration test for photo import workflow in tests/integration/photo-import.test.js
- [x] **T010** [P] Integration test for album drag-drop reordering in tests/integration/album-reorder.test.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] **T011** [P] Photo model with validation in src/models/Photo.js
- [ ] **T012** [P] Album model with validation in src/models/Album.js
- [ ] **T013** [P] UserPreferences model in src/models/UserPreferences.js
- [ ] **T014** DatabaseService implementation with SQLite schema in src/services/DatabaseService.js
- [ ] **T015** PhotoService implementation for import and metadata extraction in src/services/PhotoService.js
- [ ] **T016** AlbumService implementation for organization and reordering in src/services/AlbumService.js
- [ ] **T017** UIController implementation for main page rendering in src/controllers/UIController.js

## Phase 3.4: File System Integration
- [ ] **T018** File System Access API integration for photo selection in src/lib/FileSystemHelper.js
- [ ] **T019** [P] EXIF metadata extraction utility in src/lib/ExifHelper.js
- [ ] **T020** [P] Canvas-based thumbnail generation in src/lib/ThumbnailGenerator.js
- [ ] **T021** Photo file validation and format support in src/lib/PhotoValidator.js

## Phase 3.5: UI Implementation
- [ ] **T022** Main page album grid layout and styling in src/controllers/MainPageController.js
- [ ] **T023** Album view with photo tile grid in src/controllers/AlbumViewController.js
- [ ] **T024** Photo detail view modal in src/controllers/PhotoDetailController.js
- [ ] **T025** Import dialog and file selection UI in src/controllers/ImportController.js
- [ ] **T026** Drag-and-drop integration with Sortable.js in src/controllers/DragDropController.js

## Phase 3.6: MVP Integration & Polish
- [ ] **T027** Connect all services and controllers in main application entry point src/app.js
- [ ] **T028** Error handling and user feedback system in src/lib/ErrorHandler.js
- [ ] **T029** [P] Loading states and progress indicators in src/components/LoadingComponent.js
- [ ] **T030** [P] Basic responsive design for desktop browsers in src/styles/responsive.css
- [ ] **T031** Local storage persistence for user preferences in src/services/PreferencesService.js

## Phase 3.7: MVP Validation
- [ ] **T032** Manual testing according to quickstart.md scenarios
- [ ] **T033** [P] Performance testing for large photo collections (100+ photos)
- [ ] **T034** [P] Cross-browser compatibility testing (Chrome, Firefox, Safari, Edge)
- [ ] **T035** Error case testing (invalid files, corrupted images, storage limits)

## Dependencies
```
Setup (T001-T004) → Tests (T005-T010) → Core (T011-T017)
T014 (DatabaseService) blocks T015, T016
T015 (PhotoService) blocks T018, T019, T020, T021
T017 (UIController) blocks T022, T023, T024, T025, T026
UI Controllers (T022-T026) → Integration (T027-T031)
Integration → Validation (T032-T035)
```

## Parallel Execution Examples

### Phase 3.2 - Contract Tests (All Parallel)
```bash
# Launch all contract tests together:
npm test tests/contract/DatabaseService.test.js &
npm test tests/contract/PhotoService.test.js &  
npm test tests/contract/AlbumService.test.js &
npm test tests/contract/UIController.test.js &
npm test tests/integration/photo-import.test.js &
npm test tests/integration/album-reorder.test.js &
wait
```

### Phase 3.3 - Models (All Parallel)
```bash
# Create all models simultaneously:
Task: "Photo model with validation in src/models/Photo.js"
Task: "Album model with validation in src/models/Album.js"  
Task: "UserPreferences model in src/models/UserPreferences.js"
```

### Phase 3.4 - Utilities (Mostly Parallel)
```bash
# Independent utility implementations:
Task: "EXIF metadata extraction utility in src/lib/ExifHelper.js"
Task: "Canvas-based thumbnail generation in src/lib/ThumbnailGenerator.js"
```

## MVP Scope Definition

### Included in MVP:
✅ **Photo Import**: File System Access API for local photo selection  
✅ **Automatic Organization**: Date-based album creation from EXIF data  
✅ **Album Display**: Grid layout with cover photos and photo counts  
✅ **Drag-and-Drop**: Album reordering with Sortable.js  
✅ **Photo Viewing**: Tile grid within albums, basic detail view  
✅ **Local Storage**: SQLite database via sql.js for metadata persistence  
✅ **Responsive Design**: Desktop browser optimization  

### Deferred for Future Versions:
🔄 **Advanced Photo Editing**: Rotation, cropping, filters  
🔄 **Bulk Operations**: Multi-select, batch delete, bulk move  
🔄 **Search and Filters**: Photo search, date filtering, tags  
🔄 **Export Features**: Album export, backup functionality  
🔄 **Mobile Optimization**: Touch gestures, mobile-first design  
🔄 **Performance Optimization**: Virtual scrolling, lazy loading  

## Task Generation Rules Applied

1. **From Contracts Directory**:
   - PhotoService.test.js → T006 (PhotoService contract test)
   - AlbumService.test.js → T007 (AlbumService contract test)  
   - UIController.test.js → T008 (UIController contract test)
   - api-contracts.md → Additional service implementations

2. **From Data Model**:
   - Photo entity → T011 (Photo model)
   - Album entity → T012 (Album model)
   - UserPreferences entity → T013 (UserPreferences model)

3. **From Quickstart Guide**:
   - Photo import test → T009 (integration test)
   - Album organization test → T010 (integration test)
   - Performance validation → T033 (performance testing)

4. **MVP Focus**:
   - Core functionality first: import, organize, display
   - Minimal viable features for local browser testing
   - Database persistence without complex operations
   - Basic UI without advanced interactions

## Validation Checklist
*GATE: Verified before task execution*

- [x] All contracts have corresponding test tasks (T005-T008)
- [x] All entities have model creation tasks (T011-T013)  
- [x] All tests come before implementation (T005-T010 before T011+)
- [x] Parallel tasks are truly independent ([P] marked correctly)
- [x] Each task specifies exact file path
- [x] No [P] task modifies the same file as another [P] task
- [x] MVP scope is clearly defined and achievable
- [x] Tasks support local browser testing requirement

## Success Criteria for MVP

When all tasks are complete, the MVP should support:

1. **Basic Photo Import**: Users can select and import photos from local file system
2. **Automatic Organization**: Photos are grouped into date-based albums automatically  
3. **Album Management**: Users can view albums and reorder them via drag-and-drop
4. **Photo Browsing**: Users can open albums and view photos in tile grid layout
5. **Data Persistence**: Album organization and metadata persist between browser sessions
6. **Local Testing**: Application runs entirely in browser without server dependencies
7. **Error Handling**: Graceful handling of common error cases (invalid files, etc.)

The MVP will be ready for local testing and user feedback to guide future development priorities.
