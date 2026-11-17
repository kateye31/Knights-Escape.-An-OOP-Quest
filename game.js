// Game logic. Content lives in rooms.js; this file shows one screen at a time.
// Flow: start -> warlock intro -> Maze -> Alchemy Lab -> Hall of Illusions -> Final Door -> escape

const app = document.getElementById("app");
// keys: the key counter. Starts at 0, +1 per Final Door answer (see finalCheck)
let player = {
  knight: null,
  difficulty: null,
  hintsLeft: 0,
  keys: 0,
  spell: [],
  mistakes: 0,
  mazeMistakes: 0,      // Track mistakes in the Maze chamber
  labMistakes: 0,       // Track mistakes in the Alchemy Lab chamber
  hallMistakes: 0,      // Track mistakes in the Hall of Illusions chamber
};

// Small helper: put HTML on the screen.
// scene (optional) picks which of Tvishaa's drawings sits behind the page:
// "door", "warlock", "maze", "lab" or "hall". See body[data-scene] in style.css.
function show(html, scene) {
  app.innerHTML = html;
  if (scene) document.body.dataset.scene = scene;
  window.scrollTo(0, 0);
}

function codeBlock(code) {
  const safe = code.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<pre><code>${safe}</code></pre>`;
}

// Progress bar at the top of every chamber; shows the key counter
function header(chamber, step, total) {
  return `<p class="progress">${chamber.title} · ${step} of ${total} · Keys: ${player.keys} · Hints left: ${player.hintsLeft}</p>
          <p class="concept">${chamber.concept}</p>`;
}

// ---------- Start: choose knight, difficulty ----------
function startScreen() {
  // New game: key counter goes back to 0
  player = { knight: null, difficulty: null, hintsLeft: 0, keys: 0, spell: [], mistakes: 0, mazeMistakes: 0, labMistakes: 0, hallMistakes: 0 };
  const knights = KNIGHTS.map((k, i) =>
    `<button class="choice" style="border-color:${k.color}" onclick="pickKnight(${i})">${k.name}</button>`).join("");
  show(`<h1>Knight's Escape</h1>
        <p class="subtitle">An OOP Quest</p>
        <p>Choose your knight:</p><div class="choices">${knights}</div>`, "door");
}

function pickKnight(i) {
  player.knight = KNIGHTS[i];
  const levels = DIFFICULTIES.map((d, j) =>
    `<button class="choice" onclick="pickDifficulty(${j})"><b>${d.name}</b><small>${d.about}</small></button>`).join("");
  show(`<h1>${player.knight.name}</h1><p>Choose your difficulty:</p><div class="choices">${levels}</div>`);
}

function pickDifficulty(j) {
  player.difficulty = DIFFICULTIES[j];
  show(`<p class="warlock">${WARLOCK.name}:</p>
        <h2>"${WARLOCK.intro}"</h2>
        <button onclick="mazeTurn(0)">Enter the dungeon</button>`, "warlock");
}

// Shared by every chamber: hint button and wrong-answer taunt
function useHint(text) {
  if (player.hintsLeft <= 0) { document.getElementById("hint").textContent = "No hints left in this chamber."; return; }
  player.hintsLeft--;
  document.getElementById("hint").textContent = "Hint: " + text;
}

function taunt() {
  const t = WARLOCK.taunts[Math.floor(Math.random() * WARLOCK.taunts.length)];
  document.getElementById("feedback").textContent = `${WARLOCK.name}: "${t}"`;
}

// ---------- Chamber 1: The Maze ----------
function mazeTurn(n) {
  if (n === 0) player.hintsLeft = player.difficulty.hints;
  if (n >= MAZE.turns.length) return labStep(0);
  const t = MAZE.turns[n];
  const mazeNumber = n + 1;
  const choices = t.choices.map((c, i) => `<button class="choice" onclick="mazeAnswer(${n}, ${i})">${c}</button>`).join("");
  show(`${header(MAZE, mazeNumber, MAZE.turns.length)}
        <p class="maze-board">Maze ${mazeNumber} of ${MAZE.turns.length}</p>
        ${n === 0 ? `<p class="story">${MAZE.story}</p>` : ""}
        ${codeBlock(t.code)}<h2>${t.question}</h2>
        <div class="choices">${choices}</div>
        <button class="secondary" onclick="useHint(MAZE.turns[${n}].hint)">Hint</button>
        <p id="hint"></p><p id="feedback"></p>`, "maze");
}

function mazeAnswer(n, i) {
  const t = MAZE.turns[n];
  if (i !== t.answer) {
    player.mistakes++;
    player.mazeMistakes++;
    taunt();
    document.getElementById("feedback").textContent += ` ${t.wrong[i]}`;
    return;
  }
  const mazeNumber = n + 1;
  show(`<p class="maze-board">Maze ${mazeNumber} of ${MAZE.turns.length}</p>
        <h2>The path opens.</h2><p>${t.explain}</p><button onclick="mazeTurn(${n + 1})">Keep going</button>`);
}

// ---------- Chamber 2: The Alchemy Lab ----------
function labStep(n) {
  if (n === 0) { player.hintsLeft = player.difficulty.hints; player.spell = []; }
  if (n >= LAB.steps.length) {
    return show(`<h2>The spell is complete:</h2><p class="spell">${player.spell.join(" ")}</p>
                 <button onclick="hallRound(0)">Cast it</button>`);
  }
  const s = LAB.steps[n];
  const choices = s.choices.map((c, i) => `<button class="choice" onclick="labAnswer(${n}, ${i})">${c}</button>`).join("");
  show(`${header(LAB, n + 1, LAB.steps.length)}
        ${n === 0 ? `<p class="story">${LAB.story}</p>` : ""}
        <p>Spell so far: <span class="spell">${player.spell.join(" ") || "..."}</span></p>
        ${codeBlock(s.code)}<h2>What does this print?</h2>
        <div class="choices">${choices}</div>
        <button class="secondary" onclick="useHint(LAB.steps[${n}].hint)">Hint</button>
        <p id="hint"></p><p id="feedback"></p>`, "lab");
}

function labAnswer(n, i) {
  const s = LAB.steps[n];
  if (i !== s.answer) {
    player.mistakes++;
    player.labMistakes++;
    return taunt();
  }
  player.spell.push(s.choices[s.answer]);
  labStep(n + 1);
}

// ---------- Chamber 3: The Hall of Illusions ----------
function hallRound(n) {
  if (n === 0) player.hintsLeft = player.difficulty.hints;
  if (n >= HALL.rounds.length) return finalQuestion(0);
  const r = HALL.rounds[n];
  const doors = r.doors.map((code, i) =>
    `<button class="door" onclick="hallAnswer(${n}, ${i})"><b>Door ${i + 1}</b>${codeBlock(code)}</button>`).join("");
  show(`${header(HALL, n + 1, HALL.rounds.length)}
        ${n === 0 ? `<p class="story">${HALL.story}</p>` : ""}
        <h2>${r.question}</h2><div class="doors">${doors}</div>
        <button class="secondary" onclick="useHint(HALL.rounds[${n}].hint)">Hint</button>
        <p id="hint"></p><p id="feedback"></p>`, "hall");
}

function hallAnswer(n, i) {
  const r = HALL.rounds[n];
  if (i !== r.answer) {
    player.mistakes++;
    player.hallMistakes++;
    return taunt();
  }
  show(`<h2>The illusion fades. That door was real.</h2><p>${r.explain}</p><button onclick="hallRound(${n + 1})">Walk through</button>`);
}

// ---------- Chamber 4: The Final Door ----------
// Open-ended: the player writes an answer, compares it with a model answer, and checks themselves.
function finalQuestion(n) {
  if (n >= FINAL.questions.length) return escapeScreen();
  const q = FINAL.questions[n];
  show(`${header(FINAL, n + 1, FINAL.questions.length)}
        ${n === 0 ? `<p class="story">${FINAL.story}</p>` : ""}
        <p class="warlock">${WARLOCK.name} asks:</p><h2>${q.question}</h2>
        <textarea id="answer" rows="4" placeholder="Answer in your own words..."></textarea>
        <button onclick="finalCheck(${n})">Answer the warlock</button><p id="feedback"></p>`, "door");
}

function finalCheck(n) {
  const text = document.getElementById("answer").value.trim();
  if (!text) { document.getElementById("feedback").textContent = "The warlock waits for an answer..."; return; }
  const q = FINAL.questions[n];
  const list = q.lookFor.map((x) => `<li>${x}</li>`).join("");
  show(`<h2>Compare your answer</h2><p><b>You said:</b> ${text.replace(/</g, "&lt;")}</p>
        <p><b>A strong answer:</b> ${q.model}</p><p>Did yours include:</p><ul>${list}</ul>
        <!-- Key counter goes up here: player.keys++ when the player accepts the key -->
        <button onclick="earnKey(${n})">Yes, take the key</button>
        <button class="secondary" onclick="finalQuestion(${n})">Let me try again</button>`);
}

function earnKey(n) {
  player.keys++;
  const q = FINAL.questions[n];
  show(`<p class="warlock">Key earned!</p>
        <div class="flashcard">
          <p class="flashcard-label">Key flashcard</p>
          <p>${q.model}</p>
        </div>
        <button onclick="finalQuestion(${n + 1})">Continue</button>`);
}

// ---------- Escape ----------
function escapeScreen() {
  // Determine the chamber with the most mistakes
  // (keys are the chamber titles from rooms.js, so a renamed chamber shows its new name)
  const mistakesPerChamber = {
    [MAZE.title]: player.mazeMistakes,
    [LAB.title]: player.labMistakes,
    [HALL.title]: player.hallMistakes,
  };

  // Find the chamber with the most mistakes
  const weakSpot = Object.keys(mistakesPerChamber).reduce((a, b) =>
    mistakesPerChamber[a] > mistakesPerChamber[b] ? a : b
  );

  // Get the concept for the weak-spot chamber
  let weakSpotConcept = "";
  if (weakSpot === MAZE.title) weakSpotConcept = MAZE.concept;
  else if (weakSpot === LAB.title) weakSpotConcept = LAB.concept;
  else if (weakSpot === HALL.title) weakSpotConcept = HALL.concept;

  show(`<h1>You escaped!</h1>
        <p class="warlock">${WARLOCK.name}: "${WARLOCK.defeated}"</p>
        <p>${player.knight.name} · ${player.difficulty.name} · Keys: ${player.keys} of ${FINAL.questions.length} · Mistakes: ${player.mistakes}</p>
        ${player.mistakes > 0 ? `<p class="weak-spot">Review ${weakSpot}: ${weakSpotConcept}</p>` : ""}
        <button onclick="startScreen()">Play again</button>`, "door");
}

startScreen();
