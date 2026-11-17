// Meet the creators: switching between the game and the About page.
// Each switch fades the screen to black from top to bottom, then shows the other page.
// The game keeps your place while you read, so "Back to your quest" picks up where you were.

const curtainCalm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Black curtain down, swap the page, then the curtain fades away
function throughBlack(swap) {
  const curtain = document.getElementById("curtain");
  if (curtainCalm()) { swap(); return; }
  curtain.classList.remove("lift");
  curtain.classList.add("down");
  setTimeout(() => {
    swap();
    curtain.classList.add("lift");
    setTimeout(() => curtain.classList.remove("down", "lift"), 500);
  }, 850); // 700ms sweep + a short hold on black
}

function showAbout() {
  // The Play button says what it will do: pick up your quest, or start one
  const midQuest = player.knight && !player.escaped;
  document.getElementById("about-play").textContent = midQuest ? "Back to your quest" : "Play Knight's Escape";
  throughBlack(() => {
    document.body.classList.add("viewing-about");
    document.getElementById("app").hidden = true;
    document.getElementById("about").hidden = false;
    document.getElementById("about-link").textContent = "Back to the game";
    document.getElementById("about-link").setAttribute("onclick", "showGame()");
    window.scrollTo(0, 0);
  });
}

function showGame() {
  throughBlack(() => {
    if (player.escaped) startScreen(); // finished games start fresh
    document.body.classList.remove("viewing-about");
    document.getElementById("about").hidden = true;
    document.getElementById("app").hidden = false;
    document.getElementById("about-link").textContent = "Meet the creators";
    document.getElementById("about-link").setAttribute("onclick", "showAbout()");
    window.scrollTo(0, 0);
  });
}
