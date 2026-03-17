(function () {
const PALETTE = [
  { body: "#1c6dd0", accent: "#8ec5ff" },
  { body: "#d97706", accent: "#fdba74" },
  { body: "#059669", accent: "#6ee7b7" },
  { body: "#c2410c", accent: "#fdba74" },
  { body: "#7c3aed", accent: "#c4b5fd" },
];

class Dancer {
  constructor({ id, label, lane, initialX, baseY, colorIndex }) {
    this.id = id;
    this.label = label;
    this.lane = lane;
    this.initialX = initialX;
    this.baseY = baseY;
    this.x = initialX;
    this.direction = 1;
    this.motionState = createDefaultMotionState();
    this.colors = PALETTE[colorIndex % PALETTE.length];
  }

  reset() {
    this.x = this.initialX;
    this.direction = 1;
    this.motionState = createDefaultMotionState();
  }

  updateFromEvent(event, currentTime) {
    const progress = getEventProgress(event, currentTime);
    const duration = Math.max(event.t_end - event.t_start, 0.0001);

    this.motionState = createDefaultMotionState();
    this.motionState.speechText = resolveSpeechText(event, currentTime);
    this.motionState.annotation = event.description || "";

    switch (event.type) {
      case "walk":
        this.applyWalk(event, progress, duration, currentTime);
        break;
      case "jump":
        this.applyJump(progress, currentTime);
        break;
      case "turn":
        this.applyTurn(progress, currentTime);
        break;
      case "sit":
        this.applySit(progress, currentTime);
        break;
      case "fall":
        this.applyFall(progress, currentTime);
        break;
      case "idle":
      default:
        this.applyIdle(currentTime);
        break;
    }
  }

  applyIdle(currentTime) {
    this.motionState.bounce = Math.sin(currentTime * 2.4) * 2;
    this.motionState.armSwing = Math.sin(currentTime * 2) * 0.08;
    this.motionState.legSwing = -this.motionState.armSwing * 0.5;
  }

  applyWalk(event, progress, duration, currentTime) {
    const dir = event.direction === "left" ? -1 : 1;
    const distance = Math.max(45, duration * 22);
    this.direction = dir;
    this.x = this.initialX + dir * distance * progress;
    this.motionState.bounce = Math.abs(Math.sin(progress * Math.PI * 4)) * -7;
    this.motionState.armSwing = Math.sin(progress * Math.PI * 6) * 0.85;
    this.motionState.legSwing = Math.sin(progress * Math.PI * 6 + Math.PI) * 0.95;
    this.motionState.headTilt = Math.sin(currentTime * 3) * 0.03;
  }

  applyJump(progress, currentTime) {
    this.motionState.jumpLift = Math.sin(progress * Math.PI) * 62;
    this.motionState.armSwing = -0.45;
    this.motionState.legSwing = 0.35;
    this.motionState.bounce = Math.sin(currentTime * 6) * 1.5;
  }

  applyTurn(progress, currentTime) {
    const turnPhase = Math.sin(progress * Math.PI);
    this.motionState.scaleX = Math.max(0.15, Math.abs(Math.cos(progress * Math.PI)));
    this.motionState.armSwing = Math.sin(currentTime * 5) * 0.3;
    this.motionState.legSwing = Math.sin(currentTime * 5 + Math.PI / 3) * 0.18;
    this.motionState.headTilt = turnPhase * 0.15;
    this.direction = progress < 0.5 ? 1 : -1;
  }

  applySit(progress, currentTime) {
    this.motionState.bodyHeightScale = 1 - progress * 0.35;
    this.motionState.hipDrop = progress * 36;
    this.motionState.kneeBend = 0.9;
    this.motionState.armSwing = Math.sin(currentTime * 2) * 0.06;
    this.motionState.headTilt = -0.08;
  }

  applyFall(progress) {
    this.motionState.bodyRotation = progress * (Math.PI / 2.8);
    this.motionState.hipDrop = progress * 16;
    this.motionState.armSwing = 0.35;
    this.motionState.legSwing = -0.25;
    this.motionState.headTilt = progress * 0.18;
  }

  draw(p) {
    const state = this.motionState;
    const scaleX = this.direction * state.scaleX;
    const bodyHeight = 82 * state.bodyHeightScale;
    const hipY = this.baseY - 34 + state.bounce - state.jumpLift + state.hipDrop * 0.2;
    const torsoTopOffset = -bodyHeight;
    const shoulderOffset = torsoTopOffset + 18;
    const headOffset = torsoTopOffset - 22;
    const armLength = 34;
    const legLength = 42;

    p.push();
    p.translate(this.x, hipY);
    p.scale(scaleX, 1);
    p.rotate(state.bodyRotation);

    p.stroke(this.colors.body);
    p.strokeWeight(5);
    p.noFill();

    p.fill("#ffffff");
    p.stroke(this.colors.body);
    p.circle(0, headOffset, 26);

    p.line(0, torsoTopOffset, 0, 0);

    drawLimb(p, 0, shoulderOffset, armLength, -0.8 + state.armSwing, this.colors.accent);
    drawLimb(p, 0, shoulderOffset, armLength, 0.8 - state.armSwing, this.colors.accent);

    drawLeg(p, 0, 0, legLength, -0.25 + state.legSwing, state.kneeBend, this.colors.body);
    drawLeg(p, 0, 0, legLength, 0.25 - state.legSwing, state.kneeBend, this.colors.body);
    p.pop();

    p.push();
    p.noStroke();
    p.fill(49, 65, 88);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(15);
    p.text(this.label, this.x, this.baseY + 28);
    p.pop();

    if (state.speechText) {
      drawSpeechBubble(p, this.x, headOffset + hipY - 44, state.speechText, this.colors.body);
    }
  }
}

function drawLimb(p, startX, startY, length, angle, strokeColor) {
  const endX = startX + Math.sin(angle) * length;
  const endY = startY + Math.cos(angle) * length;
  p.stroke(strokeColor);
  p.line(startX, startY, endX, endY);
}

function drawLeg(p, startX, startY, length, angle, kneeBend, strokeColor) {
  const kneeX = startX + Math.sin(angle) * (length * 0.48);
  const kneeY = startY + Math.cos(angle) * (length * 0.48);
  const footX = kneeX + Math.sin(angle + kneeBend * 0.45) * (length * 0.52);
  const footY = kneeY + Math.cos(angle + kneeBend * 0.45) * (length * 0.52);

  p.stroke(strokeColor);
  p.line(startX, startY, kneeX, kneeY);
  p.line(kneeX, kneeY, footX, footY);
}

function getEventProgress(event, currentTime) {
  const duration = Math.max(event.t_end - event.t_start, 0.0001);
  return Math.min(Math.max((currentTime - event.t_start) / duration, 0), 1);
}

function createDefaultMotionState() {
  return {
    bounce: 0,
    jumpLift: 0,
    armSwing: 0,
    legSwing: 0,
    headTilt: 0,
    bodyRotation: 0,
    bodyHeightScale: 1,
    hipDrop: 0,
    kneeBend: 0.25,
    scaleX: 1,
    speechText: "",
    annotation: "",
  };
}

function resolveSpeechText(event, currentTime) {
  if (Array.isArray(event?.items) && event.items.length) {
    const activeItem = event.items
      .map((item) => ({ ...item, t: Number(item?.t) }))
      .filter((item) => Number.isFinite(item.t) && typeof item.text === "string")
      .sort((a, b) => a.t - b.t)
      .find((item, index, array) => {
        const nextTime = index < array.length - 1 ? array[index + 1].t : event.t_end;
        return currentTime >= item.t && currentTime < nextTime;
      });

    return activeItem?.text || event.speechText || "";
  }

  return event?.speechText || "";
}

function drawSpeechBubble(p, x, y, text, strokeColor) {
  p.push();
  p.textSize(13);
  p.textAlign(p.CENTER, p.CENTER);
  const bubbleWidth = Math.max(56, p.textWidth(text) + 24);
  const bubbleHeight = 32;

  p.fill(255, 255, 255, 235);
  p.stroke(strokeColor);
  p.strokeWeight(2);
  p.rect(x - bubbleWidth / 2, y - bubbleHeight / 2, bubbleWidth, bubbleHeight, 14);
  p.triangle(x - 6, y + bubbleHeight / 2 - 1, x + 6, y + bubbleHeight / 2 - 1, x, y + bubbleHeight / 2 + 10);

  p.noStroke();
  p.fill(31, 42, 55);
  p.text(text, x, y);
  p.pop();
}

window.DanceScoreApp = window.DanceScoreApp || {};
window.DanceScoreApp.Dancer = Dancer;
})();
