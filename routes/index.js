'use strict';
var express = require('express');
var settings = require("app-settings");
var router = express.Router({ mergeParams: true });
const axios = require("axios");

router.get('/games/:gameId', function (req, res) {
    let gameId = req.params["gameId"];
    if (gameId == "current") {
        axios.get(settings.pupServer.url + "/function/getcuritem").then( (response) => {
            gameId = response.data.GameID;
        })
    };
    if ('launch' in req.query) {
        axios.get(settings.pupServer.url + "/function/launchgame/" + gameId).then((response) => {
            console.log(response.data);
            axios.get(settings.pupServer.url + "/function/launchgame/" + gameId).then((response) => {
                console.log(response.data);
                res.send('OK');
            });
        });
    } else {
        let gamePos = req.app.locals.gameIds.get(parseInt(gameId));
        if (gamePos === undefined) {
            res.status(404);
            res.send('Not found');
        } else {
            res.render('game', { game: req.app.locals.games[gamePos] });
        }
    }
});

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { games: req.app.locals.games });
});

module.exports = router;