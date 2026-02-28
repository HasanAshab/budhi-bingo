// Storage keys
const STORAGE_KEY = 'coaching_entries';
const CURRENT_ID_KEY = '$current_id';
const DEVICE_ID_KEY = 'device_id';
const LAST_SYNC_KEY = 'last_sync';

// Generate or get device ID
function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

// State
let entries = {};
let currentEditingId = null;
let isNewEntry = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    renderEntriesList();
    setupEventListeners();
    registerServiceWorker();
});

// Load entries from localStorage
function loadEntries() {
    const stored = localStorage.getItem(STORAGE_KEY);
    entries = stored ? JSON.parse(stored) : {};
}

// Save entries to localStorage
function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            showPage(pageId);
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Add entry button
    document.getElementById('addEntryBtn').addEventListener('click', () => {
        openEditor(null);
    });

    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        showPage('listPage');
    });

    // Add field button
    document.getElementById('addFieldBtn').addEventListener('click', () => {
        addFieldRow();
    });

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveEntry);

    // Delete button
    document.getElementById('deleteBtn').addEventListener('click', deleteEntry);

    // Search button
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    
    // Cloud sync buttons
    document.getElementById('syncDownloadBtn').addEventListener('click', syncFromCloud);
    document.getElementById('syncUploadBtn').addEventListener('click', syncToCloud);
    document.getElementById('updateBtn').addEventListener('click', updateApp);
    
    // Search key autocomplete
    const searchKeyInput = document.getElementById('searchKey');
    searchKeyInput.addEventListener('input', (e) => {
        showSearchKeySuggestions(e.target);
        // Refresh value suggestions when key changes
        const searchValueInput = document.getElementById('searchValue');
        if (searchValueInput.value || document.activeElement === searchValueInput) {
            showSearchValueSuggestions(searchValueInput);
        }
    });
    
    searchKeyInput.addEventListener('focus', (e) => {
        showSearchKeySuggestions(e.target);
    });
    
    // Search value autocomplete
    const searchValueInput = document.getElementById('searchValue');
    searchValueInput.addEventListener('input', (e) => {
        showSearchValueSuggestions(e.target);
    });
    
    searchValueInput.addEventListener('focus', (e) => {
        showSearchValueSuggestions(e.target);
    });
}

// Show page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'listPage') {
        renderEntriesList();
    }
}

// Render entries list
function renderEntriesList() {
    const container = document.getElementById('entriesList');
    container.innerHTML = '';

    const entryIds = Object.keys(entries);
    
    if (entryIds.length === 0) {
        container.innerHTML = '<div class="empty-state">No entries yet. Tap + to create one.</div>';
        return;
    }

    // Sort entries by tier (1-4, with 1 being highest priority)
    entryIds.sort((a, b) => {
        const tierA = parseInt(entries[a].tier) || 1;
        const tierB = parseInt(entries[b].tier) || 1;
        return tierA - tierB;
    });

    entryIds.forEach(id => {
        const entry = entries[id];
        const tier = parseInt(entry.tier) || 1;
        const card = document.createElement('div');
        card.className = `entry-card tier-${tier}`;
        
        let fieldsHtml = '';
        // Show tier first, then other fields (excluding tier from the slice)
        const otherKeys = Object.keys(entry).filter(key => key !== 'tier').slice(0, 3);
        fieldsHtml += `<p><strong>tier:</strong> ${tier}</p>`;
        otherKeys.forEach(key => {
            fieldsHtml += `<p><strong>${key}:</strong> ${entry[key]}</p>`;
        });
        
        const totalOtherFields = Object.keys(entry).filter(key => key !== 'tier').length;
        if (totalOtherFields > 3) {
            fieldsHtml += `<p><em>+${totalOtherFields - 3} more fields</em></p>`;
        }

        card.innerHTML = `
            <h3>${id}</h3>
            ${fieldsHtml}
        `;
        
        card.addEventListener('click', () => openEditor(id));
        container.appendChild(card);
    });
}

