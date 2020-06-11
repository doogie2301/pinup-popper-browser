# Pinup Popper Browser

> A companion application to [Pinup Popper](http://www.nailbuster.com/wikipinup/) that allows you to browse the available games from another device.

This is an application powered by Node.js with Express to provide a view into your Pinup Popper system from any web browser on your internal network. It works by querying the PuP database to load the details of the games that have been configured, and presents them in a format that can be easily scrolled, filtered, or searched. The selected game can also be launched remotely from the app, which is enabled through the use of the [Web Remote Control for Pinup Popper](http://www.nailbuster.com/wikipinup/doku.php?id=web_remote_control).

[![Build Status](https://img.shields.io/travis/doogie2301/pinup-popper-browser/master)](https://travis-ci.org/doogie2301/pinup-popper-browser)
![Dependencies](https://img.shields.io/depfu/doogie2301/pinup-popper-browser)

## Features

- **Main View** - Displays the Wheel images for all games in the Pinup Popper menu. Clicking on a wheel will go to the Game View for that game.

  ![main](https://user-images.githubusercontent.com/12683011/83432430-dc3d8600-a406-11ea-9eae-633f35564905.png)

  - **Game Select** - Jumps to the Game View for a specific game
    - **Current Game\*** - The game currently in view in the Pinup Popper menu or the game currently being played.
    - **Last Played\*** - The game that was last played
    - **Random Game** - A randomly selected game
  - **Filters** - The game list can be filtered by one of the following fields: Category, Theme, Type, Decade, Emulator, Manufacturer, and Favorites.
  - **Search Box** - Filters the games by name containing the entered text

- **Game View** - Displays the details for a single game

  ![game](https://user-images.githubusercontent.com/12683011/83432431-dcd61c80-a406-11ea-95fc-f84ecef145f0.png)

  - **Summary** - Disaplays the wheel image and basic information about the game
    - **Launch Game\*** - Launches the game in Pinup Popper
    - **Exit Current Game\*** - Exits the current game in Pinup Popper
  - **Info** - Displays any images starting with the game name from the GameInfo media folder
  - **Help** - Displays any images starting with the gaame name from the GameHelp media folder
  - **Playfield** - Displays an image or video with the game name from the Playfield media folder

## Setup

### Prerequisites

Features with an asterisk above require the following steps:

- [Enable Web Remote Control for Pinup Popper](http://www.nailbuster.com/wikipinup/doku.php?id=web_remote_control)
- Add the following line of code inside the GameLaunch(pMsg) method inside the PuPMenuScript.pup file (needed for the Current Game feature to work after game is launched):

       if (useWEB && WEBStatus) { PuPWebServer.MenuUpdate(pMsg); }

  Example:

  ![alt tag](https://user-images.githubusercontent.com/12683011/83413297-9a521700-a3e9-11ea-9642-dc5fe37ad381.png)

### Installation

#### Using Node

If you already have Node installed, you can download the source code and run the following commands:

    npm install
    node .

The advantage to this approach is that you have the ability to customize the code.

#### Running without Node

The application is also packaged as a standalone executable. Simply download and extract the contents of the latest PinUpBrowser.zip file from [the Releases tab](https://github.com/doogie2301/pinup-popper-browser/releases), and run the PinUpBrowser.exe executable.

### Configuration

The config.yml file contains settings that can be modified to support your setup and adjust preferences. Changes will take effect after the application is restarted.

* **pupServer.url**
  
  Specify the URL for the PuPServer.

* **pupServer.db.path**
  
  Specify the full path to the Pinup database.

* **pupServer.db.filter**

  An optional condition used in the WHERE clause to filter the initial load of games.

* **httpServer.port**

  Specify the port number for this web host.

* **httpServer.logFormat**

  Format for debug logging (see https://github.com/expressjs/morgan#predefined-formats)

* **httpServer.logLevel**

  Set to 'error' to only log failed requests, or 'info' to log all requests.

* **options.filters**

  The filter menu options can be enabled/disabled individually. The drop-downs are populated from unique values in the respective fields in the database, so you may need to do some cleanup in the Pinup Games Manager, or just disable the filter option if you don't want to display it.

  ![filters](https://user-images.githubusercontent.com/12683011/83432040-3ee25200-a406-11ea-8f2f-ef861d78c22b.png)

* **options.game**

  The Info, Help, and Playfield menu options can be enabled/disabled individually.

  ![game_options](https://user-images.githubusercontent.com/12683011/83432039-3e49bb80-a406-11ea-8729-fcacd876ebef.png)

* **media.useThumbs**

  Indicates whether to use the thumbnail images created by Pinup Popper for display. Turning this off will load the full sized Wheel media, which may slow the load time and browser responsiveness, but will not require the games to have been viewed in the Pinup Popper menu first.

* **media.cacheInMinutes**

  The number of minutes the browser should cache the media files.

* **media.playfieldRotation**

  Indicates whether Playfield media is rotated or not.

## Support

Bugs reports and enhancement requests can be submitted by [creating an  issue](https://github.com/doogie2301/pinup-popper-browser/issues?q=is%3Aopen+is%3Aissue).

## Sponsoring

This project is a contribution to the virtual pinball community, and is completely free to use. However, if you still feel the need to show your appreciation for my efforts, you can click the button below:

<a href="https://www.buymeacoffee.com/doogie2301" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/lato-black.png" alt="Buy Me A Coffee" height="35"></a>

## License

This project is licensed under the terms of the GPL-3.0 license.
