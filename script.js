const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("video");
const statusEl = document.getElementById("status");

const startBtn = document.getElementById("startBtn");
const freezeBtn = document.getElementById("freezeBtn");
const resumeBtn = document.getElementById("resumeBtn");
const clearBtn = document.getElementById("clearBtn");
const savePngBtn = document.getElementById("savePngBtn");
const saveOverlayBtn = document.getElementById("saveOverlayBtn");
const enterBtn = document.getElementById("enterBtn");
const introOverlay = document.getElementById("introOverlay");

const widthSlider = document.getElementById("widthSlider");
const bloomSlider = document.getElementById("bloomSlider");
const smoothSlider = document.getElementById("smoothSlider");
const glowSlider = document.getElementById("glowSlider");
const hueSlider = document.getElementById("hueSlider");
const speedSlider = document.getElementById("speedSlider");
const modeBtns = document.querySelectorAll("[data-mode]");
const lineBtns = document.querySelectorAll("[data-line]");
const drawBtns = document.querySelectorAll("[data-draw]");
const colorBtns = document.querySelectorAll("[data-color]");

let w, h;

function resize() {
  const rect = canvas.getBoundingClientRect();
  w = canvas.width = rect.width;
  h = canvas.height = rect.height;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
}

window.addEventListener("load", resize);
window.addEventListener("resize", resize);
setTimeout(resize, 100);

const config = {
  mode: "mirror",
  lineStyle: "curve",
  drawMode: "line",
  autoColor: true,
  coreWidth: 0.6,
  bloom: 5,
  smoothness: 0.72,
  glow: 2.5,
  baseHue: 160,
  autoSpeed: 1,
  frozen: false,
  currentHue: 160,
  trailMap: {}
};

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    config.mode = btn.dataset.mode;
    config.trailMap = {};
  });
});

lineBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    lineBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    config.lineStyle = btn.dataset.line;
    config.trailMap = {};
  });
});

drawBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    drawBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    config.drawMode = btn.dataset.draw;
  });
});

colorBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    colorBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    config.autoColor = btn.dataset.color === "auto";
  });
});

widthSlider.addEventListener("input", () => {
  config.coreWidth = +widthSlider.value;
});

bloomSlider.addEventListener("input", () => {
  config.bloom = +bloomSlider.value;
});

smoothSlider.addEventListener("input", () => {
  config.smoothness = +smoothSlider.value;
});

glowSlider.addEventListener("input", () => {
  config.glow = +glowSlider.value;
});

hueSlider.addEventListener("input", () => {
  config.baseHue = +hueSlider.value;
  if (!config.autoColor) config.currentHue = config.baseHue;
});

speedSlider.addEventListener("input", () => {
  config.autoSpeed = +speedSlider.value;
});

clearBtn.addEventListener("click", () => {
  config.trailMap = {};
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
});

freezeBtn.addEventListener("click", () => {
  config.frozen = true;
  statusEl.textContent = "已定格｜可保存 VFX 参考图";
  freezeBtn.classList.add("active");
  resumeBtn.classList.remove("active");
});

resumeBtn.addEventListener("click", () => {
  config.frozen = false;
  statusEl.textContent = "继续绘制中";
  resumeBtn.classList.add("active");
  freezeBtn.classList.remove("active");
});

savePngBtn.addEventListener("click", () => {
  saveTracedImage(canvas, "echo-silk-vfx-reference");
});

saveOverlayBtn.addEventListener("click", () => {
  const temp = document.createElement("canvas");
  temp.width = w;
  temp.height = h;
  const tctx = temp.getContext("2d");

  tctx.drawImage(canvas, 0, 0);
  const imgData = tctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isDark = r < 16 && g < 16 && b < 16;

    if (isDark) {
      data[i + 3] = 0;
    }
  }

  tctx.putImageData(imgData, 0, 0);

  saveTracedImage(temp, "echo-silk-overlay");
});

