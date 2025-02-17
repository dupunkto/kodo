const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const font = "monospace";
const keys_pressed = {};

ctx.fillStyle = "#c5ff8c";
ctx.font = "18px " + font;
ctx.fillText("LOADING..", 90, 165);

let player = { x: 140, y: 280, w: 20, h: 20, speed: 5 };
let enemies = [];
let tick = 0;
let spawn_interval = 30;
let score = 0;
let game_over = false;
let mouse_down = false;

const fetch_highscore = async () => {
  const req = await fetch("https://api.geheimesite.nl/kodo/get");
  return req.ok ? await req.text() : 0;
}

const new_highscore = async (s) => {
  return await fetch("https://api.geheimesite.nl/kodo/new", {
    method: "POST",
    body: "hs=" + s,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

let high_score = await fetch_highscore();

window.addEventListener("click", (e) => (mouse_down = true));
window.addEventListener("keydown", (e) => (keys_pressed[e.keyCode] = true));
window.addEventListener("keyup", (e) => (keys_pressed[e.keyCode] = false));

window.addEventListener("touchmove", (e) => {
  player.x = (e.touches[0].clientX / document.body.clientWidth) * canvas.width;
});

window.addEventListener("mousemove", (e) => {
  player.x = (e.offsetX * canvas.width) / canvas.offsetWidth;
});

(async function L() {
  if (game_over) {
    if (score > high_score) {
      // Make sure not to compare a stale high score.
      let fresh = await fetch_highscore();

      // If you've *really* set a new high score, and
      // the request did not fail, record the new score.
      if(score > fresh && fresh > 0) {
        new_highscore(score);
        high_score = score;
      }

      score = 0;
    }

    ctx.fillStyle = "#c5ff8c";
    ctx.font = "18px " + font;
    ctx.fillText("DEAD", 120, 165);
    ctx.font = "12px " + font;
    ctx.fillText("[space] = again", 85, 180);

    if (keys_pressed[32] || mouse_down) {
      mouse_down = false;
      enemies = [];
      game_over = false;
      score = 0;
    }
  } else {
    mouse_down = false;

    if (keys_pressed[37]) player.x -= player.speed;
    if (keys_pressed[39]) player.x += player.speed;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.w) player.x = canvas.width - player.w;

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
    ctx.fillText("s " + score, 10, 20);
    ctx.fillText("h " + high_score, 10, 40);
  }

  requestAnimationFrame(L);
})();
