// Settings Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Load current settings
    chrome.storage.local.get(['settings'], (result) => {
        const settings = result.settings || {
            notificationsEnabled: true,
            detectionSensitivity: 'normal'
        };

        document.getElementById('notificationsToggle').checked = settings.notificationsEnabled;
        document.getElementById('sensitivitySelect').value = settings.detectionSensitivity;
    });

    // Notifications toggle
    document.getElementById('notificationsToggle').addEventListener('change', (e) => {
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            settings.notificationsEnabled = e.target.checked;
            chrome.storage.local.set({ settings });
            console.log('Notifications toggled:', e.target.checked);
        });
    });

    // Detection sensitivity
    document.getElementById('sensitivitySelect').addEventListener('change', (e) => {
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            settings.detectionSensitivity = e.target.value;
            chrome.storage.local.set({ settings });
            console.log('Detection sensitivity changed:', e.target.value);
        });
    });

    // Clear cache
    document.getElementById('clearCacheBtn').addEventListener('click', () => {
        if (confirm('Are you sure? This will delete ALL your collected eggs and stats!')) {
            chrome.storage.local.set({
                totalScore: 0,
                recentSightings: [],
                loggedEasterEggLibrary: []
            }, () => {
                alert('All data cleared!');
                window.history.back();
            });
        }
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
        chrome.storage.local.get(['totalScore', 'recentSightings', 'loggedEasterEggLibrary'], (result) => {
            const exportData = {
                exportDate: new Date().toISOString(),
                totalScore: result.totalScore || 0,
                uniqueEggs: result.loggedEasterEggLibrary || [],
                recentSightings: result.recentSightings || []
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dax-tracker-export-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        });
    });

    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back();
    });
});
