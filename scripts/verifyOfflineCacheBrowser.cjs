const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/screenshots');

function resolveChromeBinary() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/opt/google/chrome/chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No Google Chrome or Chromium executable found. Please set CHROME_BIN.');
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function launchChrome(profileDir, port) {
  const chromeBin = resolveChromeBinary();
  const chrome = spawn(chromeBin, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--user-data-dir=${profileDir}`,
    'http://127.0.0.1:5173/'
  ]);

  let ws = null;
  const pending = new Map();
  let id = 1;

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, (res, err) => {
        if (err) reject(new Error(JSON.stringify(err)));
        else resolve(res);
      });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(code) {
    const res = await send('Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async function dismissToastsRealUI() {
    await evaluate(`
      (() => {
        const dismissBtns = Array.from(document.querySelectorAll('button[aria-label="Dismiss notification"]'));
        dismissBtns.forEach(btn => btn.click());
        return dismissBtns.length;
      })()
    `);
    await delay(350);
  }

  async function captureAndSave(filename, width = 1280, height = 1200) {
    await dismissToastsRealUI();
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await delay(250);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(shot.data, 'base64'));
    console.log(`   📸 Saved clean screenshot: ${filename} (${Math.round(shot.data.length / 1024)} KB)`);
  }

  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    await delay(200);
    try {
      const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
      pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173'));
      if (pageTarget) break;
    } catch (e) {}
  }

  if (!pageTarget) {
    chrome.kill('SIGKILL');
    throw new Error('Could not find NoticeLens page target in Chrome');
  }

  ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  const networkRequests = [];

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result, msg.error);
      pending.delete(msg.id);
    } else if (msg.method === 'Network.requestWillBeSent') {
      networkRequests.push({
        url: msg.params.request.url,
        method: msg.params.request.method,
        type: msg.params.type,
      });
    }
  });

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Network.enable');

  return {
    chrome,
    send,
    evaluate,
    dismissToastsRealUI,
    captureAndSave,
    networkRequests,
    close: async () => {
      try { ws.close(); } catch (e) {}
      chrome.kill('SIGTERM');
      await delay(500);
      try { chrome.kill('SIGKILL'); } catch (e) {}
    }
  };
}

async function navigateToScanScreen(session) {
  await session.evaluate(`
    (() => {
      const homeBtn = document.querySelector('button[aria-label="NoticeLens Home"]');
      if (homeBtn) { homeBtn.click(); return; }
      const navBtns = Array.from(document.querySelectorAll('nav button'));
      const scanBtn = navBtns.find(b => b.textContent.includes('Scan'));
      if (scanBtn) { scanBtn.click(); return; }
      if (navBtns.length > 0) navBtns[0].click();
    })()
  `);

  for (let i = 0; i < 20; i++) {
    await delay(300);
    const hasScanUi = await session.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent.includes('Run Live OCR on Image'));
      })()
    `);
    if (hasScanUi) return true;
  }
  throw new Error('Failed to return to Scan screen');
}

async function clickSampleLiveOcr(session, sampleIdentifier) {
  const result = await session.evaluate(`
    (() => {
      const target = ${JSON.stringify(sampleIdentifier.toLowerCase())};
      const cards = Array.from(document.querySelectorAll('.neu-card'));
      const card = cards.find(c => {
        const h3 = c.querySelector('h3');
        const text = (h3?.textContent || c.textContent || '').toLowerCase();
        return text.includes(target);
      });
      if (!card) {
        return { 
          success: false, 
          reason: 'Sample card not found for exact requested sample: "' + target + '". Available cards: ' +
            cards.map(c => c.querySelector('h3')?.textContent?.trim() || 'unknown').join(' | ')
        };
      }
      const buttons = Array.from(card.querySelectorAll('button'));
      const liveBtn = buttons.find(b => b.textContent.includes('Run Live OCR on Image'));
      if (!liveBtn) {
        return { success: false, reason: 'Live OCR button not found in card for: "' + target + '"' };
      }
      liveBtn.click();
      return { 
        success: true, 
        matched: target,
        cardTitle: card.querySelector('h3')?.textContent?.trim()
      };
    })()
  `);

  if (!result.success) {
    throw new Error(`Click Live OCR failed: ${result.reason}`);
  }
  return result;
}

