export class Input {
  constructor() {
    this.left = false; this.right = false; this.jump = false;
    this.jumpPressed = false;
    this._jumpHeld = false;

    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (["arrowleft","arrowright","arrowup","arrowdown"," "].includes(k)) e.preventDefault();
      if (k === "a" || k === "arrowleft") this.left = true;
      if (k === "d" || k === "arrowright") this.right = true;
      if (k === " " || k === "w" || k === "arrowup") {
        if (!this._jumpHeld) this.jumpPressed = true;
        this.jump = true; this._jumpHeld = true;
      }
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "arrowleft") this.left = false;
      if (k === "d" || k === "arrowright") this.right = false;
      if (k === " " || k === "w" || k === "arrowup") { this.jump = false; this._jumpHeld = false; }
    });

    document.querySelectorAll(".tbtn").forEach((el) => {
      const key = el.dataset.key;
      const press = (e) => {
        e.preventDefault();
        if (key === "left") this.left = true;
        if (key === "right") this.right = true;
        if (key === "jump") { this.jump = true; this.jumpPressed = true; }
      };
      const release = (e) => {
        e.preventDefault();
        if (key === "left") this.left = false;
        if (key === "right") this.right = false;
        if (key === "jump") this.jump = false;
      };
      el.addEventListener("pointerdown", press);
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("pointerleave", release);
    });
  }
  reset() {
    this.left = this.right = this.jump = false;
    this.jumpPressed = false;
    this._jumpHeld = false;
  }
  consumeJumpPressed() {
    const p = this.jumpPressed; this.jumpPressed = false; return p;
  }
}