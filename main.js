// 加布局变量
const layout = {
    marginTop: 70,
    marginBottom: 20,
    paletteHeight: 120,
    sideWidth: 260, // 左侧控制区
    gap: 20
};

const stageWidth = 1400;
const stageHeight = 697;

const stage = new Konva.Stage({
    container: "container",
    width: stageWidth,
    height: stageHeight
});

// 图层
const bgLayer = new Konva.Layer();
const uiLayer = new Konva.Layer();
const noteLayer = new Konva.Layer();

stage.add(bgLayer);
stage.add(uiLayer);
stage.add(noteLayer);

// --------------------
// 数据结构
// --------------------
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

const scanState = {
    currentCol: 0,
    speed: 0.8,          // 初始速度
    isPlaying: false,    // 初始是暂停状态
    accumulatedTime: 0,  // 用来累计时间
    stepInterval: 600    // 基础每列间隔（毫秒）
};


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

// 创建 synth
const synths = {
    // 🎣 明亮主旋律（清晰）
    clownfish: new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0.2, release: 0.15 }
    }).toDestination(),

    // 🌊 柔和低频（铺底）
    hairtail: new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.3, release: 0.25 }
    }).toDestination(),

    // 🟣 短促点击（节奏）
    seaUrchin: new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.05, release: 0.05 }
    }).toDestination(),

    // ⭐ 柔和“水下钟声”
    starfish: new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.4 }
    }).toDestination(),

    // 🐡 圆润 pluck
    puffer: new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.09, sustain: 0.15, release: 0.2 }
    }).toDestination(),

    // 🐠 明亮但稍短（装饰）
    tropicalFish: new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.003, decay: 0.06, sustain: 0.1, release: 0.1 }
    }).toDestination(),

    // 🦴 有点怪但不刺耳（个性）
    sacabambaspis: new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.15, release: 0.2 }
    }).toDestination()
};

// 定义“行号 → 音高”
const rowNotes = ["C5", "G4", "E4", "D4", "C4", "A3", "G3", "E3"];

const placedNotes = [];

const previewCooldowns = {};

let audioReady = false;

let noteIdCounter = 0;



// --------------------
// 背景
// --------------------


// --------------------
// 左侧控制区占位
// --------------------
const controlPanel = new Konva.Group({
    x: 90,
    y: 150
});

// 风扇外圈
const fanOuter = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 48,
    fill: "#d8f3f6",
    stroke: "#111",
    strokeWidth: 4
});

// 风扇内圈
const fanRing = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 34,
    stroke: "#111",
    strokeWidth: 3
});

// 叶片组（后面要旋转）
const fanBladeGroup = new Konva.Group({
    x: 80,
    y: 80,
    rotation: 0
});

// 3 个叶片
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

// 风扇中心
const fanCenter = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 11,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 3
});

// 支架
const fanStand = new Konva.Rect({
    x: 62,
    y: 126,
    width: 36,
    height: 26,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 4
});

const fanBase = new Konva.Rect({
    x: 36,
    y: 152,
    width: 88,
    height: 12,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 4
});

// 播放/暂停图标
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

// 第二控制器占位
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

