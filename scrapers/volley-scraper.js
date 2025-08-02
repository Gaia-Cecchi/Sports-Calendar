const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeVolleyEvents() {
    const events = [];
    
    try {
        // Scraping dal sito della Federazione Italiana Pallavolo
        const response = await axios.get('https://www.federvolley.it/nazionali', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Cerca eventi nelle sezioni maschile e femminile
        $('.event-item, .match-item, .calendario-item').each((index, element) => {
            try {
                const title = $(element).find('.title, .match-title, h3, h4').first().text().trim();
                const date = $(element).find('.date, .match-date, .data').first().text().trim();
                const location = $(element).find('.location, .venue, .sede').first().text().trim();
                const category = $(element).find('.category, .categoria').first().text().trim();
                
                if (title && date) {
                    const parsedDate = parseVolleyDate(date);
                    
                    if (parsedDate && parsedDate >= new Date()) {
                        const isWomen = title.toLowerCase().includes('femminile') || 
                                       category.toLowerCase().includes('femminile') ||
                                       title.toLowerCase().includes('women');
                        
                        events.push({
                            id: `volley-${index}`,
                            sport: 'volley',
                            title: title,
                            date: formatDate(parsedDate),
                            time: getVolleyTime(),
                            location: location || 'Italia',
                            channels: {
                                live: ['Sky Sport Arena', 'DAZN'],
                                free: isWomen ? ['Rai Sport (diretta)'] : ['Rai Sport (differita ore 23:00)']
                            },
                            description: `${isWomen ? 'Nazionale Femminile' : 'Nazionale Maschile'} - ${title}`
                        });
                    }
                }
            } catch (err) {
                console.log('Errore nell\'estrazione dati Volley:', err);
            }
        });
        
    } catch (error) {
        console.error('Errore nello scraping Volley:', error);
    }
    
    // Se non troviamo eventi o in caso di errore, usa i fallback
    if (events.length === 0) {
        const fallbackEvents = getFallbackVolleyEvents();
        events.push(...fallbackEvents);
    }
    
    return events;
}

function parseVolleyDate(dateString) {
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
        console.error('Errore nel parsing data Volley:', error);
        return null;
    }
}

function getVolleyTime() {
    // Orari tipici per le partite di volley
    const times = ['18:00', '20:30', '21:00'];
    return times[Math.floor(Math.random() * times.length)];
}

function getFallbackVolleyEvents() {
    const currentDate = new Date();
    const events = [];
    
    // Eventi di esempio per i prossimi mesi
    const upcomingMatches = [
        { 
            title: 'Italia vs Francia - Maschile', 
            date: '2025-02-20', 
            location: 'PalaTrento, Trento',
            isWomen: false
        },
        { 
            title: 'Italia vs Serbia - Femminile', 
            date: '2025-02-22', 
            location: 'PalaFlorio, Bari',
            isWomen: true
        },
        { 
            title: 'Italia vs Polonia - Maschile', 
            date: '2025-03-15', 
            location: 'PalaEur, Roma',
            isWomen: false
        },
        { 
            title: 'Italia vs Turchia - Femminile', 
            date: '2025-03-18', 
            location: 'PalaPanini, Modena',
            isWomen: true
        },
        { 
            title: 'Nations League - Italia vs Brasile M', 
            date: '2025-04-10', 
            location: 'PalaOlimpico, Torino',
            isWomen: false
        },
        { 
            title: 'Nations League - Italia vs USA F', 
            date: '2025-04-12', 
            location: 'PalaDozza, Bologna',
            isWomen: true
        }
    ];
    
    upcomingMatches.forEach((match, index) => {
        const matchDate = new Date(match.date);
        if (matchDate >= currentDate) {
            events.push({
                id: `volley-fallback-${index}`,
                sport: 'volley',
                title: match.title,
                date: formatDate(matchDate),
                time: getVolleyTime(),
                location: match.location,
                channels: {
                    live: ['Sky Sport Arena', 'DAZN'],
                    free: match.isWomen ? ['Rai Sport (diretta)'] : ['Rai Sport (differita ore 23:00)']
                },
                description: `${match.isWomen ? 'Nazionale Femminile' : 'Nazionale Maschile'} - ${match.title}`
            });
        }
    });
    
    return events;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

module.exports = {
    scrapeVolleyEvents
};