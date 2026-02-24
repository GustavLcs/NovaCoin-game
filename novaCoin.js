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
const closeShopBtn = document.getElementById("closeShopBtn")
const overlay = document.getElementById("overlay");

// Audio
const coinAudio = new Audio("SFX/coin-click.mp3");
coinAudio.volume = 0.3;


/* =========================
   SAVE SYSTEM
========================= */

const SAVE_KEY = "novaCoinSave";

const defaultSave = {
    version: 1,

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
            price: 7800,
            requirement: 1000,
            description: "Doubles click income",
            effect: (save) => {
                save.gameStats.clicksMultiplier *= 2;
            }
        },

        goldenMiner: {
            displayName: "Golden Miner",
            price: 11450,
            requirement: 1000,
            description: "Doubles miner income",
            effect: (save) => {
                save.gameStats.autoMinerMultiplier *= 2;
            }
        },

        diamondClicks: {
            displayName: "Diamond Clicks",
            price: 52300,
            requirement: 50000,
            description: "Massively boosts click income",
            effect: (save) => {
                save.gameStats.clicksMultiplier *= 5;
            }
        },

        diamondMiner: {
            displayName: "Diamond Miner",
            price: 63500,
            requirement: 50000,
            description: "Massively boosts miner income",
            effect: (save) => {
                save.gameStats.autoMinerMultiplier *= 5;
            }
        },

        comboClicks: {
            displayName: "Combo Clicks",
            price: 354300,
            requirement: 200000,
            description: "Clicking boosts miners too",
            effect: (save) => {
                save.gameStats.clicksMultiplier *= 3;
                save.gameStats.autoMinerMultiplier *= 2;
            }
        },

        lightningMiner: {
            displayName: "Lightning Miner",
            price: 512700,
            requirement: 300000,
            description: "Super fast mining",
            effect: (save) => {
                save.entities.autoMiner.speed *= 0.5;
            }
        }
    }
}

function deepMerge(target, source) {
    for (const key in source) {

        if (
            typeof source[key] === "object" &&
            source[key] !== null &&
            !Array.isArray(source[key])
        ) {
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
        console.warn("Save corrupted. Resetting.");
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
    saveData = structuredClone(defaultSave);
    saveGame();
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


/* =========================
   RENDER FUNCTIONS
========================= */

function render() {
    balanceEl.textContent = gameStats.novaCoinsBalance + " NC";
    perClickEl.textContent = gameStats.coinsPerClick;
    minersEl.textContent = entities.autoMiner.amount;
    totalMinedEl.textContent = gameStats.totalMined;
    totalClicksEl.textContent = gameStats.totalClicks;

    upgradeButton1.textContent = upgrades.clickBoost.cost + " NC";
    upgradeButton2.textContent = upgrades.autoMiner.cost + " NC";
}

function renderBalance() {
    balanceEl.textContent = gameStats.novaCoinsBalance + " NC";
    totalMinedEl.textContent = gameStats.totalMined;
}

function renderShop() {
    shopItemsListEl.innerHTML = "";

    for (const key in itemsDefinitions) {
        const itemDefinition = itemsDefinitions[key];
        const item = items[key];

        const available = gameStats.totalMined >= itemDefinition.requirement;
        if (!item.bought && available) {
            if (shopItemsListEl.childElementCount < 7)
                createItemCard(itemDefinition);
        }
    }

    if (shopItemsListEl.innerHTML === "") {
        createItemCard(); //default message
    }
}

function createItemCard(itemDefinition) { // Refactor later!
    const itemEl = document.createElement("div");
    const itemTitleEl = document.createElement("h4");
    const itemDescriptionEl = document.createElement("p");
    const purchaseBtn = document.createElement("button");
    let itemTitle, itemDescription, itemPrice;

    let hasItem = itemDefinition !== undefined;
    if (hasItem) {
        itemTitle = itemDefinition.displayName;
        itemDescription = itemDefinition.description;
        itemPrice = itemDefinition.price;
    } else {
        itemTitle = "Oops";
        itemDescription = "You already have the best devices. Keep playing to unlock more upgrades";
    }

    itemTitleEl.textContent = itemTitle;
    itemDescriptionEl.textContent = itemDescription;
    purchaseBtn.textContent = itemPrice + " NC";

    itemEl.classList.add("item-description")
    itemEl.appendChild(itemTitleEl);
    itemEl.appendChild(itemDescriptionEl);
    if (hasItem) itemEl.appendChild(purchaseBtn);
    itemEl.classList.add("shop-item");

    shopItemsListEl.appendChild(itemEl);
}

/* =========================
   GAME LOGIC
========================= */

function playCoinSound() {
    coinAudio.currentTime = 0;
    coinAudio.play();
}

function mineCoins() {
    gameStats.novaCoinsBalance += gameStats.coinsPerClick;
    gameStats.totalMined += gameStats.coinsPerClick;
    gameStats.totalClicks += 1;

    render();
    playCoinSound();
    requestSave();
}

function checkItemsAvailability() {
    for (const key in itemsDefinitions) {
        const definition = GameData.items[key];
        const item = items[key];

        if (!item.available && 
            gameStats.totalMined >= definition.requirement) {
                item.available = true;
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
        gameStats.coinsPerClick += gameStats.clicksMultiplier;

        upgrade.level += 1;
        upgrade.cost = Math.floor(upgrade.cost * 1.32);

        render();
        requestSave();
    }
}

function autoMinerUpgrade() {
    const upgrade = upgrades.autoMiner;

    if (gameStats.novaCoinsBalance >= upgrade.cost) {

        gameStats.novaCoinsBalance -= upgrade.cost;

        entities.autoMiner.amount += 1;
        upgrade.level += 1;
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

    if (intervalID !== null) {
        clearInterval(intervalID);
    }
    if (miner.amount <= 0) return;

    intervalID = setInterval(() => {

        const coinsPerTick = miner.amount;

        gameStats.novaCoinsBalance += coinsPerTick;
        gameStats.totalMined += coinsPerTick;

        renderBalance();
        requestSave();

    }, miner.speed);
}


/* =========================
   UI / EVENTS
========================= */

function closeShop(event) {
    if (event === undefined || event.target === overlay) {
        overlay.classList.remove("active");
    }
}
function toggleStatsTable() {
    statsTable.hidden = !statsTable.hidden;
    statsButton.textContent = statsTable.hidden ? "▲" : "▼";
}

openShopBtn.addEventListener("click", () => {
    overlay.classList.add("active");
    checkItemsAvailability();
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