"use strict";

const {
    mapResult,
    queryRows,
    queryRow,
    normalizeDbFilter,
} = require("../app");

describe("app helpers", () => {
    test("mapResult returns empty array for invalid result", () => {
        expect(mapResult()).toEqual([]);
        expect(mapResult({ columns: null, values: [] })).toEqual([]);
    });

    test("mapResult maps SQL.js shape into row objects", () => {
        const result = {
            columns: ["GameID", "GameDisplay"],
            values: [[1, "Attack From Mars"], [2, "The Addams Family"]],
        };

        expect(mapResult(result)).toEqual([
            { GameID: 1, GameDisplay: "Attack From Mars" },
            { GameID: 2, GameDisplay: "The Addams Family" },
        ]);
    });

    test("queryRows maps first result set and handles no rows", () => {
        const db = {
            exec: jest
                .fn()
                .mockReturnValueOnce([])
                .mockReturnValueOnce([
                    { columns: ["id", "name"], values: [[1, "a"], [2, "b"]] },
                ]),
        };

        expect(queryRows(db, "SELECT 1")).toEqual([]);
        expect(queryRows(db, "SELECT *")).toEqual([
            { id: 1, name: "a" },
            { id: 2, name: "b" },
        ]);
    });

    test("queryRow returns first row or undefined", () => {
        const db = {
            exec: jest
                .fn()
                .mockReturnValueOnce([{ columns: ["id"], values: [[5], [6]] }])
                .mockReturnValueOnce([]),
        };

        expect(queryRow(db, "SELECT")).toEqual({ id: 5 });
        expect(queryRow(db, "SELECT")).toBeUndefined();
    });

    test("normalizeDbFilter qualifies identifiers", () => {
        expect(normalizeDbFilter("EMUID = 1 and Visible = 1")).toBe(
            "g.EMUID = 1 and g.Visible = 1"
        );

        expect(normalizeDbFilter("g.EMUID = 1 AND GAMEID > 10")).toBe(
            "g.EMUID = 1 AND g.GameID > 10"
        );

        expect(normalizeDbFilter(" e.visible and g.GameID = 1 ")).toBe(
            "e.visible and g.GameID = 1"
        );

        expect(normalizeDbFilter("")).toBe("");
        expect(normalizeDbFilter(null)).toBe("");
    });
});
