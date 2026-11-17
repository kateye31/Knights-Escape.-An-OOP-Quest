// Tvishaa's drawings, and what happens on them.
// game.js calls these helpers. Positions are percentages of the picture:
// [x, y], where [0, 0] is the top-left corner and [100, 100] the bottom-right.
// Her sketches show where things go: the Maze door opens Chamber 1, the code sits
// on the Hall doors, and the warlock guards the Final Door.

// Width / height of each drawing, so the pictures never stretch
const RATIO = { door: 1.354, maze: 1.369, lab: 1.428, hall: 1.433, warlock: 1.422 };

const ALT = {
  maze: "Tvishaa's drawing of the hedge maze, with Start, numbered turns 1 to 5, and End",
  lab: "Tvishaa's drawing of the alchemy lab: potion shelves, a night window and a bubbling green cauldron",
  hall: "Tvishaa's drawing of three arched doors in green, purple and teal",
  warlock: "Tvishaa's drawing of the hooded warlock holding a torch staff and a gold key, in front of the final door",
};

// A drawing with things placed on top of it
function stage(image, inside, extraClass = "", style = "") {
  return `<figure class="stage ${extraClass}" style="--ar:${RATIO[image]};${style}">
            <img src="art/tvishaa-${image}.jpg" alt="${ALT[image]}">
            ${inside}
          </figure>`;
}

// ---------- Title card ----------
// Her full drawing when you walk into a chamber. It stays until you click or press a key.
let afterCard = null; // something to do once the card closes (like walking the knight)

function titleCard(image, label, title) {
  const card = document.getElementById("scene-card");
  const img = document.getElementById("scene-img");
  img.src = `art/tvishaa-${image}.jpg`;
  img.alt = `${title}, drawn by Tvishaa`;
  document.getElementById("scene-label").textContent = label;
  document.getElementById("scene-title").textContent = title;
  card.hidden = false;
  document.body.classList.add("revealing"); // the chamber waits behind the card
  img.decode().catch(() => {}).then(() => requestAnimationFrame(() => {
    card.classList.add("on");
    document.getElementById("scene-enter").focus({ preventScroll: true });
  }));
}

function closeTitleCard() {
  const card = document.getElementById("scene-card");
  if (card.hidden || !card.classList.contains("on")) return;
  card.classList.remove("on");
  document.body.classList.remove("revealing");
  setTimeout(() => { if (!card.classList.contains("on")) card.hidden = true; }, 600);
  if (afterCard) { const next = afterCard; afterCard = null; setTimeout(next, 450); }
}

// Do something now, or right after the title card closes if one is showing
function whenCardCloses(fn) {
  if (document.body.classList.contains("revealing")) afterCard = fn;
  else fn();
}

document.getElementById("scene-card").addEventListener("click", closeTitleCard);
document.addEventListener("keydown", (e) => {
  if (document.getElementById("scene-card").hidden) return;
  e.preventDefault();
  closeTitleCard();
});

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Arrows: Tvishaa's hand-drawn arrow from her maze ----------
// Sanjana's choices start with an arrow emoji; we swap in the drawn arrow.
const ARROW_EMOJI = /^(⬅|⬆|➡)️?\s*/;
const ARROW_NAME = { "⬅": "left", "⬆": "up", "➡": "right" };

function arrowDirection(text) {
  const m = text.match(ARROW_EMOJI);
  return m ? ARROW_NAME[m[1]] : null;
}

function arrowLabel(text) {
  const dir = arrowDirection(text);
  if (!dir) return text;
  return `<img class="arrow" src="art/arrow-${dir}.png" alt="${dir}"> ${text.replace(ARROW_EMOJI, "")}`;
}

// ---------- Chamber 1: walk her numbered maze ----------
// She drew the numbers 1 to 5 in the maze, one per turn. Each list below is the
// corridor corners from the previous stop: Start, 1, 2, 3, 4, 5, then End.
const MAZE_ROUTE = [
  [[9, 72.5]],                             // Start (her arrow)
  [[35.5, 72.5]],                          // 1
  [[35.5, 43.5]],                          // 2
  [[25, 43.5], [25, 36]],                  // 3
  [[25, 28], [66, 28]],                    // 4
  [[66, 70]],                              // 5
  [[66, 75.5], [82.5, 75.5], [82.5, 15]],  // End
];
const MAZE_H = 100 / RATIO.maze; // the drawing's height, when its width is 100

function mazePoint([x, y]) { return [x, +(y * MAZE_H / 100).toFixed(2)]; }
function mazePoints(stop) { return MAZE_ROUTE.slice(0, stop + 1).flat().map(mazePoint); }

// The maze with your knight standing on a stop (0 = Start, 1-5 = her numbers, 6 = End)
function mazeStage(stop, board) {
  const pts = mazePoints(stop);
  const [x, y] = pts[pts.length - 1];
  return stage("maze", `
      ${board}
      <svg class="maze-layer" viewBox="0 0 100 ${MAZE_H.toFixed(2)}" aria-hidden="true">
        <polyline id="trail" points="${pts.join(" ")}" />
        <g id="knight" transform="translate(${x} ${y})"><circle r="1.7" /></g>
      </svg>`, "stage-maze", `--knight:${player.knight.color}`);
}

