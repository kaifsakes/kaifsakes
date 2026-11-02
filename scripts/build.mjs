// Generates the "liquid glass" SVGs used by README.md, in light and dark.
// Run: node scripts/build.mjs   (no dependencies)
// Facts must match https://muhammadkaif.work (source of truth).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = new URL("../assets/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const SITE = "https://muhammadkaif.work";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace";

const THEMES = {
  dark: {
    base: "#050b14",
    text: "#f2f6f8",
    sub: "#a9b8c4",
    faint: "#6f8396",
    tint: "rgba(6,14,26,0.6)",
    tintTop: "rgba(255,255,255,0.14)",
    rim: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.22)"],
    chip: "rgba(255,255,255,0.10)",
    chipStroke: "rgba(255,255,255,0.18)",
    shadow: "rgba(0,0,0,0.55)",
    orbOpacity: 0.6,
    accent: "#5fd4be",
    good: "#5fd4be",
  },
  light: {
    base: "#eef5f4",
    text: "#0e1a2b",
    sub: "#44546a",
    faint: "#7a8798",
    tint: "rgba(255,255,255,0.42)",
    tintTop: "rgba(255,255,255,0.45)",
    rim: ["rgba(255,255,255,0.95)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0.8)"],
    chip: "rgba(255,255,255,0.55)",
    chipStroke: "rgba(0,0,0,0.08)",
    shadow: "rgba(14,40,60,0.16)",
    orbOpacity: 0.5,
    accent: "#0f766e",
    good: "#0f766e",
  },
};

// Wallpaper palettes (soft, Apple-wallpaper-like orbs).
const PALETTES = [
  ["#3fbfa8", "#1b3a5c", "#f4c2c2", "#0f5e63"],
  ["#1b3a5c", "#3fbfa8", "#0f5e63", "#f4c2c2"],
  ["#f4c2c2", "#0f5e63", "#3fbfa8", "#1b3a5c"],
  ["#0f5e63", "#f4c2c2", "#1b3a5c", "#3fbfa8"],
];
const PINK = { dark: "#f4c2c2", light: "#b4536a" };

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

let uid = 0;
const id = (p) => `${p}${++uid}`;

const STYLE = (extra = "") => `<style>
  .t{font-family:${SANS}}
  .m{font-family:${MONO};letter-spacing:.06em}
  @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-25px)}}
  @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,20px)}}
  @keyframes drift3{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,30px)}}
  .o1{animation:drift1 14s ease-in-out infinite}
  .o2{animation:drift2 18s ease-in-out infinite}
  .o3{animation:drift3 16s ease-in-out infinite}
  ${extra}
  @media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>`;

/** Wallpaper with blurred colour orbs. Returns {defs, id} to <use>. */
function wallpaper(w, h, th, palette, seed = 0, animate = true) {
  const bg = id("bg");
  const blur = id("wb");
  const orbs = palette
    .map((c, i) => {
      const r = Math.max(w, h) * (0.22 + ((i + seed) % 3) * 0.06);
      const cx = ((i * 0.31 + seed * 0.17 + 0.08) % 1) * w;
      const cy = ((i * 0.53 + seed * 0.29 + 0.2) % 1) * h;
      const cls = animate ? ` class="o${(i % 3) + 1}"` : "";
      return `<circle${cls} cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${c}" opacity="${th.orbOpacity}"/>`;
    })
    .join("");
  return {
    id: bg,
    defs: `<filter id="${blur}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(Math.min(w, h) * 0.16)}"/></filter>
<g id="${bg}"><rect width="${w}" height="${h}" fill="${th.base}"/><g filter="url(#${blur})">${orbs}</g></g>`,
  };
}

/** A frosted-glass panel over the wallpaper `bgId`. */
function glass(th, bgId, x, y, w, h, r) {
  const clip = id("c");
  const frost = id("f");
  const rim = id("r");
  const sheen = id("s");
  const sh = id("sh");
  return `<defs>
  <clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
  <filter id="${frost}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/><feColorMatrix type="saturate" values="1.6"/></filter>
  <filter id="${sh}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="${Math.round(h * 0.04) + 6}" stdDeviation="${Math.round(h * 0.05) + 8}" flood-color="${th.shadow}"/></filter>
  <linearGradient id="${rim}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${th.rim[0]}"/><stop offset=".5" stop-color="${th.rim[1]}"/><stop offset="1" stop-color="${th.rim[2]}"/>
  </linearGradient>
  <linearGradient id="${sheen}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${th.tintTop}"/><stop offset=".5" stop-color="${th.tintTop}" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${th.base}" opacity=".35" filter="url(#${sh})"/>
<g clip-path="url(#${clip})">
  <use href="#${bgId}" xlink:href="#${bgId}" filter="url(#${frost})"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${th.tint}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${sheen})"/>
</g>
<rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="${r - 0.75}" fill="none" stroke="url(#${rim})" stroke-width="1.5"/>`;
}

