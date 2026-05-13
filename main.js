/* ============================================================
   RIPPLE — ripple.js
   Three pitch-zone pool · creature physics · marimba audio
   Konva.js (rendering) + Tone.js (synthesis)
   ============================================================ */
(function () {
    'use strict';

    /* ── Ring config (inner=0, middle=1, outer=2) ──────────── */
    const RING_RADII    = [0, 0, 0];      // computed from pool
    const RING_RATIOS   = [0.34, 0.67, 1];
    const RING_COLORS   = ['#c8eaf8', '#acd8ee', '#90c6e4'];
    const RING_NOTES    = [                // marimba note sets per ring
        ['C5','E5','G5','B5'],               // inner  → high
        ['G4','A4','C5','E5'],               // middle → mid
        ['C4','E4','G4','A4'],               // outer  → low
    ];

    /* ── Marimba synth via Tone.js ──────────────────────────── */
    // Marimba = short attack, fast decay, sine + small harmonics
    let audioStarted = false;
    const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.28 }).toDestination();
    const masterVol = new Tone.Volume(-4).connect(reverb);

    async function startAudio () {
        if (audioStarted) return;
        await Tone.start();
        audioStarted = true;
    }

    function makeMarimba () {
        // Layered: fundamental sine + weak 2nd harmonic + noise click
        const sine = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.55, sustain: 0.0, release: 0.3 },
        });
        const harm = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.1 },
            volume: -12,
        });
        const click = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
            volume: -22,
        });
        sine.connect(masterVol);
        harm.connect(masterVol);
        click.connect(masterVol);
        return { sine, harm, click };
    }

    function playMarimba (note, ringIdx, velocityScale) {
        if (!audioStarted) return;
        const notes = RING_NOTES[ringIdx];
        const chosen = note || notes[Math.floor(Math.random() * notes.length)];
        const vol = -18 + velocityScale * 14; // -18dB quiet → -4dB loud

        const { sine, harm, click } = makeMarimba();
        sine.volume.value = vol;
        harm.volume.value = vol - 12;

        sine.triggerAttackRelease(chosen, '8n');
        // harmony one octave up, quieter
        try {
            const freq2 = Tone.Frequency(chosen).toFrequency() * 2;
            harm.triggerAttackRelease(freq2, '16n');
        } catch (_) {}
        click.triggerAttackRelease('16n');

        setTimeout(() => {
            try { sine.dispose(); harm.dispose(); click.dispose(); } catch (_) {}
        }, 3000);
    }

    /* ── Creature definitions ───────────────────────────────── */
    const CREATURE_DEFS = {
        fish: {
            radius: 20,
            mass: 1.0,
            baseSpeed: 2.0,
            color: '#ff9944',
            stroke: '#dd6600',
            icon: 'assets/clownfish.png',
            label: 'fish',
            rotationOffset: 180,
            behavior: 'swim',       // free wander inside its pitch zone
        },
        seaslug: {
            radius: 20,
            mass: 1.2,
            baseSpeed: 0.5,
            color: '#cc88dd',
            stroke: '#884499',
            icon: 'assets/sea urchin.png',
            label: 'sea urchin',
            rotationOffset: 90,
            behavior: 'drift',      // very slow free drift
        },
        octopus: {
            radius: 20,
            mass: 1.5,
            baseSpeed: 1.2,
            color: '#ee7788',
            stroke: '#aa3344',
            icon: 'assets/octopus.png',
            label: 'octopus',
            rotationOffset: 90,
            behavior: 'pulse',      // stop-and-burst
        },
        rock: {
            radius: 20,
            mass: 999,
            baseSpeed: 0,
            color: '#8899aa',
            stroke: '#556677',
            icon: 'assets/stone.png',
            label: 'rock',
            rotationOffset: 0,
            behavior: 'static',     // immovable
        },
    };

    /* ── State ──────────────────────────────────────────────── */
    let creatures    = [];
    let running      = false;
    let CX = 0, CY  = 0;
    let POOL_R       = 0;       // outer pool radius
    let idCounter    = 0;

    /* ── DOM ────────────────────────────────────────────────── */
    const startBtn    = document.getElementById('startBtn');
    const cleanBtn    = document.getElementById('cleanBtn');
    const innerRadiusInput  = document.getElementById('innerRadius');
    const middleRadiusInput = document.getElementById('middleRadius');
    const instructionsBtn   = document.getElementById('instructionsBtn');
    const instructionsModal = document.getElementById('instructionsModal');
    const instructionsClose = document.getElementById('instructionsClose');
    const dragGhostEl = document.getElementById('dragGhost');
    const konvaEl     = document.getElementById('konvaContainer');

    /* ── Konva ──────────────────────────────────────────────── */
    let stage, bgLayer, fxLayer, creatureLayer;

    function initKonva () {
        const W = konvaEl.clientWidth;
        const H = konvaEl.clientHeight;
        CX = W / 2;
        CY = H / 2;
        POOL_R = Math.min(W, H) * 0.46;
        updateRingRadii();

        stage = new Konva.Stage({ container: 'konvaContainer', width: W, height: H });

        bgLayer = new Konva.Layer();
        stage.add(bgLayer);
        drawPool();

        fxLayer = new Konva.Layer();
        stage.add(fxLayer);

        creatureLayer = new Konva.Layer();
        stage.add(creatureLayer);
    }

    function updateRingRadii () {
        RING_RADII[0] = POOL_R * RING_RATIOS[0];
        RING_RADII[1] = POOL_R * RING_RATIOS[1];
        RING_RADII[2] = POOL_R;
    }

    function applyRingRangeControls () {
        RING_RATIOS[0] = parseInt(innerRadiusInput.value, 10) / 100;
        RING_RATIOS[1] = parseInt(middleRadiusInput.value, 10) / 100;
        updateRingRadii();
        drawPool();
        creatures.forEach(constrainCreatureToHomeRing);
    }

    /* ── Pool drawing ───────────────────────────────────────── */
    function drawPool () {
        bgLayer.destroyChildren();

        // Outer shadow
        bgLayer.add(new Konva.Circle({
            x: CX, y: CY,
            radius: POOL_R + 8,
            fill: 'transparent',
            stroke: 'rgba(60,140,200,0.25)',
            strokeWidth: 16,
            listening: false,
        }));

        // Ring fills (outer to inner so inner paints on top)
        for (let i = 2; i >= 0; i--) {
            bgLayer.add(new Konva.Circle({
                x: CX, y: CY,
                radius: RING_RADII[i],
                fill: RING_COLORS[i],
                listening: false,
            }));
        }

        // Ring border lines
        for (let i = 0; i < 3; i++) {
            bgLayer.add(new Konva.Circle({
                x: CX, y: CY,
                radius: RING_RADII[i],
                fill: 'transparent',
                stroke: 'rgba(255,255,255,0.9)',
                strokeWidth: i === 2 ? 4 : 2.5,
                listening: false,
            }));
        }

        // Outer pool border (blue edge like mockup)
        bgLayer.add(new Konva.Circle({
            x: CX, y: CY,
            radius: POOL_R,
            fill: 'transparent',
            stroke: '#5aace0',
            strokeWidth: 3.5,
            listening: false,
        }));

        // Ring labels
        const ringNames = ['high pitch', 'mid pitch', 'low pitch'];
        const labelR    = [RING_RADII[0] * 0.62, (RING_RADII[0] + RING_RADII[1]) / 2, (RING_RADII[1] + RING_RADII[2]) / 2];
        for (let i = 0; i < 3; i++) {
            bgLayer.add(new Konva.Text({
                x: CX - 40,
                y: CY - labelR[i] - 8,
                width: 80,
                text: ringNames[i],
                fontSize: 13,
                fontFamily: 'Nunito, sans-serif',
                fontStyle: '600',
                fill: 'rgba(80,140,180,0.55)',
                align: 'center',
                listening: false,
            }));
        }

        bgLayer.batchDraw();
    }

    /* ── Determine which ring a position is in ─────────────── */
    function getRingIdx (x, y) {
        const d = Math.hypot(x - CX, y - CY);
        if (d <= RING_RADII[0]) return 0;
        if (d <= RING_RADII[1]) return 1;
        return 2;
    }

    function getRingBounds (ringIdx, radius) {
        return {
            min: ringIdx === 0 ? 0 : RING_RADII[ringIdx - 1] + radius,
            max: RING_RADII[ringIdx] - radius,
        };
    }

    function updateHeadingFromVelocity (c) {
        if (c.def.behavior === 'static') return;
        if (Math.hypot(c.vx, c.vy) < 0.01) return;
        c.heading = Math.atan2(c.vy, c.vx);
    }

    function alignVelocityToHeading (c, speed) {
        c.vx = Math.cos(c.heading) * speed;
        c.vy = Math.sin(c.heading) * speed;
    }

    function getVisualRotation (c) {
        return c.heading * 180 / Math.PI + c.def.rotationOffset;
    }

    function applyCreatureVisualTransform (c) {
        if (c.def.behavior === 'static') return;

        if (c.type === 'fish') {
            const headingDeg = c.heading * 180 / Math.PI;
            const facingRight = Math.cos(c.heading) >= 0;
            c.kGroup.rotation(facingRight ? headingDeg : headingDeg + 180);
            if (c.kIcon) {
                c.kIcon.scaleX(facingRight ? -1 : 1);
                c.kIcon.scaleY(1);
            }
            return;
        }

        c.kGroup.rotation(getVisualRotation(c));
        if (c.kIcon) {
            c.kIcon.scaleX(1);
            c.kIcon.scaleY(1);
        }
    }

    function constrainCreatureToHomeRing (c) {
        if (c.def.behavior === 'static') return;

        const ringIdx = c.homeRing ?? getRingIdx(c.x, c.y);
        const bounds = getRingBounds(ringIdx, c.radius);
        let dx = c.x - CX;
        let dy = c.y - CY;
        let d = Math.hypot(dx, dy);

        if (d < 0.001) {
            const a = Math.random() * Math.PI * 2;
            dx = Math.cos(a);
            dy = Math.sin(a);
            d = 1;
        }

        const nx = dx / d;
        const ny = dy / d;

        if (d > bounds.max) {
            c.x = CX + nx * bounds.max;
            c.y = CY + ny * bounds.max;
            const dot = c.vx * nx + c.vy * ny;
            if (dot > 0) {
                c.vx -= 2 * dot * nx;
                c.vy -= 2 * dot * ny;
                updateHeadingFromVelocity(c);
                playBoundarySound(c, Math.abs(dot));
            }
        } else if (d < bounds.min) {
            c.x = CX + nx * bounds.min;
            c.y = CY + ny * bounds.min;
            const dot = c.vx * nx + c.vy * ny;
            if (dot < 0) {
                c.vx -= 2 * dot * nx;
                c.vy -= 2 * dot * ny;
                updateHeadingFromVelocity(c);
                playBoundarySound(c, Math.abs(dot));
            }
        }
    }

    function playBoundarySound (c, impact) {
        if (impact <= 0.12 || c.cooldown !== 0) return;
        const vel = Math.max(0.18, Math.min(impact / 4, 1));
        const ring = c.homeRing ?? getRingIdx(c.x, c.y);
        playMarimba(null, ring, vel * 0.65);
        spawnRipple(c.x, c.y, c.radius, '#ffffff');
        c.cooldown = 10;
    }

    /* ── Creature factory ───────────────────────────────────── */
    function spawnCreature (type, x, y) {
        const def = CREATURE_DEFS[type];
        const homeRing = getRingIdx(x, y);

        // Random initial velocity (zero for rock)
        const angle = Math.random() * Math.PI * 2;
        const spd   = def.baseSpeed * (0.7 + Math.random() * 0.6);
        const c = {
            id:     idCounter++,
            type,
            x, y,
            vx: def.behavior === 'static' ? 0 : Math.cos(angle) * spd,
            vy: def.behavior === 'static' ? 0 : Math.sin(angle) * spd,
            heading: angle,
            radius: def.radius,
            mass:   def.mass,
            def,
            homeRing,
            // behavior state
            pulseTimer:  0,   // for octopus
            pulsePhase:  'wait',
            cooldown:    0,
            removed:     false,
            // Konva
            kGroup: null,
        };

        buildKonvaCreature(c);
        creatures.push(c);
        return c;
    }

    function buildKonvaCreature (c) {
        const def   = c.def;
        const group = new Konva.Group({ x: c.x, y: c.y, listening: true });

        const iconSize = c.radius * 2.75;
        const iconImage = new Image();
        iconImage.onload = () => {
            if (c.removed) return;
            const icon = new Konva.Image({
                x: 0,
                y: 0,
                offsetX: iconSize / 2,
                offsetY: iconSize / 2,
                width: iconSize,
                height: iconSize,
                image: iconImage,
                listening: false,
            });
            group.add(icon);
            c.kIcon = icon;
            applyCreatureVisualTransform(c);
            creatureLayer.batchDraw();
        };
        iconImage.src = def.icon;

        const imageHitArea = new Konva.Circle({
            radius: c.radius,
            fill: 'transparent',
            listening: true,
        });
        group.add(imageHitArea);

        // Click to remove
        group.on('click tap', () => {
            removeCreature(c);
        });

        creatureLayer.add(group);
        c.kGroup = group;
        c.kBody  = null;
        c.kGlow  = null;
        creatureLayer.batchDraw();
    }

    function removeCreature (c) {
        spawnRipple(c.x, c.y, c.radius * 2, c.def.color);
        c.removed = true;
        c.kGroup.destroy();
        creatures = creatures.filter(x => x.id !== c.id);
        creatureLayer.batchDraw();
    }

    /* ── Physics ────────────────────────────────────────────── */
    const DAMPING = 0.992;

    function physicsStep () {
        for (const c of creatures) {
            if (c.cooldown > 0) c.cooldown--;
            if (c.def.behavior === 'static') continue;

            /* Behavior-specific */
            if (c.type === 'seaslug') {
                // Very slow — keep speed capped low
                const sp = Math.hypot(c.vx, c.vy);
                const maxSp = 1.2;
                if (sp > maxSp) { c.vx *= maxSp / sp; c.vy *= maxSp / sp; }
                if (sp < 0.1) {
                    alignVelocityToHeading(c, c.def.baseSpeed);
                }
            }

            if (c.type === 'octopus') {
                c.pulseTimer--;
                if (c.pulseTimer <= 0) {
                    if (c.pulsePhase === 'wait') {
                        // Burst forward in the current heading.
                        const sp = c.def.baseSpeed * (2.5 + Math.random() * 1.5);
                        alignVelocityToHeading(c, sp);
                        c.pulsePhase = 'burst';
                        c.pulseTimer = 18 + Math.floor(Math.random() * 12); // burst duration
                    } else {
                        // Stop: damp velocity hard
                        c.vx *= 0.15;
                        c.vy *= 0.15;
                        c.pulsePhase = 'wait';
                        c.pulseTimer = 50 + Math.floor(Math.random() * 60); // wait duration
                    }
                }
            }

            if (c.type === 'fish') {
                // Cap speed
                const sp = Math.hypot(c.vx, c.vy);
                const maxSp = c.def.baseSpeed * 3;
                if (sp > maxSp) { c.vx *= maxSp / sp; c.vy *= maxSp / sp; }
                // Min speed
                if (sp < c.def.baseSpeed * 0.4 && sp > 0.001) {
                    c.vx *= (c.def.baseSpeed * 0.4) / sp;
                    c.vy *= (c.def.baseSpeed * 0.4) / sp;
                }
            }

            c.vx *= DAMPING;
            c.vy *= DAMPING;
            c.x  += c.vx;
            c.y  += c.vy;
            constrainCreatureToHomeRing(c);
        }

        /* Creature–creature collisions */
        for (let i = 0; i < creatures.length; i++) {
            for (let j = i + 1; j < creatures.length; j++) {
                const a = creatures[i];
                const b = creatures[j];
                if (a.cooldown > 0 && b.cooldown > 0) continue;

                const dx   = b.x - a.x;
                const dy   = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                const minD = a.radius + b.radius;

                if (dist < minD && dist > 0.01) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const ov = (minD - dist) / 2;

                    /* Separate — rocks don't move */
                    if (a.def.behavior !== 'static') { a.x -= nx * ov; a.y -= ny * ov; }
                    if (b.def.behavior !== 'static') { b.x += nx * ov; b.y += ny * ov; }

                    /* Elastic response */
                    const relVx = a.vx - b.vx;
                    const relVy = a.vy - b.vy;
                    const relDot = relVx * nx + relVy * ny;

                    if (relDot > 0) {
                        const impulse = (2 * relDot) / (a.mass + b.mass);
                        if (a.def.behavior !== 'static') {
                            a.vx -= impulse * b.mass * nx;
                            a.vy -= impulse * b.mass * ny;
                            updateHeadingFromVelocity(a);
                        }
                        if (b.def.behavior !== 'static') {
                            b.vx += impulse * a.mass * nx;
                            b.vy += impulse * a.mass * ny;
                            updateHeadingFromVelocity(b);
                        }

                        /* Sound */
                        const impactSpd = Math.abs(relDot);
                        const canSound = a.cooldown === 0 || b.cooldown === 0;
                        if (canSound) {
                            const vel = Math.max(0.16, Math.min(impactSpd / 5, 1));
                            // Use the ring of whichever moving creature
                            const mover = a.def.behavior !== 'static' ? a : b;
                            const ring  = mover.homeRing ?? getRingIdx(mover.x, mover.y);
                            // Note choice: pick a note from collision pair
                            const notePool = RING_NOTES[ring];
                            const note = notePool[Math.floor(Math.random() * notePool.length)];
                            playMarimba(note, ring, vel);

                            const mx = (a.x + b.x) / 2;
                            const my = (a.y + b.y) / 2;
                            spawnRipple(mx, my, (a.radius + b.radius) * 0.6, '#cce8ff');
                            flashCreature(a);
                            flashCreature(b);

                            a.cooldown = 10;
                            b.cooldown = 10;
                        }
                    }
                }
            }
        }

        for (const c of creatures) {
            constrainCreatureToHomeRing(c);
        }
    }

    /* ── Visual FX ──────────────────────────────────────────── */
    function spawnRipple (x, y, r, color) {
        const c = new Konva.Circle({
            x, y, radius: r,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 2.5,
            opacity: 0.75,
            listening: false,
        });
        fxLayer.add(c);
        c.to({
            radius: r + 40,
            opacity: 0,
            strokeWidth: 0.5,
            duration: 0.65,
            easing: Konva.Easings.EaseOut,
            onFinish: () => c.destroy(),
        });
    }

    function flashCreature (c) {
        const target = c.kIcon || c.kGlow;
        if (!target) return;
        target.to({ opacity: 0.45, duration: 0.05,
            onFinish: () => target.to({ opacity: 1, duration: 0.2 }) });
    }

    /* ── Controls wiring ────────────────────────────────────── */
    innerRadiusInput.addEventListener('input', applyRingRangeControls);
    middleRadiusInput.addEventListener('input', applyRingRangeControls);

    function openInstructions () {
        instructionsBtn.classList.add('pop');
        setTimeout(() => instructionsBtn.classList.remove('pop'), 160);
        instructionsModal.classList.add('visible');
        instructionsModal.setAttribute('aria-hidden', 'false');
    }

    function closeInstructions () {
        instructionsModal.classList.remove('visible');
        instructionsModal.setAttribute('aria-hidden', 'true');
    }

    instructionsBtn.addEventListener('click', openInstructions);
    instructionsClose.addEventListener('click', closeInstructions);
    instructionsModal.addEventListener('click', e => {
        if (e.target === instructionsModal) closeInstructions();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeInstructions();
    });

    /* Start / stop */
    startBtn.addEventListener('click', async () => {
        await startAudio();
        running = !running;
        startBtn.textContent = running ? 'stop' : 'start';
        startBtn.classList.toggle('running', running);
    });

    /* Clean */
    cleanBtn.addEventListener('click', () => {
        [...creatures].forEach(c => {
            c.kGroup.destroy();
        });
        creatures = [];
        creatureLayer.batchDraw();
    });

    /* ── Pointer drag & drop ────────────────────────────────── */
    let dragType = null;
    let activeDragCard = null;

    function showDragGhost (type, x, y) {
        dragGhostEl.replaceChildren();
        const ghostImg = document.createElement('img');
        ghostImg.src = CREATURE_DEFS[type].icon;
        ghostImg.alt = CREATURE_DEFS[type].label;
        dragGhostEl.appendChild(ghostImg);
        dragGhostEl.style.left = x + 'px';
        dragGhostEl.style.top = y + 'px';
        dragGhostEl.className = 'drag-ghost visible';
    }

    function hideDragGhost () {
        dragGhostEl.classList.remove('visible');
        dragGhostEl.replaceChildren();
    }

    function dropCreatureAt (clientX, clientY) {
        if (!dragType) return;

        const rect = konvaEl.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const def = CREATURE_DEFS[dragType];

        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom ||
            Math.hypot(x - CX, y - CY) > POOL_R - def.radius - 2 ||
            creatures.length >= 14
        ) {
            return;
        }

        const c = spawnCreature(dragType, x, y);
        spawnRipple(x, y, def.radius * 1.5, def.color);

        if (dragType === 'octopus') {
            c.pulsePhase = 'wait';
            c.pulseTimer = 40 + Math.floor(Math.random() * 40);
        }
    }

    document.querySelectorAll('.creature-card').forEach(card => {
        card.addEventListener('dragstart', e => e.preventDefault());

        card.addEventListener('pointerdown', e => {
            if (e.button !== undefined && e.button !== 0) return;
            dragType = card.dataset.type;
            activeDragCard = card;
            card.classList.add('dragging');
            card.setPointerCapture(e.pointerId);
            showDragGhost(dragType, e.clientX, e.clientY);
            e.preventDefault();
        });
    });

    document.addEventListener('pointermove', e => {
        if (!dragType) return;
        dragGhostEl.style.left = e.clientX + 'px';
        dragGhostEl.style.top  = e.clientY + 'px';
    });

    document.addEventListener('pointerup', e => {
        if (!dragType) return;
        dropCreatureAt(e.clientX, e.clientY);
        if (activeDragCard) {
            activeDragCard.classList.remove('dragging');
        }
        hideDragGhost();
        activeDragCard = null;
        dragType = null;
    });

    document.addEventListener('pointercancel', () => {
        if (activeDragCard) {
            activeDragCard.classList.remove('dragging');
        }
        hideDragGhost();
        activeDragCard = null;
        dragType = null;
    });

    /* ── Resize ─────────────────────────────────────────────── */
    window.addEventListener('resize', () => {
        requestAnimationFrame(() => {
            if (!stage) return;
            const W = konvaEl.clientWidth;
            const H = konvaEl.clientHeight;
            CX = W / 2; CY = H / 2;
            POOL_R = Math.min(W, H) * 0.46;
            updateRingRadii();
            stage.width(W); stage.height(H);
            drawPool();
            creatures.forEach(constrainCreatureToHomeRing);
        });
    });

    /* ── Main render loop (extended) ────────────────────────── */
    function mainLoop () {
        if (running) physicsStep();

        /* Sync creature positions */
        for (const c of creatures) {
            c.kGroup.x(c.x);
            c.kGroup.y(c.y);
            if (c.def.behavior !== 'static') {
                applyCreatureVisualTransform(c);
            }
        }

        creatureLayer.batchDraw();
        bgLayer.batchDraw();
        fxLayer.batchDraw();

        requestAnimationFrame(mainLoop);
    }

    /* ── Init ───────────────────────────────────────────────── */
    function init () {
        initKonva();
        mainLoop();
    }

    init();

})();
