let lives = 5;
let level = 1;
let score = 0;
let enemies;
let keyPressed = 'x';
let gameOver = false;
let paused = false;
let levelCleared = false;
let waitTime = 550;
const music = new Audio('./Fly.mp3');
const lastLevel = 11;
const rows = 18;
const columns = 18;
const ships = columns - 2;
const border = "###";
const playerShip = ">8<";
const enemyShip = " M ";
const enemyBullet = " + ";
const playerBullet = " * ";
const bothBullets = "* +";
const emptyCell = "   ";
const fillerCell = "@@@"
const spaceBody = document.querySelector("#spaceBody");

/* Helper Functions */
 
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rollDice = () => getRandomNumber(1, 6);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function playMusic() {
    music.pause();
    music.currentTime = 0;
    music.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
    music.play();
}

/* Listener Functions*/

function removeModal() {
    document.querySelector(".modal.is-visible").classList.remove('is-visible');
}

function submitHighScore() {
    const inputName = document.querySelector('#nameInput');
    const scorestable = document.querySelector('#scoresTableBody');
    const remove = scorestable.querySelector('#toRemoveTD');
    remove.remove();

    const newTr = document.createElement('tr');
    const nameTd = document.createElement('td');
    const levelTd = document.createElement('td');
    const scoreTd = document.createElement('td');

    nameTd.innerText = inputName.value;
    levelTd.innerText = level;
    scoreTd.innerText = score;

    newTr.append(nameTd, levelTd, scoreTd);

    scorestable.append(newTr);
    removeModal();
}

function registerKeyPressed(event) {
    keyPressed = event.key;
}
function presswButton() {
    keyPressed = 'w';
}

function pressaButton() {
    keyPressed = 'a';
}

function pressdButton() {
    keyPressed = 'd';
}

function pressPauseButton() {
    paused = !paused;
    if (music.paused) {
        music.play()
    } else {
        music.pause();
        music.currentTime = 0;
    }
}

/* Render Functions */

function renderMessage(message) {
    const modal1 = document.querySelector('#modal1');
    modal1.querySelector('#modal-message').innerText=message;
    modal1.classList.add('is-visible');
}

function renderGameInfo() {
    const livesLabel = document.querySelector('#livesDisplay');
    const scoreLabel = document.querySelector('#scoreDisplay');
    const levelLabel = document.querySelector('#levelDisplay');
    const enemiesLabel = document.querySelector('#enemiesDisplay');
    livesLabel.innerText = 'Lives: ' + lives;
    scoreLabel.innerText = 'Score: ' + score;
    levelLabel.innerText = 'Level: ' + level;
    enemiesLabel.innerText = 'Enemies: ' + enemies;
}

function renderEmptyScreen() {
    spaceBody.replaceChildren();
    for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < columns; j++) {
            const td = document.createElement('td');
            if (i === 0 || i === rows - 1 || j === 0 || j === columns - 1) {
                td.innerText = border;
                td.className = 'borderCell';
            } else {
                clearCell(td);
            }
            tr.append(td);
        }
        spaceBody.append(tr);
    }
}

function renderLevel() {
    for (let i = 1; i < rows - 1; i++) {
        const tr = spaceBody.childNodes[i];
        for (let j = 1; j < columns - 1; j++) {
            const currentCell = tr.childNodes[j];
            currentCell.setAttribute('blocked', 'false');
            if ( i === 1 && j > 2 && j < rows - 3) {
                currentCell.innerHTML = enemyShip;
                currentCell.className = 'enemyShip';
                continue;
            }
            if (i === rows - 2 && j === Math.round(columns/2)) {
                currentCell.innerHTML = playerShip;
                currentCell.className = 'playerShip'
                continue;
            }
            else {
                clearCell(currentCell);
            }
        }
    }
    enemies = document.querySelectorAll('.enemyShip').length;
}

async function renderFilledScreen(){
    for (let i = 1; i < rows - 1; i++) {
        const tr = spaceBody.childNodes[i];
        for (let j = 1; j < columns - 1; j++) {
                const currentCell = tr.childNodes[j];
                currentCell.innerHTML = fillerCell;
                currentCell.className = 'fillerCell';
        }
        await sleep(250);
    }
}

/* Table Functions */

function getNextCell(direction, row, col) {
    switch (direction) {
        case 'above':
            return spaceBody.childNodes[row - 1].childNodes[col];
        case 'below':
            return spaceBody.childNodes[row + 1].childNodes[col];
        case 'left': 
            return spaceBody.childNodes[row].childNodes[col - 1];
        case 'right':
            return spaceBody.childNodes[row].childNodes[col + 1];
        default:
            return null;    
    }   
}

