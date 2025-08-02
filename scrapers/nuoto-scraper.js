const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeNuotoEvents() {
    const events = [];
    
    try {
        // Scraping dal sito della Federazione Italiana Nuoto
        const response = await axios.get('https://www.federnuoto.it/home/fin/calendario-gare.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Cerca eventi di nuoto
        $('.event-item, .gara-item, .calendario-evento').each((index, element) => {
            try {
                const title = $(element).find('.title, .gara-title, h3, h4').first().text().trim();
                const date = $(element).find('.date, .data, .gara-data').first().text().trim();
                const location = $(element).find('.location, .sede, .luogo').first().text().trim();
                const category = $(element).find('.category, .categoria, .tipo').first().text().trim();
                
                if (title && date) {
                    const parsedDate = parseNuotoDate(date);
                    
                    if (parsedDate && parsedDate >= new Date()) {
                        const isWomen = title.toLowerCase().includes('femminile') || 
                                       title.toLowerCase().includes('donne') ||
                                       category.toLowerCase().includes('femminile');
                        
                        const eventType = getNuotoEventType(title, category);
                        
                        events.push({
                            id: `nuoto-${index}`,
                            sport: 'nuoto',
                            title: title,
                            date: formatDate(parsedDate),
                            time: getNuotoTime(eventType),
                            location: location || 'Italia',
                            channels: {
                                live: ['Sky Sport Arena', 'Rai Sport'],
                                free: ['Rai Sport (diretta)']
                            },
                            description: `${eventType} ${isWomen ? 'Femminile' : 'Maschile'} - ${title}`
                        });
                    }
                }
            } catch (err) {
                console.log('Errore nell\'estrazione dati Nuoto:', err);
            }
        });
        
    } catch (error) {
        console.error('Errore nello scraping Nuoto:', error);
    }
    
    // Se non troviamo eventi o in caso di errore, usa i fallback
    if (events.length === 0) {
        const fallbackEvents = getFallbackNuotoEvents();
        events.push(...fallbackEvents);
    }
    
    return events;
}

function parseNuotoDate(dateString) {
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
        console.error('Errore nel parsing data Nuoto:', error);
        return null;
    }
}

function getNuotoEventType(title, category) {
    const titleLower = title.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    if (titleLower.includes('campionati italiani') || categoryLower.includes('campionati')) {
        return 'Campionati Italiani';
    }
    
    if (titleLower.includes('europei') || categoryLower.includes('europei')) {
        return 'Campionati Europei';
    }
    
    if (titleLower.includes('mondiali') || categoryLower.includes('mondiali')) {
        return 'Campionati Mondiali';
    }
    
    if (titleLower.includes('coppa') || categoryLower.includes('coppa')) {
        return 'Coppa del Mondo';
    }
    
    if (titleLower.includes('trofeo') || categoryLower.includes('trofeo')) {
        return 'Trofeo';
    }
    
    return 'Gara di Nuoto';
}

function getNuotoTime(eventType) {
    // Orari tipici per le gare di nuoto
    if (eventType.includes('Campionati')) {
        return Math.random() > 0.5 ? '18:00' : '18:30';
    }
    
    const times = ['17:30', '18:00', '18:30', '19:00'];
    return times[Math.floor(Math.random() * times.length)];
}

function getFallbackNuotoEvents() {
    const currentDate = new Date();
    const events = [];
    
    // Eventi di esempio per i prossimi mesi
    const upcomingEvents = [
        { 
            title: 'Campionati Italiani Assoluti - Giorno 1', 
            date: '2025-03-25', 
            location: 'Riccione, Italia',
            type: 'Campionati Italiani',
            isWomen: false
        },
        { 
            title: 'Campionati Italiani Assoluti - Giorno 2', 
            date: '2025-03-26', 
            location: 'Riccione, Italia',
            type: 'Campionati Italiani',
            isWomen: true
        },
        { 
            title: 'Campionati Italiani Assoluti - Finali', 
            date: '2025-03-30', 
            location: 'Riccione, Italia',
            type: 'Campionati Italiani',
            isWomen: false
        },
        { 
            title: 'Trofeo Settecolli - Sessione Mattutina', 
            date: '2025-06-15', 
            location: 'Roma, Italia',
            type: 'Trofeo',
            isWomen: false
        },
        { 
            title: 'Trofeo Settecolli - Sessione Serale', 
            date: '2025-06-15', 
            location: 'Roma, Italia',
            type: 'Trofeo',
            isWomen: true
        },
        { 
            title: 'Campionati Europei - Batterie', 
            date: '2025-08-12', 
            location: 'Belgrado, Serbia',
            type: 'Campionati Europei',
            isWomen: false
        },
        { 
            title: 'Campionati Europei - Finali', 
            date: '2025-08-12', 
            location: 'Belgrado, Serbia',
            type: 'Campionati Europei',
            isWomen: true
        }
    ];
    
    upcomingEvents.forEach((event, index) => {
        const eventDate = new Date(event.date);
        if (eventDate >= currentDate) {
            events.push({
                id: `nuoto-fallback-${index}`,
                sport: 'nuoto',
                title: event.title,
                date: formatDate(eventDate),
                time: getNuotoTime(event.type),
                location: event.location,
                channels: {
                    live: ['Sky Sport Arena', 'Rai Sport'],
                    free: ['Rai Sport (diretta)']
                },
                description: `${event.type} ${event.isWomen ? 'Femminile' : 'Maschile'} - ${event.title}`
            });
        }
    });
    
    return events;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

module.exports = {
    scrapeNuotoEvents
};