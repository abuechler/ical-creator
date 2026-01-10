/**
 * Escola Ferienplan Finder
 *
 * Automatically finds and downloads Ferienplan PDFs from Escola-based school websites.
 *
 * Usage: node escola-finder.js --bezirk <bezirk-name> [--dry-run]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  baseDir: path.join(__dirname, '..'),
  delayMs: 1500,  // Delay between requests
  timeoutMs: 10000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Domain patterns to try for school websites
const DOMAIN_PATTERNS = [
  'https://www.schule-{name}.ch',
  'https://www.{name}-schule.ch',
  'https://www.schule{name}.ch',
  'https://www.ps-{name}.ch',
  'https://www.primarschule-{name}.ch',
  'https://www.schulen-{name}.ch',
  'https://schule-{name}.ch',
  'https://schule.{name}.ch',
];

// Ferienplan page patterns to search
const FERIENPLAN_PATTERNS = [
  '/ferienplan',
  '/schulorganisation/download/',
  '/informationen/ferienplan',
  '/aktuelles/ferienplan',
  '/downloads',
  '/dokumente',
  '/service/downloads',
  '/ueber-uns/ferienplan',
];

// Gemeinden by Bezirk (BFS data)
const BEZIRKE = {
  affoltern: {
    bfs: 101,
    gemeinden: [
      { bfs: 1, name: 'Aeugst am Albis' },
      { bfs: 2, name: 'Affoltern am Albis' },
      { bfs: 3, name: 'Bonstetten' },
      { bfs: 4, name: 'Hausen am Albis' },
      { bfs: 5, name: 'Hedingen' },
      { bfs: 6, name: 'Kappel am Albis' },
      { bfs: 7, name: 'Knonau' },
      { bfs: 8, name: 'Maschwanden' },
      { bfs: 9, name: 'Mettmenstetten' },
      { bfs: 10, name: 'Obfelden' },
      { bfs: 11, name: 'Ottenbach' },
      { bfs: 12, name: 'Rifferswil' },
      { bfs: 13, name: 'Stallikon' },
      { bfs: 14, name: 'Wettswil am Albis' },
    ]
  },
  andelfingen: {
    bfs: 102,
    gemeinden: [
      { bfs: 21, name: 'Adlikon' },
      { bfs: 22, name: 'Andelfingen' },
      { bfs: 23, name: 'Benken' },
      { bfs: 24, name: 'Berg am Irchel' },
      { bfs: 25, name: 'Buch am Irchel' },
      { bfs: 26, name: 'Dachsen' },
      { bfs: 27, name: 'Dorf' },
      { bfs: 28, name: 'Feuerthalen' },
      { bfs: 29, name: 'Flaach' },
      { bfs: 30, name: 'Flurlingen' },
      { bfs: 31, name: 'Henggart' },
      { bfs: 32, name: 'Humlikon' },
      { bfs: 33, name: 'Kleinandelfingen' },
      { bfs: 34, name: 'Laufen-Uhwiesen' },
      { bfs: 35, name: 'Marthalen' },
      { bfs: 36, name: 'Ossingen' },
      { bfs: 37, name: 'Rheinau' },
      { bfs: 38, name: 'Thalheim an der Thur' },
      { bfs: 39, name: 'Trüllikon' },
      { bfs: 40, name: 'Volken' },
    ]
  },
  dielsdorf: {
    bfs: 104,
    gemeinden: [
      { bfs: 81, name: 'Bachs' },
      { bfs: 82, name: 'Boppelsen' },
      { bfs: 83, name: 'Buchs' },
      { bfs: 84, name: 'Dällikon' },
      { bfs: 85, name: 'Dänikon' },
      { bfs: 86, name: 'Dielsdorf' },
      { bfs: 87, name: 'Hüttikon' },
      { bfs: 88, name: 'Neerach' },
      { bfs: 89, name: 'Niederglatt' },
      { bfs: 90, name: 'Niederhasli' },
      { bfs: 91, name: 'Niederweningen' },
      { bfs: 92, name: 'Oberglatt' },
      { bfs: 93, name: 'Oberweningen' },
      { bfs: 94, name: 'Otelfingen' },
      { bfs: 95, name: 'Regensberg' },
      { bfs: 96, name: 'Regensdorf' },
      { bfs: 97, name: 'Rümlang' },
      { bfs: 98, name: 'Schleinikon' },
      { bfs: 99, name: 'Schöfflisdorf' },
      { bfs: 100, name: 'Stadel' },
      { bfs: 101, name: 'Steinmaur' },
      { bfs: 102, name: 'Weiach' },
    ]
  },
  dietikon: {
    bfs: 105,
    gemeinden: [
      { bfs: 241, name: 'Aesch' },
      { bfs: 242, name: 'Birmensdorf' },
      { bfs: 243, name: 'Dietikon' },
      { bfs: 244, name: 'Geroldswil' },
      { bfs: 245, name: 'Oberengstringen' },
      { bfs: 246, name: 'Oetwil an der Limmat' },
      { bfs: 247, name: 'Schlieren' },
      { bfs: 248, name: 'Spreitenbach' },
      { bfs: 249, name: 'Uitikon' },
      { bfs: 250, name: 'Unterengstringen' },
      { bfs: 251, name: 'Urdorf' },
    ]
  },
  hinwil: {
    bfs: 106,
    gemeinden: [
      { bfs: 111, name: 'Bäretswil' },
      { bfs: 112, name: 'Bubikon' },
      { bfs: 113, name: 'Dürnten' },
      { bfs: 114, name: 'Fischenthal' },
      { bfs: 115, name: 'Gossau' },
      { bfs: 116, name: 'Grüningen' },
      { bfs: 117, name: 'Hinwil' },
      { bfs: 118, name: 'Rüti' },
      { bfs: 119, name: 'Seegräben' },
      { bfs: 120, name: 'Wald' },
      { bfs: 121, name: 'Wetzikon' },
    ]
  },
  horgen: {
    bfs: 107,
    gemeinden: [
      { bfs: 131, name: 'Adliswil' },
      { bfs: 132, name: 'Hirzel' },
      { bfs: 133, name: 'Horgen' },
      { bfs: 134, name: 'Hütten' },
      { bfs: 135, name: 'Kilchberg' },
      { bfs: 136, name: 'Langnau am Albis' },
      { bfs: 137, name: 'Oberrieden' },
      { bfs: 138, name: 'Richterswil' },
      { bfs: 139, name: 'Rüschlikon' },
      { bfs: 140, name: 'Schönenberg' },
      { bfs: 141, name: 'Thalwil' },
      { bfs: 142, name: 'Wädenswil' },
    ]
  },
  meilen: {
    bfs: 108,
    gemeinden: [
      { bfs: 151, name: 'Erlenbach' },
      { bfs: 152, name: 'Herrliberg' },
      { bfs: 153, name: 'Hombrechtikon' },
      { bfs: 154, name: 'Küsnacht' },
      { bfs: 155, name: 'Männedorf' },
      { bfs: 156, name: 'Meilen' },
      { bfs: 157, name: 'Oetwil am See' },
      { bfs: 158, name: 'Stäfa' },
      { bfs: 159, name: 'Uetikon am See' },
      { bfs: 160, name: 'Zollikon' },
      { bfs: 161, name: 'Zumikon' },
    ]
  },
  pfaeffikon: {
    bfs: 109,
    gemeinden: [
      { bfs: 171, name: 'Bauma' },
      { bfs: 172, name: 'Fehraltorf' },
      { bfs: 173, name: 'Hittnau' },
      { bfs: 174, name: 'Illnau-Effretikon' },
      { bfs: 175, name: 'Kyburg' },
      { bfs: 176, name: 'Lindau' },
      { bfs: 177, name: 'Pfäffikon' },
      { bfs: 178, name: 'Russikon' },
      { bfs: 179, name: 'Sternenberg' },
      { bfs: 180, name: 'Weisslingen' },
      { bfs: 181, name: 'Wila' },
      { bfs: 182, name: 'Wildberg' },
    ]
  },
  uster: {
    bfs: 110,
    gemeinden: [
      { bfs: 191, name: 'Dübendorf' },
      { bfs: 192, name: 'Egg' },
      { bfs: 193, name: 'Fällanden' },
      { bfs: 194, name: 'Greifensee' },
      { bfs: 195, name: 'Maur' },
      { bfs: 196, name: 'Mönchaltorf' },
      { bfs: 197, name: 'Schwerzenbach' },
      { bfs: 198, name: 'Uster' },
      { bfs: 199, name: 'Volketswil' },
      { bfs: 200, name: 'Wangen-Brüttisellen' },
    ]
  },
  winterthur: {
    bfs: 111,
    gemeinden: [
      { bfs: 211, name: 'Brütten' },
      { bfs: 212, name: 'Dägerlen' },
      { bfs: 213, name: 'Dinhard' },
      { bfs: 214, name: 'Elgg' },
      { bfs: 215, name: 'Ellikon an der Thur' },
      { bfs: 216, name: 'Elsau' },
      { bfs: 217, name: 'Hagenbuch' },
      { bfs: 218, name: 'Hofstetten' },
      { bfs: 219, name: 'Neftenbach' },
      { bfs: 220, name: 'Pfungen' },
      { bfs: 221, name: 'Rickenbach' },
      { bfs: 222, name: 'Schlatt' },
      { bfs: 223, name: 'Seuzach' },
      { bfs: 224, name: 'Turbenthal' },
      { bfs: 225, name: 'Wiesendangen' },
      { bfs: 226, name: 'Winterthur' },
      { bfs: 227, name: 'Zell' },
    ]
  },
  zuerich: {
    bfs: 112,
    gemeinden: [
      { bfs: 261, name: 'Zürich' },
    ]
  }
};

/**
 * Normalize gemeinde name for URL matching
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/\s+am\s+.*/i, '')  // Remove "am Albis" etc.
    .replace(/\s+an\s+.*/i, '')  // Remove "an der Thur" etc.
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '');
}

