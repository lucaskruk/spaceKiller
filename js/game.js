/* Game Functions */

function init() {
    
    renderEmptyScreen();
    renderInitialHighScores();

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
    gameProps.lives = 5;
    gameProps.currentScore = 0;
    gameProps.level = 1;
    gameProps.waitTime = 550;
    gameProps.gameOver = false;
    gameProps.paused = false;
    gameProps.playerDied = false;
    gameProps.remainingShots = remainingBullets;
    playMusic();
    renderLevel();
    while (!gameProps.gameOver) {
        await sleep(gameProps.waitTime);
        if (!gameProps.paused && !gameProps.levelCleared && !gameProps.playerDied) {
            play();
        } else if (gameProps.levelCleared) {
            if (gameProps.level < lastLevel) {
            gameProps.level++;
            gameProps.currentScore += 500;
            gameProps.waitTime -= 40;
            gameProps.remainingShots = remainingBullets;
            sounds.levelComplete.play();
            await renderFilledScreen();
            renderLevel();
            gameProps.levelCleared = false;
            } else {
                gameProps.gameOver = true;
            } 
        } else if (gameProps.playerDied){
            await renderFilledScreen();
            renderLevel();
            gameProps.playerDied = false;
        }
    }
    await renderFilledScreen();
    stopMusic();
    if (gameProps.lives === 0) {
        sounds.lose.play();
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
    if (gameProps.enemies <= 0) {gameProps.levelCleared = true;}
    if (gameProps.lives === 0) { gameProps.gameOver = true;}   
}

init();
