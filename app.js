// Plank Club - Exercise Tracking App
// All data stored in localStorage

// Configuration constants
const CONFIG = {
    DISPLAY_DAYS: 28,           // Days to show in progress grid
    SHARE_DAYS: 7,              // Days to include in share text
    BEGINNER_MAX: 30,           // Max seconds for beginner level
    INTERMEDIATE_MAX: 60,       // Max seconds for intermediate level
    TIMER_MIN_PLANKS: 1,        // Min number of planks in timer
    TIMER_MAX_PLANKS: 10,       // Max number of planks in timer
    PLANK_MIN_DURATION: 10,     // Min plank duration in seconds
    PLANK_MAX_DURATION: 600,    // Max plank duration in seconds
    REST_MIN_DURATION: 5,       // Min rest duration in seconds
    REST_MAX_DURATION: 180,     // Max rest duration in seconds
    MANUAL_MIN_COUNT: 1,        // Min plank count for manual logging
    MANUAL_MAX_COUNT: 99,       // Max plank count for manual logging
    CLEAR_MIN_DAYS: 1,          // Min days for clear stats
    CLEAR_MAX_DAYS: 365,        // Max days for clear stats
    BEEP_FREQUENCY: 800,        // Beep sound frequency in Hz
    BEEP_DURATION: 0.5,         // Beep duration in seconds
    BEEP_VOLUME: 0.3,           // Beep volume (0-1)
    MESSAGE_TIMEOUT: 3000,      // Status message timeout in ms
    SHARE_DELAY: 1000           // Delay before share prompt in ms
};

class PlankClub {
    constructor() {
        this.storageKey = 'plankClubData';
        this.data = this.loadData();

        // Timer state
        this.timerInterval = null;
        this.timerState = 'idle'; // idle, plank, rest, paused
        this.previousTimerState = null; // Store state before pausing
        this.currentPlank = 0;
        this.totalPlanks = 0;
        this.timeRemaining = 0;
        this.plankDuration = 0;
        this.restDuration = 0;
        this.completedPlanks = [];
        this.pausedTime = 0;
        this.startTime = null;
        this.phaseStartTime = null; // Track phase start for accurate timing
        this.lastMetronomeSecond = null; // Track last metronome tick to prevent duplicates

        // Wake lock
        this.wakeLock = null;

        // Audio context (shared to prevent memory leaks)
        this.audioContext = null;

        this.init();
    }

    // Initialize the app
    init() {
        this.renderProgressGrid();
        this.updateStats();
        this.setupEventListeners();
        this.checkTodayStatus();
        this.setupVisibilityListener();
        this.loadTimerPreferences();
        this.setView('setup'); // Start in setup view
    }