/**
 * Check if URL exists (returns HTTP 200)
 */
async function checkUrl(page, url) {
  try {
    const response = await page.goto(url, {
      timeout: CONFIG.timeoutMs,
      waitUntil: 'domcontentloaded'
    });
    return response && response.status() === 200;
  } catch {
    return false;
  }
}

/**
 * Detect if page is Escola-based
 */
async function isEscola(page) {
  try {
    const indicators = await page.evaluate(() => {
      const html = document.documentElement.innerHTML;
      return (
        html.includes('escola') ||
        html.includes('Escola') ||
        html.includes('/download.php?action=download') ||
        document.querySelector('meta[name="generator"][content*="escola"]') !== null
      );
    });
    return indicators;
  } catch {
    return false;
  }
}

/**
 * Search for Ferienplan links on page
 */
async function findFerienplanLinks(page) {
  try {
    const links = await page.evaluate(() => {
      const results = [];
      const anchors = document.querySelectorAll('a');

      for (const a of anchors) {
        const href = a.href || '';
        const text = (a.textContent || '').toLowerCase();

        if (
          (text.includes('ferien') || text.includes('ferienplan')) &&
          (href.includes('.pdf') || href.includes('download'))
        ) {
          results.push({
            href: href,
            text: a.textContent.trim(),
            isPdf: href.toLowerCase().includes('.pdf') || href.includes('download_type=3')
          });
        }
      }
      return results;
    });
    return links;
  } catch {
    return [];
  }
}

