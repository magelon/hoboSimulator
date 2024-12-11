// 游戏状态
const gameState = {
    money: 0,
    hunger: 100,
    cleanliness: 100,
    temperature: 36.5,
    inventory: [],
    maxInventory: 5,
    currentLocation: 'street',
    day: 1,
    period: 'morning',
    actionsRemaining: 2,
    isWeekend: false,
    hasDog: false,
    hasRV: false,
    activeEffects: []
};

// 物品定义
const ITEMS = {
    food: { 
        name: '食物', 
        price: 10, 
        description: '可以恢复20点饥饿度', 
        storable: true,
        use: (state) => {
            state.hunger += 20;
            if(state.hunger > 100) state.hunger = 100;
            return '你吃了一份食物，感觉好多了。';
        }
    },
    water: { 
        name: '水', 
        price: 2, 
        description: '可以恢复10点清洁度', 
        storable: true,
        use: (state) => {
            state.cleanliness += 10;
            if(state.cleanliness > 100) state.cleanliness = 100;
            return '你喝了一些水，感觉清爽了一些。';
        }
    },
    lottery: { 
        name: '彩票', 
        price: 5, 
        description: '也许能中奖���', 
        storable: true,
        use: (state) => {
            const chance = Math.random();
            if (chance < 0.1) {
                const prize = Math.floor(Math.random() * 50) + 10;
                state.money += prize;
                return `恭喜中奖！获得${prize}元！`;
            }
            return '很遗憾，没有中奖。';
        }
    },
    blanket: { 
        name: '毯子', 
        price: 20, 
        description: '可以提高体温', 
        storable: true,
        use: (state) => {
            state.temperature += 0.5;
            addEffect('温暖', 3);
            return '你用毯子裹住身体，感觉暖和了一些。';
        }
    },
    dog: { 
        name: '狗', 
        price: 200, 
        description: '忠实的伙伴，能帮你乞讨', 
        storable: false,
        effect: () => { 
            gameState.hasDog = true; 
            addEffect('狗狗帮助', -1);
        }
    },
    rv: { 
        name: '房车', 
        price: 5000, 
        description: '移动的家，大幅提高生存能力', 
        storable: false,
        effect: () => { 
            gameState.hasRV = true; 
            addEffect('房车庇护', -1);
        }
    }
};

// 游戏初始化和UI更新
function initGame() {
    loadGame(); // 尝试加载存档
    if (!localStorage.getItem('streetLifeGameState')) {
        updateUI();
        addEventLog('游戏开始了...');
    }
}

function updateUI() {
    document.getElementById('money').textContent = gameState.money;
    document.getElementById('hunger').textContent = Math.round(gameState.hunger);
    document.getElementById('cleanliness').textContent = Math.round(gameState.cleanliness);
    document.getElementById('temperature').textContent = gameState.temperature.toFixed(1);
    document.getElementById('current-location').textContent = getLocationName(gameState.currentLocation);
    document.getElementById('day').textContent = gameState.day;
    document.getElementById('period').textContent = gameState.period === 'morning' ? '上午' : '下午';
    document.getElementById('actions').textContent = gameState.actionsRemaining;
    
    updateInventoryUI();
    updateEffectsUI();

    // 更新按钮状态
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.parentElement.className !== 'game-controls') {
            button.disabled = gameState.actionsRemaining <= 0;
        }
    });
}

// 存档系统
function saveGame() {
    localStorage.setItem('streetLifeGameState', JSON.stringify(gameState));
    addEventLog('游戏已保存');
}

function loadGame() {
    const savedState = localStorage.getItem('streetLifeGameState');
    if (savedState) {
        Object.assign(gameState, JSON.parse(savedState));
        updateUI();
        addEventLog('游戏已加载');
    }
}

function resetGame() {
    if (confirm('确定要重新开始游戏吗？当前进度将丢失。')) {
        localStorage.removeItem('streetLifeGameState');
        location.reload();
    }
}

// 自动保存
setInterval(saveGame, 60000); // 每分钟自动保存 
// 背包系统
function updateInventoryUI() {
    const inventoryDiv = document.getElementById('inventory-items');
    inventoryDiv.innerHTML = '';
    
    gameState.inventory.forEach((itemId, index) => {
        const item = ITEMS[itemId];
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.innerHTML = `
            <span>${item.name}</span>
            <button onclick="useItem(${index})">使用</button>
        `;
        inventoryDiv.appendChild(itemElement);
    });
    
    const capacityElement = document.createElement('div');
    capacityElement.className = 'inventory-capacity';
    capacityElement.textContent = `背包容量: ${gameState.inventory.length}/${gameState.maxInventory}`;
    inventoryDiv.appendChild(capacityElement);
}

