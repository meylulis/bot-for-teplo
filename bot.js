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
    ['🎥 Трапеция в действии', '🗣️ Ощущения в воздухе'],
    ['🖼️ Витражный процесс', '💡 История витража'],
    ['🎨 Керамический шедевр', '🛠️ Трудности творчества'],
    ['🎨 Искусство для души', '🧘 Эмоции через творчество'],
    ['🎁 Подарок своими руками', '💬 Мечты о подарке'],
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

// Обработка выбора мероприятия
bot.hears('🎉 Мероприятия', (ctx) => {
    ctx.reply('📍 Выберите мероприятие, которое вы хотите посетить:', eventsMenu);
});

// Обработка выбора кружка
bot.hears('🎭 Кружки', (ctx) => {
    ctx.reply('📍 Выберите кружок, который вы хотите посетить:', clubsMenu);
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

// // Обработка выбора "Мероприятия"
 bot.hears('🎉 Мероприятия', (ctx) => {
     ctx.reply('📍 Выберите мероприятие, которое вы хотите посетить:', eventsMenu);
     handleActivitySelection(ctx, 'мероприятие');  // Обработаем выбор мероприятия
 });

// // Обработка выбора "Кружки"
 bot.hears('🎭 Кружки', (ctx) => {
     ctx.reply('📍 Выберите кружок, в котором хотите участвовать:', mainMenu);
     handleActivitySelection(ctx, 'кружок');  // Обработаем выбор кружка
 });

bot.hears('🏅 Челленджи', (ctx) => {
    ctx.reply('Выберите челлендж:', challengesMenu);
});


// Обработка фото (учёт обоих челленджей)
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    if (!userState) {
        ctx.reply('⚠️ Сначала выберите действие перед отправкой фото!');
        return;
    }

    if (userState.status === 'waiting_for_photo') {
        usersData[userId].points = (usersData[userId].points || 0) + 5;
        ctx.reply(`📸 Фото принято! Вы получили *5 баллов*!`, { parse_mode: 'Markdown' });
    } else if (userState.status === 'waiting_for_drawing') {
        usersData[userId].points = (usersData[userId].points || 0) + 3;
        ctx.reply(`🎨 Рисунок принят! Вы получили *3 балла*!`, { parse_mode: 'Markdown' });
    }

    // Сбрасываем статус
    delete usersData[userId].status;
    saveData(usersData);
});

// Обработка выбора конкретного мероприятия
const eventActivities = [
    'Выставка "Я так вижу"', 'Сильная трапеция', 'Витражная мастерская',
    'Керамические посиделки', 'Арт-терапевтическая встреча', 'Теплые мастерские'
];

eventActivities.forEach(activity => {
    bot.hears(activity, (ctx) => {
        const userId = ctx.from.id;
        if (!usersData[userId]) {
            usersData[userId] = { points: 0 };
        }

        usersData[userId].activity = { type: 'мероприятие', name: activity };
        saveData(usersData);

        // Сообщение о том, что выбрано мероприятие
        ctx.reply(
            `📷 Вы выбрали *${activity}*.\n` +
            `Отправьте в течение этого мероприятия фотографию, и вы получите *10 баллов*!`,
            { parse_mode: 'Markdown' }
        );
    });
});

// Обработка выбора конкретного кружка
const clubActivities = [
    'Швейная', 'Английский', 'Графический дизайн', 'Настольные игры',
    'Спорт', 'Керамика', 'Фотостудия', 'Косплей', 'Профориентолог',
    'Творческая мастерская'
];

clubActivities.forEach(activity => {
    bot.hears(activity, (ctx) => {
        const userId = ctx.from.id;
        if (!usersData[userId]) {
            usersData[userId] = { points: 0 };
        }

        usersData[userId].activity = { type: 'кружок', name: activity };
        saveData(usersData);

        // Сообщение о том, что выбран кружок
        ctx.reply(
            `📷 Вы выбрали *${activity}*.\n` +
            `Отправьте в течение этого кружка фотографию, и вы получите *10 баллов*!`,
            { parse_mode: 'Markdown' }
        );
    });
});

// Обработка отправки фото для мероприятий
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    if (userState?.activity?.type !== 'мероприятие') {
        return; // Игнорируем фото, если не выбрано мероприятие
    }

    const currentPoints = userState.points || 0;
    const newPoints = currentPoints + 10;
    usersData[userId].points = newPoints;
    saveData(usersData);

    ctx.reply(
        `✅ Фото принято! Вы получили *10 баллов* за участие в мероприятии! 🎉\n\n` +
        `💰 Ваш текущий баланс: *${newPoints}* баллов.`,
        { parse_mode: 'Markdown' }
    );

    delete usersData[userId].activity;
    saveData(usersData);
});

// Обработка отправки фото для кружков
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    if (userState?.activity?.type !== 'кружок') {
        return; // Игнорируем фото, если не выбрано кружок
    }

    const currentPoints = userState.points || 0;
    const newPoints = currentPoints + 10;
    usersData[userId].points = newPoints;
    saveData(usersData);

    ctx.reply(
        `✅ Фото принято! Вы получили *10 баллов* за участие в кружке! 🎉\n\n` +
        `💰 Ваш текущий баланс: *${newPoints}* баллов.`,
        { parse_mode: 'Markdown' }
    );

    delete usersData[userId].activity;
    saveData(usersData);
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
