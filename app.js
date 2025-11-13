// Plank Club - Exercise Tracking App
// All data stored in localStorage

class PlankClub {
    constructor() {
        this.storageKey = 'plankClubData';
        this.data = this.loadData();
        this.init();
    }

    // Initialize the app
    init() {
        this.renderProgressGrid();
        this.updateStats();
        this.setupEventListeners();
        this.checkTodayStatus();
    }

    // Load data from localStorage
    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {};
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // Get date N days ago
    getDateDaysAgo(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
    }

    // Format date for display (e.g., "Nov 13")
    formatDateDisplay(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
    }

    // Get block class based on plank time
    getBlockClass(seconds) {
        if (!seconds || seconds === 0) return 'block-empty';
        if (seconds < 30) return 'block-beginner';
        if (seconds < 60) return 'block-intermediate';
        return 'block-advanced';
    }

    // Get emoji for sharing based on plank time
    getBlockEmoji(seconds) {
        if (!seconds || seconds === 0) return '⬜';
        if (seconds < 30) return '🟨';
        if (seconds < 60) return '🟩';
        return '🟢';
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('submitBtn').addEventListener('click', () => this.logPlank());
        document.getElementById('plankTime').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.logPlank();
        });
        document.getElementById('shareBtn').addEventListener('click', () => this.shareProgress());
    }

    // Check if user has already logged today
    checkTodayStatus() {
        const today = this.getTodayDate();
        const todayData = this.data[today];
        const statusDiv = document.getElementById('todayStatus');
        const input = document.getElementById('plankTime');

        if (todayData) {
            statusDiv.className = 'status-message success';
            statusDiv.textContent = `✅ Today's plank logged: ${todayData}s`;
            input.value = todayData;
        }
    }

    // Log today's plank
    logPlank() {
        const input = document.getElementById('plankTime');
        const seconds = parseInt(input.value);
        const statusDiv = document.getElementById('todayStatus');

        if (isNaN(seconds) || seconds < 0) {
            statusDiv.className = 'status-message error';
            statusDiv.textContent = '❌ Please enter a valid time in seconds';
            return;
        }

        const today = this.getTodayDate();
        this.data[today] = seconds;
        this.saveData();

        statusDiv.className = 'status-message success';
        statusDiv.textContent = `✅ Plank logged: ${seconds}s`;

        // Refresh UI
        this.renderProgressGrid();
        this.updateStats();

        // Clear message after 3 seconds
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-message';
        }, 3000);
    }

    // Render the progress grid
    renderProgressGrid() {
        const grid = document.getElementById('progressGrid');
        grid.innerHTML = '';

        const today = this.getTodayDate();
        const daysToShow = 28; // 4 weeks

        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = this.getDateDaysAgo(i);
            const seconds = this.data[date] || 0;
            const blockClass = this.getBlockClass(seconds);

            const block = document.createElement('div');
            block.className = `block ${blockClass}`;

            if (date === today) {
                block.classList.add('block-today');
            }

            // Add tooltip with date and time
            const displayDate = this.formatDateDisplay(date);
            const timeText = seconds ? `${seconds}s` : 'No plank';
            block.title = `${displayDate}: ${timeText}`;

            // Show seconds in the block
            if (seconds > 0) {
                block.textContent = seconds;
            }

            grid.appendChild(block);
        }
    }

    // Calculate current streak
    calculateCurrentStreak() {
        let streak = 0;
        let date = new Date();

        while (true) {
            const dateStr = date.toISOString().split('T')[0];
            if (this.data[dateStr] && this.data[dateStr] > 0) {
                streak++;
                date.setDate(date.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    // Calculate max streak
    calculateMaxStreak() {
        const dates = Object.keys(this.data).sort();
        if (dates.length === 0) return 0;

        let maxStreak = 0;
        let currentStreak = 0;
        let prevDate = null;

        for (const dateStr of dates) {
            if (this.data[dateStr] > 0) {
                if (prevDate === null) {
                    currentStreak = 1;
                } else {
                    const prev = new Date(prevDate);
                    const curr = new Date(dateStr);
                    const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                    }
                }
                maxStreak = Math.max(maxStreak, currentStreak);
                prevDate = dateStr;
            }
        }

        return maxStreak;
    }

    // Update statistics
    updateStats() {
        const currentStreak = this.calculateCurrentStreak();
        const maxStreak = this.calculateMaxStreak();
        const totalPlanks = Object.values(this.data).filter(v => v > 0).length;
        const bestTime = Math.max(...Object.values(this.data), 0);

        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('maxStreak').textContent = maxStreak;
        document.getElementById('totalPlanks').textContent = totalPlanks;
        document.getElementById('bestTime').textContent = `${bestTime}s`;
    }

    // Share progress (Wordle-style)
    shareProgress() {
        const today = this.getTodayDate();
        const daysToShare = 7; // Share last 7 days

        let shareText = '💪 Plank Club\n\n';

        // Add grid
        for (let i = daysToShare - 1; i >= 0; i--) {
            const date = this.getDateDaysAgo(i);
            const seconds = this.data[date] || 0;
            const emoji = this.getBlockEmoji(seconds);
            shareText += emoji;
        }

        shareText += '\n\n';

        // Add stats
        const currentStreak = this.calculateCurrentStreak();
        const totalPlanks = Object.values(this.data).filter(v => v > 0).length;

        shareText += `🔥 Streak: ${currentStreak} | Total: ${totalPlanks}\n`;
        shareText += '\nJoin me at Plank Club!';

        // Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            const message = document.getElementById('shareMessage');
            message.className = 'share-message success';
            message.textContent = '✅ Copied to clipboard! Share with friends!';

            setTimeout(() => {
                message.textContent = '';
                message.className = 'share-message';
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy. Here\'s your share text:\n\n' + shareText);
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PlankClub();
});
