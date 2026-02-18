// Get text elements
const balanceEl = document.getElementById("coinBalance");
const perClickEl = document.getElementById("coinsPerClick");
const minersEl = document.getElementById("autoMiners");
const totalMinedEl = document.getElementById("totalMined");
const totalClicksEl = document.getElementById("totalClicks");

// Get button elements
const statsButton = document.getElementById("statsButton");
const statsTable = document.getElementById("statsTable");
const coinButton = document.getElementById("coinButton");
const upgradeButton1 = document.getElementById("upgradeButton1");
const upgradeButton2 = document.getElementById("upgradeButton2");

// Set audio
const coinAudio = new Audio("SFX/coin-click.mp3");
coinAudio.volume = 0.3;

if (localStorage.length === 0){ 
    var gameStats = {
        novaCoinsBalance: 0,
        dollarsBalance: 0,
        coinsPerClick: 1,
        totalMined: 0,
        totalClicks: 0
    };

    var upgrades = [
        {
            id: "clickBoost",
            name: "Click Boost Upgrade",
            cost: 50,
            level: 0
        },
        {
            id: "autoMiner",
            name: "Auto Miner Upgrade",
            cost: 100,
            level: 0
        }
    ];

    var entities = [
        {
            id: "autoMiner",
            amount: 0,
            speed: 1000
        }
    ];

} else {
    var gameStats = JSON.parse(localStorage.getItem("novaCoinSave"));
    var upgrades = JSON.parse(localStorage.getItem("upgradeSave"));
    var entities = JSON.parse(localStorage.getItem("entitiesSave"));
}


function render() {
    balanceEl.textContent = gameStats.novaCoinsBalance + " NC";
    perClickEl.textContent = gameStats.coinsPerClick;
    minersEl.textContent = entities[0].amount; // entities[index] may cause bugs eventually
    totalMinedEl.textContent = gameStats.totalMined;
    totalClicksEl.textContent = gameStats.totalClicks;
    upgradeButton1.textContent = upgrades[0].cost + " NC";
    upgradeButton2.textContent = upgrades[1].cost + " NC";
}

function renderBalance() {
    balanceEl.textContent = gameStats.novaCoinsBalance + " NC";
    totalMinedEl.textContent = gameStats.totalMined;
}

function handleClickUpgrade() {
    const upgrade = upgrades[0];
    if (gameStats.novaCoinsBalance >= upgrade.cost) {
        gameStats.novaCoinsBalance -= upgrade.cost;

        applyUpgradeStats(0);
        upgradeButton1.textContent = `${upgrade.cost} NC`;
        render();
    }
}

function handleEntitiesUpgrade(index) {
    const upgrade = upgrades[index];
    
    if (gameStats.novaCoinsBalance >= upgrade.cost) {
        gameStats.novaCoinsBalance -= upgrade.cost;

        applyUpgradeStats(index);
        upgrade.cost = Math.floor(upgrade.cost * 1.32);
        upgrade.level += 1;

        const upgradeButton = document.querySelector(`[value="${index}"]`);
        upgradeButton.textContent = `${upgrade.cost} NC`;
        render();
    }
}

function applyUpgradeStats(upgradeIndex) {
    let upgrade = upgrades[upgradeIndex];

    switch (upgrade.id) {
        case "clickBoost":
            gameStats.coinsPerClick += 1; // overall stat
            upgrade.level += 1;
            upgrade.cost = Math.floor(upgrade.cost * 1.32);
            return;
            
        case "autoMiner":
            let index = entities.findIndex(entity => entity.id === "autoMiner");
            entities[index].amount += 1;
            autoMine();
            return;
    }
}

function playCoinSound() {
    coinAudio.currentTime = 0;
    coinAudio.play();
}

function mineCoins() {
    gameStats.novaCoinsBalance += gameStats.coinsPerClick;
    gameStats.totalMined += gameStats.coinsPerClick;
    gameStats.totalClicks += 1

    render();
    playCoinSound();
}

function autoMine() { // (change in AutoMiner Upgrades update)
    let upgradesMultiplier = 1; // temporary value 
    let coinMiner = entities[0]; // temporary value
    let frequency = coinMiner.speed;
    let coinsPerFrequency = coinMiner.amount * upgradesMultiplier;

    if (intervalID !== null) clearInterval(intervalID);
    
    intervalID = setInterval(() => {
        gameStats.novaCoinsBalance += coinsPerFrequency;
        gameStats.totalMined += coinsPerFrequency;
        renderBalance();
    }, frequency);
}

function saveGame() {
        localStorage.setItem("novaCoinSave", JSON.stringify(gameStats));
        localStorage.setItem("upgradeSave", JSON.stringify(upgrades));
        localStorage.setItem("entitiesSave", JSON.stringify(entities));
}

function toggleStatsTable() {
    statsTable.hidden = !statsTable.hidden;
    if (statsTable.hidden) {
        statsButton.textContent = "⏶";
    } else {
        statsButton.textContent = "⏷";
    }
}


render();
setInterval(saveGame, 5000);
if (entities[0].amount > 0) {
    var intervalID;
    autoMine();
}

statsButton.addEventListener("click", toggleStatsTable);
coinButton.addEventListener("click", mineCoins);
upgradeButton1.addEventListener("click", () => handleClickUpgrade());
upgradeButton2.addEventListener("click", () => handleEntitiesUpgrade(upgradeButton2.value));