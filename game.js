/* ─────────────────────────────────────────────────────────────────
   SCHERE, STEIN, BLUFF  –  game.js
   Bluff-Modus + Klassischer Modus + Modus-Auswahl
   ─────────────────────────────────────────────────────────────────*/

'use strict';

// ══════════════════════════════════════════════════════════════════
// SHARED CONSTANTS & UTILITIES
// ══════════════════════════════════════════════════════════════════

const CARD_TYPES = ['scissors', 'stone', 'paper'];
const CARD_EMOJI = { scissors: '✂️', stone: '🪨', paper: '📄' };
const CARD_NAME  = { scissors: 'Schere', stone: 'Stein', paper: 'Papier' };
const BEATS      = { scissors: 'paper', stone: 'scissors', paper: 'stone' };
const DUEL_COUNT = 6;

let cardIdCounter = 0;
function makeCard(type) { return { id: `c${cardIdCounter++}`, type }; }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function evaluateDuel(playerType, botType) {
  if (!playerType || !botType) return 'draw';
  if (playerType === botType) return 'draw';
  if (BEATS[playerType] === botType) return 'player';
  return 'bot';
}

function makeDeck() {
  return shuffle(
    CARD_TYPES.flatMap(t => Array.from({ length: 6 }, () => makeCard(t)))
  );
}

// Create a card DOM element. When faceUp=false, no type info is rendered.
function createCardElement(card, faceUp) {
  const el = document.createElement('div');

  if (faceUp) {
    el.className = 'card face-up';
    el.dataset.type = card.type;
    el.dataset.id   = card.id;

    const face = document.createElement('div');
    face.className = 'card-face';
    const emoji = document.createElement('div');
    emoji.className = 'card-emoji';
    emoji.textContent = CARD_EMOJI[card.type];
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = CARD_NAME[card.type];
    face.appendChild(emoji);
    face.appendChild(name);
    el.appendChild(face);

    const back = document.createElement('div');
    back.className = 'card-back';
    el.appendChild(back);
  } else {
    el.className = 'card face-down';
    el.dataset.id = card.id;

    const face = document.createElement('div');
    face.className = 'card-face';
    el.appendChild(face);

    const back = document.createElement('div');
    back.className = 'card-back';
    el.appendChild(back);
  }

  return el;
}

// ══════════════════════════════════════════════════════════════════
// DOM REFERENCES
// ══════════════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);

// Shared
const domShared = {
  modeScreen:    $('mode-screen'),
  victoryScreen: $('victory-screen'),
  victoryIcon:   $('victory-icon'),
  victoryTitle:  $('victory-title'),
  victorySub:    $('victory-subtitle'),
  btnNewMatch:   $('btn-new-match'),
  btnBackMenu:   $('btn-back-to-menu'),
};

// Bluff mode
const domBluff = {
  container:     $('game-container'),
  botHand:       $('bot-hand'),
  playerHand:    $('player-hand'),
  duelSlots:     $('duel-slots'),
  hintText:      $('hint-text'),
  hintIcon:      $('hint-icon'),
  btnConfirm:    $('btn-confirm'),
  partieNumber:  $('partie-number'),
  starterInfo:   $('starter-info'),
  scorePipsPlayer: $('score-pips-player'),
  scorePipsBot:    $('score-pips-bot'),
  btnBack:       $('bluff-back'),
};

// Classic mode
const domClassic = {
  container:     $('classic-container'),
  botHand:       $('classic-bot-hand'),
  playerHand:    $('classic-player-hand'),
  botSlot:       $('classic-bot-slot'),
  playerSlot:    $('classic-player-slot'),
  vsLabel:       $('classic-vs-label'),
  hintText:      $('classic-hint-text'),
  hintIcon:      $('classic-hint-icon'),
  btnConfirm:    $('classic-btn-confirm'),
  playerScore:   $('classic-player-score'),
  botScore:      $('classic-bot-score'),
  roundNum:      $('classic-round'),
  totalRounds:   $('classic-total-rounds'),
  deckCount:     $('classic-deck-count'),
  btnBack:       $('classic-back'),
};

// ══════════════════════════════════════════════════════════════════
// MODE SELECTION
// ══════════════════════════════════════════════════════════════════

let currentMode = null;

function showModeSelection() {
  currentMode = null;
  domShared.victoryScreen.classList.add('hidden');
  domBluff.container.classList.add('hidden');
  domClassic.container.classList.add('hidden');
  domShared.modeScreen.classList.remove('hidden');
}

