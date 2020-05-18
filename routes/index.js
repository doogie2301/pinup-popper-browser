'use strict';
var express = require('express');
var settings = require("app-settings");
var router = express.Router({ mergeParams: true });
const axios = require("axios");

var getCurItemUrl = settings.pupServer.url + "/function/getcuritem";
var launchUrl = settings.pupServer.url + "/function/launchgame/";
var exitUrl = settings.pupServer.url + "/pupkey/15";

router.get('/games/:gameId', function (req, res) {
    let gameId = req.params["gameId"];

    if ('launch' in req.query) {
        // exit emulation first
        axios.get(exitUrl).then(() => {
            axios.get(launchUrl + gameId).then(() => {
                res.send('OK');
            }).catch(() => {
                res.status(500);
                res.send('ERROR');
            })
        }).catch(() => {
            res.status(500);
            res.send('ERROR');
        });
    } else if (gameId == "current") {
        axios.get(getCurItemUrl).then((response) => {
            gameId = response.data.GameID;
            renderGame(req, res, gameId);
        }).catch(() => {
            res.status(500);
            res.send('ERROR');
        });
    } else {
        renderGame(req, res, gameId);
    }
});

function renderGame(req, res, gameId) {
    let gamePos = req.app.locals.gameIds.get(parseInt(gameId));
    if (gamePos === undefined) {
        res.status(404);
        res.send('NOT FOUND');
    } else {
        res.render('game', { game: req.app.locals.games[gamePos] });
    }
}

/* GET home page. */
router.get('/', function (req, res) {
    let categories, themes, decades, manufacturers, emulators;
    if (settings.remoteServer.filters.category)
        categories = req.app.locals.games.map(item => item.category)
            .filter((value, index, self) => self.indexOf(value) === index).sort();
    if (settings.remoteServer.filters.theme)
        themes = req.app.locals.games.map(item => item.theme)
            .filter((value, index, self) => self.indexOf(value) === index).sort();
    if (settings.remoteServer.filters.decade)
        decades = req.app.locals.games.map(item => item.decade)
            .filter((value, index, self) => self.indexOf(value) === index).sort();
    if (settings.remoteServer.filters.manufacturer)
        manufacturers = req.app.locals.games.map(item => item.manufacturer)
            .filter((value, index, self) => self.indexOf(value) === index).sort();
    if (settings.remoteServer.filters.emulator)
        emulators = req.app.locals.games.map(item => item.emulator)
            .filter((value, index, self) => self.indexOf(value) === index).sort();
    res.render('index', {
        games: req.app.locals.games,
        categories: categories,
        themes: themes,
        decades: decades,
        manufacturers: manufacturers,
        emulators: emulators
    });
});

module.exports = router;