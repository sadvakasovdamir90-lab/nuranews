const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const genAI = new GoogleGenerativeAI(".текст");

const feedData = [
    {
        id: 1, type: 'news', category: 'Акимат', time: 'Сегодня, 09:00',
        title: 'Сход местных жителей по вопросам выпаса скота',
        description: '22 июня в 17:00 в здании аппарата акима села Куланотпес состоится собрание местного сообщества.',
        author: 'Аппарат Акима', price: null,
        isVerified: true // 🔥 АҚИМАТҚА АВТОМАТТЫ ТҮРДЕ ГАЛОЧКА ҚОСЫЛДЫ
    }
];

// 1. БАСТЫ БЕТКЕ ДЕРЕК БЕРУ
app.get('/api/feed', (req, res) => {
    res.json(feedData);
});

// 2. 🔍 БӨЛЕК ЖАРНАМАНЫ ID БОЙЫНША ІЗДЕП ТАБУ
app.get('/api/ads/:id', (req, res) => {
    const adId = parseInt(req.params.id);
    const ad = feedData.find(item => item.id === adId);
    
    if (ad) {
        res.json({ success: true, ad: ad });
    } else {
        res.status(404).json({ success: false, message: 'Объявление не найдено' });
    }
});

// 3. 👤 САТУШЫНЫҢ БАСҚА ДА ЖАРНАМАЛАРЫН ТАБУ
app.get('/api/ads/author/:name', (req, res) => {
    const authorName = req.params.name;
    const excludeId = parseInt(req.query.exclude) || 0;
    
    const authorAds = feedData.filter(item => item.type === 'ad' && item.author === authorName && item.id !== excludeId);
    res.json(authorAds);
});

// 4. 📝 ЖАҢА ЖАРНАМА ҚОСУ
app.post('/api/ads', (req, res) => {
    try {
        // 🔥 isVerified АЙНЫМАЛЫСЫ ҚОСЫЛДЫ
        const { category, title, description, price, author, avatar, images, isVerified } = req.body;
        
        const newAd = {
            id: Date.now(),
            type: category === 'Новости' ? 'news' : 'ad',
            category: category || 'Объявление',
            time: 'Только что',
            title: title,
            description: description,
            author: author || 'Аноним',
            avatar: avatar || null,
            isVerified: isVerified || false, // 🔥 ГАЛОЧКА СТАТУСЫН БАЗАҒА САҚТАЙМЫЗ
            price: price ? price + ' ₸' : 'Договорная',
            images: images || []
        };
        
        feedData.unshift(newAd); 
        res.json({ success: true });
    } catch (error) {
        console.error("Бэкендте жарнама қосу қатесі:", error);
        res.status(500).json({ success: false });
    }
});

// 5. ✨ ИИ АРҚЫЛЫ МӘТІНДІ ЖАҚСАРТУ
app.post('/api/enhance-text', async (req, res) => {
    try {
        const { text } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Сделай этот текст объявления продающим, грамотным и привлекательным для покупателей. Добавь подходящие эмодзи, но не делай слишком длинным. Сохрани суть. Исходный текст: "${text}"`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ success: true, enhancedText: response.text() });
    } catch (error) {
        console.error("ИИ қатесі:", error);
        res.json({ success: false, message: 'Не удалось улучшить текст.' });
    }
});

// ТЕЛЕГРАМ АВТОРИЗАЦИЯСЫН ҚАБЫЛДАУ
app.post('/api/auth/telegram', (req, res) => {
    const user = req.body;
    
    // Мұнда қолданушының деректерін тексеріп, сессия ашуға болады
    console.log("Телеграмнан келген дерек:", user);

    // Сәтті жауап қайтару
    res.json({ 
        success: true, 
        message: "Авторизация сәтті өтті",
        user: user 
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер мен ИИ іске қосылды: http://localhost:${PORT}`);
});