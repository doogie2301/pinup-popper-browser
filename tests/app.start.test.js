"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

describe("app startup", () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    });

    test("start initializes app locals from database and config", async () => {
        const dbPath = path.join(
            fs.mkdtempSync(path.join(os.tmpdir(), "pinup-db-")),
            "PUPDatabase.db"
        );
        fs.writeFileSync(dbPath, Buffer.from([0, 1, 2, 3]));

        const exec = jest.fn((sql) => {
            if (sql.includes("FROM GlobalSettings")) {
                return [
                    {
                        columns: [
                            "defaultMediaDir",
                            "thumbRotation",
                            "currentGameRefreshInterval",
                        ],
                        values: [["C:/MediaDefault", 270, 42]],
                    },
                ];
            }

            if (sql.includes("FROM Emulators WHERE Visible")) {
                return [
                    {
                        columns: ["id", "name", "dirMedia"],
                        values: [[1, "VPX", "C:/MediaVPX"]],
                    },
                ];
            }

            if (sql.includes("from games g join emulators e")) {
                expect(sql).toContain("and g.EMUID = 1");
                return [
                    {
                        columns: [
                            "gameId",
                            "emuId",
                            "gameName",
                            "gameDisplay",
                            "gameType",
                            "gameYear",
                            "numPlayers",
                            "manufacturer",
                            "lastPlayed",
                            "numberPlays",
                            "timePlayedSecs",
                            "category",
                            "gameTheme",
                            "isFav",
                        ],
                        values: [
                            [10, 1, "AFM", "Attack From Mars", "SS", "1995", 4, "Bally", "2026-01-01", 5, 123, "Classic", "Sci-Fi", 1],
                            [20, 99, "SkipMe", "Skip Me", "SS", "1990", 4, "Maker", null, 0, 0, "Other", "Theme", 0],
                        ],
                    },
                ];
            }

            return [];
        });

        jest.doMock("../settings", () => ({
            loadSettings: jest.fn(async () => ({
                httpServer: { logFormat: "dev", logLevel: "error", port: 3030 },
                pupServer: { db: { path: dbPath, filter: "EMUID = 1" } },
                media: { useThumbs: true, cacheInMinutes: 5, playfieldRotation: true },
                options: {
                    filters: {
                        category: true,
                        theme: true,
                        type: true,
                        decade: true,
                        emulator: true,
                        manufacturer: true,
                        favorites: true,
                    },
                    game: { info: true, help: true, playfield: true },
                },
            })),
        }));

        const dbClose = jest.fn();
        jest.doMock("sql.js", () =>
            jest.fn(async () => ({
                Database: jest.fn(() => ({
                    exec,
                    close: dbClose,
                })),
            }))
        );

        const { app, start } = require("../app");

        const signalHandlers = {};
        jest
            .spyOn(process, "on")
            .mockImplementation((event, handler) => {
                signalHandlers[event] = handler;
                return process;
            });
        const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { });
        jest.spyOn(console, "log").mockImplementation(() => { });
        const serverClose = jest.fn((done) => done && done());
        jest.spyOn(app, "listen").mockImplementation((_port, callback) => {
            if (callback) {
                callback();
            }
            return {
                close: serverClose,
            };
        });

        await start();

        expect(app.get("port")).toBe(3030);
        expect(app.locals.games).toHaveLength(1);
        expect(app.locals.games[0].name).toBe("AFM");
        expect(app.locals.games[0].decade).toBe(1990);
        expect(app.locals.gameIds.get(10)).toBe(0);
        expect(app.locals.globalSettings.defaultMediaDir).toBe("C:/MediaDefault");
        expect(app.locals.globalSettings.currentGameRefreshTimer).toBe(42000);
        expect(app.locals.getMediaPath(app.locals.games[0])).toBe("/media/1");
        expect(app.locals.getWheelSrc(app.locals.games[0])).toBe(
            "/media/1/Wheel/pthumbs/AFM_thumb.png"
        );
        expect(exec).toHaveBeenCalled();

        signalHandlers.SIGTERM();
        expect(dbClose).toHaveBeenCalled();
        expect(serverClose).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    test("start logs when GlobalSettings is missing", async () => {
        const dbPath = path.join(
            fs.mkdtempSync(path.join(os.tmpdir(), "pinup-db-empty-")),
            "PUPDatabase.db"
        );
        fs.writeFileSync(dbPath, Buffer.from([0]));

        const exec = jest.fn((sql) => {
            if (sql.includes("FROM GlobalSettings")) {
                return [];
            }
            if (sql.includes("FROM Emulators WHERE Visible")) {
                return [];
            }
            if (sql.includes("from games g join emulators e")) {
                return [];
            }
            return [];
        });

        jest.doMock("../settings", () => ({
            loadSettings: jest.fn(async () => ({
                httpServer: { logFormat: "dev", logLevel: "info", port: 4040 },
                pupServer: { db: { path: dbPath, filter: "" } },
                media: { useThumbs: false, cacheInMinutes: 1, playfieldRotation: false },
                options: {
                    filters: {
                        category: false,
                        theme: false,
                        type: false,
                        decade: false,
                        emulator: false,
                        manufacturer: false,
                        favorites: false,
                    },
                    game: { info: false, help: false, playfield: false },
                },
            })),
        }));

        const dbClose = jest.fn(() => {
            throw new Error("close failed");
        });
        jest.doMock("sql.js", () =>
            jest.fn(async () => ({
                Database: jest.fn(() => ({
                    exec,
                    close: dbClose,
                })),
            }))
        );

        const { app, start } = require("../app");

        const signalHandlers = {};
        jest
            .spyOn(process, "on")
            .mockImplementation((event, handler) => {
                signalHandlers[event] = handler;
                return process;
            });
        const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { });
        jest.spyOn(console, "log").mockImplementation(() => { });
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        const serverClose = jest.fn((done) => done && done());
        jest.spyOn(app, "listen").mockImplementation((_port, callback) => {
            if (callback) {
                callback();
            }
            return {
                close: serverClose,
            };
        });

        await start();

        expect(errorSpy).toHaveBeenCalledWith("GlobalSettings not found");
        expect(app.locals.games).toEqual([]);
        expect(app.locals.globalSettings).toEqual({});

        signalHandlers.SIGINT();
        expect(dbClose).toHaveBeenCalled();
        expect(serverClose).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(0);
    });
});
