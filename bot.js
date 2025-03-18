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

// Список достижений, которые можно получить
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

// Функции обработки для достижений
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
    ['🖼️ Витражный процесс', '💡 История витража'],
    ['🎨 Керамический шедевр', '🛠️ Трудности творчества'],
    ['🧘 Эмоции через творчество', '🎁 Подарок своими руками'],
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

// Команда /reference
bot.command('reference', (ctx) => {
    ctx.reply(
        `ℹ️ *Возможности бота "Тепло":*\n\n` +
        `🔹 /start - Запустить бота и открыть главное меню 📲\n` +
        `🔹 🏆 *Кружки* - Нажми на кнопку и поучаствуй в любом кружке, за это ты получишь баллы, а потом классные награды \n` +
        `🔹 🏆 *Мероприятия* - Нажми на кнопку и поучаствуй в любом мероприятии, за это ты получишь баллы, а потом классные награды \n` +
        `🔹 🏆 *Достижения* - Нажми на кнопку и узнай о своих достижениях, которые ты получил \n` +
        `🔹 💰 *Баланс* - Нажми на кнопку и роверь количество заработанных тобой баллов \n` +
        `🔹 🎁 *Магазин наград* - Нажми на кнопку и узнай, сколько баллов ты можешь обменять на ценные призы \n` +
        `🔹 🏅 *Челленджи* - Нажми на кнопку и поучаствуй в челленджах, чтоб заработать дополнительные баллы \n` +
        `🔹 🔄 *Перезапустить бота* - Полностью обновить состояние бота и начать заново \n\n` +
        `✅ Теперь тебе известно все, для чего нужен бот, скорее запишись на мероприятие! \n\n/start`, 
        { parse_mode: 'Markdown' }
    );
});

// Кнопка-обработчик "Кружки"
bot.hears('🎭 Кружки', (ctx) => {
    ctx.reply('📍 Выберите кружок, который вы хотите посетить:', clubsMenu);
});

// Кнопка-обработчик "Мероприятия"
bot.hears('🎉 Мероприятия', (ctx) => {
    ctx.reply('📍 Выберите мероприятие, которое вы хотите посетить:', eventsMenu);
});

// Обработка списка всех кружков и мероприятий
const activities = [
    "Швейная", "Английский", "Графический дизайн", "Настольные игры", 
    "Спорт", "Керамика", "Фотостудия", "Косплей", "Профориентолог", 
    "Творческая мастерская",'Выставка "Я так вижу"', "Керамические посиделки", "Витражная мастерская",
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

        // Устанавливаем статус ожидания фото
        usersData[userId].status = 'waiting_for_photo';  // Новый статус
        saveData(usersData);

        ctx.reply(
            `📷 Вы выбрали *${activity}*.\n` +
            `Отправьте фотографию с мероприятия/кружка, чтобы получить *10 баллов*!`, 
            { parse_mode: 'Markdown' });

        // Проверяем достижения
        checkAchievements(userId, activity);
    });
});

// Обработка отправки фото
    bot.on('photo', (ctx) => {
     const userId = ctx.from.id;
     const userState = usersData[userId];

     if (!userState || userState.status !== 'waiting_for_photo') {
         // Проверка, если пользователь не в состоянии ожидания фото
         ctx.reply('⚠️ Сначала выберите кружок или мероприятие перед отправкой фото!');
         return;
     }

     // Начисляем 10 баллов за фото
     usersData[userId].points = (usersData[userId].points || 0) + 10;
     saveData(usersData);

     ctx.reply(
         `✅ Фото принято! Вы получили *10 баллов*! 🎉\n\n` +
         `💰 Ваш текущий баланс: *${usersData[userId].points}* баллов.`, 
         { parse_mode: 'Markdown' }
     );

     // Очищаем статус пользователя, так как фото отправлено
     delete usersData[userId].status;
     delete usersData[userId].activity;  // Также очищаем выбранный кружок/мероприятие
     saveData(usersData);
 });

bot.hears('🔄 Перезапустить бота', (ctx) => {
    sendWelcomeMessage(ctx);
});

// Обработка команды "Баланс"
bot.hears('💰 Баланс', (ctx) => {
    const userId = ctx.from.id;
    const balance = usersData[userId]?.points || 0;
    ctx.reply(`💰 Ваш текущий баланс: *${balance}* баллов.`, { parse_mode: 'Markdown' });
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

bot.hears('🏅 Челленджи', (ctx) => {
    ctx.reply('Выберите челлендж:', challengesMenu);
});

// Обработчик для данного челленджа
bot.hears('📸 Фотограф с выставки', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_photograf'; // Новый статус
    saveData(usersData);

    ctx.reply('📷 Для участия в челлендже отправьте фото с мероприятия.');
});

// Обработчик для данного челленджа
bot.hears('🖼️ Витражный процесс', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_drawing'; // Новый статус для рисунков
    saveData(usersData);

    ctx.reply('🎨 Поучаствуй в челлендже! Отправляй фото своего витражного изделия в процессе и заработай баллы.');
});

// Обработчик для данного челленджа
bot.hears('🎨 Керамический шедевр', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_ceramic_photo'; // Новый статус
    saveData(usersData);

    ctx.reply('🏺 Для участия в челлендже отправьте фото вашего керамического изделия.');
});

// Обработчик для данного челленджа
bot.hears('🧘 Эмоции через творчество', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_emotion_art'; // Новый статус для подарка
    saveData(usersData);

    ctx.reply('🎨 Для участия в челлендже отправьте фото вашего рисунка или изделия с арт-терапевтической встречи.');
});

