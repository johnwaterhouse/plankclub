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
            const data = JSON.parse(stored);
            // Migrate old format (single number) to new format (array)
            for (const date in data) {
                if (typeof data[date] === 'number') {
                    data[date] = [data[date]];
                }
            }
            return data;
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

    // Get total seconds for a date (sum of all planks)
    getTotalSeconds(dateData) {
        if (!dateData || !Array.isArray(dateData)) return 0;
        return dateData.reduce((sum, seconds) => sum + seconds, 0);
    }

    // Get block class based on plank time
    getBlockClass(dateData) {
        const totalSeconds = this.getTotalSeconds(dateData);
        if (totalSeconds === 0) return 'block-empty';
        if (totalSeconds < 30) return 'block-beginner';
        if (totalSeconds < 60) return 'block-intermediate';
        return 'block-advanced';
    }

    // Get emoji for sharing based on plank time
    getBlockEmoji(dateData) {
        const totalSeconds = this.getTotalSeconds(dateData);
        if (totalSeconds === 0) return '⬜';
        if (totalSeconds < 30) return '🟨';
        if (totalSeconds < 60) return '🟩';
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

        if (todayData && todayData.length > 0) {
            const planksList = todayData.map((s, i) => `#${i + 1}: ${s}s`).join(', ');
            const total = this.getTotalSeconds(todayData);
            statusDiv.className = 'status-message success';
            statusDiv.textContent = `✅ Today's planks: ${planksList} (Total: ${total}s)`;
            input.value = todayData[todayData.length - 1];
        }
    }

    // Log today's plank
    logPlank() {
        const timeInput = document.getElementById('plankTime');
        const countInput = document.getElementById('plankCount');
        const seconds = parseInt(timeInput.value);
        const count = parseInt(countInput.value) || 1;
        const statusDiv = document.getElementById('todayStatus');

        if (isNaN(seconds) || seconds < 0) {
            statusDiv.className = 'status-message error';
            statusDiv.textContent = '❌ Please enter a valid time in seconds';
            return;
        }

        if (count < 1 || count > 99) {
            statusDiv.className = 'status-message error';
            statusDiv.textContent = '❌ Count must be between 1 and 99';
            return;
        }

        const today = this.getTodayDate();

        // Initialize array if it doesn't exist
        if (!this.data[today]) {
            this.data[today] = [];
        }

        // Add multiple planks with the same duration
        for (let i = 0; i < count; i++) {
            this.data[today].push(seconds);
        }
        this.saveData();

        const plankCount = this.data[today].length;
        const total = this.getTotalSeconds(this.data[today]);
        statusDiv.className = 'status-message success';
        if (count === 1) {
            statusDiv.textContent = `✅ Plank #${plankCount} logged: ${seconds}s (Total today: ${total}s)`;
        } else {
            statusDiv.textContent = `✅ ${count} planks logged: ${count}×${seconds}s (Total today: ${total}s)`;
        }

        // Refresh UI
        this.renderProgressGrid();
        this.updateStats();
        this.checkTodayStatus();

        // Clear time input but keep count
        timeInput.value = '';

        // Clear message after 3 seconds
        setTimeout(() => {
            this.checkTodayStatus();
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
            const dateData = this.data[date] || [];
            const blockClass = this.getBlockClass(dateData);

            const block = document.createElement('div');
            block.className = `block ${blockClass}`;

            if (date === today) {
                block.classList.add('block-today');
            }

            // Add tooltip with date and time
            const displayDate = this.formatDateDisplay(date);
            const totalSeconds = this.getTotalSeconds(dateData);
            let timeText = 'No plank';
            if (dateData.length > 0) {
                const planksList = dateData.map((s, i) => `#${i + 1}: ${s}s`).join(', ');
                timeText = `${dateData.length} plank${dateData.length > 1 ? 's' : ''} (${planksList}) - Total: ${totalSeconds}s`;
            }
            block.title = `${displayDate}: ${timeText}`;

            // Show total seconds in the block
            if (totalSeconds > 0) {
                block.textContent = totalSeconds;
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
            const dateData = this.data[dateStr];
            if (dateData && Array.isArray(dateData) && dateData.length > 0 && this.getTotalSeconds(dateData) > 0) {
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
            const dateData = this.data[dateStr];
            if (dateData && Array.isArray(dateData) && this.getTotalSeconds(dateData) > 0) {
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

        // Count total number of individual planks (not days)
        let totalPlanks = 0;
        let bestTime = 0;

        for (const dateData of Object.values(this.data)) {
            if (Array.isArray(dateData)) {
                totalPlanks += dateData.length;
                for (const seconds of dateData) {
                    bestTime = Math.max(bestTime, seconds);
                }
            }
        }

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
            const dateData = this.data[date] || [];
            const emoji = this.getBlockEmoji(dateData);
            shareText += emoji;
        }

        shareText += '\n\n';

        // Add stats
        const currentStreak = this.calculateCurrentStreak();

        // Count total planks (individual exercises, not days)
        let totalPlanks = 0;
        for (const dateData of Object.values(this.data)) {
            if (Array.isArray(dateData)) {
                totalPlanks += dateData.length;
            }
        }

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