// Open editor
function openEditor(id) {
    currentEditingId = id;
    isNewEntry = id === null;
    
    const idInput = document.getElementById('entryId');
    const title = document.getElementById('editorTitle');
    const deleteBtn = document.getElementById('deleteBtn');
    
    if (isNewEntry) {
        title.textContent = 'New Entry';
        idInput.value = '';
        idInput.disabled = false;
        deleteBtn.style.display = 'none';
        
        // Clear fields and add tier field
        const container = document.getElementById('fieldsContainer');
        container.innerHTML = '';
        addTierField(1); // Default tier 1

    } else {
        title.textContent = 'Edit Entry';
        idInput.value = id;
        idInput.disabled = false;
        deleteBtn.style.display = 'block';
        
        // Store current ID
        localStorage.setItem(CURRENT_ID_KEY, id);
        
        loadEntries();
        
        // Load fields with tier first
        const entry = entries[id];
        const container = document.getElementById('fieldsContainer');
        container.innerHTML = '';
        
        // Add tier field first
        const tier = parseInt(entry.tier) || 1;
        addTierField(tier);
        
        // Add other fields
        Object.keys(entry).forEach(key => {
            if (key !== 'tier') {
                addFieldRow(key, entry[key]);
            }
        });
    }
    
    showPage('editorPage');
}

// Add tier field (special field that's always first)
function addTierField(value = 1) {
    const container = document.getElementById('fieldsContainer');
    const row = document.createElement('div');
    row.className = 'field-row tier-field';
    
    row.innerHTML = `
        <input type="text" class="field-key" value="tier" readonly>
        <select class="field-value tier-select">
            <option value="1" ${value == 1 ? 'selected' : ''}>1</option>
            <option value="2" ${value == 2 ? 'selected' : ''}>2</option>
            <option value="3" ${value == 3 ? 'selected' : ''}>3</option>
            <option value="4" ${value == 4 ? 'selected' : ''}>4</option>
        </select>
        <div class="tier-indicator"></div>
    `;
    
    container.appendChild(row);
}

// Add field row
function addFieldRow(key = '', value = '') {
    const container = document.getElementById('fieldsContainer');
    const row = document.createElement('div');
    row.className = 'field-row';
    
    row.innerHTML = `
        <input type="text" class="field-key" placeholder="Key" value="${key}">
        <input type="text" class="field-value" placeholder="Value" value="${value}">
        <button class="remove-field">×</button>
    `;
    
    const keyInput = row.querySelector('.field-key');
    const removeBtn = row.querySelector('.remove-field');
    
    // Key autocomplete
    keyInput.addEventListener('input', (e) => {
        showKeySuggestions(e.target, row);
    });
    
    keyInput.addEventListener('focus', (e) => {
        showKeySuggestions(e.target, row);
    });
    
    // Remove field
    removeBtn.addEventListener('click', () => {
        row.remove();
    });
    
    container.appendChild(row);
}

// Show key suggestions
function showKeySuggestions(input, row) {
    // Remove existing autocomplete
    const existing = row.querySelector('.autocomplete');
    if (existing) existing.remove();
    
    const query = input.value.toLowerCase();
    
    // Get all unique keys from all entries
    const allKeys = new Set();
    Object.values(entries).forEach(entry => {
        Object.keys(entry).forEach(key => allKeys.add(key));
    });
    
    // Get keys already used in current entry
    const usedKeys = new Set();
    document.querySelectorAll('.field-key').forEach(inp => {
        if (inp !== input && inp.value) {
            usedKeys.add(inp.value);
        }
    });
    
    // Filter suggestions
    const suggestions = Array.from(allKeys)
        .filter(key => !usedKeys.has(key))
        .filter(key => key.toLowerCase().includes(query));
    
    if (suggestions.length === 0 || (query && suggestions.length === 1 && suggestions[0] === input.value)) {
        return;
    }
    
    // Create autocomplete dropdown
    const autocomplete = document.createElement('div');
    autocomplete.className = 'autocomplete';
    
    suggestions.forEach(key => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = key;
        item.addEventListener('click', () => {
            input.value = key;
            autocomplete.remove();
        });
        autocomplete.appendChild(item);
    });
    
    row.appendChild(autocomplete);
    
    // Remove autocomplete on outside click
    setTimeout(() => {
        document.addEventListener('click', function removeAutocomplete(e) {
            if (!row.contains(e.target)) {
                autocomplete.remove();
                document.removeEventListener('click', removeAutocomplete);
            }
        });
    }, 0);
}

