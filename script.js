// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let gamePaused = false; // Keeps track of whether game is paused
let dropMaker; // Will store our timer that creates drops regularly
let score = 0; // Player's score
let oopsies = 0; // Track number of bad drops clicked
let maxOopsies = 3; // Maximum allowed oopsies (changes with difficulty)
let currentDifficulty = 'medium'; // Default difficulty
let dropInterval = 1500; // Base drop creation interval in ms
let dropSpeed = 6; // Base drop fall duration in seconds
let quota = 50; // Score quota to reach (changes with difficulty)

// Wait for button click to start the game or pause/resume
document.getElementById("start-btn").addEventListener("click", function() {
  if (!gameRunning) {
    showDifficultyModal();
  } else {
    if (gamePaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
});

// Wait for play again button click
document.getElementById("play-again-btn").addEventListener("click", function() {
  document.getElementById("game-over-model").style.display = "none";
  showDifficultyModal();
});

// Difficulty selection handlers
document.addEventListener('DOMContentLoaded', function() {
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const difficulty = this.getAttribute('data-difficulty');
      selectDifficulty(difficulty);
    });
  });
});

function showDifficultyModal() {
  document.getElementById("difficulty-modal").style.display = "block";
}

function selectDifficulty(difficulty) {
  currentDifficulty = difficulty;
  
  // Set difficulty parameters
  switch(difficulty) {
    case 'easy':
      maxOopsies = Infinity; // No oopsies limit
      dropInterval = 600; // 100% faster drop rate (1200 * 0.5)
      dropSpeed = 6; // Normal speed
      quota = 10; // Easy quota
      break;
    case 'medium':
      maxOopsies = 3;
      dropInterval = 337.5; // Same as hard mode - 100% faster drop rate (675 * 0.5)
      dropSpeed = 4.5; // 25% faster than Easy (6 * 0.75)
      quota = 50; // Medium quota
      break;
    case 'hard':
      maxOopsies = 1;
      dropInterval = 337.5; // 100% faster drop rate (675 * 0.5)
      dropSpeed = 3.375; // 25% faster than Medium (4.5 * 0.75)
      quota = 100; // Hard quota
      break;
  }
  
  document.getElementById("difficulty-modal").style.display = "none";
  startGame();
}

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  gamePaused = false;
  score = 0;
  oopsies = 0;
  
  // Update display
  document.getElementById("score").textContent = score;
  document.getElementById("game-tagline").innerHTML = `Catch <span class="quota-number">${quota}</span> BLUE jerry cans, avoid the dirty ones!`;
  document.getElementById("start-btn").innerHTML = '<div class="icon-wrapper"><div class="pause-icon"></div></div>';
  document.getElementById("start-btn").disabled = false;

  // Show/hide oopsies bar based on difficulty
  const mistakeBar = document.querySelector('.mistake-bar');
  if (currentDifficulty === 'easy') {
    mistakeBar.style.display = 'none';
  } else {
    mistakeBar.style.display = 'flex';
    // Reset mistake bar - clear all filled X's
    for (let i = 1; i <= 3; i++) {
      const mistakeElement = document.getElementById(`mistake-${i}`);
      if (mistakeElement) {
        mistakeElement.classList.remove('filled');
        // Hide/show X's based on max oopsies
        mistakeElement.style.display = i <= maxOopsies ? 'flex' : 'none';
      }
    }
  }

  // Create new drops at difficulty-adjusted interval
  dropMaker = setInterval(createDrop, dropInterval);
}

