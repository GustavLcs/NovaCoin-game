/* =========================
   DOM ELEMENTS
========================= */

// Text elements
const balanceEl = document.getElementById("coinBalance");
const perClickEl = document.getElementById("coinsPerClick");
const minersEl = document.getElementById("autoMiners");
const totalMinedEl = document.getElementById("totalMined");
const totalClicksEl = document.getElementById("totalClicks");
const shopItemsListEl = document.getElementById("shopItemList");

// Buttons
const statsButton = document.getElementById("statsButton");
const statsTable = document.getElementById("statsTable");
const coinButton = document.getElementById("coinButton");
const upgradeButton1 = document.getElementById("upgradeButton1");
const upgradeButton2 = document.getElementById("upgradeButton2");
const openShopBtn = document.getElementById("openShopBtn");
const closeShopBtn = document.getElementById("closeShopBtn");
const overlay = document.getElementById("overlay");

// Audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let coinBuffer = null;

async function loadCoinSound() { 
    try {
        const response = await fetch("SFX/coin-click.mp3");
        const arrayBuffer = await response.arrayBuffer();
        coinBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
        console.error("Failed to load coin sound:", err);
    }
}

loadCoinSound(); // Load coin sound at startup

// Unlock audio on user interaction
document.addEventListener("click", () => {
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}, { once: true });


/* =========================
   SAVE SYSTEM
========================= */

const SAVE_KEY = "novaCoinSave";

const defaultSave = {
    version: 2,

    gameStats: {
        novaCoinsBalance: 0,
        coinsPerClick: 1,
        totalMined: 0,
        totalClicks: 0,
        clicksMultiplier: 1,
        autoMinerMultiplier: 1
    },

    upgrades: {
        clickBoost: { cost: 50, level: 0 },
        autoMiner: { cost: 100, level: 0 }
    },

    entities: {
        autoMiner: { amount: 0, speed: 1000 }
    },

    items: {
        goldenClicks: { bought: false },
        goldenMiner: { bought: false },
        diamondClicks: { bought: false },
        diamondMiner: { bought: false },
        comboClicks: { bought: false },
        lightningMiner: { bought: false }
    }
};

const GameData = {
    items: {
        goldenClicks: {
            displayName: "Golden Clicks",
            price: 1795,
            requirement: 1000,
            description: "Doubles click income",
            effect: (save) => save.gameStats.clicksMultiplier *= 2
        },
        goldenMiner: {
            displayName: "Golden Miner",
            price: 3450,
            requirement: 1000,
            description: "Doubles miner income",
            effect: (save) => save.gameStats.autoMinerMultiplier *= 2
        },
        diamondClicks: {
            displayName: "Diamond Clicks",
            price: 12300,
            requirement: 20000,
            description: "Massively boosts click income",
            effect: (save) => save.gameStats.clicksMultiplier *= 3
        },
        diamondMiner: {
            displayName: "Diamond Miner",
            price: 23500,
            requirement: 20000,
            description: "Massively boosts miner income",
            effect: (save) => save.gameStats.autoMinerMultiplier *= 3
        },
        comboClicks: {
            displayName: "Combo Clicks",
            price: 100300,
            requirement: 100000,
            description: "Clicking boosts miners too",
            effect: (save) => {
                save.gameStats.clicksMultiplier *= 2;
                save.gameStats.autoMinerMultiplier *= 2;
            }
        },
        lightningMiner: {
            displayName: "Lightning Miner",
            price: 212700,
            requirement: 150000,
            description: "Super fast mining",
            effect: (save) => save.entities.autoMiner.speed *= 0.3
        }
    }
};

function deepMerge(target, source) {
    for (const key in source) {
        if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            if (target[key] === undefined) {
                target[key] = source[key];
            }
        }
    }
    return target;
}

let saveData;

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
        saveData = structuredClone(defaultSave);
        return;
    }

    try {
        const parsed = JSON.parse(raw);
        saveData = deepMerge(parsed, structuredClone(defaultSave));
    } catch {
        saveData = structuredClone(defaultSave);
    }
}

function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

let saveQueued = false;

function requestSave() {
    if (saveQueued) return;
    saveQueued = true;
    setTimeout(() => {
        saveGame();
        saveQueued = false;
    }, 250);
}

function hardReset() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
}


/* =========================
   INITIALIZE SAVE
========================= */

loadGame();

const gameStats = saveData.gameStats;
const upgrades = saveData.upgrades;
const entities = saveData.entities;
const items = saveData.items;
const itemsDefinitions = GameData.items;

recalculateMultipliers();


/* =========================
   RENDER FUNCTIONS
========================= */

function render() {
    balanceEl.textContent = gameStats.novaCoinsBalance + " NC";
    perClickEl.textContent = gameStats.coinsPerClick * gameStats.clicksMultiplier;
    minersEl.textContent = entities.autoMiner.amount;
    totalMinedEl.textContent = gameStats.totalMined;
    totalClicksEl.textContent = gameStats.totalClicks;

    upgradeButton1.textContent = upgrades.clickBoost.cost + " NC";
    upgradeButton2.textContent = upgrades.autoMiner.cost + " NC";

    updateShopButtonsState();
}

function renderBalance() {
    balanceEl.textContent = gameStats.novaCoinsBalance + " NC";
    totalMinedEl.textContent = gameStats.totalMined;
}

