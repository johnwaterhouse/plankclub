import { beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// LocalStorage Mock
// ============================================================================

class LocalStorageMock {
  constructor() {
    this.store = new Map();
    this.quotaExceededError = false;
  }

  getItem(key) {
    return this.store.get(key) || null;
  }

  setItem(key, value) {
    if (this.quotaExceededError) {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    }

    // Simulate 5MB quota
    const totalSize = Array.from(this.store.values()).reduce((sum, val) => sum + val.length, 0);
    if (totalSize + value.length > 5242880) { // 5MB
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    }

    this.store.set(key, value);
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }

  get length() {
    return this.store.size;
  }

  // Test utility to simulate quota exceeded
  simulateQuotaExceeded(enabled = true) {
    this.quotaExceededError = enabled;
  }
}

// ============================================================================
// AudioContext Mock
// ============================================================================

class OscillatorMock {
  constructor() {
    this.type = 'sine';
    this.frequency = { value: 0 };
    this.start = vi.fn();
    this.stop = vi.fn();
  }

  connect(destination) {
    return destination;
  }
}

class GainNodeMock {
  constructor() {
    this.gain = { value: 1 };
  }

  connect(destination) {
    return destination;
  }
}

class AudioContextMock {
  constructor() {
    this.state = 'running';
    this.destination = {};
    this.createOscillator = vi.fn(() => new OscillatorMock());
    this.createGain = vi.fn(() => new GainNodeMock());
    this.resume = vi.fn(async () => {});
    this.currentTime = 0;
  }
}

// ============================================================================
// Wake Lock API Mock
// ============================================================================

class WakeLockSentinelMock {
  constructor() {
    this.released = false;
    this.release = vi.fn(async () => {
      this.released = true;
    });
  }
}

class WakeLockMock {
  request = vi.fn(async () => new WakeLockSentinelMock());
}

// ============================================================================
// Clipboard API Mock
// ============================================================================

class ClipboardMock {
  writeText = vi.fn(async (text) => {
    return undefined;
  });

  readText = vi.fn(async () => {
    return '';
  });
}

// ============================================================================
// Global Setup
// ============================================================================

// Replace localStorage with mock
const localStorageMock = new LocalStorageMock();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock AudioContext
window.AudioContext = AudioContextMock;
window.webkitAudioContext = AudioContextMock;

// Mock navigator.wakeLock
Object.defineProperty(navigator, 'wakeLock', {
  value: new WakeLockMock(),
  writable: true,
  configurable: true
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: new ClipboardMock(),
  writable: true,
  configurable: true
});

// Mock navigator.share
navigator.share = vi.fn(async (data) => {
  return undefined;
});

// Mock window.open
window.open = vi.fn();

// ============================================================================
// Hook: Clear localStorage and reset mocks before each test
// ============================================================================

beforeEach(() => {
  localStorage.clear();
  localStorageMock.simulateQuotaExceeded(false);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllTimers();
});

// ============================================================================
// Test Utilities
// ============================================================================

export function setupPlankClubInstance() {
  // Import PlankClub class from app.js
  // This will be available after PlankClub is exported from app.js
}

export function getLocalStorageMock() {
  return localStorageMock;
}

export function simulateQuotaExceeded(enabled = true) {
  localStorageMock.simulateQuotaExceeded(enabled);
}

export function createSamplePlankData(date, planks = [60, 60, 60]) {
  localStorage.setItem(`plankClubData`, JSON.stringify({
    [date]: planks
  }));
}
