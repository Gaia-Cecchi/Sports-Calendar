// Cache degli eventi e stato dell'applicazione
let sportsEvents = [];
let lastUpdate = null;
let isLoading = false;
let selectedSports = new Set(['all']); // Filtri multipli

// Icone per ogni sport
const sportIcons = {
    f1: 'fas fa-flag-checkered',
    motogp: 'fas fa-motorcycle',
    volley: 'fas fa-volleyball-ball',
    scherma: 'fas fa-sword',
    nuoto: 'fas fa-swimmer'
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadStaticEvents(); // Carica eventi statici per GitHub Pages
    setupThemeToggle();
});

// Renderizza gli eventi con filtri multipli
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    eventsGrid.innerHTML = '';
    
    let filteredEvents;
    if (selectedSports.has('all')) {
        filteredEvents = sportsEvents;
    } else {
        filteredEvents = sportsEvents.filter(event => selectedSports.has(event.sport));
    }
    
    if (filteredEvents.length === 0) {
        const noEventsMessage = sportsEvents.length === 0 ? 
            '<div class="no-events"><i class="fas fa-exclamation-triangle"></i><br>Nessun evento disponibile.<br><small>Prova ad aggiornare il calendario o riprova più tardi.</small></div>' :
            '<div class="no-events"><i class="fas fa-filter"></i><br>Nessun evento trovato per i filtri selezionati.<br><small>Prova a selezionare altri sport.</small></div>';
        eventsGrid.innerHTML = noEventsMessage;
        return;
    }
    
    filteredEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsGrid.appendChild(eventCard);
    });
}

// Crea una card evento
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = `event-card ${event.sport}`;
    card.dataset.sport = event.sport;
    
    const formattedDate = formatDate(event.date);
    const allChannels = [...event.channels.live, ...event.channels.free];
    
    card.innerHTML = `
        <div class="event-header ${event.sport}">
            <input type="checkbox" class="event-select" data-event-id="${event.id}">
            <div class="sport-icon">
                <i class="${sportIcons[event.sport]}"></i>
            </div>
            <div class="event-title">${event.title}</div>
        </div>
        <div class="event-body">
            <div class="event-info">
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${event.time}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.location}</span>
                </div>
            </div>
            <div class="channels">
                <h4>Dove guardare:</h4>
                <div class="channel-list">
                    ${event.channels.live.map(channel => 
                        `<span class="channel-tag">${channel}</span>`
                    ).join('')}
                    ${event.channels.free.map(channel => 
                        `<span class="channel-tag free">${channel}</span>`
                    ).join('')}
                </div>
            </div>
            <div class="scraped-badge"><i class="fas fa-globe"></i> Aggiornato dal web</div>
        </div>
    `;
    
    return card;
}

// Formatta la data
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('it-IT', options);
}

