const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 600;
const FLOOR_Y = 500;
const { ScorePlayer, parseScore } = window.DanceScoreApp;

const ui = {
  playButton: document.getElementById("playButton"),
  pauseButton: document.getElementById("pauseButton"),
  stopButton: document.getElementById("stopButton"),
  resetButton: document.getElementById("resetButton"),
  applyJsonButton: document.getElementById("applyJsonButton"),
  restoreSampleButton: document.getElementById("restoreSampleButton"),
  jsonInput: document.getElementById("jsonInput"),
  currentTime: document.getElementById("currentTime"),
  totalTime: document.getElementById("totalTime"),
  playbackStatus: document.getElementById("playbackStatus"),
  timelineProgress: document.getElementById("timelineProgress"),
  timelineCursor: document.getElementById("timelineCursor"),
  scoreTitle: document.getElementById("scoreTitle"),
};

let player = null;
let p5Instance = null;
let bundledSampleScore = null;

initialize().catch((error) => {
  console.error("Failed to initialize app:", error);
  ui.scoreTitle.textContent = "Failed to load score";
});

async function initialize() {
  bindUIEvents();

  const rawScore = await loadInitialScore();
  bundledSampleScore = rawScore;
  syncEditorWithScore(rawScore);
  loadScoreIntoPlayer(rawScore);
  createSketch();
}

function bindUIEvents() {
  ui.playButton.addEventListener("click", () => player?.play());
  ui.pauseButton.addEventListener("click", () => player?.pause());
  ui.stopButton.addEventListener("click", () => player?.stop());
  ui.resetButton.addEventListener("click", () => player?.reset());
  ui.applyJsonButton.addEventListener("click", applyEditorJson);
  ui.restoreSampleButton.addEventListener("click", () => {
    if (!bundledSampleScore) {
      return;
    }

    syncEditorWithScore(bundledSampleScore);
    loadScoreIntoPlayer(bundledSampleScore);
  });
}

function applyEditorJson() {
  try {
    const rawScore = JSON.parse(ui.jsonInput.value);
    loadScoreIntoPlayer(rawScore);
  } catch (error) {
    console.error("Failed to parse JSON from editor:", error);
    alert("Failed to parse JSON. Please check the text in the editor.");
  }
}

async function loadInitialScore() {
  try {
    const response = await fetch("./data/sample-score.json");
    if (!response.ok) {
      throw new Error(`Could not load sample score: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Falling back to embedded sample score:", error);
    const embeddedSample = document.getElementById("embeddedSampleScore");

    if (!embeddedSample?.textContent) {
      throw error;
    }

    return JSON.parse(embeddedSample.textContent);
  }
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

function syncEditorWithScore(rawScore) {
  ui.jsonInput.value = JSON.stringify(rawScore, null, 2);
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