function addToInventory(itemId) {
    if (gameState.inventory.length >= gameState.maxInventory) {
        addEventLog('背包已满！');
        return false;
    }
    
    const item = ITEMS[itemId];
    if (!item.storable) {
        item.effect();
        return true;
    }
    
    gameState.inventory.push(itemId);
    updateInventoryUI();
    return true;
}

function removeFromInventory(index) {
    gameState.inventory.splice(index, 1);
    updateInventoryUI();
}

function useItem(index) {
    const itemId = gameState.inventory[index];
    const item = ITEMS[itemId];
    
    if (!item) return;
    
    const message = item.use(gameState);
    addEventLog(message);
    removeFromInventory(index);
    updateUI();
}

// 状态效果系统
function updateEffectsUI() {
    const effectsDiv = document.getElementById('active-effects');
    effectsDiv.innerHTML = '';
    
    if (gameState.hasDog) {
        const effectElement = document.createElement('div');
        effectElement.className = 'effect-item';
        effectElement.textContent = '🐕 狗狗帮助: 乞讨成功率提高';
        effectsDiv.appendChild(effectElement);
    }
    
    if (gameState.hasRV) {
        const effectElement = document.createElement('div');
        effectElement.className = 'effect-item';
        effectElement.textContent = '🚐 房车庇护: 降低饥饿和体温损失';
        effectsDiv.appendChild(effectElement);
    }
}

// 行动点数系统
function consumeAction(callback) {
    if (gameState.actionsRemaining <= 0) {
        addEventLog('今天的行动次数已用完！');
        return;
    }

    callback();
    gameState.actionsRemaining--;

    if (gameState.actionsRemaining <= 0) {
        if (gameState.period === 'morning') {
            gameState.period = 'afternoon';
            gameState.actionsRemaining = 3;
            addEventLog('现在是下午时分...');
        } else {
            endDay();
        }
    }
    
    updateUI();
}

// 结束一天
function endDay() {
    gameState.day++;
    gameState.period = 'morning';
    gameState.actionsRemaining = 2;
    gameState.isWeekend = (gameState.day % 7 === 6 || gameState.day % 7 === 0);
    
    // 状态衰减
    let hungerLoss = gameState.hasRV ? 10 : 20;
    let tempLoss = gameState.hasRV ? 0.1 : 0.2;
    
    gameState.hunger -= hungerLoss;
    gameState.cleanliness -= 15;
    gameState.temperature -= tempLoss;
    
    // 限制最小值
    gameState.hunger = Math.max(0, gameState.hunger);
    gameState.cleanliness = Math.max(0, gameState.cleanliness);
    gameState.temperature = Math.max(35, gameState.temperature);
    
    addEventLog(`第${gameState.day}天开始了...`);
    
    // 检查游戏结束条件
    checkGameOver();
    
    // 自动保存
    saveGame();
}

// 游戏结束检查
function checkGameOver() {
    if (gameState.hunger <= 0) {
        gameOver('你饿死了...');
    } else if (gameState.temperature <= 35) {
        gameOver('你冻死了...');
    }
}

function gameOver(reason) {
    alert(`游戏结束: ${reason}\n你存活了${gameState.day}天`);
    resetGame();
}

