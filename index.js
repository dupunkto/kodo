const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const font = "monospace";
const keys_pressed = {};
const api = "https://www.gijs6.nl/k";

// Often used, but canvas.width and canvas.height
// can't be minified, but variables can.
const canvas_w = canvas.width;
const canvas_h = canvas.height;

ctx.fillStyle = "#c5ff8c";
ctx.font = "18px " + font;
ctx.fillText("LOADING..", 90, 165);

const fetch_api = async (endpoint) => {
  const req = await fetch(api + endpoint);
  return req.ok ? await req.text() : 0;
};

let high_score = await fetch_api("/get");
let player = { x: 140, y: 280, w: 20 };
let coins = [];
let enemies = [];
let coin_tick = 0;
let enemy_tick = 0;
let score = 0;
let game_over = false;
let mouse_down = false;
let ltime = performance.now();

const bind_event = window.addEventListener;

bind_event("click", () => (mouse_down = true));
bind_event("keydown", (e) => (keys_pressed[e.keyCode] = true));
bind_event("keyup", (e) => (keys_pressed[e.keyCode] = false));

bind_event("touchmove", (e) => {
  player.x = (e.touches[0].clientX / document.body.clientWidth) * canvas_w;
});

bind_event("mousemove", (e) => {
  let rect = canvas.getBoundingClientRect();
  player.x = (Math.max(0, e.clientX - rect.left) * canvas_w) / rect.width;
});

// Will gradually decrease
let coin_interval = 120;
let enemy_interval = 35;

const movement_speed = 400;
const base_speed = 300;
const speed_multiplier = 600;
const speed_variance_coin = 80;
const speed_variance_enemy = 120;

async function L(ctime) {
  let dt = (ctime - ltime) / 1000;
  ltime = ctime;

  if (game_over) {
    ctx.fillStyle = "#c5ff8c";
    ctx.font = "18px " + font;

    if (score > high_score) {
      // Make sure not to compare a stale high score.
      let fresh = await fetch_api("/get");

      // If you've *really* set a new high score, and
      // the request did not fail, record the new score.
      if (score > fresh && fresh > 0) {
        fetch_api("/new?hs=" + score);
        high_score = score;
        ctx.fillText("NEW HIGH SCORE", 80, 120);
      }
    }

    ctx.fillText("DEAD", 120, 165);
    ctx.font = "12px " + font;
    ctx.fillText("[space]=again", 85, 180);

    if (keys_pressed[32] || mouse_down) {
      // Restart game
      enemies = [];
      coins = [];
      game_over = false;
      score = 0;
    }
  } else {
    mouse_down = false;

    if (keys_pressed[37]) player.x -= movement_speed * dt;
    if (keys_pressed[39]) player.x += movement_speed * dt;

    // Make sure the player cannot teleport out of the screen.
    player.x = Math.max(0, Math.min(canvas_w - player.w, player.x));

    coin_tick += dt * 60;
    enemy_tick += dt * 60;

    // Gradually (but a bit randomly) decrease spawn interval but ensure
    // it doesn't drop below a minimum value.
    enemy_interval = Math.max(15, enemy_interval - Math.random() * 0.007 + 0.001);

    const spawn = (collection, size, speed_variance) => {
      let r_component = Math.random() * speed_variance;
      let l_component = Math.sqrt(score * speed_multiplier);

      const random_speed = base_speed + r_component + l_component;
      const random_position = Math.random() * (canvas_w - 20);

      collection.push({
        x: random_position,
        y: -20,
        w: size,
        s: random_speed,
      });
    };

    if (enemy_tick >= enemy_interval) {
      spawn(enemies, 20, speed_variance_enemy);
      enemy_tick = 0;
    }

    if (coin_tick >= coin_interval) {
      spawn(coins, 10, speed_variance_coin);
      coin_tick = 0;
    }

    const collide = (a, b) => (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.w &&
      a.y + a.w > b.y
    );

    enemies = enemies.filter((enemy) => {
      enemy.y += enemy.s * dt;
      if (collide(enemy, player)) game_over = true;
      return enemy.y <= canvas_h ? true : (score++, false);
    });

    coins = coins.filter((coin) => {
      coin.y += coin.s * dt;
      if (collide(coin, player)) {
        return (score += 5), false;
      }
      return coin.y <= canvas_h;
    });

    const draw = (e) => ctx.fillRect(e.x, e.y, e.w, e.w);

    ctx.clearRect(0, 0, canvas_w, canvas_h);

    // Draw player
    ctx.fillStyle = "#38ba8b";
    draw(player);

    // Draw enemies
    ctx.fillStyle = "#227a7a";
    enemies.forEach(draw);

    // Draw coins
    ctx.fillStyle = "#f8e86d";
    coins.forEach(draw);

    // Draw score
    ctx.fillStyle = "#c5ff8c";
    ctx.font = "16px " + font;
    ctx.fillText("s" + score, 10, 20);
    ctx.fillText("h" + high_score, 10, 40);
  }

  requestAnimationFrame(L);
}

requestAnimationFrame(L);
