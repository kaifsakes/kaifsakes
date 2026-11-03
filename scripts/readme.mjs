// Writes README.md from the same data as build.mjs. Run: node scripts/readme.mjs
import { writeFileSync } from "node:fs";
import { PROJECTS, BUTTONS, STACK } from "./build.mjs";

const SITE = "https://muhammadkaif.work";
const pic = (name, alt, attrs = 'width="100%"') =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg"><source media="(prefers-color-scheme: light)" srcset="assets/${name}-light.svg"><img src="assets/${name}-dark.svg" alt="${alt}" ${attrs}></picture>`;
const LINKS = {
  portfolio: SITE,
  linkedin: "https://www.linkedin.com/in/kaifsake",
  hire: "mailto:hire@muhammadkaif.work",
  partner: "mailto:partner@muhammadkaif.work",
  cv: `${SITE}/cv`,
};
const btns = BUTTONS.map((b) => `<a href="${LINKS[b.key]}">${pic(`btn-${b.key}`, b.label, 'height="52"')}</a>`).join("\n");
const cards = [];
for (let i = 0; i < PROJECTS.length; i += 2) {
  cards.push(
    PROJECTS.slice(i, i + 2)
      .map((p) => `<a href="${SITE}/work/${p.slug}">${pic(`project-${p.slug}`, `${p.title}: ${p.line} ${p.result} ${p.unit}.`, 'width="49%"')}</a>`)
      .join("\n"),
  );
}
const md = `<!-- Profile README for github.com/kaifsakes. Facts match muhammadkaif.work. Graphics: node scripts/build.mjs && node scripts/readme.mjs -->

<a href="${SITE}">${pic("hero", "Muhammad Kaif, Embedded Systems & AI Engineer. Firmware, medical wearables, edge AI and IoT. Open to roles, relocation-ready.")}</a>

<p align="center">
${btns}
</p>

I write firmware and build edge-AI and medical-wearable systems, from board bring-up and RTOS drivers to BLE, IoT dashboards and models that run on the device. Based in Pakistan; **Embedded Systems Engineer at ChipMango** (Aug 2026 – present), previously Technical Project Manager at Geocell Canada and Firmware Team Lead at MachaDev Engineering. Full story on **[muhammadkaif.work](${SITE})**.

${pic("stats", "23+ projects delivered, 12 engineers led, $19,500+ grants secured, 70+ events organised")}

## Selected work

<p align="center">
${cards.join("\n<br>\n")}
</p>

Case studies, photos and more on **[muhammadkaif.work/work](${SITE}/work)**.

## Seven channels

<a href="${SITE}/expertise">${pic("expertise", "CH1 Embedded & Firmware, CH2 Medical Wearables, CH3 Edge AI & ML, CH4 Connectivity & IoT, CH5 Hardware & Silicon, CH6 Technical Leadership, CH7 Community & Grants")}</a>

## Leadership

- General Secretary, IEEE PES/PELS Joint Chapter, Islamabad (Jun 2025 – present)
- General Secretary, IEEE SIGHT (Jun 2025 – present)
- President, IEEE CTSoc, SPS & EMBS Student Chapters, UET Taxila (May 2024 – May 2025)
- 🏆 IEEE PES Outstanding Volunteer Award (2025)
- 🏆 Best Technical Professional Chapter Award, IEEE Islamabad Section (2025)
- 🏆 Best Technical Student Chapter Award, IEEE Islamabad Section (2024)

More on **[muhammadkaif.work/leadership](${SITE}/leadership)**.

## Stack

<a href="${SITE}/expertise">${pic("stack", STACK.map((x) => x[0]).join(", "))}</a>

Also SQL, Dart, ESP8266, CH32 (WCH), Teensy, Arm, Xilinx FPGA, FreeRTOS, CMake, MQTT, Modbus RTU, LoRa, WebSockets, Socket.IO, JSON, TFLite Micro, Keras, scikit-learn, OpenCV, ONNX, Hugging Face, LangGraph, OpenAI, Ollama, Qwen, ChromaDB, Proteus, Cadence Virtuoso, Vivado, Nextion, NI Multisim, Docker, Postman, Tailscale, Jira, Figma, Cursor, Claude, Slack, MS Office, Flutter and Android Studio.

<a href="${SITE}">${pic("footer", "muhammadkaif.work")}</a>

<!-- CH1 trigger armed. If you're reading the source, you'd probably enjoy the site's source too. -->
`;
writeFileSync(new URL("../README.md", import.meta.url), md);
console.log("README.md written");
