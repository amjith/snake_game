const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const forestLayer = document.createElement("canvas");
forestLayer.width = canvas.width;
forestLayer.height = canvas.height;
const forestCtx = forestLayer.getContext("2d");
const scoreEl = document.getElementById("score");
const speedLabelEl = document.getElementById("speedLabel");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");
const speedBtn = document.getElementById("speedBtn");
const homeBtn = document.getElementById("homeBtn");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const BASE_TICK_MS = 120;
const SPEED_STEP = 0.5;
const MIN_SPEED = 1;
const MAX_SPEED = 6;

const COBRA_COLORS = {
  body: "#735830",
  hood: "#8a6d3f",
  belly: "#ceb67f",
  band: "#352414",
  eye: "#eacb78",
  pupil: "#1a120b",
  tongue: "#ef4444",
};

const keyToDirection = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

let snake;
let direction;
let nextDirection;
let apple;
let gameOver;
let isPlaying;
let score;
let speedMultiplier;
let loopId;
let forestReady;

function updateSpeedUI() {
  const speedText = `x${speedMultiplier.toFixed(1)}`;
  speedBtn.textContent = `Speed: ${speedText}`;
  speedLabelEl.textContent = speedText;
}

function getTickMs() {
  return BASE_TICK_MS / speedMultiplier;
}

function startLoop() {
  clearInterval(loopId);
  loopId = setInterval(update, getTickMs());
}

function stopLoop() {
  clearInterval(loopId);
  loopId = undefined;
}

function resetGameState() {
  const center = Math.floor(TILE_COUNT / 2);

  snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  apple = createApple();
  gameOver = false;
  score = 0;
  scoreEl.textContent = String(score);
  statusEl.textContent = "Use arrow keys to move.";
  draw();
}

function showHomeScreen() {
  gameScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  isPlaying = false;
  gameOver = false;
  statusEl.textContent = "";
  stopLoop();
}

function showGameScreen() {
  homeScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
}

function startGame() {
  showGameScreen();
  isPlaying = true;
  resetGameState();
  startLoop();
}

function restartGame() {
  if (!isPlaying) return;
  resetGameState();
  startLoop();
}

function cycleSpeed() {
  if (speedMultiplier >= MAX_SPEED) {
    speedMultiplier = MIN_SPEED;
  } else {
    speedMultiplier = Number((speedMultiplier + SPEED_STEP).toFixed(1));
  }

  updateSpeedUI();

  if (isPlaying && !gameOver) {
    startLoop();
  }
}

function createApple() {
  let newApple;
  do {
    newApple = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT),
    };
  } while (snake.some((segment) => segment.x === newApple.x && segment.y === newApple.y));
  return newApple;
}