document.querySelectorAll('.mode-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    domShared.modeScreen.classList.add('hidden');
    if (mode === 'bluff') {
      currentMode = 'bluff';
      domBluff.container.classList.remove('hidden');
      bluffNewMatch();
    } else {
      currentMode = 'classic';
      domClassic.container.classList.remove('hidden');
      classicNewGame();
    }
  });
});

// Back buttons
domBluff.btnBack.addEventListener('click', showModeSelection);
domClassic.btnBack.addEventListener('click', showModeSelection);
domShared.btnBackMenu.addEventListener('click', showModeSelection);

// Victory screen replay
domShared.btnNewMatch.addEventListener('click', () => {
  domShared.victoryScreen.classList.add('hidden');
  if (currentMode === 'bluff') bluffNewMatch();
  else classicNewGame();
});


// ══════════════════════════════════════════════════════════════════
//
//  ██████  ██      ██    ██ ███████ ███████
//  ██   ██ ██      ██    ██ ██      ██
//  ██████  ██      ██    ██ █████   █████
//  ██   ██ ██      ██    ██ ██      ██
//  ██████  ███████  ██████  ██      ██
//
// ══════════════════════════════════════════════════════════════════

const WIN_SCORE = 3;

const bluffState = {
  matchScore:   { player: 0, bot: 0 },
  partieNumber: 1,
  starter:      'player',
  phase:        'init',
  playerHand:   [],
  botHand:      [],
  supplyPile:   [],
  duelSlots:    [],
  layingOrder:  [],
  layingStep:   0,
  selectedCard: null,
  swapSelectedSlots: [],
  playerSwapDone: false,
  botSwapDone:    false,
};

let bluffIsInitialDeal = false;

function bluffResetSlots() {
  return Array.from({ length: DUEL_COUNT }, () => ({
    playerCard: null, botCard: null,
    playerFaceUp: false, botFaceUp: false,
  }));
}

function bluffInitGame() {
  domShared.victoryScreen.classList.add('hidden');
  const s = bluffState;
  s.phase = 'init';
  s.selectedCard = null;
  s.layingStep = 0;
  s.swapSelectedSlots = [];
  s.playerSwapDone = false;
  s.botSwapDone = false;

  const deck = makeDeck();
  s.playerHand = deck.slice(0, 6);
  s.botHand    = deck.slice(6, 12);
  s.supplyPile = deck.slice(12, 18);
  s.duelSlots  = bluffResetSlots();
  s.layingOrder = bluffBuildLayingOrder(s.starter);

  bluffIsInitialDeal = true;
  bluffRenderAll();
  bluffIsInitialDeal = false;

  bluffStartSupplyPhase();
}

function bluffNewMatch() {
  const s = bluffState;
  s.matchScore = { player: 0, bot: 0 };
  s.partieNumber = 1;
  s.starter = 'player';
  bluffInitGame();
}

// ── Legesequenz ───────────────────────────────────────────────────
function bluffBuildLayingOrder(starter) {
  const seq = [];
  if (starter === 'player') {
    seq.push({ who: 'player', slot: 0, faceUp: true });
    seq.push({ who: 'bot',    slot: 0, faceUp: false });
    seq.push({ who: 'bot',    slot: 1, faceUp: true });
    seq.push({ who: 'player', slot: 1, faceUp: false });
    seq.push({ who: 'player', slot: 2, faceUp: false });
    seq.push({ who: 'bot',    slot: 2, faceUp: true });
    seq.push({ who: 'bot',    slot: 3, faceUp: false });
    seq.push({ who: 'player', slot: 3, faceUp: true });
    seq.push({ who: 'player', slot: 4, faceUp: false });
    seq.push({ who: 'bot',    slot: 4, faceUp: false });
    seq.push({ who: 'player', slot: 5, faceUp: false });
    seq.push({ who: 'bot',    slot: 5, faceUp: false });
  } else {
    seq.push({ who: 'bot',    slot: 0, faceUp: true });
    seq.push({ who: 'player', slot: 0, faceUp: false });
    seq.push({ who: 'player', slot: 1, faceUp: true });
    seq.push({ who: 'bot',    slot: 1, faceUp: false });
    seq.push({ who: 'bot',    slot: 2, faceUp: false });
    seq.push({ who: 'player', slot: 2, faceUp: true });
    seq.push({ who: 'player', slot: 3, faceUp: false });
    seq.push({ who: 'bot',    slot: 3, faceUp: true });
    seq.push({ who: 'bot',    slot: 4, faceUp: false });
    seq.push({ who: 'player', slot: 4, faceUp: false });
    seq.push({ who: 'bot',    slot: 5, faceUp: false });
    seq.push({ who: 'player', slot: 5, faceUp: false });
  }
  return seq;
}

