// Options page script for Guardian Kids extension

// Cross-browser compatibility
const browser = globalThis.browser || globalThis.chrome;

const defaultSettings = {
  enabled: true,
  password: '',
  timeRestrictions: {
    enabled: false,
    allowedHours: {
      start: 6,
      end: 22
    },
    blockedDays: []
  }
};

let currentSettings = { ...defaultSettings };
let isUnlocked = false;

// DOM elements
const passwordPrompt = document.getElementById('passwordPrompt');
const settingsContent = document.getElementById('settingsContent');
const passwordInput = document.getElementById('passwordInput');
const unlockBtn = document.getElementById('unlockBtn');
const passwordError = document.getElementById('passwordError');
const enabledToggle = document.getElementById('enabledToggle');
const newPasswordInput = document.getElementById('newPassword');
const allowedSitesTextarea = document.getElementById('allowedSites');
const entertainmentSitesTextarea = document.getElementById('entertainmentSites');
const blockedSitesTextarea = document.getElementById('blockedSites');
const overrideDurationSelect = document.getElementById('overrideDuration');
const enableOverrideBtn = document.getElementById('enableOverrideBtn');
const disableOverrideBtn = document.getElementById('disableOverrideBtn');
const overrideStatus = document.getElementById('overrideStatus');
const timeRestrictionsToggle = document.getElementById('timeRestrictionsToggle');
const timeRestrictionsConfig = document.getElementById('timeRestrictionsConfig');
const startHourSelect = document.getElementById('startHour');
const endHourSelect = document.getElementById('endHour');
const dayCheckboxes = document.querySelectorAll('.day-checkbox');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  populateHourSelects();
  await loadSettings();
  await loadSiteLists();
  checkOverrideStatus();
  checkPasswordProtection();
  setupEventListeners();
}

// Populate hour select dropdowns
function populateHourSelects() {
  for (let i = 0; i < 24; i++) {
    const option1 = document.createElement('option');
    const option2 = document.createElement('option');
    option1.value = option2.value = i;
    option1.text = option2.text = formatHour(i);
    startHourSelect.appendChild(option1);
    endHourSelect.appendChild(option2);
  }
}

// Format hour for display (e.g., "14:00" -> "2:00 PM")
function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

// Load settings from storage
async function loadSettings() {
  const result = await browser.storage.local.get(['settings']);
  if (result.settings) {
    currentSettings = result.settings;
  }
  updateUI();
}

// Load site lists from background script
async function loadSiteLists() {
  const response = await browser.runtime.sendMessage({ type: 'getSiteLists' });
  if (response) {
    if (response.allowedSites) {
      allowedSitesTextarea.value = response.allowedSites.join('\n');
      document.getElementById('allowedCount').textContent = response.allowedSites.length;
    }
    if (response.entertainmentSites) {
      entertainmentSitesTextarea.value = response.entertainmentSites.join('\n');
      document.getElementById('entertainmentCount').textContent = response.entertainmentSites.length;
    }
    if (response.blockedSites) {
      blockedSitesTextarea.value = response.blockedSites.join('\n');
      document.getElementById('blockedCount').textContent = response.blockedSites.length;
    }
  }
}