    // Set the current view (setup or timer-active)
    setView(view) {
        const container = document.querySelector('.container');
        container.setAttribute('data-view', view);
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

    // Get today's date in YYYY-MM-DD format (local timezone)
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get date N days ago (local timezone)
    getDateDaysAgo(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date for display (e.g., "Nov 13")
    formatDateDisplay(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
    }

    // Get ISO week number for a date
    getISOWeek(date) {
        // Create a copy of the date to avoid modifying the original
        const d = new Date(date.getTime());

        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        const dayNum = d.getDay() || 7;
        d.setDate(d.getDate() + 4 - dayNum);

        // Get first day of year
        const yearStart = new Date(d.getFullYear(), 0, 1);

        // Calculate full weeks to nearest Thursday
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

        return weekNo;
    }

    // Get ISO week year (may differ from calendar year for dates near year boundary)
    getISOWeekYear(date) {
        const d = new Date(date.getTime());
        const dayNum = d.getDay() || 7;
        d.setDate(d.getDate() + 4 - dayNum);
        return d.getFullYear();
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
        if (totalSeconds < CONFIG.BEGINNER_MAX) return 'block-beginner';
        if (totalSeconds < CONFIG.INTERMEDIATE_MAX) return 'block-intermediate';
        return 'block-advanced';
    }

    // Get emoji for sharing based on plank time
    getBlockEmoji(dateData) {
        const totalSeconds = this.getTotalSeconds(dateData);
        if (totalSeconds === 0) return '⬜';
        if (totalSeconds < CONFIG.BEGINNER_MAX) return '🟨';
        if (totalSeconds < CONFIG.INTERMEDIATE_MAX) return '🟩';
        return '🟢';
    }

    // Load timer preferences from localStorage
    loadTimerPreferences() {
        const prefs = localStorage.getItem('timerPreferences');
        if (prefs) {
            try {
                const { count, duration, rest } = JSON.parse(prefs);
                document.getElementById('timerCount').value = count || 3;
                document.getElementById('timerDuration').value = duration || 60;
                document.getElementById('restDuration').value = rest || 30;
            } catch (e) {
                console.log('Could not load timer preferences');
            }
        }
    }

    // Save timer preferences to localStorage
    saveTimerPreferences(count, duration, rest) {
        try {
            localStorage.setItem('timerPreferences', JSON.stringify({ count, duration, rest }));
        } catch (e) {
            console.log('Could not save timer preferences');
        }
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

        // Close modals with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const settingsModal = document.getElementById('settingsModal');
                const confirmModal = document.getElementById('confirmModal');

                if (confirmModal.style.display === 'flex') {
                    this.closeConfirmModal();
                } else if (settingsModal.style.display === 'flex') {
                    this.closeSettings();
                }
            }
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

        if (count < CONFIG.MANUAL_MIN_COUNT || count > CONFIG.MANUAL_MAX_COUNT) {
            statusDiv.className = 'status-message error';
            statusDiv.textContent = `❌ Count must be between ${CONFIG.MANUAL_MIN_COUNT} and ${CONFIG.MANUAL_MAX_COUNT}`;
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

        // Clear message after timeout
        setTimeout(() => {
            this.checkTodayStatus();
        }, CONFIG.MESSAGE_TIMEOUT);
    }

    // Render the progress grid
    renderProgressGrid() {
        const grid = document.getElementById('progressGrid');
        grid.innerHTML = '';

        const today = this.getTodayDate();
        const daysToShow = CONFIG.DISPLAY_DAYS;

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

        // Count total number of individual planks by category
        let totalPlanks = 0;
        let beginnerCount = 0;
        let intermediateCount = 0;
        let advancedCount = 0;

        for (const dateData of Object.values(this.data)) {
            if (Array.isArray(dateData)) {
                totalPlanks += dateData.length;
                for (const seconds of dateData) {
                    if (seconds < CONFIG.BEGINNER_MAX) {
                        beginnerCount++;
                    } else if (seconds < CONFIG.INTERMEDIATE_MAX) {
                        intermediateCount++;
                    } else {
                        advancedCount++;
                    }
                }
            }
        }

        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('maxStreak').textContent = maxStreak;
        document.getElementById('beginnerCount').textContent = beginnerCount;
        document.getElementById('intermediateCount').textContent = intermediateCount;
        document.getElementById('advancedCount').textContent = advancedCount;
        document.getElementById('totalPlanks').textContent = totalPlanks;
    }

    // Generate share text (Wordle-style)
    generateShareText() {
        const today = this.getTodayDate();
        const daysToShare = CONFIG.SHARE_DAYS;

        // Get ISO week number for today
        const todayDate = new Date();
        const weekNumber = this.getISOWeek(todayDate);
        const weekYear = this.getISOWeekYear(todayDate);

        let shareText = '💪 Plank Club\n';
        shareText += `Week ${weekNumber} ${weekYear}\n\n`;

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
            }, CONFIG.MESSAGE_TIMEOUT);
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

    // Show results page after session ends
    showResultsPage() {
        const today = this.getTodayDate();
        const todayData = this.data[today] || [];
        const todayTotal = this.getTotalSeconds(todayData);
        const sessionPlanks = this.completedPlanks.length;
        const sessionTotal = this.completedPlanks.reduce((sum, s) => sum + s, 0);
        const currentStreak = this.calculateCurrentStreak();

        // Hide main timer display and show results modal
        const resultsModal = document.getElementById('resultsModal');
        if (!resultsModal) {
            // Create results modal if it doesn't exist
            this.createResultsModal();
        }

        // Populate results
        document.getElementById('resultsSessionPlanks').textContent = sessionPlanks;
        document.getElementById('resultsSessionTotal').textContent = sessionTotal;
        document.getElementById('resultsTodayTotal').textContent = todayTotal;
        document.getElementById('resultsCurrentStreak').textContent = currentStreak;

        // Show modal
        document.getElementById('resultsModal').style.display = 'flex';
    }

    // Create results modal HTML
    createResultsModal() {
        const modal = document.createElement('div');
        modal.id = 'resultsModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content results-modal">
                <div class="results-header">
                    <h2>🎉 Session Complete!</h2>
                </div>
                <div class="results-stats">
                    <div class="result-stat">
                        <div class="result-label">Planks Done</div>
                        <div class="result-value" id="resultsSessionPlanks">0</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-label">Session Time</div>
                        <div class="result-value" id="resultsSessionTotal">0</div>
                        <div class="result-unit">seconds</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-label">Today's Total</div>
                        <div class="result-value" id="resultsTodayTotal">0</div>
                        <div class="result-unit">seconds</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-label">Current Streak</div>
                        <div class="result-value" id="resultsCurrentStreak">0</div>
                        <div class="result-unit">days</div>
                    </div>
                </div>
                <div class="results-buttons">
                    <button id="resultsShareWhatsapp" class="btn-whatsapp">💬 Share to WhatsApp</button>
                    <button id="resultsShareClipboard" class="btn-share">📋 Copy to Clipboard</button>
                    <button id="resultsClose" class="btn-secondary">✓ Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('resultsShareWhatsapp').addEventListener('click', () => this.shareToWhatsApp());
        document.getElementById('resultsShareClipboard').addEventListener('click', () => this.shareProgress());
        document.getElementById('resultsClose').addEventListener('click', () => this.closeResultsPage());

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'resultsModal') this.closeResultsPage();
        });
    }

    closeResultsPage() {
        const modal = document.getElementById('resultsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Timer methods
    async startTimer() {
        const countInput = document.getElementById('timerCount');
        const durationInput = document.getElementById('timerDuration');
        const restInput = document.getElementById('restDuration');

        this.totalPlanks = parseInt(countInput.value) || 3;
        this.plankDuration = parseInt(durationInput.value) || 60;
        this.restDuration = parseInt(restInput.value) || 30;

        // Save preferences for next time
        this.saveTimerPreferences(this.totalPlanks, this.plankDuration, this.restDuration);

        if (this.totalPlanks < CONFIG.TIMER_MIN_PLANKS || this.totalPlanks > CONFIG.TIMER_MAX_PLANKS) {
            this.showTimerMessage(`❌ Number of planks must be between ${CONFIG.TIMER_MIN_PLANKS} and ${CONFIG.TIMER_MAX_PLANKS}`, 'error');
            return;
        }

        if (this.plankDuration < CONFIG.PLANK_MIN_DURATION || this.plankDuration > CONFIG.PLANK_MAX_DURATION) {
            this.showTimerMessage(`❌ Duration must be between ${CONFIG.PLANK_MIN_DURATION} and ${CONFIG.PLANK_MAX_DURATION} seconds`, 'error');
            return;
        }

        if (this.restDuration < CONFIG.REST_MIN_DURATION || this.restDuration > CONFIG.REST_MAX_DURATION) {
            this.showTimerMessage(`❌ Rest must be between ${CONFIG.REST_MIN_DURATION} and ${CONFIG.REST_MAX_DURATION} seconds`, 'error');
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
        this.phaseStartTime = Date.now();
        this.lastMetronomeSecond = null;

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

        // Switch to timer-active view
        this.setView('timer-active');

        this.updateTimerDisplay();
        this.runTimer();
    }

    pauseTimer() {
        if (this.timerState === 'paused') {
            // Resume
            this.timerState = this.previousTimerState || 'plank';
            this.previousTimerState = null;
            this.phaseStartTime = Date.now(); // Reset phase start time
            document.getElementById('pauseTimerBtn').innerHTML = '⏸️ Pause';
            this.runTimer();
        } else {
            // Pause - calculate remaining time based on elapsed time
            const elapsed = Math.floor((Date.now() - this.phaseStartTime) / 1000);
            const phaseDuration = this.timerState === 'plank' ? this.plankDuration : this.restDuration;
            this.timeRemaining = Math.max(0, phaseDuration - elapsed);
            this.previousTimerState = this.timerState;
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

        // Switch back to setup view
        this.setView('setup');

        // Log completed planks if any
        if (this.completedPlanks.length > 0) {
            this.logTimedPlanks();
        }
    }

    runTimer() {
        this.timerInterval = setInterval(() => {
            // Calculate time remaining based on elapsed time (prevents drift)
            const elapsed = Math.floor((Date.now() - this.phaseStartTime) / 1000);
            const phaseDuration = this.timerState === 'plank' ? this.plankDuration : this.restDuration;
            this.timeRemaining = Math.max(0, phaseDuration - elapsed);

            // Play metronome tick in last 5 seconds of any phase (only once per second)
            if (this.timeRemaining > 0 && this.timeRemaining <= 5) {
                if (this.lastMetronomeSecond !== this.timeRemaining) {
                    this.playMetronomeTick();
                    this.lastMetronomeSecond = this.timeRemaining;
                }
            }

            if (this.timeRemaining <= 0) {
                if (this.timerState === 'plank') {
                    // Plank completed
                    this.completedPlanks.push(this.plankDuration);
                    this.playBeep();

                    if (this.currentPlank >= this.totalPlanks) {
                        // All planks completed
                        this.showTimerMessage(`🎉 Completed ${this.totalPlanks} planks!`, 'success');
                        this.logTimedPlanks();
                        this.stopTimer(); // stopTimer handles cleanup (interval, wake lock, etc.)
                        this.showResultsPage();
                        return;
                    } else {
                        // Start rest period
                        this.timerState = 'rest';
                        this.phaseStartTime = Date.now();
                        this.timeRemaining = this.restDuration;
                        this.showTimerMessage(`✅ Plank ${this.currentPlank} complete! Rest now.`, 'success');
                    }
                } else if (this.timerState === 'rest') {
                    // Rest completed, start next plank
                    this.playBeep();
                    this.currentPlank++;
                    this.timerState = 'plank';
                    this.phaseStartTime = Date.now();
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
        }, CONFIG.MESSAGE_TIMEOUT);
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
            // Create shared audio context on first use
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = CONFIG.BEEP_FREQUENCY;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(CONFIG.BEEP_VOLUME, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + CONFIG.BEEP_DURATION);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + CONFIG.BEEP_DURATION);
        } catch (e) {
            // Silently fail if audio is not supported
            console.log('Audio not supported');
        }
    }

    playMetronomeTick() {
        // Play a higher-pitched tick sound for the last 5 seconds countdown
        try {
            // Create shared audio context on first use
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Higher frequency (1200Hz) for metronome tick
            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';

            // Shorter duration (0.1s) and lower volume (0.2) for tick
            const tickDuration = 0.1;
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + tickDuration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + tickDuration);
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

    // Setup visibility change listener to re-request wake lock
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && this.timerState !== 'idle' && this.timerState !== 'paused') {
                // Re-request wake lock when user returns to page and timer is running
                await this.requestWakeLock();
            }
        });
    }

    // Offer share after timer completion
    offerShare() {
        setTimeout(() => {
            if (confirm('🎉 Great job! Would you like to share your progress on WhatsApp?')) {
                this.shareToWhatsApp();
            }
        }, CONFIG.SHARE_DELAY);
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

        if (isNaN(days) || days < CONFIG.CLEAR_MIN_DAYS || days > CONFIG.CLEAR_MAX_DAYS) {
            alert(`Please enter a valid number of days (${CONFIG.CLEAR_MIN_DAYS}-${CONFIG.CLEAR_MAX_DAYS})`);
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
