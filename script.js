// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gameTimer; // Will store our countdown timer
let timeRemaining = 30; // Game duration in seconds
let score = 0; // Player's score

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

// Wait for play again button click
document.getElementById("play-again-btn").addEventListener("click", function() {
  document.getElementById("game-over-model").style.display = "none";
  startGame();
});

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timeRemaining = 30;
  
  // Update display
  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = timeRemaining;
  document.getElementById("start-btn").textContent = "Game Running...";
  document.getElementById("start-btn").disabled = true;

  // Create new drops every 1.5 seconds
  dropMaker = setInterval(createDrop, 1500);
  
  // Start countdown timer
  gameTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timeRemaining--;
  document.getElementById("time").textContent = timeRemaining;
  
  if (timeRemaining <= 0) {
    endGame();
  }
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);
  
  // Clear all remaining drops
  const drops = document.querySelectorAll('.water-drop');
  drops.forEach(drop => drop.remove());
  
  // Reset button
  document.getElementById("start-btn").textContent = "Restart Game";
  document.getElementById("start-btn").disabled = false;
  
  // Show custom game over model
  document.getElementById("final-score-text").textContent = `Your final score: ${score}`;
  document.getElementById("game-over-model").style.display = "block";
  
  // Trigger confetti celebration
  createConfetti();
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";
  
  // 30% chance of creating a bad drop
  const isBadDrop = Math.random() < 0.3;
  if (isBadDrop) {
    drop.classList.add("bad-drop");
  }

  // Make drops different sizes for visual variety
  const initialSize = 80;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 80);
  drop.style.left = xPosition + "px";
  
  // Start from top of screen
  drop.style.top = "-80px";

  // Make drops fall for 6 seconds
  drop.style.animationDuration = "6s";

  // Add click event to collect the drop
  drop.addEventListener("click", function() {
    collectDrop(drop, isBadDrop);
  });

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    if (drop.parentNode) {
      drop.remove(); // Clean up drops that weren't collected
    }
  });
}

function collectDrop(drop, isBadDrop) {
  // Update score
  if (isBadDrop) {
    score--;
    // Add visual feedback for bad drop - brown/rust glow effect
    drop.style.boxShadow = "0 0 25px #BF6C46";
  } else {
    score++;
    // Add visual feedback for good drop - soft blue glow effect
    drop.style.boxShadow = "0 0 25px #77A8BB";
  }
  
  // Update score display
  document.getElementById("score").textContent = score;
  
  // Remove the drop with a small animation
  drop.style.transform = "scale(0)";
  drop.style.opacity = "0";
  
  setTimeout(() => {
    if (drop.parentNode) {
      drop.remove();
    }
  }, 200);
}

function createConfetti() {
  const confettiContainer = document.getElementById("confetti-container");
  const confettiCount = 30;
  const colors = ['square', 'circle', 'triangle', 'rectangle'];
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = `confetti ${colors[Math.floor(Math.random() * colors.length)]}`;
    
    // Create burst effect from center
    const angle = (Math.PI * 2 * i) / confettiCount;
    const velocity = Math.random() * 200 + 100; // Random velocity between 100-300px
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;
    
    // Set CSS custom properties for the animation
    confetti.style.setProperty('--dx', dx + 'px');
    confetti.style.setProperty('--dy', dy + 'px');
    
    // Random animation delay for staggered effect
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    
    // Random animation duration
    confetti.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
    
    confettiContainer.appendChild(confetti);
  }
  
  // Clean up confetti after animation
  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 4000);
}
