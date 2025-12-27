/**
 * Sticker Catcher - Game Logic
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');
const effectsLayer = document.getElementById('effects-layer');

// Audio System
const audio = {
    catch: new Audio('assets/audio/catch.mp3'),
    hurt: new Audio('assets/audio/hurt.mp3'),
    milestone: new Audio('assets/audio/milestone.mp3'),
    gameover: new Audio('assets/audio/gameover.mp3'),
    muted: false
};
// Preload
Object.values(audio).forEach(s => { if (s.load) s.load(); });

function playSound(name) {
    if (audio.muted) return;
    const sound = audio[name];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Game State
const state = {
    isRunning: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('stickerCatcher_highScore')) || 0,
    lives: 3,
    lastTime: 0,
    spawnTimer: 0,
    spawnInterval: 1000,
    speedMultiplier: 1,
    lastMilestone: 0
};

// Assets
const assets = {
    player: new Image(),
    good: new Image(),
    bad: new Image()
};
assets.player.src = 'assets/player.png';
assets.good.src = 'assets/good.png';
assets.bad.src = 'assets/bad.png';

// Entities
const player = {
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    targetX: 0
};

let items = [];
let particles = [];

// Screen Management
const ui = {
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    scoreDisplay: document.getElementById('score-display'),
    highScoreDisplay: document.getElementById('high-score-display'),
    finalScoreDisplay: document.getElementById('final-score-display'),
    livesDisplay: document.getElementById('lives-display'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    muteBtn: document.getElementById('mute-btn')
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height - 120;

    if (!state.isRunning) {
        player.x = canvas.width / 2 - player.width / 2;
        player.targetX = player.x;
    }
}

// Input Handling
function handleInput(x) {
    let nextX = x - player.width / 2;
    if (nextX < 0) nextX = 0;
    if (nextX > canvas.width - player.width) nextX = canvas.width - player.width;
    player.targetX = nextX;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    if (state.isRunning) handleInput(e.clientX);
});
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (state.isRunning) handleInput(e.touches[0].clientX);
}, { passive: false });

// Game Functions
function startGame() {
    state.isRunning = true;
    state.score = 0;
    state.lives = 3;
    state.spawnInterval = 1000;
    state.speedMultiplier = 1;
    state.lastMilestone = 0;
    items = [];
    particles = [];

    updateUI();
    ui.startScreen.classList.add('hidden');
    ui.startScreen.classList.remove('active');
    ui.gameOverScreen.classList.add('hidden');
    ui.gameOverScreen.classList.remove('active');

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    state.isRunning = false;
    playSound('gameover');

    // Check High Score
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('stickerCatcher_highScore', state.highScore);
        showFloatingText("NEW HIGH SCORE!", canvas.width / 2, canvas.height / 2 - 100);
        createConfetti(canvas.width / 2, canvas.height / 2);
    }

    ui.finalScoreDisplay.innerText = state.score;
    ui.gameOverScreen.classList.remove('hidden');
    ui.gameOverScreen.classList.add('active');
}

function updateUI() {
    ui.scoreDisplay.innerText = state.score;
    ui.highScoreDisplay.innerText = state.highScore;

    // Update hearts
    let hearts = '';
    for (let i = 0; i < state.lives; i++) hearts += '❤️ ';
    ui.livesDisplay.innerText = hearts;
}

function triggerShake() {
    gameContainer.classList.add('shake-effect');
    setTimeout(() => {
        gameContainer.classList.remove('shake-effect');
    }, 500);
}

function showFloatingText(text, x, y) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    effectsLayer.appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

function createParticle(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color: color
        });
    }
}

// Confetti for Big Wins
function createConfetti(x, y) {
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 2.0,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

function spawnItem() {
    const isGood = Math.random() > 0.3;
    const size = 60;
    items.push({
        x: Math.random() * (canvas.width - size),
        y: -100,
        width: size,
        height: size,
        speed: (Math.random() * 2 + 3) * state.speedMultiplier,
        type: isGood ? 'good' : 'bad',
        angle: 0,
        spin: (Math.random() - 0.5) * 0.1
    });
}

function update(dt) {
    player.x += (player.targetX - player.x) * 0.2;

    state.spawnTimer += dt;
    if (state.spawnTimer > state.spawnInterval) {
        spawnItem();
        state.spawnTimer = 0;
        if (state.spawnInterval > 400) state.spawnInterval -= 10;
        state.speedMultiplier += 0.001;
    }

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;
        item.angle += item.spin;

        const padding = 10;
        if (
            item.x < player.x + player.width - padding &&
            item.x + item.width > player.x + padding &&
            item.y < player.y + player.height - padding &&
            item.y + item.height > player.y + padding
        ) {
            if (item.type === 'good') {
                state.score += 10;
                playSound('catch');
                createParticle(item.x + item.width / 2, item.y + item.height / 2, '#FFD700');

                // Milestone Check (every 500)
                if (Math.floor(state.score / 500) > Math.floor(state.lastMilestone / 500)) {
                    playSound('milestone');
                    showFloatingText(`${state.score}!`, canvas.width / 2, canvas.height / 3);
                    createConfetti(canvas.width / 2, canvas.height / 3);
                }
                state.lastMilestone = state.score;

            } else {
                state.lives--;
                playSound('hurt');
                triggerShake(); // Visual Feedback
                createParticle(item.x + item.width / 2, item.y + item.height / 2, '#FF0000');
                if (state.lives <= 0) gameOver();
            }
            updateUI();
            items.splice(i, 1);
            continue;
        }

        if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (assets.player.complete) {
        ctx.drawImage(assets.player, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    items.forEach(item => {
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.angle);
        const img = item.type === 'good' ? assets.good : assets.bad;
        if (img.complete) {
            ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
        } else {
            ctx.fillStyle = item.type === 'good' ? 'gold' : 'green';
            ctx.fillRect(-item.width / 2, -item.height / 2, item.width, item.height);
        }
        ctx.restore();
    });

    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

function gameLoop(timestamp) {
    if (!state.isRunning) return;
    const dt = timestamp - state.lastTime;
    state.lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// Mute Button Logic
ui.muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    ui.muteBtn.innerText = audio.muted ? '🔇' : '🔊';
});

// Init
resize();
ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', startGame);
// Init High Score UI
ui.highScoreDisplay.innerText = state.highScore;
