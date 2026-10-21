import { Game } from "./Game.js";

(function boot() {
  const canvas = document.getElementById("game");
  if (!canvas) { console.error("Canvas #game не найден"); return; }

  const game = new Game(canvas);

  const btnStart     = document.getElementById("btnStart");
  const btnPause     = document.getElementById("btnPause");
  const btnRestart   = document.getElementById("btnRestart");
  const overlay      = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText  = document.getElementById("overlayText");
  const overlayBtn   = document.getElementById("overlayBtn");
  const scoreLabel   = document.getElementById("scoreLabel");
  const bestLabel    = document.getElementById("bestLabel");

  function refreshHud() {
    scoreLabel.textContent = "Очки: " + game.score + " / " + game.totalItems;
    bestLabel.textContent  = "Рекорд: " + game.bestScore;
  }
  game.onHudChange = refreshHud;

  function showOverlay(title, text, btnText) {
    overlayTitle.textContent = title;
    overlayText.textContent  = text;
    overlayBtn.textContent   = btnText;
    overlay.classList.remove("hidden");
  }
  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    hideOverlay();
    game.start();
    btnPause.disabled = false;
    btnPause.textContent = "Пауза";
    refreshHud();
  }

  btnStart.addEventListener("click", () => { startGame(); });

  btnPause.addEventListener("click", () => {
    if (game.state === "playing") {
      game.pause();
      btnPause.textContent = "Продолжить";
    } else if (game.state === "paused") {
      game.resume();
      btnPause.textContent = "Пауза";
    }
  });

  btnRestart.addEventListener("click", () => {
    hideOverlay();
    game.restart();
    btnPause.disabled = false;
    btnPause.textContent = "Пауза";
    refreshHud();
  });

  overlayBtn.addEventListener("click", () => {
    if (game.state === "paused") {
      hideOverlay();
      game.resume();
      btnPause.textContent = "Пауза";
    } else {
      startGame();
    }
  });

  game.onWin = () => {
    refreshHud();
    showOverlay(
      "🎉 Победа!",
      "Посылка доставлена! Очки: " + game.score + ". Рекорд: " + game.bestScore + ".",
      "Играть снова"
    );
    btnPause.disabled = true;
    btnPause.textContent = "Пауза";
  };

  game.onLose = (reason) => {
    refreshHud();
    showOverlay(
      "💀 Поражение",
      reason + " Рекорд: " + game.bestScore + ".",
      "Заново"
    );
    btnPause.disabled = true;
    btnPause.textContent = "Пауза";
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === "playing") {
      game.pause();
      btnPause.textContent = "Продолжить";
    }
  });

  refreshHud();
  game.render();
})();