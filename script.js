const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
const width = canvas.width;
const height = canvas.height;

let score = 0;
let leaderboard = [];

let snake = [{ x: 10 * box, y: 10 * box }];
let direction = "RIGHT";

let fruits = Array.from({ length: 5 }, () => createFood());
let enemies = [];
let powerUp = { x: null, y: null, type: null, active: false, timer: 0 };
let speedBoost = false;

let drawInterval, enemySpawnInterval, powerUpInterval;

function createFood(x = null, y = null, type = null) {
    return {
        x: x !== null ? x : Math.floor(Math.random() * (width / box)) * box,
        y: y !== null ? y : Math.floor(Math.random() * (height / box)) * box,
        type: type || ["🍎", "🍌", "🍇", "🍓", "🍍", "🍎", "🍌", "🍇", "🍓", "🍍"][Math.floor(Math.random() * 10)]
    };
}

function spawnPowerUp() {
    powerUp = {
        x: Math.floor(Math.random() * (width / box)) * box,
        y: Math.floor(Math.random() * (height / box)) * box,
        type: ["⚡", "🛡️", "🧲"][Math.floor(Math.random() * 3)],
        active: true,
        timer: 100
    };
}

function spawnEnemy() {
    const dirOptions = ["LEFT", "UP", "RIGHT", "DOWN"];
    enemies.push({
        body: [
            { x: Math.floor(Math.random() * 28) * box, y: Math.floor(Math.random() * 28) * box },
            { x: -1000, y: -1000 },
            { x: -1000, y: -1000 }
        ],
        dir: dirOptions[Math.floor(Math.random() * 4)],
        alive: true
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    else if (e.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    else if (e.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    else if (e.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
});

// Touch controls
document.getElementById("btn-up").addEventListener("click", () => {
    if (direction !== "DOWN") direction = "UP";
});
document.getElementById("btn-down").addEventListener("click", () => {
    if (direction !== "UP") direction = "DOWN";
});
document.getElementById("btn-left").addEventListener("click", () => {
    if (direction !== "RIGHT") direction = "LEFT";
});
document.getElementById("btn-right").addEventListener("click", () => {
    if (direction !== "LEFT") direction = "RIGHT";
});

function draw() {
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "white" : "lightgray";
        ctx.beginPath();
        ctx.arc(snake[i].x + box / 2, snake[i].y + box / 2, i === 0 ? box / 1.5 : box / 1.8, 0, 2 * Math.PI);
        ctx.fill();

        if (i === 0) {
            ctx.fillStyle = "#00ffff";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Me", snake[i].x + box / 2, snake[i].y - 5);
            ctx.fillStyle = "white";
            ctx.font = "18px Arial";
            ctx.fillText("😄", snake[i].x + box / 2, snake[i].y + box / 2 + 2);
        }
    }

    ctx.font = "18px Arial";
    fruits.forEach((fruit) => {
        ctx.fillText(fruit.type, fruit.x + box / 2, fruit.y + box / 2 + 2);
    });

    if (powerUp.active) {
        ctx.fillText(powerUp.type, powerUp.x + box / 2, powerUp.y + box / 2 + 2);
    }

    let head = { ...snake[0] };
    if (direction === "LEFT") head.x -= box;
    if (direction === "UP") head.y -= box;
    if (direction === "RIGHT") head.x += box;
    if (direction === "DOWN") head.y += box;

    head.x = (head.x + width) % width;
    head.y = (head.y + height) % height;

    let ate = false;
    for (let i = 0; i < fruits.length; i++) {
        if (head.x === fruits[i].x && head.y === fruits[i].y) {
            score++;
            fruits[i] = createFood();
            ate = true;
            break;
        }
    }

    if (!ate) snake.pop();

    if (powerUp.active && head.x === powerUp.x && head.y === powerUp.y) {
        if (powerUp.type === "⚡") speedBoost = true;
        powerUp.active = false;
        powerUp.timer = 100;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return gameOver();
    }

    for (let enemy of enemies) {
        if (!enemy.alive) continue;

        const enemyHead = enemy.body[0];
        for (let part of snake) {
            if (enemyHead.x === part.x && enemyHead.y === part.y) {
                enemy.alive = false;
                for (let part of enemy.body) {
                    fruits.push(createFood(part.x, part.y));
                }
                break;
            }
        }

        for (let part of enemy.body) {
            if (head.x === part.x && head.y === part.y) return gameOver();
        }
    }

    enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        let eHead = { ...enemy.body[0] };
        if (enemy.dir === "LEFT") eHead.x -= box;
        if (enemy.dir === "UP") eHead.y -= box;
        if (enemy.dir === "RIGHT") eHead.x += box;
        if (enemy.dir === "DOWN") eHead.y += box;

        eHead.x = (eHead.x + width) % width;
        eHead.y = (eHead.y + height) % height;

        enemy.body.unshift(eHead);
        if (enemy.body.length > 5) enemy.body.pop();

        if (Math.random() < 0.05) {
            const dirs = ["LEFT", "UP", "RIGHT", "DOWN"];
            enemy.dir = dirs[Math.floor(Math.random() * 4)];
        }

        ctx.fillStyle = "orange";
        enemy.body.forEach((part) => {
            ctx.beginPath();
            ctx.arc(part.x + box / 2, part.y + box / 2, box / 1.8, 0, 2 * Math.PI);
            ctx.fill();
        });
    });

    if (powerUp.timer > 0) powerUp.timer--;
    else speedBoost = false;

    snake.unshift(head);
    document.getElementById("score").innerText = "Score: " + score;
    updateLeaderboard();
}

function updateLeaderboard() {
    leaderboard = [{ name: "You", score }];
    document.getElementById("leaderboard").innerHTML =
        "<strong>Leaderboard</strong><br>" + leaderboard.map(p => `${p.name}: ${p.score}`).join("<br>");
}

function gameOver() {
    clearInterval(drawInterval);
    clearInterval(enemySpawnInterval);
    clearInterval(powerUpInterval);
    alert("Game Over! Final Score: " + score);
    document.location.reload();
}

function startGame() {
    document.getElementById("gameCanvas").style.display = "inline-block";
    document.getElementById("score").style.display = "block";
    document.getElementById("leaderboard").style.display = "block";
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("mobile-controls").style.display = "block";

    for (let i = 0; i < 2; i++) spawnEnemy();

    drawInterval = setInterval(draw, 200);
    enemySpawnInterval = setInterval(() => {
        if (enemies.length < 30) spawnEnemy();
    }, 8000);
    powerUpInterval = setInterval(spawnPowerUp, 10000);
}

document.getElementById("startBtn").addEventListener("click", startGame);
