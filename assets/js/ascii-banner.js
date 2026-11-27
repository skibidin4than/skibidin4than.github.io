// Renders the vendored Autumn Pagoda Maples ASCII piece onto a canvas,
// halftone "dots" look, 15 fps. Self-hosted, no external dependency.
import create, { meta } from "./ascii/pieces/autumn-pagoda-maples.js";

const LEVELS = "▁▂▃▄▅▆▇█";
const CELL = 5;
const COLS = meta.cols;
const ROWS = meta.rows;

const canvas = document.getElementById("ascii-banner");
if (canvas) {
  try {
    init(canvas);
  } catch (err) {
    console.warn("ASCII banner failed to start:", err);
  }
}

function init(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const palette = tonePalette(meta.palette, meta.dots.tone);
  const frameFn = create();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = 0;

  function draw() {
    const frame = frameFn(t);
    const textLines = frame.text.split("\n");
    const colorLines = frame.color.split("\n");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      const textRow = textLines[y];
      const colorRow = colorLines[y];
      for (let x = 0; x < COLS; x++) {
        const color = palette[colorRow[x]];
        if (!color) continue;
        const lv = LEVELS.indexOf(textRow[x]);
        if (lv < 0) continue;
        const r = CELL * (0.18 + 0.55 * (lv / 7));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  draw();
  if (reduced) return;

  let timer = null;
  const start = () => {
    if (timer !== null) return;
    timer = window.setInterval(() => {
      t += 1 / meta.fps;
      draw();
    }, 1000 / meta.fps);
  };
  const stop = () => {
    if (timer === null) return;
    window.clearInterval(timer);
    timer = null;
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) start();
        else stop();
      });
    }).observe(canvas);
  } else {
    start();
  }
}

// Applies the piece's "dots" tone (gamma, floor, saturation) to the palette once.
function tonePalette(palette, tone) {
  const out = {};
  for (const [key, hex] of Object.entries(palette)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const adjust = (c) => {
      let v = lum + (c - lum) * tone.sat;
      v = 255 * Math.pow(v / 255, tone.gamma);
      return Math.max(Math.round(v), Math.round(tone.floor * 255));
    };
    const toHex = (v) => v.toString(16).padStart(2, "0");
    out[key] = "#" + toHex(adjust(r)) + toHex(adjust(g)) + toHex(adjust(b));
  }
  return out;
}
