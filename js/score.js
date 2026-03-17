(function () {
const SUPPORTED_MOVEMENT_TYPES = new Set(["idle", "walk", "jump", "turn", "sit", "fall"]);

function parseScore(rawData) {
  if (!rawData || typeof rawData !== "object") {
    throw new Error("JSON root must be an object.");
  }

  const rootData = rawData.performance_json ?? rawData;
  const meta = rootData.meta ?? {};
  const time = rootData.time ?? {};
  const lanes = Array.isArray(rootData.lanes) ? rootData.lanes : [];
  const score = rootData.score ?? {};

  if (!lanes.length) {
    throw new Error("JSON must contain at least one lane.");
  }

  const timeline = normalizeTimeline(time);

  const normalizedLanes = lanes.map((lane, index) => {
    if (!lane?.id) {
      throw new Error(`lanes[${index}] is missing id.`);
    }

    const laneScore = score[lane.id];
    const events = Array.isArray(laneScore?.events) ? laneScore.events : [];

    return {
      id: lane.id,
      label: lane.label || lane.id,
      startX: Number.isFinite(Number(lane.startX)) ? Number(lane.startX) : null,
      note: laneScore?.note || "",
      events: events
        .map((event, eventIndex) => normalizeEvent(event, lane.id, eventIndex, timeline))
        .sort((a, b) => a.t_start - b.t_start),
    };
  });

  return {
    meta: {
      title: meta.title || "Untitled Dance Score",
      choreographer: meta.choreographer || "",
      date: meta.date || "",
      source_note: meta.source_note || "",
      schema: rawData.schema || "dance_score",
      adaptation_mode: meta.adaptation_mode || "",
      interpretation_summary: rawData.interpretation_note?.summary || "",
      interpretation_intent: rawData.interpretation_note?.dominant_intent || "",
      interpretation_choreographer: rawData.interpretation_note?.choreographer || "",
      source_url: rawData.source_url || rawData.source_link || "https://annahalprindigitalarchive.omeka.net/exhibits/show/san-francisco-dancers-workshop/item/312",
      source_label: rawData.source_label || "Anna Halprin Digital Archive / The Five Legged Stool",
    },
    time: {
      duration: timeline.duration,
      unit: timeline.unit,
      axis: time.axis || "horizontal",
      ticks: timeline.ticks,
    },
    lanes: normalizedLanes,
    score,
  };
}

function getActiveMovementEvent(lane, currentTime) {
  return getActiveEventByType(lane, currentTime, "movement") || createIdleEvent(currentTime);
}

function getActiveSpeechEvent(lane, currentTime) {
  return getActiveEventByType(lane, currentTime, "speech");
}

function getTimelineProgress(currentTime, duration) {
  if (!duration || duration <= 0) {
    return 0;
  }

  return Math.min(Math.max(currentTime / duration, 0), 1);
}

function normalizeEvent(event, laneId, eventIndex, timeline) {
  const t_start = normalizeTimeValue(event?.t_start, timeline);
  const t_end = normalizeTimeValue(event?.t_end, timeline);
  const sourceType = typeof event?.type === "string" ? event.type : "idle";
  const normalizedType = normalizeMovementType(sourceType, event);
  const eventType = normalizeEventType(sourceType, event);
  const normalizedItems = normalizeSpeechItems(event?.items, timeline);
  const speechText = getSpeechText(normalizedItems);

  if (!Number.isFinite(t_start) || !Number.isFinite(t_end) || t_end < t_start) {
    throw new Error(`Invalid event timing in lane "${laneId}" at index ${eventIndex}.`);
  }

  if (!SUPPORTED_MOVEMENT_TYPES.has(normalizedType)) {
    console.warn(`Unknown movement type "${sourceType}" in lane "${laneId}". Falling back to idle.`);
  }

  return {
    ...event,
    t_start,
    t_end,
    sourceType,
    type: SUPPORTED_MOVEMENT_TYPES.has(normalizedType) ? normalizedType : "idle",
    direction: normalizeDirection(event),
    eventType,
    description: getEventDescription(event),
    quality: typeof event?.quality === "string" ? event.quality : "",
    speechText,
    items: normalizedItems,
    certainty: event?.certainty || "",
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

function normalizeTimeline(time) {
  const explicitDuration = Number(time.duration);
  const ticks = Array.isArray(time.ticks) ? time.ticks.map((tick) => Number(tick)).filter((tick) => Number.isFinite(tick)) : [];

  if (Number.isFinite(explicitDuration) && explicitDuration > 0) {
    return {
      duration: explicitDuration,
      unit: time.unit || "seconds",
      ticks,
    };
  }

  if (ticks.length >= 2) {
    return {
      duration: ticks[ticks.length - 1] - ticks[0],
      unit: time.unit || "score_ticks",
      ticks,
    };
  }

  throw new Error("time.duration or time.ticks must define a positive timeline.");
}

function normalizeTimeValue(value, timeline) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return NaN;
  }

  if (timeline.ticks.length >= 2 && timeline.unit === "score_ticks") {
    return numeric - timeline.ticks[0];
  }

  return numeric;
}

function normalizeEventType(sourceType, event) {
  if (typeof event?.eventType === "string") {
    return event.eventType;
  }

  if (sourceType === "speech_sequence") {
    return "speech";
  }

  if (sourceType === "pathway" || sourceType === "movement_phrase") {
    return "movement";
  }

  return "movement";
}

function normalizeMovementType(sourceType, event) {
  if (event?.eventType === "speech") {
    return "idle";
  }

  if (event?.eventType === "object") {
    return event?.action === "carry" || event?.action === "enter" || event?.action === "reposition" ? "walk" : "idle";
  }

  if (SUPPORTED_MOVEMENT_TYPES.has(sourceType)) {
    return sourceType;
  }

  const text = `${event?.description || ""} ${event?.path?.description || ""} ${event?.note || ""}`.toLowerCase();

  if (sourceType === "speech_sequence") {
    return "idle";
  }

  if (sourceType === "pathway") {
    return "walk";
  }

  if (sourceType === "stand") {
    return "idle";
  }

  if (text.includes("fall")) {
    return "fall";
  }

  if (text.includes("jump")) {
    return "jump";
  }

  if (text.includes("turn")) {
    return "turn";
  }

  if (text.includes("sit") || text.includes("low")) {
    return "sit";
  }

  if (text.includes("step") || text.includes("path") || text.includes("moving")) {
    return "walk";
  }

  return "idle";
}

function normalizeDirection(event) {
  if (event?.direction === "left" || event?.direction === "right") {
    return event.direction;
  }

  const text = `${event?.description || ""} ${event?.path?.description || ""}`.toLowerCase();
  if (text.includes("stage-left") || text.includes("stage left") || text.includes("left")) {
    return "left";
  }

  if (text.includes("stage-right") || text.includes("stage right") || text.includes("right")) {
    return "right";
  }

  return "right";
}

function normalizeSpeechItems(items, timeline) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      ...item,
      t: normalizeTimeValue(item?.t, timeline),
    }))
    .filter((item) => Number.isFinite(item.t) && typeof item.text === "string")
    .sort((a, b) => a.t - b.t);
}

function getSpeechText(items) {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  const firstItem = items[0];

  if (!firstItem) {
    return "";
  }

  return firstItem.text;
}

function getEventDescription(event) {
  if (typeof event?.text === "string" && event.text) {
    return event.text;
  }

  if (typeof event?.description === "string" && event.description) {
    return event.description;
  }

  if (typeof event?.note === "string" && event.note) {
    return event.note;
  }

  if (typeof event?.path?.description === "string" && event.path.description) {
    return event.path.description;
  }

  return "";
}

function getActiveEventByType(lane, currentTime, eventType) {
  if (!lane?.events?.length) {
    return null;
  }

  return lane.events.find((event) => (
    event.eventType === eventType
    && currentTime >= event.t_start
    && currentTime < event.t_end
  )) || null;
}

window.DanceScoreApp = window.DanceScoreApp || {};
window.DanceScoreApp.parseScore = parseScore;
window.DanceScoreApp.getActiveMovementEvent = getActiveMovementEvent;
window.DanceScoreApp.getActiveSpeechEvent = getActiveSpeechEvent;
window.DanceScoreApp.getTimelineProgress = getTimelineProgress;
})();
