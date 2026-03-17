(function () {
const SUPPORTED_MOVEMENT_TYPES = new Set(["idle", "walk", "jump", "turn", "sit", "fall"]);

function parseScore(rawData) {
  if (!rawData || typeof rawData !== "object") {
    throw new Error("JSON root must be an object.");
  }

  const meta = rawData.meta ?? {};
  const time = rawData.time ?? {};
  const lanes = Array.isArray(rawData.lanes) ? rawData.lanes : [];
  const score = rawData.score ?? {};

  if (!lanes.length) {
    throw new Error("JSON must contain at least one lane.");
  }

  const duration = Number(time.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("time.duration must be a positive number.");
  }

  const normalizedLanes = lanes.map((lane, index) => {
    if (!lane?.id) {
      throw new Error(`lanes[${index}] is missing id.`);
    }

    const laneScore = score[lane.id];
    const events = Array.isArray(laneScore?.events) ? laneScore.events : [];

    return {
      id: lane.id,
      label: lane.label || lane.id,
      events: events
        .map((event, eventIndex) => normalizeEvent(event, lane.id, eventIndex))
        .sort((a, b) => a.t_start - b.t_start),
    };
  });

  return {
    meta: {
      title: meta.title || "Untitled Dance Score",
    },
    time: {
      duration,
      unit: time.unit || "seconds",
    },
    lanes: normalizedLanes,
    score,
  };
}

function getActiveMovementEvent(lane, currentTime) {
  if (!lane?.events?.length) {
    return createIdleEvent(currentTime);
  }

  const activeEvent = lane.events.find((event) => currentTime >= event.t_start && currentTime < event.t_end);
  return activeEvent || createIdleEvent(currentTime);
}

function getTimelineProgress(currentTime, duration) {
  if (!duration || duration <= 0) {
    return 0;
  }

  return Math.min(Math.max(currentTime / duration, 0), 1);
}

function normalizeEvent(event, laneId, eventIndex) {
  const t_start = Number(event?.t_start);
  const t_end = Number(event?.t_end);
  const type = typeof event?.type === "string" ? event.type : "idle";
  const eventType = typeof event?.eventType === "string" ? event.eventType : "movement";

  if (!Number.isFinite(t_start) || !Number.isFinite(t_end) || t_end < t_start) {
    throw new Error(`Invalid event timing in lane "${laneId}" at index ${eventIndex}.`);
  }

  if (eventType !== "movement") {
    return {
      ...event,
      t_start,
      t_end,
      type: "idle",
      eventType,
    };
  }

  if (!SUPPORTED_MOVEMENT_TYPES.has(type)) {
    console.warn(`Unknown movement type "${type}" in lane "${laneId}". Falling back to idle.`);
  }

  return {
    ...event,
    t_start,
    t_end,
    type: SUPPORTED_MOVEMENT_TYPES.has(type) ? type : "idle",
    direction: event?.direction === "left" ? "left" : "right",
    eventType,
  };
}

function createIdleEvent(time) {
  return {
    t_start: time,
    t_end: time,
    type: "idle",
    direction: "right",
    eventType: "movement",
  };
}

window.DanceScoreApp = window.DanceScoreApp || {};
window.DanceScoreApp.parseScore = parseScore;
window.DanceScoreApp.getActiveMovementEvent = getActiveMovementEvent;
window.DanceScoreApp.getTimelineProgress = getTimelineProgress;
})();
