# 🔧 FIX BLANK PAGE / CACHE PROBLEM

## Problem
App menampilkan blank page dan perlu hard refresh (Ctrl+Shift+R) untuk load.

## Root Cause
Service Worker cache terlalu agresif, menyimpan versi lama HTML/JavaScript dan tidak update otomatis.

---

## ✅ SOLUTION IMPLEMENTED

### 1. **Service Worker Update** (v1 → v2)
Changed caching strategy:

**BEFORE (Problem)**:
```javascript
// Cache-first for ALL assets (including HTML/JS)
// Problem: Served old HTML from cache, causing blank page
const CACHE_NAME = 'avril-mart-v1';
```

**AFTER (Fixed)**:
```javascript
// Network-first for HTML/JS, cache-first for assets
const CACHE_NAME = 'avril-mart-v2'; // ✅ New version

// ✅ HTML/JavaScript: Network-first (always get fresh)
// ✅ Images/Fonts/CSS: Cache-first (fast load)
```

### 2. **Network-First Strategy for Critical Files**
```javascript
// HTML, JavaScript always fetched from network
if (
  event.request.destination === 'document' ||
  url.pathname.endsWith('.html') ||
  url.pathname.endsWith('.js') ||
  url.pathname === '/'
) {
  // Try network first
  // Fallback to cache only if offline
}
```

---

## 🚀 HOW TO APPLY FIX

### For Vercel Deployment:
```bash
1. Commit & push changes to GitHub
2. Vercel auto-deploys new version
3. Service Worker auto-updates (v1 → v2)
4. Old cache deleted automatically
5. ✅ Problem fixed!
```

### Timeline:
- Deploy: ~2 minutes
- Service Worker update: ~30 seconds after page load
- Cache clear: Automatic
- **Total**: ~3 minutes

---

## 👥 FOR END USERS (If Still See Blank Page)

### Method 1: Hard Refresh (Recommended)
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Method 2: Clear Browser Cache
```
Chrome:
1. Settings → Privacy and security
2. Clear browsing data
3. Check "Cached images and files"
4. Clear data

Firefox:
1. Settings → Privacy & Security
2. Cookies and Site Data
3. Clear Data

Safari:
1. Safari → Preferences
2. Advanced → Show Develop menu
3. Develop → Empty Caches
```

### Method 3: Unregister Service Worker (Last Resort)
```
1. Open DevTools (F12)
2. Go to "Application" tab
3. Service Workers (left sidebar)
4. Click "Unregister" for avril-mart
5. Reload page (F5)
```

---

## 🔍 HOW TO VERIFY FIX

### Check Service Worker Version:
```javascript
// Open Browser Console (F12)
// Run this:
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Active SW:', reg.active.scriptURL);
  // Should see: sw.js (v2)
});
```

### Check Cache Version:
```javascript
// Open Browser Console (F12)
// Run this:
caches.keys().then(keys => {
  console.log('Cache names:', keys);
  // Should see: avril-mart-v2 (not v1)
});
```

### Expected Result:
```
✅ Service Worker: v2
✅ Cache: avril-mart-v2, avril-mart-runtime-v2
✅ No blank page
✅ App loads normally
```

---

## 🔄 AUTO-UPDATE FLOW (How It Works Now)

### First Visit After Deploy:
```
1. User opens app
2. Service Worker checks for update
3. New SW (v2) downloads in background
4. Blue notification appears: "Update Tersedia"
5. User clicks "Update Sekarang"
6. New SW activates
7. Page reloads automatically
8. ✅ Fresh version loaded!
```

### Subsequent Visits:
```
1. User opens app
2. Network-first strategy tries to fetch fresh HTML/JS
3. If online: Gets latest version ✅
4. If offline: Serves from cache (works offline) ✅
5. No blank page!
```

---

## 🛡️ PREVENTING FUTURE CACHE ISSUES

### For Developers:

**When Deploying Updates:**
```javascript
// 1. Increment cache version in sw.js:
const CACHE_NAME = 'avril-mart-v3'; // Bump version
const RUNTIME_CACHE = 'avril-mart-runtime-v3';

// 2. Commit & deploy
// 3. Service Worker auto-updates
// 4. Old cache auto-deleted
```

**Version Naming Convention:**
```
Major update: v1 → v2 → v3
Minor update: v2.1 → v2.2 → v2.3
Patch: v2.1.1 → v2.1.2
```

