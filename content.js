// Content script - runs on DuckDuckGo pages
let lastSentEggName = null;

function getUrlFromBackgroundImage(backgroundImage) {
    if (!backgroundImage || backgroundImage === 'none') {
        return null;
    }

    const urlMatch = backgroundImage.match(/url\((['"]?)(.*?)\1\)/i);
    if (!urlMatch || !urlMatch[2]) {
        return null;
    }

    return urlMatch[2];
}

function getEggNameFromUrl(url) {
    if (!url) {
        return null;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url, window.location.origin);
    } catch {
        return null;
    }

    const pathname = (parsedUrl.pathname || '').toLowerCase();
    const isDynamic = pathname.includes('/dist/logos/dynamic/');
    const isDefault = pathname.includes('logo_homepage') || pathname.includes('logo_header');
    const isFavicon = pathname.includes('favicon');

    if (!isDynamic || isDefault || isFavicon) {
        return null;
    }

    const fileName = pathname.split('/').pop();
    return fileName || null;
}

function saveSightingFallback(easterEgg, searchQuery) {
    chrome.storage.local.get(['totalScore', 'sessionScore', 'recentSightings', 'loggedEasterEggLibrary'], (result) => {
        const loggedEasterEggLibrary = result.loggedEasterEggLibrary || [];
        if (loggedEasterEggLibrary.includes(easterEgg.name)) {
            return;
        }

        const totalScore = (result.totalScore || 0) + 1;
        const sessionScore = (result.sessionScore || 0) + 1;
        const recentSightings = result.recentSightings || [];

        recentSightings.unshift({
            easterEgg: easterEgg.name,
            eggUrl: easterEgg.url,
            query: searchQuery,
            timestamp: easterEgg.timestamp
        });

        if (recentSightings.length > 50) {
            recentSightings.length = 50;
        }

        chrome.storage.local.set({
            totalScore,
            sessionScore,
            recentSightings,
            loggedEasterEggLibrary: [...loggedEasterEggLibrary, easterEgg.name]
        }, () => {
            showNotification(`🦆 Found: ${easterEgg.name.replace('.png', '')}!`);
        });
    });
}

// Function to detect easter eggs from either dynamic span or logo image
function detectEasterEgg() {
    
    // DEBUG: Show all potential logo elements
    const allSpans = document.querySelectorAll('span[class*="logo"]');
    
    const allImages = document.querySelectorAll('img');
    
    // 1) Preferred: dynamic span logo (corrected selector)
    const logoSpan = document.querySelector('span.header__logo.js-logo-ddg.logo-dynamic');
    
    if (logoSpan) {
        const inlineBackgroundImage = logoSpan.style && logoSpan.style.backgroundImage ? logoSpan.style.backgroundImage : '';
        const computedBackgroundImage = window.getComputedStyle(logoSpan).backgroundImage || '';
        const combinedBgImage = inlineBackgroundImage || computedBackgroundImage;
        
        const logoUrl = getUrlFromBackgroundImage(combinedBgImage);
        
        const logoName = getEggNameFromUrl(logoUrl);

        if (logoName) {
            return {
                url: logoUrl,
                name: logoName,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 2) Fallback: any span with logo-dynamic class
    const fallbackLogoSpan = document.querySelector('span.logo-dynamic');
    if (!logoSpan && fallbackLogoSpan) {
        const fbInlineBackgroundImage = fallbackLogoSpan.style && fallbackLogoSpan.style.backgroundImage ? fallbackLogoSpan.style.backgroundImage : '';
        const fbComputedBackgroundImage = window.getComputedStyle(fallbackLogoSpan).backgroundImage || '';
        const fbCombinedBgImage = fbInlineBackgroundImage || fbComputedBackgroundImage;
        
        const fbLogoUrl = getUrlFromBackgroundImage(fbCombinedBgImage);
        
        const fbLogoName = getEggNameFromUrl(fbLogoUrl);

        if (fbLogoName) {
            return {
                url: fbLogoUrl,
                name: fbLogoName,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // 3) Image-based logos across DDG layouts
    const logoImage = document.querySelector('#logo_homepage_link img, .header__logo img, .header__logo--img, img[id*="logo"]');
    
    if (logoImage && logoImage.src) {
        const logoUrl = logoImage.src;
        
        const logoName = getEggNameFromUrl(logoUrl);

        if (logoName) {
            return {
                url: logoUrl,
                name: logoName,
                timestamp: new Date().toISOString()
            };
        }
    }

    return null;
}

// Get the search query from the URL
function getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || 'Unknown search';
}

// Log the easter egg sighting
function logEasterEggSighting(easterEgg) {
    // Avoid spamming the same event repeatedly from observer + interval
    if (lastSentEggName === easterEgg.name) {
        return;
    }
    lastSentEggName = easterEgg.name;
    
    const searchQuery = getSearchQuery();
    
    // Send message to background script
    chrome.runtime.sendMessage({
        type: 'EASTER_EGG_SIGHTING',
        easterEgg: easterEgg,
        query: searchQuery
    }, (response) => {
        if (chrome.runtime.lastError) {
            saveSightingFallback(easterEgg, searchQuery);
            return;
        }

        if (response && response.success) {
            
            // Show notification
            showNotification(`🎉 Found: ${easterEgg.name.replace('.png', '')}!`);
        } else if (response && response.duplicate) {
        } else {
            saveSightingFallback(easterEgg, searchQuery);
        }
    });
}

// Show a subtle notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #de5833, #ff9c4a);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Check for easter egg on page load
function checkForEasterEgg() {
    const easterEgg = detectEasterEgg();
    
    if (easterEgg) {
        logEasterEggSighting(easterEgg);
    }
}

// Check on initial page load
setTimeout(() => {
    checkForEasterEgg();
}, 2000);

// Also run immediately
checkForEasterEgg();

// Also check when the logo changes (for dynamic content)
const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
            shouldCheck = true;
        }
    });

    if (shouldCheck) {
        checkForEasterEgg();
    }
});

// Observe the logo container and header for changes
const header = document.querySelector('header') || document.body;
observer.observe(header, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'src']
});

// Also check periodically (in case DOM observer misses it)
setInterval(checkForEasterEgg, 2000);

// Reset local spam guard on URL changes in DDG SPA navigation
let lastUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        lastSentEggName = null;
    }
}, 500);
