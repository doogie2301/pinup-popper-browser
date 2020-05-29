import express, { NextFunction } from "express";
import debug from "debug";
import favicon from "serve-favicon";
import path from "path";
import logger from "morgan";
import bodyParser from "body-parser";
import config from "config";
import sqlite from "better-sqlite3";
var routeIndex = require("./routes/index");
var routeGame = require("./routes/game");

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as gameController from "./controllers/game";
import HttpException from "./HttpException";
import Game from "./Game";
import Emulator from "./Emulator";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || config.get("httpServer.port") || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(favicon(__dirname + "public/favicon.ico"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const httpLogger = debug("app:http");
app.use(
  logger(config.get("httpServer.logFormat"), {
    stream: {
      write: (msg) => {
        httpLogger(msg.trimRight());
      },
    },
    skip: (req, res) => {
      return config.get(".httpServer.logLevel") == "error"
        ? res.statusCode < 400
        : false;
    },
  })
);

app.disable("x-powered-by");

var games: Game[] = [];
var gameIds = new Map();
var globalSettings = new Map();
var emulators: { [key: number]: Emulator } = {};

// open the database
const db = sqlite(config.get("pupServer.db.path"), {
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
  globalSettings.set("defaultMediaDir", globalRow.GlobalMediaDir);
  globalSettings.set("thumbRotation", globalRow.ThumbRotate);
  globalSettings.set(
    "currentGameRefreshTimer",
    (globalRow.AttractModeinterval || 0) * 1000
  );
} else {
  console.error("GlobalSettings not found");
}

// get emulators
const emuRows = db
  .prepare("SELECT EMUID, EmuDisplay, DirMedia FROM Emulators WHERE Visible")
  .all();
emuRows.forEach((row) => {
  emulators[row.EMUID] = new Emulator(
    row.EMUID,
    row.EmuDisplay,
    row.DirMedia || globalSettings.get("defaultMediaDir")
  );
});

let sql =
  "select g.gameid, g.emuID, gamename, gamedisplay, gametype, gameyear, numplayers, manufact, LastPlayed, NumberPlays, TimePlayedSecs, " +
  "category, gametheme, isFav " +
  "from games g join emulators e on g.emuid = e.emuid " +
  "left join (SELECT GameID, 1 as isFav FROM Playlistdetails WHERE isFav > 0 GROUP BY GameID) f on g.gameid = f.gameid " +
  "left join gamesstats s on g.gameid = s.gameid " +
  "where g.visible and e.visible " +
  (config.get(".pupServer.db.filter")
    ? " and " + config.get("pupServer.db.filter")
    : "") +
  "order by gamedisplay";

const rows = db.prepare(sql).all();
var i = 0;
rows.forEach((row) => {
  games.push(
    new Game(
      row.GameID,
      row.GameName,
      row.GameDisplay,
      row.GameType,
      row.Category,
      row.GameTheme,
      row.GameYear,
      row.NumPlayers,
      row.Manufact,
      emulators[row.EMUID],
      row.LastPlayed,
      row.NumberPlays || 0,
      row.TimePlayedSecs || 0,
      row.GameYear
        ? (parseInt(row.GameYear) - (parseInt(row.GameYear) % 10)).toString()
        : "",
      row.isFav
    )
  );
  gameIds.set(row.GameID, i);
  i++;
});

// close the database connection
db.close();

app.locals.games = games;
app.locals.gameIds = gameIds;
app.locals.globalSettings = globalSettings;

app.locals.getWheelSrc = function (game: Game) {
  let name = game.name;
  if (config.get("media.useThumbs")) {
    name = "pthumbs/" + name + "_thumb";
  }
  return "/media_" + game.emulator.id + "/Wheel/" + name + ".png";
};

let cacheOptions = {
  maxAge: parseInt(config.get("media.cacheInMinutes")) * 60000,
  immutable: true,
};
app.use(express.static(path.join(__dirname, "public"), cacheOptions));

for (let key in emulators) {
  let value = emulators[key];
  let dir = "/media_" + value.id;
  let path = value.dirMedia;
  app.use(dir, express.static(path, cacheOptions));
  debug("app:media")(
    "Set media path '%s' to '%s' for emulator '%s'",
    dir,
    path,
    value.name
  );
}

app.use("/games", routeGame);
app.use("/", routeIndex);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  //err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function (
    err: HttpException,
    req: express.Request,
    res: express.Response,
    next: NextFunction
  ) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err,
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (
  err: HttpException,
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {},
  });
});

// app.set("port", process.env.PORT || settings.httpServer.port);

// var server = app.listen(app.get("port"), function () {
//   console.log("Express server listening on port %i", server.address().port);
// });

export default app;
