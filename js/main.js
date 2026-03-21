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
  sampleSelect: document.getElementById("sampleSelect"),
  sampleSourceLink: document.getElementById("sampleSourceLink"),
};

let player = null;
let p5Instance = null;
const bundledSamples = new Map();
const sampleCatalog = [
  {
    id: "depth",
    label: "The Five Legged Stool",
    embeddedId: "embeddedSampleScore",
    path: "./data/sample-score.json",
  },
  {
    id: "anton",
    label: "アントン、猫、クリ",
    embeddedId: "embeddedAntonScore",
    path: "./data/test-patterns/anton-neko-kuri-opening.json",
  },
];

initialize().catch((error) => {
  console.error("Failed to initialize app:", error);
  ui.scoreTitle.textContent = "Failed to load score";
});

async function initialize() {
  bindUIEvents();
  populateSampleOptions();

  const defaultSampleId = ui.sampleSelect.value || sampleCatalog[0].id;
  const rawScore = await loadSampleById(defaultSampleId);
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
  ui.restoreSampleButton.addEventListener("click", restoreSelectedSample);
  ui.sampleSelect.addEventListener("change", handleSampleChange);
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

async function handleSampleChange() {
  try {
    const rawScore = await loadSampleById(ui.sampleSelect.value);
    syncEditorWithScore(rawScore);
    loadScoreIntoPlayer(rawScore);
  } catch (error) {
    console.error("Failed to switch sample:", error);
    ui.scoreTitle.textContent = "Failed to switch sample";
    alert("Failed to load the selected sample.");
  }
}

function restoreSelectedSample() {
  const sampleId = ui.sampleSelect.value;
  const rawScore = bundledSamples.get(sampleId);

  if (!rawScore) {
    return;
  }

  syncEditorWithScore(rawScore);
  loadScoreIntoPlayer(rawScore);
}

function populateSampleOptions() {
  ui.sampleSelect.innerHTML = sampleCatalog
    .map((sample) => `<option value="${sample.id}">${sample.label}</option>`)
    .join("");
}

async function loadSampleById(sampleId) {
  if (bundledSamples.has(sampleId)) {
    return bundledSamples.get(sampleId);
  }

  const sample = sampleCatalog.find((entry) => entry.id === sampleId) || sampleCatalog[0];
  const embeddedSample = document.getElementById(sample.embeddedId);

  if (embeddedSample?.textContent) {
    const rawScore = JSON.parse(embeddedSample.textContent);
    bundledSamples.set(sample.id, rawScore);
    return rawScore;
  }

  if (!sample.path) {
    throw new Error(`No sample source found for "${sample.id}".`);
  }

  const response = await fetch(sample.path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load sample score: ${response.status}`);
  }

  const rawScore = await response.json();
  bundledSamples.set(sample.id, rawScore);
  return rawScore;
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
  updateSampleSourceLink(parsedScore.meta);
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

function updateSampleSourceLink(meta) {
  if (!ui.sampleSourceLink) {
    return;
  }

  if (meta.source_url) {
    ui.sampleSourceLink.hidden = false;
    ui.sampleSourceLink.href = meta.source_url;
    ui.sampleSourceLink.textContent = meta.source_label || "Source";
    return;
  }

  ui.sampleSourceLink.hidden = true;
  ui.sampleSourceLink.removeAttribute("href");
}