// ── Phase A: Nachschub ────────────────────────────────────────────
function bluffStartSupplyPhase() {
  bluffState.phase = 'supply';
  let discardMarked = [];

  bluffSetHint('📦', 'Du kannst jetzt <b>2 neue Karten vom Nachschub</b> ziehen – dafür wirfst du 2 Handkarten ab. Markiere 2 Karten zum Abwerfen und klicke "Tauschen", oder überspringe diesen Schritt.',
    [{ label: 'Überspringen', id: 'btn-skip-supply', cls: 'btn-secondary', cb: () => finishSupplyPlayer() }]
  );
  bluffRenderPlayerHand({ supplyDiscard: true });
  domBluff.playerHand.addEventListener('click', onSupplyHandClick);

  function onSupplyHandClick(e) {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;
    const id = cardEl.dataset.id;

    if (cardEl.classList.contains('discard-marked')) {
      cardEl.classList.remove('discard-marked');
      discardMarked = discardMarked.filter(x => x !== id);
    } else {
      if (discardMarked.length >= 2) return;
      cardEl.classList.add('discard-marked');
      discardMarked.push(id);
    }

    if (discardMarked.length === 2) {
      bluffSetHint('📦', 'Du hast 2 Karten zum Abwerfen gewählt. Klicke "Tauschen" um 2 neue zu ziehen.',
        [
          { label: '🔄 Tauschen', id: 'btn-do-supply', cls: 'btn-primary', cb: doSwap },
          { label: 'Überspringen', id: 'btn-skip-supply', cls: 'btn-secondary', cb: () => finishSupplyPlayer() },
        ]
      );
    } else {
      bluffSetHint('📦', `Markiere noch ${2 - discardMarked.length} Karte(n) zum Abwerfen, oder überspringe.`,
        [{ label: 'Überspringen', id: 'btn-skip-supply', cls: 'btn-secondary', cb: () => finishSupplyPlayer() }]
      );
    }
  }

  function doSwap() {
    domBluff.playerHand.removeEventListener('click', onSupplyHandClick);
    const s = bluffState;
    if (s.supplyPile.length < 2) { finishSupplyPlayer(); return; }
    s.playerHand = s.playerHand.filter(c => !discardMarked.includes(c.id));
    s.playerHand.push(...s.supplyPile.splice(0, 2));
    discardMarked = [];
    bluffRenderPlayerHand({});
    bluffSetHint('✅', 'Du hast 2 neue Karten gezogen!');
    setTimeout(() => finishSupplyPlayer(), 900);
  }

  function finishSupplyPlayer() {
    domBluff.playerHand.removeEventListener('click', onSupplyHandClick);
    const s = bluffState;
    const botTakes = Math.random() < 0.5 && s.supplyPile.length >= 2;
    if (botTakes) {
      const toDiscard = shuffle(s.botHand).slice(0, 2).map(c => c.id);
      s.botHand = s.botHand.filter(c => !toDiscard.includes(c.id));
      s.botHand.push(...s.supplyPile.splice(0, 2));
      bluffRenderBotHand();
      bluffSetHint('🤖', 'Der Bot hat ebenfalls Nachschub-Karten gezogen.');
    } else {
      bluffSetHint('🤖', 'Der Bot hat den Nachschub-Schritt übersprungen.');
    }
    setTimeout(() => bluffStartLayingPhase(), 1100);
  }
}

// ── Phase B: Karten legen ─────────────────────────────────────────
function bluffStartLayingPhase() {
  bluffState.phase = 'laying';
  bluffState.layingStep = 0;
  bluffRenderAll();
  bluffProcessNextStep();
}

function bluffProcessNextStep() {
  const s = bluffState;
  if (s.layingStep >= s.layingOrder.length) {
    setTimeout(() => bluffStartSwapPhase(), 600);
    return;
  }
  const step = s.layingOrder[s.layingStep];
  step.who === 'bot' ? bluffBotLayCard(step) : bluffPlayerLayCard(step);
}