// Check override status
function checkOverrideStatus() {
  if (currentSettings.entertainmentOverride && currentSettings.entertainmentOverrideExpiry) {
    const expiry = new Date(currentSettings.entertainmentOverrideExpiry);
    const now = new Date();

    if (expiry > now) {
      // Override is active
      const minutesLeft = Math.ceil((expiry - now) / 60000);
      overrideStatus.textContent = `✅ Override active - expires in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
      overrideStatus.style.display = 'block';
      enableOverrideBtn.style.display = 'none';
      disableOverrideBtn.style.display = 'inline-block';
    } else {
      // Override expired
      resetOverrideUI();
    }
  } else {
    resetOverrideUI();
  }
}

function resetOverrideUI() {
  overrideStatus.style.display = 'none';
  enableOverrideBtn.style.display = 'inline-block';
  disableOverrideBtn.style.display = 'none';
}

// Check if password is set and show/hide password prompt
function checkPasswordProtection() {
  if (currentSettings.password) {
    passwordPrompt.classList.remove('hidden');
    settingsContent.classList.add('hidden');
  } else {
    passwordPrompt.classList.add('hidden');
    settingsContent.classList.remove('hidden');
    isUnlocked = true;
  }
}

// Update UI with current settings
function updateUI() {
  enabledToggle.checked = currentSettings.enabled;
  // Blocked sites are loaded separately from background script
  timeRestrictionsToggle.checked = currentSettings.timeRestrictions.enabled;
  startHourSelect.value = currentSettings.timeRestrictions.allowedHours.start;
  endHourSelect.value = currentSettings.timeRestrictions.allowedHours.end;

  // Update day checkboxes
  dayCheckboxes.forEach(checkbox => {
    checkbox.checked = currentSettings.timeRestrictions.blockedDays.includes(parseInt(checkbox.value));
  });

  // Show/hide time restrictions config
  updateTimeRestrictionsVisibility();
}

// Update time restrictions config visibility
function updateTimeRestrictionsVisibility() {
  if (timeRestrictionsToggle.checked) {
    timeRestrictionsConfig.style.display = 'block';
  } else {
    timeRestrictionsConfig.style.display = 'none';
  }
}

// Setup event listeners
function setupEventListeners() {
  unlockBtn.addEventListener('click', handleUnlock);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });
  enableOverrideBtn.addEventListener('click', handleEnableOverride);
  disableOverrideBtn.addEventListener('click', handleDisableOverride);
  timeRestrictionsToggle.addEventListener('change', updateTimeRestrictionsVisibility);
  saveBtn.addEventListener('click', saveSettings);
}

// Handle password unlock
function handleUnlock() {
  const password = passwordInput.value;
  if (password === currentSettings.password) {
    isUnlocked = true;
    passwordPrompt.classList.add('hidden');
    settingsContent.classList.remove('hidden');
    passwordError.classList.add('hidden');
  } else {
    passwordError.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
  }
}

// Handle enable entertainment override
async function handleEnableOverride() {
  if (!isUnlocked && currentSettings.password) {
    alert('Please unlock settings first by entering the password at the top of the page.');
    return;
  }

  const duration = parseInt(overrideDurationSelect.value);
  const response = await browser.runtime.sendMessage({
    type: 'enableEntertainmentOverride',
    duration: duration
  });

  if (response && response.success) {
    // Reload settings to get updated override status
    await loadSettings();
    checkOverrideStatus();
    alert(`Entertainment override enabled for ${duration} minutes!`);
  }
}

// Handle disable entertainment override
async function handleDisableOverride() {
  if (!isUnlocked && currentSettings.password) {
    alert('Please unlock settings first by entering the password at the top of the page.');
    return;
  }

  const response = await browser.runtime.sendMessage({
    type: 'disableEntertainmentOverride'
  });

  if (response && response.success) {
    // Reload settings
    await loadSettings();
    resetOverrideUI();
    alert('Entertainment override disabled.');
  }
}

// Save settings
async function saveSettings() {
  if (!isUnlocked) {
    alert('Please unlock settings first');
    return;
  }

  // Gather settings from UI
  const newSettings = {
    enabled: enabledToggle.checked,
    password: newPasswordInput.value || currentSettings.password,
    // Blocked sites are configured in code, not saved here
    timeRestrictions: {
      enabled: timeRestrictionsToggle.checked,
      allowedHours: {
        start: parseInt(startHourSelect.value),
        end: parseInt(endHourSelect.value)
      },
      blockedDays: Array.from(dayCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value))
    }
  };

  // Validate
  if (newSettings.timeRestrictions.allowedHours.start >= newSettings.timeRestrictions.allowedHours.end) {
    alert('Start time must be before end time');
    return;
  }

  // Save to storage
  await browser.storage.local.set({ settings: newSettings });
  currentSettings = newSettings;

  // Show success message
  saveStatus.classList.remove('hidden');
  setTimeout(() => {
    saveStatus.classList.add('hidden');
  }, 3000);

  // If password was changed, update the lock state
  if (newPasswordInput.value) {
    newPasswordInput.value = '';
  }
}