function cellIsEmpty(cell) {
    return cell.className === 'emptyCell';
}
function clearCell(cell) {
    cell.innerText = emptyCell;
    cell.className = 'emptyCell';
    cell.setAttribute('blocked', 'false');
}

function moveCell(origin, destiny) {
    destiny.innerText = origin.innerText;
    destiny.className = origin.className;
    destiny.setAttribute('blocked', origin.getAttribute('blocked'));
    clearCell(origin);
}
/* Movement Functions */

function killEnemy(cell) {
    clearCell(cell);
    enemies--;
    score += 100;
}

function hitPlayer() {
    lives--;
    score -=200; 
}

function drawBothBullets(cell) {
    cell.innerText = bothBullets;
    cell.className = 'bothBullets';
    cell.setAttribute("blocked", "true");
}

function drawEnemyBullet(cell) {
    cell.innerText = enemyBullet;
    cell.className = 'enemyBullet'
}

function drawPlayerBullet(cell) {
    cell.innerText = playerBullet;
    cell.className = 'playerBullet';
}

function moveBullets() {
    const enemyShots = document.querySelectorAll('.enemyBullet');
    enemyShots.forEach ( bullet => {
        const currentRow = bullet.closest('tr').rowIndex;
        const currentCol = bullet.cellIndex;
        if (bullet.getAttribute('blocked') === 'true') {
            bullet.setAttribute('blocked', 'false');
        } else {
            clearCell(bullet);
            if (currentRow < rows - 2) {
                const belowCell = getNextCell('below', currentRow, currentCol);
                if (belowCell.className === 'playerBullet') {
                    drawBothBullets(belowCell);
                } else if (belowCell.className === 'playerShip') {
                    hitPlayer();
                } else if (cellIsEmpty(belowCell)) {
                    drawEnemyBullet(belowCell);
                }
            }
        }
    });

    const playerShots = document.querySelectorAll('.playerBullet');
    playerShots.forEach ( bullet => {
        const currentRow = bullet.closest('tr').rowIndex;
        const currentCol = bullet.cellIndex;
        if (bullet.getAttribute('blocked') === 'true') {
            bullet.setAttribute('blocked', 'false');
        } else {
            clearCell(bullet);
            if (currentRow > 1) {
                const aboveCell = getNextCell('above', currentRow, currentCol);
                if (aboveCell.className === 'enemyBullet') {
                    drawBothBullets(aboveCell);
                } else if (aboveCell.className === 'enemyShip') {
                    killEnemy(aboveCell);
                } else if (cellIsEmpty(aboveCell)) {
                    drawPlayerBullet(aboveCell);
                }
            }
        }
    });

    const bothShots = document.querySelectorAll('.bothBullets');
    bothShots.forEach ( bullet => {
        const currentRow = bullet.closest('tr').rowIndex;
        const currentCol = bullet.cellIndex;
        if (bullet.getAttribute('blocked') === 'true') {
            bullet.setAttribute('blocked', 'false');
        } else {
            clearCell(bullet);
            if (currentRow > 1) {
                const aboveCell = getNextCell('above', currentRow, currentCol);
                if (aboveCell.className === 'enemyBullet') {
                    drawBothBullets(aboveCell);
                } else if (aboveCell.className === 'enemyShip') {
                    killEnemy(aboveCell);
                } else if (cellIsEmpty(aboveCell)) {
                    drawPlayerBullet(aboveCell);
                }
            }
            if (currentRow < rows - 2) {
                const belowCell = getNextCell('below', currentRow, currentCol);
                if (belowCell.className === 'playerBullet') {
                    drawBothBullets(belowCell);
                } else if (belowCell.className === 'playerShip') {
                    hitPlayer();
                } else if (cellIsEmpty(belowCell)) {
                    drawEnemyBullet(belowCell);
                }
            }
        }
    });
}