function isOpposite(current, next) {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function update() {
  if (!isPlaying || gameOver) return;

  if (!isOpposite(direction, nextDirection)) {
    direction = nextDirection;
  }

  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  const hitWall =
    newHead.x < 0 ||
    newHead.x >= TILE_COUNT ||
    newHead.y < 0 ||
    newHead.y >= TILE_COUNT;

  const hitSelf = snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y);

  if (hitWall || hitSelf) {
    gameOver = true;
    statusEl.textContent = "Game over. Click Restart or Home.";
    stopLoop();
    draw();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === apple.x && newHead.y === apple.y) {
    score += 1;
    scoreEl.textContent = String(score);
    apple = createApple();
  } else {
    snake.pop();
  }

  draw();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(155, 197, 124, 0.16)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= TILE_COUNT; i += 1) {
    const pos = i * GRID_SIZE;

    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawForestBackground() {
  const skyToGround = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyToGround.addColorStop(0, "#7eb27a");
  skyToGround.addColorStop(0.46, "#3f6f41");
  skyToGround.addColorStop(1, "#1f3a26");
  ctx.fillStyle = skyToGround;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const horizonY = Math.floor(canvas.height * 0.6);

  // Distant pine silhouettes.
  for (let i = 0; i <= TILE_COUNT; i += 1) {
    const x = i * GRID_SIZE;
    const height = GRID_SIZE * (2.2 + (i % 4) * 0.7);

    ctx.fillStyle = i % 2 === 0 ? "rgba(26, 66, 34, 0.75)" : "rgba(20, 53, 28, 0.8)";
    ctx.beginPath();
    ctx.moveTo(x - GRID_SIZE / 2, horizonY);
    ctx.lineTo(x + GRID_SIZE / 2, horizonY);
    ctx.lineTo(x, horizonY - height);
    ctx.closePath();
    ctx.fill();
  }

  // Ground foliage near the bottom edge.
  ctx.fillStyle = "rgba(14, 45, 21, 0.92)";
  for (let x = -8; x <= canvas.width + 8; x += 16) {
    const radius = 9 + ((x / 16) % 3);
    ctx.beginPath();
    ctx.arc(x, canvas.height - 6, radius, Math.PI, 0);
    ctx.lineTo(x + radius, canvas.height);
    ctx.lineTo(x - radius, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  // Light mist layer.
  const mistTop = horizonY - GRID_SIZE * 4;
  const mistBottom = horizonY + GRID_SIZE * 4;
  const mist = ctx.createLinearGradient(0, mistTop, 0, mistBottom);
  mist.addColorStop(0, "rgba(220, 247, 210, 0)");
  mist.addColorStop(0.5, "rgba(220, 247, 210, 0.12)");
  mist.addColorStop(1, "rgba(220, 247, 210, 0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, mistTop, canvas.width, mistBottom - mistTop);
}

function drawCobraBodySegment(segment, index) {
  const x = segment.x * GRID_SIZE;
  const y = segment.y * GRID_SIZE;

  ctx.fillStyle = COBRA_COLORS.body;
  ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);

  ctx.fillStyle = COBRA_COLORS.belly;
  ctx.fillRect(x + 7, y + 5, GRID_SIZE - 14, GRID_SIZE - 10);

  if (index % 3 === 0) {
    ctx.fillStyle = COBRA_COLORS.band;
    ctx.fillRect(x + 2, y + 8, GRID_SIZE - 4, 3);
  }
}

function drawCobraTail() {
  if (snake.length < 2) return;

  const tail = snake[snake.length - 1];
  const beforeTail = snake[snake.length - 2];
  const tailDirection = {
    x: tail.x - beforeTail.x,
    y: tail.y - beforeTail.y,
  };
  const centerX = tail.x * GRID_SIZE + GRID_SIZE / 2;
  const centerY = tail.y * GRID_SIZE + GRID_SIZE / 2;
  const angle = Math.atan2(tailDirection.y, tailDirection.x);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Tapered tail tip.
  ctx.fillStyle = COBRA_COLORS.body;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.quadraticCurveTo(1, -5, -8, -4);
  ctx.lineTo(-8, 4);
  ctx.quadraticCurveTo(1, 5, 10, 0);
  ctx.fill();

  // Belly stripe and band near the base.
  ctx.strokeStyle = COBRA_COLORS.belly;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();

  ctx.fillStyle = COBRA_COLORS.band;
  ctx.fillRect(-7, -1.5, 2.8, 3);

  ctx.restore();
}

function drawCircle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawApple(cell) {
  const centerX = cell.x * GRID_SIZE + GRID_SIZE / 2;
  const centerY = cell.y * GRID_SIZE + GRID_SIZE / 2 + 1;
  const radius = GRID_SIZE * 0.36;

  ctx.save();

  const bodyGradient = ctx.createRadialGradient(
    centerX - radius * 0.45,
    centerY - radius * 0.65,
    radius * 0.2,
    centerX,
    centerY + radius * 0.3,
    radius * 1.3,
  );
  bodyGradient.addColorStop(0, "#ffb4a7");
  bodyGradient.addColorStop(0.4, "#ef4444");
  bodyGradient.addColorStop(1, "#991b1b");

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius - 1);
  ctx.bezierCurveTo(
    centerX - radius - 1,
    centerY - radius + 1,
    centerX - radius - 1,
    centerY + radius,
    centerX,
    centerY + radius + 1,
  );
  ctx.bezierCurveTo(
    centerX + radius + 1,
    centerY + radius,
    centerX + radius + 1,
    centerY - radius + 1,
    centerX,
    centerY - radius - 1,
  );
  ctx.fill();

  ctx.fillStyle = "#7f1d1d";
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - radius + 0.8, 2, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#7c4a21";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(centerX + 0.3, centerY - radius + 0.2);
  ctx.quadraticCurveTo(centerX + 1.5, centerY - radius - 4.2, centerX + 3.2, centerY - radius - 5.8);
  ctx.stroke();

  ctx.fillStyle = "#65a30d";
  ctx.beginPath();
  ctx.ellipse(centerX + 6, centerY - radius - 3.8, 4.6, 2.4, -0.48, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#3f6212";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(centerX + 2.6, centerY - radius - 4.8);
  ctx.lineTo(centerX + 8.5, centerY - radius - 4.8);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
  ctx.beginPath();
  ctx.ellipse(centerX - 4.4, centerY - 3.3, 2.8, 1.6, -0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCobraHead(head) {
  const centerX = head.x * GRID_SIZE + GRID_SIZE / 2;
  const centerY = head.y * GRID_SIZE + GRID_SIZE / 2;
  const angle = Math.atan2(direction.y, direction.x);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  ctx.fillStyle = COBRA_COLORS.hood;
  ctx.beginPath();
  ctx.ellipse(-5, 0, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  drawCircle(-6.5, -2.8, 1.1, COBRA_COLORS.band);
  drawCircle(-6.5, 2.8, 1.1, COBRA_COLORS.band);

  ctx.fillStyle = COBRA_COLORS.body;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(0, -6);
  ctx.lineTo(-6, -4);
  ctx.lineTo(-6, 4);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  drawCircle(4, -2.2, 1.5, COBRA_COLORS.eye);
  drawCircle(4, 2.2, 1.5, COBRA_COLORS.eye);
  drawCircle(4.6, -2.2, 0.8, COBRA_COLORS.pupil);
  drawCircle(4.6, 2.2, 0.8, COBRA_COLORS.pupil);

  ctx.strokeStyle = COBRA_COLORS.tongue;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(7.5, 0);
  ctx.lineTo(12.2, 0);
  ctx.lineTo(14.2, -1.5);
  ctx.moveTo(12.2, 0);
  ctx.lineTo(14.2, 1.5);
  ctx.stroke();

  ctx.restore();
}

function draw() {
  drawForestBackground();
  drawGrid();

  if (!snake || snake.length === 0) return;

  drawApple(apple);
  drawCobraTail();

  for (let i = snake.length - 2; i >= 1; i -= 1) {
    drawCobraBodySegment(snake[i], i);
  }

  drawCobraHead(snake[0]);
}

document.addEventListener("keydown", (event) => {
  const incoming = keyToDirection[event.key];
  if (!incoming || !isPlaying || gameOver) return;

  event.preventDefault();
  nextDirection = incoming;
});

startBtn.addEventListener("click", startGame);
speedBtn.addEventListener("click", cycleSpeed);
restartBtn.addEventListener("click", restartGame);
homeBtn.addEventListener("click", showHomeScreen);

speedMultiplier = MIN_SPEED;
updateSpeedUI();
showHomeScreen();
