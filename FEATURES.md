# Bingo Book - Features

Bingo Book is a Progressive Web App (PWA) designed for managing structured data entries with flexible key-value pairs. It's perfect for organizing information like contact details, coaching records, inventory, or any structured data collection.

## Core Features

### 📋 Entry Management
- **Create Entries**: Add new entries with unique IDs and custom key-value fields
- **Smart Templates**: New entries automatically include all fields from existing entries (with empty values)
- **Edit Entries**: Modify existing entries with full field editing capabilities
- **Delete Entries**: Remove entries with confirmation dialog
- **Dynamic Fields**: Add unlimited custom fields to each entry
- **Field Consistency**: New fields automatically added to all entries to maintain data structure
- **Quick Search**: Real-time filtering of entries by ID or any field value at the top of entries list
- **Tier System**: Organize entries by priority levels (1-4) with visual color coding
  - Tier 1: Grey (default priority)
  - Tier 2: Green (medium priority)
  - Tier 3: Golden (high priority)
  - Tier 4: Purple (critical priority)

### 🏆 Tier System
- **Priority Levels**: Four-tier system (1-4) for organizing entries by importance
- **Visual Coding**: Each tier has distinct colors for instant recognition
- **Automatic Sorting**: Entries sorted by tier in both main list and search results
- **Default Tier**: New entries default to Tier 1 (grey)
- **Easy Selection**: Dropdown selector in editor for quick tier assignment
- **Consistent Display**: Tier always shown first in entry previews

### 🕒 Version History & Recovery
- **Automatic Versioning**: Each sync creates a timestamped backup version
- **5-Version Limit**: Keeps the most recent 5 versions, automatically cleaning older ones
- **Visual Timeline**: Browse versions with timestamps and entry counts
- **Preview Information**: See entry count and sample entry names for each version
- **One-Click Restore**: Restore any previous version with confirmation dialog
- **Data Safety**: Never lose data with comprehensive version history

### 🔍 Advanced Search & Replace
- **Key-based Search**: Find entries by field names (e.g., search for "area" to find all entries with area fields)
- **Value-based Search**: Search within field values (e.g., find "Kaliganj" across all fields)
- **Combined Search**: Search for specific key-value combinations
- **Smart Autocomplete**: Intelligent suggestions for both keys and values based on existing data
- **Find & Replace**: Bulk replace values across multiple entries
  - Search by key, value, or both
  - Preview all matches before replacing
  - Replace all matching values with a single action
  - Confirmation dialog to prevent accidental changes

### 💾 Cloud Data Management
- **Cloud Sync**: Sync data across multiple devices using Firebase
- **Global Storage**: All devices share the same cloud data
- **Manual Sync**: Manual sync up/down controls for explicit data management
- **Version History**: Automatic backup of last 5 versions with each sync
- **Point-in-Time Restore**: Restore from any of the last 5 saved versions
- **Offline Support**: Full offline functionality with sync when connection restored
- **Conflict Resolution**: Smart handling of local vs cloud data conflicts

### 📱 Mobile-First Design
- **Responsive Interface**: Optimized for mobile devices with touch-friendly controls
- **Bottom Navigation**: Easy thumb navigation between main sections
- **Progressive Web App**: Installable on mobile devices like a native app
- **Offline Support**: Works completely offline once loaded

### 🎨 User Experience
- **Intuitive Interface**: Clean, modern design with clear visual hierarchy
- **Smart Autocomplete**: Context-aware suggestions reduce typing and errors
  - **Key Suggestions**: Autocomplete for field names based on existing schema
  - **Value Suggestions**: Autocomplete for field values based on other entries with the same key
- **Multi-line Support**: Press Enter in value fields to expand to multi-line textarea with auto-growing height
- **Visual Feedback**: Smooth animations and active states for better interaction
- **Empty States**: Helpful guidance when no data is present
- **Priority Visualization**: Color-coded entries based on tier levels for quick identification
- **Smart Sorting**: Entries automatically sorted by tier priority (1-4)

