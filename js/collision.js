export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export function resolveCollisions(player, platforms) {
  let onGround = false;
  player.x += player.vx * player.dt;
  for (const p of platforms) {
    if (aabb(player, p)) {
      if (player.vx > 0) player.x = p.x - player.w;
      else if (player.vx < 0) player.x = p.x + p.w;
      player.vx = 0;
    }
  }
  player.y += player.vy * player.dt;
  for (const p of platforms) {
    if (aabb(player, p)) {
      if (player.vy > 0) { player.y = p.y - player.h; player.vy = 0; onGround = true; }
      else if (player.vy < 0) { player.y = p.y + p.h; player.vy = 0; }
    }
  }
  return { onGround };
}