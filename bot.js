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

// Главное меню с кнопкой перезапуска
const mainMenu = Markup.keyboard([
    ['📍 Отметить ВХОД', '📖 Отметить ВЫХОД'],
    ['💰 Баланс', '🏆 Достижения'],
    ['🎁 Магазин наград', '🔄 Перезапустить бота']
]).resize();

// Кнопки выбора типа посещения
const visitTypeMenu = Markup.keyboard([
    ['🎭 Кружки', '🎉 Мероприятия'],
    ['🔙 Назад']
]).resize();

// Кнопки с кружками
const clubsMenu = Markup.keyboard([
    ['🎨 Рисование', '🎸 Музыка'],
    ['🤖 Программирование', '📝 Литературный клуб'],
    ['🔙 Назад']
]).resize();

// Кнопки с мероприятиями
const eventsMenu = Markup.keyboard([
    ['🎤 Открытый микрофон', '🏆 Турнир по шахматам'],
    ['🎬 Кино вечер', '🎲 Игровая ночь'],
    ['🔙 Назад']
]).resize();

// Старт бота
bot.start((ctx) => {
    const userId = ctx.from.id;
    usersData[userId] = {}; // Сброс данных пользователя
    saveData(usersData);

    // Отправляем приветственное сообщение с перезапущенным меню
    ctx.reply(`🔥 Привет, ${ctx.from.first_name}! Добро пожаловать в "Тепло"!`, mainMenu);
});

// Перезапуск бота
bot.hears('🔄 Перезапустить бота', (ctx) => {
    const userId = ctx.from.id;
    usersData[userId] = {}; // Полный сброс данных пользователя
    saveData(usersData);

    // Отправляем приветственное сообщение с перезапущенным меню
    ctx.reply(`🔄 Бот перезапущен!\n\n🔥 Привет, ${ctx.from.first_name}! Добро пожаловать в "Тепло"!`, mainMenu);
});

// Команда "Отметить вход" → меню выбора типа активности
bot.hears('📍 Отметить ВХОД', (ctx) => {
    ctx.reply('Выберите категорию посещения:', visitTypeMenu);
});

// Выбор "Кружки" → кнопки с кружками
bot.hears('🎭 Кружки', (ctx) => {
    ctx.reply('Выберите кружок:', clubsMenu);
});

// Выбор "Мероприятия" → кнопки с мероприятиями
bot.hears('🎉 Мероприятия', (ctx) => {
    ctx.reply('Выберите мероприятие:', eventsMenu);
});

// Обработка выбора кружка или мероприятия
const activities = ['🎨 Рисование', '🎸 Музыка', '🤖 Программирование', '📝 Литературный клуб', '🎤 Открытый микрофон', '🏆 Турнир по шахматам', '🎬 Кино вечер', '🎲 Игровая ночь'];

activities.forEach(activity => {
    bot.hears(activity, (ctx) => {
        const userId = ctx.from.id;
        usersData[userId] = { activity, status: 'waiting_for_entry_qr' };
        saveData(usersData);

        ctx.reply(`Вы выбрали *${activity}*. Теперь отправьте ваш QR-код для входа.`, { parse_mode: 'Markdown' });
    });
});

// Обработка QR-кода (фильтруем только фото)
bot.on('photo', (ctx) => {
    const userId = ctx.from.id;
    const userState = usersData[userId];

    if (!userState) return; // Если нет состояния, игнорируем

    console.log(`📌 Пользователь ${userId} отправил фото. Состояние: ${userState.status}`);

    if (userState.status === 'waiting_for_entry_qr') {
        ctx.reply('✅ Вход подтвержден! Теперь отправьте QR-код для выхода.', mainMenu);
        usersData[userId].status = 'waiting_for_exit_qr';
        saveData(usersData);
    } else if (userState.status === 'waiting_for_exit_qr') {
        usersData[userId].points = (usersData[userId].points || 0) + 10;
        ctx.reply(`✅ Выход подтвержден! Вам начислено *10 баллов* за участие в *${userState.activity}*! 🎉`, { parse_mode: 'Markdown' });
        ctx.reply('Выберите следующее действие:', mainMenu);

        delete usersData[userId].status;
        delete usersData[userId].activity;
        saveData(usersData);
    }
});

// Кнопка "Баланс"
bot.hears('💰 Баланс', (ctx) => {
    const userId = ctx.from.id;
    const points = usersData[userId]?.points || 0;
    ctx.reply(`🎯 Ваш текущий баланс: *${points}* баллов.`, { parse_mode: 'Markdown' });
});

// Кнопка "Достижения" (заглушка)
bot.hears('🏆 Достижения', (ctx) => {
    ctx.reply('🏅 Здесь будут отображаться ваши достижения!');
});

// Кнопка "Магазин наград"
bot.hears('🎁 Магазин наград', (ctx) => {
    ctx.reply('🎁 Добро пожаловать в магазин наград! Здесь вы можете обменять баллы на призы.\n\n💡 В разработке...', mainMenu);
});

// Кнопка "Отметить ВЫХОД"
bot.hears('📖 Отметить ВЫХОД', (ctx) => {
    const userId = ctx.from.id;

    if (usersData[userId]?.status === 'waiting_for_exit_qr') {
        ctx.reply('📤 Пожалуйста, отправьте QR-код выхода.');
    } else {
        ctx.reply('Вы не отмечали вход. Сначала отметьте вход!', mainMenu);
    }
});

// Кнопка "Назад" (больше не удаляет данные пользователя)
bot.hears('🔙 Назад', (ctx) => {
    ctx.reply('Вы вернулись в главное меню.', mainMenu);
});

// Запуск бота
bot.launch();
console.log('🚀 Бот запущен!');
