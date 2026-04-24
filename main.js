const introOverlay = document.getElementById("intro-overlay");
const enterButton = document.getElementById("enter-button");

/*
These layout values define the overall structure of the stage.
I kept them grouped at the top so the visual proportions of the project can be adjusted more easily while developing.
*/
const layout = {
    marginTop: 70,
    marginBottom: 20,
    paletteHeight: 120,
    sideWidth: 260, // left control area
    gap: 20
};


const stageWidth = 1400;
const stageHeight = 697;

// create a stage
const stage = new Konva.Stage({
    container: "container",
    width: stageWidth,
    height: stageHeight
});

// Create Layers
// Draw a static pond grid and scan highlight rectangles
const bgLayer = new Konva.Layer();
// Handle the left control area
const uiLayer = new Konva.Layer();
// Managing “marine life” that has been dragged and placed
const noteLayer = new Konva.Layer();

stage.add(bgLayer);
stage.add(uiLayer);
stage.add(noteLayer);

/*
The grid is the core sequencing space of the project.
Instead of using a conventional DAW timeline, I translate sequencing into a pool made of cells, so placement becomes a spatial decision. This supports the project's mapping idea: where the fish is placed changes how and when it sounds.
*/

// Defining a 7x5 grid
const grid = {
    cols: 7,
    rows: 5,
    x: 380,
    y: 40,
    width: 900,
    height: 460
};

grid.cellW = grid.width / grid.cols;
grid.cellH = grid.height / grid.rows;

// store the moving playback state of the sequencer
// I use an accumulatedTime logic to allow smooth speed transitions via the fan controller.
const scanState = {
    currentCol: 0,
    speed: 0.8,          // initial speed
    isPlaying: false,    // play/pause state
    accumulatedTime: 0,  // accumulates delta time from the animation loop
    stepInterval: 600    // base timing interval in milliseconds
};

// fish data
const paletteFish = [
    {
        type: "clownfish",
        src: "assets/images/clownfish.png",
        x: 90,
        y: 593,
        width: 95,
        height: 90
    },
    {
        type: "hairtail",
        src: "assets/images/hairtail.png",
        x: 275,
        y: 593,
        width: 95,
        height: 95
    },
    {
        type: "seaUrchin",
        src: "assets/images/sea urchin.png",
        x: 460,
        y: 593,
        width: 90,
        height: 90
    },
    {
        type: "starfish",
        src: "assets/images/star fish.png",
        x: 660,
        y: 610,
        width: 65,
        height: 60
    },
    {
        type: "puffer",
        src: "assets/images/puffer.png",
        x: 855,
        y: 610,
        width: 70,
        height: 60
    },
    {
        type: "tropicalFish",
        src: "assets/images/tropical fish.png",
        x: 1050,
        y: 610,
        width: 65,
        height: 60
    },
    {
        type: "sacabambaspis",
        src: "assets/images/sacabambaspis.png",
        x: 1240,
        y: 610,
        width: 65,
        height: 65
    }
];

// create synth
// each fish is assigned its own synth character rather than sharing one generic sound
const synths = {
    clownfish: new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0.2, release: 0.15 }
    }).toDestination(),

    hairtail: new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.3, release: 0.25 }
    }).toDestination(),

    seaUrchin: new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.05, release: 0.05 }
    }).toDestination(),

    starfish: new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.4 }
    }).toDestination(),

    puffer: new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.09, sustain: 0.15, release: 0.2 }
    }).toDestination(),

    tropicalFish: new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.003, decay: 0.06, sustain: 0.1, release: 0.1 }
    }).toDestination(),

    sacabambaspis: new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.15, release: 0.2 }
    }).toDestination()
};

// Define row notes -> pitch
const rowNotes = ["C5", "G4", "E4", "D4", "C4", "A3", "G3", "E3"];

/*
placedNotes is the memory of the composition.
It stores which fish have been placed, where they are, and which stage object they belong to.
It makes the arrangement becomes a repeatable sequence.
*/
const placedNotes = [];

const previewCooldowns = {};

let audioReady = false;

let noteIdCounter = 0;


// --------------------
// left control area
// --------------------

