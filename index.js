const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const font = "monospace";
const keys_pressed = {};
const api = "https://www.gijs6.nl/k";

ctx.fillStyle = "#c5ff8c";
ctx.font = "18px " + font;
ctx.fillText("LOADING...", 90, 165);

const fetch_api = async (endpoint) => {
  const req = await fetch(api + endpoint);
  return req.ok ? await req.text() : 0;
};

let high_score = await fetch_api("/get");
let player = { x: 140, y: 280, w: 20, h: 20 };
let enemies = [];
let coins = [];
let tick = 0;
let coin_tick = 0;
let score = 0;
let game_over = false;
let mouse_down = false;
let ltime = performance.now();

const bind_event = window.addEventListener;

bind_event("click", () => (mouse_down = true));
bind_event("keydown", (e) => (keys_pressed[e.keyCode] = true));
bind_event("keyup", (e) => (keys_pressed[e.keyCode] = false));

bind_event("touchmove", (e) => {
  player.x = (e.touches[0].clientX / document.body.clientWidth) * canvas.width;
});

bind_event("mousemove", (e) => {
  let rect = canvas.getBoundingClientRect();
  player.x = (Math.max(0, e.clientX - rect.left) * canvas.width) / rect.width;
});

// Will gradually decrease
let spawn_interval = 31;
let coin_interval = 120;
const movement_speed = 400;
const base_speed = 300;
const speed_multiplier = 600;
const speed_variance = 120;
const speed_variance_coin = 80;

async function L(ctime) {
  let dt = (ctime - ltime) / 1000;
  ltime = ctime;

  if (game_over) {
    if (score > high_score) {
      // Make sure not to compare a stale high score.
      let fresh = await fetch_api("/get");

      // If you've *really* set a new high score, and
      // the request did not fail, record the new score.
      if (score > fresh && fresh > 0) {
        fetch_api("/new?hs=" + score);
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
      // Restart game
      mouse_down = false;
      enemies = [];
      coins = [];
      game_over = false;
      score = 0;
    }
  } else {
    mouse_down = false;

    if (keys_pressed[37]) player.x -= movement_speed * dt;
    if (keys_pressed[39]) player.x += movement_speed * dt;

    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

    tick += dt * 60;
    coin_tick += dt * 60;

    // So it doesn't go to low
    spawn_interval = Math.max(15, spawn_interval - Math.random() * (0.01 - 0.001) + 0.001);

    if (tick >= spawn_interval) {
      tick = 0;

      let r_component = Math.random() * speed_variance;
      let l_component = Math.sqrt(score * speed_multiplier);

      enemies.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        w: 20,
        h: 20,
        s: base_speed + r_component + l_component,
      });
    }

    if (coin_tick >= coin_interval) {
      coin_tick = 0;

      let r_component = Math.random() * speed_variance_coin;
      let l_component = Math.sqrt(score * speed_variance_coin);

      coins.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        w: 10,
        h: 10,
        s: base_speed + r_component + l_component,
      });
    }

    for (let i = 0; i < enemies.length; i++) {
      enemies[i].y += enemies[i].s * dt;

      if (
        enemies[i].x < player.x + player.w &&
        enemies[i].x + enemies[i].w > player.x &&
        enemies[i].y < player.y + player.h &&
        enemies[i].y + enemies[i].h > player.y
      )
        game_over = true;
    }

    for (let i = 0; i < coins.length; i++) {
      coins[i].y += coins[i].s * dt;

      if (
        coins[i].x < player.x + player.w &&
        coins[i].x + coins[i].w > player.x &&
        coins[i].y < player.y + player.h &&
        coins[i].y + coins[i].h > player.y
      ) {
        score += 2;
        coins.splice(i, 1);
      }
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

    // Draw coins
    ctx.fillStyle = "#f8e86d";
    coins.forEach((e) => ctx.fillRect(e.x, e.y, e.w, e.h));

    // Draw score
    ctx.fillStyle = "#c5ff8c";
    ctx.font = "16px " + font;
    ctx.fillText("s" + score, 10, 20);
    ctx.fillText("h" + high_score, 10, 40);
  }

  requestAnimationFrame(L);
}

requestAnimationFrame(L);