function bluffPlayerLayCard(step) {
  const s = bluffState;
  const { slot: slotIdx, faceUp } = step;
  const vizMode = faceUp ? 'offen' : 'verdeckt';
  const vizIcon = faceUp ? '👁️' : '🙈';

  bluffSetHint(vizIcon, `Wähle eine Karte und lege sie <b>${vizMode}</b> auf <b>Platz ${slotIdx + 1}</b>.`);
  bluffRenderPlayerHand({ selectable: true });
  bluffRenderDuelSlots({ highlightSlot: slotIdx });

  s.selectedCard = null;

  domBluff.playerHand.onclick = e => {
    const cardEl = e.target.closest('.card');
    if (!cardEl || cardEl.classList.contains('disabled')) return;
    domBluff.playerHand.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    s.selectedCard = cardEl.dataset.id;
    bluffSetHint(vizIcon, `<b>${CARD_NAME[s.playerHand.find(c => c.id === s.selectedCard)?.type]}</b> ausgewählt. Klicke auf <b>Platz ${slotIdx + 1}</b>.`);
    bluffRenderDuelSlots({ highlightSlot: slotIdx, slotClickable: true, onSlotClick: place });
  };

  function place(idx) {
    if (idx !== slotIdx || !s.selectedCard) return;
    domBluff.playerHand.onclick = null;
    const card = s.playerHand.find(c => c.id === s.selectedCard);
    s.playerHand = s.playerHand.filter(c => c.id !== s.selectedCard);
    s.selectedCard = null;
    s.duelSlots[slotIdx].playerCard = card;
    s.duelSlots[slotIdx].playerFaceUp = faceUp;
    s.layingStep++;
    bluffRenderPlayerHand({});
    bluffRenderDuelSlots({});
    bluffRenderBotHand();
    bluffProcessNextStep();
  }
}

function bluffBotLayCard(step) {
  const s = bluffState;
  const { slot: slotIdx, faceUp } = step;
  bluffSetHint('🤖', `Der Bot legt eine Karte auf <b>Platz ${slotIdx + 1}</b> …`);
  setTimeout(() => {
    const idx  = Math.floor(Math.random() * s.botHand.length);
    const card = s.botHand.splice(idx, 1)[0];
    s.duelSlots[slotIdx].botCard = card;
    s.duelSlots[slotIdx].botFaceUp = faceUp;
    s.layingStep++;
    bluffRenderBotHand();
    bluffRenderDuelSlots({});
    setTimeout(() => bluffProcessNextStep(), 350);
  }, 800);
}

// ── Phase C: Heimlicher Tausch ────────────────────────────────────
function bluffStartSwapPhase() {
  const s = bluffState;
  s.phase = 'swap';
  s.swapSelectedSlots = [];
  s.playerSwapDone = false;
  s.botSwapDone = false;
  s.duelSlots.forEach(slot => { slot.playerFaceUp = false; slot.botFaceUp = false; });

  bluffRenderDuelSlots({ swapMode: true, onSwapClick: onSwap });
  bluffSetHint('🔀', 'Alle Karten sind verdeckt. Klicke <b>2 deiner Karten</b> zum Tauschen, oder überspringe.',
    [{ label: '⏭️ Nicht tauschen', id: 'btn-skip-swap', cls: 'btn-secondary', cb: bluffConfirmSwap }]
  );
  domBluff.btnConfirm.textContent = 'Tausch bestätigen';
  domBluff.btnConfirm.classList.remove('hidden');
  domBluff.btnConfirm.onclick = bluffConfirmSwap;

  function onSwap(slotIdx) {
    if (s.swapSelectedSlots.includes(slotIdx))
      s.swapSelectedSlots = s.swapSelectedSlots.filter(i => i !== slotIdx);
    else if (s.swapSelectedSlots.length < 2)
      s.swapSelectedSlots.push(slotIdx);
    bluffRenderDuelSlots({ swapMode: true, onSwapClick: onSwap });
  }
}

function bluffConfirmSwap() {
  domBluff.btnConfirm.classList.add('hidden');
  const s = bluffState;
  if (s.swapSelectedSlots.length === 2) {
    const [a, b] = s.swapSelectedSlots;
    const tmp = s.duelSlots[a].playerCard;
    s.duelSlots[a].playerCard = s.duelSlots[b].playerCard;
    s.duelSlots[b].playerCard = tmp;
    bluffSetHint('✅', `Platz ${a + 1} und ${b + 1} getauscht. Bot ist dran …`);
  } else {
    bluffSetHint('⏭️', 'Nicht getauscht. Bot ist dran …');
  }
  s.swapSelectedSlots = [];
  s.playerSwapDone = true;
  bluffRenderDuelSlots({});
  setTimeout(() => bluffBotSwap(), 1200);
}

function bluffBotSwap() {
  const s = bluffState;
  if (Math.random() < 0.5) {
    const [a, b] = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 2);
    const tmp = s.duelSlots[a].botCard;
    s.duelSlots[a].botCard = s.duelSlots[b].botCard;
    s.duelSlots[b].botCard = tmp;
    bluffSetHint('🤖', 'Der Bot hat 2 Karten getauscht. Bereit für die Auflösung!');
  } else {
    bluffSetHint('🤖', 'Der Bot hat nichts getauscht. Bereit für die Auflösung!');
  }
  s.botSwapDone = true;
  domBluff.btnConfirm.textContent = '🃏 Karten aufdecken';
  domBluff.btnConfirm.classList.remove('hidden');
  domBluff.btnConfirm.onclick = bluffStartReveal;
}

