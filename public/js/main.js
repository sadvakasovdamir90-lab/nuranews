
document.addEventListener('DOMContentLoaded', () => {
    
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');

    function initTheme() {
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            localStorage.setItem('theme', htmlElement.classList.contains('dark') ? 'dark' : 'light');
        });
    }
    initTheme();

    async function fetchCurrency() {
        const usdEl = document.getElementById('rate-usd');
        const eurEl = document.getElementById('rate-eur');
        const rubEl = document.getElementById('rate-rub');
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await res.json();
            if (data && data.rates) {
                const kzt = data.rates.KZT;
                const eur = data.rates.EUR;
                const rub = data.rates.RUB;
                [usdEl, eurEl, rubEl].forEach(el => el.classList.remove('animate-pulse'));
                usdEl.innerText = Math.round(kzt) + ' ₸';
                eurEl.innerText = Math.round(kzt / eur) + ' ₸';
                rubEl.innerText = (kzt / rub).toFixed(1) + ' ₸'; 
            }
        } catch (e) { 
            usdEl.innerText = '486 ₸'; eurEl.innerText = '554 ₸'; rubEl.innerText = '6.4 ₸'; 
        }
    }

    async function fetchLocationAndWeather() {
        const tempEl = document.getElementById('real-temp');
        const locEl = document.getElementById('user-location');
        const iconEl = document.getElementById('weather-icon');
        let lat = 50.25; let lon = 70.78; let cityName = 'Куланотпес';
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData && ipData.latitude) {
                lat = ipData.latitude; lon = ipData.longitude; cityName = ipData.city || ipData.region || 'Ваш город';
            }
        } catch (e) {}
        locEl.innerText = cityName;
        try {
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const weatherData = await weatherRes.json();
            if (weatherData && weatherData.current_weather) {
                const temp = Math.round(weatherData.current_weather.temperature);
                const code = weatherData.current_weather.weathercode;
                const isDay = weatherData.current_weather.is_day;
                tempEl.innerText = (temp > 0 ? '+' : '') + temp + '°C';
                iconEl.classList.remove('fa-spinner', 'fa-spin', 'text-slate-400');
                if (code === 0) iconEl.className = isDay ? "fas fa-sun text-yellow-500 text-xl" : "fas fa-moon text-indigo-400 text-xl";
                else if (code >= 1 && code <= 3) iconEl.className = isDay ? "fas fa-cloud-sun text-slate-400 text-xl" : "fas fa-cloud-moon text-slate-400 text-xl";
                else if (code >= 51 && code <= 67) iconEl.className = "fas fa-cloud-rain text-blue-400 text-xl";
                else if (code >= 71 && code <= 77) iconEl.className = "fas fa-snowflake text-blue-200 text-xl";
                else iconEl.className = "fas fa-cloud text-slate-400 text-xl";
            }
        } catch (e) { 
            tempEl.innerText = '--°C'; iconEl.className = "fas fa-exclamation-circle text-slate-400 text-xl";
        }
    }

    fetchCurrency(); fetchLocationAndWeather();

    let isAuthenticated = false; 
    const btnPostAd = document.getElementById('btn-post-ad');
    const btnLoginHeader = document.getElementById('btn-login-header');
    const modalAuth = document.getElementById('modal-auth');
    const modalAuthContent = document.getElementById('modal-auth-content');
    const modalTariff = document.getElementById('modal-tariff');
    const modalTariffContent = document.getElementById('modal-tariff-content');
    const authModalTitle = document.getElementById('auth-modal-title');
    const authModalDesc = document.getElementById('auth-modal-desc');
    const closeButtons = document.querySelectorAll('.btn-close-modal, .modal-overlay');

    function openModal(modal, content) {
        modal.classList.remove('hidden');
        setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10);
    }
    function closeModal() {
        [modalAuthContent, modalTariffContent].forEach(content => {
            if (content) { content.classList.remove('scale-100', 'opacity-100'); content.classList.add('scale-95', 'opacity-0'); }
        });
        setTimeout(() => {
            if (modalAuth) modalAuth.classList.add('hidden');
            if (modalTariff) modalTariff.classList.add('hidden');
        }, 300);
    }
    closeButtons.forEach(btn => btn.addEventListener('click', closeModal));

    if (btnLoginHeader) {
        btnLoginHeader.addEventListener('click', () => {
            authModalTitle.innerText = "Войдите в кабинет"; authModalDesc.innerText = "Получите полный доступ ко всем функциям и новостям портала.";
            openModal(modalAuth, modalAuthContent);
        });
    }
    if (btnPostAd) {
        btnPostAd.addEventListener('click', () => {
            if (!isAuthenticated) {
                authModalTitle.innerText = "Требуется авторизация"; authModalDesc.innerText = "Чтобы подать объявление и выбрать тариф, необходимо войти в систему.";
                openModal(modalAuth, modalAuthContent);
            } else { openModal(modalTariff, modalTariffContent); }
        });
    }
    loadFeed();
});

