
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");

const soundBtn = document.getElementById("soundBtn");
let soundEnabled = true;

// GAME SOUND EFFECTS
let audioContext = null;

function playSound(frequency, duration) {
  if (!soundEnabled) return;

  try {
    if (audioContext === null) {
      audioContext = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      0.15,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(
      audioContext.currentTime + duration
    );

  } catch (error) {
    console.log("Sound unavailable:", error);
  }
}


// TURN SOUND ON OR OFF
soundBtn.addEventListener("click", function() {
  soundEnabled = !soundEnabled;

  if (soundEnabled) {
    soundBtn.textContent = "🔊 Sound ON";
  } else {
    soundBtn.textContent = "🔇 Sound OFF";
  }
});

const coinsDisplay = document.getElementById("coins");
const lapDisplay = document.getElementById("lap");
const timerDisplay = document.getElementById("timer");
const bestTimeDisplay = document.getElementById("bestTime");

// GAME SETTINGS
const totalLaps = 3;
const secondsPerLap = 10; // Short duration for testing
const autoY = 350;

// GAME VARIABLES
let autoX = 175;
let roadOffset = 0;
let raceStarted = false;
let raceStartTime = 0;
let elapsedSeconds = 0;
let coinsCollected = 0;
let currentLap = 1;
let animationId = null;

// SAVED BEST TIME
let bestRaceTime = Number(
  localStorage.getItem("autoRallyBestTime")
) || 0;

// COIN
let coin = {
  x: 150,
  y: -30,
  radius: 12
};

// OBSTACLE
let obstacle = {
  x: 120,
  y: -150,
  width: 45,
  height: 45
};


// SHIELD POWER-UP
let shieldActive = false;

let shield = {
  x: 200,
  y: -500,
  radius: 16
};

// Draw shield
function drawShield() {
  ctx.beginPath();

  ctx.arc(
    shield.x,
    shield.y,
    shield.radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "#2196F3";
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("S", shield.x, shield.y + 7);
}

// Reset shield position
function resetShield() {
  shield.x = 110 + Math.random() * 180;
  shield.y = -500;
}

// FORMAT SECONDS AS MINUTES:SECONDS
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes + ":" + String(seconds).padStart(2, "0");
}

// DISPLAY SAVED BEST TIME
function displayBestTime() {
  if (!bestTimeDisplay) return;

  if (bestRaceTime === 0) {
    bestTimeDisplay.textContent = "Not recorded";
  } else {
    bestTimeDisplay.textContent = formatTime(bestRaceTime);
  }
}

// SAVE BEST TIME
function saveBestTime() {
  if (
    bestRaceTime === 0 ||
    elapsedSeconds < bestRaceTime
  ) {
    bestRaceTime = elapsedSeconds;

    localStorage.setItem(
      "autoRallyBestTime",
      String(bestRaceTime)
    );
  }

  displayBestTime();
}

// DRAW ROAD
function drawRoad() {
  // Green grass
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grey road
  ctx.fillStyle = "#555555";
  ctx.fillRect(70, 0, 260, 500);

  // Road boundaries
  ctx.fillStyle = "white";
  ctx.fillRect(75, 0, 5, 500);
  ctx.fillRect(320, 0, 5, 500);

  // Moving road markings
  for (let y = -70 + roadOffset; y < 500; y += 70) {
    ctx.fillRect(197, y, 6, 35);
  }
}

// DRAW AUTO-RICKSHAW
function drawAuto() {
  const x = autoX;
  const y = autoY;

  // Show protective ring when shield is active
  if (shieldActive) {
    ctx.beginPath();

    ctx.ellipse(
      x + 25,
      y + 40,
      42,
      55,
      0,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle = "#00BFFF";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  // Wheels
  ctx.fillStyle = "black";
  ctx.fillRect(x - 10, y + 15, 10, 30);
  ctx.fillRect(x + 50, y + 15, 10, 30);

  // Yellow roof
  ctx.fillStyle = "#FFD700";
  ctx.fillRect(x, y, 50, 25);

  // Green body
  ctx.fillStyle = "#008000";
  ctx.fillRect(x, y + 25, 50, 55);

  // Window
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(x + 8, y + 7, 34, 15);

  // Headlights
  ctx.fillStyle = "white";
  ctx.fillRect(x + 5, y + 70, 10, 6);
  ctx.fillRect(x + 35, y + 70, 10, 6);
}

// DRAW COIN
function drawCoin() {
  ctx.beginPath();
  ctx.arc(
    coin.x,
    coin.y,
    coin.radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = "#FFD700";
  ctx.fill();

  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#654321";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";
  ctx.fillText("₹", coin.x, coin.y + 5);
}

// RESET COIN
function resetCoin() {
  coin.x = 110 + Math.random() * 180;
  coin.y = -30;
}

// DRAW OBSTACLE
function drawObstacle() {
  ctx.fillStyle = "#D32F2F";

  ctx.fillRect(
    obstacle.x,
    obstacle.y,
    obstacle.width,
    obstacle.height
  );

  // Warning stripes
  ctx.fillStyle = "#FFEB3B";

  ctx.fillRect(
    obstacle.x + 5,
    obstacle.y + 10,
    35,
    6
  );

  ctx.fillRect(
    obstacle.x + 5,
    obstacle.y + 28,
    35,
    6
  );
}

// RESET OBSTACLE
function resetObstacle() {
  obstacle.x = 95 + Math.random() * 175;
  obstacle.y = -150;
}

// DRAW COMPLETE GAME

function drawGame() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawRoad();
  drawCoin();
  drawObstacle();
  drawShield();
  drawAuto();
}


// KEYBOARD CONTROLS
document.addEventListener("keydown", function(event) {
  if (
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight"
  ) {
    return;
  }

  event.preventDefault();

  if (!raceStarted) return;

  if (event.key === "ArrowLeft") {
    autoX -= 15;
  }

  if (event.key === "ArrowRight") {
    autoX += 15;
  }

  // Keep auto on the road
  autoX = Math.max(90, Math.min(260, autoX));

  drawGame();
});

// UPDATE TIMER
function updateTimer() {
  if (!raceStarted) return;

  elapsedSeconds = Math.floor(
    (performance.now() - raceStartTime) / 1000
  );

  timerDisplay.textContent = formatTime(elapsedSeconds);
}

// UPDATE LAPS
function updateLaps() {
  if (!raceStarted) return;

  currentLap =
    Math.floor(elapsedSeconds / secondsPerLap) + 1;

  if (currentLap > totalLaps) {
    finishRace();
    return;
  }

  lapDisplay.textContent = currentLap;
}

// FINISH RACE
function finishRace() {
  playSound(1000, 0.4);
  
  raceStarted = false;

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  lapDisplay.textContent = totalLaps;
  startBtn.textContent = "Race Again";

  saveBestTime();

  alert(
    "Congratulations!\n\n" +
    "You completed 3 laps!\n" +
    "Race Time: " + formatTime(elapsedSeconds) + "\n" +
    "Coins Collected: " + coinsCollected
  );
}

// GAME OVER
function gameOver() {
    playSound(180, 0.5);  
    
    raceStarted = false;

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  startBtn.textContent = "Restart Race";

  alert(
    "Game Over!\n\n" +
    "You hit an obstacle.\n" +
    "Coins Collected: " + coinsCollected + "\n" +
    "Time: " + formatTime(elapsedSeconds)
  );
}

// MAIN GAME ANIMATION
function animateRoad() {
  if (!raceStarted) return;

  // Update timer and lap
  updateTimer();
  updateLaps();

  if (!raceStarted) return;

  // Move road markings
  roadOffset = (roadOffset + 5) % 70;

  // Move coin
  coin.y += 4;

  // Move obstacle
  obstacle.y += 5;

// Move shield down the road
   shield.y += 3;

// Reset shield after leaving the screen
if (shield.y > 520) {
  resetShield();
}


  // Reset obstacle after leaving screen
  if (obstacle.y > 520) {
    resetObstacle();
  }


// DETECT SHIELD COLLECTION
const shieldCenterX = autoX + 25;
const shieldCenterY = autoY + 40;

const shieldDistance = Math.sqrt(
  (shield.x - shieldCenterX) ** 2 +
  (shield.y - shieldCenterY) ** 2
);

if (shieldDistance < 45) {
  shieldActive = true;
  playSound(1200, 0.25);
  resetShield();
}

  // Detect obstacle collision
  const collision =
    autoX < obstacle.x + obstacle.width &&
    autoX + 50 > obstacle.x &&
    autoY < obstacle.y + obstacle.height &&
    autoY + 80 > obstacle.y;

  
if (collision) {
  if (shieldActive) {
    // Shield protects against one collision
    shieldActive = false;
    resetObstacle();
  } else {
    drawGame();
    gameOver();
    return;
  }
}


  // Detect coin collection
  const autoCenterX = autoX + 25;
  const autoCenterY = autoY + 40;

  const distance = Math.sqrt(
    (coin.x - autoCenterX) ** 2 +
    (coin.y - autoCenterY) ** 2
  );

  if (distance < 40) {
    coinsCollected++;
    playSound(880, 0.15);

    coinsDisplay.textContent = coinsCollected;

    resetCoin();
  }

  // Reset coin after leaving screen
  if (coin.y > 520) {
    resetCoin();
  }

  drawGame();

  animationId = requestAnimationFrame(animateRoad);
}

// START OR RESTART RACE
startBtn.addEventListener("click", function() {
  if (raceStarted) return;

  // Stop any previous animation
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Reset game variables
  autoX = 175;
  roadOffset = 0;
  coinsCollected = 0;
  currentLap = 1;
  elapsedSeconds = 0;

  // Reset screen
  coinsDisplay.textContent = "0";
  lapDisplay.textContent = "1";
  timerDisplay.textContent = "0:00";

    
    // Reset objects
    resetCoin();
    resetObstacle();
    resetShield();
    shieldActive = false;


  // Start race
  raceStarted = true;
  raceStartTime = performance.now();

  startBtn.textContent = "Race Running";

  animateRoad();
});

// INITIAL DISPLAY
displayBestTime();
drawGame();

 // TOUCHSCREEN CONTROLS


 // TOUCHSCREEN CONTROLS

function moveAuto(direction) {
  if (!raceStarted) return;

  autoX += direction * 15;
  autoX = Math.max(90, Math.min(260, autoX));

  drawGame();
}

function setupTouchButton(buttonId, direction) {
  const button = document.getElementById(buttonId);
  let moveInterval = null;

  function stopMoving() {
    if (moveInterval !== null) {
      clearInterval(moveInterval);
      moveInterval = null;
    }
  }

  button.addEventListener("pointerdown", function(event) {
    event.preventDefault();

    if (!raceStarted || moveInterval !== null) return;

    moveAuto(direction);

    moveInterval = setInterval(function() {
      if (!raceStarted) {
        stopMoving();
        return;
      }

      moveAuto(direction);
    }, 70);
  });

  button.addEventListener("pointerup", stopMoving);
  button.addEventListener("pointercancel", stopMoving);
  button.addEventListener("lostpointercapture", stopMoving);

  button.addEventListener("pointerdown", function(event) {
    button.setPointerCapture(event.pointerId);
  });
}

setupTouchButton("leftBtn", -1);
setupTouchButton("rightBtn", 1);

