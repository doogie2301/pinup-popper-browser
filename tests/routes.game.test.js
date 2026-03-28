"use strict";

const express = require("express");
const request = require("supertest");

function createGameApp(router, locals) {
    const app = express();

    app.locals.games = locals.games;
    app.locals.gameIds = locals.gameIds;
    app.locals.globalSettings = locals.globalSettings;
    app.locals.queryRow = locals.queryRow;
    app.locals.getMediaPath = locals.getMediaPath;

    app.use((req, res, next) => {
        res.render = (view, options) => {
            res.json({ view, options });
        };
        next();
    });

    app.use("/games", router);
    return app;
}

function baseLocals() {
    const game = {
        id: 1,
        name: "Attack From Mars",
        display: "Attack From Mars",
        emulator: {
            id: 7,
            name: "Visual Pinball",
            dirMedia: "C:\\Media",
        },
        lastPlayed: null,
        numPlays: 0,
        timePlayed: 0,
    };

    return {
        games: [game],
        gameIds: new Map([[1, 0]]),
        globalSettings: {
            thumbRotation: 180,
            currentGameRefreshTimer: 45000,
        },
        queryRow: jest.fn(),
        getMediaPath: (inputGame) => `/media/${inputGame.emulator.id}`,
    };
}

describe("routes/game", () => {
    let globSync;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        globSync = jest.fn();
        jest.doMock("fast-glob", () => ({
            sync: globSync,
            escapePath: (value) => value,
        }));
    });

    afterEach(() => {
        delete global.fetch;
    });

    test("GET /games/:id renders game details", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const response = await request(app).get("/games/1");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("game");
        expect(response.body.options.game.id).toBe(1);
        expect(response.body.options.wheelRotation).toBe(180);
        expect(response.body.options.playfieldRotation).toBe(true);
        expect(response.body.options.refreshInterval).toBe(45000);
    });

    test("GET /games/:id renders game error for unknown id", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const response = await request(app).get("/games/999");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("game_error");
        expect(response.body.options.message).toBe("Game not found");
    });

    test("GET /games/last renders last played game and updates stats", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: false, playfieldRotation: false },
        }));

        const locals = baseLocals();
        locals.queryRow.mockReturnValue({
            GameID: 1,
            LastPlayed: "2026-03-01",
            NumberPlays: 22,
            TimePlayedSecs: 999,
        });

        const router = require("../routes/game");
        const app = createGameApp(router, locals);

        const response = await request(app).get("/games/last");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("game");
        expect(response.body.options.game.lastPlayed).toBe("2026-03-01");
        expect(response.body.options.game.numPlays).toBe(22);
        expect(response.body.options.game.timePlayed).toBe(999);
        expect(response.body.options.wheelRotation).toBe(0);
    });

    test("GET /games/last renders error when no stats row is found", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        const locals = baseLocals();
        locals.queryRow.mockReturnValue(undefined);

        const router = require("../routes/game");
        const app = createGameApp(router, locals);

        const response = await request(app).get("/games/last");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("game_error");
        expect(response.body.options.message).toBe(
            "Unable to determine last played game"
        );
    });

    test("GET /games/current resolves current game from remote endpoint", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        global.fetch = jest.fn().mockResolvedValue({
            status: 200,
            json: async () => ({ GameID: 1 }),
        });

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const response = await request(app).get("/games/current");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("game");
        expect(global.fetch).toHaveBeenCalledWith(
            "http://localhost/function/getcuritem"
        );
    });

    test("GET /games/current renders error when remote lookup fails", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        global.fetch = jest.fn().mockResolvedValue({
            status: 503,
            json: async () => ({ GameID: 1 }),
        });

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const response = await request(app).get("/games/current");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("game_error");
        expect(response.body.options.message).toBe("Unable to determine current game");
    });

    test("GET /games/:id/launch returns OK when remote launch succeeds", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        global.fetch = jest.fn().mockResolvedValue({ status: 200 });

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const response = await request(app).get("/games/1/launch");

        expect(response.status).toBe(200);
        expect(response.text).toBe("OK");
        expect(global.fetch).toHaveBeenCalledWith(
            "http://localhost/function/launchgame/1"
        );
    });

    test("GET /games/:id/launch returns ERROR when remote launch fails", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        global.fetch = jest.fn().mockRejectedValue(new Error("network"));

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const response = await request(app).get("/games/1/launch");

        expect(response.status).toBe(500);
        expect(response.text).toBe("ERROR");
    });

    test("GET /games/exit returns OK and ERROR for success/failure", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 500 });

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const okResponse = await request(app).get("/games/exit");
        const errorResponse = await request(app).get("/games/exit");

        expect(okResponse.status).toBe(200);
        expect(okResponse.text).toBe("OK");
        expect(errorResponse.status).toBe(500);
        expect(errorResponse.text).toBe("ERROR");
        expect(global.fetch).toHaveBeenNthCalledWith(
            1,
            "http://localhost/pupkey/15"
        );
    });

    test("GET /games/:id/info and playfield return matching media URLs", async () => {
        jest.doMock("../settings", () => ({
            pupServer: { url: "http://localhost" },
            options: { game: { info: true, help: true, playfield: true } },
            media: { useThumbs: true, playfieldRotation: true },
        }));

        globSync
            .mockReturnValueOnce(["Attack From Mars one.png", "Attack From Mars 2.jpg"])
            .mockReturnValueOnce(["Attack From Mars trailer.mp4"]);

        const router = require("../routes/game");
        const app = createGameApp(router, baseLocals());

        const infoResponse = await request(app).get("/games/1/info");
        const playfieldResponse = await request(app).get("/games/1/playfield");

        expect(infoResponse.status).toBe(200);
        expect(infoResponse.body).toEqual([
            "/media/7/GameInfo/Attack From Mars one.png",
            "/media/7/GameInfo/Attack From Mars 2.jpg",
        ]);

        expect(playfieldResponse.status).toBe(200);
        expect(playfieldResponse.body).toEqual([
            "/media/7/Playfield/Attack From Mars trailer.mp4",
        ]);

        expect(globSync).toHaveBeenCalledTimes(2);
    });
});
