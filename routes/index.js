'use strict';
var express = require('express');
var settings = require("app-settings");
var router = express.Router();

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