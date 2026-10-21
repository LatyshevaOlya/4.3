import { Player } from "./Player.js";
import { Input } from "./input.js";
import { aabb } from "./collision.js";

const W = 960, H = 540;
const WORLD_W = 2400;
const GROUND_Y = H - 40;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.worldW = WORLD_W;
    this.cameraX = 0;

    this.input = new Input();
    this.player = new Player(80, H - 140);

    this.state = "menu";
    this.rafId = null;
    this.lastTime = 0;

    this.score = 0;
    this.totalItems = 5;
    this.bestScore = this._loadBest();

    this.onHudChange = null;
    this.onWin = null;
    this.onLose = null;

    this._movingPlat = null;
    this._buildLevel();
    this._buildForest();

    this.fireflies = [];
    for (let i = 0; i < 30; i++) {
      this.fireflies.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.6,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 0.6 + 0.3
      });
    }

    this.bats = [];
    for (let i = 0; i < 6; i++) {
      this.bats.push(this._makeBat(
        Math.random() * WORLD_W,
        90 + Math.random() * 220,
        (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 50),
        Math.random() * Math.PI * 2
      ));
    }

    this.time = 0;
  }

  _buildLevel() {
    this.platforms = [
      { x: 0,    y: GROUND_Y, w: WORLD_W, h: 40, kind: "ground" },
      { x: 180,  y: H - 130, w: 150, h: 18 },
      { x: 400,  y: H - 210, w: 130, h: 18 },
      { x: 620,  y: H - 170, w: 140, h: 18 },
      { x: 830,  y: H - 250, w: 120, h: 18 },
      { x: 1040, y: H - 320, w: 130, h: 18 },
      { x: 1040, y: H - 190, w: 130, h: 18 },
      { x: 1480, y: H - 200, w: 140, h: 18 },
      { x: 1680, y: H - 130, w: 140, h: 18 },
      { x: 1860, y: H - 230, w: 130, h: 18 },
      { x: 2010, y: H - 200, w: 120, h: 18 },
      { x: 2140, y: H - 260, w: 140, h: 18 }
    ];

    this._movingPlat = {
      x: 1240, y: H - 220, w: 120, h: 16,
      vx: 90, minX: 1240, maxX: 1360,
      moving: true
    };
    this.platforms.push(this._movingPlat);

    this.items = [
      { x: 255,  y: H - 175, r: 12, taken: false, phase: 0.0 },
      { x: 470,  y: H - 255, r: 12, taken: false, phase: 0.7 },
      { x: 890,  y: H - 295, r: 12, taken: false, phase: 1.4 },
      { x: 1100, y: H - 365, r: 12, taken: false, phase: 2.1 },
      { x: 2070, y: H - 265, r: 12, taken: false, phase: 2.8 }
    ];

    this.hazards = [
      { x: 760,  y: GROUND_Y - 20, w: 80,  h: 20, kind: "pool" },
      { x: 1300, y: GROUND_Y - 20, w: 100, h: 20, kind: "pool" },
      { x: 1600, y: GROUND_Y - 20, w: 70,  h: 20, kind: "spikes" },
      { x: 1970, y: GROUND_Y - 20, w: 80,  h: 20, kind: "pool" }
    ];

    this.finish = { x: 2300, y: H - 160, w: 70, h: 120 };

    this.score = 0;
    this.totalItems = this.items.length;
    for (const it of this.items) it.taken = false;
  }

  _buildForest() {
    this.treeLayers = [
      { parallax: 0.25, color: "#0d1a35", trees: this._genTrees(0.25, 22, 0.7) },
      { parallax: 0.45, color: "#122242", trees: this._genTrees(0.45, 20, 1.0) },
      { parallax: 0.65, color: "#1a2f52", trees: this._genTrees(0.65, 18, 1.3) }
    ];
    this.mushrooms = [];
    for (let i = 0; i < 26; i++) {
      this.mushrooms.push({
        x: Math.random() * WORLD_W,
        baseY: H - 40 - 4 - Math.random() * 8,
        r: 4 + Math.random() * 5,
        hue: Math.random() < 0.5 ? "rgba(180,140,255," : "rgba(255,180,220,",
        phase: Math.random() * Math.PI * 2
      });
    }
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * (H * 0.6),
        r: Math.random() * 1.2 + 0.3,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  _genTrees(parallax, count, scale) {
    const arr = [];
    const spanW = W + WORLD_W * parallax;
    for (let i = 0; i < count; i++) {
      const x = (i / count) * spanW + Math.random() * 40 - 20;
      const h = (110 + Math.random() * 90) * scale;
      const w = (36 + Math.random() * 22) * scale;
      arr.push({ x, h, w });
    }
    return arr;
  }

  _makeBat(x, y, vx, phase) {
    return {
      x, y,
      baseY: y,
      vx,
      phase,
      wing: 0,
      size: 8 + Math.random() * 4
    };
  }

  start() {
    if (this.state === "playing") return;
    if (this.state === "win" || this.state === "gameover") this._resetWorld();
    this.state = "playing";
    this.lastTime = 0;
    this._ensureLoop();
  }
  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.input.reset();
    this._stopLoop();
  }
  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.lastTime = 0;
    this._ensureLoop();
  }
  restart() {
    this._stopLoop();
    this._resetWorld();
    this.state = "playing";
    this.lastTime = 0;
    this._ensureLoop();
  }
  _resetWorld() {
    this._buildLevel();
    this.player.reset();
    this.input.reset();
    this.cameraX = 0;
    if (this.onHudChange) this.onHudChange();
  }
  _ensureLoop() {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(this._tick);
  }
  _stopLoop() {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }
  _tick = (ts) => {
    this.rafId = null;
    if (this.state !== "playing") return;
    if (!this.lastTime) this.lastTime = ts;
    let dt = (ts - this.lastTime) / 1000;
    this.lastTime = ts;
    if (dt > 0.05) dt = 0.05;
    this.update(dt);
    this.render();
    if (this.state === "playing") this.rafId = requestAnimationFrame(this._tick);
  };

  update(dt) {
    this.time += dt;

    const mp = this._movingPlat;
    mp.x += mp.vx * dt;
    if (mp.x < mp.minX) { mp.x = mp.minX; mp.vx = Math.abs(mp.vx); }
    if (mp.x > mp.maxX) { mp.x = mp.maxX; mp.vx = -Math.abs(mp.vx); }
    const sign = mp.vx >= 0 ? 1 : -1;
    mp.vx = sign * 90;

    const p = this.player;
    p.update(dt, this.input, this.platforms, this.worldW);

    const targetCam = Math.max(0, Math.min(this.worldW - W, p.x + p.w / 2 - W / 2));
    this.cameraX += (targetCam - this.cameraX) * Math.min(1, dt * 8);

    if (p.y > H + 60) { this._lose("Приведение упало в пропасть."); return; }

    for (const hz of this.hazards) {
      if (aabb(p, hz)) {
        const msg = hz.kind === "spikes"
          ? "Приведение наткнулось на шипы."
          : "Приведение коснулось тёмной лужи.";
        this._lose(msg);
        return;
      }
    }

    for (const it of this.items) {
      if (it.taken) continue;
      const box = { x: it.x - it.r, y: it.y - it.r, w: it.r * 2, h: it.r * 2 };
      if (aabb(p, box)) {
        it.taken = true;
        this.score++;
        if (this.onHudChange) this.onHudChange();
      }
    }

    if (this.score >= this.totalItems && aabb(p, this.finish)) this._win();

    for (const f of this.fireflies) {
      f.p += dt * f.s;
      f.x += Math.cos(f.p) * 6 * dt;
      f.y += Math.sin(f.p) * 6 * dt;
      if (f.x < 0) f.x = W;
      if (f.x > W) f.x = 0;
      if (f.y < 0) f.y = H;
      if (f.y > H) f.y = 0;
    }

    for (const b of this.bats) {
      b.phase += dt * 2.5;
      b.wing += dt * 12;
      b.x += b.vx * dt;
      b.y = b.baseY + Math.sin(b.phase) * 14;
      if (b.x < -60) { b.x = WORLD_W + 40; b.baseY = 90 + Math.random() * 220; }
      if (b.x > WORLD_W + 60) { b.x = -40; b.baseY = 90 + Math.random() * 220; }
    }
  }

  _win() {
    this.state = "win";
    this._stopLoop();
    const nb = Math.max(this.bestScore, this.score);
    if (nb !== this.bestScore) { this.bestScore = nb; this._saveBest(); }
    if (this.onHudChange) this.onHudChange();
    if (this.onWin) this.onWin();
  }
  _lose(reason) {
    this.state = "gameover";
    this._stopLoop();
    if (this.onLose) this.onLose(reason);
  }
  _loadBest() {
    try { const v = localStorage.getItem("ghost_courier_best"); return v ? parseInt(v, 10) || 0 : 0; }
    catch (e) { return 0; }
  }
  _saveBest() {
    try { localStorage.setItem("ghost_courier_best", String(this.bestScore)); } catch (e) {}
  }

  render() {
    const ctx = this.ctx;
    const cam = this.cameraX;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#080a24");
    sky.addColorStop(0.5, "#161a44");
    sky.addColorStop(1, "#2d1e4d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    for (const s of this.stars) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 1.5 + s.tw));
      ctx.fillStyle = "rgba(255,255,255," + a + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

    const moonX = 780 - cam * 0.1;
    const mg = ctx.createRadialGradient(moonX, 100, 10, moonX, 100, 100);
    mg.addColorStop(0, "rgba(220,235,255,0.95)");
    mg.addColorStop(1, "rgba(220,235,255,0)");
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(moonX, 100, 100, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#eef4ff";
    ctx.beginPath(); ctx.arc(moonX, 100, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(190,210,240,0.5)";
    ctx.beginPath(); ctx.arc(moonX - 8, 94, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + 12, 110, 5, 0, Math.PI * 2); ctx.fill();

    for (const layer of this.treeLayers) {
      const offset = cam * layer.parallax;
      ctx.fillStyle = layer.color;
      for (const t of layer.trees) {
        const bx = t.x - offset;
        if (bx + t.w < -40 || bx - t.w > W + 40) continue;
        this._drawFir(ctx, bx, GROUND_Y, t.w, t.h, layer.color);
      }
    }

    const fog = ctx.createLinearGradient(0, H - 180, 0, H);
    fog.addColorStop(0, "rgba(120,140,220,0)");
    fog.addColorStop(1, "rgba(120,140,220,0.12)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, H - 180, W, 180);

    for (const m of this.mushrooms) {
      const mx = m.x - cam;
      if (mx < -20 || mx > W + 20) continue;
      const glow = 0.6 + 0.4 * Math.sin(this.time * 2 + m.phase);
      const g = ctx.createRadialGradient(mx, m.baseY, 1, mx, m.baseY, m.r * 3);
      g.addColorStop(0, m.hue + (0.6 * glow) + ")");
      g.addColorStop(1, m.hue + "0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(mx, m.baseY, m.r * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = m.hue + "0.9)";
      ctx.beginPath(); ctx.arc(mx, m.baseY, m.r, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "rgba(200,200,255,0.4)";
      ctx.fillRect(mx - 1, m.baseY, 2, 4);
    }

    for (const f of this.fireflies) {
      const a = 0.25 + Math.abs(Math.sin(f.p)) * 0.4;
      ctx.fillStyle = "rgba(180,220,255," + a + ")";
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    }

    for (const b of this.bats) {
      const bx = b.x - cam * 0.55;
      if (bx < -40 || bx > W + 40) continue;
      const flap = Math.sin(b.wing) * 6;
      const s = b.size;
      ctx.save();
      ctx.translate(bx, b.y);

      ctx.fillStyle = "rgba(20,15,40,0.9)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-s * 1.6, -s * 0.6 - flap, -s * 2.4, s * 0.2);
      ctx.quadraticCurveTo(-s * 1.2, s * 0.3, 0, s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 1.6, -s * 0.6 - flap, s * 2.4, s * 0.2);
      ctx.quadraticCurveTo(s * 1.2, s * 0.3, 0, s * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(30,22,55,0.95)";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.55, s * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.4);
      ctx.lineTo(-s * 0.5, -s * 0.9);
      ctx.lineTo(-s * 0.1, -s * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.35, -s * 0.4);
      ctx.lineTo(s * 0.5, -s * 0.9);
      ctx.lineTo(s * 0.1, -s * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,90,120,0.95)";
      ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.05, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( s * 0.18, -s * 0.05, 1.6, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }

    ctx.save();
    ctx.translate(-cam, 0);

    for (const pl of this.platforms) {
      if (pl.kind === "ground") {
        const g = ctx.createLinearGradient(0, pl.y, 0, pl.y + pl.h);
        g.addColorStop(0, "#2a2350");
        g.addColorStop(1, "#0f0a26");
        ctx.fillStyle = g;
        ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
        ctx.fillStyle = "rgba(142,240,255,0.25)";
        ctx.fillRect(pl.x, pl.y, pl.w, 2);
      } else if (pl.moving) {
        ctx.fillStyle = "rgba(120,90,220,0.9)";
        ctx.strokeStyle = "rgba(200,170,255,0.9)";
        ctx.lineWidth = 2;
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(pl.x + r, pl.y);
        ctx.lineTo(pl.x + pl.w - r, pl.y);
        ctx.quadraticCurveTo(pl.x + pl.w, pl.y, pl.x + pl.w, pl.y + r);
        ctx.lineTo(pl.x + pl.w, pl.y + pl.h);
        ctx.lineTo(pl.x, pl.y + pl.h);
        ctx.lineTo(pl.x, pl.y + r);
        ctx.quadraticCurveTo(pl.x, pl.y, pl.x + r, pl.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(220,200,255,0.75)";
        ctx.fillRect(pl.x + 4, pl.y + 2, pl.w - 8, 1.5);
      } else {
        ctx.fillStyle = "rgba(60,50,110,0.9)";
        ctx.strokeStyle = "rgba(142,240,255,0.55)";
        ctx.lineWidth = 2;
        const r = 8;
        ctx.beginPath();
        ctx.moveTo(pl.x + r, pl.y);
        ctx.lineTo(pl.x + pl.w - r, pl.y);
        ctx.quadraticCurveTo(pl.x + pl.w, pl.y, pl.x + pl.w, pl.y + r);
        ctx.lineTo(pl.x + pl.w, pl.y + pl.h);
        ctx.lineTo(pl.x, pl.y + pl.h);
        ctx.lineTo(pl.x, pl.y + r);
        ctx.quadraticCurveTo(pl.x, pl.y, pl.x + r, pl.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(142,240,255,0.4)";
        ctx.fillRect(pl.x + 4, pl.y + 2, pl.w - 8, 1.5);
      }
    }

    for (const hz of this.hazards) {
      if (hz.kind === "spikes") {
        const n = Math.floor(hz.w / 18);
        for (let i = 0; i < n; i++) {
          const sx = hz.x + i * 18;
          ctx.fillStyle = "rgba(255,90,120,0.9)";
          ctx.beginPath();
          ctx.moveTo(sx, hz.y + hz.h);
          ctx.lineTo(sx + 9, hz.y);
          ctx.lineTo(sx + 18, hz.y + hz.h);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(255,40,80,0.95)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(60,10,30,0.95)";
        ctx.fillRect(hz.x, hz.y + hz.h - 3, hz.w, 3);
      } else {
        const g = ctx.createLinearGradient(0, hz.y, 0, hz.y + hz.h);
        g.addColorStop(0, "rgba(100,20,80,0.95)");
        g.addColorStop(1, "rgba(30,0,40,0.98)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(hz.x, hz.y + hz.h);
        ctx.quadraticCurveTo(hz.x + hz.w / 2, hz.y - 10, hz.x + hz.w, hz.y + hz.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,60,120,0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const t = (this.time * 1.5 + i) % 1;
          ctx.fillStyle = "rgba(255,60,120," + (0.7 * (1 - t)) + ")";
          ctx.beginPath();
          ctx.arc(hz.x + hz.w * (0.25 + 0.25 * i), hz.y + 5 - t * 22, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    for (const it of this.items) {
      if (it.taken) continue;
      const pulse = Math.sin(this.time * 3 + it.phase) * 2;
      const R = it.r + pulse;
      const g = ctx.createRadialGradient(it.x, it.y, 1, it.x, it.y, R * 3.5);
      g.addColorStop(0, "rgba(255,230,120,0.95)");
      g.addColorStop(1, "rgba(255,230,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(it.x, it.y, R * 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff3b0";
      ctx.beginPath(); ctx.arc(it.x, it.y, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.arc(it.x - 2, it.y - 2, R * 0.4, 0, Math.PI * 2); ctx.fill();
    }

    const active = this.score >= this.totalItems;
    const fin = this.finish;
    if (active) {
      const g = ctx.createRadialGradient(
        fin.x + fin.w / 2, fin.y + fin.h / 2, 4,
        fin.x + fin.w / 2, fin.y + fin.h / 2, 100
      );
      g.addColorStop(0, "rgba(120,255,160,0.65)");
      g.addColorStop(1, "rgba(120,255,160,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fin.x + fin.w / 2, fin.y + fin.h / 2, 100, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = active ? "rgba(120,255,160,0.95)" : "rgba(120,140,180,0.65)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(fin.x + fin.w / 2, fin.y + fin.h / 2, fin.w / 2, fin.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = active ? "rgba(180,255,210,0.7)" : "rgba(150,170,210,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(fin.x + fin.w / 2, fin.y + fin.h / 2, fin.w / 2 - 6, fin.h / 2 - 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = active ? "#7dffa8" : "#8ea0c0";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(active ? "ПОРТАЛ ✓" : "ПОРТАЛ", fin.x + fin.w / 2, fin.y - 14);

    this.player.draw(ctx);

    ctx.restore();

    const progW = 220, progH = 6;
    const progX = (W - progW) / 2, progY = 14;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(progX, progY, progW, progH);
    const prog = Math.min(1, this.player.x / this.finish.x);
    ctx.fillStyle = "rgba(142,240,255,0.85)";
    ctx.fillRect(progX, progY, progW * prog, progH);
    for (const it of this.items) {
      const tx = progX + progW * (it.x / this.finish.x);
      ctx.fillStyle = it.taken ? "rgba(255,220,120,1)" : "rgba(255,220,120,0.35)";
      ctx.beginPath();
      ctx.arc(tx, progY + progH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.state === "paused") {
      ctx.fillStyle = "rgba(5,6,15,0.65)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#8ef0ff";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ПАУЗА", W / 2, H / 2);
    }
  }

  _drawFir(ctx, cx, baseY, w, h, color) {
    ctx.fillStyle = color;
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers;
      const tierW = w * (1 - t * 0.3);
      const tierH = h * 0.55;
      const topY = baseY - h + t * (h * 0.35);
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx - tierW / 2, topY + tierH);
      ctx.lineTo(cx + tierW / 2, topY + tierH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(cx - 2, baseY - 12, 4, 12);
  }
}