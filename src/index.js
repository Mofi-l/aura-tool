// src/index.js

import { config, configUtils } from './config.js';
import { Auth } from './auth.js';
import loader from './loader.js';

class AuraApp {
    constructor() {
        this.initialized = false;
        this.version = config.version.current;
    }

    async initialize() {
        if (this.initialized) {
            console.log('Aura Tool already initialized');
            return;
        }

        try {
            // Validate environment
            if (!this.validateEnvironment()) {
                throw new Error(config.errorMessages.invalidEnvironment);
            }

            // Initialize loader
            await loader.initialize();

            // Set up event listeners
            this.setupEventListeners();

            // Store username
            const username = localStorage.getItem(config.storageKeys.authUsername);
            if (username) {
                localStorage.setItem(config.storageKeys.currentUsername, username);
            }

            // Initialize features
            await this.initializeFeatures();

            this.initialized = true;
            console.log(`Aura Tool v${this.version} initialized successfully`);

        } catch (error) {
            console.error('Failed to initialize Aura Tool:', error);
            this.handleInitializationError(error);
        }
    }

    validateEnvironment() {
        return configUtils.isValidUrl(window.location.href);
    }

    setupEventListeners() {
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                this.refreshData();
            }
        });

        // Online/Offline status
        window.addEventListener('online', () => {
            console.log('Connection restored, refreshing data...');
            this.refreshData();
        });

        window.addEventListener('offline', () => {
            console.log('Connection lost. Updates paused.');
            this.handleOfflineState();
        });

        // Before unload
        window.addEventListener('beforeunload', (event) => {
            this.handleBeforeUnload(event);
        });

        // Error handling
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event);
        });

        // Custom events
        window.addEventListener('auxStateChange', (event) => {
            this.handleAuxStateChange(event.detail);
        });

        window.addEventListener('timerUpdate', (event) => {
            this.handleTimerUpdate(event.detail);
        });
    }

    async initializeFeatures() {
        // Initialize features based on config flags
        if (config.features.enableDashboard) {
            await this.initializeDashboard();
        }

        if (config.features.enableProjectDetails) {
            await this.initializeProjectDetails();
        }

        if (config.features.enableAutoSync) {
            this.startAutoSync();
        }
    }

    async initializeDashboard() {
        try {
            const { default: Dashboard } = await import('./dashboard.js');
            this.dashboard = new Dashboard();
            await this.dashboard.initialize();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
        }
    }

    async initializeProjectDetails() {
        try {
            const { default: ProjectDetails } = await import('./projectDetails.js');
            this.projectDetails = new ProjectDetails();
            await this.projectDetails.initialize();
        } catch (error) {
            console.error('Failed to initialize project details:', error);
        }
    }

    startAutoSync() {
        const syncInterval = config.timing.refreshInterval;
        this.syncInterval = setInterval(() => {
            this.refreshData();
        }, syncInterval);
    }

    async refreshData() {
        if (!navigator.onLine) {
            console.log('Offline - skipping data refresh');
            return;
        }

        try {
            // Refresh authentication if needed
            await this.refreshAuthIfNeeded();

            // Update dashboard if it exists
            if (this.dashboard) {
                await this.dashboard.updateData();
            }

            // Update project details if they exist
            if (this.projectDetails) {
                await this.projectDetails.updateData();
            }

        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    async refreshAuthIfNeeded() {
        try {
            await Auth.refreshCredentialsIfNeeded();
        } catch (error) {
            console.error('Failed to refresh authentication:', error);
            throw error;
        }
    }

    handleOfflineState() {
        // Clear any running intervals
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Store current state
        const currentState = {
            timestamp: Date.now(),
            status: 'offline'
        };
        localStorage.setItem('offlineState', JSON.stringify(currentState));
    }

    handleBeforeUnload(event) {
        // Save any unsaved state
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        if (event.reason.code === 'CredentialsError') {
            this.handleAuthError();
        }
    }

    handleAuxStateChange(detail) {
        console.log('AUX state changed:', detail);
        // Handle AUX state changes
    }

    handleTimerUpdate(detail) {
        console.log('Timer updated:', detail);
        // Handle timer updates
    }

    handleInitializationError(error) {
        if (error.message.includes('Authentication')) {
            this.handleAuthError();
        } else {
            console.error('Initialization error:', error);
        }
    }

    handleAuthError() {
        // Clear stored credentials
        localStorage.removeItem(config.storageKeys.authUsername);
        localStorage.removeItem(config.storageKeys.authPassword);

        // Reinitialize
        this.initialized = false;
        this.initialize();
    }

    hasUnsavedChanges() {
        return false; // Implement your logic here
    }

    shutdown() {
        // Clean up intervals
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Clean up features
        if (this.dashboard) {
            this.dashboard.cleanup();
        }

        if (this.projectDetails) {
            this.projectDetails.cleanup();
        }

        this.initialized = false;
    }
}

// Create and export app instance
const auraApp = new AuraApp();

// Export everything that needs to be accessible
export {
    config,
    Auth,
    loader,
    auraApp
};

// Auto-initialize if we're in a valid environment
if (configUtils.isValidUrl(window.location.href)) {
    auraApp.initialize();
}