/*
I used the fan as the main playback control because I wanted to use the wind to affect the speed of the "waves",
so I chose the fan as a representative of the wind force,
and the rotation of the fan blades can also visually connect with the speed of the waves,
making the rhythm and movement feel more specific, interesting and intuitive.
*/
const controlPanel = new Konva.Group({
    x: 90,
    y: 150
});

// fan outer
const fanOuter = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 48,
    fill: "#d8f3f6",
    stroke: "#111",
    strokeWidth: 4
});

// fan ring
const fanRing = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 34,
    stroke: "#111",
    strokeWidth: 3
});

// fan blade group
const fanBladeGroup = new Konva.Group({
    x: 80,
    y: 80,
    rotation: 0
});

// draw the three blades
for (let i = 0; i < 3; i++) {
    const blade = new Konva.Ellipse({
        x: 0,
        y: 0,
        radiusX: 10,
        radiusY: 22,
        offsetY: 18,
        fill: "#f8f8f8",
        stroke: "#111",
        strokeWidth: 3,
        rotation: i * 120
    });

    fanBladeGroup.add(blade);
}

// fan center
const fanCenter = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 11,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 3
});

// fan stand
const fanStand = new Konva.Rect({
    x: 62,
    y: 126,
    width: 36,
    height: 26,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 4
});

// fan base
const fanBase = new Konva.Rect({
    x: 36,
    y: 152,
    width: 88,
    height: 12,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 4
});

// play/pause icon
const fanToggleText = new Konva.Text({
    x: 74,
    y: 73,
    text: "▶",
    fontSize: 18,
    fontStyle: "bold",
    fill: "#111",
    listening: false
});

controlPanel.add(
    fanOuter,
    fanRing,
    fanBladeGroup,
    fanCenter,
    fanStand,
    fanBase,
    fanToggleText
);

uiLayer.add(controlPanel);

fanOuter.on("click tap", togglePlay);
fanRing.on("click tap", togglePlay);
fanCenter.on("click tap", togglePlay);
fanBladeGroup.on("click tap", togglePlay);
fanToggleText.on("click tap", togglePlay);

// create restart button
const restartButton = new Konva.Rect({
    x: 60,
    y: 450,
    width: 80,
    height: 34,
    cornerRadius: 10,
    fill: "#f48c8c"
});

const restartText = new Konva.Text({
    x: 65,
    y: 461,
    width: 70,
    text: "Restart",
    align: "center",
    fontSize: 14,
    fill: "#111"
});

// create clean button
const cleanButton = new Konva.Rect({
    x: 200,
    y: 450,
    width: 80,
    height: 34,
    cornerRadius: 10,
    fill: "#6de29f"
});

const cleanText = new Konva.Text({
    x: 208,
    y: 460,
    width: 64,
    text: "Clean",
    align: "center",
    fontSize: 14,
    fill: "#111"
});

uiLayer.add(restartButton, restartText, cleanButton, cleanText);


restartButton.on("click tap", restartSequencer);
restartText.on("click tap", restartSequencer);

cleanButton.on("click tap", cleanSequencer);
cleanText.on("click tap", cleanSequencer);

// create the slider
const sliderTrack = new Konva.Line({
    points: [95, 380, 250, 380],
    stroke: "#d9cfd0",
    strokeWidth: 12,
    lineCap: "round"
});

const sliderThumb = new Konva.Circle({
    x: 95,
    y: 380,
    radius: 12,
    fill: "#f08a8a",
    draggable: true,
    dragBoundFunc: function (pos) {
        const minX = 95;
        const maxX = 250;
        return {
            x: Math.max(minX, Math.min(maxX, pos.x)),
            y: 380
        };
    }
});

sliderThumb.on("drag move", function () {
    updateSpeedFromSlider();
});

const minusText = new Konva.Text({
    x: 60,
    y: 366,
    text: "-",
    fontSize: 28,
    fill: "#111"
});

const plusText = new Konva.Text({
    x: 270,
    y: 368,
    text: "+",
    fontSize: 28,
    fill: "#111"
});

uiLayer.add(sliderTrack, sliderThumb, minusText, plusText);

// --------------------
// Pool
// --------------------

const poolBorder = new Konva.Rect({
    x: grid.x - 10,
    y: grid.y - 10,
    width: grid.width + 20,
    height: grid.height + 20,
    cornerRadius: 18,
    fill: "#f3f3f0"
});
bgLayer.add(poolBorder);