// Обработчик для данного челленджа
bot.hears('🎁 Подарок своими руками', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_gift_photo'; // Новый статус для подарка
    saveData(usersData);

    ctx.reply('🎨 Для участия в челлендже отправьте фото вашего любимого изделия или рисунка. ');
});

// Обработчик для данного челленджа
bot.hears('💡 История витража', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_vitrail_story'; // Устанавливаем статус для текстового челленджа
    saveData(usersData);

    ctx.reply('📝 Напишите небольшую историю о своём витражном изделии (не менее 20 слов), чтобы получить 5 баллов!');
});

// Обработчик для данного челленджа
bot.hears('🖋️ Искусство в словах', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_exhibition_review'; // Устанавливаем статус для текстового челленджа Искусство в словах
    saveData(usersData);

    ctx.reply('📝 Напишите свой отзыв о выставке "Я так вижу" (не менее 20 слов), чтобы получить 5 баллов!');
});

// Обработчик для данного челленджа
bot.hears('🛠️ Трудности творчества', (ctx) => {
    const userId = ctx.from.id;

    // Очищаем статус пользователя, чтобы не было конфликтов
    if (!usersData[userId]) {
        usersData[userId] = {};
    }

    usersData[userId].status = 'waiting_for_creation_difficulties'; // Устанавливаем статус для текстового челленджа "Трудности творчества"
    saveData(usersData);

    ctx.reply('📝 Опишите, что было самым сложным в процессе создания вашего изделия (не менее 20 слов), чтобы получить 5 баллов!');
});

// Обработчик текстов (учитывает три челленджа и кнопки)
bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];
    const messageText = ctx.message.text.trim();

    // Проверяем, если текст - это одна из кнопок меню, выходим из обработчика
    const menuButtons = ['🏆 Достижения', '💰 Баланс', '🔙 Вернуться назад'];
    if (menuButtons.includes(messageText)) {
        return;
    }

    // Обрабатываем для челленджа "История витража"
    if (userState && userState.status === 'waiting_for_vitrail_story') {
        const wordCount = messageText.split(/\s+/).length;

        if (wordCount < 20) {
            return ctx.reply('❌ История слишком короткая. Напишите хотя бы 20 слов.');
        }

        // Начисляем 5 баллов
        usersData[userId].points = (usersData[userId].points || 0) + 5;
        saveData(usersData);

        ctx.reply(
            `✅ История принята! Вы получили *5 баллов*! 🎉\n\n` +
            `💰 Ваш текущий баланс: *${usersData[userId].points}* баллов.`,
            { parse_mode: 'Markdown' }
        );

        // Сбрасываем статус пользователя
        delete usersData[userId].status;
        saveData(usersData);
    }

    // Обрабатываем для челленджа "Искусство в словах"
    if (userState && userState.status === 'waiting_for_exhibition_review') {
        const wordCount = messageText.split(/\s+/).length;

        if (wordCount < 20) {
            return ctx.reply('❌ Отзыв слишком короткий. Напишите хотя бы 20 слов.');
        }

        // Начисляем 5 баллов
        usersData[userId].points = (usersData[userId].points || 0) + 5;
        saveData(usersData);

        ctx.reply(
            `✅ Отзыв принят! Вы получили *5 баллов*! 🎉\n\n` +
            `💰 Ваш текущий баланс: *${usersData[userId].points}* баллов.`,
            { parse_mode: 'Markdown' }
        );

            // Сбрасываем статус пользователя
            delete usersData[userId].status;
            saveData(usersData);
        }


        // Обрабатываем для челленджа "Трудности творчества"
        if (userState && userState.status === 'waiting_for_creation_difficulties') {
            const wordCount = messageText.split(/\s+/).length;

            if (wordCount < 20) {
                return ctx.reply('❌ Ваше описание слишком короткое. Напишите хотя бы 20 слов.');
            }

            // Начисляем 5 баллов
            usersData[userId].points = (usersData[userId].points || 0) + 5;
            saveData(usersData);

            ctx.reply(
                `✅ Ваши трудности приняты! Вы получили *5 баллов*! 🎉\n\n` +
                `💰 Ваш текущий баланс: *${usersData[userId].points}* баллов.`,
                { parse_mode: 'Markdown' }
            );

            // Сбрасываем статус пользователя
            delete usersData[userId].status;
            saveData(usersData);
        }
        });

// Обработка фото (учёт пяти челленджей)
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    if (!userState || !userState.status) {
        ctx.reply('📷 Спасибо за фото, но я пока не знаю, к какому челленджу оно относится.');
        return;
    }

    let pointsEarned = 0;

    if (userState.status === 'waiting_for_photograf') {
        pointsEarned = 10;
    } else if (userState.status === 'waiting_for_drawing') {
        pointsEarned = 10;
    } else if (userState.status === 'waiting_for_ceramic_photo') {
        pointsEarned = 5;
    } else if (userState.status === 'waiting_for_gift_photo') {
        pointsEarned = 5;
    } else if (userState.status === 'waiting_for_emotion_art') {
        pointsEarned = 5; // Начисляем 5 баллов за изделие с эмоциями
    }

    usersData[userId].points = (usersData[userId].points || 0) + pointsEarned;
    saveData(usersData);

    ctx.reply(
        `✅ Фото принято! Вы получили *${pointsEarned} баллов*! 🎉\n\n` +
        `💰 Ваш текущий баланс: *${usersData[userId].points}* баллов.`, 
        { parse_mode: 'Markdown' }
    );

    // Сбрасываем статус пользователя
    delete usersData[userId].status;
    saveData(usersData);
});

// Запуск бота
bot.launch();
console.log('🚀 Бот запущен!');
