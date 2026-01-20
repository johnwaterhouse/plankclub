# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Plank Club** is a lightweight, offline-first exercise tracking web app for logging and sharing daily plank workouts. The app uses a Wordle-style emoji grid to visualize progress and includes real-time statistics tracking.

### Tech Stack
- **Pure vanilla JavaScript** (no frameworks)
- **HTML5 + CSS3** with CSS custom properties
- **Browser localStorage** for all data persistence
- **Web Audio API** for audio feedback
- **Screen Wake Lock API** for keeping screen on during timer
- **Zero dependencies** - no npm, no build tools, no server required

### Key Characteristics
- **Runs completely offline** after page load
- **No build process** - just open `index.html` in browser
- **Mobile-first design** with responsive breakpoints at 500px
- **Single-file persistence** using localStorage with YYYY-MM-DD keys
- **Wordle-style emoji sharing** with date ranges and stats

---

## Architecture & Data Flow

### Core Architecture (app.js - 1007 lines)

The app uses a single `PlankClub` class that manages all state and functionality:

```
PlankClub (class)
├── Data Layer
│   ├── localStorage persistence (YYYY-MM-DD keys → plank arrays)
│   └── Data migration (old single-number format → arrays)
├── View Management
│   ├── Two-page flow: setup ↔ timer-active
│   ├── setView() controls container data-view attribute
│   └── CSS hides/shows elements via .hide-on-timer-active
├── Timer System
│   ├── setInterval-based countdown (1s updates)
│   ├── Wake lock management
│   ├── Audio feedback (beep + metronome tick)
│   ├── Results modal with session stats
│   └── Start time display
├── Plank Logging
│   ├── Manual entry via input fields
│   ├── Timer-based automatic logging
│   └── Status messages with auto-clear timeout
├── UI Updates
│   ├── Progress grid (28-day calendar)
│   ├── Statistics calculations (streaks, categories)
│   └── ISO week numbers for sharing
└── Sharing Features
    ├── Emoji grid with ISO week number
    ├── WhatsApp integration
    └── Clipboard copy
```

### Data Model

**localStorage Format:**
```javascript
{
  "2025-11-14": [60, 45, 50],        // Array of plank durations in seconds
  "2025-11-13": [60, 60],
  "2025-11-12": [55]
}
```

**Timer Preferences (separate key):**
```javascript
// timerPreferences key
{
  "count": 3,          // Number of planks
  "duration": 60,      // Seconds per plank
  "rest": 30          // Seconds between planks
}
```

### State Management

**Timer State Machine:**
- `'idle'` - Not running, inputs enabled
- `'plank'` - Currently holding a plank
- `'rest'` - Rest period between planks
- `'paused'` - Timer paused, can resume

**Critical State Variables:**
- `timerState` - Current timer mode
- `completedPlanks[]` - Planks logged in current session
- `timeRemaining` - Seconds left in current phase
- `phaseStartTime` - Timestamp for drift-free calculations
- `lastMetronomeSecond` - Prevents duplicate tick sounds

---

## File Structure

### `index.html` (170 lines)
**Sections:**
- Timer control inputs (number, duration, rest)
- Timer display (time, status, progress, start time)
- Manual plank entry form (seconds + count)
- 28-day progress grid with legend
- Statistics cards (streaks, categories, totals)
- Share buttons (WhatsApp, clipboard)
- Settings modal (clear data)
- Confirmation modal

**Key IDs to reference:**
- `#progressGrid` - 28-day calendar blocks
- `#timerTime` - Large timer display
- `#timerStatus` - PLANK/REST/PAUSED indicator
- `#timerStartTime` - Shows session start time
- `#timerMessage` - Timer feedback messages
- `#todayStatus` - Manual entry feedback
- `#resultsModal` - Created dynamically after session

**View Management:**
- Container has `data-view` attribute ("setup" or "timer-active")
- Elements with `.hide-on-timer-active` hidden during timer

### `app.js` (1007 lines)
**Key Methods:**
- `init()` - Initialize app and load preferences
- `setView()` - Switch between setup and timer-active views
- `loadData()` - Load and migrate localStorage data
- `saveData()` - Persist data to localStorage
- `getTodayDate()` / `getDateDaysAgo()` - Timezone-safe date formatting
- `getISOWeek()` / `getISOWeekYear()` - ISO week calculations for sharing
- `startTimer()` / `pauseTimer()` / `stopTimer()` - Timer lifecycle
- `runTimer()` - Main timer loop with metronome logic
- `logPlank()` - Manual entry with status feedback
- `logTimedPlanks()` - Log completed session planks
- `renderProgressGrid()` - Create 28-day grid
- `calculateCurrentStreak()` / `calculateMaxStreak()` - Streak calculations
- `updateStats()` - Category counting and stat display
- `generateShareText()` - Wordle-style emoji grid with ISO week
- `shareProgress()` / `shareToWhatsApp()` - Share functionality
- `showResultsPage()` / `createResultsModal()` - Post-session modal
- `playBeep()` / `playMetronomeTick()` - Audio feedback
- `requestWakeLock()` / `releaseWakeLock()` - Screen wake lock

