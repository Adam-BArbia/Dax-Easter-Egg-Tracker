// Background script - manages state and score tracking

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.type === 'EASTER_EGG_SIGHTING') {
        // Get current scores
        chrome.storage.local.get(
            ['totalScore', 'recentSightings', 'loggedEasterEggLibrary'],
            (result) => {
                const loggedEasterEggLibrary = result.loggedEasterEggLibrary || [];
                const incomingEggName = (request.easterEgg && request.easterEgg.name) || '';

                if (!incomingEggName) {
                    sendResponse({ success: false, reason: 'missing_egg_name' });
                    return;
                }

                if (loggedEasterEggLibrary.includes(incomingEggName)) {
                    sendResponse({ success: false, duplicate: true });
                    return;
                }

                const totalScore = (result.totalScore || 0) + 1;
                const recentSightings = result.recentSightings || [];

                // Add new sighting to the recent list
                const newSighting = {
                    easterEgg: request.easterEgg.name,
                    eggUrl: request.easterEgg.url,
                    query: request.query,
                    timestamp: request.easterEgg.timestamp
                };
                recentSightings.unshift(newSighting);
                
                // Keep only last 50 sightings
                if (recentSightings.length > 50) {
                    recentSightings.pop();
                }

                // Update storage
                chrome.storage.local.set({
                    totalScore: totalScore,
                    recentSightings: recentSightings,
                    loggedEasterEggLibrary: [...loggedEasterEggLibrary, incomingEggName]
                }, () => {
                    
                    // Update badge to show current score
                    chrome.action.setBadgeText({ text: totalScore.toString() });
                    chrome.action.setBadgeBackgroundColor({ color: '#de5833' });
                    
                    sendResponse({ success: true, totalScore: totalScore });
                });
            }
        );

        // Return true to indicate we'll send response asynchronously
        return true;
    }
});

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['totalScore'], (result) => {
        if (result.totalScore === undefined) {
            chrome.storage.local.set({
                totalScore: 0,
                recentSightings: [],
                loggedEasterEggLibrary: []
            });
        } else {
            // Update badge with existing score
            chrome.action.setBadgeText({ text: result.totalScore.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#de5833' });
        }
    });
});