function saveTracedImage(sourceCanvas, filenamePrefix) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = sourceCanvas.width;
  exportCanvas.height = sourceCanvas.height;
  const exportCtx = exportCanvas.getContext("2d");
  exportCtx.drawImage(sourceCanvas, 0, 0);

  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
  const traceId = Math.random().toString(36).slice(2, 8).toUpperCase();
  const fontSize = Math.min(20, Math.max(8, exportCanvas.width / 36));
  const padding = fontSize * 1.2;

  exportCtx.save();
  exportCtx.textAlign = "right";
  exportCtx.fillStyle = "rgba(255, 255, 255, 0.82)";
  exportCtx.shadowColor = "rgba(0, 0, 0, 0.9)";
  exportCtx.shadowBlur = 4;
  exportCtx.font = `600 ${fontSize}px sans-serif`;
  exportCtx.fillText("ECHO / SILK", exportCanvas.width - padding, exportCanvas.height - padding * 2);
  exportCtx.font = `${Math.max(8, fontSize * 0.7)}px sans-serif`;
  exportCtx.fillText(`TRACE ${timestamp}  ID ${traceId}`, exportCanvas.width - padding, exportCanvas.height - padding);
  exportCtx.restore();

  const link = document.createElement("a");
  link.download = `${filenamePrefix}-${timestamp}-${traceId}.png`;
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
  statusEl.textContent = `已导出｜留痕编号 ${traceId}`;
}

function updateAutoHue() {
  if (config.autoColor) {
    config.currentHue += config.autoSpeed;
    if (config.currentHue > 360) config.currentHue -= 360;
  }
  requestAnimationFrame(updateAutoHue);
}

updateAutoHue();

function getSymmetryPoints(x, y) {
  const cx = w / 2;
  const cy = h / 2;
  const list = [{ x, y }];

  if (config.mode === "mirror") {
    list.push({ x: cx - (x - cx), y });
  } else if (config.mode === "spiral") {
    const count = 6;
    const angle = (Math.PI * 2) / count;

    for (let i = 1; i < count; i++) {
      const ca = Math.cos(angle * i);
      const sa = Math.sin(angle * i);
      const dx = x - cx;
      const dy = y - cy;

      list.push({
        x: cx + dx * ca - dy * sa,
        y: cy + dx * sa + dy * ca
      });
    }
  } else if (config.mode === "cross") {
    list.push({ x: cx - (x - cx), y });
    list.push({ x, y: cy - (y - cy) });
    list.push({ x: cx - (x - cx), y: cy - (y - cy) });
  }

  return list;
}

function drawTrailPath(trail) {
  if (trail.length < 2) return;
  ctx.beginPath();

  if (config.lineStyle === "curve" && trail.length >= 3) {
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length - 1; i++) {
      const midX = (trail[i].x + trail[i + 1].x) / 2;
      const midY = (trail[i].y + trail[i + 1].y) / 2;
      ctx.quadraticCurveTo(trail[i].x, trail[i].y, midX, midY);
    }
    ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
  } else {
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }
  }
}

function drawSoftBloomLine(trail, hue) {
  if (trail.length < 2) return;
  const core = config.coreWidth;
  const bloom = config.bloom;
  const glow = config.glow;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  drawTrailPath(trail);
  ctx.strokeStyle = `hsla(${hue}, 100%, 58%, 0.07)`;
  ctx.lineWidth = bloom * 1.6;
  ctx.shadowBlur = glow * 1.2;
  ctx.shadowColor = `hsl(${hue}, 100%, 46%)`;
  ctx.stroke();

  drawTrailPath(trail);
  ctx.strokeStyle = `hsla(${hue}, 100%, 64%, 0.16)`;
  ctx.lineWidth = bloom * 0.8;
  ctx.shadowBlur = glow * 0.8;
  ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
  ctx.stroke();

  drawTrailPath(trail);
  ctx.strokeStyle = `hsla(${hue}, 100%, 74%, 0.35)`;
  ctx.lineWidth = core * 1.8;
  ctx.shadowBlur = Math.max(1, glow * 0.4);
  ctx.shadowColor = `hsl(${hue}, 100%, 56%)`;
  ctx.stroke();

  drawTrailPath(trail);
  ctx.strokeStyle = `hsla(${hue}, 100%, 86%, 0.7)`;
  ctx.lineWidth = core;
  ctx.shadowBlur = Math.max(1, glow * 0.2);
  ctx.shadowColor = `hsl(${hue}, 100%, 66%)`;
  ctx.stroke();

  ctx.restore();
}