**Configuration (CONFIG object):**
- `DISPLAY_DAYS: 28` - Grid coverage
- `SHARE_DAYS: 7` - Days in share emoji grid
- `BEGINNER_MAX: 30` - Max seconds for beginner level (0-29s)
- `INTERMEDIATE_MAX: 60` - Max seconds for intermediate level (30-59s)
- `ADVANCED_MAX: 90` - Max seconds for advanced level (60-89s)
- `ELITE_MAX: 120` - Max seconds for elite level (90-119s)
- `PLANK_MIN_DURATION: 10` - Validation minimum
- `PLANK_MAX_DURATION: 600` - Validation maximum
- `MESSAGE_TIMEOUT: 3000` - Auto-hide message delay
- Audio parameters: `BEEP_FREQUENCY`, `BEEP_DURATION`, `BEEP_VOLUME`

### `styles.css` (926 lines)
**CSS Variables (38 custom properties):**
- Color system (primary, secondary, accent, 5 level colors)
- Spacing scale (xs, sm, md, lg, xl)
- Font sizes (base, heading, timer, input)
- Touch targets (44px minimum for WCAG compliance)

**Key Classes:**
- `.timer-*` - Timer display and controls
- `.progress-grid` - 28-day calendar (7-column layout)
- `.block` / `.block-today` / `.block-{level}` - Progress blocks
- `.stat-card` - Statistics display cards
- `.modal` / `.results-modal` - Settings and results modals
- `.hide-on-timer-active` - Elements hidden during timer session
- `[data-view="timer-active"]` - View state styling
- `@media (max-width: 500px)` - Mobile optimizations

**Responsive Breakpoints:**
- Desktop: 3-column stats grid, vertical timer inputs
- Mobile (<500px): 2-column stats, horizontal duration/rest inputs, full-width buttons

---

## Common Development Tasks

### Adding a New Feature

1. **Add configuration constant** to CONFIG if needed (min/max values, timeouts, etc.)
2. **Implement method** in PlankClub class
3. **Add event listener** in `setupEventListeners()` if user interaction needed
4. **Update `init()`** to call new initialization if required
5. **Add HTML elements** to index.html with semantic IDs
6. **Consider view management** - should element hide during timer? Add `.hide-on-timer-active`
7. **Add CSS variables** to `:root` in styles.css for colors/sizing
8. **Add styles** with mobile breakpoint consideration

### Fixing a Bug

1. **Check data validation** - Ensure loadData() validates the specific case
2. **Check error handling** - Verify try-catch wraps any localStorage/DOM operations
3. **Check race conditions** - Look for async code that could be interrupted
4. **Check timezone handling** - Use `getTodayDate()` or `getDateDaysAgo()` consistently
5. **Test with corrupted data** - Manually break localStorage to verify graceful handling

### Testing Changes

Since there's no build process:
1. Open `index.html` in browser
2. Open DevTools (F12) to check console for errors
3. Clear localStorage between tests: `localStorage.clear()`
4. Test mobile: DevTools responsive mode (500px breakpoint)
5. Test audio: Check browser audio permissions and context state

### Performance Considerations

- **DOM Updates**: `renderProgressGrid()` rebuilds entire grid - consider selective updates for optimization
- **Audio Context**: Single shared instance (`this.audioContext`) prevents memory leaks
- **LocalStorage**: Migrate data format on load once, not on every access
- **Timer Accuracy**: Uses `phaseStartTime` + elapsed calculation to prevent drift

---

## Critical Implementation Details

### Date Handling (Timezone-Safe)

**IMPORTANT:** All dates must use local timezone, never UTC.

✅ **Correct:**
```javascript
const dateStr = this.getTodayDate();
// OR this.getDateDaysAgo(n) for past dates
// Uses: `${year}-${month}-${day}` format with padded values
```

❌ **Wrong:**
```javascript
const dateStr = date.toISOString().split('T')[0];  // Uses UTC!
```

This is critical because users near midnight could log planks with incorrect dates.

**Note:** Some methods like `calculateCurrentStreak()` still use `toISOString()` for historical reasons - this is a known inconsistency that could cause edge-case bugs.

### Error Handling Pattern

```javascript
try {
    localStorage.setItem(key, JSON.stringify(data));
} catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        this.showTimerMessage('❌ Storage full! Please clear old data.', 'error');
    } else {
        console.error('Storage error:', e);
        this.showTimerMessage('❌ Failed to save data.', 'error');
    }
}
```

### Race Condition Prevention

When logging timed planks, capture the planks first:
```javascript
const planksToLog = [...this.completedPlanks];  // Snapshot before async
if (this.timerState !== 'idle') return;          // Guard against concurrent calls
this.data[today].push(...planksToLog);           // Safe to use snapshot
```

