# 🦆 Dax Easter Egg Tracker

A lightweight Firefox extension that automatically detects and tracks DuckDuckGo's Dax easter eggs while you search.

## ✨ Features

- **🎯 Automatic Detection** - Detects Dax easter eggs on DuckDuckGo in real-time
- **📊 Score Tracking** - Keeps a count of all unique eggs you've collected
- **🔍 Search & Filter** - Quickly find eggs in your collection by name
- **📅 Sort Options** - Organize by date found or alphabetically by name
- **👁️ Preview Mode** - Click any egg to see a larger preview with details
- **⚙️ Settings Panel** - Control notifications, detection sensitivity, and more
- **💾 Export Data** - Download your collection as JSON for backup
- **🎨 Dark Theme** - Beautiful, modern DuckDuckGo-inspired interface

## 🚀 Installation

### Development Mode (Firefox):

1. Open Firefox and navigate to `about:debugging`
2. Click **"This Firefox"** in the sidebar
3. Click **"Load Temporary Add-on"**
4. Select the `manifest.json` file from this folder
5. The extension is now active!

> **Note:** Temporary add-ons are removed when Firefox restarts. For persistent installation, sign the extension through [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/)

## 📁 Project Structure

```
dax-tracker/
├── manifest.json          # Firefox extension configuration
├── background.js          # State management & message handling
├── content.js             # Detects eggs on duckduckgo.com
├── styles.css             # Shared UI styling (variables + responsive)
│
├── popup/                 # Main popup UI
│   ├── popup.html        # Structure & layout
│   └── popup.js          # Gallery, search, sort, preview logic
│
├── settings/             # Settings page
│   ├── settings.html     # Settings UI
│   └── settings.js       # Configuration management
│
├── icons/                # Extension icons
│   ├── README.md         # Icon specifications
│   └── [icon files]      # 16x16, 48x48, 128x128, 256x256 PNG
│
└── README.md             # This file
```

## 🎯 How to Use

### Finding Eggs:
1. Search on DuckDuckGo (`duckduckgo.com`)
2. When a Dax easter egg appears, the extension automatically detects it
3. Click the extension icon to view your collection

### Managing Your Collection:
- **Search** - Find eggs by typing in the search box
- **Sort** - Click "Date" or "Name" buttons to reorder
- **Preview** - Click any egg to see details
- **Clear All** - Remove your entire collection (with confirmation)

### Configuration:
- Click the **⚙️ Settings** button to:
  - Enable/disable notifications
  - Adjust detection sensitivity (Strict/Normal/Loose)
  - Export your collection as a JSON file
  - Clear all data permanently

## 🔧 How It Works

**Detection (content.js):**
- Monitors DuckDuckGo pages for special logo variations
- Identifies Dax easter eggs by CSS properties and image URLs
- Sends data to the background script when found

**Management (background.js):**
- Deduplicates to count unique eggs only
- Stores all data locally in your browser
- Updates the badge with your current score

**UI (popup/):**
- Displays your collection with images and timestamps
- Provides search and sort functionality
- Allows previewing individual eggs
- Links to settings panel

## ⚙️ Settings

### Notifications
Toggle desktop notifications when a new egg is found

### Detection Sensitivity
- **Strict** - Only count unique, never-before-seen eggs
- **Normal** - Standard detection (recommended)
- **Loose** - Detect all variations, including duplicates

### Data Management
- **Export** - Download your collection as JSON
- **Clear Data** - Permanently delete all eggs and stats

## 🎨 Customization

Edit `styles.css` to customize:

```css
/* CSS Variables at the top of the file */
:root {
    --accent: #de5833;      /* Change accent color here */
    --bg-dark: #222;         /* Dark background */
    --text-primary: #e0e0e0; /* Primary text color */
}
```

## 💾 Data & Privacy

- ✅ All data stored **locally** in your browser
- ✅ **No tracking** or analytics
- ✅ No servers involved
- ✅ No personal data sent anywhere
- ✅ Export anytime for backup

## 🐛 Troubleshooting

**Extension not detecting eggs:**
- Ensure you're on `duckduckgo.com` (not ddg.gg or other domains)
- Reload the extension in `about:debugging`
- Check browser console (F12) for errors
- Try a new search that typically triggers an easter egg

**Score not appearing:**
- Click the extension icon to open the popup
- Try searching on DuckDuckGo as the extension loads data dynamically

**Settings not saving:**
- Check browser console for errors
- Try clearing the extension's storage from `about:debugging`

## 📖 Further Development

Potential enhancements:
- Statistical analytics (most common eggs, search patterns)
- Egg rarity tiers (common, uncommon, rare, legendary)
- Achievement system
- Daily/monthly leaderboards
- Cloud sync option
- Custom notifications

## 📝 License

Free to use and modify for personal use.

---

**Built with ❤️ for DuckDuckGo enthusiasts**

Happy Dax hunting! 🦆
