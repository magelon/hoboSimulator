// 语言配置
const LOCALES = {
    'zh': {
        name: '简体中文',
        strings: {
            // 状态面板
            'status': '个人状态',
            'day': '第%d天',
            'morning': '上午',
            'afternoon': '下午',
            'actions': '剩余行动次数',
            'money': '金钱',
            'hunger': '饥饿度',
            'cleanliness': '清洁度',
            'temperature': '体温',
            'inventory': '背包',
            'effects': '状态效果',

            // 位置
            'street': '街道',
            'park': '公园',
            'restaurant': '餐厅',
            'church': '教堂',
            'store': '商店',
            'cafe': '咖啡店',

            // 按钮
            'beg': '乞讨',
            'searchTrash': '翻垃圾桶',
            'useWater': '使用水源',
            'openShop': '购物',
            'getChurchFood': '领取教堂食物',
            'openCafe': '购买咖啡',
            'save': '保存游戏',
            'load': '加载游戏',
            'reset': '重新开始',

            // 物品
            'food': '食物',
            'water': '水',
            'lottery': '彩票',
            'blanket': '毯子',
            'dog': '狗',
            'rv': '房车',
            'coffee': '咖啡',
            'cafeFood': '简餐',

            // 提示信息
            'bagFull': '背包已满！',
            'noMoney': '你的钱不够！',
            'debtTooHigh': '你已经欠了太多钱了，老板不肯再赊账了！',
            'gameOver': '游戏结束: %s\n你存活了%d天',
            'confirmReset': '确定要重新开始游戏吗？当前进度将丢失'
        }
    },
    'en': {
        name: 'English',
        strings: {
            'status': 'Status',
            'day': 'Day %d',
            'morning': 'Morning',
            'afternoon': 'Afternoon',
            'actions': 'Actions Left',
            'money': 'Money',
            'hunger': 'Hunger',
            'cleanliness': 'Cleanliness',
            'temperature': 'Temperature',
            'inventory': 'Inventory',
            'effects': 'Effects',

            'street': 'Street',
            'park': 'Park',
            'restaurant': 'Restaurant',
            'church': 'Church',
            'store': 'Store',
            'cafe': 'Cafe',

            'beg': 'Beg',
            'searchTrash': 'Search Trash',
            'useWater': 'Use Water',
            'openShop': 'Shop',
            'getChurchFood': 'Get Church Food',
            'openCafe': 'Buy Coffee',
            'save': 'Save Game',
            'load': 'Load Game',
            'reset': 'Reset Game',

            'food': 'Food',
            'water': 'Water',
            'lottery': 'Lottery',
            'blanket': 'Blanket',
            'dog': 'Dog',
            'rv': 'RV',
            'coffee': 'Coffee',
            'cafeFood': 'Meal',

            'bagFull': 'Bag is full!',
            'noMoney': 'Not enough money!',
            'debtTooHigh': 'Your debt is too high, no more credit!',
            'gameOver': 'Game Over: %s\nYou survived %d days',
            'confirmReset': 'Are you sure you want to reset? Progress will be lost'
        }
    },
    'ja': {
        name: '日本語',
        strings: {
            // 状态面板
            'status': 'ステータス',
            'day': '%d日目',
            'morning': '午前',
            'afternoon': '午後',
            'actions': '残りアクション',
            'money': 'お金',
            'hunger': '空腹度',
            'cleanliness': '清潔度',
            'temperature': '体温',
            'inventory': '持ち物',
            'effects': '状態効果',

            // 位置
            'street': '街��',
            'park': '公園',
            'restaurant': 'レストラン',
            'church': '教会',
            'store': '店',
            'cafe': 'カフェ',

            // 按钮
            'beg': '物乞い',
            'searchTrash': 'ゴミ箱を探す',
            'useWater': '水を使う',
            'openShop': '買い物',
            'getChurchFood': '教会の食事を受け取る',
            'openCafe': 'コーヒーを買う',
            'save': 'セーブ',
            'load': 'ロード',
            'reset': 'リセット',

            // 物品
            'food': '食べ物',
            'water': '水',
            'lottery': '宝くじ',
            'blanket': '毛布',
            'dog': '犬',
            'rv': 'キャンピングカー',
            'coffee': 'コーヒー',
            'cafeFood': '定食',

            // 提示信息
            'bagFull': 'バッグがいっぱいです！',
            'noMoney': 'お金が足りません！',
            'debtTooHigh': '借金が多すぎて、これ以上の掛け売りはできません！',
            'gameOver': 'ゲームオーバー: %s\n%d日間生き延びました',
            'confirmReset': 'リセットしますか？進行状況は失われます',

            // 状态提示
            'hungerWarning': '⚠️ 空腹状態が危険です！',
            'tempLowWarning': '⚠️ 体温が低すぎます！',
            'tempHighWarning': '⚠️ 体温が高すぎます！',
            'cleanWarning': '⚠️ 清潔が必要です！',
            'dogEffect': '🐕 犬の助け: 物乞いの成功率アップ',
            'rvEffect': '🚐 キャンピングカー: 空腹と体温の低下を軽減',

            // 事件消息
            'foundBottle': 'ゴミ箱から空き瓶を見つけました！',
            'foundNothing': 'ゴミ箱を探しましたが、何も見つかりませんでした。',
            'foundRestaurantFood': 'レストランのゴミ箱から食べ残しを見つけました！',
            'usedWater': '公園の水で体を洗い、さっぱりしました。',
            'churchClosed': '教会は週末のみ食事を提供しています。',
            'churchOpen': '教会で無料の食事を配っています！',
            'gotChurchFood': '教会から食事をもらい、お腹が満たされました。',
            'soldBottles': '%d個の空き瓶を売って%d円稼ぎました',
            'noBottles': '売れる空き瓶がありません',
            'debtPaid': '%d円の借金を返済しました',
            'feverTired': '熱で体力が奪われています...',
            'blanketBroken': '毛布がボロボロになって使えなくなりました...',
            'blanketWarning': '毛布があと%d回使えます',
            'rvStorageFull': 'キャンピングカーの収納がいっぱいです！',
            'noFoodToStore': '収納できる食べ物がありません',
            'storedFood': '食べ物をキャンピングカーに収納しました',
            'cookedFood': 'キャンピングカーで料理を作り、とても美味しく食べました！'
        }
    },
    'es': {
        name: 'Español',
        strings: {
            // 状态面板
            'status': 'Estado',
            'day': 'Día %d',
            'morning': 'Mañana',
            'afternoon': 'Tarde',
            'actions': 'Acciones Restantes',
            'money': 'Dinero',
            'hunger': 'Hambre',
            'cleanliness': 'Limpieza',
            'temperature': 'Temperatura',
            'inventory': 'Inventario',
            'effects': 'Efectos',

            // 位置
            'street': 'Calle',
            'park': 'Parque',
            'restaurant': 'Restaurante',
            'church': 'Iglesia',
            'store': 'Tienda',
            'cafe': 'Café',

            // 按钮
            'beg': 'Mendigar',
            'searchTrash': 'Buscar Basura',
            'useWater': 'Usar Agua',
            'openShop': 'Comprar',
            'getChurchFood': 'Obtener Comida de Iglesia',
            'openCafe': 'Comprar Café',
            'save': 'Guardar',
            'load': 'Cargar',
            'reset': 'Reiniciar',

            // 物品
            'food': 'Comida',
            'water': 'Agua',
            'lottery': 'Lotería',
            'blanket': 'Manta',
            'dog': 'Perro',
            'rv': 'Caravana',
            'coffee': 'Café',
            'cafeFood': 'Comida',

            // 提示信息
            'bagFull': '¡La mochila está llena!',
            'noMoney': '¡No tienes suficiente dinero!',
            'debtTooHigh': '¡Tu deuda es demasiado alta!',
            'gameOver': 'Fin del juego: %s\nSobreviviste %d días',
            'confirmReset': '¿Seguro que quieres reiniciar? Perderás todo el progreso'
        }
    },
    'ko': {
        name: '한국어',
        strings: {
            // 状态面板
            'status': '개인 상태',
            'day': '%d일차',
            'morning': '오전',
            'afternoon': '오후',
            'actions': '남은 행동',
            'money': '돈',
            'hunger': '배고픔',
            'cleanliness': '청결도',
            'temperature': '체온',
            'inventory': '가방',
            'effects': '상태 효과',

            // 位置
            'street': '거리',
            'park': '공원',
            'restaurant': '식당',
            'church': '교회',
            'store': '상점',
            'cafe': '카페',

            // 按钮
            'beg': '구걸하기',
            'searchTrash': '쓰레기통 뒤지기',
            'useWater': '물 사용하기',
            'openShop': '쇼핑하기',
            'getChurchFood': '교회 음식 받기',
            'openCafe': '커피 구매',
            'save': '저장',
            'load': '불러오기',
            'reset': '다시 시작',

            // 物品
            'food': '음식',
            'water': '물',
            'lottery': '복권',
            'blanket': '담요',
            'dog': '강아지',
            'rv': '캠핑카',
            'coffee': '커피',
            'cafeFood': '식사',

            // 提示信息
            'bagFull': '가방이 가득 찼습니다!',
            'noMoney': '돈이 부족합니다!',
            'debtTooHigh': '빚이 너무 많아 더 이상 외상이 안됩니다!',
            'gameOver': '게임 오버: %s\n%d일 동안 생존했습니다',
            'confirmReset': '다시 시작하시겠습니까? 진행 상황이 모두 사라집니다',

            // 状态提示
            'hungerWarning': '⚠️ 배고픔 상태가 위험합니다!',
            'tempLowWarning': '⚠️ 체온이 너무 낮습니다!',
            'tempHighWarning': '⚠️ 체온이 너무 높습니다!',
            'cleanWarning': '⚠️ 청결이 필요합니다!',
            'dogEffect': '🐕 강아지 도움: 구걸 성공률 증가',
            'rvEffect': '🚐 캠핑카: 배고픔과 체온 감소 완화'
        }
    }
}; 