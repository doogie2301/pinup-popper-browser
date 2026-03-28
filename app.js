"use strict";
var debug = require("debug");
var express = require("express");
var favicon = require("serve-favicon");
var path = require("path");
var fs = require("fs");
var logger = require("morgan");
var settings = require("./settings");
var initSqlJs = require("sql.js");
var routeIndex = require("./routes/index");
var routeGame = require("./routes/game");

var app = express();

function mapResult(result) {
  if (!result || !result.columns || !result.values) {
    return [];
  }
  return result.values.map((values) => {
    const row = {};
    result.columns.forEach((column, index) => {
      row[column] = values[index];
    });
    return row;
  });
}

function queryRows(db, sql) {
  const result = db.exec(sql);
  if (!result || result.length === 0) {
    return [];
  }
  return mapResult(result[0]);
}

function queryRow(db, sql) {
  const rows = queryRows(db, sql);
  return rows.length > 0 ? rows[0] : undefined;
}

function normalizeDbFilter(filter) {
  if (!filter || typeof filter !== "string") {
    return "";
  }

  // Auto-qualify ambiguous identifiers unless the config already prefixes them.
  const identifierMap = {
    EMUID: "g.EMUID",
    GAMEID: "g.GameID",
    VISIBLE: "g.Visible",
  };

  return filter
    .replace(/(^|[^.\w])(EMUID|GAMEID|VISIBLE)\b/gi, function (_, prefix, id) {
      const qualified = identifierMap[id.toUpperCase()];
      return prefix + (qualified || id);
    })
    .trim();
}

async function loadDatabase(filePath) {
  const SQL = await initSqlJs();
  const dbBytes = fs.readFileSync(filePath);
  return new SQL.Database(dbBytes);
}

async function start() {
  const httpLogger = debug("app:http");
  app.use(
    logger(settings.httpServer.logFormat, {
      stream: {
        write: (msg) => {
          httpLogger(msg.trimEnd());
        },
      },
      skip: (req, res) => {
        return settings.httpServer.logLevel == "error"
          ? res.statusCode < 400
          : false;
      },
    })
  );

  app.disable("x-powered-by");

  var games = [];
  var gameIds = new Map();
  var globalSettings = new Object();
  var emulators = new Map();

  const db = await loadDatabase(settings.pupServer.db.path);
  app.locals.queryRow = function (sql) {
    return queryRow(db, sql);
  };
  app.locals.queryRows = function (sql) {
    return queryRows(db, sql);
  };

  // get global settings
  const globalRow = queryRow(
    db,
    "SELECT GlobalMediaDir AS defaultMediaDir, ThumbRotate AS thumbRotation, AttractModeinterval AS currentGameRefreshInterval FROM GlobalSettings"
  );
  if (globalRow) {
    globalSettings.defaultMediaDir = globalRow.defaultMediaDir;
    globalSettings.thumbRotation = globalRow.thumbRotation;
    globalSettings.currentGameRefreshTimer =
      (globalRow.currentGameRefreshInterval || 0) * 1000;
  } else {
    console.error("GlobalSettings not found");
  }

  // get emulators
  const emuRows = queryRows(
    db,
    "SELECT EMUID AS id, EmuDisplay AS name, DirMedia AS dirMedia FROM Emulators WHERE Visible"
  );
  emuRows.forEach((row) => {
    emulators.set(row.id, {
      id: row.id,
      name: row.name,
      dirMedia: row.dirMedia || globalSettings.defaultMediaDir,
    });
  });

  const dbFilter = normalizeDbFilter(settings.pupServer.db.filter);

  let sql =
    "select g.GameID as gameId, g.EmuID as emuId, g.GameName as gameName, g.GameDisplay as gameDisplay, g.GameType as gameType, g.GameYear as gameYear, g.NumPlayers as numPlayers, g.Manufact as manufacturer, " +
    "s.LastPlayed as lastPlayed, s.NumberPlays as numberPlays, s.TimePlayedSecs as timePlayedSecs, g.Category as category, g.GameTheme as gameTheme, f.isFav as isFav " +
    "from games g join emulators e on g.emuid = e.emuid " +
    "left join (SELECT GameID, 1 as isFav FROM Playlistdetails WHERE isFav > 0 GROUP BY GameID) f on g.gameid = f.gameid " +
    "left join gamesstats s on g.gameid = s.gameid " +
    "where g.visible and e.visible " +
    (dbFilter ? " and " + dbFilter : "") +
    " order by g.GameDisplay";

  const rows = queryRows(db, sql);
  var i = 0;
  rows.forEach((row) => {
    const emulator = emulators.get(row.emuId);
    if (!emulator) {
      return;
    }
    games.push({
      id: row.gameId,
      name: row.gameName,
      display: row.gameDisplay,
      type: row.gameType,
      category: row.category,
      theme: row.gameTheme,
      year: row.gameYear,
      numPlayers: row.numPlayers,
      manufacturer: row.manufacturer,
      emulator: emulator,
      lastPlayed: row.lastPlayed,
      numPlays: row.numberPlays || 0,
      timePlayed: row.timePlayedSecs || 0,
      decade: row.gameYear
        ? parseInt(row.gameYear) - (parseInt(row.gameYear) % 10)
        : "",
      favorite: row.isFav,
    });
    gameIds.set(row.gameId, i);
    i++;
  });

  app.locals.games = games;
  app.locals.gameIds = gameIds;
  app.locals.globalSettings = globalSettings;

  app.locals.getWheelSrc = function (game) {
    let name = game.name;
    if (settings.media.useThumbs) {
      name = "pthumbs/" + name + "_thumb";
    }
    return app.locals.getMediaPath(game) + "/Wheel/" + name + ".png";
  };

  app.locals.getMediaPath = function (game) {
    return "/media/" + game.emulator.id;
  };

  // view engine setup
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");
  app.use(favicon(__dirname + "/public/favicon.ico"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  let cacheOptions = {
    maxAge: settings.media.cacheInMinutes * 60000,
    immutable: true,
  };
  app.use(express.static(path.join(__dirname, "public"), cacheOptions));

  emulators.forEach(function (value) {
    let dir = "/media/" + value.id;
    let staticPath = value.dirMedia;
    app.use(dir, express.static(staticPath, cacheOptions));
    debug("app:media")(
      "Set media path '%s' to '%s' for emulator '%s'",
      dir,
      staticPath,
      value.name
    );
  });

  app.use("/games", routeGame);
  app.use("/", routeIndex);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
  });

  // development error handler
  // will print stacktrace
  if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render("error", {
        message: err.message,
        error: err,
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: {},
    });
  });

  app.set("port", process.env.PORT || settings.httpServer.port);

  var server = app.listen(app.get("port"), function () {
    console.log(
      "  PinUpBrowser is running at http://localhost:%d",
      app.get("port")
    );
    console.log("  Press CTRL-C to stop\n");
  });

  const shutdown = function () {
    try {
      db.close();
    } catch (_err) {
      // ignore close errors during shutdown
    }
    server.close(function () {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (require.main === module) {
  start().catch(function (err) {
    console.error("Failed to start PinUpBrowser:", err.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  start,
  mapResult,
  queryRows,
  queryRow,
  normalizeDbFilter,
  loadDatabase,
};
