const music = new Audio('./audio/Fly.mp3');
const lastLevel = 11;
const rows = 18;
const columns = 18;
const ships = columns - 2;
const border = "###";
const playerShip = "<img src ='./img/ship.png' id='playerShipImg'></img>";
const enemyShip = "<img src ='./img/enemy.png' id='enemyShipImg'></img>";
const enemyBullet = " + ";
const playerBullet = " * ";
const bothBullets = "* +";
const emptyCell = "   ";
const fillerCell = "@@@";
const remainingBullets = 7;
const spaceBody = document.querySelector("#spaceBody");

const gameProps = {
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

const sounds = {
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


class Score {
    constructor(name, level, score) {
        this.name = name;
        this.level = level;
        this.score = score;
    }
}

class ScoresList {
    constructor() {
        this.scoreList = [];
    }
}

let highScores = [];