const stageEl = document.getElementById("sequencerStage");

let stage;
let bgLayer;
let uiLayer;
let noteLayer;

let grid = null;

const scanState = {
    currentCol: 0,
    speed: 1,
    isPlaying: false
};

const placedNotes = [];

const paletteFish = [
    {
        type: "clownfish",
        src: "assets/images/clownfish.png",
        x: 120,
        y: 815,
        width: 95,
        height: 60
    },
    {
        type: "hairtail",
        src: "assets/images/hairtail.png",
        x: 290,
        y: 820,
        width: 105,
        height: 36
    },
    {
        type: "seaUrchin",
        src: "assets/images/sea urchin.png",
        x: 470,
        y: 812,
        width: 62,
        height: 62
    },
    {
        type: "starfish",
        src: "assets/images/starfish.png",
        x: 650,
        y: 810,
        width: 82,
        height: 82
    },
    {
        type: "puffer",
        src: "assets/images/puffer.png",
        x: 850,
        y: 816,
        width: 78,
        height: 56
    },
    {
        type: "tropicalFish",
        src: "assets/images/tropical fish.png",
        x: 1050,
        y: 818,
        width: 82,
        height: 58
    },
    {
        type: "sacabambaspis",
        src: "assets/images/sacabambaspis.png",
        x: 1250,
        y: 817,
        width: 88,
        height: 56
    }
];

function initStage() {
    const width = stageEl.clientWidth;
    const height = stageEl.clientHeight;

    stage = new Konva.Stage({
        container: "sequencerStage",
        width: width,
        height: height
    });

    bgLayer = new Konva.Layer();
    uiLayer = new Konva.Layer();
    noteLayer = new Konva.Layer();

    stage.add(bgLayer);
    stage.add(uiLayer);
    stage.add(noteLayer);

    drawScene();
}

function calculateGrid() {
    const W = stage.width();
    const H = stage.height();

    // 让 pool 在容器内自适应，并留一点边距
    const marginX = W * 0.1;
    const marginY = H * 0.06;

    const poolX = marginX;
    const poolY = marginY;
    const poolW = W - marginX * 2;
    const poolH = H - marginY * 2;

    return {
        cols: 7,
        rows: 4,
        x: poolX,
        y: poolY,
        width: poolW,
        height: poolH,
        cellW: poolW / 7,
        cellH: poolH / 4
    };
}

function drawScene() {
    bgLayer.destroyChildren();
    uiLayer.destroyChildren();
    noteLayer.destroyChildren();

    grid = calculateGrid();

    drawPool();
    drawGridLines();
    drawPlacedNotes();

    bgLayer.draw();
    uiLayer.draw();
    noteLayer.draw();
}

function drawPool() {
    const shadow = new Konva.Rect({
        x: grid.x,
        y: grid.y + 10,
        width: grid.width,
        height: grid.height,
        cornerRadius: 18,
        fill: "rgba(0,0,0,0.12)"
    });
    bgLayer.add(shadow);

    const border = new Konva.Rect({
        x: grid.x - 10,
        y: grid.y - 10,
        width: grid.width + 20,
        height: grid.height + 20,
        cornerRadius: 18,
        fill: "#f3f3f0"
    });
    bgLayer.add(border);

    const poolRect = new Konva.Rect({
        x: grid.x,
        y: grid.y,
        width: grid.width,
        height: grid.height,
        cornerRadius: 14,
        fill: "rgba(172,215,224,0.72)"
    });
    bgLayer.add(poolRect);
}

function drawGridLines() {
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
}

function drawPlacedNotes() {
    placedNotes.forEach((note) => {
        const imageObj = new Image();

        imageObj.onload = function () {
            const fishImage = new Konva.Image({
                x: grid.x + note.col * grid.cellW + grid.cellW * 0.15,
                y: grid.y + note.row * grid.cellH + grid.cellH * 0.15,
                image: imageObj,
                width: grid.cellW * 0.7,
                height: grid.cellH * 0.7
            });

            noteLayer.add(fishImage);
            noteLayer.draw();
        };

        imageObj.onerror = function () {
            console.error("Failed to load:", note.src);
        };

        imageObj.src = note.src;
    });
}

function handleResize() {
    if (!stage) return;

    stage.width(stageEl.clientWidth);
    stage.height(stageEl.clientHeight);

    drawScene();
}

function getCellFromPointer(pointerX, pointerY) {
    if (
        pointerX < grid.x ||
        pointerX > grid.x + grid.width ||
        pointerY < grid.y ||
        pointerY > grid.y + grid.height
    ) {
        return null;
    }

    const col = Math.floor((pointerX - grid.x) / grid.cellW);
    const row = Math.floor((pointerY - grid.y) / grid.cellH);

    if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) {
        return null;
    }

    return { row, col };
}

// 可选：点击格子测试放一个占位 fish
function wireStageClickTest() {
    stage.on("click", function () {
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const cell = getCellFromPointer(pos.x, pos.y);
        if (!cell) return;

        const alreadyExists = placedNotes.find(
            (note) => note.row === cell.row && note.col === cell.col
        );

        if (alreadyExists) return;

        placedNotes.push({
            row: cell.row,
            col: cell.col,
            src: "assets/images/clownfish.png",
            type: "clownfish"
        });

        drawScene();
    });
}

requestAnimationFrame(() => {
    initStage();
    wireStageClickTest();

    window.addEventListener("resize", () => {
        requestAnimationFrame(handleResize);
    });
});