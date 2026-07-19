# PWA Setup Guide - Avril Mart

## 📱 Progressive Web App (PWA)

Avril Mart sekarang mendukung PWA! Aplikasi dapat di-install di device dan bekerja offline.

---

## ✅ Fitur PWA

### **1. Installable**
- Install aplikasi langsung dari browser
- Icon di home screen
- Fullscreen experience (no browser UI)
- App-like experience

### **2. Offline Support**
- Service Worker caching
- Bekerja tanpa internet
- Auto-sync saat online kembali
- LocalStorage backup

### **3. Fast & Reliable**
- Cache-first strategy untuk assets
- Network-first untuk API
- Instant loading
- Background sync

### **4. Responsive**
- Mobile-friendly
- Tablet-optimized
- Desktop support
- Adaptive UI

---

## 🚀 Quick Start

### **1. Install Icons**

**Option A: Generate Icons (Recommended)**
1. Buka browser: `http://localhost:5173/generate-icons.html`
2. Klik "Generate & Download Icons"
3. Semua icons akan terdownload
4. Place icons di `/public/icons/` directory

**Option B: Use Online Tool**
1. Go to: https://realfavicongenerator.net/
2. Upload logo/icon design
3. Generate all sizes
4. Download and extract to `/public/icons/`

**Option C: Manual Design**
Create PNG files dengan sizes:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### **2. Test PWA**

```bash
# Build production version
npm run build

# Preview production build
npm run preview

# Or deploy to production
npm run deploy
```

### **3. Install PWA**

**Desktop (Chrome, Edge, Brave):**
1. Visit app URL
2. Look for install button (⊕) in address bar
3. Click "Install"
4. App will open in standalone window

**Mobile (Android):**
1. Visit app URL in Chrome
2. Tap menu (⋮)
3. Tap "Install App" or "Add to Home Screen"
4. App icon appears on home screen

**Mobile (iOS):**
1. Visit app URL in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

---

## 📋 Files Structure

```
avril-mart/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   ├── browserconfig.xml       # Microsoft config
│   ├── generate-icons.html     # Icon generator
│   └── icons/
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
├── index.html                  # HTML with PWA meta tags
└── src/
    └── app/
        └── components/
            └── pwa-prompt.tsx  # Install & update prompts
```

---

## 🎯 Manifest Configuration

**File:** `/public/manifest.json`

```json
{
  "name": "Avril Mart - POS & Inventory",
  "short_name": "Avril Mart",
  "description": "Aplikasi Point of Sale dan Inventory Management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#E05D43",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔧 Service Worker

**File:** `/public/sw.js`

### **Caching Strategies:**

**1. Cache-First (Static Assets)**
- CSS, JS, Images
- Fast loading
- Offline support

**2. Network-First (API Calls)**
- Always fresh data
- Fallback to cache if offline

**3. Network-Only (Supabase API)**
- Real-time data
- Error handling for offline

### **Features:**
- Automatic updates
- Background sync
- Push notifications (ready)
- Message handling

---

## 📱 Install Prompt

**Component:** `/src/app/components/pwa-prompt.tsx`

### **Install Prompt**
- Appears after 30 seconds
- Can be dismissed
- Auto-reappears after 7 days
- Shows app benefits

### **Update Prompt**
- Appears when new version available
- One-click update
- Auto-reload after update
- No data loss

---

## 🧪 Testing PWA

### **1. Lighthouse Audit**
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Progressive Web App"
4. Click "Generate report"
```

**Target Scores:**
- PWA: 100
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### **2. PWA Checklist**
- ✅ HTTPS (required for PWA)
- ✅ manifest.json
- ✅ Service Worker registered
- ✅ Icons (192x192, 512x512)
- ✅ Responsive design
- ✅ Offline support
- ✅ Fast loading
- ✅ Meta tags

### **3. Application Tab (DevTools)**
```
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check:
   - Manifest
   - Service Workers
   - Cache Storage
   - Local Storage
```

---

## 🌐 Browser Support

