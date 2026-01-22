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

### Core Architecture (app.js - 814 lines)

The app uses a single `PlankClub` class that manages all state and functionality:

```
PlankClub (class)
├── Data Layer
│   ├── localStorage persistence (YYYY-MM-DD keys → plank arrays)
│   └── Data validation on load
├── Timer System
│   ├── setInterval-based countdown (1s updates)
│   ├── Wake lock management
│   ├── Audio feedback (beep + metronome tick)
│   └── Results modal with sharing
├── Plank Logging
│   ├── Manual entry via input fields
│   ├── Timer-based automatic logging
│   └── Debounced status messages
├── UI Updates
│   ├── Progress grid (28-day calendar)
│   ├── Statistics calculations (streaks, categories)
│   └── Progress block updates (selective DOM manipulation)
└── Sharing Features
    ├── Emoji grid generation
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

### `index.html` (168 lines)
**Sections:**
- Timer control inputs (number, duration, rest)
- Timer display (time, status, progress)
- Manual plank entry form
- 28-day progress grid with legend
- Statistics cards (streaks, categories, totals)
- Share buttons (WhatsApp, clipboard)
- Settings modal (clear data)
- Confirmation modal

**Key IDs to reference:**
- `#progressGrid` - 28-day calendar blocks
- `#timerTime` - Large timer display
- `#timerStatus` - PLANK/REST/PAUSED indicator
- `#timerMessage` - Timer feedback messages
- `#todayStatus` - Manual entry feedback
- `#resultsModal` - Created dynamically after session

### `app.js` (814 lines)
**Message Constants (MESSAGES object):**
- User-facing messages organized by category
- Templated with parameters for consistency
- Centralized for internationalization support

**Key Methods:**
- `init()` - Initialize app and load preferences
- `loadData()` - Validate and migrate localStorage data
- `saveData()` - Try-catch wrapped localStorage writes
- `startTimer()` / `pauseTimer()` / `stopTimer()` - Timer lifecycle
- `runTimer()` - Main timer loop with metronome logic
- `logPlank()` - Manual entry with debounced status
- `logTimedPlanks()` - Race-condition-safe session logging
- `renderProgressGrid()` - Initial grid creation
- `updateProgressBlockForDate()` - Selective DOM update
- `calculateCurrentStreak()` / `calculateMaxStreak()` - Streak calculations
- `updateStats()` - Category counting and stat display
- `generateShareText()` - Wordle-style emoji grid
- `shareProgress()` / `shareToWhatsApp()` - Share functionality
- `showResultsPage()` - Post-session modal

**Configuration (CONFIG object):**
- `DISPLAY_DAYS: 28` - Grid coverage
- `PLANK_MIN_DURATION: 10` - Validation minimum
- `PLANK_MAX_DURATION: 600` - Validation maximum
- `MESSAGE_TIMEOUT: 3000` - Auto-hide message delay
- Audio parameters: `BEEP_FREQUENCY`, `BEEP_DURATION`, `BEEP_VOLUME`

### `styles.css` (780 lines)
**CSS Variables (36 custom properties):**
- Color system (primary, secondary, accent, level colors)
- Spacing scale (xs, sm, md, lg, xl)
- Font sizes (base, heading, timer, input)
- Touch targets (44px minimum for WCAG compliance)

**Key Classes:**
- `.timer-*` - Timer display and controls
- `.progress-grid` - 28-day calendar (7-column layout)
- `.block` / `.block-today` / `.block-{level}` - Progress blocks
- `.stat-card` - Statistics display cards
- `.modal` - Settings and results modals
- `@media (max-width: 500px)` - Mobile optimizations

**Responsive Breakpoints:**
- Desktop: 3-column stats grid, vertical timer inputs
- Mobile (<500px): 2-column stats, horizontal duration/rest inputs, full-width buttons

---

## Common Development Tasks

### Adding a New Feature

1. **Update MESSAGES object** in app.js if adding user-facing text
2. **Add configuration constant** to CONFIG if needed (min/max values, timeouts, etc.)
3. **Implement method** in PlankClub class
4. **Add event listener** in `setupEventListeners()` if user interaction needed
5. **Update `init()`** to call new initialization if required
6. **Add HTML elements** to index.html with semantic IDs
7. **Add CSS variables** to `:root` in styles.css for colors/sizing
8. **Add styles** with mobile breakpoint consideration