async function waitForWorkspaceReady(session, timeoutSec = 90) {
  for (let i = 0; i < timeoutSec; i++) {
    await delay(1000);
    const state = await session.evaluate(`
      (() => {
        const inWs = !!document.getElementById('summary-heading') || !!document.getElementById('raw-text-preview');
        const progress = document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow');
        const err = document.querySelector('[role="alert"]')?.textContent;
        return { inWs, progress, err };
      })()
    `);
    if (i % 5 === 0) {
      console.log(`      [wait ${i}s] inWs: ${state.inWs}, progress: ${state.progress || 'none'}, err: ${state.err || 'none'}`);
    }
    if (state.inWs) return true;
    if (state.err) throw new Error(`OCR processing error observed: ${state.err}`);
  }
  throw new Error(`OCR timed out after ${timeoutSec}s waiting for Notice Workspace`);
}

async function getWorkspaceTranscript(session) {
  return await session.evaluate(`
    (() => {
      const transcriptArea = document.querySelector('div[role="region"][aria-label*="Recognized notice text"]') ||
        document.querySelector('.whitespace-pre-wrap') ||
        document.querySelector('textarea');
      const mainText = document.querySelector('main')?.textContent || '';
      const transcript = transcriptArea ? (transcriptArea.value || transcriptArea.textContent || '') : mainText;
      return {
        length: transcript.length,
        hasBengali: /[\u0980-\u09FF]/.test(transcript) || /[\u0980-\u09FF]/.test(mainText),
        hasEnglish: /[a-zA-Z]/.test(transcript) || /[a-zA-Z]/.test(mainText),
        sample: (transcript.slice(0, 300) || mainText.slice(0, 300)).replace(/\\s+/g, ' ')
      };
    })()
  `);
}

