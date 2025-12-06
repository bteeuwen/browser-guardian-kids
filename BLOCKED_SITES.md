# How to Update Blocked Sites

The blocked websites list is hardcoded in the extension for easy synchronization across browsers.

## To Add or Remove Blocked Sites

1. **Open the file**: [background.js](background.js)

2. **Find the BLOCKED_SITES array** (around line 9):
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

3. **Edit the list**:
   - Add new sites: `'newsite.com',`
   - Remove sites: Delete the line
   - Use wildcards: `'*.youtube.com'` blocks all YouTube subdomains

4. **Reload the extension**:
   - **Chrome**: Go to `chrome://extensions/` → click the reload button
   - **Firefox**: Go to `about:debugging` → click the reload button

5. **Done!** The changes take effect immediately in both browsers.

## Examples

```javascript
// Block a specific domain
'facebook.com'

// Block all subdomains
'*.youtube.com'

// Block specific subdomain
'm.facebook.com'
```

## Tips

- One domain per line
- Don't forget the comma at the end (except the last item)
- Changes apply to both Chrome and Firefox after reloading
- The settings page will show the updated list automatically
