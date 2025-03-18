const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Файл для хранения данных пользователей
const DATA_FILE = 'data.json';

// Функция загрузки данных из JSON
function loadData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        return {};
    }
}

// Функция сохранения данных в JSON
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

let usersData = loadData();

const achievements = {
    "Швейная": [
        { name: "✂️ Юный портной", visits: 5 },
        { name: "🧵 Мастер иглы", visits: 15 }
    ],
    "Английский": [
        { name: "🇬🇧 Hello, world!", visits: 5 }
    ],
    "Графический дизайн": [
        { name: "🎨 Цифровой художник", visits: 10 }
    ],
    "Спорт": [
        { name: "🏋️ Спортсмен-любитель", visits: 5 },
        { name: "🏆 Железный чемпион", visits: 20 }
    ],
    "Фотостудия": [
        { name: "📸 Мастер кадра", visits: 10 }
    ],
    "Дипломатические настольные игры": [
        { name: "🏛️ Настольный дипломат", visits: 10 }
    ],
    "Мероприятия": [
        { name: "🏆 Король вечеринок", visits: 15 }
    ],
    "Общее посещение": [
        { name: "🌟 Легенда 'Тепла'", visits: 50 }
    ]
};

function checkAchievements(userId, activity) {
    if (!usersData[userId]) {
        usersData[userId] = { visits: {}, earnedAchievements: [], points: 0 };
    }

    // 🔥 Проверяем, есть ли массив earnedAchievements, если нет - создаем
    if (!usersData[userId].earnedAchievements) {
        usersData[userId].earnedAchievements = [];
    }

    if (!usersData[userId].visits) {
        usersData[userId].visits = {};
    }

    if (!usersData[userId].visits[activity]) {
        usersData[userId].visits[activity] = 0;
    }

    usersData[userId].visits[activity]++;

    let newAchievements = [];

    // Проверяем достижения в конкретной категории
    if (achievements[activity]) {
        achievements[activity].forEach(ach => {
            if (usersData[userId].visits[activity] >= ach.visits &&
                !usersData[userId].earnedAchievements.includes(ach.name)) {
                
                usersData[userId].earnedAchievements.push(ach.name);
                newAchievements.push(ach.name);
            }
        });
    }

    // Проверяем достижения за общее количество посещений
    let totalVisits = Object.values(usersData[userId].visits).reduce((sum, num) => sum + num, 0);
    achievements["Общее посещение"].forEach(ach => {
        if (totalVisits >= ach.visits &&
            !usersData[userId].earnedAchievements.includes(ach.name)) {
            
            usersData[userId].earnedAchievements.push(ach.name);
            newAchievements.push(ach.name);
        }
    });

    if (newAchievements.length > 0) {
        saveData(usersData);
        bot.telegram.sendMessage(userId, `🏅 Поздравляем! Вы получили новые достижения:\n\n${newAchievements.map(a => `✅ ${a}`).join("\n")}`, { parse_mode: 'Markdown' });
    }
}

// Главное меню
const mainMenu = Markup.keyboard([
    ['🎭 Кружки', '🎉 Мероприятия'],
    ['💰 Баланс', '🏆 Достижения'],
    ['🏅 Челленджи'],
    ['🎁 Магазин наград', '🔄 Перезапустить бота']
]).resize();

// Меню челленджей
const challengesMenu = Markup.keyboard([
    ['📸 Фотограф с выставки', '🖋️ Искусство в словах'],
    ['🎥 Трапеция в действии'],
    ['🖼️ Витражный процесс', '💡 История витража'],
    ['🎨 Керамический шедевр', '🛠️ Трудности творчества'],
    ['🎨 Искусство для души', '🎁 Подарок своими руками'],
    ['🔙 Вернуться назад']
]).resize();

// Список кружков
const clubsMenu = Markup.keyboard([
    ['Швейная', 'Английский'],
    ['Графический дизайн', 'Настольные игры'],
    ['Спорт', 'Керамика'],
    ['Фотостудия', 'Косплей'],
    ['Профориентолог', 'Творческая мастерская'],
    ['🔙 Вернуться назад']
]).resize();

// Список мероприятий
const eventsMenu = Markup.keyboard([
    ['Выставка "Я так вижу"', 'Сильная трапеция'],
    ['Витражная мастерская', 'Керамические посиделки'],
    ['Арт-терапевтическая встреча', 'Теплые мастерские'],
    ['🔙 Вернуться назад']
]).resize();


