const fs = require('fs');
const dotenv = require('dotenv');
const { expand } = require('dotenv-expand');

jest.mock('fs');
jest.mock('dotenv');
jest.mock('dotenv-expand');

const loadEnvFile = require('../lib/loadEnvFile');
const validateEnvFile = require('../lib/validateEnvFile');

const schema = {
    REQUIRED_KEYS: {
        API_KEY: 'string',
        DB_URL: 'string',
        DEBUG_MODE: 'boolean',
        SESSION_SECRET: 'string',
        LOG_LEVEL: 'string',
        SMTP_HOST: 'string',
        SMTP_PORT: 'number',
        MAX_CONNECTIONS: 'number',
        FRONTEND_URL: 'string',
        NODE_ENV: 'string',
        JWT_SECRET: 'string',
        REDIS_URL: 'string',
        AWS_ACCESS_KEY_ID: 'string',
        AWS_SECRET_ACCESS_KEY: 'string',
        EMAIL_FROM: 'string'
    },
    OPTIONAL_KEYS: {
        PORT: 'number',
        CACHE_TIMEOUT: 'number',
        ENABLE_FEATURE_X: 'boolean',
        ENABLE_FEATURE_Y: 'boolean',
        API_BASE_URL: 'string',
        LOG_FILE_PATH: 'string',
        API_VERSION: 'string',
        ENABLE_EMAIL_NOTIFICATIONS: 'boolean',
        ENABLE_ANALYTICS: 'boolean',
        ALLOWED_ORIGINS: 'array',
        THROTTLE_LIMIT: 'number',
        ENABLE_SSO: 'boolean',
        SSO_PROVIDER_URL: 'string',
        MAINTENANCE_MODE: 'boolean',
        DEPLOY_ENV: 'string',
        FEATURES: 'array',
        CONFIG: 'object',
        START_DATE: 'date',
        USER_PREFERENCES: 'json'
    }
};

describe('📝 loadEnvFile', () => {
    const envContent = `
        API_KEY=abcd1234
        DB_URL=postgres://localhost:5432/db
        DEBUG_MODE=true
        SESSION_SECRET=secret123
        LOG_LEVEL=debug
        SMTP_HOST=smtp.mailtrap.io
        SMTP_PORT=587
        MAX_CONNECTIONS=100
        FRONTEND_URL=https://frontend.com
        NODE_ENV=production
        JWT_SECRET=jwt-secret
        REDIS_URL=redis://localhost:6379
        AWS_ACCESS_KEY_ID=AKIA...
        AWS_SECRET_ACCESS_KEY=secret...
        EMAIL_FROM=admin@example.com

        PORT=3000
        CACHE_TIMEOUT=60
        ENABLE_FEATURE_X=true
        ENABLE_FEATURE_Y=false
        API_BASE_URL=https://api.example.com
        LOG_FILE_PATH=/var/log/app.log
        API_VERSION=v1
        ENABLE_EMAIL_NOTIFICATIONS=false
        ENABLE_ANALYTICS=true
        ALLOWED_ORIGINS=["https://example.com", "https://staging.example.com"]
        THROTTLE_LIMIT=10
        ENABLE_SSO=true
        SSO_PROVIDER_URL=https://sso.example.com
        MAINTENANCE_MODE=false
        DEPLOY_ENV=staging
        FEATURES=["beta", "chat"]
        CONFIG={"darkMode":true,"itemsPerPage":20}
        START_DATE=2025-01-01
        USER_PREFERENCES={"language":"en","timezone":"UTC"}
    `;

    const parsedEnv = {
        API_KEY: 'abcd1234',
        DB_URL: 'postgres://localhost:5432/db',
        DEBUG_MODE: 'true',
        SESSION_SECRET: 'secret123',
        LOG_LEVEL: 'debug',
        SMTP_HOST: 'smtp.mailtrap.io',
        SMTP_PORT: '587',
        MAX_CONNECTIONS: '100',
        FRONTEND_URL: 'https://frontend.com',
        NODE_ENV: 'production',
        JWT_SECRET: 'jwt-secret',
        REDIS_URL: 'redis://localhost:6379',
        AWS_ACCESS_KEY_ID: 'AKIA...',
        AWS_SECRET_ACCESS_KEY: 'secret...',
        EMAIL_FROM: 'admin@example.com',

        PORT: '3000',
        CACHE_TIMEOUT: '60',
        ENABLE_FEATURE_X: 'true',
        ENABLE_FEATURE_Y: 'false',
        API_BASE_URL: 'https://api.example.com',
        LOG_FILE_PATH: '/var/log/app.log',
        API_VERSION: 'v1',
        ENABLE_EMAIL_NOTIFICATIONS: 'false',
        ENABLE_ANALYTICS: 'true',
        ALLOWED_ORIGINS: '["https://example.com", "https://staging.example.com"]',
        THROTTLE_LIMIT: '10',
        ENABLE_SSO: 'true',
        SSO_PROVIDER_URL: 'https://sso.example.com',
        MAINTENANCE_MODE: 'false',
        DEPLOY_ENV: 'staging',
        FEATURES: '["beta", "chat"]',
        CONFIG: '{"darkMode":true,"itemsPerPage":20}',
        START_DATE: '2025-01-01',
        USER_PREFERENCES: '{"language":"en","timezone":"UTC"}'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        fs.readFileSync.mockReturnValue(envContent);
        dotenv.parse.mockReturnValue(parsedEnv);
    });

    const testCases = ['.env', '.env.staging', '.env.production', '.env.test'];

    test.each(testCases)('Should load and validate %s without errors or warnings', (envFile) => {
        const envVars = loadEnvFile(envFile);

        expect(fs.readFileSync).toHaveBeenCalledWith(envFile, 'utf-8');
        expect(dotenv.parse).toHaveBeenCalledWith(envContent);
        expect(expand).toHaveBeenCalledWith(parsedEnv);

        const { errors, warnings } = validateEnvFile(envVars, schema);

        expect(errors).toEqual([]);
        expect(warnings).toEqual([]);
    });
});
