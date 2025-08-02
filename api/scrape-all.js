export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🚀 Inizio scraping di tutti gli sport...');
    
    const baseUrl = req.headers.host ? 
      `https://${req.headers.host}` : 
      'http://localhost:3000';
    
    // Chiama tutte le API di scraping in parallelo
    const promises = [
      fetch(`${baseUrl}/api/scrape-f1`).then(r => r.json()).catch(e => ({ success: false, sport: 'f1', events: [], error: e.message })),
      fetch(`${baseUrl}/api/scrape-motogp`).then(r => r.json()).catch(e => ({ success: false, sport: 'motogp', events: [], error: e.message })),
      fetch(`${baseUrl}/api/scrape-volley`).then(r => r.json()).catch(e => ({ success: false, sport: 'volley', events: [], error: e.message }))
    ];
    
    const results = await Promise.all(promises);
    
    // Combina tutti gli eventi
    const allEvents = [];
    const errors = [];
    const sources = [];
    
    results.forEach(result => {
      if (result.success) {
        allEvents.push(...result.events);
        sources.push(result.source);
        console.log(`✅ ${result.sport}: ${result.events.length} eventi`);
      } else {
        errors.push(`${result.sport}: ${result.error}`);
        console.log(`❌ ${result.sport}: ${result.error}`);
      }
    });
    
    // Ordina eventi per data
    allEvents.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time);
      const dateB = new Date(b.date + ' ' + b.time);
      return dateA - dateB;
    });
    
    console.log(`🎯 TOTALE: ${allEvents.length} eventi da ${sources.length} fonti`);
    
    return res.status(200).json({
      success: true,
      events: allEvents,
      total: allEvents.length,
      sources: sources,
      errors: errors,
      scraped_at: new Date().toISOString(),
      sports: {
        f1: allEvents.filter(e => e.sport === 'f1').length,
        motogp: allEvents.filter(e => e.sport === 'motogp').length,
        volley: allEvents.filter(e => e.sport === 'volley').length,
        scherma: allEvents.filter(e => e.sport === 'scherma').length,
        nuoto: allEvents.filter(e => e.sport === 'nuoto').length
      }
    });

  } catch (error) {
    console.error('❌ Errore scraping generale:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      events: []
    });
  }
}