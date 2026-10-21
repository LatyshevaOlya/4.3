import { resolveCollisions } from "./collision.js";

export class Player {
  constructor(x, y) { this.startX = x; this.startY = y; this.reset(); }
  reset() {
    this.x = this.startX; this.y = this.startY;
    this.w = 36; this.h = 42;
    this.vx = 0; this.vy = 0; this.dt = 0;
    this.onGround = false;
    this.speed = 260; this.jumpPower = 620; this.gravity = 1700;
    this.facing = 1; this.bobT = 0;
  }
  update(dt, input, platforms, worldW) {
    this.dt = dt;
    const accel = 2400;
    let target = 0;
    if (input.left) target -= this.speed;
    if (input.right) target += this.speed;
    if (target !== 0) {
      this.vx += Math.sign(target - this.vx) * accel * dt;
      if (Math.abs(this.vx) > this.speed) this.vx = target;
      this.facing = Math.sign(target);
    } else {
      const fr = 2800 * dt;
      if (Math.abs(this.vx) <= fr) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * fr;
    }
    const jumpPressed = input.consumeJumpPressed();
    if (jumpPressed && this.onGround) { this.vy = -this.jumpPower; this.onGround = false; }
    this.vy += this.gravity * dt;
    if (this.vy > 1400) this.vy = 1400;
    const res = resolveCollisions(this, platforms);
    this.onGround = res.onGround;
    if (this.onGround) {
      for (const pl of platforms) {
        if (pl.moving &&
            Math.abs((this.y + this.h) - pl.y) < 2 &&
            this.x + this.w > pl.x &&
            this.x < pl.x + pl.w) {
          this.x += pl.vx * dt;
          break;
        }
      }
    }
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > worldW) { this.x = worldW - this.w; this.vx = 0; }
    this.bobT += dt * (this.onGround ? 6 : 3);
  }
  draw(ctx) {
    const cx = this.x + this.w / 2;
    const bob = Math.sin(this.bobT) * 2;
    ctx.save();
    ctx.translate(cx, this.y + bob);

    const glow = ctx.createRadialGradient(0, this.h / 2, 4, 0, this.h / 2, 60);
    glow.addColorStop(0, "rgba(142,240,255,0.35)");
    glow.addColorStop(1, "rgba(142,240,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, this.h / 2, 60, 0, Math.PI * 2); ctx.fill();

    const w = this.w, h = this.h;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#dff9ff"); grad.addColorStop(1, "#8ef0ff");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w/2, h);
    ctx.quadraticCurveTo(-w/2, -h*0.1, 0, -h*0.1);
    ctx.quadraticCurveTo(w/2, -h*0.1, w/2, h);
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const px = w/2 - t * w;
      const py = h + (i % 2 === 0 ? -3 : 3);
      ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#12203a";
    const eyeY = h * 0.32, eyeDX = 7;
    ctx.beginPath(); ctx.ellipse(-eyeDX, eyeY, 3.4, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( eyeDX, eyeY, 3.4, 5, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "rgba(180,140,255,0.5)";
    ctx.beginPath(); ctx.arc(-12, h*0.52, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 12, h*0.52, 3, 0, Math.PI*2); ctx.fill();

    ctx.save();
    ctx.translate(this.facing * 20, h * 0.55);
    ctx.fillStyle = "#ffd166"; ctx.strokeStyle = "#ff9e3d"; ctx.lineWidth = 1.5;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
    ctx.moveTo(0, -7); ctx.lineTo(0, 7);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
}