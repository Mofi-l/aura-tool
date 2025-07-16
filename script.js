// script.js (in root directory)
(async function() {
    try {
        // Check if we're on a valid page
        const validPattern = /^https:\/\/paragon-(na|eu|fe|cn|na-preprod|eu-preprod|fe-preprod)\.amazon\.com\/hz\/(lobby(\/v2)?|.*case.*|dox-search.*|search)$/;
        
        if (!validPattern.test(window.location.href)) {
            console.log('Not on a valid Paragon page');
            return;
        }

        // Load the main script module
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://mofi-l.github.io/aura-tool/src/script.js';
        
        script.onerror = (error) => {
            console.error('Failed to load script:', error);
        };

        // Add promise to wait for script load
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

    } catch (error) {
        console.error('Error initializing Aura Tool:', error);
    }
})();