function renderShop() {
    shopItemsListEl.innerHTML = "";

    for (const key in itemsDefinitions) {
        const def = itemsDefinitions[key];
        const item = items[key];

        const available = gameStats.totalMined >= def.requirement;

        if (!item.bought && available) {
            createItemCard(def, key);
        }
    }

    if (!shopItemsListEl.children.length) {
        createEmptyShopMessage();
    }

    updateShopButtonsState();
}

function createItemCard(definition, key) {
    const itemEl = document.createElement("div");
    itemEl.className = "item-description shop-item";

    const title = document.createElement("h4");
    title.textContent = definition.displayName;

    const desc = document.createElement("p");
    desc.textContent = definition.description;

    const button = document.createElement("button");
    button.textContent = `${definition.price} NC`;
    button.dataset.itemKey = key;
    button.className = "shop-purchase-btn";

    itemEl.append(title, desc, button);
    shopItemsListEl.appendChild(itemEl);
}

function createEmptyShopMessage() {
    const itemEl = document.createElement("div");
    itemEl.className = "item-description shop-item";

    const title = document.createElement("h4");
    title.textContent = "No upgrades available";

    const desc = document.createElement("p");
    desc.textContent = "Keep playing to unlock more!";

    itemEl.append(title, desc);
    shopItemsListEl.appendChild(itemEl);
}

function updateShopButtonsState() {
    const buttons = shopItemsListEl.querySelectorAll(".shop-purchase-btn");

    buttons.forEach(btn => {
        const key = btn.dataset.itemKey;
        const price = itemsDefinitions[key].price;

        btn.disabled = gameStats.novaCoinsBalance < price;
    });
}


/* =========================
   SHOP EVENT DELEGATION
========================= */

shopItemsListEl.addEventListener("click", (event) => {
    const button = event.target.closest(".shop-purchase-btn");
    if (!button) return;

    const key = button.dataset.itemKey;
    buyShopItem(key);
});

function buyShopItem(key) {
    const def = itemsDefinitions[key];
    const item = items[key];

    if (!def || item.bought) return;
    if (gameStats.novaCoinsBalance < def.price) return;

    gameStats.novaCoinsBalance -= def.price;
    item.bought = true;

    autoMine();
    render();
    renderShop();
    requestSave();
}


/* =========================
   GAME LOGIC
========================= */

function playCoinSound() {
    if (!coinBuffer) return;

    const source = audioContext.createBufferSource();
    source.buffer = coinBuffer;

    // Pitch variation (+- 3%)
    source.playbackRate.value = 1 + (Math.random() * 0.06 - 0.03);

    // Volume variation
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.25 + Math.random() * 0.05;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start();
}

function mineCoins() {
    const amount = gameStats.coinsPerClick * gameStats.clicksMultiplier;

    gameStats.novaCoinsBalance += amount;
    gameStats.totalMined += amount;
    gameStats.totalClicks++;

    render();
    playCoinSound();
    requestSave();
}

function recalculateMultipliers() { // Rebalance purposes
    gameStats.clicksMultiplier = 1;
    gameStats.autoMinerMultiplier = 1;
    entities.autoMiner.speed = 1000;

    for (const key in items) {
        if (items[key].bought) {
            const def = itemsDefinitions[key];
                def.effect(saveData);
        }
    }
}


/* =========================
   UPGRADES
========================= */

function clickUpgrade() {
    const upgrade = upgrades.clickBoost;

    if (gameStats.novaCoinsBalance >= upgrade.cost) {
        gameStats.novaCoinsBalance -= upgrade.cost;
        gameStats.coinsPerClick++;

        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.32);

        render();
        requestSave();
    }
}

function autoMinerUpgrade() {
    const upgrade = upgrades.autoMiner;

    if (gameStats.novaCoinsBalance >= upgrade.cost) {
        gameStats.novaCoinsBalance -= upgrade.cost;

        entities.autoMiner.amount++;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.32);

        autoMine();
        render();
        requestSave();
    }
}


/* =========================
   AUTO MINER SYSTEM
========================= */

let intervalID = null;

function autoMine() {
    const miner = entities.autoMiner;

    if (intervalID !== null) clearInterval(intervalID);
    if (miner.amount <= 0) return;

    intervalID = setInterval(() => {
        const coins = miner.amount * gameStats.autoMinerMultiplier;

        gameStats.novaCoinsBalance += coins;
        gameStats.totalMined += coins;

        renderBalance();
        updateShopButtonsState();
        requestSave();
    }, miner.speed);
}


/* =========================
   UI EVENTS
========================= */

function closeShop(event) {
    if (!event || event.target === overlay) {
        overlay.classList.remove("active");
    }
}

function toggleStatsTable() {
    statsTable.hidden = !statsTable.hidden;
    statsButton.textContent = statsTable.hidden ? "▲" : "▼";
}

openShopBtn.addEventListener("click", () => {
    overlay.classList.add("active");
    renderShop();
});

closeShopBtn.addEventListener("click", () => closeShop());
overlay.addEventListener("click", (event) => closeShop(event));

statsButton.addEventListener("click", toggleStatsTable);
coinButton.addEventListener("click", mineCoins);
upgradeButton1.addEventListener("click", clickUpgrade);
upgradeButton2.addEventListener("click", autoMinerUpgrade);


/* =========================
   STARTUP
========================= */

render();

if (entities.autoMiner.amount > 0) {
    autoMine();
}