// ── Phase D: Auflösung ────────────────────────────────────────────
function bluffStartReveal() {
  domBluff.btnConfirm.classList.add('hidden');
  const s = bluffState;
  s.phase = 'reveal';
  s.duelSlots.forEach(slot => { slot.playerFaceUp = true; slot.botFaceUp = true; });
  bluffRenderDuelSlots({});

  const results = s.duelSlots.map(sl => evaluateDuel(sl.playerCard?.type, sl.botCard?.type));
  const pWins = results.filter(r => r === 'player').length;
  const bWins = results.filter(r => r === 'bot').length;

  setTimeout(() => {
    bluffRenderDuelSlots({ results });
    if (pWins > bWins) {
      s.matchScore.player++;
      bluffSetHint('🎉', `Du gewinnst <b>${pWins}:${bWins}</b>! +1 Siegpunkt.`);
    } else if (bWins > pWins) {
      s.matchScore.bot++;
      bluffSetHint('😞', `Bot gewinnt <b>${bWins}:${pWins}</b>. +1 für den Bot.`);
    } else {
      bluffSetHint('🤝', `Unentschieden <b>${pWins}:${bWins}</b> – kein Punkt.`);
    }
    bluffRenderMatchScore();
    setTimeout(() => bluffCheckMatchEnd(), 1800);
  }, 600);
}

function bluffCheckMatchEnd() {
  const s = bluffState;
  if (s.matchScore.player >= WIN_SCORE || s.matchScore.bot >= WIN_SCORE) {
    showVictoryScreen(
      s.matchScore.player >= WIN_SCORE,
      `${s.matchScore.player}:${s.matchScore.bot}`
    );
  } else {
    s.phase = 'done';
    bluffSetHint('🔁', 'Partie beendet.',
      [{ label: '▶️ Nächste Partie', id: 'btn-next', cls: 'btn-primary', cb: bluffNextPartie }]
    );
  }
}

function bluffNextPartie() {
  const s = bluffState;
  s.starter = s.starter === 'player' ? 'bot' : 'player';
  s.partieNumber++;
  bluffInitGame();
}

// ── Bluff Rendering ───────────────────────────────────────────────
function bluffRenderAll() {
  bluffRenderMatchScore();
  bluffRenderBotHand();
  bluffRenderPlayerHand({});
  bluffRenderDuelSlots({});
  bluffUpdatePartieInfo();
}

function bluffRenderMatchScore() {
  const render = (container, count, cls) => {
    container.innerHTML = '';
    for (let i = 0; i < WIN_SCORE; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip' + (i < count ? ` filled-${cls}` : '');
      container.appendChild(pip);
    }
  };
  render(domBluff.scorePipsPlayer, bluffState.matchScore.player, 'player');
  render(domBluff.scorePipsBot,    bluffState.matchScore.bot,    'bot');
}

function bluffUpdatePartieInfo() {
  domBluff.partieNumber.textContent = bluffState.partieNumber;
  domBluff.starterInfo.textContent  = bluffState.starter === 'player' ? 'Du fängst an' : 'Bot fängt an';
}

function bluffRenderBotHand() {
  domBluff.botHand.innerHTML = '';
  bluffState.botHand.forEach((card, i) => {
    const el = createCardElement(card, false);
    if (bluffIsInitialDeal) { el.classList.add('dealing'); el.style.animationDelay = `${i * 60}ms`; }
    domBluff.botHand.appendChild(el);
  });
}

function bluffRenderPlayerHand({ selectable = false, supplyDiscard = false } = {}) {
  domBluff.playerHand.innerHTML = '';
  bluffState.playerHand.forEach((card, i) => {
    const el = createCardElement(card, true);
    el.dataset.id = card.id;
    if (bluffIsInitialDeal) { el.classList.add('dealing'); el.style.animationDelay = `${i * 60}ms`; }
    if (!selectable && !supplyDiscard) el.classList.add('disabled');
    domBluff.playerHand.appendChild(el);
  });
}

