// Background script for Guardian Kids extension

// Cross-browser compatibility
const browser = globalThis.browser || globalThis.chrome;

// ========================================
// ALLOWED SITES - Educational/learning sites (ALWAYS accessible)
// ========================================
const ALLOWED_SITES = [
  'accounts.google.*',
  'basispoort*',
  'blink.nl*',
  'ecosia.org',
  'idp.toegang.org*',
  'ieplvs*',
  'kennisnet*',
  'klasseplan*',
  'lexipoort*',
  'matific.com',
  'matific.eu',
  'nieuwsbegrip*',
  'scratch.mit.edu/classes*',
  'thiememeulenhoff.nl*',
  'zuluconnect*'
];

// ========================================
// ENTERTAINMENT SITES - Fun sites (weekends only, or with override)
// ========================================
const ENTERTAINMENT_SITES = [
  'youtubekids*',
  'netflix.com/kids*'
];

// ========================================
// BLOCKED SITES - Never allowed
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
  entertainmentOverride: false, // Temporary override for entertainment sites
  entertainmentOverrideExpiry: null, // When the override expires
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

  // 1. Always allow educational sites
  for (let pattern of ALLOWED_SITES) {
    if (pattern && matchesPattern(url, pattern)) {
      return false; // Explicitly allow
    }
  }

  // 2. Check if it's blocked (never allowed)
  for (let pattern of BLOCKED_SITES) {
    if (pattern && matchesPattern(url, pattern)) {
      return true; // Explicitly block
    }
  }

  // 3. Check entertainment sites (weekend or override)
  for (let pattern of ENTERTAINMENT_SITES) {
    if (pattern && matchesPattern(url, pattern)) {
      const now = new Date();
      const currentDay = now.getDay();
      const isWeekend = currentDay === 0 || currentDay === 6; // Sunday = 0, Saturday = 6

      // Check if override is active and not expired
      const hasActiveOverride = settings.entertainmentOverride &&
                                (!settings.entertainmentOverrideExpiry ||
                                 new Date(settings.entertainmentOverrideExpiry) > now);

      // Allow if weekend OR override is active
      if (isWeekend || hasActiveOverride) {
        return false; // Allow entertainment
      } else {
        return true; // Block entertainment on weekdays
      }
    }
  }

  // 4. Check time restrictions (for all other sites)
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

  // 5. Everything else is allowed by default
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
  if (message.type === 'getSiteLists') {
    sendResponse({
      allowedSites: ALLOWED_SITES,
      entertainmentSites: ENTERTAINMENT_SITES,
      blockedSites: BLOCKED_SITES
    });
  } else if (message.type === 'enableEntertainmentOverride') {
    // Enable override for specified duration (in minutes)
    const durationMinutes = message.duration || 60; // Default 1 hour
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + durationMinutes);

    settings.entertainmentOverride = true;
    settings.entertainmentOverrideExpiry = expiry.toISOString();

    // Save to storage
    browser.storage.local.set({ settings: settings });

    sendResponse({ success: true, expiresAt: expiry.toISOString() });
  } else if (message.type === 'disableEntertainmentOverride') {
    settings.entertainmentOverride = false;
    settings.entertainmentOverrideExpiry = null;

    // Save to storage
    browser.storage.local.set({ settings: settings });

    sendResponse({ success: true });
  }
  return true;
});
