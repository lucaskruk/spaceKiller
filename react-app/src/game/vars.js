import { Howl } from 'howler';

export const music = new Howl({
  src: ['./audio/Fly.mp3'],
  loop: true,
  volume: 0.4,
});
export const lastLevel = 11;
export const rows = 18;
export const columns = 18;
export const ships = columns - 2;
export const border = "###";
export const playerShip = "<img src='./img/ship.png' id='playerShipImg'></img>";
export const enemyShip = "<img src='./img/enemy.png' id='enemyShipImg'></img>";
export const enemyBullet = " + ";
export const playerBullet = " * ";
export const bothBullets = "* +";
export const emptyCell = "   ";
export const fillerCell = "@@@";
export const remainingBullets = 7;
export let spaceBody;

export const gameProps = {
    lives: 5,
    level: 1,
    currentScore: 0,
    enemies: ships,
    gameOver: false,
    paused: false,
    levelCleared: false,
    playerDied: false,
    waitTime: 550,
    remainingShots: remainingBullets
}

export const sounds = {
    explosion: new Howl({
        src: ['./audio/explosion.wav']
    }),
    playerExplosion: new Howl({
        src: ['./audio/playerExplode.wav']
    }),
    playerShot: new Howl({
        src: ['./audio/playershot.wav']
    }),
    levelComplete: new Howl ({
        src: ['./audio/WinSaw.ogg']
    }),
    lose: new Howl ({
        src: ['./audio/lose.mp3']
    })
};


export class Score {
    constructor(name, level, score) {
        this.name = name;
        this.level = level;
        this.score = score;
    }
}

export class ScoresList {
    constructor() {
        this.scoreList = [];
    }
}

export let highScores = [];

export function setSpaceBody(el) {
  spaceBody = el;
}
