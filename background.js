// Background script for Guardian Kids extension

// Cross-browser compatibility
const browser = globalThis.browser || globalThis.chrome;

// ========================================
// BLOCKED SITES - Edit this list to add/remove blocked websites
// ========================================
const BLOCKED_SITES = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'twitter.com',
  'reddit.com',
  'snapchat.com',
  'twitch.tv'
];
// ========================================

let settings = {
  enabled: true,
  password: '',
  timeRestrictions: {
    enabled: false,
    allowedHours: {
      start: 6,  // 6 AM
      end: 22    // 10 PM
    },
    blockedDays: [] // 0 = Sunday, 1 = Monday, etc.
  }
};

// Load settings from storage
browser.storage.local.get(['settings']).then((result) => {
  if (result.settings) {
    settings = result.settings;
  }
});

// Listen for settings changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    settings = changes.settings.newValue;
  }
});

// Check if a URL should be blocked
function shouldBlockUrl(url) {
  if (!settings.enabled) {
    return false;
  }

  // Check time restrictions
  if (settings.timeRestrictions.enabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Check if current day is blocked
    if (settings.timeRestrictions.blockedDays.includes(currentDay)) {
      return true;
    }

    // Check if current time is outside allowed hours
    const start = settings.timeRestrictions.allowedHours.start;
    const end = settings.timeRestrictions.allowedHours.end;

    if (currentHour < start || currentHour >= end) {
      return true;
    }
  }

  // Check blocked sites list (hardcoded)
  for (let pattern of BLOCKED_SITES) {
    if (pattern && matchesPattern(url, pattern)) {
      return true;
    }
  }

  return false;
}

// Match URL against pattern (supports wildcards)
function matchesPattern(url, pattern) {
  try {
    // Remove protocol if present in pattern
    pattern = pattern.replace(/^https?:\/\//, '');

    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/[.]/g, '\\.')
      .replace(/\*/g, '.*');

    const regex = new RegExp(regexPattern, 'i');

    // Test against hostname and full URL
    const urlObj = new URL(url);
    return regex.test(urlObj.hostname) || regex.test(url);
  } catch (e) {
    return false;
  }
}

// Block requests to blocked sites
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (shouldBlockUrl(details.url)) {
      // Redirect to blocked page
      return {
        redirectUrl: browser.runtime.getURL('blocked/blocked.html')
      };
    }
  },
  { urls: ['<all_urls>'], types: ['main_frame'] },
  ['blocking']
);

// Handle browser action click - open options page
browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

// Handle messages from options page
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getBlockedSites') {
    sendResponse({ blockedSites: BLOCKED_SITES });
  }
  return true;
});