sliderThumb.on("dragmove", function () {
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
// Pool 主体
// --------------------
const poolShadow = new Konva.Rect({
    x: grid.x,
    y: grid.y + 10,
    width: grid.width,
    height: grid.height,
    cornerRadius: 18,
    fill: "rgba(0,0,0,0.12)",
    blurRadius: 10
});
bgLayer.add(poolShadow);

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
// Grid 线
// --------------------
for (let i = 0; i <= grid.cols; i++) {
    const x = grid.x + i * grid.cellW;

    const line = new Konva.Line({
        points: [x, grid.y, x, grid.y + grid.height],
        stroke: "rgba(255,255,255,0.72)",
        strokeWidth: 2
    });

    bgLayer.add(line);
}

for (let j = 0; j <= grid.rows; j++) {
    const y = grid.y + j * grid.cellH;

    const line = new Konva.Line({
        points: [grid.x, y, grid.x + grid.width, y],
        stroke: "rgba(255,255,255,0.72)",
        strokeWidth: 2
    });

    bgLayer.add(line);
}

// 创建扫描列高亮矩形
const scanHighlight = new Konva.Rect({
    x: grid.x, // 一开始高亮在第 0 列，也就是最左边那一列
    y: grid.y,
    width: grid.cellW, // 宽度就是一列的宽度
    height: grid.height, //高度覆盖整个 pool
    fill: "rgba(255,255,255,0.18)", //用半透明白色做高亮，比较像水波扫过
    listening: false, // 这个矩形只是视觉效果，不需要鼠标交互
    visible: false
});

bgLayer.add(scanHighlight);
scanHighlight.moveToTop();

// --------------------
// 底部浅水/沙地 palette 区
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
// 加载 palette fish
// --------------------
paletteFish.forEach((fish) => {
    addPaletteFish(fish);
});

bgLayer.draw();
uiLayer.draw();
noteLayer.draw();

const introOverlay = document.getElementById("intro-overlay");
const enterButton = document.getElementById("enter-button");
const appShell = document.getElementById("app-shell");

enterButton.addEventListener("click", async function () {
    await Tone.start();
    audioReady = true;

    introOverlay.style.display = "none";
    appShell.classList.add("active");
});

// --------------------
// 函数：加入底部鱼模板
// --------------------
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

        // 鼠标移上去：张开的手 + 轻微放大
        templateFish.on("mouseenter", function () {
            stage.container().style.cursor = "grab";
            enlargeFish(templateFish);
            playFishPreview(templateFish.fishType);
        });

        // 鼠标离开：恢复默认 + 恢复大小
        templateFish.on("mouseleave", function () {
            stage.container().style.cursor = "default";
            resetFishScale(templateFish);
        });

        // 按下开始拖复制：抓住的手
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

    // hover：张开的手 + 放大
    clone.on("mouseenter", function () {
        if (!clone.isDragging()) {
            stage.container().style.cursor = "grab";
            enlargeFish(clone);
        }
    });

    // 离开：恢复默认 + 恢复大小
    clone.on("mouseleave", function () {
        if (!clone.isDragging()) {
            stage.container().style.cursor = "default";
            resetFishScale(clone);
        }
    });

    // 开始拖：抓住的手 + 保持放大
    clone.on("dragstart", function () {
        stage.container().style.cursor = "grabbing";
        enlargeFish(clone);
    });

    // 结束拖：如果鼠标还在鱼上，回到 grab；否则 default
    clone.on("dragend", function () {
        handleDroppedFish(clone);

        // 如果鱼还存在，就保持 hover 状态
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

// 播放 demo 的函数
function playFishPreview(fishType) {
    if (!audioReady) return;

    // 防止一直 hover 时重复疯狂触发
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

// 判断一个点是不是在 pool grid 里面
function isInsideGrid(x, y) {
    return (
        x >= grid.x &&
        x <= grid.x + grid.width &&
        y >= grid.y &&
        y <= grid.y + grid.height
    );
}

// 把拖拽位置换算成：
// 最近的列 col
// 最近的行 row
// 这个格子中心的 x, y
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

// 让鱼放大到 1.08 倍
function enlargeFish(fish) {
    fish.scale({ x: 1.08, y: 1.08 });
    noteLayer.draw();
}

// 让鱼恢复原大小
function resetFishScale(fish) {
    fish.scale({ x: 1, y: 1 });
    noteLayer.draw();
}

// 更新扫描列位置的函数（算出这一列应该在 pool 的哪个 x 位置，然后把高亮矩形移过去）
function updateScanHighlight() {
    const x = grid.x + scanState.currentCol * grid.cellW;
    scanHighlight.x(x);
    bgLayer.draw();
}

// 扫描前进函数
function advanceScan() {
    scanState.currentCol = (scanState.currentCol + 1) % grid.cols;
    updateScanHighlight();
    triggerColumnNotes(scanState.currentCol);
}

//
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

// 先把初始状态画出来，不然可能一开始看不到高亮。
// updateScanHighlight();

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

// set slider speed
function updateSpeedFromSlider() {
    const minX = 55;
    const maxX = 175;
    const t = (sliderThumb.x() - minX) / (maxX - minX);

    // 映射成速度：慢 -> 快
    scanState.speed = 0.4 + t * 1.8;
}

const appAnimation = new Konva.Animation(function (frame) {
    if (!frame) return;

    const delta = frame.timeDiff;

    // 播放时累计时间
    if (scanState.isPlaying) {
        scanState.accumulatedTime += delta;

        const currentInterval = scanState.stepInterval / scanState.speed;

        if (scanState.accumulatedTime >= currentInterval) {
            scanState.accumulatedTime = 0;
            advanceScan();
        }

        // 风扇叶片旋转
        fanBladeGroup.rotation(fanBladeGroup.rotation() + 6 * scanState.speed);
    }

    uiLayer.batchDraw();
}, stage);

appAnimation.start();