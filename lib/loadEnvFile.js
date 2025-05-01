const fs = require('fs');
const dotenv = require('dotenv');
const { expand } = require('dotenv-expand');

const loadEnvFile = (path) => {
    const content = fs.readFileSync(path, 'utf-8');
    const config = dotenv.parse(content);

    expand(config ?? {});

    return config;
};

module.exports = loadEnvFile;
