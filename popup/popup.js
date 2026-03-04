// Popup script with search, sort, and preview features
let currentSortMode = 'date';
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayGallery();
    setupEventListeners();
});

function setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
        });
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase();
            loadAndDisplayGallery();
        });
    }

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSortMode = e.target.dataset.sort;
            loadAndDisplayGallery();
        });
    });

    // Modal close button
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            document.getElementById('previewModal').classList.remove('active');
        });
    }

    // Close modal on outside click
    const modal = document.getElementById('previewModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'previewModal') {
                document.getElementById('previewModal').classList.remove('active');
            }
        });
    }

    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        if (confirm('Are you sure? This will clear all stats.')) {
            chrome.storage.local.set({
                totalScore: 0,
                recentSightings: [],
                loggedEasterEggLibrary: []
            }, () => {
                document.getElementById('totalCount').textContent = '0';
                document.getElementById('galleryList').innerHTML = '<p class="gallery-empty">Search on DuckDuckGo to discover easter eggs!</p>';
                document.getElementById('searchInput').value = '';
                currentSearchTerm = '';
            });
        }
    });
}

function loadAndDisplayGallery() {
    chrome.storage.local.get(['totalScore', 'recentSightings'], (result) => {
        const totalScore = result.totalScore || 0;
        let sightings = result.recentSightings || [];

        // Update counts
        document.getElementById('totalCount').textContent = totalScore;

        // Filter by search term
        let filtered = sightings.filter(sighting => {
            const eggName = (sighting.easterEgg || '').toLowerCase();
            return eggName.includes(currentSearchTerm);
        });

        // Sort
        filtered = sortSightings(filtered, currentSortMode);

        // Display
        displayGallery(filtered, sightings);
    });
}

function sortSightings(sightings, sortMode) {
    const sorted = [...sightings];
    
    switch(sortMode) {
        case 'name':
            sorted.sort((a, b) => {
                const nameA = (a.easterEgg || '').toLowerCase();
                const nameB = (b.easterEgg || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
        case 'date':
        default:
            sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
    }
    
    return sorted;
}

function displayGallery(filteredSightings, allSightings) {
    const galleryList = document.getElementById('galleryList');
    galleryList.innerHTML = '';
    
    if (filteredSightings.length === 0) {
        if (currentSearchTerm) {
            galleryList.innerHTML = '<p class="gallery-empty">No eggs match your search...</p>';
        } else {
            galleryList.innerHTML = '<p class="gallery-empty">Search on DuckDuckGo to discover easter eggs!</p>';
        }
        return;
    }

    // Count unique eggs across all sightings
    const uniqueEggs = {};
    (allSightings || []).forEach(s => {
        uniqueEggs[s.easterEgg] = (uniqueEggs[s.easterEgg] || 0) + 1;
    });

    filteredSightings.forEach(sighting => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.style.cursor = 'pointer';
        
        // Icon
        const icon = document.createElement('div');
        icon.className = 'gallery-icon';
        if (sighting.eggUrl) {
            icon.style.backgroundImage = `url("https://duckduckgo.com${sighting.eggUrl}")`;
        } else {
            icon.textContent = '🦆';
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.fontSize = '24px';
        }
        
        // Info
        const info = document.createElement('div');
        info.className = 'gallery-info';
        
        // Name
        const name = document.createElement('div');
        name.className = 'gallery-name';
        const eggName = (sighting.easterEgg || '').replace('.png', '').replace('.jpg', '');
        name.textContent = eggName.charAt(0).toUpperCase() + eggName.slice(1);
        
        // Time
        const time = document.createElement('div');
        time.className = 'gallery-time';
        const date = new Date(sighting.timestamp);
        time.textContent = date.toLocaleTimeString();
        
        info.appendChild(name);
        info.appendChild(time);
        
        galleryItem.appendChild(icon);
        galleryItem.appendChild(info);
        
        // Click handler for preview
        galleryItem.addEventListener('click', () => {
            showPreview(sighting, uniqueEggs[sighting.easterEgg]);
        });
        
        galleryList.appendChild(galleryItem);
    });
}

function showPreview(sighting, foundCount) {
    const modal = document.getElementById('previewModal');
    if (!modal) return;
    
    // Set preview content
    const previewIcon = document.getElementById('previewIcon');
    if (previewIcon) {
        if (sighting.eggUrl) {
            previewIcon.style.backgroundImage = `url("https://duckduckgo.com${sighting.eggUrl}")`;
        } else {
            previewIcon.textContent = '🦆';
        }
    }
    
    const previewName = document.getElementById('previewName');
    if (previewName) {
        const eggName = (sighting.easterEgg || '').replace('.png', '').replace('.jpg', '');
        previewName.textContent = eggName.charAt(0).toUpperCase() + eggName.slice(1);
    }
    
    const date = new Date(sighting.timestamp);
    const previewFirstFound = document.getElementById('previewFirstFound');
    if (previewFirstFound) {
        previewFirstFound.textContent = date.toLocaleDateString();
    }
    
    const previewFoundCount = document.getElementById('previewFoundCount');
    if (previewFoundCount) {
        previewFoundCount.textContent = foundCount + (foundCount === 1 ? ' time' : ' times');
    }
    
    modal.classList.add('active');
}
