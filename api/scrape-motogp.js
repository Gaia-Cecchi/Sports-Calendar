import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let browser = null;
  
  try {
    console.log('🏍️ Inizio scraping MotoGP...');
    
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📡 Navigando verso MotoGP.com...');
    await page.goto('https://www.motogp.com/en/calendar', {
      waitUntil: 'networkidle2',
      timeout: 25000
    });

    console.log('🔍 Estraendo dati delle gare MotoGP...');
    
    const races = await page.evaluate(() => {
      const raceData = [];
      
      // Selettori per MotoGP
      const selectors = [
        '.calendar-listing__event',
        '.event-item',
        '.race-weekend',
        '.calendar-event',
        '.event-card'
      ];
      
      let raceElements = [];
      
      for (const selector of selectors) {
        raceElements = document.querySelectorAll(selector);
        if (raceElements.length > 0) {
          console.log(`Trovati ${raceElements.length} elementi MotoGP con: ${selector}`);
          break;
        }
      }
      
      // Fallback: cerca elementi che contengono "GP"
      if (raceElements.length === 0) {
        const allElements = document.querySelectorAll('*');
        const gpElements = [];
        
        allElements.forEach(el => {
          const text = el.textContent || '';
          if ((text.includes('GP ') || text.includes('Grand Prix')) && 
              text.length < 200 && text.length > 5) {
            gpElements.push(el);
          }
        });
        
        raceElements = gpElements.slice(0, 20); // Limita a 20 elementi
      }
      
      raceElements.forEach((element, index) => {
        try {
          let title = '';
          let date = '';
          let location = '';
          
          // Estrai titolo
          const titleSelectors = [
            '.event-title',
            '.race-name',
            '.calendar-listing__event-title',
            'h2', 'h3', 'h4'
          ];
          
          for (const sel of titleSelectors) {
            const titleEl = element.querySelector(sel);
            if (titleEl && titleEl.textContent.trim()) {
              title = titleEl.textContent.trim();
              break;
            }
          }
          
          if (!title) {
            const text = element.textContent.trim();
            const lines = text.split('\n').filter(line => line.trim());
            for (const line of lines) {
              if (line.includes('GP') || line.includes('Grand Prix')) {
                title = line.trim();
                break;
              }
            }
          }
          
          // Estrai data
          const dateSelectors = [
            '.event-date',
            '.race-date',
            '.calendar-listing__event-date',
            '.date',
            'time'
          ];
          
          for (const sel of dateSelectors) {
            const dateEl = element.querySelector(sel);
            if (dateEl && dateEl.textContent.trim()) {
              date = dateEl.textContent.trim();
              break;
            }
          }
          
          // Estrai location
          const locationSelectors = [
            '.event-location',
            '.location',
            '.calendar-listing__event-location',
            '.venue',
            '.circuit'
          ];
          
          for (const sel of locationSelectors) {
            const locEl = element.querySelector(sel);
            if (locEl && locEl.textContent.trim()) {
              location = locEl.textContent.trim();
              break;
            }
          }
          
          if (title && (title.includes('GP') || title.includes('Grand Prix'))) {
            raceData.push({
              title: title,
              date: date,
              location: location || 'TBD',
              index: index
            });
          }
          
        } catch (err) {
          console.log('Errore parsing MotoGP:', err);
        }
      });
      
      return raceData;
    });

    console.log(`✅ Trovate ${races.length} gare MotoGP`);
    
    // Processa i dati
    const events = [];
    const currentDate = new Date();
    
    races.forEach((race, index) => {
      try {
        let raceDate = null;
        
        if (race.date) {
          // Parsing date MotoGP (formato tipico: "10-12 Mar", "15 Apr")
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
            const match = race.date.match(pattern);
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
                raceDate = new Date(currentYear, monthNum, parseInt(day));
                break;
              }
            }
          }
        }
        
        // Fallback con date future
        if (!raceDate) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + (index * 21)); // Ogni 3 settimane
          raceDate = futureDate;
        }
        
        if (raceDate >= currentDate) {
          // Qualifiche (sabato)
          const qualifyingDate = new Date(raceDate);
          qualifyingDate.setDate(qualifyingDate.getDate() - 1);
          
          if (qualifyingDate >= currentDate) {
            events.push({
              id: `motogp-qualifying-${index}`,
              sport: 'motogp',
              title: `${race.title} - Qualifiche`,
              date: qualifyingDate.toISOString().split('T')[0],
              time: '15:10',
              location: race.location,
              channels: {
                live: ['Sky Sport MotoGP', 'NOW TV'],
                free: ['TV8 (differita ore 20:30)']
              },
              description: `Qualifiche del ${race.title}`,
              scraped: true
            });
          }
          
          // Gara (domenica)
          events.push({
            id: `motogp-race-${index}`,
            sport: 'motogp',
            title: `${race.title} - Gara`,
            date: raceDate.toISOString().split('T')[0],
            time: '14:00',
            location: race.location,
            channels: {
              live: ['Sky Sport MotoGP', 'NOW TV'],
              free: ['TV8 (differita ore 19:30)']
            },
            description: `Gran Premio: ${race.title}`,
            scraped: true
          });
        }
        
      } catch (err) {
        console.log('Errore processing MotoGP race:', err);
      }
    });

    console.log(`🎯 Processati ${events.length} eventi MotoGP`);

    return res.status(200).json({
      success: true,
      sport: 'motogp',
      events: events,
      scraped_at: new Date().toISOString(),
      source: 'motogp.com'
    });

  } catch (error) {
    console.error('❌ Errore scraping MotoGP:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      sport: 'motogp',
      events: []
    });
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}