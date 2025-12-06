# Guardian Kids - Browser Extension

A simple, lightweight parental control extension for Firefox and Chrome inspired by LeechBlock. Block websites and set time restrictions to help regulate internet access for kids.

## Features

- **Website Blocking**: Block specific websites using simple patterns (supports wildcards)
- **Time Restrictions**: Set allowed browsing hours and block specific days
- **Password Protection**: Prevent unauthorized changes to settings
- **Simple UI**: Clean, easy-to-use settings page
- **Local Only**: All data stored locally, no external servers or tracking

## Installation

### For Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extension folder (the one containing `manifest.json`)
5. The extension is now active!

**Note**: The extension will remain installed until you remove it manually.

### For Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click **Load Temporary Add-on**
4. Navigate to the extension folder and select the `manifest.json` file
5. The extension is now active!

**Note**: Temporary extensions are removed when Firefox closes. For permanent installation:
- Navigate to `about:config`, search for `xpinstall.signatures.required`, set to `false`
- Package as .xpi and install via `about:addons` → Install Add-on From File

## Creating Icons

The extension expects icons in the `icons/` folder:
- `icons/icon-48.png` (48x48 pixels)
- `icons/icon-96.png` (96x96 pixels)

You can create simple icons using any image editor, or use emoji-to-icon generators online. Alternatively, you can remove the icon references from `manifest.json` if you don't need them.

## Usage

### Initial Setup

1. Click the Guardian Kids icon in your browser toolbar
   - **Chrome**: Right-click the icon → Options
   - **Firefox**: Click icon or go to Add-ons → Options
2. The settings page will open
3. Configure your settings:
   - Enable/disable the extension
   - Set a password (recommended!)
   - Configure time restrictions

**Note:** Blocked websites are configured in the code (see below), not through the UI.

### Managing Blocked Websites

**Blocked websites are hardcoded in `background.js` for easy synchronization across browsers.**

The UI shows the current blocked list (read-only) but doesn't allow editing. To add or remove blocked sites:

1. Open [`background.js`](background.js) in a text editor
2. Find the `BLOCKED_SITES` array (around line 9):
   ```javascript
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
   ```
3. Add or remove websites from the list
4. Save the file
5. Reload the extension in both Chrome and Firefox
6. Done! Changes apply immediately

**Wildcard support:**
- `facebook.com` - blocks facebook.com
- `*.youtube.com` - blocks all YouTube subdomains
- `m.facebook.com` - blocks only mobile Facebook

**Why hardcoded?**
- Single source of truth - edit once, reload in both browsers
- Always in sync between Chrome and Firefox
- Simple to manage with version control (Git)
- Password and time restrictions remain browser-specific and configurable via UI

### Setting Time Restrictions

1. Enable "Time restrictions"
2. Set allowed hours (e.g., 6:00 AM to 10:00 PM)
3. Select days to block completely (e.g., block all day Sunday)

When time restrictions are active:
- Outside allowed hours: ALL internet access is blocked
- On blocked days: ALL internet access is blocked

### Password Protection

Set a password to prevent kids from:
- Disabling the extension
- Removing blocked sites
- Changing time restrictions

Once a password is set, you'll need to enter it each time you open the settings page.

## How It Works

- The extension uses Firefox's `webRequest` API to intercept navigation requests
- When a blocked URL is detected, the request is redirected to a "blocked" page
- All settings are stored locally using Firefox's storage API
- No data is sent to external servers

## Limitations

- Kids with technical knowledge might be able to:
  - Use Firefox in Safe Mode (disables extensions)
  - Use a different browser
  - Uninstall Firefox and reinstall
- This is meant as a helpful tool, not a foolproof security system
- For younger kids, this works great. For tech-savvy teens, combine with other parental controls

## Customization

Feel free to modify the extension to suit your needs:

- **Blocked page**: Edit `blocked/blocked.html` to customize the message
- **UI styling**: Modify `options/options.css` to change the look
- **Features**: Add new functionality in `background.js` and `options/options.js`

## Comparison to LeechBlock

Guardian Kids is a simplified version inspired by LeechBlock:

**Similar to LeechBlock**:
- Website blocking with wildcards
- Time-based restrictions
- Password protection

**Simpler than LeechBlock**:
- No block sets (just one list)
- No time quotas or delayed access
- No statistics tracking
- Fewer configuration options
- Cleaner, simpler UI

If you need more advanced features, check out the original LeechBlock extension!

## Support

This is a personal/local extension for family use. Feel free to modify and adapt it to your needs.

## License

Free to use and modify for personal use.
