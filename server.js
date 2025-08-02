const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const scrapers = require('./scrapers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache degli eventi
let eventsCache = [];
let lastUpdate = null;

// Endpoint per ottenere tutti gli eventi
app.get('/api/events', async (req, res) => {
    try {
        const { sport } = req.query;
        
        let events = eventsCache;
        
        if (sport && sport !== 'all') {
            events = eventsCache.filter(event => event.sport === sport);
        }
        
        res.json({
            events,
            lastUpdate,
            total: events.length
        });
    } catch (error) {
        console.error('Errore nel recupero eventi:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Endpoint per aggiornare manualmente gli eventi
app.post('/api/refresh', async (req, res) => {
    try {
        console.log('Aggiornamento manuale degli eventi...');
        await updateEvents();
        res.json({ 
            message: 'Eventi aggiornati con successo',
            total: eventsCache.length,
            lastUpdate 
        });
    } catch (error) {
        console.error('Errore nell\'aggiornamento:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento degli eventi' });
    }
});

// Endpoint per statistiche
app.get('/api/stats', (req, res) => {
    const stats = {
        totalEvents: eventsCache.length,
        lastUpdate,
        eventsBySport: {}
    };
    
    eventsCache.forEach(event => {
        stats.eventsBySport[event.sport] = (stats.eventsBySport[event.sport] || 0) + 1;
    });
    
    res.json(stats);
});

// Funzione per aggiornare gli eventi
async function updateEvents() {
    try {
        console.log('Inizio aggiornamento eventi...');
        
        const allEvents = [];
        
        // Scraping Formula 1
        console.log('Scraping Formula 1...');
        const f1Events = await scrapers.scrapeF1();
        allEvents.push(...f1Events);
        
        // Scraping MotoGP
        console.log('Scraping MotoGP...');
        const motogpEvents = await scrapers.scrapeMotoGP();
        allEvents.push(...motogpEvents);
        
        // Scraping Volley
        console.log('Scraping Volley...');
        const volleyEvents = await scrapers.scrapeVolley();
        allEvents.push(...volleyEvents);
        
        // Scraping Scherma
        console.log('Scraping Scherma...');
        const schermaEvents = await scrapers.scrapeScherma();
        allEvents.push(...schermaEvents);
        
        // Scraping Nuoto
        console.log('Scraping Nuoto...');
        const nuotoEvents = await scrapers.scrapeNuoto();
        allEvents.push(...nuotoEvents);
        
        // Ordina eventi per data
        allEvents.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
        
        eventsCache = allEvents;
        lastUpdate = new Date().toISOString();
        
        console.log(`Aggiornamento completato: ${allEvents.length} eventi trovati`);
        
    } catch (error) {
        console.error('Errore nell\'aggiornamento degli eventi:', error);
        throw error;
    }
}

// Programma aggiornamento automatico ogni 6 ore
cron.schedule('0 */6 * * *', async () => {
    console.log('Aggiornamento automatico programmato...');
    try {
        await updateEvents();
    } catch (error) {
        console.error('Errore nell\'aggiornamento automatico:', error);
    }
});

// Avvio del server
app.listen(PORT, async () => {
    console.log(`Server avviato su porta ${PORT}`);
    
    // Primo caricamento degli eventi
    try {
        await updateEvents();
        console.log('Eventi iniziali caricati con successo');
    } catch (error) {
        console.error('Errore nel caricamento iniziale:', error);
    }
});

module.exports = app;