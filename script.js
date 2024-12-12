// 游戏状态
const gameState = {
    money: 0,
    hunger: 100,
    cleanliness: 100,
    temperature: 36.5,
    inventory: {
        emptyBottles: 0,
        items: []
    },
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
        description: '可以恢复20点饥饿度（一次性）', 
        storable: true,
        use: (state, item) => {
            state.hunger += 20;
            if(state.hunger > 100) state.hunger = 100;
            return {
                message: '你吃了一份食物，感觉好多了。',
                remove: true  // 标记使用后需要移除
            };
        }
    },
    water: { 
        name: '水', 
        price: 2, 
        description: '可以恢复10点清洁度（一次性）', 
        storable: true,
        use: (state, item) => {
            state.cleanliness += 10;
            if(state.cleanliness > 100) state.cleanliness = 100;
            return {
                message: '你喝了一些水，感觉清爽了一些。',
                remove: true  // 标记使用后需要移除
            };
        }
    },
    lottery: { 
        name: '彩票', 
        price: 5, 
        description: '也许能中奖（一次性）', 
        storable: true,
        use: (state, item) => {
            const chance = Math.random();
            let message;
            if (chance < 0.1) {
                const prize = Math.floor(Math.random() * 50) + 10;
                state.money += prize;
                message = `恭喜中奖！获得${prize}元！`;
            } else {
                message = '很遗憾，没有中奖。';
            }
            return {
                message: message,
                remove: true  // 标记使用后需要移除
            };
        }
    },
    blanket: { 
        name: '毯子', 
        price: 20, 
        description: '可以提高体温（剩余使用次数：10）', 
        storable: true,
        maxUses: 10,
        use: (state, item) => {
            state.temperature += 0.5;
            item.uses = (item.uses || 0) + 1;
            addEffect('温暖', 3);
            
            const remainingUses = item.maxUses - item.uses;
            if (item.uses >= item.maxUses) {
                return {
                    message: '毯子已经破旧不堪，无法继续使用了。',
                    remove: true,
                    updateUI: true
                };
            }
            return {
                message: `你用毯子裹住身体，感觉暖和了一些。（剩余使用次数：${remainingUses}次）`,
                remove: false,
                updateUI: true
            };
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
        price: 2000, 
        description: '移动的家，大幅提高生存能力', 
        storable: false,
        effect: () => { 
            gameState.hasRV = true; 
            addEffect('房车庇护', -1);
        }
    }
};

// 添加位置对应可用行动的映射
const locationActions = {
    street: ['beg', 'searchTrash'],
    park: ['useWater', 'searchTrash'],
    restaurant: ['searchTrash'],
    church: ['getChurchFood', 'searchTrash'],
    store: ['openShop', 'searchTrash']
};

// 游戏初始化和UI更新
function initGame() {
    loadGame(); // 尝试加载存档
    if (!localStorage.getItem('streetLifeGameState')) {
        updateUI();
        addEventLog('游戏开始了...');
    }
    // 设置初始位置背景
    const locationInfo = document.querySelector('.location-info');
    locationInfo.classList.add(`location-${gameState.currentLocation}`);
    
    updateAvailableActions();
    initStatusPanel();
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
    updateAvailableActions();
    
    // 更新按钮状态
    const buttons = document.querySelectorAll('button:not([style*="display: none"])');
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
        const loadedState = JSON.parse(savedState);
        // 确保 inventory 结构完整
        if (!loadedState.inventory || typeof loadedState.inventory !== 'object') {
            loadedState.inventory = {
                emptyBottles: 0,
                items: []
            };
        } else if (!Array.isArray(loadedState.inventory.items)) {
            loadedState.inventory.items = [];
        }
        if (typeof loadedState.inventory.emptyBottles !== 'number') {
            loadedState.inventory.emptyBottles = 0;
        }
        
        Object.assign(gameState, loadedState);
        updateUI();
        addEventLog('游戏已加载');
    }
}

