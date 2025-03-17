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


let usersData = loadData();

// Главное меню
const mainMenu = Markup.keyboard([
    ['📍 Отметить ВХОД', '📖 Отметить ВЫХОД'],
    ['💰 Баланс', '🏆 Достижения'],
    ['🎁 Магазин наград', '🔄 Перезапустить бота'],
    ['🏅 Челленджи']
]).resize();

// Меню выбора типа посещения
const visitTypeMenu = Markup.keyboard([
    ['🎭 Кружки', '🎉 Мероприятия'],
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
    ['Керамические посиделки', 'Витражная мастерская'],
    ['Творческий вечер с музыкой', 'Школа абитуриента'],
    ['Дипломатические настольные игры'],
    ['🔙 Вернуться назад']
]).resize();

// Главное меню с челленджами
const challengesMenu = Markup.keyboard([
    ["Рисуй каждый день", "Фотограф недели"],
    ["Словарный запас", "🔙 Вернуться назад"]
]).resize();

// Описание челленджей
const challenges = {
    "🎨 Рисуй каждый день": {
        description: "🎨 В этом челлендже вам нужно отправлять по 1 рисунку в день в течение недели!",
        type: "photo",
        goal: 7
    },
    "📸 Фотограф недели": {
        description: "📸 Отправляйте фото с мероприятий, которые вы посетили в течение недели!",
        type: "photo",
        goal: 3
    },
    "📖 Словарный запас": {
        description: "📖 Учите новые слова! В течение недели отправьте 10 новых слов с переводом.",
        type: "text",
        goal: 10
    }
};

// Обработка кнопки "Челленджи"
bot.hears('🏆 Челленджи', (ctx) => {
    ctx.reply("Выберите челлендж:", challengesMenu);
});

// Обработка выбора челленджа
bot.hears(Object.keys(challenges), (ctx) => {
    const userId = ctx.from.id;
    const challenge = ctx.message.text;

    if (!usersData[userId]) {
        usersData[userId] = { progress: {}, challenge: null };
    }

    usersData[userId].challenge = challenge;
    usersData[userId].progress[challenge] = usersData[userId].progress[challenge] || 0;

    saveData(usersData);

    ctx.reply(
        `${challenges[challenge].description}\n\n📌 Отправьте ${
            challenges[challenge].type === "photo" ? "фото" : "новые слова"
        }, чтобы выполнить челлендж!`
    );
});

// Обработка входящих фото и текста
bot.on(['photo', 'text'], (ctx) => {
    const userId = ctx.from.id;
    const userChallenge = usersData[userId]?.challenge;

    if (!userChallenge) return;

    const challengeData = challenges[userChallenge];

    // Проверяем соответствие типа данных
    if (
        (ctx.message.photo && challengeData.type === "photo") ||
        (ctx.message.text && challengeData.type === "text")
    ) {
        usersData[userId].progress[userChallenge] += 1;
        saveData(usersData);

        const progress = usersData[userId].progress[userChallenge];
        const goal = challengeData.goal;

        if (progress >= goal) {
            ctx.reply(`🎉 Поздравляем! Вы выполнили челлендж "${userChallenge}"! 🏆`);
            usersData[userId].challenge = null;
            saveData(usersData);
        } else {
            ctx.reply(`✅ Принято! ${progress}/${goal} выполнено.`);
        }
    }
});

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

// Команда /reference
bot.command('reference', (ctx) => {
    ctx.reply(
        `ℹ️ *Возможности бота "Тепло":*\n\n` +
        `🔹 /start - Запустить бота и открыть главное меню 📲\n` +
        `🔹 📍 *Отметить ВХОД (Посещение)* - Записаться на кружок или мероприятие, отсканировав QR-код \n` +
        `🔹 📖 *Отметить ВЫХОД* - Завершить посещение кружка или мероприятия с подтверждением QR-кода \n` +
        `🔹 🏆 *Достижения* - Узнай о своих достижениях и прогрессе \n` +
        `🔹 💰 *Баланс* - Проверь количество заработанных баллов \n` +
        `🔹 🎁 *Магазин наград* - Обменивай баллы на ценные призы \n` +
        `🔹 🔄 *Перезапустить бота* - Полностью обновить состояние бота и начать заново \n\n` +
        `✅ Теперь тебе известно все, для чего нужен бот, скорее запишись на мероприятие! \n\n/start`, 
        { parse_mode: 'Markdown' }
    );
});


