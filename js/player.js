(function () {
const { getActiveMovementEvent, getTimelineProgress, Dancer } = window.DanceScoreApp;

class ScorePlayer {
  constructor(scoreData, options = {}) {
    this.stageWidth = options.stageWidth ?? 1000;
    this.stageHeight = options.stageHeight ?? 600;
    this.floorY = options.floorY ?? 500;
    this.scoreData = scoreData;
    this.currentTime = 0;
    this.isPlaying = false;
    this.lastTickMillis = 0;
    this.dancers = [];
    this.setScore(scoreData);
  }

  setScore(scoreData) {
    this.scoreData = scoreData;
    this.currentTime = 0;
    this.isPlaying = false;
    this.lastTickMillis = 0;
    this.dancers = this.createDancers(scoreData.lanes);
    this.updateDancersForCurrentTime();
  }

  createDancers(lanes) {
    const spacing = this.stageWidth / (lanes.length + 1);

    return lanes.map((lane, index) => {
      const startX = Number.isFinite(lane.startX) ? lane.startX : spacing * (index + 1);
      return new Dancer({
        id: lane.id,
        label: lane.label,
        lane,
        initialX: startX,
        baseY: this.floorY,
        colorIndex: index,
      });
    });
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.lastTickMillis = 0;
    this.resetDancers();
  }

  reset() {
    this.stop();
  }

  update(millisNow) {
    if (!this.isPlaying) {
      this.lastTickMillis = millisNow;
      this.updateDancersForCurrentTime();
      return;
    }

    if (this.lastTickMillis === 0) {
      this.lastTickMillis = millisNow;
    }

    const deltaSeconds = Math.max((millisNow - this.lastTickMillis) / 1000, 0);
    this.lastTickMillis = millisNow;
    this.currentTime += deltaSeconds;

    if (this.currentTime >= this.scoreData.time.duration) {
      this.currentTime = this.scoreData.time.duration;
      this.isPlaying = false;
    }

    this.updateDancersForCurrentTime();
  }

  draw(p) {
    this.drawStage(p);
    this.dancers.forEach((dancer) => dancer.draw(p));
  }

  drawStage(p) {
    const outerX = 24;
    const outerY = 24;
    const outerW = this.stageWidth - 48;
    const outerH = this.stageHeight - 48;
    const wingWidth = 120;
    const stageX = outerX + wingWidth;
    const stageW = outerW - wingWidth * 2;

    p.push();
    p.noStroke();
    p.background(248, 251, 255);

    p.fill(234, 241, 250);
    p.rect(outerX, outerY, outerW, outerH, 24);

    p.fill(222, 229, 240);
    p.rect(outerX + 18, outerY + 18, wingWidth - 18, outerH - 36, 20, 0, 0, 20);
    p.rect(stageX + stageW, outerY + 18, wingWidth - 18, outerH - 36, 0, 20, 20, 0);

    p.fill(206, 218, 235);
    p.rect(stageX, outerY + 18, stageW, outerH - 36, 20);

    p.fill(198, 210, 228);
    p.rect(48, this.floorY + 10, this.stageWidth - 96, 46, 18);

    p.stroke(133, 153, 180);
    p.strokeWeight(2);
    p.line(48, this.floorY, this.stageWidth - 48, this.floorY);

    p.stroke(167, 181, 201);
    p.strokeWeight(1);
    p.line(stageX, outerY + 32, stageX, this.floorY + 56);
    p.line(stageX + stageW, outerY + 32, stageX + stageW, this.floorY + 56);

    p.noStroke();
    p.fill(90, 108, 132);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`Title: ${this.scoreData.meta.title}`, 48, 42);
    p.text(`Duration: ${this.scoreData.time.duration.toFixed(2)} ${this.scoreData.time.unit}`, 48, 62);
    if (this.scoreData.meta.choreographer) {
      p.text(`Choreographer: ${this.scoreData.meta.choreographer}`, 48, 82);
    }
    if (this.scoreData.meta.date) {
      p.text(`Date: ${this.scoreData.meta.date}`, 48, 102);
    }
    if (this.scoreData.meta.interpretation_choreographer || this.scoreData.meta.source_label) {
      p.textSize(12);
      p.text(`Sample note: JSONized interpretation of Anna Halprin's score "The Five Legged Stool".`, 48, 124);
      p.text(`Source: ${this.scoreData.meta.source_label}`, 48, 142);
    }

    p.fill(96, 109, 129);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("WING", outerX + wingWidth / 2 + 6, this.floorY + 30);
    p.text("STAGE", stageX + stageW / 2, this.floorY + 30);
    p.text("WING", stageX + stageW + wingWidth / 2 - 6, this.floorY + 30);
    p.pop();
  }

  updateDancersForCurrentTime() {
    this.dancers.forEach((dancer) => {
      const activeEvent = getActiveMovementEvent(dancer.lane, this.currentTime);
      dancer.updateFromEvent(activeEvent, this.currentTime);
    });
  }

  resetDancers() {
    this.dancers.forEach((dancer) => dancer.reset());
    this.updateDancersForCurrentTime();
  }

  getCurrentTime() {
    return this.currentTime;
  }

  getDuration() {
    return this.scoreData.time.duration;
  }

  getProgress() {
    return getTimelineProgress(this.currentTime, this.scoreData.time.duration);
  }

  getStatusLabel() {
    if (this.isPlaying) {
      return "Playing";
    }

    if (this.currentTime === 0) {
      return "Stopped";
    }

    if (this.currentTime >= this.scoreData.time.duration) {
      return "Finished";
    }

    return "Paused";
  }
}

window.DanceScoreApp = window.DanceScoreApp || {};
window.DanceScoreApp.ScorePlayer = ScorePlayer;
})();
