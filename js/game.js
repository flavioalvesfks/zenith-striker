/**
 * ZENITH STRIKER - Core Engine
 * Versão Final Otimizada - Developed by Flávio Alves FK's
 */

// --- CONFIGURAÇÕES ---
const CONFIG = {
    WIDTH: 580,
    HEIGHT: 650,
    SAFE_AREA: 80,
    MAX_SPEED: 3.5,
    FPS: 60
};

// --- ASSETS ---
const assets = {
    images: {},
    sprites: ['player1', 'enemy1', 'enemy2', 'enemy3', 'shot3', 'shield', 
              'slower', 'lifeup', 'explosion', 'trash1', 'trash2', 'life', 
              'cassette-on', 'cassette-off'],
    
    loadAll() {
        this.sprites.forEach(name => {
            const img = new Image();
            img.src = `assets/${name}.png`;
            this.images[name] = img;
        });
    }
};
assets.loadAll();

const AUDIO = {
    bg: new Audio('assets/mp3/spaceship-8-bit.mp3'),
    gameOver: new Audio('assets/mp3/explosion.mp3'),
    
    init() {
        this.bg.loop = true;
        this.bg.volume = 0.4;
        this.gameOver.volume = 0.6;
    }
};
AUDIO.init();

// --- ÁUDIO SINTETIZADO ---
class SoundGenerator {
    constructor() { this.ctx = null; }

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    play(type) {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const sounds = {
            shoot:   { type: 'square',   freq: [600, 100], dur: 0.1, vol: 0.05 },
            powerup: { type: 'sine',     freq: [400, 1000], dur: 0.3, vol: 0.1 },
            hit:     { type: 'sawtooth', freq: [150, 40], dur: 0.2, vol: 0.1 },
            // AJUSTE: Volume de alerta aumentado em 25% (0.125)
            alert:   { type: 'sine',     freq: [980, 980], dur: 0.1, vol: 0.125 }
        };

        const s = sounds[type];
        if (s) {
            osc.type = s.type;
            osc.frequency.setValueAtTime(s.freq[0], now);
            osc.frequency.exponentialRampToValueAtTime(s.freq[1], now + s.dur);
            gain.gain.setValueAtTime(s.vol, now);
            osc.start(); osc.stop(now + s.dur);
        }
    }
}

// --- ENTIDADES ---
class Player {
    constructor() {
        this.w = 50; this.h = 50;
        this.x = CONFIG.WIDTH / 2 - this.w / 2;
        this.y = CONFIG.HEIGHT - 140;
        this.speed = 6;
        this.lives = 3;
        this.tripleShot = 0;
        this.shieldTime = 0;
        this.invulnerable = 0;
        this.dead = false;
        this.particles = [];
    }

    update(keys, dt) {
        if (this.dead) return;
        let mx = (keys['a'] || keys['arrowleft'] ? -1 : 0) + (keys['d'] || keys['arrowright'] ? 1 : 0);
        let my = (keys['w'] || keys['arrowup'] ? -1 : 0) + (keys['s'] || keys['arrowdown'] ? 1 : 0);
        if (mx !== 0 && my !== 0) { mx *= 0.707; my *= 0.707; }

        this.x = Math.max(0, Math.min(CONFIG.WIDTH - this.w, this.x + mx * this.speed));
        this.y = Math.max(0, Math.min(CONFIG.HEIGHT - CONFIG.SAFE_AREA - this.h, this.y + my * this.speed));

        if (this.tripleShot > 0) this.tripleShot -= dt;
        if (this.shieldTime > 0) this.shieldTime -= dt;
        if (this.invulnerable > 0) this.invulnerable -= dt;

        this.updateParticles();
    }

    updateParticles() {
        if (Math.random() > 0.5) {
            this.particles.push({ x: this.x + 15 + Math.random() * 20, y: this.y + 45, life: 1, size: 2 + Math.random() * 3 });
        }
        this.particles = this.particles.filter(p => {
            p.y += 2; p.life -= 0.05;
            return p.life > 0;
        });
    }

    draw(ctx, slowActive) {
        if (this.dead) {
            ctx.drawImage(assets.images.explosion, this.x - 25, this.y - 25, 100, 100);
            return;
        }
        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(255, ${p.life * 150}, 0, ${p.life})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;
        if (slowActive) { ctx.shadowBlur = 5; ctx.shadowColor = '#0ff'; }
        ctx.drawImage(assets.images.player1, this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
        if (this.shieldTime > 0) {
            ctx.strokeStyle = '#0cf'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 40, 0, Math.PI * 2); ctx.stroke();
        }
    }
}

