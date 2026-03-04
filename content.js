// Content script - runs on DuckDuckGo pages
console.log('🦆 Dax Tracker content script loaded on:', window.location.href);
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
            console.log('🎯 Fallback storage update used for:', easterEgg.name);
        });
    });
}

// Function to detect easter eggs from either dynamic span or logo image
function detectEasterEgg() {
    console.log('🔍 detectEasterEgg called');
    
    // DEBUG: Show all potential logo elements
    const allSpans = document.querySelectorAll('span[class*="logo"]');
    console.log('🔍 All logo-related spans:', allSpans.length);
    allSpans.forEach((span, i) => {
        console.log(`  Span ${i}:`, span.className, span.style.backgroundImage || window.getComputedStyle(span).backgroundImage);
    });
    
    const allImages = document.querySelectorAll('img');
    console.log('🔍 All images on page:', allImages.length);
    allImages.forEach((img, i) => {
        if (img.src && (img.src.includes('logo') || img.src.includes('duck') || img.src.includes('dax') || img.className.includes('logo'))) {
            console.log(`  Img ${i}:`, img.className, img.src);
        }
    });
    
    // 1) Preferred: dynamic span logo (corrected selector)
    const logoSpan = document.querySelector('span.header__logo.js-logo-ddg.logo-dynamic');
    console.log('📌 Logo span found:', !!logoSpan);
    
    if (logoSpan) {
        const inlineBackgroundImage = logoSpan.style && logoSpan.style.backgroundImage ? logoSpan.style.backgroundImage : '';
        const computedBackgroundImage = window.getComputedStyle(logoSpan).backgroundImage || '';
        const combinedBgImage = inlineBackgroundImage || computedBackgroundImage;
        console.log('🖼️ Background image:', combinedBgImage);
        
        const logoUrl = getUrlFromBackgroundImage(combinedBgImage);
        console.log('🔗 Extracted URL:', logoUrl);
        
        const logoName = getEggNameFromUrl(logoUrl);
        console.log('🏷️ Egg name from URL:', logoName);

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
        console.log('📌 Fallback logo span found:', fallbackLogoSpan.className);
        const fbInlineBackgroundImage = fallbackLogoSpan.style && fallbackLogoSpan.style.backgroundImage ? fallbackLogoSpan.style.backgroundImage : '';
        const fbComputedBackgroundImage = window.getComputedStyle(fallbackLogoSpan).backgroundImage || '';
        const fbCombinedBgImage = fbInlineBackgroundImage || fbComputedBackgroundImage;
        console.log('🖼️ Fallback background image:', fbCombinedBgImage);
        
        const fbLogoUrl = getUrlFromBackgroundImage(fbCombinedBgImage);
        console.log('🔗 Fallback extracted URL:', fbLogoUrl);
        
        const fbLogoName = getEggNameFromUrl(fbLogoUrl);
        console.log('🏷️ Fallback egg name:', fbLogoName);

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
    console.log('🖼️ Logo image found:', !!logoImage, logoImage?.src);
    
    if (logoImage && logoImage.src) {
        const logoUrl = logoImage.src;
        console.log('🔗 Image URL:', logoUrl);
        
        const logoName = getEggNameFromUrl(logoUrl);
        console.log('🏷️ Egg name from image:', logoName);

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
            console.log('Dax tracker message error:', chrome.runtime.lastError.message);
            saveSightingFallback(easterEgg, searchQuery);
            return;
        }

        if (response && response.success) {
            console.log('🎉 Easter egg sighting logged!', easterEgg.name);
            
            // Show notification
            showNotification(`🎉 Found: ${easterEgg.name.replace('.png', '')}!`);
        } else if (response && response.duplicate) {
            console.log('⏭️ Easter egg already logged in library:', easterEgg.name);
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
    console.log('✅ checkForEasterEgg triggered');
    const easterEgg = detectEasterEgg();
    console.log('🎯 Detection result:', easterEgg);
    
    if (easterEgg) {
        console.log('🚀 Logging sighting for:', easterEgg.name);
        logEasterEggSighting(easterEgg);
    } else {
        console.log('❌ No easter egg detected');
    }
}

// Check on initial page load
console.log('⏰ Setting up initial check with 2-second delay for DOM to load...');
setTimeout(() => {
    console.log('⏰ Running delayed initial check...');
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