// Save entry
function saveEntry() {
    const id = document.getElementById('entryId').value.trim();
    
    if (!id) {
        alert('Please enter a unique ID');
        return;
    }
    
    // Check for duplicate ID (only if ID changed)
    if (id !== currentEditingId && entries[id]) {
        alert('This ID already exists. Please use a different ID.');
        return;
    }
    
    // Collect fields
    const entry = {};
    
    // Get tier value first
    const tierSelect = document.querySelector('.tier-select');
    if (tierSelect) {
        entry.tier = tierSelect.value;
    } else {
        entry.tier = '1'; // Default tier
    }
    
    // Get other fields
    const fieldRows = document.querySelectorAll('.field-row:not(.tier-field)');
    
    fieldRows.forEach(row => {
        const key = row.querySelector('.field-key').value.trim();
        const value = row.querySelector('.field-value').value.trim();
        
        if (key && key !== 'tier') {
            entry[key] = value;
        }
    });
    
    if (Object.keys(entry).length <= 1) { // Only tier field
        alert('Please add at least one field besides tier');
        return;
    }
    
    // Find new keys that don't exist in other entries (excluding tier)
    const newKeys = Object.keys(entry).filter(key => key !== 'tier').filter(key => {
        return !Object.values(entries).some(e => e.hasOwnProperty(key));
    });    
    
    // If ID changed, delete old entry
    if (currentEditingId && currentEditingId !== id) {
        delete entries[currentEditingId];
    }
    
    // Save entry
    entries[id] = entry;
    
    // Add new keys to all other entries with blank values, and ensure all entries have tier
    Object.keys(entries).forEach(entryId => {
        if (entryId !== id) {
            // Ensure tier exists
            if (!entries[entryId].hasOwnProperty('tier')) {
                entries[entryId].tier = '1';
            }
            // Add new keys
            newKeys.forEach(key => {
                if (!entries[entryId].hasOwnProperty(key)) {
                    entries[entryId][key] = '';
                }
            });
        }
    });
    
    saveEntries();
    
    // Store current ID
    localStorage.setItem(CURRENT_ID_KEY, id);
    
    // Auto-sync to cloud if available (non-blocking)
    autoSyncToCloud();
    
    showPage('listPage');
}

// Delete entry
function deleteEntry() {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    delete entries[currentEditingId];
    saveEntries();
    
    // Clear current ID if it was this entry
    if (localStorage.getItem(CURRENT_ID_KEY) === currentEditingId) {
        localStorage.removeItem(CURRENT_ID_KEY);
    }
    
    // Auto-sync to cloud if available (non-blocking)
    autoSyncToCloud();
    
    showPage('listPage');
}

// Perform search
function performSearch() {
    const searchKey = document.getElementById('searchKey').value.trim().toLowerCase();
    const searchValue = document.getElementById('searchValue').value.trim().toLowerCase();
    
    const results = [];
    
    Object.keys(entries).forEach(id => {
        const entry = entries[id];
        let matches = false;
        
        if (searchKey && !searchValue) {
            // Search by key only
            if (Object.keys(entry).some(k => k.toLowerCase().includes(searchKey))) {
                matches = true;
            }
        } else if (!searchKey && searchValue) {
            // Search by value only
            if (Object.values(entry).some(v => v.toLowerCase().includes(searchValue))) {
                matches = true;
            }
        } else if (searchKey && searchValue) {
            // Search by both
            Object.keys(entry).forEach(k => {
                if (k.toLowerCase().includes(searchKey) && 
                    entry[k].toLowerCase().includes(searchValue)) {
                    matches = true;
                }
            });
        }
        
        if (matches) {
            results.push(id);
        }
    });
    
    renderSearchResults(results);
}

