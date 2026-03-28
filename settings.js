"use strict";

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

function resolveConfigPath() {
    const candidates = [
        process.env.PINUP_BROWSER_CONFIG,
        path.resolve(process.cwd(), "config.yml"),
        path.resolve(__dirname, "config.yml"),
    ].filter(Boolean);

    return candidates.find((candidate) => fs.existsSync(candidate));
}

function loadSettings() {
    const configPath = resolveConfigPath();
    if (!configPath) {
        throw new Error("Unable to locate config.yml");
    }

    const fileContents = fs.readFileSync(configPath, "utf8");
    const parsed = YAML.parse(fileContents);
    if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid YAML configuration in " + configPath);
    }

    return parsed;
}

module.exports = loadSettings();