function chip(th, x, y, label, { mono = true, size = 14, color, dot } = {}) {
  const padX = 12;
  const cw = size * (mono ? 0.68 : 0.58);
  const w = Math.round(label.length * cw + padX * 2 + (dot ? 16 : 0));
  const h = size + 14;
  const tx = x + padX + (dot ? 16 : 0);
  return {
    w,
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${th.chip}" stroke="${th.chipStroke}"/>
${dot ? `<circle cx="${x + padX + 4}" cy="${y + h / 2}" r="4.5" fill="${dot}"/>` : ""}
<text x="${tx}" y="${y + h / 2 + size * 0.36}" class="${mono ? "m" : "t"}" font-size="${size}" font-weight="600" fill="${color ?? th.sub}">${esc(label)}</text>`,
  };
}

function svgDoc(w, h, th, body, extraStyle = "", r = 28, title = "") {
  const clip = id("outer");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${title ? ` aria-label="${esc(title)}"` : ""}>
${title ? `<title>${esc(title)}</title>` : ""}
${STYLE(extraStyle)}
<defs><clipPath id="${clip}"><rect width="${w}" height="${h}" rx="${r}"/></clipPath></defs>
<g clip-path="url(#${clip})">
${body}
</g>
</svg>`;
}

function write(name, theme, svg) {
  writeFileSync(new URL(`${name}-${theme}.svg`, OUT), svg);
}

// A PPG-style pulse trace (instrument nod), as a path from x0 to x1.
function tracePath(x0, x1, yMid, amp, period) {
  let d = `M${x0} ${yMid}`;
  for (let x = x0; x < x1; x += period) {
    const p = (f) => (x + f * period).toFixed(1);
    d += ` L${p(0.18)} ${yMid}`;
    d += ` C${p(0.24)} ${yMid} ${p(0.27)} ${yMid - amp} ${p(0.33)} ${yMid - amp}`;
    d += ` C${p(0.4)} ${yMid - amp} ${p(0.44)} ${yMid - amp * 0.25} ${p(0.5)} ${yMid - amp * 0.3}`;
    d += ` C${p(0.55)} ${yMid - amp * 0.45} ${p(0.6)} ${yMid - amp * 0.4} ${p(0.66)} ${yMid - amp * 0.2}`;
    d += ` C${p(0.75)} ${yMid} ${p(0.85)} ${yMid} ${p(1)} ${yMid}`;
  }
  return d;
}

// ---------------------------------------------------------------- hero
function hero(themeName) {
  const th = THEMES[themeName];
  const W = 1200, H = 420;
  const wp = wallpaper(W, H, th, PALETTES[1], 1);
  const px = 36, py = 36, pw = W - 72, ph = H - 72;
  const roles = [
    "Firmware  ·  STM32  ·  ESP32  ·  Zephyr RTOS",
    "Medical wearables  ·  PPG  ·  ECG  ·  sEMG",
    "Edge AI  ·  NPUs  ·  on-device LLMs",
    "IoT  ·  BLE  ·  MQTT  ·  Modbus RTU",
  ];
  const traceGrad = id("tg");
  const fade = id("fd");
  const mask = id("mk");
  const roleText = roles
    .map(
      (r, i) =>
        `<text x="96" y="258" class="t role" style="animation-delay:${i * 3}s" font-size="25" font-weight="500" fill="${th.accent}">${esc(r)}</text>`,
    )
    .join("");
  const extra = `
  @keyframes role{0%{opacity:0;transform:translateY(8px)}4%,21%{opacity:1;transform:none}25%,100%{opacity:0;transform:translateY(-8px)}}
  .role{opacity:0;animation:role 12s var(--e,ease) infinite both}
  @keyframes draw{from{stroke-dashoffset:2400}to{stroke-dashoffset:0}}
  .trace{stroke-dasharray:2400;animation:draw 6s linear infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
  .live{animation:blink 2s ease-in-out infinite}
  @media (prefers-reduced-motion: reduce){.role{opacity:0}.role:first-of-type{opacity:1}.trace{stroke-dasharray:none}}`;
  const pill = chip(th, 96, 286, "Open to roles  ·  Relocation-ready", {
    mono: false,
    size: 16,
    color: th.text,
    dot: th.good,
  });
  const ch = chip(th, 96, 82, "CH1  ·  MUHAMMADKAIF.WORK", { size: 13 });
  // Lens with initials on the right.
  const lx = 930, ly = 200, lr = 112;
  const lensClip = id("lc");
  const lensFrost = id("lf");
  const lensRim = id("lr");
  const lens = `<defs>
  <clipPath id="${lensClip}"><circle cx="${lx}" cy="${ly}" r="${lr}"/></clipPath>
  <filter id="${lensFrost}"><feGaussianBlur stdDeviation="8"/><feColorMatrix type="saturate" values="2"/></filter>
  <linearGradient id="${lensRim}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.rim[0]}"/><stop offset=".55" stop-color="${th.rim[1]}"/><stop offset="1" stop-color="${th.rim[2]}"/></linearGradient>
</defs>
<g clip-path="url(#${lensClip})"><use href="#${wp.id}" xlink:href="#${wp.id}" filter="url(#${lensFrost})" transform="translate(${lx} ${ly}) scale(1.25) translate(${-lx} ${-ly})"/><circle cx="${lx}" cy="${ly}" r="${lr}" fill="${th.tint}"/></g>
<ellipse cx="${lx - 30}" cy="${ly - 62}" rx="58" ry="22" fill="#fff" opacity="${themeName === "dark" ? 0.12 : 0.45}" transform="rotate(-24 ${lx - 30} ${ly - 62})"/>
<circle cx="${lx}" cy="${ly}" r="${lr - 1}" fill="none" stroke="url(#${lensRim})" stroke-width="2"/>
<text x="${lx}" y="${ly + 22}" text-anchor="middle" class="t" font-size="64" font-weight="700" fill="${th.text}" letter-spacing="2">MK</text>
<circle cx="${lx}" cy="${ly}" r="${lr + 26}" fill="none" stroke="${th.chipStroke}" stroke-dasharray="2 10"/>
<text x="${lx}" y="${ly + lr + 58}" text-anchor="middle" class="m" font-size="12" fill="${th.faint}">2.00 V/DIV · 50 MS/S · TRIG ↑</text>`;
  const body = `<defs>${wp.defs}
  <linearGradient id="${traceGrad}" x1="0" x2="1"><stop offset="0" stop-color="${th.accent}" stop-opacity="0"/><stop offset=".25" stop-color="${th.accent}"/><stop offset=".75" stop-color="${PINK[themeName]}"/><stop offset="1" stop-color="${PINK[themeName]}" stop-opacity="0"/></linearGradient>
</defs>
<use href="#${wp.id}" xlink:href="#${wp.id}"/>
${glass(th, wp.id, px, py, pw, ph, 40)}
${ch.svg}
<text x="94" y="178" class="t" font-size="66" font-weight="700" fill="${th.text}" letter-spacing="-1">Muhammad Kaif</text>
<text x="96" y="218" class="t" font-size="27" font-weight="500" fill="${th.sub}">Embedded Systems &amp; AI Engineer</text>
${roleText}
${pill.svg}
<path class="trace" d="${tracePath(70, 1130, 352, 26, 150)}" fill="none" stroke="url(#${traceGrad})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
${lens}`;
  write("hero", themeName, svgDoc(W, H, th, body, extra, 44, "Muhammad Kaif, Embedded Systems & AI Engineer"));
}

// ---------------------------------------------------------------- stats
const STATS = [
  ["23+", "projects delivered"],
  ["12", "engineers led"],
  ["$19,500+", "grants secured"],
  ["70+", "events organised"],
];

function stats(themeName) {
  const th = THEMES[themeName];
  const W = 1200, H = 190;
  const wp = wallpaper(W, H, th, PALETTES[3], 2);
  const gap = 20, pad = 22;
  const tw = (W - pad * 2 - gap * 3) / 4, thh = H - pad * 2;
  const tiles = STATS.map(([n, l], i) => {
    const x = pad + i * (tw + gap);
    return `${glass(th, wp.id, x, pad, tw, thh, 26)}
<text x="${x + tw / 2}" y="${pad + 78}" text-anchor="middle" class="t" font-size="50" font-weight="700" fill="${th.text}" letter-spacing="-1">${esc(n)}</text>
<text x="${x + tw / 2}" y="${pad + 118}" text-anchor="middle" class="t" font-size="20" font-weight="500" fill="${th.sub}">${esc(l)}</text>`;
  }).join("");
  const body = `<defs>${wp.defs}</defs><use href="#${wp.id}" xlink:href="#${wp.id}"/>${tiles}`;
  write("stats", themeName, svgDoc(W, H, th, body, "", 32, STATS.map((s) => s.join(" ")).join(", ")));
}

// ---------------------------------------------------------------- projects
export const PROJECTS = [
  { slug: "ppg-glucose", title: "Glucose Without a Needle", line: "Blood glucose estimated from the PPG signal wearables already record.", result: "8.92", unit: "mg/dL RMSE", meta: "UET Taxila · 2024", status: "Research", ch: ["CH2", "CH3"] },
  { slug: "fall-detection", title: "A Wristband That Knows When You Fall", line: "STM32 firmware reads an IMU and streams motion data over BLE.", result: "85%", unit: "detection accuracy", meta: "ChipMango", status: "Live", ch: ["CH1", "CH2", "CH4"] },
  { slug: "telecom-monitoring", title: "Cell Towers That Report Their Own Health", line: "ESP32 + Pi controller, Modbus RTU, MQTT and an ML health model.", result: "8", unit: "site signals, one controller", meta: "Geocell Canada · 2025–26", status: "Live", ch: ["CH1", "CH3", "CH4", "CH5"] },
  { slug: "mirpur-smart-classrooms", title: "Sunlight Into Classrooms", line: "A solar-powered smart computer lab for a rural school in Mirpur, AJK.", result: "$9,940", unit: "IEEE Tech4Good grant", meta: "IEEE Tech4Good · 2026", status: "Live", ch: ["CH6", "CH7"] },
  { slug: "rk3588-edge-ai", title: "A Camera That Thinks Offline", line: "CNN on the RK3588 NPU plus a RAG pipeline with a TinyLLM.", result: "0", unit: "cloud calls, fully on-device", meta: "Freelance · 2026", status: "Prototype", ch: ["CH3", "CH1"] },
  { slug: "ebike-telemetry", title: "An E-Bike That Reports Its Own Battery", line: "GPS and battery telemetry over BLE to a Flutter app and backend.", result: "ESP → BLE", unit: "→ app → cloud", meta: "Geocell Canada · 2026", status: "Live", ch: ["CH1", "CH4"] },
  { slug: "foodease", title: "A Cooker Set Up From Your Phone", line: "ESP32-S3 firmware: BLE provisioning, WebSockets, OTA, state machines.", result: "ESP-IDF", unit: "FreeRTOS · OTA", meta: "MachaDev · 2025", status: "Live", ch: ["CH1", "CH4"] },
  { slug: "magnetic-agv", title: "A Robot That Follows Magnetic Tracks", line: "Custom Hall-effect sensor PCB and MQTT-connected ESP32-S3 firmware.", result: "PCB", unit: "+ firmware + MQTT", meta: "MachaDev · 2025", status: "Prototype", ch: ["CH1", "CH4", "CH5"] },
  { slug: "semg-ankle", title: "Reading Ankle Movement From Muscle Signals", line: "Decoding stroke patients' ankle movement from sEMG.", result: "94%", unit: "decoding accuracy", meta: "MS thesis", status: "Research", ch: ["CH2", "CH3"] },
  { slug: "lung-sounds", title: "Hearing Disease in Breath Sounds", line: "COPD and pneumonia classified from recorded lung sounds.", result: "99%", unit: "classification accuracy", meta: "MS thesis", status: "Research", ch: ["CH2", "CH3"] },
];

function card(themeName, p, i) {
  const th = THEMES[themeName];
  const W = 600, H = 290;
  const wp = wallpaper(W, H, th, PALETTES[i % PALETTES.length], i + 1);
  const inset = 14, x0 = inset + 28;
  let cx = x0;
  const chips = p.ch
    .map((c) => {
      const c1 = chip(th, cx, inset + 24, c, { size: 13 });
      cx += c1.w + 8;
      return c1.svg;
    })
    .join("");
  const statusColor = p.status === "Live" ? th.good : p.status === "Research" ? PINK[themeName] : "#7fb6d6";
  const st = chip(th, 0, 0, p.status.toUpperCase(), { size: 13, dot: statusColor });
  const stSvg = chip(th, W - inset - 28 - st.w, inset + 24, p.status.toUpperCase(), { size: 13, dot: statusColor, color: th.text }).svg;
  const tl = wrap(p.title, 30);
  const titleSvg = tl
    .map((l, k) => `<text x="${x0}" y="${inset + 96 + k * 34}" class="t" font-size="29" font-weight="700" fill="${th.text}" letter-spacing="-.4">${esc(l)}</text>`)
    .join("");
  const ly = inset + 96 + tl.length * 34 + 4;
  const ll = wrap(p.line, 52);
  const lineSvg = ll
    .map((l, k) => `<text x="${x0}" y="${ly + k * 25}" class="t" font-size="19" fill="${th.sub}">${esc(l)}</text>`)
    .join("");
  const by = H - inset - 30;
  const body = `<defs>${wp.defs}</defs><use href="#${wp.id}" xlink:href="#${wp.id}"/>
${glass(th, wp.id, inset, inset, W - inset * 2, H - inset * 2, 30)}
${chips}${stSvg}${titleSvg}${lineSvg}
<text x="${x0}" y="${by}" class="t" font-size="30" font-weight="700" fill="${th.accent}" letter-spacing="-.5">${esc(p.result)}<tspan font-size="16" font-weight="500" fill="${th.sub}" dx="10">${esc(p.unit)}</tspan></text>
<text x="${W - inset - 28}" y="${by}" text-anchor="end" class="m" font-size="13" fill="${th.faint}">${esc(p.meta.toUpperCase())}  ↗</text>`;
  write(`project-${p.slug}`, themeName, svgDoc(W, H, th, body, "", 34, `${p.title}: ${p.line} ${p.result} ${p.unit}`));
}

// ---------------------------------------------------------------- expertise
const CHANNELS = [
  ["CH1", "Embedded & Firmware", "MCU firmware, RTOS, drivers, OTA"],
  ["CH2", "Medical Wearables", "ECG, PPG, IMU, sEMG"],
  ["CH3", "Edge AI & ML", "NPUs, MCUs, offline LLMs"],
  ["CH4", "Connectivity & IoT", "BLE, Wi-Fi, MQTT, Modbus"],
  ["CH5", "Hardware & Silicon", "PCB, analog IC, FPGA"],
  ["CH6", "Technical Leadership", "Teams, delivery, deployment"],
  ["CH7", "Community & Grants", "$19,500+ grants, 70+ events"],
];

function expertise(themeName) {
  const th = THEMES[themeName];
  const W = 1200, H = 380;
  const wp = wallpaper(W, H, th, PALETTES[1], 3);
  const pad = 22, gap = 18;
  const tw = (W - pad * 2 - gap * 3) / 4, thh = (H - pad * 2 - gap) / 2;
  const tiles = CHANNELS.map(([c, n, k], i) => {
    const row = i < 4 ? 0 : 1;
    const col = row ? i - 4 : i;
    const offset = row ? (tw + gap) / 2 : 0;
    const x = pad + offset + col * (tw + gap);
    const y = pad + row * (thh + gap);
    const ch = chip(th, x + 22, y + 22, c, { size: 13, color: th.accent });
    const nl = wrap(n, 21);
    return `${glass(th, wp.id, x, y, tw, thh, 24)}${ch.svg}
${nl.map((l, k) => `<text x="${x + 22}" y="${y + 90 + k * 28}" class="t" font-size="23" font-weight="700" fill="${th.text}">${esc(l)}</text>`).join("")}
<text x="${x + 22}" y="${y + thh - 24}" class="t" font-size="16" fill="${th.sub}">${esc(k)}</text>`;
  }).join("");
  const body = `<defs>${wp.defs}</defs><use href="#${wp.id}" xlink:href="#${wp.id}"/>${tiles}`;
  write("expertise", themeName, svgDoc(W, H, th, body, "", 32, CHANNELS.map((c) => `${c[0]} ${c[1]}: ${c[2]}`).join("; ")));
}

// ---------------------------------------------------------------- buttons
const ICONS = {
  globe: (c) => `<circle cx="0" cy="0" r="9" fill="none" stroke="${c}" stroke-width="1.8"/><ellipse cx="0" cy="0" rx="4" ry="9" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M-9 0H9" stroke="${c}" stroke-width="1.6"/>`,
  in: (c) => `<rect x="-9" y="-9" width="18" height="18" rx="4" fill="${c}"/><text x="0" y="5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="var(--bg)">in</text>`,
  mail: (c) => `<rect x="-10" y="-7" width="20" height="14" rx="3" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M-9 -5L0 2L9 -5" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`,
  doc: (c) => `<path d="M-7 -10H3L8 -5V10H-7Z" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M-3 0H4M-3 4H4" stroke="${c}" stroke-width="1.6"/>`,
  handshake: (c) => `<circle cx="-4" cy="-3" r="5" fill="none" stroke="${c}" stroke-width="1.8"/><circle cx="5" cy="3" r="5" fill="none" stroke="${c}" stroke-width="1.8"/>`,
};

export const BUTTONS = [
  { key: "portfolio", label: "Portfolio", icon: "globe" },
  { key: "linkedin", label: "LinkedIn", icon: "in" },
  { key: "hire", label: "Hire me", icon: "mail" },
  { key: "partner", label: "Collaborate", icon: "handshake" },
  { key: "cv", label: "Request CV", icon: "doc" },
];

function button(themeName, b, i) {
  const th = THEMES[themeName];
  const W = 250, H = 72;
  const wp = wallpaper(W, H, th, PALETTES[i % PALETTES.length], i, false);
  const icon = ICONS[b.icon](th.text).replace("var(--bg)", themeName === "dark" ? "#000" : "#fff");
  const body = `<defs>${wp.defs}</defs><use href="#${wp.id}" xlink:href="#${wp.id}"/>
${glass(th, wp.id, 6, 6, W - 12, H - 12, (H - 12) / 2)}
<g transform="translate(46 ${H / 2})">${icon}</g>
<text x="70" y="${H / 2 + 7}" class="t" font-size="20" font-weight="600" fill="${th.text}">${esc(b.label)}</text>`;
  write(`btn-${b.key}`, themeName, svgDoc(W, H, th, body, "", H / 2, b.label));
}

// ---------------------------------------------------------------- footer
function footer(themeName) {
  const th = THEMES[themeName];
  const W = 1200, H = 120;
  const wp = wallpaper(W, H, th, PALETTES[2], 5);
  const g = id("fg");
  const body = `<defs>${wp.defs}<linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${th.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${th.accent}"/><stop offset="1" stop-color="${th.accent}" stop-opacity="0"/></linearGradient></defs>
<use href="#${wp.id}" xlink:href="#${wp.id}"/>
${glass(th, wp.id, 18, 18, W - 36, H - 36, 28)}
<path class="trace" d="${tracePath(40, 1160, 74, 18, 190)}" fill="none" stroke="url(#${g})" stroke-width="2" opacity=".6"/>
<text x="${W / 2}" y="58" text-anchor="middle" class="t" font-size="22" font-weight="600" fill="${th.text}">muhammadkaif.work</text>
<text x="${W / 2 + 420}" y="${H - 30}" text-anchor="end" class="m" font-size="11" fill="${th.faint}">END OF TRACE · CH1</text>`;
  const extra = `@keyframes draw{from{stroke-dashoffset:2400}to{stroke-dashoffset:0}}.trace{stroke-dasharray:2400;animation:draw 8s linear infinite}`;
  write("footer", themeName, svgDoc(W, H, th, body, extra, 30, "muhammadkaif.work"));
}


// ---------------------------------------------------------------- stack
// Logos: Simple Icons (CC0) and marks Kaif supplied, copied from the portfolio
// repo (public/images/stack). Mono marks are drawn in brand colour, nudged to
// 3:1 contrast against the glass tile (same rule as the site's brand-color.ts).
export const STACK = [
  ["C", "c.svg", "#A8B9CC"], ["C++", "cplusplus.svg", "#00599C"], ["Python", "python.svg", "#3776AB"],
  ["MATLAB", "matlab.webp", "#F33F00"], ["Verilog", "verilog.webp", null], ["STM32", "stmicroelectronics.svg", "#03234B"],
  ["ESP32", "espressif.svg", "#E7352C"], ["Nordic nRF", "nordicsemiconductor.svg", "#00A9CE"], ["Arduino", "arduino.svg", "#00878F"],
  ["Raspberry Pi", "raspberrypi.svg", "#A22846"], ["RK3588", "rockchip.webp", "#0E3496"], ["NVIDIA Jetson", "nvidia.svg", "#76B900"],
  ["Linux", "linux.svg", "#FCC624"], ["Zephyr RTOS", "zephyr.webp", null], ["PlatformIO", "platformio.svg", "#F5822A"],
  ["Git", "git.svg", "#F03C2E"], ["BLE", "bluetooth.svg", "#0082FC"], ["Wi-Fi", "wifi.webp", "#000000"],
  ["PyTorch", "pytorch.svg", "#EE4C2C"], ["TensorFlow", "tensorflow.svg", "#FF6F00"], ["Edge Impulse", "edgeimpulse.svg", "#3B47C2"],
  ["LangChain", "langchain.svg", "#7FC8FF"], ["EasyEDA", "easyeda.svg", "#1765F6"],
];
const TILE_BG = { dark: "#101b2b", light: "#f5f9f9" };
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (c) => { const l = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * l(c[0]) + 0.7152 * l(c[1]) + 0.0722 * l(c[2]); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function readable(hex, theme) {
  const bg = rgb(TILE_BG[theme]), base = rgb(hex), target = theme === "dark" ? [255, 255, 255] : [0, 0, 0];
  for (let t = 0; t <= 1; t += 0.02) {
    const m = base.map((v, i) => Math.round(v + (target[i] - v) * t));
    if (ratio(m, bg) >= 3) return "#" + m.map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  return theme === "dark" ? "#ffffff" : "#000000";
}
const ICON_DIR = new URL("./icons/", import.meta.url);
function logo(file, color, theme, x, y, size) {
  if (file.endsWith(".svg")) {
    const src = readFileSync(new URL(file, ICON_DIR), "utf8");
    const vb = src.match(/viewBox="([^"]+)"/)[1];
    const inner = src.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>[\s\S]*?<\/title>/, "");
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${vb}" fill="${readable(color, theme)}">${inner}</svg>`;
  }
  const data = `data:image/webp;base64,${readFileSync(new URL(file, ICON_DIR)).toString("base64")}`;
  const img = `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${data}" xlink:href="${data}" preserveAspectRatio="xMidYMid meet"/>`;
  if (!color) return img; // full-colour mark
  const m = id("lm");
  return `<mask id="${m}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${size}" height="${size}">${img}</mask><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${readable(color, theme)}" mask="url(#${m})"/>`;
}
function stackPanel(themeName) {
  const th = THEMES[themeName];
  const perRow = 8, rows = Math.ceil(STACK.length / perRow);
  const pad = 22, gap = 14, W = 1200;
  const tw = (W - pad * 2 - gap * (perRow - 1)) / perRow, thh = 128;
  const H = pad * 2 + rows * thh + (rows - 1) * gap;
  const wp = wallpaper(W, H, th, PALETTES[2], 4);
  const tiles = STACK.map(([name, file, color], i) => {
    const row = Math.floor(i / perRow), col = i % perRow;
    const inRow = Math.min(perRow, STACK.length - row * perRow);
    const x = pad + (W - pad * 2 - (inRow * tw + (inRow - 1) * gap)) / 2 + col * (tw + gap);
    const y = pad + row * (thh + gap);
    return `${glass(th, wp.id, x, y, tw, thh, 24)}
<rect x="${x + tw / 2 - 34}" y="${y + 16}" width="68" height="68" rx="18" fill="${TILE_BG[themeName]}" opacity="${themeName === "dark" ? 0.85 : 0.9}"/>
${logo(file, color, themeName, x + tw / 2 - 22, y + 28, 44)}
<text x="${x + tw / 2}" y="${y + thh - 18}" text-anchor="middle" class="t" font-size="16" font-weight="600" fill="${th.text}">${esc(name)}</text>`;
  }).join("");
  const body = `<defs>${wp.defs}</defs><use href="#${wp.id}" xlink:href="#${wp.id}"/>${tiles}`;
  write("stack", themeName, svgDoc(W, H, th, body, "", 32, STACK.map((s) => s[0]).join(", ")));
}

for (const t of Object.keys(THEMES)) {
  stackPanel(t);
  hero(t);
  stats(t);
  expertise(t);
  footer(t);
  PROJECTS.forEach((p, i) => card(t, p, i));
  BUTTONS.forEach((b, i) => button(t, b, i));
}
console.log("built", Object.keys(THEMES).length * (4 + PROJECTS.length + BUTTONS.length), "svgs");
