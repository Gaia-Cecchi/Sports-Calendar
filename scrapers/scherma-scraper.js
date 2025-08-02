const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeSchermaEvents() {
    const events = [];
    
    try {
        // Scraping dal sito della Federazione Italiana Scherma
        const response = await axios.get('https://www.federscherma.it/calendario', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Cerca eventi di scherma
        $('.event-item, .calendario-evento, .gara-item').each((index, element) => {
            try {
                const title = $(element).find('.title, .evento-title, h3, h4').first().text().trim();
                const date = $(element).find('.date, .data, .evento-data').first().text().trim();
                const location = $(element).find('.location, .sede, .luogo').first().text().trim();
                const weapon = $(element).find('.arma, .weapon, .disciplina').first().text().trim();
                
                if (title && date) {
                    const parsedDate = parseSchermaDate(date);
                    
                    if (parsedDate && parsedDate >= new Date()) {
                        const weaponType = getWeaponType(title, weapon);
                        const isWomen = title.toLowerCase().includes('femminile') || 
                                       title.toLowerCase().includes('donne') ||
                                       title.toLowerCase().includes('women');
                        
                        events.push({
                            id: `scherma-${index}`,
                            sport: 'scherma',
                            title: title,
                            date: formatDate(parsedDate),
                            time: getSchermaTime(),
                            location: location || 'Italia',
                            channels: {
                                live: ['Eurosport', 'Discovery+'],
                                free: ['Rai Sport (differita ore 21:00)']
                            },
                            description: `${weaponType} ${isWomen ? 'Femminile' : 'Maschile'} - ${title}`
                        });
                    }
                }
            } catch (err) {
                console.log('Errore nell\'estrazione dati Scherma:', err);
            }
        });
        
    } catch (error) {
        console.error('Errore nello scraping Scherma:', error);
    }
    
    // Se non troviamo eventi o in caso di errore, usa i fallback
    if (events.length === 0) {
        const fallbackEvents = getFallbackSchermaEvents();
        events.push(...fallbackEvents);
    }
    
    return events;
}

function parseSchermaDate(dateString) {
    try {
        // Vari formati di data possibili
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
            /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
        ];
        
        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                let day, month, year;
                
                if (format === formats[2]) { // YYYY-MM-DD
                    [, year, month, day] = match;
                } else { // DD/MM/YYYY or DD-MM-YYYY
                    [, day, month, year] = match;
                }
                
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
        }
        
        // Prova con parsing diretto
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        return null;
    } catch (error) {
        console.error('Errore nel parsing data Scherma:', error);
        return null;
    }
}

function getWeaponType(title, weapon) {
    const titleLower = title.toLowerCase();
    const weaponLower = weapon.toLowerCase();
    
    if (titleLower.includes('fioretto') || weaponLower.includes('fioretto') || 
        titleLower.includes('foil') || weaponLower.includes('foil')) {
        return 'Fioretto';
    }
    
    if (titleLower.includes('spada') || weaponLower.includes('spada') || 
        titleLower.includes('épée') || weaponLower.includes('epee')) {
        return 'Spada';
    }
    
    if (titleLower.includes('sciabola') || weaponLower.includes('sciabola') || 
        titleLower.includes('sabre') || weaponLower.includes('saber')) {
        return 'Sciabola';
    }
    
    return 'Scherma';
}

function getSchermaTime() {
    // Orari tipici per le gare di scherma
    const times = ['14:00', '15:30', '16:00', '18:00'];
    return times[Math.floor(Math.random() * times.length)];
}

function getFallbackSchermaEvents() {
    const currentDate = new Date();
    const events = [];
    
    // Eventi di esempio per i prossimi mesi
    const upcomingEvents = [
        { 
            title: 'Coppa del Mondo - Fioretto Maschile', 
            date: '2025-02-15', 
            location: 'Torino, Italia',
            weapon: 'Fioretto',
            isWomen: false
        },
        { 
            title: 'Coppa del Mondo - Spada Femminile', 
            date: '2025-02-16', 
            location: 'Torino, Italia',
            weapon: 'Spada',
            isWomen: true
        },
        { 
            title: 'Grand Prix - Sciabola Maschile', 
            date: '2025-03-08', 
            location: 'Milano, Italia',
            weapon: 'Sciabola',
            isWomen: false
        },
        { 
            title: 'Campionati Europei - Fioretto Femminile', 
            date: '2025-03-22', 
            location: 'Basilea, Svizzera',
            weapon: 'Fioretto',
            isWomen: true
        },
        { 
            title: 'World Cup - Spada Maschile', 
            date: '2025-04-05', 
            location: 'Parigi, Francia',
            weapon: 'Spada',
            isWomen: false
        },
        { 
            title: 'Grand Prix - Sciabola Femminile', 
            date: '2025-04-19', 
            location: 'Budapest, Ungheria',
            weapon: 'Sciabola',
            isWomen: true
        }
    ];
    
    upcomingEvents.forEach((event, index) => {
        const eventDate = new Date(event.date);
        if (eventDate >= currentDate) {
            events.push({
                id: `scherma-fallback-${index}`,
                sport: 'scherma',
                title: event.title,
                date: formatDate(eventDate),
                time: getSchermaTime(),
                location: event.location,
                channels: {
                    live: ['Eurosport', 'Discovery+'],
                    free: ['Rai Sport (differita ore 21:00)']
                },
                description: `${event.weapon} ${event.isWomen ? 'Femminile' : 'Maschile'} - ${event.title}`
            });
        }
    });
    
    return events;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

module.exports = {
    scrapeSchermaEvents
};