function bluffRenderDuelSlots({
  highlightSlot = -1, slotClickable = false, onSlotClick = null,
  swapMode = false, onSwapClick = null, results = null,
} = {}) {
  domBluff.duelSlots.innerHTML = '';
  const s = bluffState;

  s.duelSlots.forEach((slot, i) => {
    const duelEl = document.createElement('div');
    duelEl.className = 'duel-slot';

    const resultEl = document.createElement('div');
    resultEl.className = 'duel-result';
    if (results) {
      const r = results[i];
      if (r === 'player')     { resultEl.className += ' win';  resultEl.textContent = 'Gewonnen'; }
      else if (r === 'bot')   { resultEl.className += ' loss'; resultEl.textContent = 'Verloren'; }
      else                    { resultEl.className += ' draw'; resultEl.textContent = 'Unentschieden'; }
    } else { resultEl.className += ' empty'; resultEl.textContent = '-'; }

    const numEl = document.createElement('div');
    numEl.className = 'slot-number';
    numEl.textContent = `Platz ${i + 1}`;

    const botW = document.createElement('div');
    botW.className = 'slot-card-wrapper';
    if (slot.botCard) {
      const cEl = createCardElement(slot.botCard, slot.botFaceUp);
      if (results) {
        const r = results[i];
        if (r === 'player') cEl.classList.add('result-loss');
        else if (r === 'bot') cEl.classList.add('result-win');
        else cEl.classList.add('result-draw');
      }
      if (swapMode) cEl.classList.add('disabled');
      botW.appendChild(cEl);
    } else {
      const ph = document.createElement('div');
      ph.className = 'card-placeholder' + (i === highlightSlot ? ' droppable' : '');
      botW.appendChild(ph);
    }

    const plW = document.createElement('div');
    plW.className = 'slot-card-wrapper';
    if (slot.playerCard) {
      const cEl = createCardElement(slot.playerCard, slot.playerFaceUp);
      if (results) {
        const r = results[i];
        if (r === 'player') cEl.classList.add('result-win');
        else if (r === 'bot') cEl.classList.add('result-loss');
        else cEl.classList.add('result-draw');
      }
      if (swapMode) {
        cEl.classList.remove('disabled');
        cEl.style.cursor = 'pointer';
        if (s.swapSelectedSlots.includes(i)) cEl.classList.add('swap-selected');
        cEl.onclick = () => onSwapClick && onSwapClick(i);
      }
      plW.appendChild(cEl);
    } else {
      const ph = document.createElement('div');
      ph.className = 'card-placeholder' + (i === highlightSlot ? ' droppable' : '');
      if (slotClickable && i === highlightSlot && onSlotClick) {
        ph.style.cursor = 'pointer';
        ph.onclick = () => onSlotClick(i);
        ph.title = 'Karte hier ablegen';
      }
      plW.appendChild(ph);
    }

    duelEl.appendChild(resultEl);
    duelEl.appendChild(numEl);
    duelEl.appendChild(botW);
    duelEl.appendChild(plW);
    domBluff.duelSlots.appendChild(duelEl);
  });
}

function bluffSetHint(icon, html, buttons = []) {
  domBluff.hintIcon.textContent = icon;
  domBluff.hintText.innerHTML   = html;
  domBluff.btnConfirm.classList.add('hidden');
  document.querySelectorAll('#hint-bar .hint-dyn-btn').forEach(b => b.remove());
  buttons.forEach(({ label, id, cls, cb }) => {
    const btn = document.createElement('button');
    btn.id = id; btn.className = `btn ${cls} hint-dyn-btn`; btn.textContent = label; btn.onclick = cb;
    $('hint-bar').appendChild(btn);
  });
}


// ══════════════════════════════════════════════════════════════════
//
//   ██████ ██       █████  ███████ ███████ ██  ██████
//  ██      ██      ██   ██ ██      ██      ██ ██
//  ██      ██      ███████ ███████ ███████ ██ ██
//  ██      ██      ██   ██      ██      ██ ██ ██
//   ██████ ███████ ██   ██ ███████ ███████ ██  ██████
//
// ══════════════════════════════════════════════════════════════════

const classicState = {
  playerHand:  [],
  botHand:     [],
  drawPile:    [],
  discardPile: [],
  playerScore: 0,
  botScore:    0,
  roundNumber: 0,
  totalRounds: 0,
  playerArenaCard: null,
  botArenaCard:    null,
};

function classicNewGame() {
  domShared.victoryScreen.classList.add('hidden');
  const s = classicState;
  const deck = makeDeck();

  s.playerHand  = deck.slice(0, 3);
  s.botHand     = deck.slice(3, 6);
  s.drawPile    = deck.slice(6);
  s.discardPile = [];
  s.playerScore = 0;
  s.botScore    = 0;
  s.roundNumber = 0;
  s.playerArenaCard = null;
  s.botArenaCard    = null;

  // Total rounds: each round consumes 2 cards. Total cards = 18. Rounds = 9.
  s.totalRounds = 9;

  classicRenderAll();
  classicStartRound();
}

