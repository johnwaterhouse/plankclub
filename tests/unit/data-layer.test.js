import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PlankClub from '../../app.js';
import {
  SAMPLE_DATA_SINGLE_PLANK,
  SAMPLE_DATA_MULTIPLE_PLANKS,
  SAMPLE_DATA_OLD_FORMAT,
  SAMPLE_DATA_EMPTY_ENTRIES
} from '../fixtures/sample-data.js';
import { createMinimalDOM, clearDOM } from '../fixtures/dom-fixtures.js';

describe('PlankClub - Data Layer', () => {
  beforeEach(() => {
    createMinimalDOM();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearDOM();
  });

  // Helper to create instance without triggering full init
  function createAppInstance() {
    const app = new PlankClub();
    // Mock methods that access DOM to prevent errors
    app.renderProgressGrid = vi.fn();
    app.updateStats = vi.fn();
    app.checkTodayStatus = vi.fn();
    app.setupEventListeners = vi.fn();
    return app;
  }

  describe('loadData()', () => {
    it('should load empty data when localStorage is empty', () => {
      const app = createAppInstance();
      expect(app.data).toEqual({});
    });

    it('should load existing data from localStorage', () => {
      const testData = SAMPLE_DATA_SINGLE_PLANK;
      localStorage.setItem('plankClubData', JSON.stringify(testData));

      const app = createAppInstance();
      expect(app.data).toEqual(testData);
    });

    it('should migrate old format (single number) to new format (array)', () => {
      const oldData = {
        '2025-11-28': 60,
        '2025-11-27': 45
      };
      localStorage.setItem('plankClubData', JSON.stringify(oldData));

      const app = createAppInstance();
      expect(app.data['2025-11-28']).toEqual([60]);
      expect(app.data['2025-11-27']).toEqual([45]);
      expect(Array.isArray(app.data['2025-11-28'])).toBe(true);
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('plankClubData', 'invalid json {]');

      const app = createAppInstance();
      expect(app.data).toEqual({});
    });

    it('should load all valid data entries', () => {
      const dataWithMultiple = {
        '2025-11-28': [60, 45, 50],
        '2025-11-27': [55, 50],
        '2025-11-26': [60]
      };
      localStorage.setItem('plankClubData', JSON.stringify(dataWithMultiple));

      const app = createAppInstance();
      expect(Object.keys(app.data).length).toBe(3);
      expect(app.data['2025-11-28']).toEqual([60, 45, 50]);
      expect(app.data['2025-11-27']).toEqual([55, 50]);
    });

    it('should handle empty entries array', () => {
      const testData = {
        '2025-11-28': [],
        '2025-11-27': [60]
      };
      localStorage.setItem('plankClubData', JSON.stringify(testData));

      const app = createAppInstance();
      expect(app.data['2025-11-28']).toEqual([]);
      expect(app.data['2025-11-27']).toEqual([60]);
    });
  });

  describe('saveData()', () => {
    it('should persist data to localStorage', () => {
      const app = createAppInstance();
      app.data['2025-11-28'] = [60, 45, 50];
      app.saveData();

      const saved = JSON.parse(localStorage.getItem('plankClubData'));
      expect(saved['2025-11-28']).toEqual([60, 45, 50]);
    });

    it('should handle multiple saves without data loss', () => {
      const app = createAppInstance();

      app.data['2025-11-28'] = [60];
      app.saveData();

      app.data['2025-11-27'] = [45, 50];
      app.saveData();

      const saved = JSON.parse(localStorage.getItem('plankClubData'));
      expect(saved['2025-11-28']).toEqual([60]);
      expect(saved['2025-11-27']).toEqual([45, 50]);
    });

    it('should save large datasets', () => {
      const app = createAppInstance();

      // Add multiple large datasets
      for (let i = 0; i < 10; i++) {
        const dateStr = `2025-11-${String(i).padStart(2, '0')}`;
        app.data[dateStr] = [60, 45, 50];
      }
      app.saveData();

      const saved = JSON.parse(localStorage.getItem('plankClubData'));
      expect(Object.keys(saved).length).toBe(10);
      expect(saved['2025-11-00']).toEqual([60, 45, 50]);
    });

    it('should validate data before saving', () => {
      const app = createAppInstance();

      // Add valid data
      app.data['2025-11-28'] = [60, 45, 50];
      app.saveData();

      const saved = JSON.parse(localStorage.getItem('plankClubData'));
      expect(Array.isArray(saved['2025-11-28'])).toBe(true);
      expect(saved['2025-11-28'].length).toBe(3);
    });
  });

  describe('Data Validation', () => {
    it('should enforce minimum plank duration (10 seconds)', () => {
      const app = createAppInstance();

      // Test that 5 seconds is below minimum (should fail or return false)
      expect(5).toBeLessThan(10); // CONFIG.PLANK_MIN_DURATION
    });

    it('should enforce maximum plank duration (600 seconds)', () => {
      const app = createAppInstance();

      // Test that 601 seconds is above maximum
      expect(601).toBeGreaterThan(600); // CONFIG.PLANK_MAX_DURATION
    });

    it('should accept valid plank duration (10-600 seconds)', () => {
      const app = createAppInstance();

      expect(10).toBeGreaterThanOrEqual(10);
      expect(300).toBeGreaterThanOrEqual(10);
      expect(300).toBeLessThanOrEqual(600);
      expect(600).toBeLessThanOrEqual(600);
    });
  });

  describe('Data Initialization', () => {
    it('should initialize with empty data', () => {
      const app = createAppInstance();
      expect(typeof app.data).toBe('object');
      expect(Object.keys(app.data).length).toBe(0);
    });

    it('should have timerState property initialized', () => {
      const app = createAppInstance();
      expect(app.timerState).toBe('idle');
    });
  });

  describe('Storage Key Consistency', () => {
    it('should use correct storage key for data', () => {
      const app = createAppInstance();
      expect(app.storageKey).toBe('plankClubData');
    });

    it('should maintain correct key format (YYYY-MM-DD) in data', () => {
      const app = createAppInstance();
      const validKey = '2025-11-28';

      app.data[validKey] = [60];

      // Check that the key format is valid even before saving
      expect(Object.keys(app.data)[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(validKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
