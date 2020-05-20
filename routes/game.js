var express = require('express');
var settings = require("app-settings");
var router = express.Router();
const axios = require("axios");
var glob = require("glob")
const path = require('path');

var getCurItemUrl = settings.pupServer.url + "/function/getcuritem";
var launchUrl = settings.pupServer.url + "/function/launchgame/";
var exitUrl = settings.pupServer.url + "/pupkey/15";

router.get('/:gameId/info', function (req, res) {
    let game = getGame(req.params["gameId"], req);
    glob(settings.pupServer.mediaDirRoot + "/" + game.dirMedia + "/GameInfo/" + game.name + "*.{png,jpg}", function (err, files) {
        let result = [];
        for (file of files) {
            result.push("/media/" + game.dirMedia + "/GameInfo/" + path.basename(file));
        }
        res.send(result);
    })
});

router.get('/:gameId/help', function (req, res) {
    let game = getGame(req.params["gameId"], req);
    glob(settings.pupServer.mediaDirRoot + "/" + game.dirMedia + "/GameHelp/" + game.name + "*.{png,jpg}", function (err, files) {
        let result = [];
        for (file of files) {
            result.push("/media/" + game.dirMedia + "/GameHelp/" + path.basename(file));
        }
        res.send(result);
    })
});

router.get('/:gameId/playfield', function (req, res) {
    let game = getGame(req.params["gameId"], req);
    glob(settings.pupServer.mediaDirRoot + "/" + game.dirMedia + "/Playfield/" + game.name + ".mp4", function (err, files) {
        let result = [];
        for (file of files) {
            result.push("/media/" + game.dirMedia + "/Playfield/" + path.basename(file));
        }
        res.send(result);
    })
});


router.get('/:gameId/launch', function (req, res) {
    let gameId = req.params["gameId"];
        axios.get(launchUrl + gameId).then((response) => {
            if (response.status != 200) {
                res.status(500);
                res.send('ERROR');
            } else {
                res.send('OK');
            }
        }).catch(() => {
            res.status(500);
            res.send('ERROR');
        })
});

router.get('/exit', function (req, res) {
    axios.get(exitUrl).then((response) => {
        if (response.status != 200) {
            res.status(500);
            res.send('ERROR');
        } else {
            res.send('OK');
        }
    }).catch(() => {
        res.status(500);
        res.send('ERROR');
    })
});

router.get('/:gameId', function (req, res) {
    let gameId = req.params["gameId"];

    if (gameId == "current") {
        axios.get(getCurItemUrl).then((response) => {
            if (response.status != 200) {
                res.status(500);
                res.send('ERROR');
            } else {
                gameId = response.data.GameID;
                renderGame(req, res, gameId);
            }
        }).catch(() => {
            res.status(500);
            res.send('ERROR');
        });
    } else {
        renderGame(req, res, gameId);
    }
});

function getGame(gameId, req) {
    let gamePos = req.app.locals.gameIds.get(parseInt(gameId));
    return gamePos === undefined ? gamePos : req.app.locals.games[gamePos];
}

function renderGame(req, res, gameId) {
    let game = getGame(gameId, req);
    if (game) {
        res.render('game', {
            game: game,
            info: settings.options.game.info,
            help: settings.options.game.help,
            playfield: settings.options.game.playfield
        });
    } else {
        res.status(404);
        res.send('NOT FOUND');
    }
}

module.exports = router;