var express = require("express");
var settings = require("config-yml");
var router = express.Router();
const axios = require("axios");
var glob = require("glob");
const path = require("path");
var debug = require("debug");

var getCurItemUrl = settings.pupServer.url + "/function/getcuritem";
var launchUrl = settings.pupServer.url + "/function/launchgame/";
var exitUrl = settings.pupServer.url + "/pupkey/15";

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
          renderGame(req, res, gameId);
        }
      })
      .catch(() => {
        renderGameError(req, res, "Unable to determine current game");
      });
  } else {
    renderGame(req, res, gameId);
  }
});

function getLastPlayed(req) {
  let sql =
    "SELECT g.GameID, LastPlayed, NumberPlays, TimePlayedSecs " +
    "FROM Games g JOIN GamesStats s on g.GameID = s.GameID " +
    "ORDER BY LastPlayed DESC LIMIT 1";

  const db = require("better-sqlite3")(settings.pupServer.db.path, {
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

function getAbsoluteMediaPath(game) {
  return game.emulator.dirMedia;
}

function getRelativeMediaPath(game) {
  return "/media_" + game.emulator.id;
}

function getGame(gameId, req) {
  let gamePos = req.app.locals.gameIds.get(parseInt(gameId));
  return gamePos === undefined ? gamePos : req.app.locals.games[gamePos];
}

function renderGameError(_req, res, msg) {
  res.render("game_error", {
    message: msg,
  });
}

function renderGame(req, res, gameId) {
  let game = getGame(gameId, req);
  if (game) {
    res.render("game", {
      game: game,
      info: settings.options.game.info,
      help: settings.options.game.help,
      playfield: settings.options.game.playfield,
      wheelRotation: settings.media.useThumbs
        ? req.app.locals.globalSettings.thumbRotation
        : 0,
      playfieldRotation: settings.media.playfieldRotation,
      refreshInterval: req.app.locals.globalSettings.currentGameRefreshTimer,
    });
  } else {
    renderGameError(req, res, "Game not found");
  }
}

function getMediaFilenames(req, res, mediaDir, extensions) {
  let game = getGame(req.params["gameId"], req);
  let dir = "/" + mediaDir + "/";
  let ext = "*.{" + extensions.join(",") + "}";
  glob(getAbsoluteMediaPath(game) + dir + game.name + ext, function (
    _err,
    files
  ) {
    let result = [];
    for (file of files) {
      result.push(getRelativeMediaPath(game) + dir + path.basename(file));
    }
    res.send(result);
  });
}

module.exports = router;