async function loadFeed() {
    const container = document.getElementById('feed-container');
    if (!container) return;
    try {
        const res = await fetch('/api/feed');
        const data = await res.json();
        container.innerHTML = ''; 
        data.forEach(item => {
            let cardHTML = '';
            let avatarHTML = '';
            if (item.author === 'Аноним' || !item.avatar) {
                avatarHTML = `<div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-inner"><i class="fas fa-user-secret text-[12px]"></i></div>`;
            } else {
                avatarHTML = `<img src="${item.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm">`;
            }

            // 🔥 ГАЛОЧКА ОРНАТЫЛДЫ
            const verifiedSVG = `<svg viewBox="0 0 40 40" class="w-3.5 h-3.5 text-blue-500 fill-current inline-block ml-1" title="Проверенный продавец"><path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fill-rule="evenodd"></path></svg>`;
            const authorBadge = item.isVerified ? verifiedSVG : '';

            if (item.type === 'news') {
                cardHTML = `
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover-card overflow-hidden flex flex-col sm:flex-row shadow-sm mb-6">
                    <div class="w-full sm:w-72 shrink-0 h-56 sm:h-auto min-h-[220px] bg-slate-100 dark:bg-slate-800 relative border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 overflow-hidden group">
                        <div class="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600"><i class="fas fa-newspaper text-4xl"></i></div>
                        <div class="absolute top-4 left-4 z-20"><span class="px-3 py-1.5 bg-nura-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-md">${item.category}</span></div>
                    </div>
                    <div class="flex-1 p-6 flex flex-col justify-between min-w-0">
                        <div>
                            <div class="flex items-center gap-2 mb-3"><span class="text-[10px] font-medium text-slate-400"><i class="far fa-clock mr-1"></i> ${item.time}</span></div>
                            <h3 class="text-xl font-[800] leading-snug mb-3 dark:text-white hover:text-nura-600 transition-colors cursor-pointer">${item.title}</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">${item.description}</p>
                        </div>
                        <div class="mt-5 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                ${avatarHTML}
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">${item.author} ${authorBadge}</span>
                            </div>
                            <button class="text-nura-600 hover:text-nura-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">Читать <i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>
                </div>`;
            } else if (item.type === 'ad') {
                const whatsappText = encodeURIComponent(`Привет, я по поводу объявления на NuraNews: "${item.title}"`);
                const detailUrl = `ad-detail.html?id=${item.id}`;
                let coverHTML = `<div class="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 z-0"><i class="fas fa-camera text-4xl"></i></div>`;
                if (item.images && item.images.length > 0) {
                    coverHTML = `
                        <img src="${item.images[0]}" class="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 dark:opacity-30 z-0 transform scale-110">
                        <img src="${item.images[0]}" class="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 z-10">
                    `;
                    if (item.images.length > 1) {
                        coverHTML += `<div class="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-md z-30"><i class="fas fa-images mr-1"></i> ${item.images.length} фото</div>`;
                    }
                }
                cardHTML = `
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover-card overflow-hidden flex flex-col sm:flex-row shadow-sm mb-6">
                    <a href="${detailUrl}" class="w-full sm:w-72 shrink-0 h-56 sm:h-auto min-h-[220px] bg-slate-100 dark:bg-slate-800 relative border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 overflow-hidden group block cursor-pointer">
                        ${coverHTML}
                        <div class="absolute top-4 left-4 z-20"><span class="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-md border border-white/10">${item.category}</span></div>
                        <div class="absolute bottom-4 right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"><span class="text-sm font-[900] text-nura-600 dark:text-nura-400">${item.price}</span></div>
                    </a>
                    
                    <div class="flex-1 p-6 flex flex-col justify-between min-w-0">
                        <div>
                            <div class="flex items-center gap-2 mb-3"><span class="text-[10px] font-medium text-slate-400">${item.time}</span></div>
                            <h3 class="text-xl font-[800] leading-snug mb-3 dark:text-white hover:text-nura-600 transition-colors cursor-pointer">
                                <a href="${detailUrl}">${item.title}</a>
                            </h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">${item.description}</p>
                        </div>
                        <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                ${avatarHTML}
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px] flex items-center">${item.author} ${authorBadge}</span>
                            </div>
                            <div class="flex gap-2">
                                <a href="tel:+77064227410" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center justify-center shadow-sm">
                                    <i class="fas fa-phone text-sm"></i>
                                </a>
                                <a href="https://wa.me/77064227410?text=${whatsappText}" target="_blank" class="px-5 py-2.5 rounded-xl bg-green-500 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-green-600 transition-colors flex items-center gap-2 shadow-md shadow-green-500/30">
                                    <i class="fab fa-whatsapp text-lg"></i> WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
            }
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    } catch (error) { console.error("Ошибка при загрузке ленты:", error); }
}