const poolRect = new Konva.Rect({
    x: grid.x,
    y: grid.y,
    width: grid.width,
    height: grid.height,
    cornerRadius: 14,
    fill: "#acd7e0"
});
bgLayer.add(poolRect);


// --------------------
// Grid
// --------------------

// use loop to draw vertical lines
for (let i = 0; i <= grid.cols; i++) {
    const x = grid.x + i * grid.cellW;

    const line = new Konva.Line({
        points: [x, grid.y, x, grid.y + grid.height],
        stroke: "rgba(255,255,255,0.72)",
        strokeWidth: 2
    });

    bgLayer.add(line);
}

// draw horizontal lines
for (let j = 0; j <= grid.rows; j++) {
    const y = grid.y + j * grid.cellH;

    const line = new Konva.Line({
        points: [grid.x, y, grid.x + grid.width, y],
        stroke: "rgba(255,255,255,0.72)",
        strokeWidth: 2
    });

    bgLayer.add(line);
}

// Create a highlighted rectangle for the scan column
const scanHighlight = new Konva.Rect({
    x: grid.x, // highlight at the leftmost column initially
    y: grid.y,
    width: grid.cellW,
    height: grid.height,
    fill: "rgba(255,255,255,0.18)", // use semi-transparent white for the highlights; it looks a bit like ripples on water
    listening: false, // for visual purposes only; it does not require mouse interaction
    visible: false
});

bgLayer.add(scanHighlight);
scanHighlight.moveToTop();

// --------------------
// palette area (for storing the fish)
// --------------------
const paletteArea = new Konva.Rect({
    x: 0,
    y: 560,
    width: stageWidth,
    height: 137,
    fill: "#ead8a6"
});
bgLayer.add(paletteArea);

const paletteLabel = new Konva.Text({
    x: 0,
    y: 570,
    width: stageWidth,
    text: "Drag fish into the pool",
    fontFamily: "Gill Sans",
    align: "center",
    fontSize: 20,
    fill: "#4a4a4a"
});
bgLayer.add(paletteLabel);

// --------------------
// put palette fish into palette
// --------------------
paletteFish.forEach((fish) => {
    addPaletteFish(fish);
});

bgLayer.draw();
uiLayer.draw();
noteLayer.draw();

enterButton.addEventListener("click", async function () {
    await Tone.start();
    audioReady = true;

    introOverlay.style.display = "none";
    appShell.classList.add("active");
});


// function: creates the fish shown in the palette and gives them their first layer of interaction
function addPaletteFish(fishData) {
    const imageObj = new Image();

    imageObj.onload = function () {
        const templateFish = new Konva.Image({
            x: fishData.x,
            y: fishData.y,
            image: imageObj,
            width: fishData.width,
            height: fishData.height
        });

        templateFish.fishType = fishData.type;
        templateFish.fishSrc = fishData.src;
        templateFish.fishWidth = fishData.width;
        templateFish.fishHeight = fishData.height;

        // Hover: Open hand + slight zoom
        templateFish.on("mouseenter", function () {
            stage.container().style.cursor = "grab";
            enlargeFish(templateFish);
            playFishPreview(templateFish.fishType);
        });

        // Mouse out: Restore default + Restore size
        templateFish.on("mouseleave", function () {
            stage.container().style.cursor = "default";
            resetFishScale(templateFish);
        });

        // Press and drag to copy
        templateFish.on("mousedown touchstart", function () {
            stage.container().style.cursor = "grabbing";
            createDraggableFishFromTemplate(templateFish);
        });

        noteLayer.add(templateFish);
        noteLayer.draw();
    };

    imageObj.onerror = function () {
        console.error("Failed to load:", fishData.src);
    };

    imageObj.src = fishData.src;
}