function endGame(isWin = false) {
  gameRunning = false;
  gamePaused = false;
  clearInterval(dropMaker);
  
  // Clear all remaining drops
  const drops = document.querySelectorAll('.water-drop');
  drops.forEach(drop => drop.remove());
  
  // Reset button
  document.getElementById("start-btn").textContent = "Start Game";
  document.getElementById("start-btn").disabled = false;
  
  // Show custom game over model with appropriate title and message
  if (isWin) {
    document.getElementById("game-over-title").textContent = "Congratulations!";
    document.getElementById("final-score-text").textContent = "You reached the quota!";
    // Trigger confetti celebration only for wins
    createConfetti();
  } else {
    document.getElementById("game-over-title").textContent = "Game Over!";
    document.getElementById("final-score-text").textContent = `Your score is ${score}.`;
    // Play lose sound effect
    const loseSound = document.getElementById("lose-sound");
    loseSound.currentTime = 0; // Reset to beginning in case it was played before
    loseSound.play().catch(e => console.log("Could not play sound:", e));
  }
  
  document.getElementById("game-over-model").style.display = "block";
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";
  
  // Adjust bad drop chance based on difficulty
  const badDropChance = (currentDifficulty === 'medium' || currentDifficulty === 'hard') ? 0.4 : 0.3;
  const isBadDrop = Math.random() < badDropChance;
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

  // Make drops fall based on difficulty speed
  drop.style.animationDuration = dropSpeed + "s";
  
  // If game is paused, set animation to paused state and disable clicks
  if (gamePaused) {
    drop.style.animationPlayState = 'paused';
    drop.style.pointerEvents = 'none';
  }

  // Add click event to collect the drop
  drop.addEventListener("click", function() {
    collectDrop(drop, isBadDrop);
  });

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    if (drop.parentNode) {
      // In medium and hard difficulty, missed good drops count as oopsies
      if ((currentDifficulty === 'medium' || currentDifficulty === 'hard') && !isBadDrop) {
        oopsies++;
        
        // Fill in the oopsie X
        if (oopsies <= maxOopsies) {
          document.getElementById(`mistake-${oopsies}`).classList.add('filled');
        }
        
        // Check if game should end due to too many oopsies
        if (oopsies >= maxOopsies) {
          setTimeout(() => {
            endGame(false);
          }, 300);
        }
      }
      
      drop.remove(); // Clean up drops that weren't collected
    }
  });
}

function collectDrop(drop, isBadDrop) {
  // Update score and oopsies
  if (isBadDrop) {
    score--;
    
    // Only count oopsies if not in easy mode
    if (currentDifficulty !== 'easy') {
      oopsies++;
      
      // Fill in the oopsie X
      if (oopsies <= maxOopsies) {
        document.getElementById(`mistake-${oopsies}`).classList.add('filled');
      }
      
      // Check if game should end due to too many oopsies
      if (oopsies >= maxOopsies) {
        setTimeout(() => {
          endGame(false);
        }, 300); // Small delay to show the final oopsie X
      }
    }
  } else {
    score++;
    
    // Check if player reached the quota
    if (score >= quota) {
      setTimeout(() => {
        endGame(true);
      }, 300); // Small delay to show the final score
    }
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

function pauseGame() {
  gamePaused = true;
  
  // Stop creating new drops
  clearInterval(dropMaker);
  
  // Pause all existing drop animations and disable click events
  const drops = document.querySelectorAll('.water-drop');
  drops.forEach(drop => {
    drop.style.animationPlayState = 'paused';
    drop.style.pointerEvents = 'none'; // Disable click events
  });
  
  // Update button to show play icon
  document.getElementById("start-btn").innerHTML = '<div class="icon-wrapper"><div class="play-icon"></div></div>';
}

function resumeGame() {
  gamePaused = false;
  
  // Resume creating new drops at difficulty-adjusted interval
  dropMaker = setInterval(createDrop, dropInterval);
  
  // Resume all existing drop animations and re-enable click events
  const drops = document.querySelectorAll('.water-drop');
  drops.forEach(drop => {
    drop.style.animationPlayState = 'running';
    drop.style.pointerEvents = 'auto'; // Re-enable click events
  });
  
  // Update button to show pause icon
  document.getElementById("start-btn").innerHTML = '<div class="icon-wrapper"><div class="pause-icon"></div></div>';
}
