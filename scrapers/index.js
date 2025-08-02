const f1Scraper = require('./f1-scraper');
const motogpScraper = require('./motogp-scraper');
const volleyScraper = require('./volley-scraper');
const schermaScraper = require('./scherma-scraper');
const nuotoScraper = require('./nuoto-scraper');

module.exports = {
    scrapeF1: f1Scraper.scrapeF1Events,
    scrapeMotoGP: motogpScraper.scrapeMotoGPEvents,
    scrapeVolley: volleyScraper.scrapeVolleyEvents,
    scrapeScherma: schermaScraper.scrapeSchermaEvents,
    scrapeNuoto: nuotoScraper.scrapeNuotoEvents
};