async function run() {
  console.log('================================================================');
  console.log('   NoticeLens Bilingual Offline OCR & Cache Persistence QA      ');
  console.log('================================================================\n');

  const p1Dir = `/tmp/chrome-noticelens-cache-p1-${Date.now()}`;
  const port1 = 9260;

  console.log('--- TEST PHASE 1: Online Bilingual Pre-warming & Cache Verification ---');
  console.log(`[1.1] Launching fresh Chrome profile: ${p1Dir}`);
  const session1 = await launchChrome(p1Dir, port1);

  try {
    // Explicitly navigate to ensure application shell is loaded
    await session1.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });

    let title = '';
    let currentUrl = '';
    for (let i = 0; i < 30; i++) {
      try {
        currentUrl = (await session1.evaluate('window.location.href')) || '';
        title = (await session1.evaluate('document.title')) || '';
        if (title.includes('NoticeLens')) break;

        if (title === '127.0.0.1' || currentUrl.includes('chromewebdata')) {
          await session1.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
        }
      } catch {
        // wait
      }
      await delay(500);
    }
    console.log(`[1.2] Loaded page title: "${title}" (URL: ${currentUrl})`);
    if (!title.includes('NoticeLens')) {
      if (title === '127.0.0.1' || currentUrl.includes('chromewebdata')) {
        throw new Error(`Diagnosis: Headless Chrome loaded internal error page (URL: "${currentUrl}", Title: "${title}"). The Vite dev server at http://127.0.0.1:5173 was not reachable. Ensure "npm run dev -- --host 127.0.0.1 --port 5173" is running.`);
      }
      throw new Error(`Expected title to include "NoticeLens", got "${title}"`);
    }

    // Verify online state
    const isOnlineInitial = await session1.evaluate('navigator.onLine');
    console.log(`[1.3] Initial navigator.onLine: ${isOnlineInitial}`);
    if (!isOnlineInitial) throw new Error('Expected initial browser state to be online');

    // Wait for Service Worker activation
    await session1.evaluate(`
      (async () => {
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.ready;
          } catch (e) {}
        }
      })()
    `);
    await delay(500);

    // Strict assertion: Diagnostics API must be available
    const initialDiagnosticsCheck = await session1.evaluate(`
      (() => {
        return {
          hasDiagnostics: Array.isArray(window.__noticelens_ocr_diagnostics),
          hasTerminateFn: typeof window.__noticelens_terminate_worker__ === 'function',
          hasIsActiveFn: typeof window.__noticelens_is_worker_active__ === 'function',
          initialWorkerActive: typeof window.__noticelens_is_worker_active__ === 'function' ? window.__noticelens_is_worker_active__() : null
        };
      })()
    `);
    console.log('   Initial OCR Diagnostic API Check:', initialDiagnosticsCheck);
    if (!initialDiagnosticsCheck.hasDiagnostics) {
      throw new Error('FAIL: window.__noticelens_ocr_diagnostics is missing from environment!');
    }
    if (!initialDiagnosticsCheck.hasTerminateFn) {
      throw new Error('FAIL: window.__noticelens_terminate_worker__ is missing!');
    }
    if (!initialDiagnosticsCheck.hasIsActiveFn) {
      throw new Error('FAIL: window.__noticelens_is_worker_active__ is missing!');
    }

    // Step 1.4: Pre-warm Bengali Language Model via Online Live OCR
    console.log('[1.4] Clicking "⚡ Run Live OCR on Image" for Bengali notice (Sample 1)...');
    await clickSampleLiveOcr(session1, 'Semester Final Examination');
    console.log('      Waiting for Tesseract.js to download Bengali trained model and complete OCR...');
    await waitForWorkspaceReady(session1, 90);
    const bnOnlineContent = await getWorkspaceTranscript(session1);
    console.log(`[1.5] Bengali Online OCR completed! (Length: ${bnOnlineContent.length}, hasBengali: ${bnOnlineContent.hasBengali})`);
    if (!bnOnlineContent.hasBengali || bnOnlineContent.length < 30) {
      throw new Error('Online OCR failed to recognize genuine Bengali text');
    }

    // Step 1.6: Navigate back to Scan tab
    console.log('[1.6] Navigating back to scan screen to pre-warm English model...');
    await navigateToScanScreen(session1);

    // Step 1.7: Pre-warm English Language Model via Online Live OCR
    console.log('[1.7] Clicking "⚡ Run Live OCR on Image" for English notice (Sample 2)...');
    await clickSampleLiveOcr(session1, 'National Collegiate Innovation Hackathon');
    console.log('      Waiting for Tesseract.js to download English trained model and complete OCR...');
    await waitForWorkspaceReady(session1, 90);
    const enOnlineContent = await getWorkspaceTranscript(session1);
    console.log(`[1.8] English Online OCR completed! (Length: ${enOnlineContent.length}, hasEnglish: ${enOnlineContent.hasEnglish})`);
    if (!enOnlineContent.hasEnglish || enOnlineContent.length < 30) {
      throw new Error('Online OCR failed to recognize genuine English text');
    }

    // Step 1.9: Verify both Bengali AND English traineddata entries in IndexedDB keyval-store
    console.log('[1.9] Inspecting IndexedDB keyval-store for BOTH ben.traineddata and eng.traineddata...');
    const dbInspection = await session1.evaluate(`
      new Promise((resolve) => {
        const req = indexedDB.open('keyval-store');
        req.onerror = () => resolve({ success: false, reason: 'Failed to open keyval-store' });
        req.onsuccess = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('keyval')) {
            db.close();
            resolve({ success: false, reason: 'objectStore keyval missing' });
            return;
          }
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');
          const keysReq = store.getAllKeys();
          keysReq.onerror = () => { db.close(); resolve({ success: false, reason: 'getAllKeys error' }); };
          keysReq.onsuccess = () => {
            const keys = (keysReq.result || []);
            const benKey = keys.find(k => typeof k === 'string' && k.includes('ben.traineddata'));
            const engKey = keys.find(k => typeof k === 'string' && k.includes('eng.traineddata'));

            if (!benKey || !engKey) {
              db.close();
              resolve({
                success: false,
                reason: 'Missing required traineddata key(s)',
                hasBenKey: !!benKey,
                hasEngKey: !!engKey,
                allKeys: keys
              });
              return;
            }

            let benVal = null;
            let engVal = null;
            const getBen = store.get(benKey);
            getBen.onsuccess = () => {
              benVal = getBen.result;
              const getEng = store.get(engKey);
              getEng.onsuccess = () => {
                engVal = getEng.result;
                db.close();

                function inspectBuf(val) {
                  let size = 0;
                  let bytes = [];
                  if (val instanceof Uint8Array || ArrayBuffer.isView(val)) {
                    size = val.byteLength;
                    bytes = Array.from(new Uint8Array(val.buffer, val.byteOffset, Math.min(16, val.byteLength)));
                  } else if (val instanceof ArrayBuffer) {
                    size = val.byteLength;
                    bytes = Array.from(new Uint8Array(val, 0, Math.min(16, val.byteLength)));
                  }
                  const numEntries = bytes.length >= 4 ? (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)) : 0;
                  const isZeroFilled = bytes.length > 0 && bytes.every(b => b === 0);
                  return { size, numEntries, isZeroFilled, headerHex: bytes.map(b => b.toString(16).padStart(2, '0')).join(' ') };
                }

                resolve({
                  success: true,
                  benKey,
                  engKey,
                  benInfo: inspectBuf(benVal),
                  engInfo: inspectBuf(engVal),
                  allKeys: keys
                });
              };
            };
          };
        };
      })
    `);

    console.log('      IndexedDB inspection result:', dbInspection);
    if (!dbInspection.success) {
      throw new Error(`IndexedDB bilingual check failed: ${JSON.stringify(dbInspection)}`);
    }
    if (dbInspection.benInfo.size < 1000000 || dbInspection.benInfo.isZeroFilled || dbInspection.benInfo.numEntries <= 0) {
      throw new Error(`ben.traineddata is malformed or invalid: ${JSON.stringify(dbInspection.benInfo)}`);
    }
    if (dbInspection.engInfo.size < 1000000 || dbInspection.engInfo.isZeroFilled || dbInspection.engInfo.numEntries <= 0) {
      throw new Error(`eng.traineddata is malformed or invalid: ${JSON.stringify(dbInspection.engInfo)}`);
    }
    console.log(`      ✅ Verified: ben.traineddata (${dbInspection.benInfo.size} bytes, ${dbInspection.benInfo.numEntries} entries) stored in IndexedDB.`);
    console.log(`      ✅ Verified: eng.traineddata (${dbInspection.engInfo.size} bytes, ${dbInspection.engInfo.numEntries} entries) stored in IndexedDB.`);

    // Step 1.10: Priority 2 Check - Verify Service Worker CacheStorage assets BEFORE worker termination
    console.log('[1.10] Verifying Tesseract worker script and core WASM asset in CacheStorage before worker termination...');
    const cacheStorageCheck = await session1.evaluate(`
      (async () => {
        if (!('caches' in window)) return { success: false, reason: 'CacheStorage API unsupported' };
        const cacheNames = await caches.keys();
        const ocrCacheName = cacheNames.find(n => n.startsWith('noticelens-ocr-cache'));
        if (!ocrCacheName) {
          return { success: false, reason: 'NoticeLens OCR cache not found in CacheStorage', cacheNames };
        }
        const cache = await caches.open(ocrCacheName);
        const requests = await cache.keys();
        const urls = requests.map(r => new URL(r.url).pathname);
        const hasWorker = urls.some(p => p.includes('worker.min.js'));
        const hasCoreWasm = urls.some(p => p.includes('tesseract-core') || p.endsWith('.wasm'));

        return {
          success: hasWorker && hasCoreWasm,
          ocrCacheName,
          urls,
          hasWorker,
          hasCoreWasm
        };
      })()
    `);

    console.log('      CacheStorage inspection result:', cacheStorageCheck);
    if (!cacheStorageCheck.success || !cacheStorageCheck.hasWorker || !cacheStorageCheck.hasCoreWasm) {
      throw new Error(`FAIL: CacheStorage check failed! Tesseract engine/core assets not fully cached: ${JSON.stringify(cacheStorageCheck)}`);
    }
    console.log('      ✅ Verified: Service Worker CacheStorage contains /tesseract/worker.min.js AND Tesseract core WASM engine.');

    // Step 1.11: Terminate all active OCR workers
    console.log('[1.11] Terminating active OCR workers before offline testing...');
    const workerActivePreTerm = await session1.evaluate('window.__noticelens_is_worker_active__()');
    console.log(`      Worker active status before termination: ${workerActivePreTerm}`);
    if (workerActivePreTerm !== true) {
      throw new Error('Expected active worker after online OCR operations');
    }
    await session1.evaluate('window.__noticelens_terminate_worker__()');
    await delay(600);
    const workerActivePostTerm = await session1.evaluate('window.__noticelens_is_worker_active__()');
    console.log(`      Worker active status after termination: ${workerActivePostTerm}`);
    if (workerActivePostTerm !== false) {
      throw new Error('FAIL: Worker was NOT terminated properly!');
    }
    console.log('      ✅ Original in-memory worker cleanly terminated. Memory is clean.');

    console.log('\n--- TEST PHASE 2: Bilingual & Mixed Offline OCR with Fresh Workers ---');

    // Step 2.1: Return to Scan Screen
    console.log('[2.1] Navigating back to scan screen...');
    await navigateToScanScreen(session1);

    // Step 2.2: Cut Network Offline via CDP
    console.log('[2.2] Emulating OFFLINE network condition via CDP...');
    await session1.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });

    const isOfflineNow = await session1.evaluate('navigator.onLine === false');
    console.log(`      navigator.onLine is now offline: ${isOfflineNow}`);
    if (!isOfflineNow) throw new Error('Failed to disable browser network connectivity');

    const workerBeforeOffline = await session1.evaluate('window.__noticelens_is_worker_active__()');
    if (workerBeforeOffline !== false) {
      throw new Error('Unexpected active worker before offline run initiated!');
    }

    const requestsBeforeOfflinePhase = session1.networkRequests.length;

    // Step 2.3 & 2.4: Bengali Offline OCR with Fresh Worker
    console.log('[2.3] Executing OFFLINE Bengali OCR with a newly initialized worker...');
    await clickSampleLiveOcr(session1, 'Semester Final Examination');
    console.log('      Waiting for fresh worker to initialize from cache and complete Bengali OCR offline...');
    await waitForWorkspaceReady(session1, 50);

    const bnOfflineContent = await getWorkspaceTranscript(session1);
    console.log(`[2.4] Bengali Offline Transcript length: ${bnOfflineContent.length}, hasBengali: ${bnOfflineContent.hasBengali}`);
    if (!bnOfflineContent.hasBengali || bnOfflineContent.length < 30) {
      throw new Error('Fresh worker failed to recognize Bengali text offline from cached model');
    }
    const bnMatchesExpected = bnOfflineContent.sample.includes('ঢাকা') || 
                              bnOfflineContent.sample.includes('পরীক্ষা') || 
                              bnOfflineContent.sample.includes('১৫ নভেম্বর ২০২৪');
    if (!bnMatchesExpected) {
      throw new Error(`Fresh worker failed to recognize sample-specific Bengali expected text. Snippet: "${bnOfflineContent.sample.slice(0, 150)}"`);
    }
    console.log(`      Bengali snippet: "${bnOfflineContent.sample.slice(0, 100)}..."`);

    // Terminate worker again between tests to prove true fresh worker re-creation
    console.log('      Terminating worker to verify separate fresh worker for English OCR...');
    await session1.evaluate('window.__noticelens_terminate_worker__()');
    await delay(500);
    const workerTerminatedBetween = await session1.evaluate('window.__noticelens_is_worker_active__()');
    if (workerTerminatedBetween !== false) throw new Error('Worker termination between offline runs failed');

    // Step 2.5: English Offline OCR with Fresh Worker
    console.log('[2.5] Navigating to Scan screen for OFFLINE English OCR...');
    await navigateToScanScreen(session1);
    console.log('      Executing OFFLINE English OCR with a newly initialized worker...');
    await clickSampleLiveOcr(session1, 'National Collegiate Innovation Hackathon');
    console.log('      Waiting for fresh worker to initialize from cache and complete English OCR offline...');
    await waitForWorkspaceReady(session1, 50);

    const enOfflineContent = await getWorkspaceTranscript(session1);
    console.log(`[2.6] English Offline Transcript length: ${enOfflineContent.length}, hasEnglish: ${enOfflineContent.hasEnglish}`);
    if (!enOfflineContent.hasEnglish || enOfflineContent.length < 30) {
      throw new Error('Fresh worker failed to recognize English text offline from cached model');
    }
    const enMatchesExpected = enOfflineContent.sample.includes('BUET') || 
                              enOfflineContent.sample.includes('Hackathon') || 
                              enOfflineContent.sample.includes('22 November 2024');
    if (!enMatchesExpected) {
      throw new Error(`Fresh worker failed to recognize sample-specific English expected text. Snippet: "${enOfflineContent.sample.slice(0, 150)}"`);
    }
    console.log(`      English snippet: "${enOfflineContent.sample.slice(0, 100)}..."`);

    // Step 2.6: Mixed Bengali+English Offline OCR with Fresh Worker
    console.log('      Terminating worker before mixed-language offline OCR test...');
    await session1.evaluate('window.__noticelens_terminate_worker__()');
    await delay(500);

    console.log('[2.7] Navigating to Scan screen for OFFLINE Mixed Language OCR...');
    await navigateToScanScreen(session1);
    console.log('      Executing OFFLINE Mixed OCR with a newly initialized worker (Sample 3)...');
    await clickSampleLiveOcr(session1, 'Postgraduate Diploma Admission');
    console.log('      Waiting for fresh worker to complete mixed Bengali+English OCR offline...');
    await waitForWorkspaceReady(session1, 50);

    const mixedOfflineContent = await getWorkspaceTranscript(session1);
    console.log(`[2.8] Mixed Offline Transcript length: ${mixedOfflineContent.length}, hasBn: ${mixedOfflineContent.hasBengali}, hasEn: ${mixedOfflineContent.hasEnglish}`);
    if (!mixedOfflineContent.hasBengali || !mixedOfflineContent.hasEnglish || mixedOfflineContent.length < 30) {
      throw new Error('Fresh worker failed to recognize mixed Bengali and English text offline');
    }
    const mixedMatchesExpected = (mixedOfflineContent.sample.includes('জাহাঙ্গীরনগর') || mixedOfflineContent.sample.includes('ভর্তি')) &&
                                 (mixedOfflineContent.sample.includes('PGDIT') || mixedOfflineContent.sample.includes('Admission') || mixedOfflineContent.sample.includes('28 November 2024'));
    if (!mixedMatchesExpected) {
      throw new Error(`Fresh worker failed to recognize sample-specific mixed expected text. Snippet: "${mixedOfflineContent.sample.slice(0, 150)}"`);
    }
    console.log(`      Mixed snippet: "${mixedOfflineContent.sample.slice(0, 120)}..."`);

    // Step 2.9: Assert Zero external traineddata network requests during offline execution
    const requestsAfterOffline = session1.networkRequests.slice(requestsBeforeOfflinePhase);
    const trainedDataRequestsOffline = requestsAfterOffline.filter(r => r.url.includes('traineddata'));
    console.log(`[2.9] Total network attempts logged during entire offline phase: ${requestsAfterOffline.length}`);
    console.log(`      External traineddata network requests while offline: ${trainedDataRequestsOffline.length}`);
    if (trainedDataRequestsOffline.length > 0) {
      throw new Error(`FAIL: External traineddata requests occurred while offline: ${JSON.stringify(trainedDataRequestsOffline)}`);
    }
    console.log('      ✅ PASSED: Zero external traineddata requests during offline OCR recognition.');

    // Step 2.10: Capture clean screenshot of verified offline OCR
    await session1.captureAndSave('10_verified_offline_ocr.png', 1280, 1200);

  } finally {
    await session1.close();
  }

  console.log('\n--- TEST PHASE 3: Offline Cache Miss on Fresh Profile ---');
  const p2Dir = `/tmp/chrome-noticelens-fresh-p2-${Date.now()}`;
  const port2 = 9261;
  console.log(`[3.1] Launching clean fresh Chrome profile: ${p2Dir}`);
  const session2 = await launchChrome(p2Dir, port2);

  try {
    // Explicitly navigate and wait for application shell to load before cutting network
    await session2.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    let p3Title = '';
    for (let i = 0; i < 30; i++) {
      try {
        p3Title = (await session2.evaluate('document.title')) || '';
        if (p3Title.includes('NoticeLens')) break;
      } catch {}
      await delay(500);
    }
    if (!p3Title.includes('NoticeLens')) {
      throw new Error(`Expected fresh profile to load NoticeLens before cutting network, got: "${p3Title}"`);
    }

    console.log('[3.2] Setting network to OFFLINE BEFORE running OCR on fresh profile...');
    await session2.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });

    const isOnlineFresh = await session2.evaluate('navigator.onLine');
    console.log(`      navigator.onLine on fresh profile: ${isOnlineFresh}`);
    if (isOnlineFresh !== false) throw new Error('Expected fresh browser profile to be offline');

    const freshWorkerInitial = await session2.evaluate('window.__noticelens_is_worker_active__()');
    console.log(`      Worker active status on fresh profile: ${freshWorkerInitial}`);
    if (freshWorkerInitial !== false) {
      throw new Error('Unexpected active worker on fresh uninitialized profile!');
    }

    console.log('[3.3] Clicking "⚡ Run Live OCR on Image" on un-cached profile while offline...');
    const clickMissRes = await session2.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const liveBtn = buttons.find(b => b.textContent.includes('Run Live OCR on Image'));
        if (liveBtn) {
          liveBtn.click();
          return { success: true };
        }
        return { success: false, reason: 'Live OCR button not found' };
      })()
    `);
    console.log('      Click result:', clickMissRes);
    if (!clickMissRes.success) throw new Error(clickMissRes.reason);

    console.log('      Waiting for offline cache miss error alert to appear...');
    let alertObserved = null;
    for (let i = 0; i < 20; i++) {
      await delay(500);
      const alertState = await session2.evaluate(`
        (() => {
          const alert = document.querySelector('[role="alert"]');
          const inWs = !!document.getElementById('summary-heading');
          const currentTab = document.querySelector('nav [aria-current="page"]')?.textContent || 'unknown';
          const bodySnippet = document.body.innerText.slice(0, 200).replace(/\\s+/g, ' ');
          return {
            hasAlert: !!alert,
            alertText: alert ? alert.textContent : null,
            inWorkspace: inWs,
            currentTab,
            bodySnippet
          };
        })()
      `);

      if (alertState.hasAlert && alertState.alertText && alertState.alertText.includes('Offline Notice')) {
        alertObserved = alertState.alertText;
        console.log(`[3.4] Cache miss alert successfully caught! (after ~${(i + 1) * 0.5}s)`);
        console.log(`      Alert Text: "${alertObserved.replace(/\\s+/g, ' ')}"`);
        break;
      }

      if (alertState.inWorkspace) {
        throw new Error(`FAILED: Notice Workspace was opened despite cache miss! Body: "${alertState.bodySnippet}"`);
      }
    }

    if (!alertObserved) {
      throw new Error('Failed to observe expected actionable offline cache miss alert');
    }

    // Verify retry button is available on error alert
    const hasRetryBtn = await session2.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent.includes('Retry OCR'));
      })()
    `);
    console.log(`[3.5] Direct 'Retry OCR' button available on error notification: ${hasRetryBtn}`);
    if (!hasRetryBtn) throw new Error('Retry OCR button not found on error alert');

    // Verify original sample notice cards remain intact
    const originalIntact = await session2.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent.includes('Run Live OCR on Image'));
      })()
    `);
    console.log(`[3.6] Original scan cards remain available for retry: ${originalIntact}`);
    if (!originalIntact) throw new Error('Original sample notice card vanished after error');

    // Capture clean screenshot of cache miss alert
    await session2.captureAndSave('11_offline_cache_miss_alert.png', 1280, 1000);

  } finally {
    await session2.close();
  }

  console.log('\n================================================================');
  console.log('   🎉 ALL REAL BROWSER OFFLINE OCR VERIFICATION TESTS PASSED!   ');
  console.log('   - Bengali offline OCR proven with fresh worker               ');
  console.log('   - English offline OCR proven with fresh worker               ');
  console.log('   - Mixed (ben+eng) offline OCR proven with fresh worker       ');
  console.log('   - Service Worker CacheStorage assets verified                ');
  console.log('   - Zero external traineddata requests during offline runs     ');
  console.log('   - Offline cache miss handled gracefully with retry option    ');
  console.log('================================================================');
}

run().catch(err => {
  console.error('\n❌ Browser Offline OCR Verification FAILED:', err);
  process.exit(1);
});
