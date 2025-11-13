// Plank Club - Exercise Tracking App
// All data stored in localStorage

class PlankClub {
    constructor() {
        this.storageKey = 'plankClubData';
        this.data = this.loadData();

        // Timer state
        this.timerInterval = null;
        this.timerState = 'idle'; // idle, plank, rest, paused
        this.currentPlank = 0;
        this.totalPlanks = 0;
        this.timeRemaining = 0;
        this.plankDuration = 0;
        this.restDuration = 0;
        this.completedPlanks = [];
        this.pausedTime = 0;
        this.startTime = null;

        // Wake lock
        this.wakeLock = null;

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
        document.getElementById('whatsappBtn').addEventListener('click', () => this.shareToWhatsApp());

        // Timer event listeners
        document.getElementById('startTimerBtn').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimerBtn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('stopTimerBtn').addEventListener('click', () => this.stopTimer());

        // Settings modal event listeners
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('clearStatsBtn').addEventListener('click', () => this.promptClearStats());

        // Confirmation modal event listeners
        document.getElementById('confirmYesBtn').addEventListener('click', () => this.confirmClearStats());
        document.getElementById('confirmNoBtn').addEventListener('click', () => this.closeConfirmModal());

        // Close modals when clicking outside
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') this.closeConfirmModal();
        });
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

    // Generate share text (Wordle-style)
    generateShareText() {
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
        const todayData = this.data[today] || [];
        const todayPlanks = todayData.length;
        const todayTotal = this.getTotalSeconds(todayData);

        // Count total planks (individual exercises, not days)
        let totalPlanks = 0;
        for (const dateData of Object.values(this.data)) {
            if (Array.isArray(dateData)) {
                totalPlanks += dateData.length;
            }
        }

        // Show today's stats if available
        if (todayPlanks > 0) {
            shareText += `📅 Today: ${todayPlanks} plank${todayPlanks > 1 ? 's' : ''} (${todayTotal}s)\n`;
        }

        shareText += `🔥 Streak: ${currentStreak} | Total Planks: ${totalPlanks}\n`;
        shareText += '\nJoin me at Plank Club!\nhttps://pcjohn.co.uk';

        return shareText;
    }

    // Share progress to clipboard
    shareProgress() {
        const shareText = this.generateShareText();

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

    // Share to WhatsApp
    shareToWhatsApp() {
        const shareText = this.generateShareText();
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    }

    // Timer methods
    async startTimer() {
        const countInput = document.getElementById('timerCount');
        const durationInput = document.getElementById('timerDuration');
        const restInput = document.getElementById('restDuration');

        this.totalPlanks = parseInt(countInput.value) || 3;
        this.plankDuration = parseInt(durationInput.value) || 60;
        this.restDuration = parseInt(restInput.value) || 30;

        if (this.totalPlanks < 1 || this.totalPlanks > 10) {
            this.showTimerMessage('❌ Number of planks must be between 1 and 10', 'error');
            return;
        }

        if (this.plankDuration < 10 || this.plankDuration > 600) {
            this.showTimerMessage('❌ Duration must be between 10 and 600 seconds', 'error');
            return;
        }

        if (this.restDuration < 5 || this.restDuration > 180) {
            this.showTimerMessage('❌ Rest must be between 5 and 180 seconds', 'error');
            return;
        }

        // Request wake lock
        await this.requestWakeLock();

        // Initialize timer
        this.currentPlank = 1;
        this.completedPlanks = [];
        this.timerState = 'plank';
        this.timeRemaining = this.plankDuration;
        this.startTime = new Date();

        // Display start time
        const timeStr = this.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        document.getElementById('timerStartTime').textContent = `Started at ${timeStr}`;

        // Disable inputs
        countInput.disabled = true;
        durationInput.disabled = true;
        restInput.disabled = true;

        // Show/hide buttons
        document.getElementById('startTimerBtn').style.display = 'none';
        document.getElementById('pauseTimerBtn').style.display = 'inline-block';
        document.getElementById('stopTimerBtn').style.display = 'inline-block';

        this.updateTimerDisplay();
        this.runTimer();
    }

    pauseTimer() {
        if (this.timerState === 'paused') {
            // Resume
            this.timerState = this.pausedTime > 0 ? 'plank' : 'rest';
            document.getElementById('pauseTimerBtn').innerHTML = '⏸️ Pause';
            this.runTimer();
        } else {
            // Pause
            this.pausedTime = this.timeRemaining;
            const previousState = this.timerState;
            this.timerState = 'paused';
            document.getElementById('pauseTimerBtn').innerHTML = '▶️ Resume';
            clearInterval(this.timerInterval);
            this.updateTimerDisplay();
        }
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        this.timerState = 'idle';
        this.startTime = null;

        // Release wake lock
        this.releaseWakeLock();

        // Re-enable inputs
        document.getElementById('timerCount').disabled = false;
        document.getElementById('timerDuration').disabled = false;
        document.getElementById('restDuration').disabled = false;

        // Show/hide buttons
        document.getElementById('startTimerBtn').style.display = 'inline-block';
        document.getElementById('pauseTimerBtn').style.display = 'none';
        document.getElementById('stopTimerBtn').style.display = 'none';
        document.getElementById('pauseTimerBtn').innerHTML = '⏸️ Pause';

        // Reset display
        document.getElementById('timerStartTime').textContent = '';
        document.getElementById('timerStatus').textContent = 'Ready to start';
        document.getElementById('timerTime').textContent = '00:00';
        document.getElementById('timerProgress').textContent = 'Plank 0 of 0';

        // Log completed planks if any
        if (this.completedPlanks.length > 0) {
            this.logTimedPlanks();
        }
    }

    runTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                if (this.timerState === 'plank') {
                    // Plank completed
                    this.completedPlanks.push(this.plankDuration);
                    this.playBeep();

                    if (this.currentPlank >= this.totalPlanks) {
                        // All planks completed
                        clearInterval(this.timerInterval);
                        this.releaseWakeLock();
                        this.showTimerMessage(`🎉 Completed ${this.totalPlanks} planks!`, 'success');
                        this.logTimedPlanks();
                        this.stopTimer();
                        this.offerShare();
                        return;
                    } else {
                        // Start rest period
                        this.timerState = 'rest';
                        this.timeRemaining = this.restDuration;
                        this.showTimerMessage(`✅ Plank ${this.currentPlank} complete! Rest now.`, 'success');
                    }
                } else if (this.timerState === 'rest') {
                    // Rest completed, start next plank
                    this.playBeep();
                    this.currentPlank++;
                    this.timerState = 'plank';
                    this.timeRemaining = this.plankDuration;
                    this.showTimerMessage(`💪 Starting plank ${this.currentPlank}!`, 'info');
                }
            }

            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        document.getElementById('timerTime').textContent = timeStr;

        if (this.timerState === 'plank') {
            document.getElementById('timerStatus').textContent = `🏋️ PLANK ${this.currentPlank}`;
            document.getElementById('timerStatus').style.color = '#6aaa64';
        } else if (this.timerState === 'rest') {
            document.getElementById('timerStatus').textContent = `😌 REST`;
            document.getElementById('timerStatus').style.color = '#b59f3b';
        } else if (this.timerState === 'paused') {
            document.getElementById('timerStatus').textContent = `⏸️ PAUSED`;
            document.getElementById('timerStatus').style.color = '#818384';
        }

        document.getElementById('timerProgress').textContent =
            `Plank ${this.currentPlank} of ${this.totalPlanks} (${this.completedPlanks.length} completed)`;
    }

    showTimerMessage(message, type) {
        const messageDiv = document.getElementById('timerMessage');
        messageDiv.textContent = message;
        messageDiv.className = `timer-message ${type}`;

        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'timer-message';
        }, 3000);
    }

    logTimedPlanks() {
        const today = this.getTodayDate();

        if (!this.data[today]) {
            this.data[today] = [];
        }

        // Add all completed planks
        this.data[today].push(...this.completedPlanks);
        this.saveData();

        const total = this.getTotalSeconds(this.data[today]);
        this.showTimerMessage(`✅ ${this.completedPlanks.length} plank${this.completedPlanks.length > 1 ? 's' : ''} logged! (Total today: ${total}s)`, 'success');

        // Refresh UI
        this.renderProgressGrid();
        this.updateStats();
        this.checkTodayStatus();

        // Reset completed planks
        this.completedPlanks = [];
    }

    playBeep() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Silently fail if audio is not supported
            console.log('Audio not supported');
        }
    }

    // Wake Lock methods
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock activated');

                // Re-request wake lock if visibility changes
                this.wakeLock.addEventListener('release', () => {
                    console.log('Wake lock released');
                });
            }
        } catch (err) {
            console.log('Wake lock error:', err);
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('Wake lock released');
            } catch (err) {
                console.log('Wake lock release error:', err);
            }
        }
    }

    // Offer share after timer completion
    offerShare() {
        setTimeout(() => {
            if (confirm('🎉 Great job! Would you like to share your progress?')) {
                this.shareProgress();
            }
        }, 1000);
    }

    // Settings modal methods
    openSettings() {
        document.getElementById('settingsModal').style.display = 'flex';
    }

    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    promptClearStats() {
        const days = parseInt(document.getElementById('clearDays').value);

        if (isNaN(days) || days < 1 || days > 365) {
            alert('Please enter a valid number of days (1-365)');
            return;
        }

        // Count how many days will be affected
        let affectedDays = 0;
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (this.data[dateStr] && this.data[dateStr].length > 0) {
                affectedDays++;
            }
        }

        const message = affectedDays > 0
            ? `Are you sure you want to clear data from the last ${days} day${days > 1 ? 's' : ''}?\n\nThis will remove plank records from ${affectedDays} day${affectedDays > 1 ? 's' : ''} that have data.\n\nThis action cannot be undone!`
            : `No plank data found in the last ${days} day${days > 1 ? 's' : ''}.`;

        document.getElementById('confirmMessage').textContent = message;

        if (affectedDays > 0) {
            document.getElementById('settingsModal').style.display = 'none';
            document.getElementById('confirmModal').style.display = 'flex';
        } else {
            alert(message);
        }
    }

    confirmClearStats() {
        const days = parseInt(document.getElementById('clearDays').value);
        const today = new Date();
        let clearedDays = 0;

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (this.data[dateStr]) {
                delete this.data[dateStr];
                clearedDays++;
            }
        }

        this.saveData();
        this.closeConfirmModal();
        this.closeSettings();

        // Refresh UI
        this.renderProgressGrid();
        this.updateStats();
        this.checkTodayStatus();

        alert(`✅ Successfully cleared data from ${clearedDays} day${clearedDays > 1 ? 's' : ''}!`);
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PlankClub();
});
