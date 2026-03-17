import { ScorePlayer } from "./player.js";
import { parseScore } from "./score.js";

const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 600;
const FLOOR_Y = 500;

const ui = {
  playButton: document.getElementById("playButton"),
  pauseButton: document.getElementById("pauseButton"),
  stopButton: document.getElementById("stopButton"),
  resetButton: document.getElementById("resetButton"),
  jsonFileInput: document.getElementById("jsonFileInput"),
  currentTime: document.getElementById("currentTime"),
  totalTime: document.getElementById("totalTime"),
  playbackStatus: document.getElementById("playbackStatus"),
  timelineProgress: document.getElementById("timelineProgress"),
  timelineCursor: document.getElementById("timelineCursor"),
  scoreTitle: document.getElementById("scoreTitle"),
};

let player = null;
let p5Instance = null;

initialize().catch((error) => {
  console.error("Failed to initialize app:", error);
  ui.scoreTitle.textContent = "Failed to load score";
});

async function initialize() {
  bindUIEvents();

  const response = await fetch("./data/sample-score.json");
  if (!response.ok) {
    throw new Error(`Could not load sample score: ${response.status}`);
  }

  const rawScore = await response.json();
  loadScoreIntoPlayer(rawScore);
  createSketch();
}

function bindUIEvents() {
  ui.playButton.addEventListener("click", () => player?.play());
  ui.pauseButton.addEventListener("click", () => player?.pause());
  ui.stopButton.addEventListener("click", () => player?.stop());
  ui.resetButton.addEventListener("click", () => player?.reset());

  ui.jsonFileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const rawScore = JSON.parse(rawText);
      loadScoreIntoPlayer(rawScore);
      event.target.value = "";
    } catch (error) {
      console.error("Failed to load selected JSON file:", error);
      alert("Failed to load JSON. Please check the file format.");
    }
  });
}

function loadScoreIntoPlayer(rawScore) {
  const parsedScore = parseScore(rawScore);

  if (player) {
    player.setScore(parsedScore);
  } else {
    player = new ScorePlayer(parsedScore, {
      stageWidth: STAGE_WIDTH,
      stageHeight: STAGE_HEIGHT,
      floorY: FLOOR_Y,
    });
  }

  ui.scoreTitle.textContent = parsedScore.meta.title;
  ui.totalTime.textContent = `${parsedScore.time.duration.toFixed(2)}s`;
  updateUI();
}

function createSketch() {
  if (p5Instance) {
    p5Instance.remove();
  }

  p5Instance = new p5((p) => {
    p.setup = () => {
      const canvas = p.createCanvas(STAGE_WIDTH, STAGE_HEIGHT);
      canvas.parent("canvas-container");
    };

    p.draw = () => {
      if (!player) {
        return;
      }

      player.update(p.millis());
      player.draw(p);
      updateUI();
    };
  });
}

function updateUI() {
  if (!player) {
    return;
  }

  const currentTime = player.getCurrentTime();
  const progressPercent = player.getProgress() * 100;

  ui.currentTime.textContent = `${currentTime.toFixed(2)}s`;
  ui.playbackStatus.textContent = player.getStatusLabel();
  ui.timelineProgress.style.width = `${progressPercent}%`;
  ui.timelineCursor.style.left = `${progressPercent}%`;
}