// Instead of dragging the original palette fish away, the system creates a clone.
// I chose this because the bottom tray should stay available as a reusable set of musical materials.
// The clone then becomes the active object the user composes with, which keeps the interaction clear and repeatable.
function createDraggableFishFromTemplate(templateFish) {
    const clone = new Konva.Image({
        x: templateFish.x(),
        y: templateFish.y(),
        image: templateFish.image(),
        width: templateFish.width(),
        height: templateFish.height(),
        draggable: true
    });

    clone.fishType = templateFish.fishType;
    clone.noteId = noteIdCounter++;
    clone.isPlaced = false;

    // Hover: Open hand + slight zoom
    clone.on("mouseenter", function () {
        if (!clone.isDragging()) {
            stage.container().style.cursor = "grab";
            enlargeFish(clone);
        }
    });

    // Mouse out: Restore default + Restore size
    clone.on("mouseleave", function () {
        if (!clone.isDragging()) {
            stage.container().style.cursor = "default";
            resetFishScale(clone);
        }
    });

    // Start dragging: grab the hand + keep zoomed in
    clone.on("dragstart", function () {
        stage.container().style.cursor = "grabbing";
        enlargeFish(clone);
    });

    // End drag: if the mouse is still over the fish, return to grab; otherwise, default
    clone.on("dragend", function () {
        handleDroppedFish(clone);

        // If the fish is still there, keep the hover state
        if (clone.getStage()) {
            stage.container().style.cursor = "grab";
            enlargeFish(clone);
        }
    });

    noteLayer.add(clone);
    clone.moveToTop();
    noteLayer.draw();

    clone.startDrag();
    stage.container().style.cursor = "grabbing";
    enlargeFish(clone);
}

// Function: preview demo
// Hover preview lets users hear a short example of a fish before placing it.
// I added this because the fish carry musical identity, and I wanted users to get an immediate audio clue about difference and character. The cooldown prevents the preview from becoming chaotic when users move the cursor quickly.
function playFishPreview(fishType) {
    if (!audioReady) return;

    // Prevent repeated, excessive triggering when the cursor is continuously hovered over an element
    if (previewCooldowns[fishType]) return;

    const synth = synths[fishType];
    if (!synth) return;

    // 给每种鱼一个固定 demo 音高
    const previewNotes = {
        clownfish: "C5",
        hairtail: "G3",
        seaUrchin: "E4",
        starfish: "A4",
        puffer: "D4",
        tropicalFish: "G4",
        sacabambaspis: "C4"
    };

    const pitch = previewNotes[fishType] || "C4";
    synth.triggerAttackRelease(pitch, "8n");

    previewCooldowns[fishType] = true;

    setTimeout(() => {
        previewCooldowns[fishType] = false;
    }, 250);
}

//  Determine whether a point lies within the pool grid
function isInsideGrid(x, y) {
    return (
        x >= grid.x &&
        x <= grid.x + grid.width &&
        y >= grid.y &&
        y <= grid.y + grid.height
    );
}

// Convert the drag position to:
// the latest col
// the latest row
// The x and y coordinates of the center of this grid
function getSnapPosition(x, y, fishWidth, fishHeight) {
    const col = Math.floor((x - grid.x) / grid.cellW);
    const row = Math.floor((y - grid.y) / grid.cellH);

    const safeCol = Math.max(0, Math.min(grid.cols - 1, col));
    const safeRow = Math.max(0, Math.min(grid.rows - 1, row));

    const snappedX = grid.x + safeCol * grid.cellW + (grid.cellW - fishWidth) / 2;
    const snappedY = grid.y + safeRow * grid.cellH + (grid.cellH - fishHeight) / 2;

    return {
        col: safeCol,
        row: safeRow,
        x: snappedX,
        y: snappedY
    };
}


  // handleDroppedFish decides whether a dragged fish becomes part of the composition or is removed.
  // If the fish is dropped in the pool, it snaps into place and is recorded in placedNotes.
  // If it is dropped outside the pool, it is discarded. I chose this behaviour because it keeps the interaction simple:
  // the pool is the active sequencing area, and everything outside it is temporary or exploratory.
function handleDroppedFish(fish) {
    const centerX = fish.x() + fish.width() / 2;
    const centerY = fish.y() + fish.height() / 2;

    const existingIndex = placedNotes.findIndex(
        (note) => note.id === fish.noteId
    );

    if (isInsideGrid(centerX, centerY)) {
        const snapped = getSnapPosition(centerX, centerY, fish.width(), fish.height());

        fish.position({
            x: snapped.x,
            y: snapped.y
        });

        fish.gridCol = snapped.col;
        fish.gridRow = snapped.row;
        fish.isPlaced = true;

        const noteData = {
            id: fish.noteId,
            fishType: fish.fishType,
            col: snapped.col,
            row: snapped.row,
            node: fish
        };

        if (existingIndex >= 0) {
            placedNotes[existingIndex] = noteData;
        } else {
            placedNotes.push(noteData);
        }

        noteLayer.draw();
        stage.container().style.cursor = "grab";
    } else {
        if (existingIndex >= 0) {
            placedNotes.splice(existingIndex, 1);
        }

        fish.destroy();
        noteLayer.draw();
        stage.container().style.cursor = "default";
    }
}

