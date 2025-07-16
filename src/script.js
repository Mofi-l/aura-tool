// src/script.js

(function() {
    'use strict';

const SharedFunctions = {
    // Authentication Modal
    async showAuthModal() {
        await this.injectAuthStyles();

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'auth-modal';
            modal.innerHTML = `
                <div class="auth-modal-content">
                    <h2 class="auth-modal-title">Authentication Required</h2>
                    <div class="auth-input-container">
                        <input type="text" id="username" class="auth-input" 
                               placeholder="Enter your login" autocomplete="off">
                    </div>
                    <div class="auth-input-container">
                        <input type="password" id="password" class="auth-input" 
                               placeholder="Enter your password">
                        <button id="toggle-password" class="toggle-password-btn">
                            <svg viewBox="0 0 24 24" class="eye-icon">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="auth-button-container">
                        <button id="auth-submit" class="auth-submit-btn">Submit</button>
                        <button id="auth-cancel" class="auth-cancel-btn">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners and functionality
            this.setupAuthModalListeners(modal, resolve);
        });
    },

    // Add AWS SDK loading function
    async loadAwsSdk() {
        return new Promise((resolve, reject) => {
            if (typeof AWS !== 'undefined' && AWS.S3) {
                console.log('AWS SDK is already loaded');
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.amazonaws.com/js/aws-sdk-2.1409.0.min.js';
            script.async = true;

            script.onload = () => {
                console.log('AWS SDK loaded successfully');
                resolve();
            };

            script.onerror = () => {
                const error = new Error('Failed to load AWS SDK');
                console.error(error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    },

    // Add Cognito SDK loading function
    async loadCognitoSDK() {
        return new Promise((resolve, reject) => {
            if (window.AmazonCognitoIdentity) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/amazon-cognito-identity-js/5.2.1/amazon-cognito-identity.min.js';
            script.async = true;

            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Cognito SDK'));

            document.head.appendChild(script);
        });
    }
};

// Initialize the application
async function initializeApp() {
    try {
        await SharedFunctions.loadAwsSdk();
        await SharedFunctions.loadCognitoSDK();
        
        // Check for stored credentials
        const storedUsername = localStorage.getItem('lastAuthUsername');
        const storedPassword = localStorage.getItem('lastAuthPassword');

        if (!storedUsername || !storedPassword) {
            const credentials = await SharedFunctions.showAuthModal();
            if (credentials) {
                localStorage.setItem('lastAuthUsername', credentials.username);
                localStorage.setItem('lastAuthPassword', credentials.password);
            }
        }

        // Rest of your initialization code
    } catch (error) {
        console.error('Failed to initialize:', error);
    }
}

// Start the application
initializeApp();

})();
