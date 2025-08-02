// Configurazione API per eventi sportivi
const API_CONFIG = {
    // API Formula 1 (Ergast)
    F1_API: {
        base_url: 'https://ergast.com/api/f1',
        current_season: '/current.json',
        timeout: 10000
    },
    
    // API MotoGP (dati statici aggiornati)
    MOTOGP_CALENDAR_2025: [
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
    ],
    
    // Canali TV per sport
    TV_CHANNELS: {
        f1: {
            live: ['Sky Sport F1', 'NOW TV'],
            free: {
                qualifying: ['TV8 (differita ore 18:30)'],
                race: ['TV8 (differita ore 18:00)']
            }
        },
        motogp: {
            live: ['Sky Sport MotoGP', 'NOW TV'],
            free: {
                qualifying: ['TV8 (differita ore 20:30)'],
                race: ['TV8 (differita ore 19:30)']
            }
        },
        volley: {
            live: ['Sky Sport Arena', 'DAZN'],
            free: {
                men: ['Rai Sport (differita ore 23:00)'],
                women: ['Rai Sport (diretta)']
            }
        },
        scherma: {
            live: ['Eurosport', 'Discovery+'],
            free: ['Rai Sport (differita ore 21:00)']
        },
        nuoto: {
            live: ['Sky Sport Arena', 'Rai Sport'],
            free: ['Rai Sport (diretta)']
        }
    },
    
    // Orari tipici per timezone
    TYPICAL_TIMES: {
        f1: {
            qualifying: '16:00',
            race: '15:00'
        },
        motogp: {
            qualifying: '15:10',
            race: '14:00'
        },
        volley: '20:30',
        scherma: '15:00',
        nuoto: {
            morning: '09:00',
            evening: '18:30'
        }
    }
};

// Esporta la configurazione per uso globale
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
}