class Enemy {
    constructor(x, type) {
        this.x = x; this.y = -60;
        this.w = 45; this.h = 45;
        this.type = type;
        this.active = true;
        this.speed = (type === 2) ? 2 + Math.random() * 4 : 1.5 + Math.random() * 2;
        this.shootTimer = 1 + Math.random() * 2;
    }

    update(gs, game) {
        this.y += this.speed * gs;
        if (this.type === 1) this.x += Math.sign(game.player.x - this.x) * 1.2;
        if (this.type !== 2) {
            this.shootTimer -= 1/60;
            if (this.shootTimer <= 0) {
                game.enemyBullets.push({ x: this.x + this.w / 2, y: this.y + this.h, w: 6, h: 15, vy: 5 * gs, active: true });
                this.shootTimer = 2 + Math.random() * 2;
            }
        }
        if (this.y > CONFIG.HEIGHT) this.active = false;
    }

    draw(ctx) { ctx.drawImage(assets.images[`enemy${this.type}`], this.x, this.y, this.w, this.h); }
}

// --- ENGINE PRINCIPAL ---
let topScores = JSON.parse(localStorage.getItem('zenithScores')) || [];

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundGenerator();
        this.keys = {};
        this.isPaused = false;
        this.isMusicOn = true;
        this.alertTimer = 0;
        this.initEventListeners();
        this.reset();
    }

    initEventListeners() {
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            if (this.isPaused && e.code === 'KeyM' && !this.isGameOver) this.toggleMusic();
            if (e.code === 'Enter' && !this.isGameOver) this.handlePause();
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
    }

    handlePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            AUDIO.bg.pause();
            this.canvas.style.cursor = 'default';
        } else {
            if (this.isMusicOn) AUDIO.bg.play();
            this.canvas.style.cursor = 'none';
            requestAnimationFrame(() => this.update());
        }
    }

    toggleMusic() {
        this.sound.play('powerup');
        this.isMusicOn = !this.isMusicOn;
    }

    reset() {
        this.player = new Player();
        this.enemies = []; this.obstacles = []; this.powerups = [];
        this.bullets = []; this.enemyBullets = [];
        this.kills = 0; this.distance = 0; this.gameSpeed = 1.0;
        this.shootTimer = 0; this.slowEffectTimer = 0;
        this.isGameOver = false; this.shake = 0; this.alertTimer = 0;
        this.starsBg = Array.from({ length: 50 }, () => ({ x: Math.random() * CONFIG.WIDTH, y: Math.random() * CONFIG.HEIGHT, s: 0.8 }));
        this.starsFg = Array.from({ length: 30 }, () => ({ x: Math.random() * CONFIG.WIDTH, y: Math.random() * CONFIG.HEIGHT, s: 1.8 }));
    }

    spawn() {
        if (Math.random() < 0.015 * this.gameSpeed) {
            const type = Math.random() < 0.2 ? 1 : (Math.random() < 0.5 ? 2 : 3);
            this.enemies.push(new Enemy(Math.random() * (CONFIG.WIDTH - 50), type));
        }
        if (this.obstacles.length < 4 && Math.random() < 0.005 * this.gameSpeed) {
            const type = Math.random() < 0.5 ? 'trash1' : 'trash2';
            this.obstacles.push({ x: Math.random() * (CONFIG.WIDTH - 40), y: -50, w: 40, h: 40, active: true, type, update(gs) { this.y += 4 * gs; if(this.y > CONFIG.HEIGHT) this.active = false; } });
        }
        if (Math.random() < 0.004) {
            let types = ['shot3', 'shield', 'lifeup'];
            if (this.gameSpeed >= CONFIG.MAX_SPEED * 0.75) types.push('slower');
            this.powerups.push({ x: Math.random() * (CONFIG.WIDTH - 40), y: -50, w: 40, h: 40, type: types[Math.floor(Math.random() * types.length)], active: true });
        }
    }

    checkCollisions() {
        const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        this.bullets.forEach(b => {
            this.enemies.forEach(e => {
                if (b.active && e.active && hit(b, e)) { b.active = e.active = false; this.kills++; this.sound.play('hit'); }
            });
        });
        if (this.player.invulnerable <= 0 && !this.player.dead) {
            [...this.enemies, ...this.obstacles, ...this.enemyBullets].forEach(obj => {
                if (obj.active && hit(this.player, obj)) {
                    obj.active = false;
                    if (this.player.shieldTime <= 0) {
                        this.player.lives--;
                        if (this.player.lives <= 0) this.gameOver(); else { this.sound.play('hit'); this.player.invulnerable = 2; }
                    } else this.player.shieldTime = 0;
                }
            });
        }
        this.powerups.forEach(p => {
            if (p.active && hit(this.player, p)) {
                p.active = false; this.sound.play('powerup');
                if (p.type === 'shot3') this.player.tripleShot = 10;
                if (p.type === 'shield') this.player.shieldTime = 12;
                if (p.type === 'lifeup' && this.player.lives < 3) this.player.lives++;
                if (p.type === 'slower') { this.gameSpeed *= 0.5; this.slowEffectTimer = 5; }
            }
        });
    }

    update() {
        if (this.isGameOver || this.isPaused) { this.draw(); return; }
        const dt = 1/60;
        this.distance += dt * 60 * this.gameSpeed;
        if (this.gameSpeed < CONFIG.MAX_SPEED) this.gameSpeed += 0.0006;
        if (this.shake > 0) this.shake *= 0.92;
        this.player.update(this.keys, dt);

        // AJUSTE: Bip Alert (Tensão com 1 Vida)
        if (this.player.lives === 1) {
            this.alertTimer += dt;
            if (this.alertTimer >= 0.7) { 
                this.sound.play('alert'); 
                this.alertTimer = 0; 
            }
        } else {
            this.alertTimer = 0;
        }

        this.handleShooting(dt);
        this.spawn();
        this.checkCollisions();
        this.enemies.forEach(e => e.update(this.gameSpeed, this));
        this.bullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
        this.enemyBullets.forEach(b => { b.y += b.vy; });
        this.powerups.forEach(p => { p.y += 3 * this.gameSpeed; });
        this.obstacles.forEach(o => o.update(this.gameSpeed));
        this.bullets = this.bullets.filter(b => b.active && b.y > -20);
        this.enemies = this.enemies.filter(e => e.active);
        this.obstacles = this.obstacles.filter(o => o.active);
        this.powerups = this.powerups.filter(p => p.active && p.y < CONFIG.HEIGHT + 20);
        this.enemyBullets = this.enemyBullets.filter(b => b.active && b.y < CONFIG.HEIGHT + 20);
        this.draw();
        requestAnimationFrame(() => this.update());
    }

    handleShooting(dt) {
        this.shootTimer -= dt;
        if (this.keys[' '] && this.shootTimer <= 0) {
            this.sound.play('shoot');
            const cx = this.player.x + this.player.w / 2 - 2;
            this.bullets.push({ x: cx, y: this.player.y, w: 4, h: 12, vx: 0, vy: -14, active: true });
            if (this.player.tripleShot > 0) {
                const r = 15 * Math.PI / 180;
                this.bullets.push({ x: cx, y: this.player.y, w: 4, h: 12, vx: -Math.sin(r) * 14, vy: -Math.cos(r) * 14, active: true });
                this.bullets.push({ x: cx, y: this.player.y, w: 4, h: 12, vx: Math.sin(r) * 14, vy: -Math.cos(r) * 14, active: true });
            }
            this.shootTimer = 0.18;
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();
        if (this.shake > 1) ctx.translate(Math.random()*this.shake - this.shake/2, Math.random()*this.shake - this.shake/2);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawStars(ctx);
        this.enemies.forEach(e => e.draw(ctx));
        this.powerups.forEach(p => ctx.drawImage(assets.images[p.type], p.x, p.y, p.w, p.h));
        this.obstacles.forEach(o => {
            ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(255, 255, 0, 0.2)';
            ctx.drawImage(assets.images[o.type], o.x, o.y, o.w, o.h);
            ctx.shadowBlur = 0;
        });
        ctx.fillStyle = '#f00'; this.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.fillStyle = '#ff0'; this.enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        this.player.draw(ctx, this.slowEffectTimer > 0);
        ctx.restore();
        this.drawHUD(ctx);
        if (this.isPaused) this.drawPauseScreen(ctx);
    }

    drawStars(ctx) {
        ctx.fillStyle = this.slowEffectTimer > 0 ? '#0ff' : '#fff';
        [this.starsBg, this.starsFg].forEach((layer, i) => {
            layer.forEach(s => {
                ctx.fillRect(s.x, s.y, s.s, s.s);
                s.y += s.s * this.gameSpeed * (i + 1);
                if (s.y > CONFIG.HEIGHT) { s.y = 0; s.x = Math.random() * CONFIG.WIDTH; }
            });
        });
    }

    drawHUD(ctx) {
        ctx.fillStyle = 'rgba(10, 10, 30, 0.9)'; ctx.fillRect(0, CONFIG.HEIGHT - 70, CONFIG.WIDTH, 70);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'left';
        ctx.fillText(`${Math.floor(this.distance)} Km`, 25, CONFIG.HEIGHT - 30);
        ctx.fillText(`ABATES: ${this.kills}`, 190, CONFIG.HEIGHT - 30);
        const hudK7 = this.isMusicOn ? assets.images['cassette-on'] : assets.images['cassette-off'];
        ctx.drawImage(hudK7, 350, CONFIG.HEIGHT - 50, 30, 30);
        for (let i = 0; i < this.player.lives; i++) {
            ctx.drawImage(assets.images.life, CONFIG.WIDTH - 60 - (i * 35), CONFIG.HEIGHT - 50, 30, 30);
        }
    }

    drawPauseScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        ctx.fillStyle = '#ff0'; ctx.textAlign = 'center';
        const cy = CONFIG.HEIGHT / 2;
        ctx.font = 'bold 35px Courier New'; ctx.fillText('GAME PAUSED', CONFIG.WIDTH / 2, cy - 40);
        ctx.font = '16px Courier New'; ctx.fillText('PRESS ENTER TO RESUME', CONFIG.WIDTH / 2, cy);
        ctx.fillStyle = '#fff'; ctx.fillText('PRESS M TO TOGGLE MUSIC', CONFIG.WIDTH / 2, cy + 40);
        const k7 = this.isMusicOn ? assets.images['cassette-on'] : assets.images['cassette-off'];
        if (Math.floor(Date.now() / 500) % 2 === 0) ctx.drawImage(k7, CONFIG.WIDTH / 2 - 20, cy + 60, 40, 40);
    }

    gameOver() {
        this.player.dead = true; this.isGameOver = true;
        this.canvas.style.cursor = 'default'; this.shake = 55;
        AUDIO.bg.pause(); AUDIO.bg.currentTime = 0; AUDIO.gameOver.play();
        setTimeout(() => showGameOverScreen(this), 1500);
    }
}