function resetGame() {
    if (confirm('确定要重新开始游戏吗？当前进度将丢失')) {
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
    
    // 显示空瓶数量
    if (gameState.inventory.emptyBottles > 0) {
        const bottleElement = document.createElement('div');
        bottleElement.className = 'inventory-item';
        bottleElement.innerHTML = `
            <span>空瓶 x${gameState.inventory.emptyBottles}</span>
            <button onclick="sellBottles()" ${gameState.currentLocation === 'store' ? '' : 'disabled'}>出售</button>
        `;
        inventoryDiv.appendChild(bottleElement);
    }
    
    // 显示其他物品
    gameState.inventory.items.forEach((item, index) => {
        const itemData = ITEMS[item.id];
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        
        // 如果是毯子，显示剩余使用次数
        let itemName = itemData.name;
        if (item.id === 'blanket') {
            const remainingUses = itemData.maxUses - (item.uses || 0);
            itemName += ` (剩余${remainingUses}次)`;
            // 如果剩余次数较少，添加视觉提醒
            if (remainingUses <= 3) {
                itemElement.classList.add('warning');
            }
        }
        
        itemElement.innerHTML = `
            <span>${itemName}</span>
            <button onclick="useItem(${index})">使用</button>
        `;
        inventoryDiv.appendChild(itemElement);
    });
    
    // 显示背包容量
    const capacityElement = document.createElement('div');
    capacityElement.className = 'inventory-capacity';
    capacityElement.textContent = `背包容量: ${gameState.inventory.items.length}/${gameState.maxInventory}`;
    inventoryDiv.appendChild(capacityElement);
}

function addToInventory(itemId) {
    if (gameState.inventory.items.length >= gameState.maxInventory) {
        addEventLog('背包已满！');
        return false;
    }
    
    const item = ITEMS[itemId];
    if (!item.storable) {
        item.effect();
        return true;
    }
    
    // 为新物品初始化使用次数
    const newItem = {
        id: itemId,
        uses: 0
    };
    
    gameState.inventory.items.push(newItem);
    updateInventoryUI();
    return true;
}

function removeFromInventory(index) {
    gameState.inventory.items.splice(index, 1);
    updateInventoryUI();
}

function useItem(index) {
    const item = gameState.inventory.items[index];
    const itemData = ITEMS[item.id];
    
    if (!itemData) return;
    
    const result = itemData.use(gameState, item);
    addEventLog(result.message);
    
    // 如果物品需要���除（一次性物品或已用尽的毯子）
    if (result.remove) {
        removeFromInventory(index);
    } else if (result.updateUI) {
        // 如果需要更新UI（比如毯子使用次数变化）
        updateInventoryUI();
    }
    
    updateUI();
}

// 状态效果系统
function updateEffectsUI() {
    const effectsDiv = document.getElementById('active-effects');
    effectsDiv.innerHTML = '';
    
    // 添加天数提醒
    const dayEffect = document.createElement('div');
    dayEffect.className = 'effect-item';
    dayEffect.textContent = `第${gameState.day}天 ${gameState.period === 'morning' ? '上午' : '下午'}`;
    effectsDiv.appendChild(dayEffect);
    
    // 添加重要状态提醒
    if (gameState.hunger <= 30) {
        const hungerEffect = document.createElement('div');
        hungerEffect.className = 'effect-item warning';
        hungerEffect.textContent = '⚠️ 饥饿状态危险！';
        effectsDiv.appendChild(hungerEffect);
    }
    
    if (gameState.temperature <= 35.5) {
        const tempEffect = document.createElement('div');
        tempEffect.className = 'effect-item warning';
        tempEffect.textContent = '⚠️ 体温过低！';
        effectsDiv.appendChild(tempEffect);
    } else if (gameState.temperature >= 37.5) {
        const tempEffect = document.createElement('div');
        tempEffect.className = 'effect-item warning';
        tempEffect.textContent = '⚠️ 体温过高！';
        effectsDiv.appendChild(tempEffect);
    }
    
    if (gameState.cleanliness <= 30) {
        const cleanEffect = document.createElement('div');
        cleanEffect.className = 'effect-item warning';
        cleanEffect.textContent = '⚠️ 需要清洁！';
        effectsDiv.appendChild(cleanEffect);
    }
    
    // 显示特殊状态效果
    if (gameState.hasDog) {
        const dogEffect = document.createElement('div');
        dogEffect.className = 'effect-item buff';
        dogEffect.textContent = '🐕 狗狗帮助: 乞讨成功率提高';
        effectsDiv.appendChild(dogEffect);
    }
    
    if (gameState.hasRV) {
        const rvEffect = document.createElement('div');
        rvEffect.className = 'effect-item buff';
        rvEffect.textContent = '🚐 房车庇护: 降低饥饿和体温损失';
        effectsDiv.appendChild(rvEffect);
    }
    
    // 显示其他临时效果
    gameState.activeEffects.forEach(effect => {
        const effectElement = document.createElement('div');
        effectElement.className = 'effect-item buff';
        effectElement.textContent = effect.name;
        effectsDiv.appendChild(effectElement);
    });
}

// 行动点数���统
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
    
    // 体温过高会加快饥饿和清洁度的损失
    if (gameState.temperature >= 37.5) {
        hungerLoss *= 1.5;  // 发烧时消耗更多能量
        gameState.cleanliness -= 10;  // 额外流汗导致更不清洁
        addEventLog('发烧让你感到十分不适...');
    }
    
    gameState.hunger -= hungerLoss;
    gameState.cleanliness -= 15;
    gameState.temperature -= tempLoss;
    
    // 限制最小值和最大值
    gameState.hunger = Math.max(0, gameState.hunger);
    gameState.cleanliness = Math.max(0, gameState.cleanliness);
    gameState.temperature = Math.max(35, Math.min(42, gameState.temperature));  // 添加最高温度限制
    
    // 体温过高可能导致死亡
    if (gameState.temperature >= 42) {
        gameOver('你因为持续高烧死亡了...');
        return;
    }
    
    addEventLog(`第${gameState.day}天开始了...`);
    
    // 检查其他游戏结束条件
    checkGameOver();
    
    // 自动保存
    saveGame();
    
    // 更新状态效果持续时间
    gameState.activeEffects = gameState.activeEffects.filter(effect => {
        if (effect.duration === -1) return true;  // 永久效果保留
        return (gameState.day - effect.startDay) < effect.duration;  // 检查是否过期
    });
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
        
        // 更新位置显示和背景
        const locationInfo = document.querySelector('.location-info');
        locationInfo.className = 'location-info'; // 清除现有类
        locationInfo.classList.add(`location-${location}`); // 添加新位置的类
        
        document.getElementById('current-location').textContent = getLocationName(location);
        
        // 更新可用的行动按钮
        updateAvailableActions();
        
        // 位置提示逻辑
        const locationMessages = {
            street: '你来到了街道，可以向路人乞讨。',
            park: '你来到了公园，这里有免费的水可以使用。',
            restaurant: '你来到了餐厅后巷，也许能在圾桶里找到食物。',
            church: () => gameState.isWeekend ? 
                '教堂正在发放免费食物！' : 
                '教堂在没有发放食物，需要等到周末。',
            store: '你来到了商店，这里可以购买各种物品。'
        };
        
        const message = typeof locationMessages[location] === 'function' 
            ? locationMessages[location]() 
            : locationMessages[location];
        addEventLog(message);
    });
}

