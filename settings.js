"use strict";

const fs = require("node:fs/promises");
const path = require("path");
const YAML = require("yaml");

async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (_err) {
        return false;
    }
}

async function resolveConfigPath() {
    const candidates = [
        process.env.PINUP_BROWSER_CONFIG,
        path.resolve(process.cwd(), "config.yml"),
        path.resolve(__dirname, "config.yml"),
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }

    return undefined;
}

async function loadSettings() {
    const configPath = await resolveConfigPath();
    if (!configPath) {
        throw new Error("Unable to locate config.yml");
    }

    const fileContents = await fs.readFile(configPath, "utf8");
    const parsed = YAML.parse(fileContents);
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid YAML configuration in " + configPath);
    }

    return parsed;
}

module.exports = {
    resolveConfigPath,
    loadSettings,
};