/**
 * Find school website for a gemeinde
 */
async function findSchoolWebsite(page, gemeinde) {
  const normalized = normalizeName(gemeinde.name);

  for (const pattern of DOMAIN_PATTERNS) {
    const url = pattern.replace('{name}', normalized);
    console.log(`  Trying: ${url}`);

    if (await checkUrl(page, url)) {
      return { url, found: true };
    }

    await new Promise(r => setTimeout(r, 500)); // Small delay between attempts
  }

  return { url: null, found: false };
}

/**
 * Search for Ferienplan on school website
 */
async function findFerienplan(page, baseUrl) {
  // First check current page for links
  let links = await findFerienplanLinks(page);
  if (links.length > 0) {
    return { found: true, links, path: '/' };
  }

  // Try common paths
  for (const pathPattern of FERIENPLAN_PATTERNS) {
    const url = baseUrl + pathPattern;
    console.log(`    Checking: ${pathPattern}`);

    try {
      if (await checkUrl(page, url)) {
        links = await findFerienplanLinks(page);
        if (links.length > 0) {
          return { found: true, links, path: pathPattern };
        }
      }
    } catch {
      // Continue to next pattern
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return { found: false, links: [], path: null };
}

/**
 * Download PDF file
 */
async function downloadPdf(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https.get(url, {
      headers: { 'User-Agent': CONFIG.userAgent }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(true);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      }
    }).on('error', reject);
  });
}

/**
 * Process a single Bezirk
 */
