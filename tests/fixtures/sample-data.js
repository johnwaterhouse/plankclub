/**
 * Sample plank data for testing
 */

export const SAMPLE_DATA_SINGLE_PLANK = {
  '2025-11-28': [60]
};

export const SAMPLE_DATA_MULTIPLE_PLANKS = {
  '2025-11-28': [60, 45, 50]
};

export const SAMPLE_DATA_WEEK = {
  '2025-11-28': [60, 60, 60],
  '2025-11-27': [60, 50],
  '2025-11-26': [55],
  '2025-11-25': [60, 60],
  '2025-11-24': [65],
  '2025-11-23': [60],
  '2025-11-22': [45, 55, 50]
};

export const SAMPLE_DATA_WITH_GAPS = {
  '2025-11-28': [60, 60, 60],
  '2025-11-27': [60],
  '2025-11-25': [60], // Gap on 2025-11-26
  '2025-11-24': [60],
  '2025-11-20': [60] // Gap on 2025-11-23, 22, 21
};

export const SAMPLE_DATA_OLD_FORMAT = {
  '2025-11-28': 60, // Old format: single number instead of array
  '2025-11-27': 45
};

export const SAMPLE_DATA_MIXED_DURATIONS = {
  '2025-11-28': [10, 15, 20], // Beginner
  '2025-11-27': [29, 30, 31], // Beginner/Intermediate boundary
  '2025-11-26': [59, 60, 61], // Intermediate/Advanced boundary
  '2025-11-25': [100, 120, 150] // Advanced
};

export const SAMPLE_DATA_EMPTY_ENTRIES = {
  '2025-11-28': [],
  '2025-11-27': [60],
  '2025-11-26': undefined
};

export const SAMPLE_DATA_INVALID_VALUES = {
  '2025-11-28': [60, 'invalid', null],
  '2025-11-27': [NaN, 60, Infinity]
};

/**
 * Sample timer preferences
 */

export const TIMER_PREFERENCES_DEFAULT = {
  count: 3,
  duration: 60,
  rest: 30
};

export const TIMER_PREFERENCES_CUSTOM = {
  count: 5,
  duration: 90,
  rest: 45
};

export const TIMER_PREFERENCES_MINIMAL = {
  count: 1,
  duration: 10,
  rest: 5
};

export const TIMER_PREFERENCES_MAXIMAL = {
  count: 10,
  duration: 600,
  rest: 180
};

/**
 * Helper functions for test data
 */

export function createDateData(baseDate, daysOffset = 0) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createConsecutiveDays(baseDate, count, planks = [60]) {
  const data = {};
  for (let i = 0; i < count; i++) {
    const date = createDateData(baseDate, -i);
    data[date] = planks;
  }
  return data;
}

export function createGappedData(baseDate, pattern = [true, true, false]) {
  const data = {};
  let dayOffset = 0;
  for (const hasData of pattern) {
    const date = createDateData(baseDate, -dayOffset);
    if (hasData) {
      data[date] = [60];
    }
    dayOffset++;
  }
  return data;
}
