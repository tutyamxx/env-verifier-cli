const validateEnvFile = require('../lib/validateEnvFile');

describe('📝 validateEnvFile', () => {
    const schema = {
        REQUIRED_KEYS: {
            API_KEY: 'string',
            DEBUG_MODE: 'boolean',
            SMTP_PORT: 'number'
        },

        OPTIONAL_KEYS: {
            ENABLE_FEATURE_X: 'boolean',
            ALLOWED_ORIGINS: 'array',
            CONFIG: 'json',
            START_DATE: 'date'
        }
    };

    test('Should return no errors or warnings for valid env file', () => {
        const env = {
            API_KEY: 'abc123',
            DEBUG_MODE: 'true',
            SMTP_PORT: '587',
            ENABLE_FEATURE_X: 'false',
            ALLOWED_ORIGINS: '["*"]',
            CONFIG: '{"enabled":true}',
            START_DATE: '2025-01-01'
        };

        const { errors, warnings } = validateEnvFile(env, schema);

        expect(errors).toEqual([]);
        expect(warnings).toEqual([]);
    });

    test('Should return errors for missing required keys', () => {
        const env = {
            DEBUG_MODE: 'true',
            SMTP_PORT: '587'
        };

        const { errors, warnings } = validateEnvFile(env, schema);

        expect(errors).toEqual(['API_KEY is missing']);
        expect(warnings).toEqual([]);
    });

    test('Should return warnings for type mismatches', () => {
        const env = {
            API_KEY: 'abc123',
            DEBUG_MODE: 'yes',
            SMTP_PORT: 'abc',
            ENABLE_FEATURE_X: 'not-a-boolean',
            ALLOWED_ORIGINS: '"not-an-array"',
            CONFIG: 'not-json',
            START_DATE: 'invalid-date'
        };

        const { errors, warnings } = validateEnvFile(env, schema);

        expect(errors).toEqual([]);
        expect(warnings).toEqual(expect.arrayContaining([
            'DEBUG_MODE type mismatch (expected boolean)',
            'SMTP_PORT type mismatch (expected number)',
            'ENABLE_FEATURE_X type mismatch (expected boolean)',
            'ALLOWED_ORIGINS type mismatch (expected array)',
            'CONFIG type mismatch (expected json)',
            'START_DATE type mismatch (expected date)'
        ]));
    });

    test('Should warn for unused keys not in schema', () => {
        const env = {
            API_KEY: 'abc123',
            DEBUG_MODE: 'true',
            SMTP_PORT: '587',
            EXTRA_KEY: 'oops'
        };

        const { errors, warnings } = validateEnvFile(env, schema);

        expect(errors).toEqual([]);
        expect(warnings).toContain('Unused keys: EXTRA_KEY');
    });

    test('Should allow optional keys to be missing', () => {
        const env = {
            API_KEY: 'abc123',
            DEBUG_MODE: 'true',
            SMTP_PORT: '587'
        };

        const { errors, warnings } = validateEnvFile(env, schema);

        expect(errors).toEqual([]);
        expect(warnings).toEqual([]);
    });
});
