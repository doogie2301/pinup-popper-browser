# Pinup Popper Browser

> A companion application to [Pinup Popper](http://www.nailbuster.com/wikipinup/) that allows you to browse the available games from another device.

TBD description

![Dependencies](https://david-dm.org/doogie2301/pinup-popper-browser.svg)

## Features

- **Main View** - Displays the Wheel images for all games enabled in the Pinup Popper menu. Clicking on a wheel will go to the Game View for that game.
  - **Game Select** - Jumps to the Game View for a specific game
    - **Current Game** - The game currently in view in the Pinup Popper menu or the game currently being played.
    - **Last Played** - The game that was last played
    - **Random Game** - A randomly selected game
  - **Filters** - The game list can be filtered by one of the available fields (Category, Theme, Type, Decade, Emulator, Manufacturer, and Favorites).
  - **Search Box** - Filters the games to those with name containing the entered text
- **Game View** - Displays the details for a single game
  - **Summary** - Disaplays the wheel image and basic information about the game
    - **Launch Game** - Launches the game in Pinup Popper.
    - **Exit Current Game** - Exits the current game in Pinup Popper.
  - **Info** - Displays any images starting with the game display name) from the GameInfo media folder
  - **Help** - Displays any images for the game from the GameHelp media folder
  - **Playfield** - Displays an image or video for the game from the Playfield media folder

## Setup

### Prerequisites

- [Enable Web Remote Control for Pinup Popper](http://www.nailbuster.com/wikipinup/doku.php?id=web_remote_control)
- TBD Update PuPMenuScript for GameLaunch (This is needed for the Current Game function to work properly.)

### Installation

TBD

### Configuration

The settings.yml file contains settings that can be modified to support your setup and adjust preferences. Changes will take effect after the application is restarted.

#### pupServer.url

Specify the URL for the PuPServer.

#### pupServer.db.path

Specify the full path to the Pinup database.

#### pupServer.db.filter

An optional condition used in the WHERE clause to filter the initial load of games.

#### httpServer.port

Specify the port number for this web host.

#### httpServer.logFormat

Format for debug logging (see https://github.com/expressjs/morgan#predefined-formats)

#### httpServer.logLevel

Set to 'error' to only log failed requests

#### options.filters

The filtering menu options can be enabled/disabled individually.

#### options.game

The Info, Help, and Playfield menu options can be enabled/disabled individually.

### media.useThumbs

Indicates whether to use the thumbnail images created by Pinup Popper for display. Turning this off will load the full original

## Links

- http://www.nailbuster.com/wikipinup/doku.php?id=web_remote_control

## License

This project is licensed under the terms of the GPL-3.0 license.