function classicRenderAll() {
  classicRenderHeader();
  classicRenderBotHand();
  classicRenderPlayerHand(true);
  classicRenderArena();
}

// ── Classic Rendering ─────────────────────────────────────────────

function classicRenderHeader() {
  const s = classicState;
  domClassic.playerScore.textContent = s.playerScore;
  domClassic.botScore.textContent    = s.botScore;
  domClassic.roundNum.textContent    = s.roundNumber;
  domClassic.totalRounds.textContent = s.totalRounds;
  domClassic.deckCount.textContent   = s.drawPile.length;
}

function classicRenderBotHand() {
  domClassic.botHand.innerHTML = '';
  classicState.botHand.forEach(card => {
    const el = createCardElement(card, false);
    domClassic.botHand.appendChild(el);
  });
}

function classicRenderPlayerHand(selectable) {
  domClassic.playerHand.innerHTML = '';
  classicState.playerHand.forEach(card => {
    const el = createCardElement(card, true);
    el.dataset.id = card.id;
    if (!selectable) el.classList.add('disabled');
    domClassic.playerHand.appendChild(el);
  });
}

function classicRenderArena() {
  const s = classicState;

  // Bot slot
  domClassic.botSlot.innerHTML = '';
  if (s.botArenaCard) {
    // Show face-up only during reveal
    const faceUp = s.botArenaCard._revealed || false;
    const el = createCardElement(s.botArenaCard, faceUp);
    if (s.botArenaCard._result === 'bot')    el.classList.add('result-win');
    if (s.botArenaCard._result === 'player') el.classList.add('result-loss');
    if (s.botArenaCard._result === 'draw')   el.classList.add('result-draw');
    domClassic.botSlot.appendChild(el);
  } else {
    const ph = document.createElement('div');
    ph.className = 'card-placeholder';
    domClassic.botSlot.appendChild(ph);
  }

  // Player slot
  domClassic.playerSlot.innerHTML = '';
  if (s.playerArenaCard) {
    const faceUp = s.playerArenaCard._revealed || false;
    const el = createCardElement(s.playerArenaCard, faceUp);
    if (s.playerArenaCard._result === 'player') el.classList.add('result-win');
    if (s.playerArenaCard._result === 'bot')    el.classList.add('result-loss');
    if (s.playerArenaCard._result === 'draw')   el.classList.add('result-draw');
    domClassic.playerSlot.appendChild(el);
  } else {
    const ph = document.createElement('div');
    ph.className = 'card-placeholder';
    domClassic.playerSlot.appendChild(ph);
  }

  // VS label reset
  domClassic.vsLabel.textContent = 'VS';
  domClassic.vsLabel.className = 'classic-vs';
}

function classicSetHint(icon, html, buttons = []) {
  domClassic.hintIcon.textContent = icon;
  domClassic.hintText.innerHTML   = html;
  domClassic.btnConfirm.classList.add('hidden');
  document.querySelectorAll('#classic-hint-bar .hint-dyn-btn').forEach(b => b.remove());
  buttons.forEach(({ label, id, cls, cb }) => {
    const btn = document.createElement('button');
    btn.id = id; btn.className = `btn ${cls} hint-dyn-btn`; btn.textContent = label; btn.onclick = cb;
    $('classic-hint-bar').appendChild(btn);
  });
}

// ── Classic Round Flow ────────────────────────────────────────────

function classicStartRound() {
  const s = classicState;
  s.roundNumber++;
  s.playerArenaCard = null;
  s.botArenaCard    = null;

  classicRenderAll();
  classicSetHint('🃏', `<b>Runde ${s.roundNumber}/${s.totalRounds}</b> – Wähle eine Karte aus deiner Hand.`);

  // Make player hand clickable
  classicRenderPlayerHand(true);

  domClassic.playerHand.onclick = e => {
    const cardEl = e.target.closest('.card');
    if (!cardEl || cardEl.classList.contains('disabled')) return;

    // Toggle selection
    domClassic.playerHand.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');

    const cardId = cardEl.dataset.id;
    const card = s.playerHand.find(c => c.id === cardId);

    classicSetHint('🃏', `<b>${CARD_NAME[card.type]}</b> ausgewählt.`,
      [{ label: '✅ Karte legen', id: 'btn-classic-play', cls: 'btn-primary', cb: () => classicPlayCards(cardId) }]
    );
  };
}