// --- FUNÇÕES GLOBAIS ---
let gameInstance = new Game();

function updateRankingUI() {
    topScores.sort((a, b) => b.kills !== a.kills ? b.kills - a.kills : b.distance - a.distance);
    topScores = topScores.slice(0, 10);
    localStorage.setItem('zenithScores', JSON.stringify(topScores));
    const list = document.getElementById('ranking-list');
    if (list) {
        list.innerHTML = topScores.map((s, i) => `
            <div class="rank-row ${i === 0 ? 'champion' : ''}" style="color: ${i === 0 ? '#fb8319' : '#fff'}">
                <span style="color: #ffe229">${i + 1}. ${s.initials}</span>
                <span>${s.kills}</span>
                <span>${Math.floor(s.distance)} Km</span>
            </div>`).join('');
    }
    const champBox = document.getElementById('champion-display');
    if (champBox && topScores.length > 0) {
        champBox.classList.remove('hidden');
        document.getElementById('champ-name').innerText = topScores[0].initials;
        document.getElementById('champ-kills').innerText = topScores[0].kills;
        document.getElementById('champ-dist').innerText = Math.floor(topScores[0].distance) + 'K';
    }
}

function toggleModal(show) { 
    document.getElementById('modal-instructions').classList.toggle('hidden', !show); 
}

