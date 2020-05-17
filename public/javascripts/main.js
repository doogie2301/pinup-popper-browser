function launchGame(gameId) {
    fetch('/games/' + gameId + '?launch');
}