function classicPlayCards(playerCardId) {
  const s = classicState;
  domClassic.playerHand.onclick = null;

  // Player plays card
  const playerCard = s.playerHand.find(c => c.id === playerCardId);
  s.playerHand = s.playerHand.filter(c => c.id !== playerCardId);

  // Bot picks a card (random)
  const botIdx = Math.floor(Math.random() * s.botHand.length);
  const botCard = s.botHand.splice(botIdx, 1)[0];

  // Place face-down
  s.playerArenaCard = { ...playerCard, _revealed: false, _result: null };
  s.botArenaCard    = { ...botCard,    _revealed: false, _result: null };

  classicRenderPlayerHand(false);
  classicRenderBotHand();
  classicRenderArena();
  classicSetHint('🙈', 'Beide Karten liegen verdeckt …');

  // Reveal after delay
  setTimeout(() => classicReveal(), 1000);
}

function classicReveal() {
  const s = classicState;

  // Reveal both
  s.playerArenaCard._revealed = true;
  s.botArenaCard._revealed    = true;

  const result = evaluateDuel(s.playerArenaCard.type, s.botArenaCard.type);
  s.playerArenaCard._result = result;
  s.botArenaCard._result    = result;

  if (result === 'player') {
    s.playerScore++;
    domClassic.vsLabel.textContent = '✓';
    domClassic.vsLabel.className = 'classic-vs result-win';
  } else if (result === 'bot') {
    s.botScore++;
    domClassic.vsLabel.textContent = '✗';
    domClassic.vsLabel.className = 'classic-vs result-loss';
  } else {
    domClassic.vsLabel.textContent = '=';
    domClassic.vsLabel.className = 'classic-vs result-draw';
  }

  classicRenderArena();
  classicRenderHeader();

  const playerEmoji = CARD_EMOJI[s.playerArenaCard.type];
  const botEmoji    = CARD_EMOJI[s.botArenaCard.type];
  const resultText  = result === 'player' ? '<b>Du gewinnst</b> diese Runde!'
                    : result === 'bot'    ? '<b>Bot gewinnt</b> diese Runde.'
                    :                       '<b>Unentschieden!</b>';

  classicSetHint(
    result === 'player' ? '🎉' : result === 'bot' ? '😞' : '🤝',
    `${playerEmoji} vs ${botEmoji} – ${resultText}`
  );

  // Discard cards
  s.discardPile.push(s.playerArenaCard, s.botArenaCard);

  // Draw from pile
  if (s.drawPile.length > 0) {
    s.playerHand.push(s.drawPile.shift());
  }
  if (s.drawPile.length > 0) {
    s.botHand.push(s.drawPile.shift());
  }

  // Check if game is over
  const gameOver = s.playerHand.length === 0 && s.botHand.length === 0;

  setTimeout(() => {
    if (gameOver || s.roundNumber >= s.totalRounds) {
      classicEndGame();
    } else {
      classicSetHint(
        '▶️',
        `Stand: <b>${s.playerScore}:${s.botScore}</b> · Stapel: ${s.drawPile.length} Karten`,
        [{ label: '▶️ Nächste Runde', id: 'btn-classic-next', cls: 'btn-primary', cb: classicStartRound }]
      );
    }
  }, 1500);
}

function classicEndGame() {
  const s = classicState;
  const won = s.playerScore > s.botScore;
  const tie = s.playerScore === s.botScore;

  if (tie) {
    showVictoryScreen(
      null,
      `${s.playerScore}:${s.botScore}`,
      true // tie
    );
  } else {
    showVictoryScreen(
      won,
      `${s.playerScore}:${s.botScore}`
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// SHARED VICTORY SCREEN
// ══════════════════════════════════════════════════════════════════

function showVictoryScreen(playerWon, scoreStr, tie = false) {
  if (tie) {
    domShared.victoryIcon.textContent  = '🤝';
    domShared.victoryTitle.textContent = 'Unentschieden!';
    domShared.victorySub.textContent   = `Das Spiel endet ${scoreStr}. Keiner gewinnt!`;
  } else if (playerWon) {
    domShared.victoryIcon.textContent  = '🏆';
    domShared.victoryTitle.textContent = 'Du hast gewonnen!';
    domShared.victorySub.textContent   = `Du gewinnst mit ${scoreStr}. Glückwunsch!`;
  } else {
    domShared.victoryIcon.textContent  = '🤖';
    domShared.victoryTitle.textContent = 'Der Bot gewinnt!';
    domShared.victorySub.textContent   = `Der Bot gewinnt mit ${scoreStr}. Vielleicht nächstes Mal?`;
  }
  domShared.victoryScreen.classList.remove('hidden');
}

// ══════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════

showModeSelection();
