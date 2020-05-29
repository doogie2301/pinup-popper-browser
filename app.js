"use strict";
var debug = require("debug");
var express = require("express");
var favicon = require("serve-favicon");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var settings = require("config-yml");
var routeIndex = require("./routes/index");
var routeGame = require("./routes/game");

var app = express();

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

// open the database
const db = require("better-sqlite3")(settings.pupServer.db.path, {
  fileMustExist: true,
  verbose: debug("app:sql"),
});

// get global settings
const globalRow = db
  .prepare(
    "SELECT GlobalMediaDir, ThumbRotate, AttractModeinterval FROM GlobalSettings"
  )
  .get();
if (globalRow) {
  globalSettings.defaultMediaDir = globalRow.GlobalMediaDir;
  globalSettings.thumbRotation = globalRow.ThumbRotate;
  globalSettings.currentGameRefreshTimer =
    (globalRow.AttractModeinterval || 0) * 1000;
} else {
  console.error("GlobalSettings not found");
}

// get emulators
const emuRows = db
  .prepare("SELECT EMUID, EmuDisplay, DirMedia FROM Emulators WHERE Visible")
  .all();
emuRows.forEach((row) => {
  emulators.set(row.EMUID, {
    id: row.EMUID,
    name: row.EmuDisplay,
    dirMedia: row.DirMedia || globalSettings.defaultMediaDir,
  });
});

let sql =
  "select g.gameid, g.emuID, gamename, gamedisplay, gametype, gameyear, numplayers, manufact, LastPlayed, NumberPlays, TimePlayedSecs, " +
  "category, gametheme, isFav " +
  "from games g join emulators e on g.emuid = e.emuid " +
  "left join (SELECT GameID, 1 as isFav FROM Playlistdetails WHERE isFav > 0 GROUP BY GameID) f on g.gameid = f.gameid " +
  "left join gamesstats s on g.gameid = s.gameid " +
  "where g.visible and e.visible " +
  (settings.pupServer.db.filter ? " and " + settings.pupServer.db.filter : "") +
  "order by gamedisplay";

const rows = db.prepare(sql).all();
var i = 0;
rows.forEach((row) => {
  games.push({
    id: row.GameID,
    name: row.GameName,
    display: row.GameDisplay,
    type: row.GameType,
    category: row.Category,
    theme: row.GameTheme,
    year: row.GameYear,
    numPlayers: row.NumPlayers,
    manufacturer: row.Manufact,
    emulator: emulators.get(row.EMUID),
    lastPlayed: row.LastPlayed,
    numPlays: row.NumberPlays || 0,
    timePlayed: row.TimePlayedSecs || 0,
    decade: row.GameYear
      ? parseInt(row.GameYear) - (parseInt(row.GameYear) % 10)
      : "",
    favorite: row.isFav,
  });
  gameIds.set(row.GameID, i);
  i++;
});

// close the database connection
db.close();

app.locals.games = games;
app.locals.gameIds = gameIds;
app.locals.globalSettings = globalSettings;

app.locals.getWheelSrc = function (game) {
  let name = game.name;
  if (settings.media.useThumbs) {
    name = "pthumbs/" + name + "_thumb";
  }
  return "/media_" + game.emulator.id + "/Wheel/" + name + ".png";
};

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let cacheOptions = {
  maxAge: settings.media.cacheInMinutes * 60000,
  immutable: true,
};
app.use(express.static(path.join(__dirname, "public"), cacheOptions));

emulators.forEach(function (value, key) {
  let dir = "/media_" + value.id;
  let path = value.dirMedia;
  app.use(dir, express.static(path, cacheOptions));
  debug("app:media")(
    "Set media path '%s' to '%s' for emulator '%s'",
    dir,
    path,
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

// error handlers

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
