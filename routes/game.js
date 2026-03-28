var express = require("express");
var settings = require("../settings");
var router = express.Router();
var glob = require("fast-glob");
const path = require("path");
var debug = require("debug");

var getCurItemUrl = settings.pupServer.url + "/function/getcuritem";
var launchUrl = settings.pupServer.url + "/function/launchgame/";
var exitUrl = settings.pupServer.url + "/pupkey/15";

async function fetchStatus(url) {
  const response = await fetch(url);
  return response.status;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error("Unexpected status: " + response.status);
  }
  return response.json();
}

router.get("/:gameId/info", function (req, res) {
  getMediaFilenames(req, res, "GameInfo", ["png", "jpg"]);
});

router.get("/:gameId/help", function (req, res) {
  getMediaFilenames(req, res, "GameHelp", ["png", "jpg"]);
});

router.get("/:gameId/playfield", function (req, res) {
  getMediaFilenames(req, res, "Playfield", ["png", "jpg", "mp4"]);
});

router.get("/:gameId/launch", async function (req, res) {
  let gameId = req.params["gameId"];
  try {
    const status = await fetchStatus(launchUrl + gameId);
    if (status !== 200) {
      res.status(500);
      res.send("ERROR");
      return;
    }
    res.send("OK");
  } catch (_err) {
    res.status(500);
    res.send("ERROR");
  }
});

router.get("/exit", async function (_req, res) {
  try {
    const status = await fetchStatus(exitUrl);
    if (status !== 200) {
      res.status(500);
      res.send("ERROR");
      return;
    }
    res.send("OK");
  } catch (_err) {
    res.status(500);
    res.send("ERROR");
  }
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
    fetchJson(getCurItemUrl)
      .then((data) => {
        gameId = data.GameID;
        renderGame(req, res, gameId);
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

  const row = req.app.locals.queryRow(sql);

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

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, "\\$&");
}

function getMediaFilenames(req, res, mediaDir, extensions) {
  const game = getGame(req.params["gameId"], req);
  const patterns = extensions.map(
    (ext) => escapeRegExp(game.name) + "*." + ext
  );
  const dir = game.emulator.dirMedia.replace(/\\/g, "/") + "/" + mediaDir;
  const files = glob.sync(patterns, { cwd: glob.escapePath(dir) });
  debug("app:media")(
    "Search for '%s' in '%s' found %i files.",
    patterns.toString(),
    dir,
    files.length
  );
  let result = [];
  for (file of files) {
    result.push(
      [req.app.locals.getMediaPath(game), mediaDir, path.basename(file)].join(
        "/"
      )
    );
  }
  res.send(result);
}

module.exports = router;
