# AGENTS.md - Development Guide for Plank Club

This file contains comprehensive guidelines for agentic coding agents working on the Plank Club codebase.

## Project Overview

Plank Club is an offline-first exercise tracking web application built with vanilla JavaScript. The app runs entirely in the browser using localStorage for data persistence, with zero production dependencies.

## Build/Lint/Test Commands

### Testing Commands
```bash
npm test                    # Run all tests once (required for commits)
npm run test:watch          # Run tests in watch mode for development
npm run test:ui            # Run tests with Vitest UI interface
npm run test:coverage      # Run tests with coverage report (80% thresholds)
```

### Git Hooks
- Pre-commit hook automatically runs `npm test`
- Tests must pass before commits are allowed

### Running Single Tests
```bash
# Run a specific test file
npx vitest run tests/unit/data-layer.test.js

# Run a specific test in watch mode
npx vitest tests/unit/data-layer.test.js

# Run tests matching a pattern
npx vitest --grep "should save plank data"
```

## Code Style Guidelines

### JavaScript Conventions
- **ES6 modules** (`"type": "module"`) with imports at file top
- **Single class architecture**: Main `PlankClub` class in `app.js`
- **Configuration object**: All magic numbers in `CONFIG` constant
- **Constants first**: Configuration and message constants at file top
- **Method grouping**: Organize by functionality (data layer, timer, UI)

#### Naming Conventions
- **Classes**: PascalCase (`PlankClub`)
- **Methods/Variables**: camelCase (`loadData()`, `currentPlank`)
- **Constants**: UPPER_SNAKE_CASE (`DISPLAY_DAYS`, `BEEP_FREQUENCY`)
- **CSS Classes**: kebab-case with BEM (`.timer-section`, `.progress-grid`)

#### Error Handling
- **localStorage operations**: Always wrapped in try-catch
- **DOM manipulations**: Wrapped in try-catch for optional APIs
- **Browser APIs**: Feature detection with graceful fallbacks
- **Time/Date**: Local timezone, YYYY-MM-DD format, durations in seconds

### CSS Conventions
- **CSS Variables**: 36+ custom properties in `:root` with semantic naming
- **Responsive**: Mobile-first, 500px breakpoint, 44px minimum touch targets
- **iOS Optimization**: `font-size: 16px` on inputs to prevent zoom
- **BEM Patterns**: `.component-name`, `.component-name__element`, `.component-name--modifier`
- **State Classes**: `.active`, `.paused`, `.completed`

### File Organization
```
plankclub/
├── app.js              # Main PlankClub class
├── index.html          # Single HTML file
├── styles.css          # Complete CSS with variables
├── package.json        # ES6 modules, testing config
├── tests/
│   ├── setup.js        # Browser API mocks
│   ├── unit/           # Unit tests
│   └── fixtures/       # Test data/utilities
└── README.md           # User documentation
```

## Testing Guidelines
- **Vitest + happy-dom** with 80% coverage thresholds (75% branches)
- **Mock-heavy approach** for all browser APIs (LocalStorage, AudioContext, etc.)
- **Unit tests** focus on business logic and data layer
- **Arrange-Act-Assert** pattern with descriptive test names
- **Test fixtures**: Use `tests/fixtures/` for data generators
- **Setup**: Check `tests/setup.js` for available mocks before writing new tests

## Development Best Practices
- **State Management**: Single source of truth in `PlankClub` class, localStorage with YYYY-MM-DD keys
- **Browser APIs**: Feature detection, graceful degradation, shared AudioContext, proper wake lock handling
- **Mobile**: Touch-friendly, responsive, full-screen capable, offline-first
- **Event-driven**: DOM listeners trigger class methods

## Code Review Checklist
- localStorage operations wrapped in try-catch
- Browser APIs checked for availability before use
- Configuration values from `CONFIG` object
- CSS variables instead of hardcoded values
- Mobile-first responsive design
- Tests written for new functionality
- Descriptive error messages
- Existing patterns and naming conventions followed

## Deployment Guidelines

### Current Setup: GitHub → Vercel Auto-Deploy

**Repository**: Private GitHub repo (`johnwaterhouse/plankclub`)  
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

### Local Development
```bash
# Direct file access
open index.html

# Or local server
python -m http.server 8000
```

## Common Issues & Debugging
- **LocalStorage quota**: Handle gracefully with user notification
- **Audio context**: Provide visual feedback if not supported
- **Wake lock**: Continue without it if unavailable
- **iOS zoom**: Ensure 16px font size on inputs
- **Tools**: VS Code Vitest integration, git hooks, coverage reports