// const svg = document.getElementById('svg');
const svg = document.documentElement;

// update digital date & time texts
const digitalDate = document.getElementById("date-text");
const digitalTime = document.getElementById("time-text");
const formatDate = (date) => {
  const b = `\u{2007}`;
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  return `${`${m}`.padStart(2, b)}/${`${d}`.padStart(2, b)} ${w}${b}`;
};
const formatTime = (date) => {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  return `${`${h}`.padStart(2, "0")}:${`${m}`.padStart(
    2,
    "0"
  )}:${`${s}`.padStart(2, "0")}`;
};
const updateDigital = (date) => {
  digitalDate.textContent = formatDate(date);
  digitalTime.textContent = formatTime(date);
};

const hHand = document.getElementById("hour");
const mHand = document.getElementById("minute");
const sHand = document.getElementById("second");

const hRotate = svg.createSVGTransform();
const mRotate = svg.createSVGTransform();
const sRotate = svg.createSVGTransform();

hHand.transform.baseVal.appendItem(hRotate);
mHand.transform.baseVal.appendItem(mRotate);
sHand.transform.baseVal.appendItem(sRotate);

const setTime = (date) => {
  const sSec = date.getSeconds();
  const mSec = date.getMinutes() * 60 + sSec;
  const hSec = ((date.getHours() - 1) % 12) * 60 * 60 + mSec;

  const sAngle = sSec * (360 / 60);
  const mAngle = mSec * (360 / (60 * 60));
  const hAngle = hSec * (360 / (12 * 60 * 60));

  hRotate.setRotate(hAngle, 0, 0);
  mRotate.setRotate(mAngle, 0, 0);
  sRotate.setRotate(sAngle, 0, 0);
  updateDigital(date);
};

// tick sound
let ac = null;
const toggleAudio = () => {
  if (ac) {
    ac.close();
    ac = null;
  } else {
    ac = new AudioContext();
  }
};
const tick = () => {
  if (!ac) return;
  const ws = ac.createWaveShaper();
  ws.connect(ac.destination);
  const g = ac.createGain();
  g.connect(ws);
  g.gain.setValueAtTime(20, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.00001, ac.currentTime + 0.01);
  g.gain.linearRampToValueAtTime(0.00001, ac.currentTime + 0.199);
  g.gain.exponentialRampToValueAtTime(10, ac.currentTime + 0.2);
  g.gain.exponentialRampToValueAtTime(0.00001, ac.currentTime + 0.21);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5);
  const p = ac.createBiquadFilter();
  p.connect(g);
  p.type = "bandpass";
  p.frequency.value = 440 * 2 ** 3;
  p.Q.value = 110 * 2 ** 4;
  const o = ac.createOscillator();
  o.connect(p);
  o.type = "sine";
  o.frequency.value = 440 * 2 ** (10 / 12) * 2 ** 2;
  o.start(ac.currentTime);
  o.stop(ac.currentTime + 0.5);
  o.addEventListener(
    "ended",
    () => {
      ws.disconnect();
    },
    { once: true }
  );
};
document.addEventListener("click", (ev) => toggleAudio()); // click to sound enabled

// animate
let sec = -10;
let running = true;
const loop = () => {
  if (running) {
    const now = new Date();
    setTime(now);
    const s = now.getSeconds();
    if ((s === 0 && sec === 59) || s === sec + 1) tick();
    sec = s;
  }
  requestAnimationFrame(loop);
};
loop();

// export functions into HTMLObjectElement.contentWindow
const digital = document.getElementById("digital");
globalThis.clock = {
  // clock state
  get running() {
    return running;
  },
  stop() {
    running = false;
  },
  restart() {
    running = true;
  },
  setDate(date) {
    running = false;
    setTime(date);
  },
  // digital panel
  get digitalVisible() {
    return digital.getAttribute("display") !== "none";
  },
  digitalShow() {
    digital.setAttribute("display", "block");
  },
  digitalHide() {
    digital.setAttribute("display", "none");
  },
  // tick sound
  get soundEnabled() {
    return ac !== null;
  },
  soundToggle() {
    toggleAudio();
  },
};
