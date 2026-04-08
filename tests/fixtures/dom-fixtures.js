/**
 * DOM fixtures for testing
 */

export function createMinimalDOM() {
  document.body.innerHTML = `
    <div class="container" data-view="setup">
      <section class="timer-section">
        <div class="timer-setup">
          <div class="timer-input-group timer-input-full">
            <input id="timerCount" type="number" min="1" max="10" value="3">
          </div>
          <div class="timer-input-row">
            <div class="timer-input-group">
              <input id="timerDuration" type="number" min="10" max="600" value="60">
            </div>
            <div class="timer-input-group">
              <input id="restDuration" type="number" min="5" max="180" value="30">
            </div>
          </div>
          <div class="timer-toggle-row">
            <label class="toggle-label">
              <input type="checkbox" id="failureMode">
            </label>
          </div>
        </div>
        <div class="timer-display">
          <div id="timerStartTime"></div>
          <div id="timerStatus">Ready to start</div>
          <div id="timerTime">00:00</div>
          <div id="timerProgress">Plank 0 of 0</div>
        </div>
        <div class="timer-controls">
          <button id="startTimerBtn">▶️ Start Timer</button>
          <button id="doneTimerBtn" style="display: none;">✓ Done</button>
          <button id="pauseTimerBtn" style="display: none;">⏸️ Pause</button>
          <button id="stopTimerBtn" style="display: none;">⏹️ Stop</button>
        </div>
        <div id="timerMessage" class="timer-message"></div>
      </section>

      <section class="today-section">
        <div class="input-group">
          <input id="plankTime" type="number" placeholder="Seconds" min="0" max="999" value="60">
          <input id="plankCount" type="number" placeholder="Count" min="1" max="99" value="1">
          <button id="submitBtn">Log Plank</button>
        </div>
        <div id="todayStatus" class="status-message"></div>
        <div id="useLifeNotification" style="display: none;">
          <button id="useLifeBtn">❤️ Use Life</button>
        </div>
      </section>

      <section class="progress-section">
        <div id="progressGrid" class="progress-grid"></div>
      </section>

      <section class="stats-section">
        <div class="stats-header">
          <button id="settingsBtn">⚙️</button>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="currentStreak">0</div>
            <div class="stat-label">Current Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="maxStreak">0</div>
            <div class="stat-label">Best Streak</div>
          </div>
          <div class="stat-card stat-card-beginner">
            <div class="stat-value" id="beginnerCount">0</div>
            <div class="stat-label">🟨 Beginner (&lt;30s)</div>
          </div>
          <div class="stat-card stat-card-intermediate">
            <div class="stat-value" id="intermediateCount">0</div>
            <div class="stat-label">🟢 Intermediate (30-60s)</div>
          </div>
          <div class="stat-card stat-card-advanced">
            <div class="stat-value" id="advancedCount">0</div>
            <div class="stat-label">💪 Advanced (60-90s)</div>
          </div>
          <div class="stat-card stat-card-elite">
            <div class="stat-value" id="eliteCount">0</div>
            <div class="stat-label">🔥 Elite (90-120s)</div>
          </div>
          <div class="stat-card stat-card-champion">
            <div class="stat-value" id="championCount">0</div>
            <div class="stat-label">🏆 Champion (120s+)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="totalPlanks">0</div>
            <div class="stat-label">Total Planks</div>
          </div>
          <div class="stat-card stat-card-lives">
            <div class="stat-value" id="livesRemaining">0</div>
            <div class="stat-label">❤️ Lives Available</div>
            <div class="stat-sublabel" id="livesInfo">0/0 used</div>
          </div>
        </div>
      </section>

      <section class="share-section">
        <div class="share-buttons">
          <button id="whatsappBtn">💬 Share to WhatsApp</button>
          <button id="shareBtn">📋 Copy to Clipboard</button>
        </div>
        <div id="shareMessage" class="share-message"></div>
      </section>
    </div>

    <div id="settingsModal" class="modal" style="display: none;">
      <div class="modal-content">
        <h2>Settings</h2>
        <div class="settings-option">
          <label class="checkbox-label">
            <input type="checkbox" id="miniShare">
            Mini Share
          </label>
        </div>
        <div class="settings-option">
          <div class="clear-stats-controls">
            <input id="clearDays" type="number" min="1" max="365" value="7">
          </div>
          <button id="clearStatsBtn">Clear Data</button>
        </div>
        <button id="closeModalBtn">Close</button>
      </div>
    </div>

    <div id="confirmModal" class="modal" style="display: none;">
      <div class="modal-content">
        <p id="confirmMessage" class="confirm-message"></p>
        <div class="modal-actions">
          <button id="confirmYesBtn">Yes, Clear Data</button>
          <button id="confirmNoBtn">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

export function createFullDOM() {
  createMinimalDOM();

  // Add any additional elements needed for full integration tests
  const progressGrid = document.getElementById('progressGrid');
  for (let i = 0; i < 28; i++) {
    const block = document.createElement('div');
    block.className = 'block';
    block.id = `block-${i}`;
    progressGrid.appendChild(block);
  }
}

export function clearDOM() {
  document.body.innerHTML = '';
}

export function getElementById(id) {
  return document.getElementById(id);
}

export function queryAll(selector) {
  return document.querySelectorAll(selector);
}

export function getTextContent(id) {
  const element = getElementById(id);
  return element ? element.textContent : null;
}

export function getInputValue(id) {
  const element = getElementById(id);
  return element ? element.value : null;
}

export function setInputValue(id, value) {
  const element = getElementById(id);
  if (element) {
    element.value = value;
  }
}

export function simulateClick(id) {
  const element = getElementById(id);
  if (element) {
    element.click();
  }
}

export function getElementClass(id) {
  const element = getElementById(id);
  return element ? element.className : null;
}
