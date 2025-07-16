// src/auth.js

const AuthStyles = {
    async injectStyles() {
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
            }

            .auth-modal-content {
                background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
                padding: 35px;
                border-radius: 20px;
                width: min(90%, 420px);
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
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
                background: rgba(40, 40, 40, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                font-size: 15px;
                color: #ffffff;
                transition: all 0.2s ease;
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
                transition: all 0.3s ease;
            }

            .auth-submit-btn {
                background: linear-gradient(135deg, #5865f2, #818cf8);
                color: white;
                box-shadow: 0 6px 18px rgba(88, 101, 242, 0.25);
            }
        `;
        document.head.appendChild(styles);
    }
};

export class Auth {
    static async showAuthModal() {
        await AuthStyles.injectStyles();

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
                    </div>
                    <div class="auth-button-container">
                        <button id="auth-submit" class="auth-submit-btn">Submit</button>
                        <button id="auth-cancel" class="auth-cancel-btn">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

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
        try {
            const authenticationData = {
                Username: username,
                Password: password
            };

            const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

            const poolData = {
                UserPoolId: 'eu-north-1_V9kLPNVXl',
                ClientId: '68caeoofa7hl7p7pvs65bb2hrv'
            };

            const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            const userData = {
                Username: username,
                Pool: userPool
            };

            const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

            return new Promise((resolve, reject) => {
                cognitoUser.authenticateUser(authenticationDetails, {
                    onSuccess: function(result) {
                        const idToken = result.getIdToken().getJwtToken();
                        resolve(idToken);
                    },
                    onFailure: function(err) {
                        reject(err);
                    }
                });
            });
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    static async refreshCredentials(maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const username = localStorage.getItem('lastAuthUsername');
                const password = localStorage.getItem('lastAuthPassword');

                if (!username || !password) {
                    throw new Error('No stored credentials');
                }

                const token = await this.authenticate(username, password);
                return token;
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        throw new Error('Failed to refresh credentials after multiple attempts');
    }
}
