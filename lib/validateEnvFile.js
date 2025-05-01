const { isValid, parseISO } = require('date-fns');

const checkTypes = (value, type) => {
    if (value == null) return false;

    let parsedValue = value;
    const val = String(value)?.toLowerCase?.();

    const tryParseJSON = (expectedTypeCheck) => {
        try {
            parsedValue = JSON.parse(value);

            return expectedTypeCheck?.(parsedValue);
        } catch {
            return false;
        }
    };

    const checks = {
        string: () => typeof parsedValue === 'string',
        number: () => !isNaN(Number(parsedValue)),
        boolean: () => ['true', 'false'].includes(val),
        array: () => tryParseJSON(Array.isArray),
        json: () => tryParseJSON(val1 => typeof val1 === 'object' && val1 !== null && !Array.isArray(val1)),
        date: () => isValid?.(parseISO?.(value))
    };

    return checks?.[type]?.() ?? true;
};

const validateEnvFile = (env, schema) => {
    const errors = [];
    const warnings = [];

    const requiredKeys = schema?.REQUIRED_KEYS ?? {};
    const optionalKeys = schema?.OPTIONAL_KEYS ?? {};

    for (const key in requiredKeys) {
        if (!env?.[key]) {
            errors.push(`${key} is missing`);
        } else if (!checkTypes?.(env?.[key], requiredKeys?.[key])) {
            warnings.push(`${key} type mismatch (expected ${requiredKeys?.[key]})`);
        }
    }

    for (const key in optionalKeys) {
        if (env?.[key] && !checkTypes?.(env?.[key], optionalKeys?.[key])) {
            warnings.push(`${key} type mismatch (expected ${optionalKeys?.[key]})`);
        }
    }

    const unusedKeys = Object.keys(env || {}).filter(
        k => !requiredKeys?.[k] && !optionalKeys?.[k]
    );

    if (unusedKeys.length) {
        warnings.push(`Unused keys: ${unusedKeys.join(', ')}`);
    }

    return { errors, warnings };
};

module.exports = validateEnvFile;
