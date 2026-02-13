if (localStorage.length === 0){ 
    var gameStats = {
        novaCoinsBalance: 0,
        dollarsBalance: 0,
        coinsPerClick: 1,
        autoMiners: 0,
        totalMined: 0
    };

    var upgrades = [
    {
        id: "clickBoost",
        name: "Click Boost",
        cost: 50,
        level: 0,
        apply: (state) => state.coinsPerClick += 1
    },
    {
        id: "autoMiner",
        name: "Auto Miner",
        cost: 100,
        level: 0,
        apply: (state) => state.autoMiners += 1
    }
    ];
} else {
    var gameStats = JSON.parse(localStorage.getItem("novaCoinSave"));
    var gameStats = JSON.parse(localStorage.getItem("upgradeSave"));
}

const balanceEl = document.getElementById("coinBalance");
const perClickEl = document.getElementById("coinsPerClick");
const minersEl = document.getElementById("autoMiners");
const totalEl = document.getElementById("totalMined");
const coinButton = document.getElementById("coinButton");
const upgradeButton1 = document.getElementById("upgradeButton1");
const upgradeButton2 = document.getElementById("upgradeButton2");

coinButton.addEventListener("click", mineCoins);
upgradeButton1.addEventListener("click", () => handleUpgrade(upgradeButton1.value));
upgradeButton2.addEventListener("click", () => handleUpgrade(upgradeButton2.value));

function render() {
    balanceEl.textContent = gameStats.novaCoinsBalance + " NC";
    perClickEl.textContent = gameStats.coinsPerClick;
    minersEl.textContent = gameStats.autoMiners;
    totalEl.textContent = gameStats.totalMined;
    upgradeButton1.textContent = upgrades[0].cost + " NC";
    upgradeButton2.textContent = upgrades[1].cost + " NC";
}

function handleUpgrade(index) {
    if (gameStats.novaCoinsBalance >= upgrades[index].cost) {
        gameStats.novaCoinsBalance -= upgrades[index].cost;

        let newCost = upgrades[index].cost = Math.floor(upgrades[index].cost * 1.32);
        upgrades[index].level += 1;
        upgrades[index].apply(gameStats);

        const upgradeButton = document.querySelector(`[value="${index}"]`);
        upgradeButton.textContent = `${newCost} NC`
        render()
    }
}

function mineCoins() {
    gameStats.novaCoinsBalance += gameStats.coinsPerClick;
    gameStats.totalMined += gameStats.coinsPerClick;
    render();
}

function saveGame() {
    localStorage.setItem("novaCoinSave", JSON.stringify(gameStats));
    localStorage.setItem("upgradeSave", JSON.stringify(upgrades)); 
}

render();
setInterval(saveGame, 5000);