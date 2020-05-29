import Emulator from "./Emulator";

class Game {
  id: number;
  name: string;
  display: string;
  type: string;
  category: string;
  theme: string;
  year: string;
  numPlayers: number;
  manufacturer: string;
  emulator: Emulator;
  lastPlayed: Date;
  numPlays: number;
  timePlayed: number;
  decade: string;
  favorite: boolean;
  constructor(
    id: number,
    name: string,
    display: string,
    type: string,
    category: string,
    theme: string,
    year: string,
    numPlayers: number,
    manufacturer: string,
    emulator: Emulator,
    lastPlayed: Date,
    numPlays: number,
    timePlayed: number,
    decade: string,
    favorite: boolean
  ) {
    this.id = id;
    this.name = name;
    this.display = display;
    this.type = type;
    this.category = category;
    this.theme = theme;
    this.year = year;
    this.numPlayers = numPlayers;
    this.manufacturer = manufacturer;
    this.emulator = emulator;
    this.lastPlayed = lastPlayed;
    this.numPlays = numPlays;
    this.timePlayed = timePlayed;
    this.decade = decade;
    this.favorite = favorite;
  }
}

export default Game;
