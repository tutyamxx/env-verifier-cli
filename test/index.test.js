const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// eslint-disable-next-line no-undef
const TEMP_DIR = path.resolve(__dirname, 'temp');

// eslint-disable-next-line no-undef
const CLI_PATH = path.resolve(__dirname, '../bin/index');

const mockEnv = `
    API_KEY=abc123
    DB_URL=postgres://localhost
    DEBUG_MODE=true
    SESSION_SECRET=secret
    LOG_LEVEL=info
    SMTP_HOST=smtp.example.com
    SMTP_PORT=587
    MAX_CONNECTIONS=10
    FRONTEND_URL=https://example.com
    NODE_ENV=production
    JWT_SECRET=jwtsecret
    REDIS_URL=redis://localhost
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
    ENABLE_EMAIL_NOTIFICATIONS=true
    ENABLE_ANALYTICS=true
    ALLOWED_ORIGINS=["*"]
    THROTTLE_LIMIT=100
    ENABLE_SSO=false
    SSO_PROVIDER_URL=https://sso.example.com
    MAINTENANCE_MODE=false
    DEPLOY_ENV=production
    FEATURES=["feature1", "feature2"]
    CONFIG={"key":"value"}
    START_DATE=2025-01-01
    USER_PREFERENCES={"theme":"dark"}
`;

const mockSchema = {
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

describe('💻 CLI: Testing', () => {
    const envPath = path.join(TEMP_DIR, '.env');
    const schemaPath = path.join(TEMP_DIR, 'env.schema.json');

    beforeAll(() => {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
        fs.writeFileSync(envPath, mockEnv);
        fs.writeFileSync(schemaPath, JSON.stringify(mockSchema, null, 2));
    });

    afterAll(() => fs.rmSync(TEMP_DIR, { recursive: true, force: true }));

    test('Should pass with valid env file', () => {
        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/✅ .env file passed validation/);
        expect(result.stderr).toBe('');
    });

    test('Should fail when .env file is missing', () => {
        const result = spawnSync('node', [CLI_PATH, '--env', 'missing.env', '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/❌ .env file not found/);
    });

    test('Should fail when schema file is missing', () => {
        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', 'missing.schema.json', '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(1);
        expect(result.stderr).toMatch(/❌ Schema file not found/);
    });

    test('Should show warning for unused key', () => {
        const extendedEnv = `${mockEnv}\nEXTRA_KEY=unexpected\n`;
        fs.writeFileSync(envPath, extendedEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).toMatch(/Unused keys: EXTRA_KEY/);
    });

    test('Should show error for missing required key', () => {
        const brokenEnv = mockEnv.replace(/API_KEY=.*/, '');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/🚨 Missing or invalid keys:/);
        expect(result.stdout).toMatch(/❌ API_KEY is missing/);
    });

    test('Should show warning for invalid type (boolean)', () => {
        const brokenEnv = mockEnv.replace(/DEBUG_MODE=true/, 'DEBUG_MODE=notabool');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).toMatch(/⚠️ DEBUG_MODE type mismatch \(expected boolean\)/);
    });

    test('Should show warning for invalid type (number)', () => {
        const brokenEnv = mockEnv.replace(/SMTP_PORT=587/, 'SMTP_PORT=notanumber');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).toMatch(/⚠️ SMTP_PORT type mismatch \(expected number\)/);
    });

    test('Should show warning for invalid type (array)', () => {
        const brokenEnv = mockEnv.replace(/ALLOWED_ORIGINS=\["\*\"]/g, 'ALLOWED_ORIGINS="not-an-array"');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).toMatch(/⚠️ ALLOWED_ORIGINS type mismatch \(expected array\)/);
    });

    test('Should show warning for invalid type (date)', () => {
        const brokenEnv = mockEnv.replace(/START_DATE=2025-01-01/g, 'START_DATE=not-a-date');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).toMatch(/⚠️ START_DATE type mismatch \(expected date\)/);
    });

    test('Should show warning for invalid type (json)', () => {
        const brokenEnv = mockEnv.replace(/USER_PREFERENCES=\{"theme":"dark"\}/g, 'USER_PREFERENCES="not-a-json"');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).toMatch(/⚠️ USER_PREFERENCES type mismatch \(expected json\)/);
    });

    test('Should exit with status 1 on error when --exit true', () => {
        const brokenEnv = mockEnv.replace(/API_KEY=.*/, '');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'true'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(1);
        expect(result.stdout).toMatch(/🚨 Missing or invalid keys:/);
        expect(result.stdout).toMatch(/🚨 Validation failed\. Exitting/);
    });

    test('Should not exit with status 1 on error when --exit false', () => {
        const brokenEnv = mockEnv.replace(/API_KEY=.*/, '');
        fs.writeFileSync(envPath, brokenEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', 'false'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/🚨 Missing or invalid keys:/);
        expect(result.stdout).not.toMatch(/Validation failed\. Exitting/);
    });

    test('Should exit with status 1 on warning when --exit 1', () => {
        const extendedEnv = `${mockEnv}\nEXTRA_KEY=unexpected\n`;
        fs.writeFileSync(envPath, extendedEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', '1'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(1);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).toMatch(/EXTRA_KEY/);
        expect(result.stdout).toMatch(/Validation failed\. Exitting/);
    });

    test('Should not exit with status 1 on warning when --exit 0', () => {
        const extendedEnv = `${mockEnv}\nEXTRA_KEY=unexpected\n`;
        fs.writeFileSync(envPath, extendedEnv);

        const result = spawnSync('node', [CLI_PATH, '--env', envPath, '--schema', schemaPath, '--exit', '0'], {
            encoding: 'utf-8'
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toMatch(/⚠️ Warnings:/);
        expect(result.stdout).not.toMatch(/Validation failed\. Exitting/);
    });
});
