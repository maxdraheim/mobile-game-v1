const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayBody = document.getElementById("overlay-body");
const startButton = document.getElementById("start-button");

const strengthLabel = document.getElementById("strength");
const coinsLabel = document.getElementById("coins");
const distanceLabel = document.getElementById("distance");

const state = {
  running: false,
  distance: 0,
  coins: 0,
  strength: 1,
  speed: 220,
  baseSpeed: 220,
  laneX: 0,
  targetLaneX: 0,
  worldX: 0,
  finishLine: 1800,
  obstacles: [],
  upgrades: [],
  particles: [],
};

const lanes = [-180, 0, 180];
const player = {
  x: 0,
  y: 380,
  size: 40,
  color: "#7cf5ff",
};

const rng = (min, max) => Math.random() * (max - min) + min;

function resetRun() {
  state.running = false;
  state.distance = 0;
  state.coins = 0;
  state.strength = 1;
  state.speed = state.baseSpeed;
  state.worldX = 0;
  state.obstacles = [];
  state.upgrades = [];
  state.particles = [];
  state.laneX = 0;
  state.targetLaneX = 0;
  player.size = 40;
  spawnWave(0, 6);
  updateHud();
}

function spawnWave(startIndex, count) {
  for (let i = 0; i < count; i += 1) {
    const z = startIndex + i;
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const isUpgrade = Math.random() > 0.45;
    const item = {
      x: lane,
      z: 350 + z * 220,
      size: isUpgrade ? 26 : 32,
      type: isUpgrade ? "upgrade" : "obstacle",
      color: isUpgrade ? "#8dff91" : "#ff6b7a",
    };
    if (isUpgrade) {
      state.upgrades.push(item);
    } else {
      state.obstacles.push(item);
    }
  }
}

function updateHud() {
  strengthLabel.textContent = state.strength.toFixed(1);
  coinsLabel.textContent = Math.floor(state.coins).toString();
  distanceLabel.textContent = `${Math.floor(state.distance)}m`;
}

function drawTrack() {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, 0);

  for (let i = 0; i < 30; i += 1) {
    const z = (state.worldX + i * 60) % 600;
    ctx.strokeStyle = "rgba(140, 160, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-260, canvas.height - z);
    ctx.lineTo(260, canvas.height - z);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(90, 110, 160, 0.5)";
  ctx.lineWidth = 4;
  ctx.strokeRect(-240, 40, 480, 420);

  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(canvas.width / 2, 0);
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size, 12);
  ctx.fill();
  ctx.restore();
}

function drawItems(list) {
  ctx.save();
  ctx.translate(canvas.width / 2, 0);
  list.forEach((item) => {
    const screenZ = canvas.height - (item.z - state.worldX);
    if (screenZ < 0 || screenZ > canvas.height) {
      return;
    }
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, screenZ, item.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFinishLine() {
  const screenZ = canvas.height - (state.finishLine - state.worldX);
  if (screenZ < 0 || screenZ > canvas.height) {
    return;
  }
  ctx.save();
  ctx.translate(canvas.width / 2, 0);
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(-240, screenZ - 10, 480, 20);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(-240, screenZ - 10, 240, 20);
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  ctx.translate(canvas.width / 2, 0);
  state.particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}

function addParticles(x, y, color) {
  for (let i = 0; i < 8; i += 1) {
    state.particles.push({
      x,
      y,
      vx: rng(-60, 60),
      vy: rng(-80, 20),
      life: 1,
      size: rng(3, 7),
      color,
    });
  }
}

function updateParticles(dt) {
  state.particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      vy: particle.vy + 120 * dt,
      life: particle.life - dt * 1.6,
    }))
    .filter((particle) => particle.life > 0);
}

function handleCollisions() {
  const playerScreenZ = canvas.height - (player.y - state.worldX);
  const playerX = player.x;

  state.upgrades = state.upgrades.filter((item) => {
    const screenZ = canvas.height - (item.z - state.worldX);
    const hit = Math.abs(screenZ - playerScreenZ) < player.size / 2 + item.size &&
      Math.abs(item.x - playerX) < player.size / 2 + item.size;
    if (hit) {
      state.strength += 0.3;
      state.speed += 18;
      player.size = Math.min(80, player.size + 4);
      state.coins += 2;
      addParticles(item.x, screenZ, item.color);
      return false;
    }
    return true;
  });

  state.obstacles = state.obstacles.filter((item) => {
    const screenZ = canvas.height - (item.z - state.worldX);
    const hit = Math.abs(screenZ - playerScreenZ) < player.size / 2 + item.size &&
      Math.abs(item.x - playerX) < player.size / 2 + item.size;
    if (hit) {
      state.strength = Math.max(0, state.strength - 0.4);
      state.speed = Math.max(state.baseSpeed, state.speed - 40);
      player.size = Math.max(26, player.size - 6);
      addParticles(item.x, screenZ, item.color);
      return false;
    }
    return true;
  });
}

function update(dt) {
  if (!state.running) {
    return;
  }

  state.worldX += state.speed * dt;
  state.distance = state.worldX / 6;
  state.laneX += (state.targetLaneX - state.laneX) * dt * 8;
  player.x = state.laneX;

  if (state.worldX > state.finishLine) {
    finishRun();
  }

  if (state.worldX > (state.spawnIndex || 0)) {
    state.spawnIndex = (state.spawnIndex || 0) + 6 * 220;
    spawnWave(state.spawnIndex / 220, 6);
  }

  handleCollisions();
  updateParticles(dt);
  updateHud();

  if (state.strength <= 0) {
    failRun();
  }
}

function draw() {
  drawTrack();
  drawFinishLine();
  drawItems(state.obstacles);
  drawItems(state.upgrades);
  drawPlayer();
  drawParticles();
}

function loop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }
  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function showOverlay(title, body, buttonLabel) {
  overlayTitle.textContent = title;
  overlayBody.textContent = body;
  startButton.textContent = buttonLabel;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function startRun() {
  resetRun();
  state.running = true;
  state.lastTime = 0;
  hideOverlay();
}

function finishRun() {
  state.running = false;
  const reward = Math.floor(state.strength * 20 + state.coins);
  showOverlay(
    "Finish Line!",
    `You banked ${reward} coins. Strength x${state.strength.toFixed(1)} boosts rewards.`,
    "Run Again"
  );
}

function failRun() {
  state.running = false;
  showOverlay(
    "Run Failed",
    "Your strength dropped to zero. Grab more upgrades next time!",
    "Try Again"
  );
}

function onMove(direction) {
  const currentIndex = lanes.indexOf(state.targetLaneX);
  const nextIndex = Math.max(0, Math.min(lanes.length - 1, currentIndex + direction));
  state.targetLaneX = lanes[nextIndex];
}

let touchStartX = 0;
let isTouching = false;

canvas.addEventListener("pointerdown", (event) => {
  isTouching = true;
  touchStartX = event.clientX;
});

canvas.addEventListener("pointermove", (event) => {
  if (!isTouching) {
    return;
  }
  const deltaX = event.clientX - touchStartX;
  if (Math.abs(deltaX) > 50) {
    onMove(deltaX > 0 ? 1 : -1);
    touchStartX = event.clientX;
  }
});

canvas.addEventListener("pointerup", () => {
  isTouching = false;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    onMove(-1);
  }
  if (event.key === "ArrowRight") {
    onMove(1);
  }
});

startButton.addEventListener("click", () => {
  startRun();
});

resetRun();
requestAnimationFrame(loop);
