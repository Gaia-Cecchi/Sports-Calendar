export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Test API chiamata...');
    
    // Test basic functionality
    const testData = {
      success: true,
      message: 'API funziona correttamente!',
      timestamp: new Date().toISOString(),
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
    
    console.log('✅ Test completato:', testData);
    
    return res.status(200).json(testData);
    
  } catch (error) {
    console.error('❌ Errore test API:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}