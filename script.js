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
    activeEffects: [],
    cafeDebt: 0,
    rvStorage: {
        food: 0,
        maxFood: 5  // 最多存储5份食物
    }
};

// 物品定义
const ITEMS = {
    food: { 
        name: '食物', 
        price: 10, 
        description: '可以恢复30点饥饿度（一次性）', 
        storable: true,
        use: (state, item) => {
            state.hunger += 30;
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
            
            // 当剩余使用次数小于等于0时，移除毯子
            if (remainingUses <= 0) {
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
        description: '移动的家，可存储和烹饪食物，降低饥饿和体温损失', 
        storable: false,
        effect: () => { 
            gameState.hasRV = true; 
            addEffect('房车庇护', -1);
            addEventLog('现在你可以在房车中存储和烹饪食物了！');
        }
    }
};

// 添加咖啡店物品
const CAFE_ITEMS = {
    coffee: {
        name: '咖啡',
        price: 5,
        description: '提神醒脑，增加行动力',
        credit: true,  // 可以赊账
        storable: false,  // 咖啡直接饮用
        effect: (state) => {
            state.actionsRemaining += 1;
            return '喝了一杯咖啡，感觉精神了一些（获得1点行动力）';
        }
    },
    cafeFood: {
        name: '简餐',
        price: 10,
        description: '咖啡店的简单食物',
        credit: true,  // 可以赊账
        storable: true,  // 食物可以存入背包
        use: (state) => {
            state.hunger += 40;
            if(state.hunger > 100) state.hunger = 100;
            return {
                message: '吃了一份简餐，感觉饱多了。',
                remove: true
            };
        }
    }
};

// 添加位置对应可用行动的映射
const locationActions = {
    street: ['beg', 'searchTrash'],
    park: ['useWater', 'searchTrash'],
    restaurant: ['searchTrash'],
    church: ['getChurchFood', 'searchTrash'],
    store: ['openShop', 'searchTrash'],
    cafe: ['openCafe', 'searchTrash']  // 移除乞讨，只保留咖啡店功能和翻垃圾桶
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
    document.getElementById('day').textContent = `${gameState.day} (${getWeekdayName(gameState.day)})`;
    document.getElementById('period').textContent = gameState.period === 'morning' ? '上午' : '下午';
    document.getElementById('actions').textContent = gameState.actionsRemaining;
    
    updateInventoryUI();
    updateEffectsUI();
    updateAvailableActions();
    updateRVStorageUI();
    
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
        
        // 确保 rvStorage 结构完整
        if (!loadedState.rvStorage) {
            loadedState.rvStorage = {
                food: 0,
                maxFood: 5
            };
        }
        
        Object.assign(gameState, loadedState);
        updateUI();
        addEventLog('游戏已加载');
    }
}

function resetGame(isGameOver = false) {
    if (!isGameOver && !confirm('确定要重新开始游戏吗？当前进度将丢失')) {
        return;
    }

    // 重置所有游戏数据到初始状态
    Object.assign(gameState, {
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
        activeEffects: [],
        cafeDebt: 0,
        rvStorage: {
            food: 0,
            maxFood: 5
        }
    });

    // 清除本地存储
    localStorage.removeItem('streetLifeGameState');
    localStorage.removeItem('statusPanelCollapsed');

    // 更新界面
    updateUI();
    
    // 重置位置背景
    const locationInfo = document.querySelector('.location-info');
    locationInfo.className = 'location-info';
    locationInfo.classList.add('location-street');

    // 重置状态面板
    const content = document.querySelector('.status-panel-content');
    const button = document.querySelector('.toggle-status-btn');
    content.classList.remove('collapsed');
    button.textContent = '收起';

    // 清空事件日志
    const eventLog = document.getElementById('event-log');
    eventLog.innerHTML = '';
    addEventLog('游戏重新开始了...');
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
    
    // 检查并移除耐久为0的毯子
    gameState.inventory.items = gameState.inventory.items.filter((item, index) => {
        if (item.id === 'blanket') {
            const itemData = ITEMS[item.id];
            const remainingUses = itemData.maxUses - (item.uses || 0);
            if (remainingUses <= 0) {
                addEventLog('一条破旧的毯子从你的背包中掉了出来...');
                return false;
            }
        }
        return true;
    });
    
    // 显示其他物品
    gameState.inventory.items.forEach((item, index) => {
        const itemData = item.id === 'cafeFood' ? CAFE_ITEMS.cafeFood : ITEMS[item.id];
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        
        let itemName = itemData.name;
        if (item.id === 'blanket') {
            const remainingUses = itemData.maxUses - (item.uses || 0);
            itemName += ` (剩余${remainingUses}次)`;
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
    const itemData = item.id === 'cafeFood' ? CAFE_ITEMS.cafeFood : ITEMS[item.id];
    
    if (!itemData) return;
    
    const result = itemData.use(gameState, item);
    addEventLog(result.message);
    
    if (result.remove) {
        removeFromInventory(index);
    } else if (result.updateUI) {
        updateInventoryUI();
    }
    
    updateUI();
}

// 状态效果系统
function updateEffectsUI() {
    const effectsDiv = document.getElementById('active-effects');
    effectsDiv.innerHTML = '';
    
    // 添加天数和星期提醒
    const dayEffect = document.createElement('div');
    dayEffect.className = 'effect-item info';
    dayEffect.textContent = `📅 第${gameState.day}天 ${getWeekdayName(gameState.day)} ${gameState.period === 'morning' ? '上午' : '下午'}`;
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

// 行动点数系统
function consumeAction(callback) {
    if (gameState.actionsRemaining <= 0) {
        addEventLog('今的行动次数已用完！');
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
    
    // 降低饥饿值衰减速度（从原来的20/10改为10/5）
    let hungerLoss = gameState.hasRV ? 5 : 10;  // 有房车时只降低5点，否则降低10点
    let tempLoss = gameState.hasRV ? 0.1 : 0.2;
    
    // 体温过高时的饥饿加成也相应调整
    if (gameState.temperature >= 37.5) {
        hungerLoss *= 1.5;  // 发烧时消耗更多能量，但基数降低了
        gameState.cleanliness -= 10;
        addEventLog('发烧让你感到十分不适...');
    }
    
    gameState.hunger -= hungerLoss;
    gameState.cleanliness -= 15;
    gameState.temperature -= tempLoss;
    
    // 限制最小值和最大值
    gameState.hunger = Math.max(0, gameState.hunger);
    gameState.cleanliness = Math.max(0, gameState.cleanliness);
    gameState.temperature = Math.max(35, Math.min(42, gameState.temperature));
    
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
    resetGame(true);  // 添加参数表示是死亡重置
}

// 位置系统
function moveToLocation(location) {
    consumeAction(() => {
        gameState.currentLocation = location;
        
        // 更新位置显示和背景
        const locationInfo = document.querySelector('.location-info');
        locationInfo.className = 'location-info';
        locationInfo.classList.add(`location-${location}`);
        
        document.getElementById('current-location').textContent = getLocationName(location);
        
        // 更新可用的行动按钮
        updateAvailableActions();
        
        // 位置提示逻辑
        const locationMessages = {
            street: '你来到了街道，可以向路人乞讨。',
            park: '你来到了公园，这里有免费的水可以使用。',
            restaurant: '你来到了餐厅后巷，也许能在垃圾桶里找到食物。',
            church: () => gameState.isWeekend ? 
                '教堂正在发放免费食物！' : 
                '教堂没有发放食物，需要等到周末。',
            store: '你来到了商店，这里可以购买各种物品。',
            cafe: '你来到了咖啡店，这里可以购买咖啡和食物，还可以赊账。'
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
        // 从 onclick 属性中提取动名称
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
            
            // 计算各加成
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
            addEventLog('你在餐厅垃圾桶找到了一些剩菜！');
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
        gameState.hunger += 60;
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
                addEventLog(`你购买了${item.name}并加入背包`);
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
        store: '商店',
        cafe: '咖啡店'  // 添加咖啡店名称
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
        addEventLog(`卖出了 ${gameState.inventory.emptyBottles} 个空瓶赚到 ${earnings} 元`);
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
    
    // 更新钮文字
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
    
    // 添加效果
    gameState.activeEffects.push({
        name: name,
        duration: duration,  // -1 表示永久效果
        startDay: gameState.day
    });
    
    updateEffectsUI();
}

// 修改咖啡店功能
function openCafe() {
    if (gameState.currentLocation !== 'cafe') {
        addEventLog('你需要在咖啡店才能购买！');
        return;
    }

    const shopModal = document.getElementById('shopModal');
    const shopItems = document.getElementById('shop-items');
    shopItems.innerHTML = '';

    // 显示当前欠债
    if (gameState.cafeDebt > 0) {
        const debtDiv = document.createElement('div');
        debtDiv.className = 'shop-item warning';
        debtDiv.innerHTML = `
            <span>当前欠债: ${gameState.cafeDebt}元</span>
            <button onclick="payCafeDebt()" ${gameState.money >= gameState.cafeDebt ? '' : 'disabled'}>还清欠债</button>
        `;
        shopItems.appendChild(debtDiv);
    }

    // 显示咖啡店商品
    Object.entries(CAFE_ITEMS).forEach(([id, item]) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        itemDiv.innerHTML = `
            <span>${item.name} - ${item.price}元 (${item.description})</span>
            <div class="button-group">
                <button onclick="buyCafeItem('${id}', false)" ${gameState.money >= item.price ? '' : 'disabled'}>购买</button>
                ${item.credit ? `<button onclick="buyCafeItem('${id}', true)" ${gameState.cafeDebt >= 50 ? 'disabled' : ''}>赊账</button>` : ''}
            </div>
        `;
        shopItems.appendChild(itemDiv);
    });

    shopModal.style.display = 'block';
}

// 修改购买咖啡店物品函数
function buyCafeItem(itemId, useCredit) {
    const item = CAFE_ITEMS[itemId];
    
    if (useCredit && gameState.cafeDebt >= 50) {
        addEventLog('你已经欠太多钱了，老板不肯再赊账了！');
        return;
    }

    if (!useCredit && gameState.money < item.price) {
        addEventLog('你的钱不够！');
        return;
    }

    // 如果是可存储物品，检查背包空间
    if (item.storable && gameState.inventory.items.length >= gameState.maxInventory) {
        addEventLog('背包已满，无法购买！');
        return;
    }

    consumeAction(() => {
        if (useCredit) {
            gameState.cafeDebt += item.price;
        } else {
            gameState.money -= item.price;
        }

        if (item.storable) {
            // 将食物添加到背包
            const newItem = {
                id: 'cafeFood',  // 修改这里使用正确的ID
                uses: 0,         // 添加使用次数属性
                name: item.name  // 保存物品名称
            };
            gameState.inventory.items.push(newItem);
            addEventLog(useCredit ? `赊账买了${item.name}并放入背包。` : `购买了${item.name}并放入背包。`);
        } else {
            // 直接使用物品（比如咖啡）
            const message = item.effect(gameState);
            addEventLog(useCredit ? `赊账买了${item.name}。${message}` : `购买了${item.name}。${message}`);
        }

        if (useCredit) {
            addEventLog(`当前欠债: ${gameState.cafeDebt}元`);
        }
        
        closeShop();
        updateUI();
    });
}

// 还清咖啡店欠债
function payCafeDebt() {
    if (gameState.money >= gameState.cafeDebt) {
        gameState.money -= gameState.cafeDebt;
        addEventLog(`还清了${gameState.cafeDebt}元欠债`);
        gameState.cafeDebt = 0;
        closeShop();
        updateUI();
    }
}

// 添加获取星期几的函数
function getWeekdayName(day) {
    const weekday = day % 7;  // 获取余数来确定星期几
    switch(weekday) {
        case 0: return '星期日';
        case 1: return '星期一';
        case 2: return '星期二';
        case 3: return '星期三';
        case 4: return '星期四';
        case 5: return '星期五';
        case 6: return '星期六';
    }
}

// 修改房车食物存储功能
function storeFood() {
    if (!gameState.hasRV) {
        addEventLog('你需要一辆房车才能存储食物！');
        return;
    }

    if (gameState.rvStorage.food >= gameState.rvStorage.maxFood) {
        addEventLog('房车的食物储存空间已满！');
        return;
    }

    // 检查背包中是否有食物
    const foodIndex = gameState.inventory.items.findIndex(item => item.id === 'food');
    if (foodIndex === -1) {
        addEventLog('背包里没有食物可以存储');
        return;
    }

    // 将食物从背包移到房车储存
    removeFromInventory(foodIndex);
    gameState.rvStorage.food++;
    addEventLog('你将一份食物存放在房车中');
    updateRVStorageUI();
    updateUI();
}

function cookFood() {
    if (!gameState.hasRV) {
        addEventLog('你需要一辆房车才能烹饪食物！');
        return;
    }

    if (gameState.rvStorage.food <= 0) {
        addEventLog('房车中没有储存的食物！');
        return;
    }

    consumeAction(() => {
        gameState.rvStorage.food--;
        gameState.hunger += 40;  // 烹饪后的食物效果更好
        if (gameState.hunger > 100) gameState.hunger = 100;
        addEventLog('你在房车中烹饪了一份食物，感觉特别美味！');
        updateRVStorageUI();
        updateUI();
    });
}

// 修改房车储存UI显示
function updateRVStorageUI() {
    if (!gameState.hasRV) return;

    const rvStorageDiv = document.getElementById('rv-storage');
    if (!rvStorageDiv) return;

    // 检查背包中是否有食物
    const hasFoodInInventory = gameState.inventory.items.some(item => item.id === 'food');

    rvStorageDiv.innerHTML = `
        <h3>房车储存</h3>
        <div class="rv-storage-info">
            <p>储存食物: ${gameState.rvStorage.food}/${gameState.rvStorage.maxFood}</p>
            <div class="button-group">
                <button onclick="storeFood()" ${!hasFoodInInventory ? 'disabled' : ''}>存储食物</button>
                <button onclick="cookFood()" ${gameState.rvStorage.food <= 0 ? 'disabled' : ''}>烹饪食物</button>
            </div>
        </div>
    `;

    // 显示房车储存区域
    rvStorageDiv.classList.toggle('active', gameState.hasRV);
}

// 修改作弊系统
function toggleCheatInput() {
    document.getElementById('cheatInputModal').style.display = 'block';
    document.getElementById('cheatInput').value = '';
    document.getElementById('cheatInput').focus();
}

function closeCheatInput() {
    document.getElementById('cheatInputModal').style.display = 'none';
}

function submitCheat() {
    const cheatInput = document.getElementById('cheatInput').value.toLowerCase();
    
    // 检查作弊码
    if (cheatInput === 'money') {
        gameState.money += 2000;
        addEventLog('【开发者模式】获得2000元');
        updateUI();
    }
    
    closeCheatInput();
}

// 点击模态窗口外部关闭
document.getElementById('cheatInputModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeCheatInput();
    }
});

// 保持原有的键盘作弊功能
let cheatCode = '';
let cheatTimeout;

document.addEventListener('keydown', function(event) {
    // 记录按键
    cheatCode += event.key;
    
    // 检查作弊码 (money)
    if (cheatCode.toLowerCase().includes('money')) {
        gameState.money += 2000;
        addEventLog('【开发者模式】获得2000元');
        updateUI();
        cheatCode = '';
    }
    
    // 5秒后重置作弊码
    clearTimeout(cheatTimeout);
    cheatTimeout = setTimeout(() => {
        cheatCode = '';
    }, 5000);
});

initGame();