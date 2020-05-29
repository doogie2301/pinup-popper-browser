import express from "express";
import config from "config";
import Game from "../Game";
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res) {
  let categories, themes, types, decades, manufacturers, emulators;
  if (config.get("options.filters.category")) {
    categories = filterAndSort(
      req.app.locals.games.map((item: Game) => item.category)
    );
  }
  if (config.get("options.filters.theme")) {
    themes = filterAndSort(
      req.app.locals.games.map((item: Game) => item.theme)
    );
  }
  if (config.get("options.filters.type")) {
    types = filterAndSort(req.app.locals.games.map((item: Game) => item.type));
  }
  if (config.get("options.filters.decade")) {
    decades = filterAndSort(
      req.app.locals.games.map((item: Game) => item.decade)
    );
  }
  if (config.get("options.filters.manufacturer")) {
    manufacturers = filterAndSort(
      req.app.locals.games.map((item: Game) => item.manufacturer)
    );
  }
  if (config.get("options.filters.emulator")) {
    emulators = filterAndSort(
      req.app.locals.games.map((item: Game) => item.emulator.name)
    );
  }
  res.render("index", {
    games: req.app.locals.games,
    categories: categories,
    types: types,
    themes: themes,
    decades: decades,
    manufacturers: manufacturers,
    emulators: emulators,
    favorites: config.get("options.filters.favorites"),
    wheelRotation: config.get("media.useThumbs")
      ? req.app.locals.globalSettings.thumbRotation
      : 0,
  });
});

function filterAndSort(map: Game[]) {
  return map
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
}

module.exports = router;
