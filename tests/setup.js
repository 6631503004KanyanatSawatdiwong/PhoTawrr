import { vi } from 'vitest';

// Mock sql.js for tests to avoid WASM loading issues
vi.mock('sql.js', () => {
  const mockDB = {
    exec: vi.fn(() => []),
    run: vi.fn(() => ({ lastInsertRowid: 1 })),
    get: vi.fn(() => null),
    all: vi.fn(() => []),
    close: vi.fn(),
    export: vi.fn(() => new Uint8Array()),
  };

  const mockSQL = {
    Database: vi.fn(() => mockDB),
  };

  return {
    default: vi.fn(() => Promise.resolve(mockSQL)),
  };
});

// Mock DatabaseService to work properly in tests
vi.mock('../src/services/DatabaseService.js', () => {
  const mockDatabase = {
    initialize: vi.fn(() => Promise.resolve(true)),
    execute: vi.fn(() => Promise.resolve({ lastInsertRowid: 1 })),
    get: vi.fn(() => Promise.resolve(null)),
    all: vi.fn(() => Promise.resolve([])),
    beginTransaction: vi.fn(() => Promise.resolve()),
    commit: vi.fn(() => Promise.resolve()),
    rollback: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };

  class DatabaseService {
    constructor() {
      Object.assign(this, mockDatabase);
    }
  }

  return {
    default: DatabaseService,
    DatabaseService
  };
});

// Mock IndexedDB
const mockIDB = {
  open: vi.fn(() => Promise.resolve({
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve(null)),
        put: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIDB,
  writable: true,
});

// Mock File System Access API
Object.defineProperty(globalThis, 'showOpenFilePicker', {
  value: vi.fn(() => Promise.resolve([])),
  writable: true,
});

// Mock Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    drawImage: vi.fn(),
    canvas: { toDataURL: vi.fn(() => 'data:image/jpeg;base64,test') },
  })),
});

// Mock toDataURL directly on canvas
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn(() => 'data:image/jpeg;base64,test'),
});

// Mock Image
Object.defineProperty(globalThis, 'Image', {
  value: class {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.width = 100;
      this.height = 100;
    }
    set src(value) {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  },
});

// Mock URL.createObjectURL
Object.defineProperty(globalThis.URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock-url'),
});
Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Mock localStorage
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});
