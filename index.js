// Semiconductor Doping App Engine

// --- Stage Configurations ---
const STAGES = {
  1: {
    title: "Stage 1: N형 반도체 제조",
    desc: "5가 원소인 인(P)을 고농도로 도핑하여 자유 전자를 유도하세요. 전도도를 70% 이상으로 증가시켜 LED 회로의 불을 켜야 합니다.",
    targetText: "70% 이상 (N형)",
    dopant: "P",
    validate: (dopant, conc) => dopant === "P" && conc >= 70
  },
  2: {
    title: "Stage 2: P형 반도체 제조",
    desc: "3가 원소인 붕소(B)를 도핑하여 격자 내에 비어있는 양공(Hole)들을 생성하세요. 전도도를 60% 이상으로 맞추어 LED 불을 켜야 합니다.",
    targetText: "60% 이상 (P형)",
    dopant: "B",
    validate: (dopant, conc) => dopant === "B" && conc >= 60
  },
  3: {
    title: "Stage 3: 정밀 전도도 제어",
    desc: "반도체 칩에 흐르는 미세 전류를 조절하기 위한 정밀 미션입니다. 인(P)의 농도를 제어하여 전도도를 딱 40% ~ 55% 범위 안으로 맞추어 유지하세요.",
    targetText: "40% ~ 55% (정밀 제어)",
    dopant: "P",
    validate: (dopant, conc) => dopant === "P" && conc >= 40 && conc <= 55
  }
};

// --- App State ---
let currentState = {
  stage: 1,
  dopant: "P", // "P" (Phosphorus) or "B" (Boron)
  concentration: 0, // 0 to 100
  conductivity: 0, // 0 to 100
  isCleared: false,
  // Stage Clearance Tracking
  stagesCleared: {
    1: false,
    2: false,
    3: false
  }
};

// --- DOM Elements ---
const canvas = document.getElementById('lattice-canvas');
const ctx = canvas.getContext('2d');
const concentrationSlider = document.getElementById('concentration-slider');
const concentrationVal = document.getElementById('concentration-val');

// Intro Elements
const introScreen = document.getElementById('intro-screen');
const startLabBtn = document.getElementById('start-lab-btn');

// Verification & Action Buttons
const verifyBtn = document.getElementById('verify-btn');

// Circuit SVG Animated paths
const currentLineLeft = document.getElementById('current-line-left');
const currentLineRight = document.getElementById('current-line-right');

// Locked Dopant Badge Elements
const lockedDopantBadge = document.getElementById('locked-dopant-badge');
const dopantBadgeSymbol = document.getElementById('dopant-badge-symbol');
const dopantBadgeName = document.getElementById('dopant-badge-name');
const dopantBadgeValence = document.getElementById('dopant-badge-valence');

const conductivityGauge = document.getElementById('conductivity-gauge');
const gaugePercent = document.getElementById('gauge-percent');
const ledBulb = document.getElementById('led-bulb');
const bulbGlow = document.getElementById('bulb-glow');
const carrierTypeEl = document.getElementById('carrier-type');
const energyStateEl = document.getElementById('energy-state');
const statusGlow = document.getElementById('status-glow');
const statusText = document.getElementById('status-text');

// Mission elements
const missionTitle = document.getElementById('mission-title');
const missionDesc = document.getElementById('mission-desc');
const missionTargetValue = document.getElementById('mission-target-value');

// Navigation & Modals
const stageBtns = document.querySelectorAll('.stage-btn');
const successModal = document.getElementById('success-modal');
const successMessage = document.getElementById('success-message');
const nextStageBtn = document.getElementById('next-stage-btn');

const failModal = document.getElementById('fail-modal');
const failMessage = document.getElementById('fail-message');
const retryBtn = document.getElementById('retry-btn');

const clearModal = document.getElementById('clear-modal');
const restartBtn = document.getElementById('restart-btn');

// --- Lattice Animation Variables ---
const GRID_ROWS = 5;
const GRID_COLS = 5;
let atoms = [];
let carriers = []; // Free electrons or holes moving around

