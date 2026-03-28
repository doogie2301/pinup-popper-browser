"use strict";

const express = require("express");
const request = require("supertest");

function createTestApp(router, locals) {
    const app = express();
    app.locals.games = locals.games;
    app.locals.globalSettings = locals.globalSettings;

    app.use((req, res, next) => {
        res.render = (view, options) => {
            res.json({ view, options });
        };
        next();
    });

    app.use("/", router);
    return app;
}

describe("routes/index", () => {
    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    test("GET / renders index with sorted distinct filter values", async () => {
        jest.doMock("../settings", () => ({
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
            },
            media: {
                useThumbs: true,
            },
        }));

        const router = require("../routes/index");

        const app = createTestApp(router, {
            games: [
                {
                    category: "A",
                    theme: "Space",
                    type: "SS",
                    decade: 1990,
                    manufacturer: "Bally",
                    emulator: { name: "VPX" },
                },
                {
                    category: "B",
                    theme: "Horror",
                    type: "EM",
                    decade: 1980,
                    manufacturer: "Williams",
                    emulator: { name: "FX3" },
                },
                {
                    category: "A",
                    theme: "Space",
                    type: "SS",
                    decade: 1990,
                    manufacturer: "Bally",
                    emulator: { name: "VPX" },
                },
            ],
            globalSettings: {
                thumbRotation: 270,
            },
        });

        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("index");
        expect(response.body.options.categories).toEqual(["A", "B"]);
        expect(response.body.options.themes).toEqual(["Horror", "Space"]);
        expect(response.body.options.types).toEqual(["EM", "SS"]);
        expect(response.body.options.decades).toEqual([1980, 1990]);
        expect(response.body.options.manufacturers).toEqual(["Bally", "Williams"]);
        expect(response.body.options.emulators).toEqual(["FX3", "VPX"]);
        expect(response.body.options.favorites).toBe(true);
        expect(response.body.options.wheelRotation).toBe(270);
    });

    test("GET / disables filters and wheel rotation when thumbs are disabled", async () => {
        jest.doMock("../settings", () => ({
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
            },
            media: {
                useThumbs: false,
            },
        }));

        const router = require("../routes/index");
        const app = createTestApp(router, {
            games: [],
            globalSettings: {
                thumbRotation: 90,
            },
        });

        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.body.view).toBe("index");
        expect(response.body.options.wheelRotation).toBe(0);
        expect(response.body.options.favorites).toBe(false);
        expect(response.body.options.categories).toBeUndefined();
        expect(response.body.options.themes).toBeUndefined();
        expect(response.body.options.types).toBeUndefined();
        expect(response.body.options.decades).toBeUndefined();
        expect(response.body.options.manufacturers).toBeUndefined();
        expect(response.body.options.emulators).toBeUndefined();
    });
});
