import React, { useEffect } from 'react';
import { init } from './game/game';
import './index.css';

function App() {
  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <div className="modal" id="modal1">
        <div className="modal-dialog">
          <section className="modal-header">Game Over!
            <button className="close-modal" aria-label="close modal" id="closeModal1">✕</button>
          </section>
          <section className="modal-content" id="modal1Content">
            <div id="modal-message"></div>
            <div className="scoresForm">
              <label htmlFor="userName">Enter your name: </label>
              <input type="text" name="userName" id="nameInput" />
              <button id="submitScoreBtn" type="submit">Submit</button>
            </div>
          </section>
        </div>
      </div>
      <header>
        <h1 id="gameTitle">SpaceKiller</h1>
        <p>A port of a pascal game that some university friends made after class</p>
      </header>
      <section className="game">
        <div className="displaysContainer">
          <div className="label" id="livesDisplay">Lives: </div>
          <div className="label" id="scoreDisplay">Score: </div>
          <div className="label" id="levelDisplay">Level: </div>
          <div className="label" id="enemiesDisplay">Enemies: </div>
        </div>
        <table className="spaceTable">
          <tbody id="spaceBody">
            <tr>
              <td>Loading...</td>
            </tr>
          </tbody>
        </table>

        <div className="shotsLabel" id="remainingShots"></div>

        <div className="gameButtons">
          <button id="startBtn">Start Game / Reset</button>
          <button id="pauseBtn">Pause</button>
          <button id="muteBtn">Mute</button>
        </div>
        <div className="gameControls">
          <button id="wbtn">W</button>
          <div>
            <button id="abtn">A</button>
            <button id="dbtn">D</button>
          </div>
        </div>
      </section>
      <section className="highScores">
        <h2>High Scores</h2>
        <table className="scoresTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody id="scoresTableBody">
            <tr>
              <td colSpan="3" id="toRemoveTD">No Scores Submitted yet!</td>
            </tr>
          </tbody>
        </table>
      </section>
      <footer>
        <p>Version original en Pascal realizada por: Jorge Pastorino y Lucas Kruk. Colaboracion de Juan Urruspuru y Matias Rapallini</p>
        <p>Remake en JS por Lucas Kruk</p>
        <a href="./download/spacek.zip" download="spaceKiller">Dowload Original Game</a>
      </footer>
    </>
  );
}

export default App;
