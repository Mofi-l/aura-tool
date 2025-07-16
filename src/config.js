// src/config.js

export const config = {
    // AWS Cognito Configuration
    cognito: {
        UserPoolId: 'eu-north-1_V9kLPNVXl',
        ClientId: '68caeoofa7hl7p7pvs65bb2hrv',
        Region: 'eu-north-1',
        IdentityPoolId: 'eu-north-1:98c07095-e731-4219-bebe-db4dab892ea8'
    },

    // API Configuration
    api: {
        endpoint: 'https://09umyreyjb.execute-api.eu-north-1.amazonaws.com/Prod',
        region: 'eu-north-1'
    },

    // S3 Configuration
    s3: {
        auxDataBucket: 'aux-data-bucket',
        projectDetailsBucket: 'project-details-bucket',
        realTimeBucket: 'real-time-databucket',
        auxPrefixes: ['Aura_NPT_', 'aux_data_']
    },

    // URL Patterns
    urlPatterns: {
        validDomains: [
            'paragon-na.amazon.com',
            'paragon-eu.amazon.com',
            'paragon-fe.amazon.com',
            'paragon-cn.amazon.com',
            'paragon-na-preprod.amazon.com',
            'paragon-eu-preprod.amazon.com',
            'paragon-fe-preprod.amazon.com'
        ],
        validPaths: [
            'lobby',
            'lobby/v2',
            'case',
            'dox-search',
            'search'
        ],
        urlPattern: /^https:\/\/paragon-(na|eu|fe|cn|na-preprod|eu-preprod|fe-preprod)\.amazon\.com\/hz\/(lobby(\/v2)?|.*case.*|dox-search.*|search)$/
    },

    // Feature Flags
    features: {
        enableDashboard: true,
        enableProjectDetails: true,
        enableFlashData: true,
        enableRealTimeTracking: true,
        enableAutoSync: true
    },

    // Storage Keys
    storageKeys: {
        authUsername: 'lastAuthUsername',
        authPassword: 'lastAuthPassword',
        auxState: 'auxState',
        projectFormSubmitted: 'projectFormSubmitted',
        lastLoginDate: 'lastLoginDate',
        lastLogoutDate: 'lastLogoutDate',
        widgetState: 'widgetState',
        dataModified: 'dataModified',
        firstAuxUpdateTime: 'firstAuxUpdateTime',
        offlineTime: 'offlineTime',
        lastActiveDate: 'lastActiveDate',
        currentUsername: 'currentUsername',
        isDataSent: 'isDataSent'
    },

    // Timing Configuration
    timing: {
        refreshInterval: 30000,         // 30 seconds
        dashboardUpdateInterval: 10000, // 10 seconds
        minimumTimeThreshold: 5000,     // 5 seconds
        retryDelay: 1000,              // 1 second
        maxRetries: 3
    },

    // Version Information
    version: {
        current: '2.5',
        lastUpdated: 'April 2024',
        checkInterval: 86400000 // 24 hours
    },

    // Error Messages
    errorMessages: {
        authFailed: 'Authentication failed. Please try again.',
        networkError: 'Network error. Please check your connection.',
        invalidPermissions: "You don't have permission to perform this action.",
        dataSubmissionFailed: 'Failed to submit data. Please try again.',
        invalidEnvironment: 'Please use this tool on a valid Paragon page.',
        scriptLoadError: 'Failed to load required scripts.',
        generalError: 'An unexpected error occurred. Please try again.'
    },

    // AWS SDK Configuration
    aws: {
        cognitoIdentity: {
            endpoint: 'cognito-idp.eu-north-1.amazonaws.com'
        },
        s3: {
            endpoint: 's3.eu-north-1.amazonaws.com'
        }
    }
};

// Utility functions for config
export const configUtils = {
    isValidDomain(domain) {
        return config.urlPatterns.validDomains.some(validDomain => 
            domain.includes(validDomain)
        );
    },

    isValidPath(path) {
        return config.urlPatterns.validPaths.some(validPath => 
            path.includes(validPath)
        );
    },

    isValidUrl(url) {
        return config.urlPatterns.urlPattern.test(url);
    },

    getStorageKey(key) {
        return config.storageKeys[key] || null;
    },

    isFeatureEnabled(featureName) {
        return config.features[featureName] || false;
    },

    getAwsConfig() {
        return {
            region: config.api.region,
            credentials: {
                identityPoolId: config.cognito.IdentityPoolId
            }
        };
    },

    getErrorMessage(errorCode) {
        return config.errorMessages[errorCode] || config.errorMessages.generalError;
    },

    getCurrentVersion() {
        return config.version.current;
    },

    shouldCheckForUpdates() {
        const lastCheck = localStorage.getItem('lastUpdateCheck');
        if (!lastCheck) return true;
        
        return Date.now() - parseInt(lastCheck) >= config.version.checkInterval;
    }
};