// 添加更新可用行动的函数
function updateAvailableActions() {
    // 获取所有行动按钮
    const actionButtons = document.querySelectorAll('.actions .action-group:last-child button');
    
    actionButtons.forEach(button => {
        // 从 onclick 属性中提取行动名称
        const actionName = button.getAttribute('onclick').split('(')[0];
        
        // 检查当前位置是否允许该行动
        const isAvailable = locationActions[gameState.currentLocation]?.includes(actionName);
        
        // 设置按钮可见性
        button.style.display = isAvailable ? 'block' : 'none';
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
        const cleanlinessBonus = gameState.cleanliness / 100;
        
        // 体温过高降低乞讨成功率
        let feverPenalty = 0;
        if (gameState.temperature >= 37.5) {
            feverPenalty = 0.2;  // 发烧时降低20%成功率
            addEventLog('发烧让你难以集中精力...');
        }
        
        const chance = Math.random();
        if (chance < (0.3 + dogBonus + cleanlinessBonus * 0.2 - feverPenalty)) {
            // 基础额
            const baseAmount = Math.floor(Math.random() * 10) + 1;
            
            // 计算各种加成
            const dogAmount = gameState.hasDog ? Math.floor(baseAmount * 0.5) : 0;
            const cleanlinessAmount = Math.floor(baseAmount * (cleanlinessBonus * 0.5)); // 清洁度100%时增加50%收益
            const totalAmount = baseAmount + dogAmount + cleanlinessAmount;
            
            gameState.money += totalAmount;
            
            // 显示详细的收益信息
            let message = `一位好心人给了你${totalAmount}元钱。`;
            if (dogAmount > 0 || cleanlinessAmount > 0) {
                message += '(';
                if (dogAmount > 0) {
                    message += `狗狗帮助+${dogAmount}元`;
                }
                if (cleanlinessAmount > 0) {
                    if (dogAmount > 0) message += ', ';
                    message += `整洁形象+${cleanlinessAmount}元`;
                }
                message += ')';
            }
            addEventLog(message);
            
        } else if (chance < (0.4 + dogBonus + cleanlinessBonus * 0.1)) {
            gameState.hunger += 20;
            if (gameState.hunger > 100) gameState.hunger = 100;
            addEventLog('一位路人给了你一个面包。');
        } else {
            // 根据清洁度给出不同的失败提示
            if (gameState.cleanliness < 30) {
                addEventLog('路人们捂着鼻子走开了...');
            } else if (gameState.cleanliness < 60) {
                addEventLog('路人们匆匆走过...');
            } else {
                addEventLog('今天运气不好，没人愿意给钱。');
            }
        }
    });
}

