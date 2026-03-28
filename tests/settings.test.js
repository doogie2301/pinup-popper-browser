"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

describe("settings loader", () => {
    const originalEnv = process.env.PINUP_BROWSER_CONFIG;
    const originalCwd = process.cwd();

    afterEach(() => {
        process.env.PINUP_BROWSER_CONFIG = originalEnv;
        process.chdir(originalCwd);
        jest.resetModules();
        jest.clearAllMocks();
    });

    test("loads YAML from PINUP_BROWSER_CONFIG path", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pinup-settings-"));
        const configPath = path.join(tempDir, "custom.yml");

        fs.writeFileSync(
            configPath,
            "httpServer:\n  port: 4321\nmedia:\n  useThumbs: true\n",
            "utf8"
        );

        process.env.PINUP_BROWSER_CONFIG = configPath;
        const { loadSettings } = require("../settings");
        const settings = await loadSettings();

        expect(settings.httpServer.port).toBe(4321);
        expect(settings.media.useThumbs).toBe(true);
    });

    test("loads YAML from cwd config.yml when env path is not set", async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pinup-cwd-"));
        process.chdir(tempDir);

        fs.writeFileSync(
            path.join(tempDir, "config.yml"),
            "pupServer:\n  url: http://example\nhttpServer:\n  port: 9999\n",
            "utf8"
        );

        delete process.env.PINUP_BROWSER_CONFIG;
        const { loadSettings } = require("../settings");
        const settings = await loadSettings();

        expect(settings.httpServer.port).toBe(9999);
        expect(settings.pupServer.url).toBe("http://example");
    });

    test("throws when no config.yml can be located", async () => {
        jest.doMock("node:fs/promises", () => ({
            access: jest.fn().mockRejectedValue(new Error("missing")),
            readFile: jest.fn(),
        }));

        const { loadSettings } = require("../settings");
        await expect(loadSettings()).rejects.toThrow("Unable to locate config.yml");
    });

    test("throws when YAML does not parse to an object", async () => {
        jest.doMock("node:fs/promises", () => ({
            access: jest.fn().mockResolvedValue(undefined),
            readFile: jest.fn().mockResolvedValue("- just\n- a\n- list\n"),
        }));

        jest.doMock("yaml", () => ({
            parse: jest.fn().mockReturnValue("not-an-object"),
        }));

        const { loadSettings } = require("../settings");
        await expect(loadSettings()).rejects.toThrow("Invalid YAML configuration");
    });
});