// 位置系统
function moveToLocation(location) {
    consumeAction(() => {
        gameState.currentLocation = location;
        const locationActions = {
            street: () => addEventLog('你来到了街道上，可以向路人乞讨。'),
            park: () => addEventLog('你来到了公园，这里有免费的水可以使用。'),
            restaurant: () => addEventLog('你来到了餐厅后巷，也许能在垃圾桶里找到食物。'),
            church: () => {
                const message = gameState.isWeekend ? 
                    '教堂正在发放免费食物！' : 
                    '教堂现在没有发放食物，需要等到周末。';
                addEventLog(message);
            },
            store: () => addEventLog('你来到了商店，这里可以购买各种物品。')
        };
        locationActions[location]();
    });
}
// 行动功能
function beg() {
    if (gameState.currentLocation !== 'street') {
        addEventLog('你需要在街道上才能乞讨！');
        return;
    }

    consumeAction(() => {
        const dogBonus = gameState.hasDog ? 0.2 : 0;
        const chance = Math.random();
        if (chance < 0.3 + dogBonus) {
            const amount = Math.floor(Math.random() * 10) + 1;
            const dogBonus = gameState.hasDog ? Math.floor(amount * 0.5) : 0;
            const totalAmount = amount + dogBonus;
            
            gameState.money += totalAmount;
            addEventLog(`一位好心人给了你${totalAmount}元钱。${dogBonus ? `(狗狗帮助多获得${dogBonus}元)` : ''}`);
        } else if (chance < 0.4 + dogBonus) {
            gameState.hunger += 20;
            if (gameState.hunger > 100) gameState.hunger = 100;
            addEventLog('一位路人给了你一个面包。');
        } else {
            addEventLog('路人们都走开了。');
        }
    });
}

function searchTrash() {
    if (gameState.currentLocation !== 'restaurant') {
        addEventLog('你需要在餐厅后巷才能翻垃圾桶！');
        return;
    }

    consumeAction(() => {
        const chance = Math.random();
        if (chance < 0.4) {
            gameState.hunger += 15;
            if (gameState.hunger > 100) gameState.hunger = 100;
            addEventLog('你在垃圾桶里找到了一些剩菜！');
            gameState.cleanliness -= 5;
        } else {
            addEventLog('什么都没找到...');
            gameState.cleanliness -= 3;
        }
    });
}

function useWater() {
    if (gameState.currentLocation !== 'park') {
        addEventLog('你需要在公园才能使用水源！');
        return;
    }

    consumeAction(() => {
        gameState.cleanliness += 30;
        if (gameState.cleanliness > 100) gameState.cleanliness = 100;
        addEventLog('你用公园的水清洗了一下，感觉清爽多了。');
    });
}

function getChurchFood() {
    if (gameState.currentLocation !== 'church') {
        addEventLog('你需要在教堂才能领取食物！');
        return;
    }

    if (!gameState.isWeekend) {
        addEventLog('教堂只在周末发放食物！');
        return;
    }

    consumeAction(() => {
        gameState.hunger += 50;
        if (gameState.hunger > 100) gameState.hunger = 100;
        addEventLog('你领取了教堂发放的食物，感觉饱足多了。');
    });
}

// 商店系统
function openShop() {
    if (gameState.currentLocation !== 'store') {
        addEventLog('你需要在商店才能购物！');
        return;
    }

    const shopModal = document.getElementById('shopModal');
    const shopItems = document.getElementById('shop-items');
    shopItems.innerHTML = '';

    Object.entries(ITEMS).forEach(([id, item]) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        itemDiv.innerHTML = `
            <span>${item.name} - ${item.price}元 (${item.description})</span>
            <button onclick="buyItem('${id}')" ${gameState.money < item.price ? 'disabled' : ''}>购买</button>
        `;
        shopItems.appendChild(itemDiv);
    });

    shopModal.style.display = 'block';
}

function closeShop() {
    document.getElementById('shopModal').style.display = 'none';
}

function buyItem(itemId) {
    const item = ITEMS[itemId];
    if (gameState.money >= item.price) {
        consumeAction(() => {
            if (item.storable && gameState.inventory.length >= gameState.maxInventory) {
                addEventLog('背包已满，无法购买！');
                return;
            }
            
            gameState.money -= item.price;
            
            if (item.storable) {
                addToInventory(itemId);
                addEventLog(`你购买了${item.name}并放入背包`);
            } else {
                item.effect();
                addEventLog(`你购买了${item.name}`);
            }
            
            closeShop();
        });
    }
}

// 工具函数
function addEventLog(message) {
    const eventLog = document.getElementById('event-log');
    const event = document.createElement('p');
    event.textContent = `[${gameState.period}] ${message}`;
    eventLog.prepend(event);
    
    while (eventLog.children.length > 50) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

function getLocationName(location) {
    const locations = {
        street: '街道',
        park: '公园',
        restaurant: '餐厅',
        church: '教堂',
        store: '商店'
    };
    return locations[location];
}

// 移动端支持
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

document.addEventListener('touchend', function(e) {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
            // 向左滑动逻辑
        } else {
            // 向右滑动逻辑
        }
    }
}, false);

// 初始化游戏
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(error => console.log('ServiceWorker registration failed:', error));
}

initGame();