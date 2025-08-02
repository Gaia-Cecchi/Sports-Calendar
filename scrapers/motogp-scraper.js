const puppeteer = require('puppeteer');

async function scrapeMotoGPEvents() {
    const events = [];
    
    try {
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Vai alla pagina del calendario MotoGP
        await page.goto('https://www.motogp.com/en/calendar', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Estrai i dati degli eventi
        const raceData = await page.evaluate(() => {
            const races = [];
            const raceElements = document.querySelectorAll('.calendar-listing__event');
            
            raceElements.forEach(element => {
                try {
                    const titleElement = element.querySelector('.calendar-listing__event-title');
                    const dateElement = element.querySelector('.calendar-listing__event-date');
                    const locationElement = element.querySelector('.calendar-listing__event-location');
                    
                    if (titleElement && dateElement && locationElement) {
                        races.push({
                            title: titleElement.textContent.trim(),
                            date: dateElement.textContent.trim(),
                            location: locationElement.textContent.trim()
                        });
                    }
                } catch (err) {
                    console.log('Errore nell\'estrazione dati MotoGP:', err);
                }
            });
            
            return races;
        });
        
        await browser.close();
        
        // Processa i dati estratti
        raceData.forEach((race, index) => {
            const raceDate = parseMotoGPDate(race.date);
            
            if (raceDate && raceDate >= new Date()) {
                // Qualifiche (sabato)
                const qualifyingDate = new Date(raceDate);
                qualifyingDate.setDate(qualifyingDate.getDate() - 1);
                
                events.push({
                    id: `motogp-qualifying-${index}`,
                    sport: 'motogp',
                    title: `${race.title} - Qualifiche`,
                    date: formatDate(qualifyingDate),
                    time: getMotoGPTime(race.location, 'qualifying'),
                    location: race.location,
                    channels: {
                        live: ['Sky Sport MotoGP', 'NOW TV'],
                        free: ['TV8 (differita ore 20:30)']
                    },
                    description: `Qualifiche del ${race.title}`
                });
                
                // Gara (domenica)
                events.push({
                    id: `motogp-race-${index}`,
                    sport: 'motogp',
                    title: `${race.title} - Gara`,
                    date: formatDate(raceDate),
                    time: getMotoGPTime(race.location, 'race'),
                    location: race.location,
                    channels: {
                        live: ['Sky Sport MotoGP', 'NOW TV'],
                        free: ['TV8 (differita ore 19:30)']
                    },
                    description: `Gran Premio: ${race.title}`
                });
            }
        });
        
    } catch (error) {
        console.error('Errore nello scraping MotoGP:', error);
        
        // Fallback con dati di esempio
        const fallbackEvents = getFallbackMotoGPEvents();
        events.push(...fallbackEvents);
    }
    
    return events;
}

function parseMotoGPDate(dateString) {
    try {
        // Parsing delle date MotoGP
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        // Formato tipico: "10-12 Mar" o "10 Mar"
        const parts = dateString.split(' ');
        if (parts.length >= 2) {
            const dayPart = parts[0];
            const monthStr = parts[1];
            const year = new Date().getFullYear();
            
            // Gestisce range di date (es. "10-12")
            const day = dayPart.includes('-') ? 
                parseInt(dayPart.split('-')[1]) : 
                parseInt(dayPart);
            
            const month = months[monthStr];
            
            if (!isNaN(day) && month !== undefined) {
                return new Date(year, month, day);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Errore nel parsing data MotoGP:', error);
        return null;
    }
}

function getMotoGPTime(location, type) {
    // Orari tipici basati sulla location
    const timeZones = {
        'Qatar': type === 'qualifying' ? '16:50' : '16:00',
        'Argentina': type === 'qualifying' ? '19:00' : '19:00',
        'Americas': type === 'qualifying' ? '22:00' : '21:00',
        'Spain': type === 'qualifying' ? '15:10' : '14:00',
        'France': type === 'qualifying' ? '15:10' : '14:00',
        'Italy': type === 'qualifying' ? '15:10' : '14:00',
        'Catalunya': type === 'qualifying' ? '15:10' : '14:00',
        'Germany': type === 'qualifying' ? '15:10' : '14:00',
        'Netherlands': type === 'qualifying' ? '15:10' : '14:00',
        'Finland': type === 'qualifying' ? '15:10' : '14:00',
        'Great Britain': type === 'qualifying' ? '15:10' : '14:00',
        'Austria': type === 'qualifying' ? '15:10' : '14:00',
        'San Marino': type === 'qualifying' ? '15:10' : '14:00',
        'Aragon': type === 'qualifying' ? '15:10' : '14:00',
        'Japan': type === 'qualifying' ? '08:10' : '07:00',
        'Australia': type === 'qualifying' ? '07:10' : '06:00',
        'Thailand': type === 'qualifying' ? '09:10' : '08:00',
        'Malaysia': type === 'qualifying' ? '09:10' : '08:00',
        'Indonesia': type === 'qualifying' ? '09:10' : '08:00',
        'India': type === 'qualifying' ? '12:40' : '11:30'
    };
    
    for (const [country, time] of Object.entries(timeZones)) {
        if (location.toLowerCase().includes(country.toLowerCase())) {
            return time;
        }
    }
    
    return type === 'qualifying' ? '15:10' : '14:00'; // Default europeo
}

function getFallbackMotoGPEvents() {
    const currentDate = new Date();
    const events = [];
    
    // Eventi di esempio per i prossimi mesi
    const upcomingRaces = [
        { title: 'GP Qatar', date: '2025-03-09', location: 'Losail, Qatar' },
        { title: 'GP Argentina', date: '2025-03-30', location: 'Termas de Río Hondo, Argentina' },
        { title: 'GP Americas', date: '2025-04-13', location: 'Austin, USA' },
        { title: 'GP Spagna', date: '2025-05-04', location: 'Jerez, Spagna' }
    ];
    
    upcomingRaces.forEach((race, index) => {
        const raceDate = new Date(race.date);
        if (raceDate >= currentDate) {
            const qualifyingDate = new Date(raceDate);
            qualifyingDate.setDate(qualifyingDate.getDate() - 1);
            
            events.push({
                id: `motogp-qualifying-fallback-${index}`,
                sport: 'motogp',
                title: `${race.title} - Qualifiche`,
                date: formatDate(qualifyingDate),
                time: getMotoGPTime(race.location, 'qualifying'),
                location: race.location,
                channels: {
                    live: ['Sky Sport MotoGP', 'NOW TV'],
                    free: ['TV8 (differita ore 20:30)']
                },
                description: `Qualifiche del ${race.title}`
            });
            
            events.push({
                id: `motogp-race-fallback-${index}`,
                sport: 'motogp',
                title: `${race.title} - Gara`,
                date: formatDate(raceDate),
                time: getMotoGPTime(race.location, 'race'),
                location: race.location,
                channels: {
                    live: ['Sky Sport MotoGP', 'NOW TV'],
                    free: ['TV8 (differita ore 19:30)']
                },
                description: `Gran Premio: ${race.title}`
            });
        }
    });
    
    return events;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

module.exports = {
    scrapeMotoGPEvents
};