async function processBezirk(bezirkName, dryRun = false) {
  const bezirk = BEZIRKE[bezirkName.toLowerCase()];
  if (!bezirk) {
    console.error(`Unknown Bezirk: ${bezirkName}`);
    console.log('Available:', Object.keys(BEZIRKE).join(', '));
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing Bezirk ${bezirkName} (${bezirk.gemeinden.length} Gemeinden)`);
  console.log(`${'='.repeat(60)}\n`);

  const results = {
    bezirk: bezirkName,
    timestamp: new Date().toISOString(),
    gemeinden: [],
    summary: {
      total: bezirk.gemeinden.length,
      websiteFound: 0,
      escolaDetected: 0,
      pdfFound: 0,
      pdfDownloaded: 0,
      manualRequired: 0
    }
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: CONFIG.userAgent
  });
  const page = await context.newPage();

  for (const gemeinde of bezirk.gemeinden) {
    console.log(`\n[${gemeinde.bfs}] ${gemeinde.name}`);

    const result = {
      bfs: gemeinde.bfs,
      name: gemeinde.name,
      website: null,
      isEscola: false,
      ferienplanPath: null,
      pdfLinks: [],
      downloaded: [],
      status: 'pending'
    };

    // Find school website
    const website = await findSchoolWebsite(page, gemeinde);
    if (website.found) {
      result.website = website.url;
      results.summary.websiteFound++;
      console.log(`  ✓ Found: ${website.url}`);

      // Check if Escola
      result.isEscola = await isEscola(page);
      if (result.isEscola) {
        results.summary.escolaDetected++;
        console.log(`  ✓ Escola platform detected`);
      }

      // Search for Ferienplan
      const ferienplan = await findFerienplan(page, website.url);
      if (ferienplan.found) {
        result.ferienplanPath = ferienplan.path;
        result.pdfLinks = ferienplan.links;
        results.summary.pdfFound++;
        console.log(`  ✓ Ferienplan found: ${ferienplan.links.length} PDF(s)`);

        // Download PDFs
        if (!dryRun) {
          const dataDir = path.join(CONFIG.baseDir, 'data', 'zh', bezirkName.toLowerCase());
          fs.mkdirSync(dataDir, { recursive: true });

          for (const link of ferienplan.links.filter(l => l.isPdf)) {
            const filename = `${normalizeName(gemeinde.name)}-ferienplan.pdf`;
            const destPath = path.join(dataDir, filename);

            try {
              await downloadPdf(link.href, destPath);
              result.downloaded.push(filename);
              results.summary.pdfDownloaded++;
              console.log(`  ✓ Downloaded: ${filename}`);
            } catch (err) {
              console.log(`  ✗ Download failed: ${err.message}`);
            }
          }
        }

        result.status = 'automated';
      } else {
        result.status = 'manual_required';
        results.summary.manualRequired++;
        console.log(`  → Manual search required`);
      }
    } else {
      result.status = 'manual_required';
      results.summary.manualRequired++;
      console.log(`  → Website not found, manual search required`);
    }

    results.gemeinden.push(result);
    await new Promise(r => setTimeout(r, CONFIG.delayMs));
  }

  await browser.close();

  // Save results
  const resultsPath = path.join(CONFIG.baseDir, 'tracking', `${bezirkName.toLowerCase()}-automation.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Gemeinden: ${results.summary.total}`);
  console.log(`Websites found: ${results.summary.websiteFound}`);
  console.log(`Escola detected: ${results.summary.escolaDetected}`);
  console.log(`PDFs found: ${results.summary.pdfFound}`);
  console.log(`PDFs downloaded: ${results.summary.pdfDownloaded}`);
  console.log(`Manual required: ${results.summary.manualRequired}`);
  console.log(`\nResults saved to: ${resultsPath}`);

  return results;
}

// Main
const args = process.argv.slice(2);
const bezirkIndex = args.indexOf('--bezirk');
const dryRun = args.includes('--dry-run');

if (bezirkIndex === -1 || !args[bezirkIndex + 1]) {
  console.log('Usage: node escola-finder.js --bezirk <bezirk-name> [--dry-run]');
  console.log('Available Bezirke:', Object.keys(BEZIRKE).join(', '));
  process.exit(1);
}

const bezirkName = args[bezirkIndex + 1];
processBezirk(bezirkName, dryRun).catch(console.error);