// Функция отправки приветственного сообщения
function sendWelcomeMessage(ctx) {
    ctx.reply(
        `🔥 Привет, ${ctx.from.first_name}! Добро пожаловать в "Тепло"! 🏡\n\n` +
        `💡 *Все функции нашего бота:*\n` +
        `🔹 /start - Начни зарабатывать баллы и участвуй в мероприятиях 🎉\n` +
        `🔹 /reference - Узнай, что представляет из себя этот бот ℹ️\n\n` +
        `🔗 *Обязательно заходи в нашу группу ВК! Там ты найдешь много интересного:*\n` +
        `[Перейти в группу ВК](https://vk.com/mp_teplo)`, 
        { parse_mode: 'Markdown', ...mainMenu }
    );
}

// Команда /start
bot.start((ctx) => {
    sendWelcomeMessage(ctx);
});

// Кнопка "Кружки"
bot.hears('🎭 Кружки', (ctx) => {
    ctx.reply('📍 Выберите кружок, который вы хотите посетить:', clubsMenu);
});

// Кнопка "Мероприятия"
bot.hears('🎉 Мероприятия', (ctx) => {
    ctx.reply('📍 Выберите мероприятие, которое вы хотите посетить:', eventsMenu);
});

// Команда /reference
bot.command('reference', (ctx) => {
    ctx.reply(
        `ℹ️ *Возможности бота "Тепло":*\n\n` +
        `🔹 /start - Запустить бота и открыть главное меню 📲\n` +
        `🔹 🏆 *Достижения* - Нажми на кнопку и узнай о своих достижениях, которые ты получил \n` +
        `🔹 💰 *Баланс* - Нажми на кнопку и роверь количество заработанных тобой баллов \n` +
        `🔹 🎁 *Магазин наград* - Нажми на кнопку и узнай, сколько баллов ты можешь обменять на ценные призы \n` +
        `🏅 *Челленджи* - Нажми на кнопку и поучаствуй в челленджах, чтоб заработать дополнительные баллы \n` +
        `🔹 🔄 *Перезапустить бота* - Полностью обновить состояние бота и начать заново \n\n` +
        `✅ Теперь тебе известно все, для чего нужен бот, скорее запишись на мероприятие! \n\n/start`, 
        { parse_mode: 'Markdown' }
    );
});


bot.hears('🔄 Перезапустить бота', (ctx) => {
    sendWelcomeMessage(ctx);
});

bot.hears('🎭 Кружки', (ctx) => {
    ctx.reply('Выберите кружок:', clubsMenu);
});

bot.hears('🎉 Мероприятия', (ctx) => {
    ctx.reply('Выберите мероприятие:', eventsMenu);
});

bot.hears('🏅 Челленджи', (ctx) => {
    ctx.reply('Выберите челлендж:', challengesMenu);
});

// Обработка выбора челленджа "Фотограф с выставки"
bot.hears('📸 Фотограф с выставки', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя и готовим его к участию в челлендже
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_exhibition_photos'; // Новый статус
    usersData[userId].photoCount = 0; // Счётчик фотографий
    saveData(usersData);

    ctx.reply('📸 Для участия в челлендже отправьте два фото с выставки. Вы получите за это 5 баллов.');
});

// Обработка отправки фотографий в рамках челленджа "Фотограф с выставки"
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    // Проверяем, что пользователь участвует в челлендже "Фотограф с выставки"
    if (!userState || userState.status !== 'waiting_for_exhibition_photos') {
        return;
    }

    // Увеличиваем счётчик фото
    userState.photoCount += 1;

    // Если пользователь отправил два фото, начисляем баллы
    if (userState.photoCount === 2) {
        // Начисляем 5 баллов
        userState.points = (userState.points || 0) + 5;
        saveData(usersData);

        // Очищаем статус
        userState.status = null;
        userState.photoCount = 0;
        saveData(usersData);

        // Сообщаем пользователю, что он выполнил челлендж
        ctx.reply(
            `✅ Вы успешно выполнили челлендж "Фотограф с выставки"! 🎉\n\n` +
            `Вы получили *5 баллов*! 💰\n\n` +
            `💰 Ваш текущий баланс: *${userState.points}* баллов.`,
            { parse_mode: 'Markdown' }
        );
    } else {
        // Если фото меньше двух, сообщаем об этом
        ctx.reply(`📸 Вы отправили ${userState.photoCount} фото. Пожалуйста, отправьте ещё одно фото, чтобы завершить челлендж.`);
    }
});


