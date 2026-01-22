# 💪 Plank Club

Track and share your daily plank exercises with friends, Wordle-style!

**Live at: [pcjohn.co.uk](https://pcjohn.co.uk)**

## Features

### Timer Modes
- **Fixed Duration Timer** - Set number of planks, duration, and rest time
- **Plank to Failure** - Unlimited planks, timer counts up until you stop
  - Milestone sounds at 30s, then every 10s
  - Personal best tracking with celebration sound
  - Manual rest control (press Go when ready)

### Progress Tracking
- 📊 Track multiple planks per day with individual durations
- 📅 Visual progress grid showing your last 28 days
- 🏆 Color-coded blocks (like Wordle):
  - ⬜ No plank
  - 🟨 Beginner (< 30 seconds)
  - 🟢 Intermediate (30-60 seconds)
  - 💪 Advanced (60-90 seconds)
  - 🔥 Elite (90-120 seconds)
  - 🏆 Champion (120+ seconds)
  - ❤️ Life used (streak preserved)
- 📈 Stats: current streak, best streak, planks by category

### Lives System
- ❤️ Earn 1 life for every 10 planks completed
- Use lives to fill missed days and preserve your streak
- Auto-notification when eligible to use a life
- Lives displayed in stats (Available/Used)

### Sharing
- 📤 Copy progress to clipboard
- 💬 Direct WhatsApp share
- Shows ISO week number and stats

### Technical
- 💾 All data stored locally (no server required)
- 📱 Screen wake lock during timer
- 🔊 Audio feedback (beeps, metronome countdown)
- Works completely offline after first load

## How to Use

### Timer Mode
1. Set number of planks, duration (seconds), and rest time
2. Or check "Plank to Failure" for unlimited mode
3. Press Start Timer
4. In failure mode: press Done when you fail, Go to start next plank
5. Press Stop to end session

### Manual Entry
1. Enter time in seconds
2. Set count (for multiple identical planks)
3. Click "Log Plank"

### Share Progress
Click WhatsApp or Copy button to share your weekly emoji grid!

## Example Share

```
💪 Plank Club
Week 47 2025

⬜🟨🟢💪🔥🏆💪

📅 Today: 3 planks (180s)
🔥 Streak: 5 | Total Planks: 42

Join me at Plank Club!
https://pcjohn.co.uk
```

## Running Locally

No build process needed!
1. Clone this repository
2. Open `index.html` in any modern web browser
3. Start tracking your planks!

## Deployment

Deployed via Vercel from the `main` branch. Push to main triggers automatic deployment.

## Tech Stack

- Pure HTML, CSS, and vanilla JavaScript
- No dependencies, no build tools
- Web Audio API for sounds
- Screen Wake Lock API
- localStorage for persistence

---

Made with 💪 for fitness enthusiasts everywhere!