// Обработка кнопки "Перезапустить бота"
bot.hears('🔄 Перезапустить бота', (ctx) => {
    sendWelcomeMessage(ctx);
});

// Обработка кнопки "Отметить ВХОД"
bot.hears('📍 Отметить ВХОД', (ctx) => {
    ctx.reply('Выберите категорию посещения:', visitTypeMenu);
});

// Обработка кнопки "Кружки"
bot.hears('🎭 Кружки', (ctx) => {
    ctx.reply('Выберите кружок:', clubsMenu);
});

// Обработка кнопки "Мероприятия"
bot.hears('🎉 Мероприятия', (ctx) => {
    ctx.reply('Выберите мероприятие:', eventsMenu);
});

// Обработка списка всех кружков и мероприятий
const activities = [
    "Швейная", "Английский", "Графический дизайн", "Настольные игры", 
    "Спорт", "Керамика", "Фотостудия", "Косплей", "Профориентолог", 
    "Творческая мастерская", "Керамические посиделки", "Витражная мастерская",
    "Творческий вечер с музыкой", "Школа абитуриента", "Дипломатические настольные игры"
];

// Обработка выбора кружка/мероприятия
activities.forEach(activity => {
    bot.hears(activity, (ctx) => {
        const userId = ctx.from.id;

        // Создаем запись пользователя, если ее нет
        if (!usersData[userId]) {
            usersData[userId] = {};
        }

        // Сохраняем выбранное мероприятие и статус ожидания входа
        usersData[userId].activity = activity;
        usersData[userId].status = 'waiting_for_entry_qr';
        saveData(usersData);

        ctx.reply(`📸 Вы выбрали *${activity}*. Пожалуйста, отправьте фото QR-кода для входа.`, { parse_mode: 'Markdown' });

        // Проверяем достижения
        checkAchievements(userId, activity);
    });
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

        ctx.reply(`✅ Вы обменяли ${rewardCost} баллов на *${rewardName}*! 🎉`, { parse_mode: "Markdown" });
    } else {
        ctx.answerCbQuery(`❌ Недостаточно баллов! Нужно ещё ${rewardCost - userPoints} баллов.`);
    }
});

// Обработка команды "Баланс"
bot.hears('💰 Баланс', (ctx) => {
    const userId = ctx.from.id;
    const userPoints = usersData[userId]?.points || 0; // Получаем баллы пользователя

    ctx.reply(`💰 Ваш текущий баланс: *${userPoints}* баллов.`, { parse_mode: 'Markdown' });
}); 


// Обработка фото QR-кода (вход и выход)
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    if (!userState || !userState.status) {
        ctx.reply('⚠️ Сначала выберите кружок или мероприятие перед отправкой QR-кода!');
        return;
    }

    console.log(`📌 Пользователь ${userId} отправил фото. Статус: ${userState.status}`);

    if (userState.status === 'waiting_for_entry_qr') {
        ctx.reply('✅ Вход подтвержден! Теперь отправьте QR-код для выхода.', mainMenu);
        usersData[userId].status = 'waiting_for_exit_qr';
        saveData(usersData);
    } else if (userState.status === 'waiting_for_exit_qr') {
        usersData[userId].points = (usersData[userId].points || 0) + 10; // Суммируем баллы

        ctx.reply(`✅ Выход подтвержден! Вам начислено *10 баллов* за посещение *${userState.activity}*! 🎉\n\n💰 Ваш текущий баланс: *${usersData[userId].points}* баллов.`, { parse_mode: 'Markdown' });
        ctx.reply('Выберите следующее действие:', mainMenu);

        // Очищаем статус пользователя
        delete usersData[userId].status;
        delete usersData[userId].activity;
        saveData(usersData);
    }
});



// Обработка кнопки "Отметить ВЫХОД"
bot.hears('📖 Отметить ВЫХОД', (ctx) => {
    const userId = ctx.from.id;

    if (usersData[userId]?.status === 'waiting_for_exit_qr') {
        ctx.reply('📤 Пожалуйста, отправьте QR-код выхода.');
    } else {
        ctx.reply('⚠️ Вы не отмечали вход. Сначала отметьте вход!', mainMenu);
    }
});

// Обработка кнопки "Вернуться назад"
bot.hears('🔙 Вернуться назад', (ctx) => {
    ctx.reply('Вы вернулись в главное меню.', mainMenu);
});

// Запуск бота
// Запуск бота
bot.launch().then(() => console.log('🚀 Бот запущен!'));