// Обработка списка всех кружков и мероприятий
const activities = [
    "Швейная", "Английский", "Графический дизайн", "Настольные игры", 
    "Спорт", "Керамика", "Фотостудия", "Косплей", "Профориентолог", 
    "Творческая мастерская", "Керамические посиделки", "Витражная мастерская",
    "Арт-терапевтическая встреча", "Теплые мастерские", "Сильная трапеция"
];


// Обработка выбора кружка/мероприятия
activities.forEach(activity => {
    bot.hears(activity, (ctx) => {
        const userId = ctx.from.id;

        if (!usersData[userId]) {
            usersData[userId] = { points: 0 };
        }

        // Запоминаем выбранный кружок/мероприятие
        usersData[userId].activity = activity;
        saveData(usersData);

        ctx.reply(
            `📷 Вы выбрали *${activity}*.\n` +
            `Отправьте в течение мероприятия/кружка фотографию с него и получите *10 баллов*!`, 
            { parse_mode: 'Markdown' });

        // Проверяем достижения
        checkAchievements(userId, activity);
    });
});

// Обработка отправки фото
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    if (!userState || !userState.activity) {
        ctx.reply('⚠️ Сначала выберите кружок или мероприятие перед отправкой фото!');
        return;
    }

    // Начисляем 10 баллов
    usersData[userId].points = (usersData[userId].points || 0) + 10;
    saveData(usersData);

    ctx.reply(
        `✅ Фото принято! Вы получили *10 баллов*! 🎉\n\n` +
        `💰 Ваш текущий баланс: *${usersData[userId].points}* баллов.`, 
        { parse_mode: 'Markdown' }
    );

    // Очищаем сохраненный кружок/мероприятие
    delete usersData[userId].activity;
});

// Обработка команды "Баланс"
bot.hears('💰 Баланс', (ctx) => {
    const userId = ctx.from.id;
    const userPoints = usersData[userId]?.points || 0; // Получаем баллы пользователя

    ctx.reply(`💰 Ваш текущий баланс: *${userPoints}* баллов.`, { parse_mode: 'Markdown' });
}); 

bot.hears('🏆 Достижения', (ctx) => {
    const userId = ctx.from.id;
    
    // Проверяем, есть ли у пользователя достижения
    const userAch = usersData[userId]?.earnedAchievements || [];

    if (userAch.length === 0) {
        ctx.reply('😔 У вас пока нет достижений. Записывайтесь на мероприятия и кружки, чтобы их заработать!');
    } else {
        ctx.reply(`🏅 Ваши достижения:\n\n${userAch.map(a => `✅ ${a}`).join("\n")}`);
    }
});

// Пример списка наград (можно менять)
const rewards = {
    "🎟️ Стикер": 20,
    "🎁 Брелок": 50,
    "👕 Футболка": 100
};

// Обработчик команды "Магазин наград"
bot.hears('🎁 Магазин наград', (ctx) => {
    const userId = ctx.from.id;
    const userPoints = usersData[userId]?.points || 0;

    // Создаём кнопки с наградами
    const rewardButtons = Object.keys(rewards).map(reward =>
        [Markup.button.callback(`${reward} — ${rewards[reward]} баллов`, `reward_${reward}`)]
    );

    ctx.reply(
        `🎁 *Магазин наград*\n\n💰 Ваш баланс: *${userPoints}* баллов\n\nВыберите награду:`,
        {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard(rewardButtons)
        }
    );
});

// Обработчик нажатий на кнопки наград
bot.action(/^reward_(.+)/, (ctx) => {
    const userId = ctx.from.id;
    const userPoints = usersData[userId]?.points || 0;
    const rewardName = ctx.match[1]; // Получаем название награды
    const rewardCost = rewards[rewardName];

    if (!rewardCost) {
        return ctx.answerCbQuery("❌ Такой награды нет!");
    }

    if (userPoints >= rewardCost) {
        usersData[userId].points -= rewardCost; // Списываем баллы
        saveData(usersData); // Сохраняем изменения

        ctx.reply(`✅ Вы обменяли ${rewardCost} баллов на *${rewardName}*! 🎉. Для того, чтоб забрать награду обратитесь к Админу "Тепло"`, { parse_mode: "Markdown" });
    } else {
        ctx.answerCbQuery(`❌ Недостаточно баллов! Нужно ещё ${rewardCost - userPoints} баллов.`);
    }
});

// Обработка кнопки "Вернуться назад"
bot.hears('🔙 Вернуться назад', (ctx) => {
    ctx.reply('Вы вернулись в главное меню.', mainMenu);
});

// Запуск бота
bot.launch();
console.log('🚀 Бот запущен!');
