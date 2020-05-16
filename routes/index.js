'use strict';
var express = require('express');
var router = express.Router();

router.get('/games/:gameId', function (req, res) {
    let gameId = parseInt(req.params["gameId"]);
    res.render('game', { game: req.app.locals.games.get(gameId) });
});

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { games: Object.fromEntries(req.app.locals.games) });
});

module.exports = router;
