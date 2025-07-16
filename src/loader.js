// src/loader.js

import { config, configUtils } from './config.js';
import { Auth } from './auth.js';

export class ScriptLoader {
    constructor() {
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = config.timing.maxRetries;
    }

    async initialize() {
        try {
            if (!this.validateEnvironment()) {
                console.log(config.errorMessages.invalidEnvironment);
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
        return configUtils.isValidUrl(window.location.href);
    }

    async loadDependencies() {
        const dependencies = [
            'https://cdnjs.cloudflare.com/ajax/libs/amazon-cognito-identity-js/5.2.1/amazon-cognito-identity.min.js',
            'https://sdk.amazonaws.com/js/aws-sdk-2.1409.0.min.js'
        ];

        for (const url of dependencies) {
            await this.loadScript(url);
        }
    }  }

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
            mainScript.src = `${window.location.origin}/src/main.js`;

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

        const errorMessage = configUtils.getErrorMessage(error.code) || error.message;
        this.showErrorNotification(errorMessage);
    }

    showErrorNotification(message) {
        // Add your error notification UI logic here
        console.error('Error:', message);
        alert(`Aura Tool Error: ${message}`);
    }
}

// Create and export a default instance
const loader = new ScriptLoader();
export default loader;
