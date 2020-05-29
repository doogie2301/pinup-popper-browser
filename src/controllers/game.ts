import express from "express";
import config from "config";
import axios from "axios";
import glob from "glob";
import path from "path";
import debug from "debug";
import Game from "../Game";

var router = express.Router();

var getCurItemUrl = config.get("pupServer.url") + "/function/getcuritem";
var launchUrl = config.get("pupServer.url") + "/function/launchgame/";
var exitUrl = config.get("pupServer.url") + "/pupkey/15";

router.get("/:gameId/info", function (req, res) {
  getMediaFilenames(req, res, "GameInfo", ["png", "jpg"]);
});

router.get("/:gameId/help", function (req, res) {
  getMediaFilenames(req, res, "GameHelp", ["png", "jpg"]);
});

router.get("/:gameId/playfield", function (req, res) {
  getMediaFilenames(req, res, "Playfield", ["png", "jpg", "mp4"]);
});

router.get("/:gameId/launch", function (req, res) {
  let gameId = req.params["gameId"];
  axios
    .get(launchUrl + gameId)
    .then((response) => {
      if (response.status != 200) {
        res.status(500);
        res.send("ERROR");
      } else {
        res.send("OK");
      }
    })
    .catch(() => {
      res.status(500);
      res.send("ERROR");
    });
});

router.get("/exit", function (_req, res) {
  axios
    .get(exitUrl)
    .then((response) => {
      if (response.status != 200) {
        res.status(500);
        res.send("ERROR");
      } else {
        res.send("OK");
      }
    })
    .catch(() => {
      res.status(500);
      res.send("ERROR");
    });
});

router.get("/:gameId", function (req, res) {
  let gameId = req.params["gameId"];

  if (gameId == "last") {
    let game = getLastPlayed(req);
    if (game) {
      renderGame(req, res, game.id);
    } else {
      renderGameError(req, res, "Unable to determine last played game");
    }
  } else if (gameId == "current") {
    axios
      .get(getCurItemUrl)
      .then((response) => {
        if (response.status != 200) {
          renderGameError(req, res, "Unable to determine current game");
        } else {
          gameId = response.data.GameID;
          renderGame(req, res, parseInt(gameId));
        }
      })
      .catch(() => {
        renderGameError(req, res, "Unable to determine current game");
      });
  } else {
    renderGame(req, res, parseInt(gameId));
  }
});

function getLastPlayed(req: express.Request) {
  let sql =
    "SELECT g.GameID, LastPlayed, NumberPlays, TimePlayedSecs " +
    "FROM Games g JOIN GamesStats s on g.GameID = s.GameID " +
    "ORDER BY LastPlayed DESC LIMIT 1";

  const db = require("better-sqlite3")(config.get("pupServer.db.path"), {
    fileMustExist: true,
    verbose: debug("app:sql"),
  });
  const row = db.prepare(sql).get();
  db.close();

  if (row) {
    let game = getGame(row.GameID, req);
    if (game) {
      // update with latest stats
      game.lastPlayed = row.LastPlayed;
      game.numPlays = row.NumberPlays;
      game.timePlayed = row.TimePlayedSecs;
    }
    return game;
  }
  return;
}

function getAbsoluteMediaPath(game: Game) {
  return game.emulator.dirMedia;
}

function getRelativeMediaPath(game: Game) {
  return "/media_" + game.emulator.id;
}

function getGame(gameId: number, req: express.Request) {
  let gamePos = req.app.locals.gameIds.get(gameId);
  return gamePos === undefined ? gamePos : req.app.locals.games[gamePos];
}

function renderGameError(
  _req: express.Request,
  res: express.Response,
  msg: string
) {
  res.render("game_error", {
    message: msg,
  });
}

function renderGame(
  req: express.Request,
  res: express.Response,
  gameId: number
) {
  let game = getGame(gameId, req);
  if (game) {
    res.render("game", {
      game: game,
      info: config.get("options.game.info"),
      help: config.get("options.game.help"),
      playfield: config.get("options.game.playfield"),
      wheelRotation: config.get("media.useThumbs")
        ? req.app.locals.globalSettings.thumbRotation
        : 0,
      playfieldRotation: config.get("media.playfieldRotation"),
      refreshInterval: req.app.locals.globalSettings.currentGameRefreshTimer,
    });
  } else {
    renderGameError(req, res, "Game not found");
  }
}

function getMediaFilenames(
  req: express.Request,
  res: express.Response,
  mediaDir: string,
  extensions: string[]
) {
  let game = getGame(parseInt(req.params["gameId"]), req);
  let dir = "/" + mediaDir + "/";
  let ext = "*.{" + extensions.join(",") + "}";
  glob(getAbsoluteMediaPath(game) + dir + game.name + ext, function (
    _err,
    files
  ) {
    let result = [];
    for (let file of files) {
      result.push(getRelativeMediaPath(game) + dir + path.basename(file));
    }
    res.send(result);
  });
}

module.exports = router;