// Render search results
function renderSearchResults(results) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state">No results found</div>';
        return;
    }
    
    // Sort results by tier
    results.sort((a, b) => {
        const tierA = parseInt(entries[a].tier) || 1;
        const tierB = parseInt(entries[b].tier) || 1;
        return tierA - tierB;
    });
    
    results.forEach(id => {
        const entry = entries[id];
        const tier = parseInt(entry.tier) || 1;
        const card = document.createElement('div');
        card.className = `entry-card tier-${tier}`;
        
        let fieldsHtml = '';
        Object.keys(entry).forEach(key => {
            fieldsHtml += `<p><strong>${key}:</strong> ${entry[key]}</p>`;
        });

        card.innerHTML = `
            <h3>${id}</h3>
            ${fieldsHtml}
        `;
        
        card.addEventListener('click', () => {
            openEditor(id);
            // Switch to list page nav state
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-page="listPage"]').classList.add('active');
        });
        
        container.appendChild(card);
    });
}

// Show search key suggestions
function showSearchKeySuggestions(input) {
    // Remove existing autocomplete
    const existing = input.parentElement.querySelector('.autocomplete');
    if (existing) existing.remove();
    
    const query = input.value.toLowerCase();
    
    // Get all unique keys from all entries
    const allKeys = new Set();
    Object.values(entries).forEach(entry => {
        Object.keys(entry).forEach(key => allKeys.add(key));
    });
    
    // Filter suggestions
    const suggestions = Array.from(allKeys)
        .filter(key => key.toLowerCase().includes(query))
        .sort();
    
    if (suggestions.length === 0 || (query && suggestions.length === 1 && suggestions[0] === input.value)) {
        return;
    }
    
    // Create autocomplete dropdown
    const autocomplete = document.createElement('div');
    autocomplete.className = 'autocomplete';
    
    suggestions.forEach(key => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = key;
        item.addEventListener('click', () => {
            input.value = key;
            autocomplete.remove();
        });
        autocomplete.appendChild(item);
    });
    
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(autocomplete);
    
    // Remove autocomplete on outside click
    setTimeout(() => {
        document.addEventListener('click', function removeAutocomplete(e) {
            if (!input.parentElement.contains(e.target)) {
                autocomplete.remove();
                document.removeEventListener('click', removeAutocomplete);
            }
        });
    }, 0);
}

// Show search value suggestions
function showSearchValueSuggestions(input) {
    // Remove existing autocomplete
    const existing = input.parentElement.querySelector('.autocomplete');
    if (existing) existing.remove();
    
    const query = input.value.toLowerCase();
    const searchKey = document.getElementById('searchKey').value.trim().toLowerCase();
    
    // Get values based on search key
    const allValues = new Set();
    
    if (searchKey) {
        // Only get values for the specified key
        Object.values(entries).forEach(entry => {
            Object.keys(entry).forEach(key => {
                if (key.toLowerCase().includes(searchKey)) {
                    allValues.add(entry[key]);
                }
            });
        });
    } else {
        // If no key specified, get all values
        Object.values(entries).forEach(entry => {
            Object.values(entry).forEach(value => allValues.add(value));
        });
    }
    
    // Filter suggestions
    const suggestions = Array.from(allValues)
        .filter(value => value.toLowerCase().includes(query))
        .sort();
    
    if (suggestions.length === 0 || (query && suggestions.length === 1 && suggestions[0] === input.value)) {
        return;
    }
    
    // Create autocomplete dropdown
    const autocomplete = document.createElement('div');
    autocomplete.className = 'autocomplete';
    
    suggestions.forEach(value => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = value;
        item.addEventListener('click', () => {
            input.value = value;
            autocomplete.remove();
        });
        autocomplete.appendChild(item);
    });
    
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(autocomplete);
    
    // Remove autocomplete on outside click
    setTimeout(() => {
        document.addEventListener('click', function removeAutocomplete(e) {
            if (!input.parentElement.contains(e.target)) {
                autocomplete.remove();
                document.removeEventListener('click', removeAutocomplete);
            }
        });
    }, 0);
}