class Atom {
  constructor(row, col, x, y) {
    this.row = row;
    this.col = col;
    this.x = x;
    this.y = y;
    this.type = "Si"; // "Si", "P", "B"
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  draw() {
    this.pulsePhase += 0.05;
    const pulseRadius = 16 + Math.sin(this.pulsePhase) * 0.8;

    // Node outline and fill
    ctx.beginPath();
    ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);

    if (this.type === "Si") {
      ctx.fillStyle = "#1e233c";
      ctx.strokeStyle = "#8b5cf6";
    } else if (this.type === "P") {
      ctx.fillStyle = "rgba(0, 243, 255, 0.15)";
      ctx.strokeStyle = "#00f3ff";
    } else if (this.type === "B") {
      ctx.fillStyle = "rgba(255, 107, 0, 0.15)";
      ctx.strokeStyle = "#ff6b00";
    }
    
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // Element symbol
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.type, this.x, this.y);

    // Valence electrons representation
    let valElectrons = this.type === "Si" ? 4 : (this.type === "P" ? 5 : 3);
    this.drawValenceDots(valElectrons);
  }

  drawValenceDots(count) {
    const radius = 24;
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]; // 4 directions for sharing
    
    ctx.fillStyle = "#a9b1d6";
    angles.forEach((angle, i) => {
      // Draw standard 4 covalent bridge indicators
      const ex = this.x + Math.cos(angle) * radius;
      const ey = this.y + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw the 5th electron for P, or signify deficient bond for B
    if (this.type === "P") {
      // 5th electron is slightly outer, looking ready to detach
      const angle = Math.PI / 4 + this.pulsePhase * 0.02;
      const ex = this.x + Math.cos(angle) * 20;
      const ey = this.y + Math.sin(angle) * 20;
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#00f3ff";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    } else if (this.type === "B") {
      // Missing connection marker (hollow circle near one bond)
      const angle = Math.PI * 1.25;
      const ex = this.x + Math.cos(angle) * 20;
      const ey = this.y + Math.sin(angle) * 20;
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#ff6b00";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

class ChargeCarrier {
  constructor(type, x, y) {
    this.type = type; // "electron" or "hole"
    this.x = x;
    this.y = y;
    // Random velocity for Brownian thermal motion
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.radius = type === "electron" ? 5 : 6;
  }

  update(conductivity) {
    // Basic random walk
    this.x += this.vx;
    this.y += this.vy;

    // Apply drift velocity if conductivity (current flow) is active
    if (conductivity > 0) {
      const driftSpeed = (conductivity / 100) * 2.0;
      if (this.type === "electron") {
        this.x += driftSpeed; // Electrons move to positive anode (right)
      } else {
        this.x -= driftSpeed; // Holes move to negative cathode (left)
      }
    }

    // Wrap around boundaries
    const padding = 15;
    if (this.x < padding) {
      this.x = canvas.width - padding;
      this.y = Math.random() * (canvas.height - padding * 2) + padding;
    }
    if (this.x > canvas.width - padding) {
      this.x = padding;
      this.y = Math.random() * (canvas.height - padding * 2) + padding;
    }
    if (this.y < padding) this.y = canvas.height - padding;
    if (this.y > canvas.height - padding) this.y = padding;

    // Randomize velocity slightly (thermal collision effect)
    if (Math.random() < 0.02) {
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    if (this.type === "electron") {
      ctx.fillStyle = "#00f3ff";
      ctx.shadowColor = "#00f3ff";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#ff6b00";
      ctx.shadowColor = "#ff6b00";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // Reset shadow
    ctx.shadowBlur = 0;
  }
}

// --- Canvas Initialization ---
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  initLatticeGrid();
}

function initLatticeGrid() {
  atoms = [];
  const colGap = canvas.width / (GRID_COLS + 1);
  const rowGap = canvas.height / (GRID_ROWS + 1);

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x = colGap * (c + 1);
      const y = rowGap * (r + 1);
      atoms.push(new Atom(r, c, x, y));
    }
  }
  updateDopingDistribution();
}

// Update which Si atoms are replaced by P or B based on concentration
function updateDopingDistribution() {
  const totalAtoms = atoms.length;
  // Make concentration index map to number of dopant atoms
  const dopantCount = Math.min(totalAtoms, Math.round((currentState.concentration / 100) * totalAtoms));

  // Reset all to Si
  atoms.forEach(atom => atom.type = "Si");

  // Determine fixed pseudo-random indices to replace so it doesn't flicker
  const indices = Array.from({ length: totalAtoms }, (_, i) => i);
  // Simple deterministic shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.abs(Math.sin(i * 12345.67)) % 1 * (i + 1) | 0;
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Inject dopants
  for (let i = 0; i < dopantCount; i++) {
    const targetIdx = indices[i];
    atoms[targetIdx].type = currentState.dopant;
  }

  // Adjust charge carriers based on dopant count and type
  syncCarriers(dopantCount);
}

function syncCarriers(dopantCount) {
  const targetCarrierType = currentState.dopant === "P" ? "electron" : "hole";
  
  // We want approximately 1-2 mobile charges per dopant atom for visualization
  const targetCount = dopantCount * 2;

  // Filter current matching ones
  carriers = carriers.filter(c => c.type === targetCarrierType);

  while (carriers.length < targetCount) {
    // Spawn new carrier near a matching dopant atom
    const dopantAtoms = atoms.filter(a => a.type === currentState.dopant);
    let startX = Math.random() * canvas.width;
    let startY = Math.random() * canvas.height;
    if (dopantAtoms.length > 0) {
      const randomDopant = dopantAtoms[Math.floor(Math.random() * dopantAtoms.length)];
      startX = randomDopant.x + (Math.random() - 0.5) * 40;
      startY = randomDopant.y + (Math.random() - 0.5) * 40;
    }
    carriers.push(new ChargeCarrier(targetCarrierType, startX, startY));
  }

  while (carriers.length > targetCount) {
    carriers.pop();
  }
}

// --- Application Core Update ---
function updateSimulation() {
  // Calculate conductivity
  // Conductivity is proportional to the concentration in this educational model
  currentState.conductivity = currentState.concentration;
  
  // Update GUI values
  concentrationVal.textContent = `${currentState.concentration} %`;
  
  // Update Gauge ring offset
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentState.conductivity / 100) * circumference;
  conductivityGauge.style.strokeDashoffset = offset;
  gaugePercent.textContent = `${currentState.conductivity}%`;
  
  // Dynamic color for gauge depending on active dopant
  if (currentState.dopant === "P") {
    conductivityGauge.style.stroke = "var(--accent-n)";
    gaugePercent.style.color = "var(--accent-n)";
  } else {
    conductivityGauge.style.stroke = "var(--accent-p)";
    gaugePercent.style.color = "var(--accent-p)";
  }

  // LED Bulb Glowing intensity & colors
  const intensity = currentState.conductivity / 100;
  if (intensity > 0.05) {
    ledBulb.style.borderColor = "var(--electric-yellow)";
    ledBulb.style.boxShadow = `0 0 ${10 + intensity * 20}px rgba(255, 230, 0, ${0.1 + intensity * 0.4})`;
    bulbGlow.style.opacity = intensity;
    bulbGlow.style.boxShadow = `0 0 ${20 + intensity * 40}px ${20 + intensity * 20}px rgba(255, 230, 0, ${0.2 + intensity * 0.6})`;

    // Dynamic Circuit Current lines
    currentLineLeft.style.opacity = intensity;
    currentLineRight.style.opacity = intensity;
    
    // Animate flow speed based on current intensity
    const flowDuration = 2.5 - intensity * 2;
    currentLineLeft.style.animation = `flow-right ${flowDuration}s linear infinite`;
    currentLineRight.style.animation = `flow-right ${flowDuration}s linear infinite`;
  } else {
    ledBulb.style.borderColor = "#2a2f4a";
    ledBulb.style.boxShadow = "none";
    bulbGlow.style.opacity = 0;
    bulbGlow.style.boxShadow = "none";
    
    currentLineLeft.style.opacity = 0;
    currentLineRight.style.opacity = 0;
    currentLineLeft.style.animation = "none";
    currentLineRight.style.animation = "none";
  }

  // Dashboard Stats update
  if (currentState.concentration === 0) {
    carrierTypeEl.textContent = "없음 (순수)";
    carrierTypeEl.style.color = "var(--text-secondary)";
    energyStateEl.textContent = "부도체 상태";
    energyStateEl.style.color = "var(--text-secondary)";
    
    statusGlow.style.backgroundColor = "var(--text-secondary)";
    statusGlow.style.boxShadow = "none";
    statusText.textContent = "미도핑 (순수 실리콘)";
  } else if (currentState.dopant === "P") {
    carrierTypeEl.textContent = "자유 전자 (n형)";
    carrierTypeEl.style.color = "var(--accent-n)";
    
    if (currentState.concentration > 70) {
      energyStateEl.textContent = "고전도성 (n+)";
      energyStateEl.style.color = "var(--accent-n)";
    } else {
      energyStateEl.textContent = "전도성 활성화";
      energyStateEl.style.color = "var(--text-primary)";
    }
    
    statusGlow.style.backgroundColor = "var(--accent-n)";
    statusGlow.style.boxShadow = `0 0 8px var(--accent-n)`;
    statusText.textContent = `N형 반도체 도핑 중 (${currentState.concentration}%)`;
  } else if (currentState.dopant === "B") {
    carrierTypeEl.textContent = "양공 (p형)";
    carrierTypeEl.style.color = "var(--accent-p)";
    
    if (currentState.concentration > 60) {
      energyStateEl.textContent = "고전도성 (p+)";
      energyStateEl.style.color = "var(--accent-p)";
    } else {
      energyStateEl.textContent = "전도성 활성화";
      energyStateEl.style.color = "var(--text-primary)";
    }
    
    statusGlow.style.backgroundColor = "var(--accent-p)";
    statusGlow.style.boxShadow = `0 0 8px var(--accent-p)`;
    statusText.textContent = `P형 반도체 도핑 중 (${currentState.concentration}%)`;
  }
  // Auto check is removed. Manual button click triggers checkMission instead.
}

function checkMission() {
  if (currentState.isCleared) return;

  const currentStageRules = STAGES[currentState.stage];
  const isValid = currentStageRules.validate(currentState.dopant, currentState.concentration);

  if (isValid) {
    currentState.isCleared = true;
    // Mark this stage as cleared
    currentState.stagesCleared[currentState.stage] = true;
    unlockNextStageTab();
    showSuccessModal();
  } else {
    showFailModal();
  }
}

function unlockNextStageTab() {
  const nextStageNum = currentState.stage + 1;
  if (nextStageNum <= 3) {
    const nextStageBtnEl = document.getElementById(`stage${nextStageNum}-btn`);
    if (nextStageBtnEl) {
      nextStageBtnEl.disabled = false;
      nextStageBtnEl.classList.remove('locked');
      // Remove lock icon text
      nextStageBtnEl.innerHTML = `Stage ${nextStageNum}: ${nextStageNum === 2 ? 'P형 반도체' : '정밀 제어'}`;
    }
  }
}

function showFailModal() {
  const currentStageRules = STAGES[currentState.stage];
  if (currentState.stage === 1) {
    failMessage.textContent = `N형 반도체를 제조하려면 5가 원소인 '인(P)' 도핑 농도를 70% 이상으로 극대화하여 잉여 자유 전자를 충분히 생성해야 합니다. (현재 전도도: ${currentState.conductivity}%)`;
  } else if (currentState.stage === 2) {
    failMessage.textContent = `P형 반도체를 제조하려면 3가 원소인 '붕소(B)' 도핑 농도를 60% 이상으로 유지하여 양공(Hole)을 통한 전류 운반을 완성해야 합니다. (현재 전도도: ${currentState.conductivity}%)`;
  } else if (currentState.stage === 3) {
    failMessage.textContent = `정밀 전도도 설정에 실패했습니다! 가이드에 따라 전도도 목표 수치를 40% ~ 55% 범위 안으로 슬라이더를 정교하게 맞춰 주세요. (현재 전도도: ${currentState.conductivity}%)`;
  }
  failModal.classList.add('active');
}

// --- Modals and Progression ---
function showSuccessModal() {
  if (currentState.stage === 1) {
    successMessage.textContent = "훌륭합니다! 5가 원소인 인(P)을 도핑하여 남는 잉여 전자를 발생시켜 전류를 성공적으로 흘렸습니다. 이것이 'N형 반도체'의 원리입니다.";
  } else if (currentState.stage === 2) {
    successMessage.textContent = "대단합니다! 3가 원소인 붕소(B)를 도핑하여 격자 내에 부족한 결합 자리인 '양공(Hole)'을 만들고 전류를 흘렸습니다. 이것이 'P형 반도체'의 원리입니다.";
  } else if (currentState.stage === 3) {
    successMessage.textContent = "정밀 도핑 미션을 해결하셨습니다! 반도체 제조 시에는 용도에 따라 불순물의 농도를 미세하게 조율하여 원하는 전기적 저항 특성을 부여하는 정밀 가공이 핵심입니다.";
  }

  setTimeout(() => {
    successModal.classList.add('active');
  }, 600);
}

function loadStage(stageNum) {
  currentState.stage = stageNum;
  currentState.isCleared = false;
  
  const rules = STAGES[stageNum];
  
  // Set UI elements
  missionTitle.textContent = rules.title;
  missionDesc.textContent = rules.desc;
  missionTargetValue.textContent = rules.targetText;

  // Active navigation button state
  stageBtns.forEach(btn => {
    if (parseInt(btn.getAttribute('data-stage')) === stageNum) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Level specific setup triggers
  if (stageNum === 1) {
    setDopant("P");
  } else if (stageNum === 2) {
    setDopant("B");
  } else if (stageNum === 3) {
    setDopant("P");
  }
  
  // Reset slider to 0 for stage progression feel
  currentState.concentration = 0;
  concentrationSlider.value = 0;
  updateDopingDistribution();
  updateSimulation();
}

function setDopant(type) {
  currentState.dopant = type;
  if (type === "P") {
    lockedDopantBadge.className = "dopant-display-info type-p";
    dopantBadgeSymbol.textContent = "P";
    dopantBadgeName.textContent = "인 (Phosphorus)";
    dopantBadgeValence.textContent = "5가 원소 (최외각 5)";
    concentrationSlider.style.accentColor = "var(--accent-n)";
  } else {
    lockedDopantBadge.className = "dopant-display-info type-b";
    dopantBadgeSymbol.textContent = "B";
    dopantBadgeName.textContent = "붕소 (Boron)";
    dopantBadgeValence.textContent = "3가 원소 (최외각 3)";
    concentrationSlider.style.accentColor = "var(--accent-p)";
  }
  updateDopingDistribution();
  updateSimulation();
}

// --- Animation Loop ---
function draw() {
  // Clear canvas with trace tail effect (adds premium glowing trail)
  ctx.fillStyle = "rgba(13, 14, 21, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Covalent Bonds (lines between adjacent Si lattice nodes)
  drawCovalentBonds();

  // Draw Atoms
  atoms.forEach(atom => atom.draw());

  // Draw and Update Mobile Charge Carriers
  carriers.forEach(carrier => {
    carrier.update(currentState.conductivity);
    carrier.draw();
  });

  requestAnimationFrame(draw);
}

function drawCovalentBonds() {
  ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
  ctx.lineWidth = 4;
  
  // Find nodes with same row or col and connect them
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i];
    for (let j = i + 1; j < atoms.length; j++) {
      const b = atoms[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      // Grid gaps are roughly equal, connect direct neighbors
      if (distance < Math.max(canvas.width, canvas.height) / 4) {
        if (a.row === b.row || a.col === b.col) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Intro dismiss button
  startLabBtn.addEventListener('click', () => {
    introScreen.classList.add('hidden');
  });

  // Verify manual click
  verifyBtn.addEventListener('click', () => {
    checkMission();
  });

  // Slider change
  concentrationSlider.addEventListener('input', (e) => {
    currentState.concentration = parseInt(e.target.value);
    updateDopingDistribution();
    updateSimulation();
  });

  // Modals Buttons
  nextStageBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    
    // Check if we are proceeding to the next locked stage
    if (currentState.stage < 3) {
      loadStage(currentState.stage + 1);
    } else {
      // We finished Stage 3. Verify if all 3 stages are cleared
      const allCleared = currentState.stagesCleared[1] && currentState.stagesCleared[2] && currentState.stagesCleared[3];
      if (allCleared) {
        setTimeout(() => {
          clearModal.classList.add('active');
        }, 300);
      } else {
        alert("모든 스테이지(1, 2, 3)를 정상적으로 성공 클리어해야 최종 성공이 인정됩니다!");
      }
    }
  });

  retryBtn.addEventListener('click', () => {
    failModal.classList.remove('active');
  });

  restartBtn.addEventListener('click', () => {
    clearModal.classList.remove('active');
    
    // Reset all clearance status
    currentState.stagesCleared = { 1: false, 2: false, 3: false };
    
    // Lock Stage 2 and 3 navigation buttons again
    [2, 3].forEach(num => {
      const btnEl = document.getElementById(`stage${num}-btn`);
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.classList.add('locked');
        btnEl.innerHTML = `Stage ${num}: ${num === 2 ? 'P형 반도체' : '정밀 제어'} <span class="lock-icon">🔒</span>`;
      }
    });

    loadStage(1);
  });

  // Stage Top Buttons (Allow jumping between stages manually)
  stageBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetStage = parseInt(e.target.getAttribute('data-stage'));
      loadStage(targetStage);
    });
  });

  // Handle Window resize
  window.addEventListener('resize', resizeCanvas);
}

// --- Init App ---
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  setupEventListeners();
  loadStage(1);
  draw();
});
