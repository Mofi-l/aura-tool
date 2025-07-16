// script.js
(async function() {
    try {
        const baseUrl = 'https://mofi-l.github.io/aura-tool';
        
        // Load required scripts in order
        await loadScript(`${baseUrl}/src/config.js`);
        await loadScript(`${baseUrl}/src/auth.js`);
        await loadScript(`${baseUrl}/src/loader.js`);
        
        // Initialize the app
        if (window.ScriptLoader) {
            const loader = new ScriptLoader();
            await loader.initialize();
        }
    } catch (error) {
        console.error('Error initializing Aura Tool:', error);
    }
})();

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