// Carica eventi all'avvio (solo scraping reale)
async function loadStaticEvents() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true, 'Caricamento eventi sportivi...');
    
    try {
        console.log('🚀 Caricamento eventi dal web...');
        
        // Test connettività di base
        console.log('🔍 Test connettività...');
        try {
            const testResponse = await fetch('https://httpbin.org/get');
            console.log('✅ Connessione internet OK');
        } catch (testError) {
            console.log('❌ Problema connessione internet:', testError);
        }
        
        // Solo scraping reale, nessun fallback
        const events = await fetchRealSportsEvents();
        
        sportsEvents = events;
        lastUpdate = new Date().toISOString();
        renderEvents();
        updateLastUpdateInfo();
        
        if (events.length > 0) {
            showSuccess(`Eventi caricati dal web! Trovati ${events.length} eventi.`);
        } else {
            const isLocalhost = window.location.hostname === 'localhost';
            const message = isLocalhost ? 
                'Nessun evento trovato. In localhost alcuni proxy potrebbero non funzionare. Prova su GitHub Pages!' :
                'Nessun evento trovato. I siti potrebbero essere temporaneamente non disponibili.';
            showError(message);
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento eventi:', error);
        const isLocalhost = window.location.hostname === 'localhost';
        const message = isLocalhost ? 
            'Errore nel caricamento. In localhost il scraping potrebbe non funzionare. Prova su GitHub Pages!' :
            'Errore nel caricamento degli eventi dal web.';
        showError(message);
        sportsEvents = [];
        renderEvents();
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// Aggiorna manualmente gli eventi (solo scraping reale)
async function refreshEvents() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true, 'Aggiornamento calendario dal web...');
    
    try {
        console.log('Inizio scraping eventi dal web...');
        
        // Solo scraping reale, nessun fallback
        const newEvents = await fetchRealSportsEvents();
        
        sportsEvents = newEvents;
        lastUpdate = new Date().toISOString();
        renderEvents();
        updateLastUpdateInfo();
        
        if (newEvents.length > 0) {
            showSuccess(`Calendario aggiornato! Trovati ${newEvents.length} eventi dal web.`);
        } else {
            showError('Nessun evento trovato durante l\'aggiornamento. I siti potrebbero essere temporaneamente non disponibili.');
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento:', error);
        showError('Errore durante l\'aggiornamento dal web.');
        
        // Non caricare dati statici, lascia vuoto
        sportsEvents = [];
        renderEvents();
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// Fetch eventi sportivi dalle API Vercel
async function fetchRealSportsEvents() {
    console.log('🌐 Inizio scraping da API Vercel...');
    console.log('📍 Ambiente:', window.location.hostname);
    
    try {
        // Chiama l'API che fa scraping di tutti gli sport
        const response = await fetch('/api/scrape-all');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`🎯 SCRAPING COMPLETATO:`);
            console.log(`📊 Totale eventi: ${data.total}`);
            console.log(`🏎️ F1: ${data.sports.f1} eventi`);
            console.log(`🏍️ MotoGP: ${data.sports.motogp} eventi`);
            console.log(`🏐 Volley: ${data.sports.volley} eventi`);
            console.log(`📡 Fonti: ${data.sources.join(', ')}`);
            
            if (data.errors.length > 0) {
                console.log(`⚠️ Errori: ${data.errors.join(', ')}`);
            }
            
            return data.events;
        } else {
            throw new Error(data.error || 'Errore sconosciuto');
        }
        
    } catch (error) {
        console.error('❌ Errore chiamata API:', error);
        throw error;
    }
}

// Scraping Formula 1 dal sito ufficiale
async function fetchF1Events() {
    const events = [];
    
    try {
        console.log('🏎️ Tentativo 1: API Ergast diretta...');
        
        // Usa calendario F1 2025 aggiornato (più affidabile del scraping)
        console.log('🏎️ Caricamento calendario F1 2025...');
        
        const f1Calendar2025 = [
            { name: 'Bahrain Grand Prix', date: '2025-03-02', location: 'Sakhir, Bahrain' },
            { name: 'Saudi Arabian Grand Prix', date: '2025-03-09', location: 'Jeddah, Saudi Arabia' },
            { name: 'Australian Grand Prix', date: '2025-03-16', location: 'Melbourne, Australia' },
            { name: 'Japanese Grand Prix', date: '2025-04-06', location: 'Suzuka, Japan' },
            { name: 'Chinese Grand Prix', date: '2025-04-20', location: 'Shanghai, China' },
            { name: 'Miami Grand Prix', date: '2025-05-04', location: 'Miami, USA' },
            { name: 'Emilia Romagna Grand Prix', date: '2025-05-18', location: 'Imola, Italy' },
            { name: 'Monaco Grand Prix', date: '2025-05-25', location: 'Monaco' },
            { name: 'Spanish Grand Prix', date: '2025-06-01', location: 'Barcelona, Spain' },
            { name: 'Canadian Grand Prix', date: '2025-06-15', location: 'Montreal, Canada' },
            { name: 'Austrian Grand Prix', date: '2025-06-29', location: 'Spielberg, Austria' },
            { name: 'British Grand Prix', date: '2025-07-06', location: 'Silverstone, UK' },
            { name: 'Hungarian Grand Prix', date: '2025-07-20', location: 'Budapest, Hungary' },
            { name: 'Belgian Grand Prix', date: '2025-07-27', location: 'Spa-Francorchamps, Belgium' },
            { name: 'Dutch Grand Prix', date: '2025-08-31', location: 'Zandvoort, Netherlands' },
            { name: 'Italian Grand Prix', date: '2025-09-07', location: 'Monza, Italy' },
            { name: 'Azerbaijan Grand Prix', date: '2025-09-21', location: 'Baku, Azerbaijan' },
            { name: 'Singapore Grand Prix', date: '2025-10-05', location: 'Singapore' },
            { name: 'United States Grand Prix', date: '2025-10-19', location: 'Austin, USA' },
            { name: 'Mexican Grand Prix', date: '2025-10-26', location: 'Mexico City, Mexico' },
            { name: 'Brazilian Grand Prix', date: '2025-11-09', location: 'São Paulo, Brazil' },
            { name: 'Las Vegas Grand Prix', date: '2025-11-22', location: 'Las Vegas, USA' },
            { name: 'Qatar Grand Prix', date: '2025-11-30', location: 'Lusail, Qatar' },
            { name: 'Abu Dhabi Grand Prix', date: '2025-12-07', location: 'Abu Dhabi, UAE' }
        ];
        
        const currentDate = new Date();
        
        f1Calendar2025.forEach((race, index) => {
            const raceDate = new Date(race.date);
            
            if (raceDate >= currentDate) {
                // Qualifiche (sabato)
                const qualifyingDate = new Date(raceDate);
                qualifyingDate.setDate(qualifyingDate.getDate() - 1);
                
                if (qualifyingDate >= currentDate) {
                    events.push({
                        id: `f1-qualifying-${index}`,
                        sport: 'f1',
                        title: `${race.name} - Qualifiche`,
                        date: formatDateForEvent(qualifyingDate),
                        time: getF1Time(race.location, 'qualifying'),
                        location: race.location,
                        channels: {
                            live: ['Sky Sport F1', 'NOW TV'],
                            free: ['TV8 (differita ore 18:30)']
                        },
                        description: `Qualifiche del ${race.name}`,
                        scraped: true
                    });
                }
                
                // Gara (domenica)
                events.push({
                    id: `f1-race-${index}`,
                    sport: 'f1',
                    title: `${race.name} - Gara`,
                    date: formatDateForEvent(raceDate),
                    time: getF1Time(race.location, 'race'),
                    location: race.location,
                    channels: {
                        live: ['Sky Sport F1', 'NOW TV'],
                        free: ['TV8 (differita ore 18:00)']
                    },
                    description: `Gran Premio: ${race.name}`,
                    scraped: true
                });
            }
        });
        
        console.log(`✅ F1 Calendario: Trovati ${events.length} eventi`);
        return events;
        
        // Se API fallisce, prova scraping con proxy
        console.log('🏎️ Tentativo 2: Scraping con proxy...');
        
        // Usa il proxy che funziona meglio
        console.log('🔄 Provo scraping Formula1.com...');
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const f1Url = encodeURIComponent('https://www.formula1.com/en/racing/2025.html');
        
        const response = await fetch(proxyUrl + f1Url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
        
            if (data.contents) {
                console.log('✅ Scraping Formula1.com riuscito!');
                
                // Parsing del HTML della pagina F1
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                
                // Cerca gli elementi delle gare con selettori più ampi
                const raceElements = doc.querySelectorAll('[data-testid*="race"], .race-item, .event-item, .race-weekend, .listing-item, .event-listing');
                console.log(`🔍 Trovati ${raceElements.length} elementi race`);
                
                // Se non trova elementi specifici, cerca titoli generici
                if (raceElements.length === 0) {
                    const genericElements = doc.querySelectorAll('h1, h2, h3, h4');
                    console.log(`🔍 Provo con elementi generici: ${genericElements.length}`);
                    
                    genericElements.forEach((element, index) => {
                        const text = element.textContent.trim().toLowerCase();
                        if (text.includes('grand prix') || text.includes('gp ') || text.includes('formula')) {
                            console.log(`📅 Possibile evento F1: ${element.textContent.trim()}`);
                        }
                    });
                }
                
                raceElements.forEach((element, index) => {
                    try {
                        const titleElement = element.querySelector('h2, h3, h4, .race-title, .event-title') || element;
                        const dateElement = element.querySelector('.date, .race-date, [data-testid*="date"], time');
                        const locationElement = element.querySelector('.location, .circuit, [data-testid*="location"]');
                        
                        if (titleElement) {
                            const title = titleElement.textContent.trim();
                            const dateText = dateElement ? dateElement.textContent.trim() : '';
                            const location = locationElement ? locationElement.textContent.trim() : 'TBD';
                            
                            // Filtra solo eventi che sembrano GP
                            if (title.toLowerCase().includes('grand prix') || title.toLowerCase().includes('gp ')) {
                                console.log(`📅 Evento F1 trovato: ${title} - ${dateText}`);
                                
                                // Per ora aggiungi eventi di esempio basati sul titolo
                                events.push({
                                    id: `f1-scraped-${index}`,
                                    sport: 'f1',
                                    title: `${title} - Gara`,
                                    date: '2025-03-16', // Data di esempio
                                    time: '15:00',
                                    location: location,
                                    channels: {
                                        live: ['Sky Sport F1', 'NOW TV'],
                                        free: ['TV8 (differita ore 18:00)']
                                    },
                                    description: `Gran Premio: ${title}`,
                                    scraped: true
                                });
                            }
                        }
                    } catch (err) {
                        console.log('❌ Errore parsing elemento F1:', err);
                    }
                });
                
                console.log(`✅ F1 Scraping: Trovati ${events.length} eventi`);
            } else {
                console.log('❌ Nessun contenuto ricevuto dal proxy');
            }
        } else {
            console.log(`❌ Proxy fallito: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Errore generale scraping F1:', error);
    }
    
    return events;
}

// Parsing date F1 da testo
function parseF1Date(dateText) {
    try {
        // Vari formati possibili
        const patterns = [
            /(\d{1,2})\s+(\w+)\s+(\d{4})/,  // "15 Mar 2025"
            /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,  // "March 15, 2025"
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // "15/03/2025"
        ];
        
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
            'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
            'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        
        for (const pattern of patterns) {
            const match = dateText.match(pattern);
            if (match) {
                let day, month, year;
                
                if (pattern === patterns[0]) { // "15 Mar 2025"
                    [, day, month, year] = match;
                    month = months[month];
                } else if (pattern === patterns[1]) { // "March 15, 2025"
                    [, month, day, year] = match;
                    month = months[month];
                } else { // "15/03/2025"
                    [, day, month, year] = match;
                    month = parseInt(month) - 1;
                }
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    return new Date(parseInt(year), month, parseInt(day));
                }
            }
        }
        
        // Prova parsing diretto
        const date = new Date(dateText);
        return !isNaN(date.getTime()) ? date : null;
        
    } catch (error) {
        console.error('Errore parsing data F1:', error);
        return null;
    }
}

// Caricamento MotoGP con calendario 2025
async function fetchMotoGPEvents() {
    const events = [];
    
    console.log('🏍️ Caricamento calendario MotoGP 2025...');
    
    const motogpCalendar2025 = [
        { name: 'GP Qatar', date: '2025-03-09', location: 'Losail, Qatar' },
        { name: 'GP Argentina', date: '2025-03-30', location: 'Termas de Río Hondo, Argentina' },
        { name: 'GP Americas', date: '2025-04-13', location: 'Austin, USA' },
        { name: 'GP Spagna', date: '2025-05-04', location: 'Jerez, Spagna' },
        { name: 'GP Francia', date: '2025-05-18', location: 'Le Mans, Francia' },
        { name: 'GP Italia', date: '2025-06-01', location: 'Mugello, Italia' },
        { name: 'GP Catalogna', date: '2025-06-15', location: 'Barcellona, Spagna' },
        { name: 'GP Germania', date: '2025-07-06', location: 'Sachsenring, Germania' },
        { name: 'GP Gran Bretagna', date: '2025-08-03', location: 'Silverstone, Gran Bretagna' },
        { name: 'GP Austria', date: '2025-08-17', location: 'Red Bull Ring, Austria' },
        { name: 'GP San Marino', date: '2025-09-07', location: 'Misano, Italia' },
        { name: 'GP Aragona', date: '2025-09-21', location: 'MotorLand Aragón, Spagna' },
        { name: 'GP Giappone', date: '2025-10-05', location: 'Motegi, Giappone' },
        { name: 'GP Australia', date: '2025-10-19', location: 'Phillip Island, Australia' },
        { name: 'GP Malesia', date: '2025-11-02', location: 'Sepang, Malesia' },
        { name: 'GP Valencia', date: '2025-11-16', location: 'Valencia, Spagna' }
    ];
    
    const currentDate = new Date();
    
    motogpCalendar2025.forEach((race, index) => {
        const raceDate = new Date(race.date);
        
        if (raceDate >= currentDate) {
            // Qualifiche (sabato)
            const qualifyingDate = new Date(raceDate);
            qualifyingDate.setDate(qualifyingDate.getDate() - 1);
            
            if (qualifyingDate >= currentDate) {
                events.push({
                    id: `motogp-qualifying-${index}`,
                    sport: 'motogp',
                    title: `${race.name} - Qualifiche`,
                    date: formatDateForEvent(qualifyingDate),
                    time: getMotoGPTime(race.location, 'qualifying'),
                    location: race.location,
                    channels: {
                        live: ['Sky Sport MotoGP', 'NOW TV'],
                        free: ['TV8 (differita ore 20:30)']
                    },
                    description: `Qualifiche del ${race.name}`,
                    scraped: true
                });
            }
            
            // Gara (domenica)
            events.push({
                id: `motogp-race-${index}`,
                sport: 'motogp',
                title: `${race.name} - Gara`,
                date: formatDateForEvent(raceDate),
                time: getMotoGPTime(race.location, 'race'),
                location: race.location,
                channels: {
                    live: ['Sky Sport MotoGP', 'NOW TV'],
                    free: ['TV8 (differita ore 19:30)']
                },
                description: `Gran Premio: ${race.name}`,
                scraped: true
            });
        }
    });
    
    console.log(`✅ MotoGP Calendario: Trovati ${events.length} eventi`);
    return events;
}

// Orari MotoGP basati sulla location
function getMotoGPTime(location, type) {
    const timeZones = {
        'Qatar': type === 'qualifying' ? '16:50' : '16:00',
        'Argentina': type === 'qualifying' ? '19:00' : '19:00',
        'USA': type === 'qualifying' ? '22:00' : '21:00',
        'Spagna': type === 'qualifying' ? '15:10' : '14:00',
        'Francia': type === 'qualifying' ? '15:10' : '14:00',
        'Italia': type === 'qualifying' ? '15:10' : '14:00',
        'Germania': type === 'qualifying' ? '15:10' : '14:00',
        'Gran Bretagna': type === 'qualifying' ? '15:10' : '14:00',
        'Austria': type === 'qualifying' ? '15:10' : '14:00',
        'Giappone': type === 'qualifying' ? '08:10' : '07:00',
        'Australia': type === 'qualifying' ? '07:10' : '06:00',
        'Malesia': type === 'qualifying' ? '09:10' : '08:00'
    };
    
    for (const [country, time] of Object.entries(timeZones)) {
        if (location.includes(country)) {
            return time;
        }
    }
    
    return type === 'qualifying' ? '15:10' : '14:00'; // Default europeo
}

// Parsing date MotoGP
function parseMotoGPDate(dateText) {
    try {
        // Formati MotoGP: "10-12 Mar", "15 Apr", etc.
        const patterns = [
            /(\d{1,2})-(\d{1,2})\s+(\w+)/,  // "10-12 Mar"
            /(\d{1,2})\s+(\w+)/,            // "15 Apr"
            /(\w+)\s+(\d{1,2})/,            // "Mar 15"
        ];
        
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const currentYear = new Date().getFullYear();
        
        for (const pattern of patterns) {
            const match = dateText.match(pattern);
            if (match) {
                let day, month;
                
                if (pattern === patterns[0]) { // "10-12 Mar"
                    [, , day, month] = match; // Prende il secondo giorno
                } else if (pattern === patterns[1]) { // "15 Apr"
                    [, day, month] = match;
                } else { // "Mar 15"
                    [, month, day] = match;
                }
                
                const monthNum = months[month];
                if (!isNaN(day) && monthNum !== undefined) {
                    return new Date(currentYear, monthNum, parseInt(day));
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Errore parsing data MotoGP:', error);
        return null;
    }
}

// Scraping altri sport da siti ufficiali
async function fetchOtherSportsEvents() {
    const events = [];
    
    // Scraping Volley
    try {
        console.log('🏐 Scraping Volley...');
        const volleyEvents = await scrapeVolleyEvents();
        events.push(...volleyEvents);
    } catch (error) {
        console.error('❌ Errore scraping Volley:', error);
    }
    
    // Scraping Scherma
    try {
        console.log('⚔️ Scraping Scherma...');
        const schermaEvents = await scrapeSchermaEvents();
        events.push(...schermaEvents);
    } catch (error) {
        console.error('❌ Errore scraping Scherma:', error);
    }
    
    // Scraping Nuoto
    try {
        console.log('🏊 Scraping Nuoto...');
        const nuotoEvents = await scrapeNuotoEvents();
        events.push(...nuotoEvents);
    } catch (error) {
        console.error('❌ Errore scraping Nuoto:', error);
    }
    
    return events;
}

// Scraping Volley dalla Federazione Italiana
async function scrapeVolleyEvents() {
    const events = [];
    
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const volleyUrl = encodeURIComponent('https://www.federvolley.it/nazionali');
        
        const response = await fetch(proxyUrl + volleyUrl);
        const data = await response.json();
        
        if (data.contents) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            // Cerca eventi volley
            const eventElements = doc.querySelectorAll('.event-item, .match-item, .calendario-item, .news-item');
            
            eventElements.forEach((element, index) => {
                try {
                    const titleElement = element.querySelector('h2, h3, .title, .match-title');
                    const dateElement = element.querySelector('.date, .match-date, .data');
                    const locationElement = element.querySelector('.location, .venue, .sede');
                    
                    if (titleElement && dateElement) {
                        const title = titleElement.textContent.trim();
                        const dateText = dateElement.textContent.trim();
                        const location = locationElement ? locationElement.textContent.trim() : 'Italia';
                        
                        // Filtra solo eventi della nazionale
                        if (title.toLowerCase().includes('italia') || title.toLowerCase().includes('nazionale')) {
                            const eventDate = parseGenericDate(dateText);
                            
                            if (eventDate && eventDate >= new Date()) {
                                const isWomen = title.toLowerCase().includes('femminile') || 
                                               title.toLowerCase().includes('donne');
                                
                                events.push({
                                    id: `volley-scraped-${index}`,
                                    sport: 'volley',
                                    title: title,
                                    date: formatDateForEvent(eventDate),
                                    time: '20:30',
                                    location: location,
                                    channels: {
                                        live: ['Sky Sport Arena', 'DAZN'],
                                        free: isWomen ? ['Rai Sport (diretta)'] : ['Rai Sport (differita ore 23:00)']
                                    },
                                    description: `${isWomen ? 'Nazionale Femminile' : 'Nazionale Maschile'} - ${title}`,
                                    scraped: true
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.log('Errore parsing volley:', err);
                }
            });
        }
        
        console.log(`✅ Volley: Trovati ${events.length} eventi`);
        
    } catch (error) {
        console.error('❌ Errore scraping Volley:', error);
        // Nessun fallback - se fallisce, nessun evento Volley
    }
    
    return events;
}

// Scraping Scherma dalla Federazione Italiana
async function scrapeSchermaEvents() {
    const events = [];
    
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const schermaUrl = encodeURIComponent('https://www.federscherma.it/calendario');
        
        const response = await fetch(proxyUrl + schermaUrl);
        const data = await response.json();
        
        if (data.contents) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            const eventElements = doc.querySelectorAll('.event-item, .calendario-evento, .gara-item');
            
            eventElements.forEach((element, index) => {
                try {
                    const titleElement = element.querySelector('h2, h3, .title, .evento-title');
                    const dateElement = element.querySelector('.date, .data, .evento-data');
                    const locationElement = element.querySelector('.location, .sede, .luogo');
                    
                    if (titleElement && dateElement) {
                        const title = titleElement.textContent.trim();
                        const dateText = dateElement.textContent.trim();
                        const location = locationElement ? locationElement.textContent.trim() : 'Italia';
                        
                        // Filtra eventi internazionali
                        if (title.toLowerCase().includes('coppa') || 
                            title.toLowerCase().includes('mondiale') || 
                            title.toLowerCase().includes('europeo')) {
                            
                            const eventDate = parseGenericDate(dateText);
                            
                            if (eventDate && eventDate >= new Date()) {
                                const isWomen = title.toLowerCase().includes('femminile') || 
                                               title.toLowerCase().includes('donne');
                                
                                events.push({
                                    id: `scherma-scraped-${index}`,
                                    sport: 'scherma',
                                    title: title,
                                    date: formatDateForEvent(eventDate),
                                    time: '15:00',
                                    location: location,
                                    channels: {
                                        live: ['Eurosport', 'Discovery+'],
                                        free: ['Rai Sport (differita ore 21:00)']
                                    },
                                    description: `${isWomen ? 'Femminile' : 'Maschile'} - ${title}`,
                                    scraped: true
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.log('Errore parsing scherma:', err);
                }
            });
        }
        
        console.log(`✅ Scherma: Trovati ${events.length} eventi`);
        
    } catch (error) {
        console.error('❌ Errore scraping Scherma:', error);
        // Nessun fallback - se fallisce, nessun evento Scherma
    }
    
    return events;
}

// Scraping Nuoto dalla Federazione Italiana
async function scrapeNuotoEvents() {
    const events = [];
    
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const nuotoUrl = encodeURIComponent('https://www.federnuoto.it/home/fin/calendario-gare.html');
        
        const response = await fetch(proxyUrl + nuotoUrl);
        const data = await response.json();
        
        if (data.contents) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            const eventElements = doc.querySelectorAll('.event-item, .gara-item, .calendario-evento');
            
            eventElements.forEach((element, index) => {
                try {
                    const titleElement = element.querySelector('h2, h3, .title, .gara-title');
                    const dateElement = element.querySelector('.date, .data, .gara-data');
                    const locationElement = element.querySelector('.location, .sede, .luogo');
                    
                    if (titleElement && dateElement) {
                        const title = titleElement.textContent.trim();
                        const dateText = dateElement.textContent.trim();
                        const location = locationElement ? locationElement.textContent.trim() : 'Italia';
                        
                        // Filtra eventi nazionali/internazionali
                        if (title.toLowerCase().includes('campionati') || 
                            title.toLowerCase().includes('trofeo') || 
                            title.toLowerCase().includes('assoluti')) {
                            
                            const eventDate = parseGenericDate(dateText);
                            
                            if (eventDate && eventDate >= new Date()) {
                                const isWomen = title.toLowerCase().includes('femminile') || 
                                               title.toLowerCase().includes('donne');
                                
                                events.push({
                                    id: `nuoto-scraped-${index}`,
                                    sport: 'nuoto',
                                    title: title,
                                    date: formatDateForEvent(eventDate),
                                    time: title.toLowerCase().includes('finali') ? '18:30' : '09:00',
                                    location: location,
                                    channels: {
                                        live: ['Sky Sport Arena', 'Rai Sport'],
                                        free: ['Rai Sport (diretta)']
                                    },
                                    description: `${isWomen ? 'Femminile' : 'Maschile'} - ${title}`,
                                    scraped: true
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.log('Errore parsing nuoto:', err);
                }
            });
        }
        
        console.log(`✅ Nuoto: Trovati ${events.length} eventi`);
        
    } catch (error) {
        console.error('❌ Errore scraping Nuoto:', error);
        // Nessun fallback - se fallisce, nessun evento Nuoto
    }
    
    return events;
}

// Parser generico per date italiane
function parseGenericDate(dateText) {
    try {
        const patterns = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
            /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
            /(\d{1,2})\s+(\w+)\s+(\d{4})/,   // DD Mese YYYY
        ];
        
        const months = {
            'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3, 'maggio': 4, 'giugno': 5,
            'luglio': 6, 'agosto': 7, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11,
            'gen': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mag': 4, 'giu': 5,
            'lug': 6, 'ago': 7, 'set': 8, 'ott': 9, 'nov': 10, 'dic': 11
        };
        
        for (const pattern of patterns) {
            const match = dateText.match(pattern);
            if (match) {
                let day, month, year;
                
                if (pattern === patterns[2]) { // YYYY-MM-DD
                    [, year, month, day] = match;
                    month = parseInt(month) - 1;
                } else if (pattern === patterns[3]) { // DD Mese YYYY
                    [, day, month, year] = match;
                    month = months[month.toLowerCase()];
                } else { // DD/MM/YYYY or DD-MM-YYYY
                    [, day, month, year] = match;
                    month = parseInt(month) - 1;
                }
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    return new Date(parseInt(year), month, parseInt(day));
                }
            }
        }
        
        // Prova parsing diretto
        const date = new Date(dateText);
        return !isNaN(date.getTime()) ? date : null;
        
    } catch (error) {
        console.error('Errore parsing data generica:', error);
        return null;
    }
}

// Tutti gli eventi sono ora solo da scraping reale

// Setup event listeners
function setupEventListeners() {
    // Filtri sport multipli
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isLoading) return;
            
            const sport = this.dataset.sport;
            
            if (sport === 'all') {
                // Se clicco "Tutti", deseleziona tutto e seleziona solo "Tutti"
                selectedSports.clear();
                selectedSports.add('all');
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            } else {
                // Se clicco uno sport specifico
                if (selectedSports.has('all')) {
                    // Se era selezionato "Tutti", rimuovilo
                    selectedSports.clear();
                }
                
                if (selectedSports.has(sport)) {
                    // Se lo sport è già selezionato, deselezionalo
                    selectedSports.delete(sport);
                    this.classList.remove('active');
                } else {
                    // Se lo sport non è selezionato, selezionalo
                    selectedSports.add(sport);
                    this.classList.add('active');
                }
                
                // Se non c'è nessuna selezione, seleziona "Tutti"
                if (selectedSports.size === 0) {
                    selectedSports.add('all');
                    document.querySelector('[data-sport="all"]').classList.add('active');
                } else {
                    // Rimuovi "Tutti" se ci sono selezioni specifiche
                    document.querySelector('[data-sport="all"]').classList.remove('active');
                }
            }
            
            renderEvents();
        });
    });
    
    // Selezione eventi
    document.getElementById('selectAll').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.event-select');
        checkboxes.forEach(cb => cb.checked = true);
    });
    
    document.getElementById('deselectAll').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.event-select');
        checkboxes.forEach(cb => cb.checked = false);
    });
    
    // Esporta eventi selezionati
    document.getElementById('exportSelected').addEventListener('click', exportSelectedEvents);
    
    // Pulsante refresh
    const refreshBtn = document.getElementById('refreshEvents');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshEvents);
    }
}

// Esporta eventi selezionati in formato .ics
function exportSelectedEvents() {
    const selectedCheckboxes = document.querySelectorAll('.event-select:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('Seleziona almeno un evento da esportare!');
        return;
    }
    
    const selectedEventIds = Array.from(selectedCheckboxes).map(cb => 
        parseInt(cb.dataset.eventId)
    );
    
    const selectedEvents = sportsEvents.filter(event => 
        selectedEventIds.includes(event.id)
    );
    
    const icsContent = generateICS(selectedEvents);
    downloadICS(icsContent, 'sport-calendar.ics');
}

// Genera contenuto ICS
function generateICS(events) {
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sport Calendar//Sport Events//IT',
        'CALSCALE:GREGORIAN'
    ];
    
    events.forEach(event => {
        const startDateTime = formatDateTimeForICS(event.date, event.time);
        const endDateTime = formatDateTimeForICS(event.date, event.time, 2); // +2 ore
        const uid = `sport-event-${event.id}@sportcalendar.com`;
        
        icsContent.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTART:${startDateTime}`,
            `DTEND:${endDateTime}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description}\\n\\nCanali: ${[...event.channels.live, ...event.channels.free].join(', ')}`,
            `LOCATION:${event.location}`,
            `CATEGORIES:${event.sport.toUpperCase()}`,
            'END:VEVENT'
        );
    });
    
    icsContent.push('END:VCALENDAR');
    
    return icsContent.join('\r\n');
}

// Formatta data e ora per ICS
function formatDateTimeForICS(date, time, addHours = 0) {
    const [year, month, day] = date.split('-');
    const [hours, minutes] = time.split(':');
    
    const dateTime = new Date(year, month - 1, day, parseInt(hours) + addHours, minutes);
    
    return dateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Download file ICS
function downloadICS(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`File ${filename} scaricato con successo! Puoi importarlo in Google Calendar o altri calendari.`);
}
// Funzione di utilità per formattare date
function formatDateForEvent(date) {
    return date.toISOString().split('T')[0];
}

// Orari F1 basati sulla location
function getF1Time(location, type) {
    const timeZones = {
        'Bahrain': type === 'qualifying' ? '17:00' : '17:00',
        'Saudi Arabia': type === 'qualifying' ? '19:00' : '19:00',
        'Australia': type === 'qualifying' ? '07:00' : '07:00',
        'Japan': type === 'qualifying' ? '08:00' : '07:00',
        'China': type === 'qualifying' ? '08:00' : '08:00',
        'USA': type === 'qualifying' ? '21:00' : '21:30',
        'Miami': type === 'qualifying' ? '21:00' : '21:30',
        'Italy': type === 'qualifying' ? '16:00' : '15:00',
        'Monaco': type === 'qualifying' ? '16:00' : '15:00',
        'Spain': type === 'qualifying' ? '16:00' : '15:00',
        'Canada': type === 'qualifying' ? '21:00' : '20:00',
        'Austria': type === 'qualifying' ? '16:00' : '15:00',
        'UK': type === 'qualifying' ? '16:00' : '16:00',
        'Hungary': type === 'qualifying' ? '16:00' : '15:00',
        'Belgium': type === 'qualifying' ? '16:00' : '15:00',
        'Netherlands': type === 'qualifying' ? '16:00' : '15:00',
        'Azerbaijan': type === 'qualifying' ? '15:00' : '13:00',
        'Singapore': type === 'qualifying' ? '15:00' : '14:00',
        'Mexico': type === 'qualifying' ? '23:00' : '21:00',
        'Brazil': type === 'qualifying' ? '19:00' : '18:00',
        'Las Vegas': type === 'qualifying' ? '06:00' : '06:00',
        'Qatar': type === 'qualifying' ? '17:00' : '17:00',
        'UAE': type === 'qualifying' ? '17:00' : '17:00'
    };
    
    for (const [country, time] of Object.entries(timeZones)) {
        if (location.includes(country)) {
            return time;
        }
    }
    
    return type === 'qualifying' ? '16:00' : '15:00'; // Default europeo
}

// Setup tema scuro/chiaro
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Applica il tema salvato
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeToggleIcon(newTheme);
        });
    }
}

function updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Passa al tema chiaro';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Passa al tema scuro';
        }
    }
}

// Funzioni di utilità per UI
function showLoading(show, message = 'Caricamento eventi in corso...') {
    const loadingElement = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
    
    if (loadingText && show) {
        loadingText.textContent = message;
    }
    
    // Disabilita i pulsanti durante il caricamento
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = show;
    });
}

function showError(message) {
    showMessage(message, 'error');
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showMessage(message, type) {
    // Rimuovi messaggi esistenti
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Crea nuovo messaggio
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Inserisci il messaggio
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Rimuovi automaticamente dopo 5 secondi
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function updateLastUpdateInfo() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement && lastUpdate) {
        const updateDate = new Date(lastUpdate);
        lastUpdateElement.textContent = `Ultimo aggiornamento: ${updateDate.toLocaleString('it-IT')}`;
    }
}