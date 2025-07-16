// src/auth.js
import { config, configUtils } from './config.js';

export class Auth {
    static async loadCognitoSDK() {
        return new Promise((resolve, reject) => {
            if (window.AmazonCognitoIdentity) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/amazon-cognito-identity-js/5.2.1/amazon-cognito-identity.min.js';
            script.async = true;

            script.onload = () => {
                console.log('Amazon Cognito SDK loaded successfully');
                resolve();
            };

            script.onerror = () => {
                console.warn('Primary SDK load failed. Trying alternate source.');
                const fallbackScript = document.createElement('script');
                fallbackScript.src = 'https://unpkg.com/amazon-cognito-identity-js@5.2.1/dist/amazon-cognito-identity.min.js';
                fallbackScript.async = true;

                fallbackScript.onload = () => {
                    console.log('Fallback Amazon Cognito SDK loaded successfully');
                    resolve();
                };

                fallbackScript.onerror = () => {
                    const error = new Error('Failed to load Amazon Cognito SDK from all sources');
                    console.error(error);
                    reject(error);
                };

                document.head.appendChild(fallbackScript);
            };

            document.head.appendChild(script);
        });
    }

    static async showAuthModal() {
        await this.injectAuthStyles();

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'auth-modal';
            modal.innerHTML = `
                <div class="auth-modal-content">
                    <h2 class="auth-modal-title">Authentication Required</h2>
                    <div class="auth-input-container">
                        <input type="text" id="username" class="auth-input" placeholder="Enter your login" autocomplete="off">
                    </div>
                    <div class="auth-input-container">
                        <input type="password" id="password" class="auth-input" placeholder="Enter your password">
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

            const togglePassword = document.getElementById('toggle-password');
            const passwordInput = document.getElementById('password');

            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.innerHTML = type === 'password' ?
                    '<svg viewBox="0 0 24 24" class="eye-icon"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' :
                    '<svg viewBox="0 0 24 24" class="eye-icon"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>';
            });

            document.getElementById('auth-submit').addEventListener('click', () => {
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();

                if (!username || !password) {
                    alert('Both username and password are required.');
                    return;
                }

                modal.remove();
                resolve({ username, password });
            });

            document.getElementById('auth-cancel').addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });
        });
    }

    static async authenticate(username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        await this.loadCognitoSDK();

        const authenticationData = {
            Username: username,
            Password: password
        };

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        const poolData = {
            UserPoolId: config.cognito.UserPoolId,
            ClientId: config.cognito.ClientId
        };

        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        const userData = {
            Username: username,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        return new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    const idToken = result.getIdToken().getJwtToken();
                    resolve(idToken);
                },
                onFailure: (err) => {
                    if (err.name === 'NotAuthorizedException') {
                        localStorage.removeItem('lastAuthUsername');
                        localStorage.removeItem('lastAuthPassword');
                    }
                    reject(err);
                }
            });
        });
    }

    static async injectAuthStyles() {
        if (document.getElementById('auth-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'auth-styles';
        styles.textContent = `
            .auth-modal {
                position: fixed;
                inset: 0;
                background-color: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10002;
                backdrop-filter: blur(12px);
                animation: overlayFadeIn 0.3s ease-out;
            }

            .auth-modal-content {
                background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
                padding: 35px;
                border-radius: 20px;
                width: min(90%, 420px);
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
                animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

                    .auth-modal-title {
                font-size: 28px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 30px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }

            .auth-input-container {
                margin-bottom: 20px;
                position: relative;
            }

            .auth-input {
                width: 100%;
                padding: 14px 18px;
                padding-right: 45px;
                background: rgba(40, 40, 40, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                font-size: 15px;
                color: #ffffff;
                transition: all 0.2s ease;
                -webkit-appearance: none;
                appearance: none;
            }

            .auth-input:hover {
                background: rgba(45, 45, 45, 0.95);
            }

            .auth-input:focus {
                outline: none;
                border-color: #6c7bff;
                background: rgba(50, 50, 50, 0.95);
                box-shadow: 0 0 0 3px rgba(108, 123, 255, 0.1);
            }

            .auth-input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }

            .auth-input[type="password"] {
                        color: #ffffff;
            }

            .auth-button-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 30px;
            }

            .auth-submit-btn,
            .auth-cancel-btn {
                padding: 12px 28px;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .auth-submit-btn {
                background: linear-gradient(135deg, #5865f2, #818cf8);
                color: white;
                box-shadow: 0 6px 18px rgba(88, 101, 242, 0.25);
            }

            .auth-submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(88, 101, 242, 0.35);
            }

            .auth-cancel-btn {
                background: rgba(255, 255, 255, 0.08);
                color: white;
                backdrop-filter: blur(4px);
            }

            .auth-cancel-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                transform: translateY(-2px);
            }

            .toggle-password-btn {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                padding: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .eye-icon {
                width: 20px;
                height: 20px;
                color: black;
                transition: fill 0.2s ease;
            }

            .toggle-password-**************-icon {
                color: black;
            }

            @keyframes overlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.95) translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @media (max-width: 480px) {
                .auth-modal-content {
                    width: 95%;
                    padding: 25px;
                    margin: 20px;
                }

                .auth-button-container {
                    grid-template-columns: 1fr;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .auth-modal,
                .auth-modal-content {
                    animation: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

export const AuthUtils = {
    async refreshToken() {
        const username = localStorage.getItem(config.storageKeys.authUsername);
        const password = localStorage.getItem(config.storageKeys.authPassword);

        if (!username || !password) {
            throw new Error('No stored credentials');
        }

        return await Auth.authenticate(username, password);
    },

    isAuthenticated() {
        return !!(localStorage.getItem(config.storageKeys.authUsername) &&
                 localStorage.getItem(config.storageKeys.authPassword));
    },

    clearCredentials() {
        localStorage.removeItem(config.storageKeys.authUsername);
        localStorage.removeItem(config.storageKeys.authPassword);
    }
};