// A right answer: the knight walks the corridor to the next stop
function walkKnight(fromStop, toStop) {
  const knight = document.getElementById("knight");
  const trail = document.getElementById("trail");
  if (!knight) return;
  const done = mazePoints(fromStop);
  const path = [done[done.length - 1], ...MAZE_ROUTE.slice(fromStop + 1, toStop + 1).flat().map(mazePoint)];
  const lengths = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const duration = calm() ? 0 : Math.min(1700, Math.max(700, total * 24));
  const start = performance.now();

  function step(now) {
    const t = duration ? Math.min(1, (now - start) / duration) : 1;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease in and out
    let d = eased * total, i = 0;
    while (i < lengths.length - 1 && d > lengths[i]) { d -= lengths[i]; i++; }
    const a = path[i], b = path[i + 1], k = lengths[i] ? Math.min(1, d / lengths[i]) : 1;
    const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
    knight.setAttribute("transform", `translate(${x} ${y})`);
    trail.setAttribute("points", [...done, ...path.slice(1, i + 1), [x, y]].join(" "));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// A wrong turn: the knight bumps the wall in that direction and steps back
function bumpKnight(direction) {
  const dot = document.querySelector("#knight circle");
  if (!dot || calm()) return;
  const [dx, dy] = { left: [-1.6, 0], up: [0, -1.6], right: [1.6, 0] }[direction] || [0, 0];
  dot.animate([
    { transform: "translate(0px, 0px)" },
    { transform: `translate(${dx}px, ${dy}px)` },
    { transform: "translate(0px, 0px)" },
  ], { duration: 280, easing: "ease-out" });
}

// ---------- Chamber 2: her cauldron reacts ----------
const CAULDRON = [51.5, 54.5]; // the top of the green brew

function labStage() {
  return stage("lab", `<div class="brew" style="left:${CAULDRON[0]}%;top:${CAULDRON[1]}%">
                         <span class="brew-tint"></span>
                       </div>`, "stage-lab");
}

// good = true: green bubbles and the spell word rises. false: the brew turns murky.
function brew(good, word) {
  const pot = document.querySelector(".brew");
  if (!pot) return;
  pot.querySelectorAll(".bubble, .brew-word").forEach((el) => el.remove());
  pot.classList.remove("good", "bad");
  void pot.offsetWidth; // restart the animation
  pot.classList.add(good ? "good" : "bad");
  // make sure you can see the cauldron when it reacts
  pot.closest(".stage").scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" });
  if (calm()) return;
  for (let i = 0; i < (good ? 10 : 7); i++) {
    const b = document.createElement("span");
    b.className = "bubble";
    b.style.left = 8 + Math.random() * 84 + "%";
    b.style.setProperty("--size", (0.8 + Math.random() * 0.9).toFixed(2) + "cqw");
    b.style.animationDelay = i * 70 + Math.random() * 80 + "ms";
    pot.appendChild(b);
  }
  if (good && word) {
    const w = document.createElement("span");
    w.className = "brew-word";
    w.textContent = word;
    pot.appendChild(w);
  }
}

// ---------- Chamber 3: the code sits on her doors ----------
// Her three doors: the whole drawn door (for the illusion shade), and the
// "display code" box inside it, clear of the door knob (like her sketch)
const HALL_DOORS = [
  { door: [5, 29.5], display: 9 },
  { door: [37, 62], display: 41 },
  { door: [69, 94], display: 73.5 },
];

// marks: for each door, "" or "illusion" (wrong, fades) or "real" (the right one)
function hallStage(n, marks = ["", "", ""], clickable = true) {
  const r = HALL.rounds[n];
  const shades = HALL_DOORS.map((d, i) =>
    `<span class="door-shade door-${i + 1} ${marks[i]}" style="left:${d.door[0]}%;width:${d.door[1] - d.door[0]}%"></span>`).join("");
  const onDoors = r.doors.map((code, i) => `
      <button class="hall-door door-${i + 1} ${marks[i]}" style="left:${HALL_DOORS[i].display}%"
              ${clickable ? `onclick="hallAnswer(${n}, ${i})"` : "disabled"} aria-label="Door ${i + 1}">
        <span class="door-display"><b>Door ${i + 1}</b>${codeBlock(code)}</span>
      </button>`).join("");
  // On small screens the code is too small to read on the doors, so it also shows below
  const below = r.doors.map((code, i) => `
      <button class="door door-${i + 1} ${marks[i]}" ${clickable ? `onclick="hallAnswer(${n}, ${i})"` : "disabled"}>
        <b>Door ${i + 1}</b>${codeBlock(code)}
      </button>`).join("");
  return `<div class="hall">${stage("hall", shades + onDoors, "stage-hall")}<div class="doors">${below}</div></div>`;
}

function markDoor(i, mark) {
  document.querySelectorAll(`.door-${i + 1}`).forEach((d) => { d.classList.add(mark); d.disabled = true; });
}

// ---------- Chamber 4: the warlock and the three keyholes ----------
function warlockStage(newKey = -1) {
  const holes = FINAL.questions.map((q, i) =>
    `<span class="keyhole ${i < player.keys ? "filled" : ""} ${i === newKey ? "new" : ""}"></span>`).join("");
  return stage("warlock", `<div class="keyholes" aria-label="Keys: ${player.keys} of ${FINAL.questions.length}">${holes}</div>`, "stage-final");
}
