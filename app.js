'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var settings = require("app-settings");
var routeIndex = require('./routes/index');
var routeGame = require('./routes/game');

var app = express();

var games = [];
var gameIds = new Map();

const sqlite3 = require('sqlite3').verbose();

// open the database
let db = new sqlite3.Database(settings.pupServer.db.path, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});


let sql = 'select g.gameid, gamename, gamedisplay, gametype, emudisplay, dirmedia, gameyear, numplayers, manufact, LastPlayed, NumberPlays, TimePlayedSecs, '
    + 'category, gametheme '
    + 'from games g join emulators e on g.emuid = e.emuid '
    + 'left join gamesstats s on g.gameid = s.gameid '
    + (settings.pupServer.db.filter ? ' where ' + settings.pupServer.db.filter : '')
    + 'order by gamedisplay';

db.all(sql, [], (err, rows) => {
    if (err) {
        throw err;
    }
    var i = 0;
    rows.forEach((row) => {
        games.push(
            {
                id: row.GameID,
                name: row.GameName,
                display: row.GameDisplay,
                type: row.GameType,
                category: row.Category,
                theme: row.GameTheme,
                year: row.GameYear,
                numPlayers: row.NumPlayers,
                manufacturer: row.Manufact,
                emulator: row.EmuDisplay,
                dirMedia: row.DirMedia.split('\\').pop(),
                lastPlayed: row.LastPlayed,
                numPlays: row.NumberPlays || 0,
                timePlayed: row.TimePlayedSecs || 0,
                decade: row.GameYear ? parseInt(row.GameYear) - (parseInt(row.GameYear) % 10) : ''
            });
        gameIds.set(row.GameID, i);
        i++;
    });
});

// close the database connection
db.close();

app.locals.games = games;
app.locals.gameIds = gameIds;



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/media', express.static(settings.pupServer.mediaDirRoot));
app.use('/games', routeGame);
app.use('/', routeIndex);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.set('port', process.env.PORT || settings.httpServer.port);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
