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

#### Modules and Imports
- Use ES6 modules (`"type": "module"` in package.json)
- Import statements at the top of files
- Use named exports for utilities, default export for main classes

#### Code Structure
- **Single class architecture**: Main `PlankClub` class in `app.js` contains all functionality
- **Configuration object**: All magic numbers centralized in `CONFIG` constant
- **Constants first**: Place all configuration and message constants at the top of files
- **Method grouping**: Organize related methods together (data layer, timer, UI, etc.)

#### Naming Conventions
- **Classes**: PascalCase (`PlankClub`)
- **Methods**: camelCase with descriptive verbs (`loadData()`, `startTimer()`)
- **Variables**: camelCase, meaningful names (`currentPlank`, `timeRemaining`)
- **Constants**: UPPER_SNAKE_CASE for configuration (`DISPLAY_DAYS`, `BEEP_FREQUENCY`)
- **CSS Classes**: kebab-case with BEM-like naming (`.timer-section`, `.progress-grid`)

#### Error Handling
- **Always wrap localStorage operations** in try-catch blocks
- **Wrap all DOM manipulations** in try-catch for optional APIs
- **Handle browser API availability** with feature detection and graceful fallbacks
- **Use descriptive error messages** with context

#### Time and Date Handling
- **Always use local timezone** - never UTC
- **Use YYYY-MM-DD format** for localStorage keys
- **Store durations in seconds**, convert to display format only when needed

### CSS Conventions

#### CSS Variables
- **36 CSS custom properties** defined in `:root` for consistent theming
- **Semantic naming**: `--bg-primary`, `--text-secondary`, `--color-success`
- **Group related variables**: Background colors, text colors, accent colors together

#### Responsive Design
- **Mobile-first approach** with breakpoint at 500px
- **Touch targets minimum 44px** (WCAG compliance)
- **iOS-specific optimization**: `font-size: 16px` to prevent zoom on input focus

#### Class Naming
- **BEM-like patterns**: `.component-name`, `.component-name__element`, `.component-name--modifier`
- **Descriptive names**: `.stat-card`, `.progress-grid`, `.timer-section`
- **State classes**: `.active`, `.paused`, `.completed`

### File Organization

#### Main Application Files
```
plankclub/
├── app.js              # Main application logic (PlankClub class)
├── index.html          # Single HTML file with semantic structure
├── styles.css          # Complete CSS with variables
├── package.json        # ES6 modules, testing configuration
└── README.md           # User-facing documentation
```

#### Testing Structure
```
tests/
├── setup.js           # Comprehensive mocks for browser APIs
├── unit/
│   └── data-layer.test.js  # Data layer tests
└── fixtures/
    ├── sample-data.js      # Test data generators
    └── dom-fixtures.js     # DOM setup utilities
```

## Testing Guidelines

### Test Environment
- **Vitest** with **happy-dom** for DOM mocking
- **Coverage thresholds**: 80% statements/lines/functions, 75% branches
- **Test timeout**: 10 seconds
- **Mocks**: LocalStorage, AudioContext, Wake Lock API, Clipboard API

### Test Writing Patterns
- **Unit tests** focus on business logic and data layer
- **Mock-heavy approach** for all browser APIs
- **Comprehensive fixtures** for various data scenarios
- **Arrange-Act-Assert** pattern consistently
- **Descriptive test names** that explain the behavior

### Before Writing New Tests
1. Check `tests/fixtures/` for existing data generators
2. Review `tests/setup.js` for available mocks
3. Follow existing test patterns in `tests/unit/`

## Development Best Practices

### State Management
- **Single source of truth**: `PlankClub` class manages all state
- **Data persistence**: localStorage with YYYY-MM-DD keys mapping to plank duration arrays
- **Event-driven architecture**: DOM event listeners trigger class methods

### Browser API Usage
- **Feature detection required** before using optional APIs
- **Graceful degradation** for unsupported features
- **Memory management**: Shared AudioContext to prevent leaks
- **Wake lock**: Request and manage properly with error handling

### Mobile Optimization
- **Touch-friendly interface** with proper tap targets
- **Responsive design** optimized for phones and tablets
- **Full-screen capabilities** enabled for app-like experience
- **Offline-first functionality** - works without internet connection

## Code Review Checklist

- [ ] All localStorage operations wrapped in try-catch
- [ ] Browser APIs checked for availability before use
- [ ] Configuration values pulled from `CONFIG` object
- [ ] CSS variables used instead of hardcoded values
- [ ] Mobile-first responsive design considered
- [ ] Tests written for new functionality
- [ ] Error messages are descriptive and user-friendly
- [ ] Code follows existing patterns and naming conventions
- [ ] Documentation updated if needed

## Debugging and Development

### Common Issues
- **LocalStorage quota exceeded** - handle gracefully with user notification
- **Audio context not supported** - provide visual feedback instead
- **Wake lock not available** - continue without it, no blocking
- **iOS zoom on focus** - ensure 16px font size on inputs

### Development Tools
- **VS Code settings** configured for Vitest integration
- **Git hooks** ensure test quality
- **Coverage reports** help maintain test standards
- **Comprehensive logging** for debugging state changes

This guide ensures consistency and quality across all development activities in the Plank Club codebase.