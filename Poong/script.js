// Simple Pong game
// Left paddle: player (mouse + arrow keys)
// Right paddle: basic CPU
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const playerScoreEl = document.getElementById('playerScore');
  const cpuScoreEl = document.getElementById('cpuScore');

  const W = canvas.width;
  const H = canvas.height;

  // Game objects
  const paddleWidth = 14;
  const paddleHeight = 100;
  const paddleSpeed = 6; // for arrow key movement

  const player = {
    x: 20,
    y: (H - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
  };

  const cpu = {
    x: W - 20 - paddleWidth,
    y: (H - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 4.0, // CPU tracking speed
  };

  const ball = {
    x: W / 2,
    y: H / 2,
    r: 8,
    speed: 5,
    vx: 0,
    vy: 0,
  };

  let running = false;
  let paused = false;
  let playerScore = 0;
  let cpuScore = 0;

  // Key state
  const keys = { ArrowUp: false, ArrowDown: false };

  function resetBall(direction = 1) {
    ball.x = W / 2;
    ball.y = H / 2;
    ball.speed = 5;
    // random angle between -30 and 30 degrees
    const ang = (Math.random() * Math.PI / 3) - (Math.PI / 6);
    ball.vx = direction * ball.speed * Math.cos(ang);
    ball.vy = ball.speed * Math.sin(ang);
  }

  function startGame() {
    if (!running) {
      running = true;
      paused = false;
      resetBall(Math.random() > 0.5 ? 1 : -1);
      loop();
    } else if (paused) {
      paused = false;
      loop();
    }
  }

  function pauseGame() {
    paused = true;
  }

  function resetGame() {
    running = false;
    paused = false;
    playerScore = 0;
    cpuScore = 0;
    playerScoreEl.textContent = '0';
    cpuScoreEl.textContent = '0';
    player.y = (H - paddleHeight) / 2;
    cpu.y = (H - paddleHeight) / 2;
    resetBall(1);
    render(); // show reset frame
  }

  // Utility collision check: circle vs rect
  function circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
    // Find nearest point on rect to circle center
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return (dx * dx + dy * dy) <= (r * r);
  }

  function update() {
    if (!running || paused) return;

    // Player arrow-key movement
    if (keys.ArrowUp) {
      player.y -= paddleSpeed;
    } else if (keys.ArrowDown) {
      player.y += paddleSpeed;
    }

    // Ensure player stays in bounds
    player.y = Math.max(0, Math.min(H - player.height, player.y));

    // CPU movement: simple follow ball with limited speed
    const cpuCenter = cpu.y + cpu.height / 2;
    const delta = ball.y - cpuCenter;
    // Move proportionally but cap by cpu.speed
    if (Math.abs(delta) > 8) {
      cpu.y += Math.sign(delta) * cpu.speed;
    }
    cpu.y = Math.max(0, Math.min(H - cpu.height, cpu.y));

    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom wall bounce
    if (ball.y - ball.r <= 0) {
      ball.y = ball.r;
      ball.vy = -ball.vy;
    } else if (ball.y + ball.r >= H) {
      ball.y = H - ball.r;
      ball.vy = -ball.vy;
    }

    // Paddle collisions
    // Left paddle (player)
    if (circleRectCollision(ball.x, ball.y, ball.r, player.x, player.y, player.width, player.height)) {
      // move ball outside to avoid sticking
      ball.x = player.x + player.width + ball.r;
      // compute relative hit position (-1 top to 1 bottom)
      const relativeIntersectY = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
      const maxBounce = Math.PI / 3; // 60 degrees
      const bounceAngle = relativeIntersectY * maxBounce;
      const speedIncrease = 0.3;
      ball.speed += speedIncrease;
      ball.vx = Math.abs(ball.speed * Math.cos(bounceAngle)); // go right
      ball.vy = ball.speed * Math.sin(bounceAngle);
    }

    // Right paddle (cpu)
    if (circleRectCollision(ball.x, ball.y, ball.r, cpu.x, cpu.y, cpu.width, cpu.height)) {
      ball.x = cpu.x - ball.r;
      const relativeIntersectY = (ball.y - (cpu.y + cpu.height / 2)) / (cpu.height / 2);
      const maxBounce = Math.PI / 3;
      const bounceAngle = relativeIntersectY * maxBounce;
      const speedIncrease = 0.3;
      ball.speed += speedIncrease;
      ball.vx = -Math.abs(ball.speed * Math.cos(bounceAngle)); // go left
      ball.vy = ball.speed * Math.sin(bounceAngle);
    }

    // Score check
    if (ball.x - ball.r <= 0) {
      // CPU scores
      cpuScore++;
      cpuScoreEl.textContent = String(cpuScore);
      // Reset ball to center towards player (won't move for a fraction)
      resetBall(1);
    } else if (ball.x + ball.r >= W) {
      // Player scores
      playerScore++;
      playerScoreEl.textContent = String(playerScore);
      resetBall(-1);
    }
  }

  function render() {
    // Clear
    ctx.clearRect(0, 0, W, H);
    // center dashed line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.restore();

    // paddles
    ctx.fillStyle = '#ffffff';
    // player paddle
    roundRect(ctx, player.x, player.y, player.width, player.height, 6, true, false);
    // cpu paddle
    roundRect(ctx, cpu.x, cpu.y, cpu.width, cpu.height, 6, true, false);

    // ball
    ctx.fillStyle = '#00e1a8';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // HUD (scores already in DOM; optionally draw small debug)
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, H - 28, W, 28);
  }

  // simple rounded rect helper
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Game loop
  function loop() {
    if (!running || paused) return;
    update();
    render();
    requestAnimationFrame(loop);
  }

  // Input handlers
  canvas.addEventListener('mousemove', (e) => {
    // compute mouse y relative to canvas
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // center paddle on mouse Y
    player.y = y - player.height / 2;
    // bound
    player.y = Math.max(0, Math.min(H - player.height, player.y));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      keys[e.key] = true;
      e.preventDefault();
    } else if (e.key === ' '){ // space toggle pause
      if (running) {
        paused = !paused;
        if (!paused) loop();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      keys[e.key] = false;
      e.preventDefault();
    }
  });

  // Buttons
  startBtn.addEventListener('click', () => startGame());
  pauseBtn.addEventListener('click', () => {
    if (!running) return;
    paused = !paused;
    if (!paused) loop();
  });
  resetBtn.addEventListener('click', () => resetGame());

  // initialize
  resetGame();

  // initial render
  render();

})();