**Cache Strategy Summary:**
```
HTML/JS:     Network-first (always fresh)
CSS:         Cache-first (fast, rarely changes)
Images:      Cache-first (fast, static)
Fonts:       Cache-first (fast, static)
API calls:   Network-first (always fresh data)
Supabase:    Network-only (no cache)
```

---

## 📊 TESTING CHECKLIST

### Before Deployment:
```
[ ] Test in Chrome
[ ] Test in Firefox
[ ] Test in Safari
[ ] Test hard refresh
[ ] Test offline mode
[ ] Test update notification
[ ] Clear cache and test
[ ] Check Service Worker console logs
```

### After Deployment:
```
[ ] Verify cache version updated
[ ] Verify no blank page on normal refresh
[ ] Verify app loads without hard refresh
[ ] Verify offline mode still works
[ ] Verify update notification appears
[ ] Test on mobile browser
[ ] Test on multiple devices
```

---

## 🐛 TROUBLESHOOTING

### Issue: Still seeing blank page after fix
**Solution**:
```
1. Clear browser cache completely
2. Unregister old service worker
3. Hard refresh (Ctrl+Shift+R)
4. If still blank, check browser console for errors
```

### Issue: Update notification doesn't appear
**Solution**:
```
1. Service Worker might not detect change
2. Check cache version in DevTools
3. Manually unregister SW
4. Reload page
```

### Issue: App works but offline mode broken
**Solution**:
```
1. Check Service Worker registered
2. Check cache strategy in sw.js
3. Verify PRECACHE_ASSETS includes critical files
4. Test in incognito mode
```

### Issue: Different behavior on mobile vs desktop
**Solution**:
```
1. Mobile browsers cache more aggressively
2. Clear mobile browser cache
3. For iOS Safari: Settings → Safari → Clear History
4. For Android Chrome: Settings → Privacy → Clear cache
```

---

## 💡 BEST PRACTICES

### For Administrators:
```
✅ DO:
- Test after every deployment
- Clear cache when testing
- Monitor user reports
- Check Service Worker updates
- Keep cache version incremented

❌ DON'T:
- Don't cache HTML/JS forever
- Don't ignore update notifications
- Don't skip version bumps
- Don't test only in one browser
```

### For End Users:
```
✅ DO:
- Click "Update Sekarang" when notification appears
- Hard refresh if page looks old/broken
- Report issues to admin
- Keep browser updated

❌ DON'T:
- Don't ignore update notifications
- Don't disable JavaScript
- Don't use very old browsers
- Don't clear cache too frequently (offline mode needs it)
```

---

## 📈 MONITORING

### Check Service Worker Health:
```
Chrome DevTools:
1. F12 → Application tab
2. Service Workers section
3. Check status: "activated and is running"
4. Check version in scriptURL
5. No errors in console
```

### Check Cache Usage:
```
Chrome DevTools:
1. F12 → Application tab
2. Cache Storage section
3. See all caches listed
4. Click to inspect contents
5. Verify correct versions
```

### Performance Metrics:
```
✅ First load: < 2 seconds (network)
✅ Cached load: < 500ms (from cache)
✅ Service Worker activation: < 1 second
✅ Update detection: < 30 seconds
```

---

## 🔗 RELATED DOCUMENTATION

- [PWA_SETUP.md](./PWA_SETUP.md) - Full PWA configuration
- [FAQ.md](./FAQ.md) - Common questions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

## ✅ SUMMARY

**Problem**: Blank page due to aggressive cache  
**Cause**: Cache-first strategy for HTML/JS  
**Solution**: Network-first strategy for critical files  
**Impact**: ✅ No more blank pages, always fresh content  
**Offline**: ✅ Still works, fallback to cache  
**Update**: ✅ Auto-detect, user-prompted  

---

## 🎯 RESULT

**Before Fix**:
```
❌ Blank page on reload
❌ Need hard refresh every time
❌ Users confused
❌ Cache stuck on old version
```

**After Fix**:
```
✅ Normal refresh works
✅ Always gets fresh content
✅ Offline mode still works
✅ Auto-update notification
✅ Cache invalidation automatic
```

---

**Status**: ✅ **FIXED!**  
**Deployed**: Check Vercel deployment logs  
**Verified**: Test after deployment

---

**Questions?** Check FAQ or contact support.

**Version**: 1.1  
**Last Updated**: 27 Februari 2026  
**Fix Applied**: Service Worker v2 with network-first strategy
