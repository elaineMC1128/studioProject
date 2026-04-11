// find our elements
const stageContainer = document.getElementById("container");

// define the size of the stage
const stageWidth = 1400;
const stageHeight = 705;

// create a konva stage
const stage = new Konva.Stage({
    container: "container",
    width: stageWidth,
    height: stageHeight
});

// create a layer for bg, pool, and lines
const layer = new Konva.Layer();
// create a layer for fish
const fishLayer = new Konva.Layer();

stage.add(layer);
stage.add(fishLayer);

// set background
const bg = new Konva.Rect({
    x: 0,  // draw from the left bottom corner
    y: 0,
    width: stageWidth,
    height: stageHeight,
    fill: "#E4FFFC"
});
layer.add(bg);

// pool data
const pool = {
    x: 200,
    y: 50,
    width: 1000,
    height: 470,
    cornerRadius: 24
};

// create a pool
const poolRect = new Konva.Rect({
    x: pool.x,
    y: pool.y,
    width: pool.width,
    height: pool.height,
    fill: "#74d5dd",
    cornerRadius: pool.cornerRadius
});
layer.add(poolRect);

// 池塘内层高光
const innerGlow = new Konva.Rect({
    x: pool.x + 12,
    y: pool.y + 12,
    width: pool.width - 24,
    height: pool.height - 24,
    fill: "rgba(255,255,255,0.12)",
    cornerRadius: 18
});
layer.add(innerGlow);

// 网格参数
const cols = 4; // columns number
const rows = 5; // rows numbers
const cellW = pool.width / cols;  // cellwith
const cellH = pool.height / rows;  // cellheight

// 竖线
for (let i = 0; i <= cols; i++) { //loop statement 循环语句
    const x = pool.x + i * cellW;

    const line = new Konva.Line({
        points: [x, pool.y, x, pool.y + pool.height], // draw the line from(x, pool.y) to(x, pool.y+pool.height)
        stroke: "#E4FFFC",
        strokeWidth: 2
    });

    layer.add(line);
}

// 横线
for (let j = 0; j <= rows; j++) {
    const y = pool.y + j * cellH;

    const line = new Konva.Line({
        points: [pool.x, y, pool.x + pool.width, y],
        stroke: "#E4FFFC",
        strokeWidth: 2
    });

    layer.add(line);
}

// --------------------
// bottom area (for fish)
// --------------------
const tray = new Konva.Rect({
    x: 0,
    y: 560,
    width: stageWidth,
    height: 130,
    fill: "#ffd6f6"
});
layer.add(tray);

const trayText = new Konva.Text({
    x: 0,
    y: 570,
    width: stageWidth,
    text: "Drag fish into the pool",
    fontSize: 18,
    fontFamily: "Arial",
    fill: "#555",
    align: "center"
});
layer.add(trayText);

// 让 Konva 把所有东西渲染出来
layer.draw();
// Tips: Konva 是“先添加，再统一绘制”的

// --------------------
// Fish images (use array to manage the images and data)
// --------------------
const fishData = [
    { src: "assets/images/clownfish.png", x: 50, y: 600, width: 100, height: 100 },
    { src: "assets/images/hairtail.png", x: 240, y: 600, width: 100, height: 100 },
    { src: "assets/images/sea urchin.png", x: 455, y: 600, width: 90, height: 90 },
    { src: "assets/images/star fish.png", x: 662.5, y: 615, width: 65, height: 60 },
    { src: "assets/images/puffer.png", x: 850, y: 615, width: 80, height: 70 },
    { src: "assets/images/tropical fish.png", x: 1050, y: 615, width: 70, height: 65 },
    { src: "assets/images/sacabambaspis.png", x: 1255, y: 615, width: 70, height: 70 },
];

// 加载所有鱼 load all fish
fishData.forEach((fish) => {
    addFishImage(fish.src, fish.x, fish.y, fish.width, fish.height);
});

// --------------------
// 函数：添加鱼图片
// --------------------
function addFishImage(src, x, y, width, height) {
    const imageObj = new Image(); // Create a native browser image object

    // Wait until the image has finished loading before creating the Konva image
    imageObj.onload = function () {
        const fishImage = new Konva.Image({
            x: x,
            y: y,
            image: imageObj,
            width: width,
            height: height,
            draggable: true
        });

        // 拖拽开始时把鱼移到最上层
        fishImage.on("dragstart", function () {
            fishImage.moveToTop();
            fishLayer.draw();
        });

        fishLayer.add(fishImage);
        fishLayer.draw();
    };

    imageObj.src = src;
}

