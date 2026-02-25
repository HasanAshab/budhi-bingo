// Storage keys
const STORAGE_KEY = 'coaching_entries';
const CURRENT_ID_KEY = '$current_id';

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

    entryIds.forEach(id => {
        const entry = entries[id];
        const card = document.createElement('div');
        card.className = 'entry-card';
        
        let fieldsHtml = '';
        const keys = Object.keys(entry).slice(0, 3);
        keys.forEach(key => {
            fieldsHtml += `<p><strong>${key}:</strong> ${entry[key]}</p>`;
        });
        
        if (Object.keys(entry).length > 3) {
            fieldsHtml += `<p><em>+${Object.keys(entry).length - 3} more fields</em></p>`;
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
        document.getElementById('fieldsContainer').innerHTML = '';
        addFieldRow();
    } else {
        title.textContent = 'Edit Entry';
        idInput.value = id;
        idInput.disabled = true;
        deleteBtn.style.display = 'block';
        
        // Store current ID
        localStorage.setItem(CURRENT_ID_KEY, id);
        
        // Load fields
        const entry = entries[id];
        const container = document.getElementById('fieldsContainer');
        container.innerHTML = '';
        
        Object.keys(entry).forEach(key => {
            addFieldRow(key, entry[key]);
        });
    }
    
    showPage('editorPage');
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
    
    // Check for duplicate ID
    if (isNewEntry && entries[id]) {
        alert('This ID already exists. Please use a different ID.');
        return;
    }
    
    // Collect fields
    const entry = {};
    const fieldRows = document.querySelectorAll('.field-row');
    
    fieldRows.forEach(row => {
        const key = row.querySelector('.field-key').value.trim();
        const value = row.querySelector('.field-value').value.trim();
        
        if (key && value) {
            entry[key] = value;
        }
    });
    
    if (Object.keys(entry).length === 0) {
        alert('Please add at least one field');
        return;
    }
    
    // Save entry
    entries[id] = entry;
    saveEntries();
    
    // Store current ID
    localStorage.setItem(CURRENT_ID_KEY, id);
    
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
    
    results.forEach(id => {
        const entry = entries[id];
        const card = document.createElement('div');
        card.className = 'entry-card';
        
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

// Register service worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
}
