// src/loader.js

import { config, configUtils } from './config.js';
import { Auth } from './auth.js';

class ScriptLoader {
    constructor() {
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        try {
            if (!this.validateEnvironment()) {
                console.log('Invalid environment for script loading');
                return;
            }

            await this.loadDependencies();
            await this.authenticateAndLoad();
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleError(error);
        }
    }

    validateEnvironment() {
        const currentURL = window.location.href;
        const urlPattern = /^https:\/\/paragon-(na|eu|fe|cn|na-preprod|eu-preprod|fe-preprod)\.amazon\.com\/hz\/(lobby(\/v2)?|.*case.*|dox-search.*|search)$/;
        return urlPattern.test(currentURL);
    }

    async loadDependencies() {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/amazon-cognito-identity-js/5.2.1/amazon-cognito-identity.min.js');
        await this.loadScript('https://sdk.amazonaws.com/js/aws-sdk-2.1409.0.min.js');
    }

    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;

            script.onload = resolve;
            script.onerror = () => {
                this.retryCount++;
                if (this.retryCount < this.maxRetries) {
                    console.log(`Retrying script load: ${this.retryCount}`);
                    this.loadScript(url).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Failed to load script: ${url}`));
                }
            };

            document.head.appendChild(script);
        });
    }

    async authenticateAndLoad() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                throw new Error('Authentication failed');
            }

            await this.configureAWS(token);
            await this.loadMainScript();
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    async getAuthToken() {
        // Try stored credentials first
        const username = localStorage.getItem(config.storageKeys.authUsername);
        const password = localStorage.getItem(config.storageKeys.authPassword);

        if (username && password) {
            try {
                return await Auth.authenticate(username, password);
            } catch (error) {
                console.log('Stored credentials invalid, requesting new authentication');
                localStorage.removeItem(config.storageKeys.authUsername);
                localStorage.removeItem(config.storageKeys.authPassword);
            }
        }

        // If no stored credentials or they're invalid, show auth modal
        const credentials = await Auth.showAuthModal();
        if (!credentials) {
            throw new Error('Authentication cancelled');
        }

        const token = await Auth.authenticate(credentials.username, credentials.password);
        localStorage.setItem(config.storageKeys.authUsername, credentials.username);
        localStorage.setItem(config.storageKeys.authPassword, credentials.password);

        return token;
    }

    async configureAWS(token) {
        AWS.config.update({
            region: config.api.region,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: config.cognito.IdentityPoolId,
                Logins: {
                    [`cognito-idp.${config.cognito.Region}.amazonaws.com/${config.cognito.UserPoolId}`]: token
                }
            })
        });

        // Wait for credentials to be initialized
        return new Promise((resolve, reject) => {
            AWS.config.credentials.get(err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async loadMainScript() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const mainScript = document.createElement('script');
            mainScript.type = 'module';
            mainScript.src = 'MAIN_SCRIPT_URL'; // Replace with your actual script URL

            mainScript.onerror = () => {
                throw new Error('Failed to load main script');
            };

            document.head.appendChild(mainScript);
        } catch (error) {
            console.error('Error loading main script:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    handleError(error) {
        console.error('Script loader error:', error);

        if (error.message.includes('Authentication')) {
            localStorage.removeItem(config.storageKeys.authUsername);
            localStorage.removeItem(config.storageKeys.authPassword);
        }

        // You can add custom error handling here
        const errorMessage = config.errorMessages[error.code] || error.message;
        this.showErrorNotification(errorMessage);
    }

    showErrorNotification(message) {
        // Add your error notification UI logic here
        console.error('Error:', message);
    }

    // Utility method to check if script is already loaded
    isScriptLoaded(url) {
        return Array.from(document.scripts).some(script => script.src === url);
    }
}

// Initialize the loader
const loader = new ScriptLoader();
loader.initialize().catch(error => {
    console.error('Failed to initialize script loader:', error);
});

// Add event listener for page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Page became visible, checking script status...');
        loader.initialize().catch(console.error);
    }
});

// Export the loader instance
export default loader;
