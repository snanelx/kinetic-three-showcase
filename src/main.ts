import "./styles.css";
import * as THREE from "three";

type Palette = {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
};

const palettes: Palette[] = [
  { background: "#08111f", primary: "#65f0d4", secondary: "#6aa7ff", accent: "#f7c66f" },
  { background: "#101522", primary: "#ff7a90", secondary: "#8f7cff", accent: "#7dffd0" },
  { background: "#0d1c18", primary: "#a3ff73", secondary: "#51d6ff", accent: "#ffd36b" },
  { background: "#150f24", primary: "#f4a7ff", secondary: "#77e3ff", accent: "#ffdf80" }
];

const panels = Array.from(document.querySelectorAll<HTMLElement>(".panel"));
const dotsContainer = document.querySelector<HTMLElement>(".dots");
const canvas = document.querySelector<HTMLCanvasElement>("#space");

if (!canvas || !dotsContainer) {
  throw new Error("Не найдены обязательные элементы интерфейса.");
}

let activeIndex = 0;
let isLocked = false;
let touchStartY = 0;

const dots = panels.map((panel, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `Открыть секцию ${index + 1}`);
  dot.addEventListener("click", () => goTo(index));
  dotsContainer.appendChild(dot);
  panel.style.setProperty("--panel-index", String(index));
  return dot;
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 7);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const group = new THREE.Group();
scene.add(group);

const geometry = new THREE.IcosahedronGeometry(1.45, 2);
const material = new THREE.MeshStandardMaterial({
  color: palettes[0].primary,
  emissive: palettes[0].secondary,
  emissiveIntensity: 0.25,
  roughness: 0.28,
  metalness: 0.62,
  wireframe: true
});
const core = new THREE.Mesh(geometry, material);
group.add(core);

const ringMaterial = new THREE.MeshBasicMaterial({
  color: palettes[0].accent,
  transparent: true,
  opacity: 0.5
});
const rings: THREE.Mesh[] = [];

for (let index = 0; index < 3; index += 1) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1 + index * 0.42, 0.008, 16, 160), ringMaterial.clone());
  ring.rotation.x = Math.PI / (2.4 + index * 0.25);
  ring.rotation.y = index * 0.65;
  rings.push(ring);
  group.add(ring);
}

const particleCount = 520;
const positions = new Float32Array(particleCount * 3);
for (let index = 0; index < particleCount; index += 1) {
  const radius = 4 + Math.random() * 7;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
  positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  positions[index * 3 + 2] = radius * Math.cos(phi);
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const particlesMaterial = new THREE.PointsMaterial({
  color: palettes[0].secondary,
  size: 0.028,
  transparent: true,
  opacity: 0.78
});
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const keyLight = new THREE.PointLight("#ffffff", 2.4, 30);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);
scene.add(new THREE.AmbientLight("#ffffff", 0.45));

function updateInterface() {
  panels.forEach((panel, index) => {
    const isActive = index === activeIndex;
    panel.classList.toggle("is-active", isActive);
    panel.classList.toggle("is-before", index < activeIndex);
    panel.classList.toggle("is-after", index > activeIndex);
    panel.setAttribute("aria-hidden", String(!isActive));
    panel.style.visibility = isActive ? "visible" : "hidden";
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
    dot.setAttribute("aria-selected", String(index === activeIndex));
  });

  const palette = palettes[activeIndex];
  document.documentElement.style.setProperty("--bg", palette.background);
  document.documentElement.style.setProperty("--primary", palette.primary);
  document.documentElement.style.setProperty("--secondary", palette.secondary);
  document.documentElement.style.setProperty("--accent", palette.accent);

  material.color.set(palette.primary);
  material.emissive.set(palette.secondary);
  particlesMaterial.color.set(palette.secondary);
  rings.forEach((ring) => {
    const meshMaterial = ring.material as THREE.MeshBasicMaterial;
    meshMaterial.color.set(palette.accent);
  });
}

function goTo(index: number) {
  const nextIndex = Math.max(0, Math.min(panels.length - 1, index));

  if (nextIndex === activeIndex || isLocked) {
    return;
  }

  activeIndex = nextIndex;
  isLocked = true;
  updateInterface();
  window.setTimeout(() => {
    isLocked = false;
  }, 760);
}

function move(delta: number) {
  goTo(activeIndex + delta);
}

document.querySelectorAll<HTMLElement>("[data-next]").forEach((button) => {
  button.addEventListener("click", () => move(1));
});

document.querySelectorAll<HTMLElement>("[data-prev]").forEach((button) => {
  button.addEventListener("click", () => move(-1));
});

document.querySelector<HTMLElement>("[data-restart]")?.addEventListener("click", () => goTo(0));

window.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    if (Math.abs(event.deltaY) < 18) {
      return;
    }
    move(event.deltaY > 0 ? 1 : -1);
  },
  { passive: false }
);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    move(1);
  }
  if (event.key === "ArrowUp" || event.key === "PageUp") {
    event.preventDefault();
    move(-1);
  }
  if (event.key === "Home") {
    goTo(0);
  }
  if (event.key === "End") {
    goTo(panels.length - 1);
  }
});

window.addEventListener("touchstart", (event) => {
  touchStartY = event.touches[0]?.clientY ?? 0;
});

window.addEventListener("touchend", (event) => {
  const endY = event.changedTouches[0]?.clientY ?? touchStartY;
  const delta = touchStartY - endY;
  if (Math.abs(delta) > 44) {
    move(delta > 0 ? 1 : -1);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  const speed = 0.16 + activeIndex * 0.045;
  const isNarrow = window.innerWidth < 720;

  group.rotation.x = Math.sin(elapsed * 0.32) * 0.18 + activeIndex * 0.08;
  group.rotation.y += speed * 0.012;
  group.position.x = isNarrow ? 0 : 1.45;
  group.position.y = Math.sin(elapsed * 0.7) * 0.12;
  group.scale.setScalar(isNarrow ? 0.78 : 1);

  particles.rotation.y -= 0.0009 + activeIndex * 0.00035;
  particles.rotation.x = Math.sin(elapsed * 0.1) * 0.08;

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

updateInterface();
animate();
