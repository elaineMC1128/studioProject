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

// create a layer
const layer = new Konva.Layer();
stage.add(layer);

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

layer.draw();