function moveEnemies(){
    const enemyShips = document.querySelectorAll('.enemyShip');
    enemyShips.forEach( ship => {
        const currentRow = ship.closest('tr').rowIndex;
        const currentCol = ship.cellIndex;
        let choice = rollDice();
        if (choice === 6 ) {
            if (currentRow < rows - 2) {
                const belowCell = getNextCell('below', currentRow, currentCol);
                if (cellIsEmpty(belowCell)) {
                    drawEnemyBullet(belowCell);
                }
            }
        } else if (choice >= 3) {
            if (currentCol > 1) {
                const leftCell = getNextCell('left', currentRow, currentCol);
                if (cellIsEmpty(leftCell)) {
                    moveCell(ship, leftCell);
                } else {
                        if (currentRow < rows - 3) {
                            const belowCell = getNextCell('below', currentRow, currentCol);
                            if (cellIsEmpty(belowCell)) {
                                moveCell(ship, belowCell);
                            }
                        } else if (currentRow > 2) {
                            const aboveCell = getNextCell('above', currentRow, currentCol);
                            if (cellIsEmpty(aboveCell)) {
                                moveCell(ship, aboveCell)
                            }
                        }
                    } 
                }
                
        } else {
            if (currentCol < columns - 1) {
                const rightCell = getNextCell('right', currentRow, currentCol);
                if (cellIsEmpty(rightCell)) {
                    moveCell(ship, rightCell);
                } else {
                    if (currentRow < rows - 3) {
                        const belowCell = getNextCell('below', currentRow, currentCol);
                        if (cellIsEmpty(belowCell)) {
                            moveCell(ship, belowCell);
                        }
                    } else if (currentRow > 2) {
                        const aboveCell = getNextCell('above', currentRow, currentCol);
                        if (cellIsEmpty(aboveCell)) {
                            moveCell(ship, aboveCell)
                        }
                    }
                } 
            }
        }
        
    });
}

function movePlayer() {
    const player = document.querySelector('.playerShip');
    const currentRow = player.parentElement.rowIndex;
    const currentCol = player.cellIndex;
    switch (keyPressed) {
        case 'w':
            const aboveCell = getNextCell('above', currentRow, currentCol);
            if (cellIsEmpty(aboveCell)) {
                drawPlayerBullet(aboveCell);
                aboveCell.setAttribute('blocked', 'true');
            } else if (aboveCell.innerText === enemyBullet) {
                drawBothBullets(aboveCell);
            } else if (aboveCell.innerText === enemyShip) {
                clearCell(aboveCell);
                enemies--;
            }
            keyPressed = 'x';
        break;
        case 'a':
            const leftCell = getNextCell('left', currentRow, currentCol);
            if (cellIsEmpty(leftCell)) {
                moveCell(player, leftCell);
            }
            keyPressed = 'x';
        break;
        case 'd':
            const rightCell = getNextCell('right', currentRow, currentCol);
            if (cellIsEmpty(rightCell)) {
                moveCell(player, rightCell);
            }
            keyPressed = 'x';
        break;
    }
}

/* Game Functions */

function init() {
    
    renderEmptyScreen();

    const startButton = document.querySelector('#startBtn');
    const pauseButton = document.querySelector('#pauseBtn');
    const wbutton = document.querySelector('#wbtn');
    const abutton = document.querySelector('#abtn');
    const dbutton = document.querySelector('#dbtn');
    const modalCloseBtn = document.querySelector('#closeModal1');
    const inputScoreBtn = document.querySelector('#submitScoreBtn');

    
    wbutton.addEventListener('click', presswButton);
    abutton.addEventListener('click', pressaButton);
    dbutton.addEventListener('click', pressdButton);    
    startButton.addEventListener('click', start);
    pauseButton.addEventListener('click', pressPauseButton);
    modalCloseBtn.addEventListener ("click", removeModal);
    inputScoreBtn.addEventListener('click', submitHighScore);
    document.addEventListener('keypress', registerKeyPressed);

}

async function start() {
    lives = 5;
    score = 0;
    level = 1;
    gameOver = false;
    playMusic();
    renderLevel();
    while (!gameOver) {
        await sleep(waitTime);
        if (!paused && !levelCleared) {
            play();
        } else if (levelCleared) {
            if (level < lastLevel) {
            level++;
            score += 500;
            waitTime -= 40;
            await renderFilledScreen();
            renderLevel();
            levelCleared = false;
            } else {
                gameOver = true;    
            }
        }
        
        
    }
    await renderFilledScreen();
    if (lives === 0) {
        renderMessage('You lost :(');
    } else {
        renderMessage('You won!');
    }
}



function play() {
    renderGameInfo();
    moveBullets();
    movePlayer();    
    moveEnemies();
    renderGameInfo();
    if (enemies <= 0) {levelCleared = true;}
    if (lives === 0) { gameOver = true;}   
}

init();