| Browser | Desktop | Mobile | Install |
|---------|---------|--------|---------|
| Chrome | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ⚠️ Manual |
| Firefox | ✅ | ✅ | ⚠️ Limited |
| Samsung Internet | - | ✅ | ✅ |

**Legend:**
- ✅ Full support
- ⚠️ Partial support
- ❌ Not supported

---

## 🔄 Update Process

### **For Users:**
1. Update prompt appears automatically
2. Click "Update Sekarang"
3. App reloads with new version
4. All data preserved

### **For Developers:**
1. Make changes to code
2. Build new version
3. Deploy to production
4. Service Worker detects update
5. Users see update prompt

---

## 💾 Offline Storage

### **LocalStorage:**
- Products cache
- Sales cache
- Transaction queue
- User preferences

### **Service Worker Cache:**
- App shell
- Static assets
- API responses
- Images

### **Total Capacity:**
- ~10MB LocalStorage
- ~50MB Cache Storage
- Automatic cleanup

---

## 🎨 Customization

### **Theme Color:**
```json
// manifest.json
"theme_color": "#E05D43"  // Orange (Avril Mart)
```

### **App Name:**
```json
// manifest.json
"name": "Avril Mart - POS & Inventory",
"short_name": "Avril Mart"
```

### **Icons:**
Replace files in `/public/icons/` dengan design sendiri.

### **Splash Screen:**
Auto-generated dari:
- `background_color`
- `theme_color`
- Icon (512x512)
- App name

---

## 🐛 Troubleshooting

### **Icons not showing:**
```bash
# Clear cache
1. Open DevTools
2. Application → Clear storage
3. Check "Cache storage" + "Local and session storage"
4. Click "Clear site data"
5. Refresh page (Ctrl+F5)
```

### **Service Worker not updating:**
```bash
# Force update
1. Open DevTools
2. Application → Service Workers
3. Check "Update on reload"
4. Refresh page
```

### **Install button not appearing:**
```bash
# Check requirements:
1. Must be HTTPS (or localhost)
2. Must have valid manifest.json
3. Must have service worker
4. Must have icons (192x192, 512x512)
5. Visit site at least 30 seconds
```

### **Offline mode not working:**
```bash
# Test offline:
1. Open DevTools
2. Network tab
3. Select "Offline" in throttling dropdown
4. Try using app
```

---

## 📊 Performance

### **First Load:**
- Initial: ~2-3s
- With cache: <1s
- Offline: <0.5s

### **Subsequent Loads:**
- Hot cache: <0.5s
- Cache-first: <0.2s
- Instant feel

### **Storage Usage:**
- App shell: ~500KB
- Icons: ~200KB
- Data: Variable
- Total: ~1-5MB

---

## 🚀 Deployment

### **Vercel (Recommended):**
```bash
npm run build
vercel --prod
```

### **Netlify:**
```bash
npm run build
netlify deploy --prod
```

### **Manual:**
```bash
npm run build
# Upload dist/ folder to server
# Make sure HTTPS is enabled
```

---

## 📝 Additional Resources

**PWA Tools:**
- https://web.dev/progressive-web-apps/
- https://www.pwabuilder.com/
- https://realfavicongenerator.net/

**Testing:**
- https://lighthouse-metrics.com/
- https://www.webpagetest.org/

**Documentation:**
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- https://developers.google.com/web/progressive-web-apps

---

## ✅ Checklist

- [ ] Generate icons (all sizes)
- [ ] Place icons in `/public/icons/`
- [ ] Test manifest.json
- [ ] Test service worker
- [ ] Run Lighthouse audit
- [ ] Test install on desktop
- [ ] Test install on mobile (Android)
- [ ] Test install on mobile (iOS)
- [ ] Test offline mode
- [ ] Test update prompt
- [ ] Deploy to production (HTTPS)

---

## 🎉 Done!

Avril Mart sekarang PWA-ready dan bisa di-install! 🚀

**Next Steps:**
1. Generate icons
2. Test locally
3. Deploy to production
4. Install di device
5. Share dengan team

**Support:**
- Email: support@avrilmart.com
- Docs: /docs/pwa-setup.md
- GitHub: [repo]/issues
