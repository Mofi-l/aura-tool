// script.js
(async function() {
    try {
        const baseUrl = 'https://mofi-l.github.io/aura-tool';
        
        // Load AWS SDK and Cognito
        await loadExternalScript('https://sdk.amazonaws.com/js/aws-sdk-2.1409.0.min.js');
        await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/amazon-cognito-identity-js/5.2.1/amazon-cognito-identity.min.js');

        // Load our modules in order
        await loadModules([
            `${baseUrl}/src/config.js`,
            `${baseUrl}/src/auth.js`,
            `${baseUrl}/src/loader.js`,
            `${baseUrl}/src/index.js`
        ]);

        // Initialize the app
        if (window.AuraTool) {
            await window.AuraTool.initialize();
        }
    } catch (error) {
        console.error('Error initializing Aura Tool:', error);
    }
})();

function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadModules(urls) {
    return Promise.all(urls.map(url => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }));
}
