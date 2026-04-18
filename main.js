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

// Used to store all fish objects
const fishes = [];

// Enter the information for each row
const horizontalLines = [];

const notes = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5"];

//Create a musical instrument that can produce sound
const synth = new Tone.Synth().toDestination();

window.addEventListener("click", async function () {
    await Tone.start();
    synth.triggerAttackRelease("C4", "8n"); // Pitch and Note duration
    console.log("sound played");  //check
}, { once: true });


// set background
const bg = new Konva.Rect({
    x: 0,  // draw from the left bottom corner
    y: 0,
    width: stageWidth,
    height: stageHeight,
    fill: "#f3f5f6"
});
layer.add(bg);

// pool data
const pool = {
    x: 200,
    y: 50,
    width: 1000,
    height: 470,
    cornerRadius: 25
};

// create a pool
const poolRect = new Konva.Rect({
    x: pool.x,
    y: pool.y,
    width: pool.width,
    height: pool.height,
    fill: "#74d5dd",
    cornerRadius: pool.cornerRadius,

    // 阴影（重点）
    shadowColor: "rgba(0,0,0,0.5)",
    shadowBlur: 20,
    shadowOffset: { x: 0, y: 20 },
    shadowOpacity: 0.3
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

// 竖线 column
for (let i = 1; i < cols; i++) { //loop statement 循环语句
    const x = pool.x + i * cellW;

    const line = new Konva.Line({
        points: [x, pool.y+12, x, pool.y + pool.height-12], // draw the line from(x, pool.y) to(x, pool.y+pool.height)
        stroke: "#E4FFFC",
        strokeWidth: 2
    });

    layer.add(line);
}

// 横线 row
for (let j = 1; j < rows; j++) {
    const y = pool.y + j * cellH;

    const line = new Konva.Line({
        points: [pool.x+12, y, pool.x + pool.width-12, y],
        stroke: "#E4FFFC",
        strokeWidth: 2
    });

    layer.add(line);

    // Assign a note
    const note = notes[j % notes.length];

    horizontalLines.push({
        y: y,
        note: note
    });
}
console.log(horizontalLines);

// --------------------
// bottom area (for fish)
// --------------------
const tray = new Konva.Rect({
    x: 0,
    y: 560,
    width: stageWidth,
    height: 130,
    fill: "#bfe1da",

    shadowColor: "rgba(0,0,0,0.18)",
    shadowBlur: 12,
    shadowOffset: { x: 0, y: 6 },
    shadowOpacity: 0.25
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
    {
        src: "assets/images/clownfish.png",
        x: 50,
        y: 600,
        width: 100,
        height: 100,
        speed: 1.5,
        melody: ["C5", "E5", "G5", "E5"]
    },
    {
        src: "assets/images/hairtail.png",
        x: 240,
        y: 600,
        width: 100,
        height: 100,
        speed: 4,
        melody: ["E4", "G4", "A4", "G4"]
    },
    {
        src: "assets/images/sea urchin.png",
        x: 455,
        y: 600,
        width: 90,
        height: 90,
        speed: 0.5,
        melody: ["C3", "C3", "G3", "C3"]
    },
    {
        src: "assets/images/star fish.png",
        x: 662.5,
        y: 615,
        width: 65,
        height: 60,
        speed: 0.1,
        melody: ["A3", "C4", "E4", "C4"]
    },
    {
        src: "assets/images/puffer.png",
        x: 850,
        y: 615,
        width: 80,
        height: 70,
        speed: 1.0,
        melody: ["G4", "A4", "C5", "A4"]
    },
    {
        src: "assets/images/tropical fish.png",
        x: 1050,
        y: 615,
        width: 70,
        height: 65,
        speed: 1.5,
        melody: ["D4", "E4", "G4", "E4"]
    },
    {
        src: "assets/images/sacabambaspis.png",
        x: 1255,
        y: 615,
        width: 70,
        height: 70,
        speed: 1.3,
        melody: ["F4", "A4", "G4", "E4"]
    },
];

// 加载所有鱼 load all fish
fishData.forEach((fish) => {
    addFishImage(fish.src, fish.x, fish.y, fish.width, fish.height, fish.speed, fish.melody);
});

// --------------------
// 函数：添加鱼图片 Function: add fish image
// --------------------
function addFishImage(src, x, y, width, height, speed, melody) {
    // this step follow konva web: Drag and Drop - Drag an image
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

        // Add "original position" to fish
        // 记录原始位置 record original position
        fishImage.originalX = x;
        fishImage.originalY = y;

        // 是否在池塘里 in pool or not
        fishImage.inPool = false;

        // 速度和方向 speed and direction
        fishImage.speed = speed;

        // 记录上一帧中心点 y
        fishImage.prevCenterY = y + height / 2;

        // 简单冷却，避免连续重复触发
        fishImage.currentLineCooldown = 0;

        // 碰撞半径（先把鱼近似成圆）
        fishImage.radius = Math.min(width, height) * 0.35;

        // 这条鱼自己的旋律
        fishImage.melody = melody;
        fishImage.melodyIndex = 0;

        // 初始随机方向 Initial random direction
        const angle = Math.random() * Math.PI * 2;
        // How much to move in the x and y direction per frame
        fishImage.dx = Math.cos(angle) * fishImage.speed;
        fishImage.dy = Math.sin(angle) * fishImage.speed;

        // 拖拽开始时把鱼移到最上层
        fishImage.on("dragstart", function () {
            fishImage.moveToTop();
            fishLayer.draw();
        });

        // Check if the fish has entered the pool when dragging ends
        // Triggered the moment the user releases the mouse button（end dragging）
        fishImage.on("dragend", function () {

            const centerX = fishImage.x() + fishImage.width() / 2;
            const centerY = fishImage.y() + fishImage.height() / 2;

            // Get the fish's location (x,y data)
            // const pos = fishImage.position();

            // Determine whether it is in the pool
            if (isInsidePool(centerX, centerY)) {
                // fish is in the pool
                fishImage.inPool = true;
            } else {
                // fish isn't in the pool -> back to original position (reset x & y)
                fishImage.position({
                    x: fishImage.originalX,
                    y: fishImage.originalY
                });
                // mark not in pool
                fishImage.inPool = false;
            }

            fishLayer.draw();
        });
        fishes.push(fishImage);

        fishLayer.add(fishImage);
        fishLayer.draw();
    };

    // Load image -> Display an error message if loading fails
    // Listen for error events -> If the image fails to load, execute this function
    imageObj.onerror = function () {
        console.error("Failed to load:", src);
    };
    // start to load image (find the img file)
    imageObj.src = src;

    console.log("Loaded:", src);
    console.log("fish melody:", melody);
}

// --------------------
// Function: Check if the fish is in the pond
// --------------------
function isInsidePool(x, y) {
    return (
        // "&&" is "and" -> All four conditions below must be true for the function to return true
        x > pool.x &&
        x < pool.x + pool.width &&
        y > pool.y &&
        y < pool.y + pool.height
    );
}

function checkHorizontalLineCrossing(fish) {
    const currentCenterY = fish.y() + fish.height() / 2;
    const previousCenterY = fish.prevCenterY;

    if (fish.currentLineCooldown > 0) {
        fish.currentLineCooldown--;
    }

    horizontalLines.forEach((line) => {
        const lineY = line.y;

        const crossedDown =
            previousCenterY < lineY && currentCenterY >= lineY;

        const crossedUp =
            previousCenterY > lineY && currentCenterY <= lineY;

        if ((crossedDown || crossedUp) && fish.currentLineCooldown === 0) {
            const note = fish.melody[fish.melodyIndex];
            synth.triggerAttackRelease(note, "8n");

            console.log("fish melody note:", note);

            // melodyIndex 往后移一格
            fish.melodyIndex = (fish.melodyIndex + 1) % fish.melody.length;
            fish.currentLineCooldown = 10;
        }
    });

    fish.prevCenterY = currentCenterY;
}

function getFishCenter(fish) {
    return {
        x: fish.x() + fish.width() / 2,
        y: fish.y() + fish.height() / 2
    };
}

function handleFishCollisions() {
    for (let i = 0; i < fishes.length; i++) {
        for (let j = i + 1; j < fishes.length; j++) {
            const fishA = fishes[i];
            const fishB = fishes[j];

            // 只处理已经在池塘里的鱼
            if (!fishA.inPool || !fishB.inPool) continue;
            if (fishA.isDragging() || fishB.isDragging()) continue;

            const centerA = getFishCenter(fishA);
            const centerB = getFishCenter(fishB);

            const dx = centerB.x - centerA.x;
            const dy = centerB.y - centerA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const minDistance = fishA.radius + fishB.radius;

            // 如果两条鱼碰到了
            if (distance < minDistance && distance > 0) {
                // 1. 交换速度方向（简化反弹）
                const tempDx = fishA.dx;
                const tempDy = fishA.dy;

                fishA.dx = fishB.dx;
                fishA.dy = fishB.dy;

                fishB.dx = tempDx;
                fishB.dy = tempDy;

                // 2. 把它们稍微推开，避免卡在一起
                const overlap = minDistance - distance;
                const pushX = (dx / distance) * (overlap / 2);
                const pushY = (dy / distance) * (overlap / 2);

                fishA.x(fishA.x() - pushX);
                fishA.y(fishA.y() - pushY);

                fishB.x(fishB.x() + pushX);
                fishB.y(fishB.y() + pushY);
            }
        }
    }
}

// --------------------
// Animation Loop: Making the Fish Swim
// --------------------
const animation = new Konva.Animation(function () {
    fishes.forEach((fish) => {
        // in pool -> continue
        if (!fish.inPool) return;
        // user stop dragging -> continue
        if (fish.isDragging()) return;

        fish.x(fish.x() + fish.dx);
        fish.y(fish.y() + fish.dy);

        // boundary collisions
        // 左右边界碰撞
        if (fish.x() <= pool.x) {
            fish.x(pool.x);
            fish.dx *= -1;
        }

        if (fish.x() + fish.width() >= pool.x + pool.width) {
            fish.x(pool.x + pool.width - fish.width());
            fish.dx *= -1;
        }

        // 上下边界碰撞
        if (fish.y() <= pool.y) {
            fish.y(pool.y);
            fish.dy *= -1;
        }

        if (fish.y() + fish.height() >= pool.y + pool.height) {
            fish.y(pool.y + pool.height - fish.height());
            fish.dy *= -1;
        }

        checkHorizontalLineCrossing(fish);
    });

    // 所有鱼移动完后，再处理鱼和鱼之间的碰撞
    handleFishCollisions();
}, fishLayer);

animation.start();