function searchTrash() {
    consumeAction(() => {
        const chance = Math.random();
        if (chance < 0.3) { // 30% 概率找到空瓶
            gameState.inventory.emptyBottles = (gameState.inventory.emptyBottles || 0) + 1;
            addEventLog("在垃圾桶里找到了一个空瓶！");
            updateUI();
        } else if (gameState.currentLocation === 'restaurant' && chance < 0.5) { // 餐厅特殊奖励
            gameState.hunger += 15;
            if (gameState.hunger > 100) gameState.hunger = 100;
            addEventLog('你在餐厅垃圾桶里找到了一些剩菜！');
            gameState.cleanliness -= 5;
        } else {
            addEventLog("翻了翻垃圾桶，什么都没找到。");
            gameState.cleanliness -= 3;
        }
        
        if (gameState.cleanliness < 0) gameState.cleanliness = 0;
        updateUI();
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
        addEventLog('你用公园的水清洗了下，感觉清爽多了。');
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
        addEventLog('你领取了教堂发放的食物，感觉饱多了。');
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

    // 添加卖空瓶选项，修改价格显示
    if (gameState.inventory.emptyBottles > 0) {
        const sellBottlesDiv = document.createElement('div');
        sellBottlesDiv.className = 'shop-item';
        sellBottlesDiv.innerHTML = `
            <span>出售空瓶 (${gameState.inventory.emptyBottles}个, 每个1元)</span>
            <button onclick="sellBottles()">出售</button>
        `;
        shopItems.appendChild(sellBottlesDiv);
    }

    // 原有的商店列表
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
            if (item.storable && gameState.inventory.items.length >= gameState.maxInventory) {
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
            // 右滑动逻辑
        }
    }
}, false);

// 初始化游戏
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(error => console.log('ServiceWorker registration failed:', error));
}

// 添加出售空瓶功能
function sellBottles() {
    if (gameState.inventory.emptyBottles > 0) {
        const earnings = gameState.inventory.emptyBottles * 1;
        gameState.money += earnings;
        addEventLog(`卖出了 ${gameState.inventory.emptyBottles} 个空瓶，赚到 ${earnings} 元`);
        gameState.inventory.emptyBottles = 0;
        updateUI();
        closeShop();
        openShop(); // 刷新商店界面
    } else {
        addEventLog("没有空瓶可以卖");
    }
}

// 添加状态面板切换功能
function toggleStatusPanel() {
    const content = document.querySelector('.status-panel-content');
    const button = document.querySelector('.toggle-status-btn');
    const isCollapsed = content.classList.toggle('collapsed');
    
    // 更新按钮文字
    button.textContent = isCollapsed ? '展开' : '收起';
    
    // 保存状态到本地存储
    localStorage.setItem('statusPanelCollapsed', isCollapsed);
}

// 在初始化时恢复状态面板的状
function initStatusPanel() {
    const isCollapsed = localStorage.getItem('statusPanelCollapsed') === 'true';
    const content = document.querySelector('.status-panel-content');
    const button = document.querySelector('.toggle-status-btn');
    
    if (isCollapsed) {
        content.classList.add('collapsed');
        button.textContent = '展开';
    }
}

// 添加状态效果系统
function addEffect(name, duration) {
    // 如果已经存在相同效果，先移除它
    gameState.activeEffects = gameState.activeEffects.filter(effect => effect.name !== name);
    
    // 添加新效果
    gameState.activeEffects.push({
        name: name,
        duration: duration,  // -1 表示永久效果
        startDay: gameState.day
    });
    
    updateEffectsUI();
}

initGame();