### Fixing a Bug

1. **Check data validation** - Ensure loadData() validates the specific case
2. **Check error handling** - Verify try-catch wraps any localStorage/DOM operations
3. **Check race conditions** - Look for async code that could be interrupted
4. **Check timezone handling** - Use `formatDateAsKey()` consistently
5. **Test with corrupted data** - Manually break localStorage to verify graceful handling

### Testing Changes

Since there's no build process:
1. Open `index.html` in browser
2. Open DevTools (F12) to check console for errors
3. Clear localStorage between tests: `localStorage.clear()`
4. Test mobile: DevTools responsive mode (500px breakpoint)
5. Test audio: Check browser audio permissions and context state

### Performance Considerations

- **DOM Updates**: Use `updateProgressBlockForDate()` instead of `renderProgressGrid()` for single-day changes
- **Message Debouncing**: Uses `statusMessageTimeout` to prevent flicker from rapid updates
- **Audio Context**: Single shared instance prevents memory leaks
- **LocalStorage**: Validate on load once, not on every access

---

## Critical Implementation Details

### Date Handling (Timezone-Safe)

**IMPORTANT:** All dates must use local timezone, never UTC.

✅ **Correct:**
```javascript
const dateStr = this.formatDateAsKey(new Date());
// OR manually: `${year}-${month}-${day}` format
```

❌ **Wrong:**
```javascript
const dateStr = date.toISOString().split('T')[0];  // Uses UTC!
```

This is critical because users near midnight could log planks with incorrect dates.

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
- Beginner: `#b59f3b` (yellow emoji color)
- Intermediate: `#538d4e` (green emoji color)
- Advanced: `#6aaa64` (bright green emoji color)

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
- Full grid re-render called on app load and after logPlank
- Could be optimized to only update changed blocks
- `updateProgressBlockForDate()` method exists for selective updates
- Message debouncing prevents flicker from rapid updates

### Accessibility
- Full WCAG AA compliance with ARIA labels
- Progress grid has `role="img"` with descriptive aria-label
- Status messages have `role="status"` with `aria-live="polite"`
- Color contrast meets AA standards

---

## Recent Refactoring (Latest Commits)

**Last major improvements included:**
1. Critical bug fixes (timezone, race conditions, storage quota, data validation)
2. Code consolidation (streak logic, message constants)
3. Performance optimization (selective DOM updates with `updateProgressBlockForDate()`)
4. Message system (debouncing with `showDebouncedStatusMessage()`)
5. Accessibility (WCAG AA, ARIA labels, color contrast improvement)
6. CSS organization (CSS variables for consistency)

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

## Deployment Guidelines

### Current Setup: GitHub → Vercel Auto-Deploy

**Repository**: GitHub repo (`johnwaterhouse/plankclub`)
**Platform**: Vercel (auto-deploy on push to main)
**Build**: No build process (static files)  

### Pre-Deployment Checklist
```bash
# 1. Ensure tests pass
npm test

# 2. Check mobile layout
# Test at 500px breakpoint in DevTools

# 3. Verify offline functionality
# Disconnect network and test app

# 4. Check console for errors
# Open DevTools and verify no errors
```

### Security Headers (TODO)
```json
// vercel.json (recommended for security)
{
  "buildCommand": null,
  "outputDirectory": ".",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Deployment Workflow
1. **Commit to main branch** → Vercel auto-deploys to production
2. **Feature branches** → Create PR → Vercel creates deploy preview
3. **Rollback** → Use Vercel dashboard to revert deployments

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

1. **Does this change affect date handling?** If yes, verify timezone consistency with `formatDateAsKey()`
2. **Does this involve localStorage?** If yes, add error handling for QuotaExceededError
3. **Does this modify timer state?** If yes, check for race conditions and guard against concurrent calls
4. **Does this add UI text?** If yes, add message to MESSAGES constant
5. **Does this add new values?** If yes, add to CONFIG constant for centralized management
6. **Does this affect mobile?** If yes, test at 500px breakpoint
