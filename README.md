# Sport Calendar - Calendario Eventi Sportivi con Web Scraping

Un'applicazione web moderna che fa **vero web scraping** dai siti ufficiali degli sport e permette di esportare gli eventi in formato .ics per Google Calendar.

## 🏆 Sport Supportati

- **Formula 1**: Scraping da formula1.com (qualifiche e gare)
- **MotoGP**: Scraping da motogp.com (qualifiche e gare)  
- **Volley**: Scraping da federvolley.it (Nazionale Italiana)
- **Scherma**: Scraping da federscherma.it (competizioni internazionali)
- **Nuoto**: Scraping da federnuoto.it (Nazionale Italiana)

## ✨ Funzionalità

✅ **Vero Web Scraping**: Dati reali dai siti ufficiali con Puppeteer  
✅ **Serverless Functions**: API Vercel per scraping in tempo reale  
✅ **Filtri Multipli**: Seleziona uno o più sport contemporaneamente  
✅ **Tema Scuro/Chiaro**: Passa facilmente tra i temi  
✅ **Aggiornamento Real-Time**: Scraping on-demand dai siti  
✅ **Informazioni Complete**: Data, ora, luogo, canali TV  
✅ **Canali Gratuiti**: Indica dove vedere gli eventi gratis in differita  
✅ **Esportazione .ics**: Importa facilmente in Google Calendar  
✅ **Design Responsive**: Funziona perfettamente su desktop e mobile  

## 🚀 Deploy su Vercel (CONSIGLIATO)

### Deploy Automatico

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tuousername/sport-calendar)

### Deploy Manuale

1. **Fork questo repository**
2. **Vai su [vercel.com](https://vercel.com)**
3. **Clicca "New Project"**
4. **Importa il tuo repository GitHub**
5. **Deploy automatico!**

Il sito sarà disponibile su: `https://tuoprogetto.vercel.app`

### Sviluppo Locale

```bash
# Clona il repository
git clone https://github.com/tuousername/sport-calendar.git
cd sport-calendar

# Installa dipendenze
npm install

# Avvia sviluppo locale con Vercel CLI
npm run dev

# Oppure installa Vercel CLI globalmente
npm i -g vercel
vercel dev
```

## 📱 Come Usare

### 🕷️ Web Scraping Real-Time
- **Clicca "Aggiorna Calendario"** per fare scraping dai siti ufficiali
- **Dati sempre aggiornati** direttamente dalle fonti
- **Badge "Aggiornato dal web"** su tutti gli eventi scrapati

### 🎯 Filtri Multipli
- **Clicca "Tutti"** per vedere tutti gli eventi
- **Clicca uno sport specifico** per vedere solo quelli
- **Clicca più sport** per combinare i filtri
- I filtri si attivano/disattivano al clic

### 🌙 Tema Scuro/Chiaro
- **Clicca l'icona luna/sole** nell'header per cambiare tema
- La preferenza viene salvata automaticamente

### 📅 Esportazione per Google Calendar
1. **Seleziona gli eventi** che vuoi esportare (checkbox)
2. **Usa "Seleziona Tutti"** per selezionare tutto
3. **Clicca "Esporta Selezionati (.ics)"**
4. **Scarica il file .ics**
5. **Vai su Google Calendar** → Impostazioni → Importa ed esporta
6. **Carica il file .ics** scaricato

### 📺 Informazioni sui Canali
- **Tag normali**: Canali a pagamento (Sky, NOW TV, DAZN)
- **Tag verdi**: Canali gratuiti, spesso in differita (TV8, Rai Sport)

## 📁 Struttura del Progetto

```
sport-calendar/
├── index.html             # Pagina principale
├── styles.css             # Stili CSS con tema scuro/chiaro
├── script.js              # JavaScript con eventi statici
└── README.md              # Documentazione
```

## 🎨 Caratteristiche Tecniche

### Tema Scuro/Chiaro
- **CSS Variables** per gestione colori dinamica
- **LocalStorage** per persistenza preferenze
- **Transizioni fluide** tra i temi

### Filtri Multipli
- **Set JavaScript** per gestione selezioni multiple
- **Logica intelligente** per combinare filtri
- **UI intuitiva** con feedback visivo

### Eventi Statici
- **Dati embedded** per funzionamento senza backend
- **Simulazione aggiornamento** per UX realistica
- **Eventi futuri** aggiornati manualmente

## 🔧 Personalizzazione

### Aggiungere Nuovi Eventi
Modifica la funzione `fetchSportsEvents()` in `script.js`:

```javascript
// Aggiungi nuovi eventi nell'array appropriato
const f1Events = [
    { title: 'Nuovo GP', date: '2025-04-15', location: 'Nuova Location' },
    // ...
];
```

### Modificare i Colori del Tema
Aggiorna le CSS variables in `styles.css`:

```css
:root {
    --bg-primary: #tuocolore;
    --text-primary: #tuocolore;
    /* ... */
}
```

### Aggiungere Nuovi Sport
1. Aggiungi l'icona in `sportIcons` (script.js)
2. Aggiungi il pulsante filtro (index.html)
3. Aggiungi gli stili colore (styles.css)
4. Aggiungi gli eventi nella funzione fetch

## Contribuire

Per aggiungere nuovi sport o migliorare gli scrapers esistenti:

1. Crea un nuovo scraper in `scrapers/`
2. Aggiungi l'export in `scrapers/index.js`
3. Aggiorna `server.js` per includere il nuovo scraper
4. Aggiungi icone e stili in `script.js` e `styles.css`

## Licenza

MIT License - Vedi file LICENSE per dettagli.

## Disclaimer

Questo progetto è solo per uso educativo. Rispetta sempre i termini di servizio dei siti web che vengono sottoposti a scraping.