### Audio Context Management

- Single instance: `this.audioContext`
- Created on first use, reused forever (prevents resource leaks)
- Always wrapped in try-catch (graceful degradation if audio unavailable)
- Metronome tick checked with `lastMetronomeSecond !== timeRemaining` to prevent duplicates

---

## CSS Architecture

### Design System

**Color Palette:**
- Primary background: `#121213` (near black)
- Accent: `#6aaa64` (green success)
- Warning: `#b59f3b` (yellow)
- Error: `#b53b3b` (red)
- Beginner: `#b59f3b` (yellow - 🟨)
- Intermediate: `#538d4e` (green - 🟢)
- Advanced: `#6aaa64` (bright green - 💪)
- Elite: `#e67e22` (orange - 🔥)
- Champion: `#ffd700` (gold - 🏆)

**Text Contrast:**
- Muted text: `#999a9c` (improved to WCAG AA standards, ~5.1:1 ratio)

**Spacing Scale:**
- xs: 5px | sm: 10px | md: 15px | lg: 20px | xl: 30px

### Touch Targets

All interactive elements must be minimum 44px height (WCAG compliance):
```css
--touch-target-min: 44px;
button {
    min-height: var(--touch-target-min);
}
```

### Mobile Optimization

**Key Changes at 500px breakpoint:**
- Timer setup: 3 inputs → 1 full-width + 2 side-by-side
- Stats grid: 3 columns → 2 columns
- Buttons: Flex-wrap with full width
- Input: `font-size: 16px` (prevents iOS zoom)
- Timer section: Extra padding-bottom to ensure button visibility

---

## Known Limitations & Considerations

### Browser Support
- **Requires** localStorage support (all modern browsers)
- **Requires** ES6+ (arrow functions, const/let, template literals)
- **Optional** Screen Wake Lock API (gracefully degrades if unavailable)
- **Optional** Web Audio API (gracefully degrades if unavailable)
- **Optional** Clipboard API (falls back to manual copy)

### Storage Limits
- localStorage quota typically 5-10MB per domain
- Long-term users (5+ years of daily data) could approach limit
- Currently no cleanup/archival system - users must manually clear old data

### Performance Notes
- Full grid re-render (`renderProgressGrid()`) called on app load and after logPlank
- Could be optimized to only update changed blocks (no selective update method exists yet)
- Messages auto-clear after `MESSAGE_TIMEOUT` (3000ms)

### Accessibility
- Full WCAG AA compliance with ARIA labels
- Progress grid has `role="img"` with descriptive aria-label
- Status messages have `role="status"` with `aria-live="polite"`
- Color contrast meets AA standards

---

## Recent Refactoring (Latest Commits)

**Latest improvements (as of November 2025):**
1. **Two-page timer flow** - Clean separation between setup and active timer views
2. **ISO week numbers** - Share text now shows "Week X YYYY" instead of date range
3. **Results modal** - Session completion shows stats with sharing options
4. **Metronome countdown** - Audio tick in last 5 seconds of each phase
5. **Start time display** - Shows when timer session began
6. **View management** - `setView()` method with CSS-based element visibility

**Previous improvements:**
- Critical bug fixes (timezone, race conditions, storage quota, data validation)
- Accessibility (WCAG AA, ARIA labels, color contrast improvement)
- CSS organization (CSS variables for consistency)

For detailed history, see recent commits in git log.

---

## Quick Reference

### Run the App
```bash
# No build needed - just open in browser
open index.html
# or
python -m http.server 8000  # Serve locally if needed
```

### Test in Mobile View
- DevTools: Ctrl+Shift+M (Windows) or Cmd+Shift+M (Mac)
- Set width to 500px or less
- Test timer buttons, inputs, and grid layout

### Debug localStorage
```javascript
// In browser console:
localStorage.getItem('plankClubData')  // View all data
localStorage.getItem('timerPreferences')  // View timer settings
localStorage.clear()  // Clear everything
```

### Common Git Workflow
```bash
# Check status
git status

# Create feature branch
git checkout -b feature/description

# Make changes and test in browser

# Commit (use imperative mood)
git add .
git commit -m "Add feature: description of changes"

# Push to remote
git push -u origin feature/description

# Create PR on GitHub
gh pr create --title "..." --body "..."
```

---

## Questions to Ask Before Refactoring

1. **Does this change affect date handling?** If yes, use `getTodayDate()` or `getDateDaysAgo()` for timezone safety
2. **Does this involve localStorage?** If yes, add error handling for QuotaExceededError
3. **Does this modify timer state?** If yes, check for race conditions and guard against concurrent calls
4. **Does this add configurable values?** If yes, add to CONFIG constant for centralized management
5. **Does this affect the timer view?** If yes, consider `.hide-on-timer-active` for elements
6. **Does this affect mobile?** If yes, test at 500px breakpoint
