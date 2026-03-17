import { getActiveMovementEvent, getTimelineProgress } from "./score.js";
import { Dancer } from "./dancer.js";

export class ScorePlayer {
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
      const startX = spacing * (index + 1);
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
    p.push();
    p.noStroke();
    p.background(248, 251, 255);
    p.fill(234, 241, 250);
    p.rect(24, 24, this.stageWidth - 48, this.stageHeight - 48, 24);

    p.fill(226, 234, 244);
    p.rect(48, this.floorY + 10, this.stageWidth - 96, 46, 18);

    p.stroke(133, 153, 180);
    p.strokeWeight(2);
    p.line(48, this.floorY, this.stageWidth - 48, this.floorY);

    p.noStroke();
    p.fill(90, 108, 132);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`Title: ${this.scoreData.meta.title}`, 48, 42);
    p.text(`Duration: ${this.scoreData.time.duration.toFixed(2)} ${this.scoreData.time.unit}`, 48, 62);
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
