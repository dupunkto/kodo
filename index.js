const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const font = "monospace";
const keys_pressed = {};

let player = { x: 140, y: 280, w: 20, h: 20, speed: 5 };
let enemies = [];
let tick = 0;
let spawn_interval = 30;
let score = 0;
let game_over = false;

window.addEventListener("keydown", (e) => (keys_pressed[e.keyCode] = true));
window.addEventListener("keyup", (e) => (keys_pressed[e.keyCode] = false));

(function L() {
  if (game_over) {
    ctx.fillStyle = "#c5ff8c";
    ctx.font = "18px " + font;
    ctx.fillText("DEAD", 120, 165);
    ctx.font = "12px " + font;
    ctx.fillText("[space] = again", 85, 180);

    if (keys_pressed[32]) {
      console.log("restarting");
      enemies = [];
      game_over = false;
      score = 0;
    }
  } else {
    if (keys_pressed[37] && player.x > 0) player.x -= player.speed;
    if (keys_pressed[39] && player.x < canvas.width - player.w)
      player.x += player.speed;

    tick++;

    if (tick >= spawn_interval) {
      tick = 0;

      enemies.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        w: 20,
        h: 20,
        s: 3 + Math.random() + Math.sqrt(score) / 10,
      });
    }

    for (let i = 0; i < enemies.length; i++) {
      enemies[i].y += enemies[i].s;

      if (
        enemies[i].x < player.x + player.w &&
        enemies[i].x + enemies[i].w > player.x &&
        enemies[i].y < player.y + player.h &&
        enemies[i].y + enemies[i].h > player.y
      )
        game_over = true;
    }

    enemies = enemies.filter((e) =>
      e.y <= canvas.height ? true : (score++, false)
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = "#38ba8b";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Draw enemies
    ctx.fillStyle = "#227a7a";
    enemies.forEach((e) => ctx.fillRect(e.x, e.y, e.w, e.h));

    // Draw score
    ctx.fillStyle = "#c5ff8c";
    ctx.font = "16px " + font;
    ctx.fillText(score, 10, 20);
  }

  requestAnimationFrame(L);
})();
