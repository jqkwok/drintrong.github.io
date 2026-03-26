// 春节日期：2026年2月17日
const springFestivalDate = new Date('2026-02-17T00:00:00');

// DOM元素
const daysElement = document.getElementById('days');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');

const blessingCards = document.querySelectorAll('.blessing-card');
const nextBlessingBtn = document.getElementById('nextBlessing');
const lanternClick = document.getElementById('lanternClick');
const fireworksBtn = document.getElementById('fireworksBtn');
const musicToggle = document.getElementById('musicToggle');
const newYearMusic = document.getElementById('newYearMusic');
const lanternSound = document.getElementById('lanternSound');

// 烟花画布
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

// 设置画布尺寸
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 烟花粒子系统
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.velocity.y += 0.05; // 重力
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Firework {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.colors = ['#ffd700', '#ff6b00', '#ff3333', '#ffffff'];

        // 创建粒子
        for (let i = 0; i < 100; i++) {
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.particles.push(new Particle(this.x, this.y, color));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        this.particles.forEach(particle => particle.draw());
    }

    isFinished() {
        return this.particles.length === 0;
    }
}

// 烟花数组
let fireworks = [];
let animationId = null;

// 绘制烟花
function drawFireworks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw();

        if (fireworks[i].isFinished()) {
            fireworks.splice(i, 1);
        }
    }

    if (fireworks.length > 0 || animationId !== null) {
        animationId = requestAnimationFrame(drawFireworks);
    }
}

// 创建随机烟花
function createRandomFirework() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height / 2;
    fireworks.push(new Firework(x, y));

    if (animationId === null) {
        drawFireworks();
    }
}

// 创建多个烟花
function createFireworks(count = 5) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createRandomFirework();
        }, i * 200);
    }
}

// 更新倒计时
function updateCountdown() {
    const now = new Date();
    const diff = springFestivalDate - now;

    if (diff <= 0) {
        daysElement.textContent = '00';
        hoursElement.textContent = '00';
        minutesElement.textContent = '00';
        secondsElement.textContent = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysElement.textContent = days.toString().padStart(2, '0');
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
}

// 祝福语轮播
let currentBlessing = 0;

function showNextBlessing() {
    // 移除当前激活状态
    blessingCards.forEach(card => card.classList.remove('active'));

    // 更新索引
    currentBlessing = (currentBlessing + 1) % blessingCards.length;

    // 添加新激活状态
    blessingCards[currentBlessing].classList.add('active');
}

// 灯笼点击效果
function handleLanternClick() {
    // 播放音效
    lanternSound.currentTime = 0;
    lanternSound.play().catch(e => console.log("音频播放失败:", e));

    // 添加动画效果
    const lanterns = document.querySelectorAll('.lantern');
    lanterns.forEach(lantern => {
        lantern.style.animation = 'none';
        setTimeout(() => {
            lantern.style.animation = '';
        }, 100);
    });

    // 创建金色粒子效果
    createGoldenParticles();
}

// 创建金色粒子效果
function createGoldenParticles() {
    const particleCount = 30;
    const colors = ['#ffd700', '#ffed4e', '#fff9c4'];

    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = new Particle(x, y, color);
            particle.velocity = {
                x: (Math.random() - 0.5) * 4,
                y: -(Math.random() * 8 + 4)
            };
            particle.decay = 0.02;
            particle.size = Math.random() * 4 + 2;

            // 临时添加到烟花系统
            fireworks.push(particle);

            if (animationId === null) {
                drawFireworks();
            }
        }, i * 30);
    }
}

// 音乐控制
let isMusicPlaying = false;

function toggleMusic() {
    if (isMusicPlaying) {
        newYearMusic.pause();
        musicToggle.querySelector('.interactive-icon').textContent = '🎵';
        musicToggle.querySelector('.interactive-text').textContent = '播放音乐';
    } else {
        newYearMusic.play().catch(e => {
            console.log("音乐播放失败:", e);
            // 如果自动播放被阻止，显示提示
            alert('请点击页面任意位置后再次点击播放按钮以播放音乐');
        });
        musicToggle.querySelector('.interactive-icon').textContent = '⏸️';
        musicToggle.querySelector('.interactive-text').textContent = '暂停音乐';
    }
    isMusicPlaying = !isMusicPlaying;
}

// 初始化函数
function init() {
    // 设置画布尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化倒计时
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 祝福语轮播
    nextBlessingBtn.addEventListener('click', showNextBlessing);

    // 自动轮播祝福语
    setInterval(showNextBlessing, 5000);

    // 灯笼点击事件
    lanternClick.addEventListener('click', handleLanternClick);

    // 烟花按钮事件
    fireworksBtn.addEventListener('click', () => {
        createFireworks(8);
    });

    // 音乐控制事件
    musicToggle.addEventListener('click', toggleMusic);

    // 页面点击事件（用于音频自动播放）
    document.addEventListener('click', () => {
        // 尝试恢复音频上下文（如果需要）
        if (newYearMusic.paused && !isMusicPlaying) {
            // 不自动播放，等待用户点击音乐按钮
        }
    });

    // 随机生成一些初始烟花
    setTimeout(() => {
        createFireworks(3);
    }, 1000);

    // 添加鼠标移动烟花效果
    let mouseX = 0;
    let mouseY = 0;
    let mouseFireworkTimer = null;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // 限制烟花生成频率
        if (mouseFireworkTimer) clearTimeout(mouseFireworkTimer);

        mouseFireworkTimer = setTimeout(() => {
            if (Math.random() > 0.7) { // 30% 几率生成跟随烟花
                fireworks.push(new Firework(mouseX, mouseY));
                if (animationId === null) {
                    drawFireworks();
                }
            }
        }, 100);
    });

    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case ' ':
                toggleMusic();
                break;
            case 'ArrowRight':
                showNextBlessing();
                break;
            case 'f':
            case 'F':
                createFireworks(5);
                break;
            case 'l':
            case 'L':
                handleLanternClick();
                break;
        }
    });

    // 显示欢迎消息
    console.log('%c🎉 马年大吉！新春快乐！ 🎉', 'color: #ffd700; font-size: 18px; font-weight: bold;');
    console.log('%c快捷键：空格键 - 播放/暂停音乐 | 方向键右键 - 下一条祝福 | F - 燃放烟花 | L - 点亮灯笼', 'color: #ff6b00;');
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);