function drawSoftDot(x, y, hue) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // 外圈光晕：放大
  ctx.beginPath();
  ctx.arc(x, y, config.coreWidth * 2.6, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue}, 100%, 56%, 0.16)`;
  ctx.shadowBlur = config.glow * 1.2;
  ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
  ctx.fill();

  // 中心亮点：放大
  ctx.beginPath();
  ctx.arc(x, y, config.coreWidth * 1.1, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue}, 100%, 84%, 0.82)`;
  ctx.shadowBlur = config.glow;
  ctx.shadowColor = `hsl(${hue}, 100%, 62%)`;
  ctx.fill();

  ctx.restore();
}

function drawSilk(x, y) {
  if (config.frozen) return;
  if (!w || !h) return;

  const hue = config.currentHue;
  const points = getSymmetryPoints(x, y);

  points.forEach((pt, idx) => {
    const key = `gesture_trail_${idx}`;
    if (!config.trailMap[key]) config.trailMap[key] = [];
    const trail = config.trailMap[key];
    const last = trail[trail.length - 1];

    if (last) {
      const s = config.smoothness;
      pt.x = last.x * s + pt.x * (1 - s);
      pt.y = last.y * s + pt.y * (1 - s);
    }

    const dist = last ? Math.hypot(pt.x - last.x, pt.y - last.y) : 999;
    if (dist > 0.3) {
      trail.push({ x: pt.x, y: pt.y });
      if (trail.length > 20) trail.shift();
    }

    if ((config.drawMode === "line" || config.drawMode === "both") && trail.length >= 2) {
      drawSoftBloomLine(trail, hue);
    }

    if ((config.drawMode === "dot" || config.drawMode === "both") && last && dist > 2) {
      drawSoftDot(pt.x, pt.y, hue);
    }
  });
}

// 禁用鼠标绘制
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => e.preventDefault());
canvas.addEventListener("mousemove", (e) => e.preventDefault());
canvas.addEventListener("mouseup", (e) => e.preventDefault());
canvas.addEventListener("mouseleave", (e) => e.preventDefault());
canvas.addEventListener("touchstart", (e) => e.preventDefault());
canvas.addEventListener("touchmove", (e) => e.preventDefault());
canvas.addEventListener("touchend", (e) => e.preventDefault());

// 前置界面进入
enterBtn.addEventListener("click", () => {
  introOverlay.classList.add("hidden");
  statusEl.textContent = "前置界面已关闭｜等待启动摄像头";
});

// MediaPipe 手势
let hands;
async function initHands() {
  try {
    hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });
    hands.onResults(onHandResult);
    return true;
  } catch (err) {
    statusEl.textContent = "手势库加载失败";
    console.error(err);
    return false;
  }
}

function onHandResult(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    if (!config.frozen) statusEl.textContent = "未检测到手｜伸出食指";
    for (const k in config.trailMap) {
      if (k.startsWith("gesture_")) delete config.trailMap[k];
    }
    return;
  }

  if (config.frozen) return;

  statusEl.textContent = config.autoColor ? "自动变色绘制中…" : "绘制中…";
  const lm = results.multiHandLandmarks[0];
  drawSilk(lm[8].x * w, lm[8].y * h);
}

let camera;
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  startBtn.textContent = "LOADING...";

  const ok = await initHands();
  if (!ok) {
    startBtn.textContent = "FAILED";
    return;
  }

  try {
    camera = new Camera(video, {
      onFrame: async () => { await hands.send({ image: video }); },
      width: 640,
      height: 480
    });
    await camera.start();
    startBtn.textContent = "RUNNING";
    statusEl.textContent = "摄像头已启动｜请用手势绘制";
  } catch (err) {
    startBtn.disabled = false;
    startBtn.textContent = "START CAMERA";
    statusEl.textContent = "摄像头启动失败";
    console.error(err);
  }
});


