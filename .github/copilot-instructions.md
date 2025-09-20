# PhoTawrr Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-20

## Active Technologies
- JavaScript ES2022, HTML5, CSS3 (001-build-an-application)
- Vite build tool (001-build-an-application)
- SQLite via sql.js (001-build-an-application)
- File System Access API (001-build-an-application)
- Canvas API for thumbnails (001-build-an-application)
- Sortable.js for drag-drop (001-build-an-application)

## Project Structure
```
src/
├── models/
├── services/
├── controllers/
└── lib/
tests/
├── contract/
├── integration/
└── unit/
```

## Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run test       # Run all tests
npm run preview    # Preview production build
```

## Code Style
- Vanilla JavaScript: Use ES2022 features, avoid frameworks
- Minimal dependencies: Prefer native APIs over libraries
- Local-only: No uploads, no server communication
- Performance: Target <2s load times, <100ms interactions

## Recent Changes
- 001-build-an-application: Added photo album organization with Vite + SQLite + vanilla JS

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->