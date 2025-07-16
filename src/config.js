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
        realTimeBucket: 'real-time-databucket'
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
        ]
    },

    // Feature Flags
    features: {
        enableDashboard: true,
        enableProjectDetails: true,
        enableFlashData: true,
        enableRealTimeTracking: true
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
        dataModified: 'dataModified'
    },

    // Timing Configuration
    timing: {
        refreshInterval: 30000, // 30 seconds
        dashboardUpdateInterval: 10000, // 10 seconds
        minimumTimeThreshold: 5000 // 5 seconds
    },

    // Version Information
    version: {
        current: '2.5',
        lastUpdated: 'April 2024'
    },

    // AWS SDK Configuration
    aws: {
        cognitoIdentity: {
            endpoint: 'cognito-idp.eu-north-1.amazonaws.com',
            region: 'eu-north-1'
        },
        s3: {
            endpoint: 's3.eu-north-1.amazonaws.com',
            region: 'eu-north-1'
        }
    },

    // Error Messages
    errorMessages: {
        authFailed: 'Authentication failed. Please try again.',
        networkError: 'Network error. Please check your connection.',
        invalidPermissions: 'You don't have permission to perform this action.',
        dataSubmissionFailed: 'Failed to submit data. Please try again.'
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

    getStorageKey(key) {
        return config.storageKeys[key];
    },

    isFeatureEnabled(featureName) {
        return config.features[featureName] || false;
    }
};