function toggleRanking(show) { 
    updateRankingUI();
    document.getElementById('modal-ranking').classList.toggle('hidden', !show); 
}

function saveHighScore() {
    const initials = document.getElementById('player-initials').value.trim() || 'UNK';
    topScores.push({ initials: initials, kills: gameInstance.kills, distance: gameInstance.distance });
    updateRankingUI();
    document.getElementById('new-record-form').classList.add('hidden'); 
    toggleRanking(true); 
}

function showGameOverScreen(game) {
    const screen = document.getElementById('game-over-screen');
    if (!screen) return;
    screen.classList.remove('hidden');
    document.getElementById('final-stats').innerText = `DISTÂNCIA: ${Math.floor(game.distance)} Km | ABATES: ${game.kills}`;
    const isTop10 = topScores.length < 10 || game.kills >= (topScores[topScores.length - 1]?.kills || 0);
    const form = document.getElementById('new-record-form');
    if (isTop10 && game.kills > 0) {
        form.classList.remove('hidden');
        document.getElementById('player-initials').focus();
    } else form.classList.add('hidden');
}

function startGame() {
    ['start-screen', 'game-over-screen'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('gameCanvas').style.cursor = 'none';
    if (gameInstance.isMusicOn) AUDIO.bg.play();
    gameInstance.reset();
    gameInstance.update();
}

updateRankingUI();