// Sync to cloud (upload)
async function syncToCloud() {
    if (!window.db) {
        alert('Firebase not initialized. Please refresh the page.');
        return;
    }

    try {
        const syncBtn = document.getElementById('syncUploadBtn');
        syncBtn.textContent = '⬆ Syncing...';
        syncBtn.disabled = true;

        // Import Firestore functions
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        const deviceId = getDeviceId();
        const syncData = {
            entries: entries,
            deviceId: deviceId,
            lastModified: Date.now(),
            version: 1
        };

        // Save to Firestore with device-specific document
        await setDoc(doc(window.db, 'bingo-book-data', deviceId), syncData);
        
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        
        syncBtn.textContent = '⬆ Sync Up';
        syncBtn.disabled = false;
        
        alert('Data synced to cloud successfully!');
    } catch (error) {
        console.error('Sync to cloud failed:', error);
        
        const syncBtn = document.getElementById('syncUploadBtn');
        syncBtn.textContent = '⬆ Sync Up';
        syncBtn.disabled = false;
        
        alert('Failed to sync to cloud: ' + error.message);
    }
}

// Sync from cloud (download)
async function syncFromCloud() {
    if (!window.db) {
        alert('Firebase not initialized. Please refresh the page.');
        return;
    }

    try {
        const syncBtn = document.getElementById('syncDownloadBtn');
        syncBtn.textContent = '⬇ Syncing...';
        syncBtn.disabled = true;

        // Import Firestore functions
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        const deviceId = getDeviceId();
        const docRef = doc(window.db, 'bingo-book-data', deviceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const cloudData = docSnap.data();
            
            // Check if we have local changes that are newer
            const lastSync = localStorage.getItem(LAST_SYNC_KEY);
            const hasLocalChanges = Object.keys(entries).length > 0;
            
            if (hasLocalChanges && lastSync && parseInt(lastSync) > cloudData.lastModified) {
                if (!confirm('You have newer local changes. Downloading will overwrite them. Continue?')) {
                    syncBtn.textContent = '⬇ Sync Down';
                    syncBtn.disabled = false;
                    return;
                }
            }
            
            // Load cloud data
            entries = cloudData.entries || {};
            saveEntries();
            renderEntriesList();
            
            localStorage.setItem(LAST_SYNC_KEY, cloudData.lastModified.toString());
            
            syncBtn.textContent = '⬇ Sync Down';
            syncBtn.disabled = false;
            
            alert('Data synced from cloud successfully!');
        } else {
            syncBtn.textContent = '⬇ Sync Down';
            syncBtn.disabled = false;
            
            alert('No cloud data found for this device. Use "Sync Up" to save your data to cloud first.');
        }
    } catch (error) {
        console.error('Sync from cloud failed:', error);
        
        const syncBtn = document.getElementById('syncDownloadBtn');
        syncBtn.textContent = '⬇ Sync Down';
        syncBtn.disabled = false;
        
        alert('Failed to sync from cloud: ' + error.message);
    }
}

// Auto-sync to cloud (non-blocking, silent)
async function autoSyncToCloud() {
    if (!window.db || !navigator.onLine) {
        return; // Skip if offline or Firebase not available
    }

    try {
        // Import Firestore functions
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        const deviceId = getDeviceId();
        const syncData = {
            entries: entries,
            deviceId: deviceId,
            lastModified: Date.now(),
            version: 1
        };

        // Save to Firestore with device-specific document
        await setDoc(doc(window.db, 'bingo-book-data', deviceId), syncData);
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        
        console.log('Auto-sync to cloud successful');
    } catch (error) {
        console.log('Auto-sync failed (silent):', error.message);
        // Fail silently for auto-sync
    }
}

// Update app (clear cache)
function updateApp() {
    if (!confirm('This will clear the app cache and reload. Continue?')) {
        return;
    }
    
    if ('serviceWorker' in navigator) {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Unregister service workers
            navigator.serviceWorker.getRegistrations().then(registrations => {
                return Promise.all(
                    registrations.map(registration => registration.unregister())
                );
            }).then(() => {
                alert('App cache cleared! Reloading...');
                window.location.reload(true);
            });
        }).catch(err => {
            alert('Error clearing cache: ' + err.message);
        });
    } else {
        alert('Service Worker not supported');
    }
}

// Register service worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}