## Technical Features

### 🔧 Progressive Web App
- **Service Worker**: Caches app for offline functionality
- **Web App Manifest**: Enables installation on mobile devices
- **Cache Management**: Smart caching with update mechanism
- **Standalone Mode**: Runs like a native app when installed
- **Cloud Integration**: Firebase backend for cross-device synchronization

### 🤖 Smart Autocomplete System
- **Dual Autocomplete**: Separate suggestions for keys and values
- **Context-Aware Values**: Value suggestions based on the selected key
- **Data-Driven**: Suggestions come from existing entries in your database
- **Visual Distinction**: Different colors for key vs value suggestions (blue vs green)
- **Intelligent Filtering**: Suggestions filter as you type
- **Cross-Entry Learning**: Learn from all entries to suggest consistent values
- **Duplicate Prevention**: Avoid duplicate key names within the same entry

### 🗂️ Schema Management
- **Global Schema View**: See all keys used across all entries
- **Add Keys**: Add new keys to all entries with default values
- **Remove Keys**: Remove keys from all entries (except protected keys like tier)
- **Usage Statistics**: See how many entries use each key
- **Protected Keys**: Tier key is protected and cannot be removed
- **Bulk Operations**: Changes apply to all entries simultaneously
- **Find & Replace**: Search and replace values across multiple entries simultaneously
- **Match Preview**: See all matches before executing replacements
- **Flexible Search**: Replace by key pattern, value pattern, or both
- **Safe Operations**: Confirmation dialogs prevent accidental bulk changes
- **Instant Updates**: Changes applied immediately with local storage sync

### 🛠️ Developer Features
- **Clean Architecture**: Well-organized JavaScript with clear separation of concerns
- **Local Storage API**: Efficient data persistence using browser storage
- **Event-Driven**: Responsive UI with proper event handling
- **Cross-Platform**: Works on any device with a modern web browser

## Use Cases

### Personal Organization
- Contact management with custom fields
- Personal inventory tracking
- Project notes and documentation
- Learning progress tracking

### Professional Applications
- Client information management
- Coaching session records
- Product catalogs
- Research data collection

### Educational
- Student records
- Course materials organization
- Research notes
- Study progress tracking

## Navigation

The app features four main sections accessible via bottom navigation:

1. **📋 Entries**: Main list view showing all entries with preview of key fields
2. **🔍 Search & Replace**: Advanced search interface with autocomplete and bulk replace functionality
3. **🗂️ Schema**: Global schema management for adding/removing keys across all entries
4. **☁️ Cloud Sync**: Sync up/down controls and app update functions (accessible from entries page)

## Data Structure

Entries are stored as flexible key-value pairs, allowing for:
- Unlimited custom fields per entry
- Consistent schema across all entries
- Built-in tier system for priority management (1-4 scale)
- Cloud synchronization across devices with Firebase
- Device-specific cloud storage for data isolation
- Easy data export/import in JSON format
- Efficient search and filtering capabilities
- Automatic sorting by tier priority

## Cross-Device Usage

### Device Management
- All devices share the same global cloud data
- Data is synchronized across all devices using the same Firebase project
- Sync controls allow manual data synchronization between devices
- Version history is shared across all devices

### Workflow
1. **First Device**: Use "Sync Up" to save your data to cloud (creates first version)
2. **Additional Devices**: Use "Sync Down" to get the shared data from cloud
3. **Regular Use**: Use "Sync Up" periodically to create version backups
4. **Recovery**: Use "Restore" button to browse and restore from previous versions
5. **Data Safety**: Local storage + versioned cloud backup ensures data persistence

## Browser Compatibility

- Modern browsers with ES6+ support
- Service Worker support for offline functionality
- Local Storage API for data persistence
- File API for backup/restore functionality