// enlarge the fish to 1.08x
function enlargeFish(fish) {
    fish.scale({ x: 1.08, y: 1.08 });
    noteLayer.draw();
}

// return the fish to its original size
function resetFishScale(fish) {
    fish.scale({ x: 1, y: 1 });
    noteLayer.draw();
}

/*
The scan functions move the playback wave across the grid and trigger notes column by column.
This is where the arrangement becomes time-based output.
I separated highlight updates, scan movement, and note triggering into different functions so the visual reading system and the audio logic can stay coordinated but still be adjusted independently later.
*/
// Update the function of the scan column position (figure out where the column should be in the pool x, and move the highlighted rectangle over)
function updateScanHighlight() {
    const x = grid.x + scanState.currentCol * grid.cellW;
    scanHighlight.x(x);
    bgLayer.draw();
}

// Shifts the scan highlight and triggers the audio for the new column
function advanceScan() {
    scanState.currentCol = (scanState.currentCol + 1) % grid.cols;
    updateScanHighlight();
    triggerColumnNotes(scanState.currentCol);
}

// This function iterates through all placed fish. If a fish's column matches the scan playhead, its assigned pitch is triggered in Tone.js.
function triggerColumnNotes(colIndex) {
    placedNotes.forEach((note) => {
        if (note.col !== colIndex) return;

        const synth = synths[note.fishType];
        const pitch = rowNotes[note.row];

        if (synth && pitch) {
            synth.triggerAttackRelease(pitch, "8n");
        }
    });
}

// togglePlay starts and pauses the sequencer, while also revealing the scan highlight when playback begins
async function togglePlay() {
    const wasPlaying = scanState.isPlaying;

    if (!audioReady) {
        await Tone.start();
        audioReady = true;
    }

    scanState.isPlaying = !scanState.isPlaying;

    if (scanState.isPlaying) {
        scanHighlight.visible(true);
        updateScanHighlight();

        if (!wasPlaying) {
            triggerColumnNotes(scanState.currentCol);
        }
    }

    fanToggleText.text(scanState.isPlaying ? "⏸" : "▶");
    bgLayer.draw();
    uiLayer.draw();
}

// Restart resets time and playback position without removing the current composition.
// Clean goes further and removes all placed fish, returning the tool to an empty state.
// Keeping these two reset behaviours separate supports different creative rhythms: one for replaying and checking, and one for starting over.
function restartSequencer() {
    scanState.isPlaying = false;
    scanState.currentCol = 0;
    scanState.accumulatedTime = 0;
    fanToggleText.text("▶");

    scanHighlight.visible(false);
    scanHighlight.x(grid.x);

    bgLayer.draw();
    uiLayer.draw();
}

function cleanSequencer() {
    restartSequencer();

    placedNotes.forEach((note) => {
        if (note.node) {
            note.node.destroy();
        }
    });

    placedNotes.length = 0;
    noteLayer.draw();
}

// Helper: Maps slider position to speed (Slow -> Fast)
function updateSpeedFromSlider() {
    const minX = 55;
    const maxX = 175;
    const t = (sliderThumb.x() - minX) / (maxX - minX)
    scanState.speed = 0.4 + t * 1.8;
}

// Global Animation Loop: Handles visual updates and sequencer timing.
const appAnimation = new Konva.Animation(function (frame) {
    if (!frame) return;

    const delta = frame.timeDiff;

    // Accumulate time during playback
    if (scanState.isPlaying) {
        scanState.accumulatedTime += delta;

        const currentInterval = scanState.stepInterval / scanState.speed;

        if (scanState.accumulatedTime >= currentInterval) {
            scanState.accumulatedTime = 0;
            advanceScan();
        }

        // Fan blades rotate
        fanBladeGroup.rotation(fanBladeGroup.rotation() + 6 * scanState.speed);
    }

    uiLayer.batchDraw();
}, stage);

appAnimation.start();