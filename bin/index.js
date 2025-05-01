#!/usr/bin/env node

/**
 *  env-verifier-cli - 🛡️ A command-line tool to validate .env files against a defined schema to ensure correct environment variable configurations.
 *  @version: v1.0.4
 *  @link: https://github.com/tutyamxx/env-verifier-cli
 *  @license: MIT
 **/

/* eslint-disable no-console */
/* eslint-disable no-undef */

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const loadEnvFile = require('../lib/loadEnvFile');
const validateEnvFile = require('../lib/validateEnvFile');

const program = new Command();

program.version('1.0.0')
    .description('Validate your .env file against a schema')
    .option('--env <path>', 'Path to .env file (default: .env)', '.env')
    .option('--schema <path>', 'Path to schema file (default: ./env.schema.json)', './env.schema.json')
    .parse(process.argv);

const options = program.opts();

const envFilePath = path.resolve(process.cwd(), options.env);
const schemaFilePath = path.resolve(process.cwd(), options.schema);

if (!fs.existsSync(envFilePath)) {
    console.error(chalk.red(`❌ .env file not found at ${envFilePath}`));
    process.exit(1);
}

if (!fs.existsSync(schemaFilePath)) {
    console.error(chalk.red(`❌ Schema file not found at ${schemaFilePath}`));
    process.exit(1);
}

console.log(chalk.blue('⚙️ Validating .env file...'));

const envConfig = loadEnvFile(envFilePath);

const { errors = [], warnings = [] } = validateEnvFile(envConfig, JSON.parse(fs.readFileSync(schemaFilePath, 'utf-8'))) ?? {};

if (errors.length) {
    console.log(chalk.red('\n🚨 Missing or invalid keys:'));
    errors.forEach(error => console.log(`  ❌ ${error}`));
}

if (warnings.length) {
    console.log(chalk.yellow('\n⚠️ Warnings:'));
    warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
} else {
    const envFileName = path.basename(envFilePath);

    console.log(chalk.green(`\n✅ ${envFileName} file passed validation.`));
}
