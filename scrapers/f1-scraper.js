const puppeteer = require('puppeteer');
const axios = require('axios');

async function scrapeF1Events() {
    const events = [];
    
    try {
        // Scraping dal sito ufficiale Formula 1
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Vai alla pagina del calendario F1
        await page.goto('https://www.formula1.com/en/racing/2025.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Estrai i dati degli eventi
        const raceData = await page.evaluate(() => {
            const races = [];
            const raceElements = document.querySelectorAll('[data-testid="race-header-card"]');
            
            raceElements.forEach(element => {
                try {
                    const titleElement = element.querySelector('[data-testid="race-header-title"]');
                    const dateElement = element.querySelector('[data-testid="race-header-date"]');
                    const locationElement = element.querySelector('[data-testid="race-header-location"]');
                    
                    if (titleElement && dateElement && locationElement) {
                        races.push({
                            title: titleElement.textContent.trim(),
                            date: dateElement.textContent.trim(),
                            location: locationElement.textContent.trim()
                        });
                    }
                } catch (err) {
                    console.log('Errore nell\'estrazione dati F1:', err);
                }
            });
            
            return races;
        });
        
        await browser.close();
        
        // Processa i dati estratti
        raceData.forEach((race, index) => {
            const raceDate = parseF1Date(race.date);
            
            if (raceDate && raceDate >= new Date()) {
                // Qualifiche (sabato)
                const qualifyingDate = new Date(raceDate);
                qualifyingDate.setDate(qualifyingDate.getDate() - 1);
                
                events.push({
                    id: `f1-qualifying-${index}`,
                    sport: 'f1',
                    title: `${race.title} - Qualifiche`,
                    date: formatDate(qualifyingDate),
                    time: getF1Time(race.location, 'qualifying'),
                    location: race.location,
                    channels: {
                        live: ['Sky Sport F1', 'NOW TV'],
                        free: ['TV8 (differita ore 18:30)']
                    },
                    description: `Qualifiche del ${race.title}`
                });
                
                // Gara (domenica)
                events.push({
                    id: `f1-race-${index}`,
                    sport: 'f1',
                    title: `${race.title} - Gara`,
                    date: formatDate(raceDate),
                    time: getF1Time(race.location, 'race'),
                    location: race.location,
                    channels: {
                        live: ['Sky Sport F1', 'NOW TV'],
                        free: ['TV8 (differita ore 18:00)']
                    },
                    description: `Gran Premio: ${race.title}`
                });
            }
        });
        
    } catch (error) {
        console.error('Errore nello scraping F1:', error);
        
        // Fallback con dati di esempio se lo scraping fallisce
        const fallbackEvents = getFallbackF1Events();
        events.push(...fallbackEvents);
    }
    
    return events;
}

function parseF1Date(dateString) {
    try {
        // Parsing delle date F1 (formato variabile)
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const parts = dateString.split(' ');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            const year = parseInt(parts[2]) || new Date().getFullYear();
            
            return new Date(year, month, day);
        }
        
        return null;
    } catch (error) {
        console.error('Errore nel parsing data F1:', error);
        return null;
    }
}

function getF1Time(location, type) {
    // Orari tipici basati sulla location
    const timeZones = {
        'Australia': type === 'qualifying' ? '07:00' : '07:00',
        'Bahrain': type === 'qualifying' ? '17:00' : '17:00',
        'Saudi Arabia': type === 'qualifying' ? '19:00' : '19:00',
        'Japan': type === 'qualifying' ? '08:00' : '07:00',
        'China': type === 'qualifying' ? '08:00' : '08:00',
        'Miami': type === 'qualifying' ? '21:00' : '21:30',
        'Imola': type === 'qualifying' ? '16:00' : '15:00',
        'Monaco': type === 'qualifying' ? '16:00' : '15:00',
        'Canada': type === 'qualifying' ? '21:00' : '20:00',
        'Spain': type === 'qualifying' ? '16:00' : '15:00',
        'Austria': type === 'qualifying' ? '16:00' : '15:00',
        'Great Britain': type === 'qualifying' ? '16:00' : '16:00',
        'Hungary': type === 'qualifying' ? '16:00' : '15:00',
        'Belgium': type === 'qualifying' ? '16:00' : '15:00',
        'Netherlands': type === 'qualifying' ? '16:00' : '15:00',
        'Italy': type === 'qualifying' ? '16:00' : '15:00',
        'Azerbaijan': type === 'qualifying' ? '15:00' : '13:00',
        'Singapore': type === 'qualifying' ? '15:00' : '14:00',
        'United States': type === 'qualifying' ? '23:00' : '21:00',
        'Mexico': type === 'qualifying' ? '23:00' : '21:00',
        'Brazil': type === 'qualifying' ? '19:00' : '18:00',
        'Las Vegas': type === 'qualifying' ? '06:00' : '06:00',
        'Qatar': type === 'qualifying' ? '17:00' : '17:00',
        'Abu Dhabi': type === 'qualifying' ? '17:00' : '17:00'
    };
    
    for (const [country, time] of Object.entries(timeZones)) {
        if (location.includes(country)) {
            return time;
        }
    }
    
    return type === 'qualifying' ? '16:00' : '15:00'; // Default europeo
}

function getFallbackF1Events() {
    const currentDate = new Date();
    const events = [];
    
    // Eventi di esempio per i prossimi mesi
    const upcomingRaces = [
        { title: 'GP Australia', date: '2025-03-16', location: 'Melbourne, Australia' },
        { title: 'GP Bahrain', date: '2025-03-30', location: 'Sakhir, Bahrain' },
        { title: 'GP Arabia Saudita', date: '2025-04-13', location: 'Jeddah, Arabia Saudita' },
        { title: 'GP Giappone', date: '2025-04-27', location: 'Suzuka, Giappone' }
    ];
    
    upcomingRaces.forEach((race, index) => {
        const raceDate = new Date(race.date);
        if (raceDate >= currentDate) {
            const qualifyingDate = new Date(raceDate);
            qualifyingDate.setDate(qualifyingDate.getDate() - 1);
            
            events.push({
                id: `f1-qualifying-fallback-${index}`,
                sport: 'f1',
                title: `${race.title} - Qualifiche`,
                date: formatDate(qualifyingDate),
                time: getF1Time(race.location, 'qualifying'),
                location: race.location,
                channels: {
                    live: ['Sky Sport F1', 'NOW TV'],
                    free: ['TV8 (differita ore 18:30)']
                },
                description: `Qualifiche del ${race.title}`
            });
            
            events.push({
                id: `f1-race-fallback-${index}`,
                sport: 'f1',
                title: `${race.title} - Gara`,
                date: formatDate(raceDate),
                time: getF1Time(race.location, 'race'),
                location: race.location,
                channels: {
                    live: ['Sky Sport F1', 'NOW TV'],
                    free: ['TV8 (differita ore 18:00)']
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
    scrapeF1Events
};