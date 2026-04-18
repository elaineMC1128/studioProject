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
    y: 50,
    width: 900,
    height: 460
};

grid.cellW = grid.width / grid.cols;
grid.cellH = grid.height / grid.rows;

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

// --------------------
// 背景
// --------------------


// --------------------
// 左侧控制区占位
// --------------------
const controlPanel = new Konva.Group({
    x: 40,
    y: 100
});

const fanPlaceholder = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 58,
    fill: "#d8f3f6",
    stroke: "#111",
    strokeWidth: 4
});

const fanInner = new Konva.Circle({
    x: 80,
    y: 80,
    radius: 18,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 3
});

const fanStand = new Konva.Rect({
    x: 58,
    y: 136,
    width: 44,
    height: 28,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 4
});

const fanBase = new Konva.Rect({
    x: 34,
    y: 164,
    width: 92,
    height: 14,
    fill: "#73dfe2",
    stroke: "#111",
    strokeWidth: 4
});

controlPanel.add(fanPlaceholder, fanInner, fanStand, fanBase);
uiLayer.add(controlPanel);

// 第二控制器占位
const knobPlaceholder = new Konva.Circle({
    x: 120,
    y: 400,
    radius: 42,
    fill: "#f7f7f7",
    stroke: "#111",
    strokeWidth: 3
});
uiLayer.add(knobPlaceholder);

const sliderTrack = new Konva.Line({
    points: [30, 500, 185, 500],
    stroke: "#d9cfd0",
    strokeWidth: 12,
    lineCap: "round"
});

const sliderThumb = new Konva.Circle({
    x: 65,
    y: 500,
    radius: 12,
    fill: "#f08a8a"
});

const minusText = new Konva.Text({
    x: 2,
    y: 490,
    text: "-",
    fontSize: 28,
    fill: "#111"
});

const plusText = new Konva.Text({
    x: 190,
    y: 490,
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
    y: 530,
    width: stageWidth,
    text: "Drag fish into the pool",
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

// --------------------
// 函数：加入底部鱼模板
// --------------------
function addPaletteFish(fishData) {
    const imageObj = new Image();

    imageObj.onload = function () {
        const fishImage = new Konva.Image({
            x: fishData.x,
            y: fishData.y,
            image: imageObj,
            width: fishData.width,
            height: fishData.height
        });

        noteLayer.add(fishImage);
        noteLayer.draw();
    };

    imageObj.onerror = function () {
        console.error("Failed to load:", fishData.src);
    };

    imageObj.src = fishData.src;
}