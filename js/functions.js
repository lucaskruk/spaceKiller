/* Helper Functions */
 
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rollDice = () => getRandomNumber(1, 6);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function playMusic() {
    music.volume = 0.4;
    music.pause();
    music.currentTime = 0;
    music.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
    music.play();
}

function isHighScore(score) {
    
    if (highScores.length === 10) {
        let minScore = 9999999;
        for (item of highScores) {
            if (item.score < minScore) {
                minScore = item.score;
            }
        }
        return (score > minScore);
    } else {
        return true;
    }
}

/* Storage Functions */
function saveScore() {
    const savedScores = JSON.stringify(highScores);
    window.localStorage.setItem('highScores', savedScores);
}

function recoverScores() {
    let recoveredScores = window.localStorage.getItem('highScores');
    if (recoveredScores) {
        parsedScores = JSON.parse(recoveredScores);
        parsedScores.forEach( item => {
            highScores.push(item);
        });
    }
}

/* Listener Functions*/

function removeModal() {
    let inputForm = document.querySelector(".scoresForm.is-visible");
    if (inputForm) {
        inputForm.classList.remove('is-visible');
    }
    document.querySelector(".modal.is-visible").classList.remove('is-visible');
}

function submitHighScore() {
    const inputName = document.querySelector('#nameInput');
    const newScore = new Score(inputName.value, gameProps.level, gameProps.currentScore);
    highScores.push(newScore);
    sortAndSliceScores();
    saveScore();
    refreshHighScores();
    removeModal();
}

function sortAndSliceScores() {
    highScores = highScores.sort( (a,b) => b.score - a.score).slice(0,10);
}

function registerKeyPressed(event) {
    if (isPlayable()) {
        movePlayer(event.key);
    }
    
}
function presswButton() {
    if (isPlayable()) {
        movePlayer('w');
    }
}

function pressaButton() {
    if (isPlayable()) {
        movePlayer('a');
    }
}

function pressdButton() {
    if (isPlayable()) {
        movePlayer('d');
    }
}

function stopMusic() {
    music.pause();
    music.currentTime = 0;
}

function pressPauseButton() {
    gameProps.paused = !gameProps.paused;
    if (music.paused) {
        music.play()
    } else {
        stopMusic();
    }
}

/* Render Functions */

function renderHighScore(highscore, table) {
    const newTr = document.createElement('tr');
    const nameTd = document.createElement('td');
    const levelTd = document.createElement('td');
    const scoreTd = document.createElement('td');

    nameTd.innerText = highscore.name;
    levelTd.innerText = highscore.level;
    scoreTd.innerText = highscore.score;
    newTr.append(nameTd, levelTd, scoreTd);
    table.append(newTr);
}

function renderMessage(message) {
    const modal1 = document.querySelector('#modal1');
    modal1.querySelector('#modal-message').innerText=message;
    modal1.classList.add('is-visible');
    if (isHighScore(gameProps.currentScore)) {
        modal1.querySelector('#modal-message').innerText = message + '\n Reached a High Score!';
        modal1.querySelector('.scoresForm').classList.add('is-visible');
    }
}

function renderGameInfo() {
    const livesLabel = document.querySelector('#livesDisplay');
    const scoreLabel = document.querySelector('#scoreDisplay');
    const levelLabel = document.querySelector('#levelDisplay');
    const enemiesLabel = document.querySelector('#enemiesDisplay');
    const remShotsLabel = document.querySelector('#remainingShots');
    livesLabel.innerText = 'Lives: ' + gameProps.lives;
    scoreLabel.innerText = 'Score: ' + gameProps.currentScore;
    levelLabel.innerText = 'Level: ' + gameProps.level;
    enemiesLabel.innerText = 'Enemies: ' + gameProps.enemies;

    let remShotsStr = 'Shots:'
    for (let i = 0; i < gameProps.remainingShots; i++) {
        remShotsStr += ' * '
    }
    remShotsLabel.innerText = remShotsStr;
}

function renderInitialHighScores() {
    recoverScores();
    refreshHighScores();
}

function refreshHighScores() {
    if (highScores.length > 0) {
        const scorestable = document.querySelector('#scoresTableBody');
        scorestable.replaceChildren();
        for (score of highScores) {
           renderHighScore(score, scorestable);
        }
    }
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
    gameProps.enemies = document.querySelectorAll('.enemyShip').length;
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
    destiny.innerHTML = origin.innerHTML;
    destiny.className = origin.className;
    destiny.setAttribute('blocked', origin.getAttribute('blocked'));
    clearCell(origin);
}
/* Movement Functions */
function isPlayable() {
    return !gameProps.gameOver && !gameProps.paused && !gameProps.levelCleared && !gameProps.playerDied;
}
function killEnemy(cell) {
    clearCell(cell);
    sounds.explosion.play();
    gameProps.enemies--;
    gameProps.currentScore += 100;
    gameProps.remainingShots++;
}

function hitPlayer(cell) {
    gameProps.lives--;
    sounds.playerExplosion.play();
    gameProps.currentScore -=200;
    gameProps.playerDied = true;
    gameProps.remainingShots = remainingBullets;
    clearCell(cell)
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
    sounds.playerShot.play();
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
                    hitPlayer(belowCell);
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
                } else {
                    gameProps.remainingShots++;
                }
            } else {
                gameProps.remainingShots++;
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
                } else {
                    gameProps.remainingShots++;
                }
            } else { 
                gameProps.remainingShots++;
            }
            if (currentRow < rows - 2) {
                const belowCell = getNextCell('below', currentRow, currentCol);
                if (belowCell.className === 'playerBullet') {
                    drawBothBullets(belowCell);
                } else if (belowCell.className === 'playerShip') {
                    hitPlayer(belowCell);
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
                        if (currentRow < rows - 4) {
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
                    if (currentRow < rows - 4) {
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
            } else {
                if (currentRow > 2) {
                    const aboveCell = getNextCell('above', currentRow, currentCol);
                    if (cellIsEmpty(aboveCell)) {
                        moveCell(ship, aboveCell)
                    }
                }
            }
        }
        
    });
}

function movePlayer(direction) {
    const player = document.querySelector('.playerShip');
    
    if (player) {
        const currentRow = player.parentElement.rowIndex;
        const currentCol = player.cellIndex;
        switch (direction) {
            case 'w':
                if (gameProps.remainingShots >0) {
                    const aboveCell = getNextCell('above', currentRow, currentCol);
                    if (cellIsEmpty(aboveCell)) {
                        drawPlayerBullet(aboveCell);
                        gameProps.remainingShots--;
                    } else if (aboveCell.innerText === enemyBullet) {
                        drawBothBullets(aboveCell);
                        gameProps.remainingShots--;
                    } else if (aboveCell.innerText === enemyShip) {
                        killEnemy(aboveCell);
                    }
                }

            break;
            case 'a':
                const leftCell = getNextCell('left', currentRow, currentCol);
                if (cellIsEmpty(leftCell)) {
                    moveCell(player, leftCell);
                }
            break;
            case 'd':
                const rightCell = getNextCell('right', currentRow, currentCol);
                if (cellIsEmpty(rightCell)) {
                    moveCell(player, rightCell);
                }
            break;
        }
    }
}