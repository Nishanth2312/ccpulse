const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const assert = require('assert');

async function main() {
    console.log('=== STARTING COMPLETE BROWSER FUNCTIONALITY & SMOKE TEST ===');

    const testPort = 4099;
    process.env.PORT = String(testPort);

    // 1. Launch Backend Server
    const serverProc = spawn('node', [path.join(__dirname, '../backend/server.js')], {
        env: { ...process.env, PORT: String(testPort) },
        stdio: 'pipe'
    });

    serverProc.stdout.on('data', d => {
        // console.log('[Server]', d.toString().trim());
    });
    serverProc.stderr.on('data', d => console.error('[Server Err]', d.toString().trim()));

    // Wait for server to listen
    await new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            http.get(`http://127.0.0.1:${testPort}/api/health`, res => {
                if (res.statusCode === 200) resolve();
                else if (++attempts > 30) reject(new Error('Server did not start'));
                else setTimeout(check, 200);
            }).on('error', () => {
                if (++attempts > 30) reject(new Error('Server did not start'));
                else setTimeout(check, 200);
            });
        };
        check();
    });
    console.log(`✓ Local test server running on port ${testPort}`);

    // 2. Launch Google Chrome in headless mode with remote debugging
    const chromeProc = spawn('/usr/bin/google-chrome', [
        '--headless=new',
        '--remote-debugging-port=9222',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        'about:blank'
    ]);

    await new Promise(r => setTimeout(r, 1200));

    // Get CDP WebSocket URL
    const tab = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json/list', res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const list = JSON.parse(data);
                const page = list.find(t => t.type === 'page') || list[0];
                resolve(page);
            });
        }).on('error', reject);
    });

    const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();
    const consoleErrors = [];

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
            const cb = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            if (msg.error) cb.reject(new Error(msg.error.message));
            else cb.resolve(msg.result);
        }
        if (msg.method === 'Runtime.consoleAPICalled') {
            console.log('[Browser Console]', msg.params.args.map(a => a.value || a.description).join(' '));
            if (msg.params.type === 'error') {
                consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
            }
        }
        if (msg.method === 'Runtime.exceptionThrown') {
            consoleErrors.push(msg.params.exceptionDetails.text + ': ' + (msg.params.exceptionDetails.exception?.description || ''));
        }
    };

    await new Promise((res, rej) => {
        ws.onopen = res;
        ws.onerror = rej;
    });

    const sendCDP = (method, params = {}) => new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });

    // Enable Runtime & Page domains
    await sendCDP('Runtime.enable');
    await sendCDP('Page.enable');

    console.log('✓ Connected via Chrome DevTools Protocol');

    const evalInPage = async (expression) => {
        const res = await sendCDP('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(res.exceptionDetails.text + ': ' + (res.exceptionDetails.exception?.description || ''));
        }
        return res.result?.value;
    };

    // 3. Navigate to frontend
    console.log(`Navigating to http://127.0.0.1:${testPort}/ ...`);
    await sendCDP('Page.navigate', { url: `http://127.0.0.1:${testPort}/` });

    // Wait 2 seconds for app initialization and scripts
    await new Promise(r => setTimeout(r, 2200));

    // TEST SUITE EVALUATIONS IN CHROME
    console.log('\n--- Running Browser Test Steps ---');

    // Test 1: Page Title & Top Telemetry Bar
    const title = await evalInPage('document.title');
    console.log('Page Title:', title);
    assert.ok(title.includes('CCPulse'), 'Page title should include CCPulse');

    // Test 2: Toast Notification System
    console.log('\n[Test 2: Right-Side Corner Toast System]');
    const toastResult = await evalInPage(`(() => {
        if (!window.Toast) return { error: 'window.Toast not found' };
        
        // Trigger Toast notifications
        Toast.success('Simulated swap executed: 0.1 BTC -> 102,400 BDX', 'Swap Executed', 'TX-SWAP-999');
        Toast.error('Order rejected: Insufficient available virtual balance.', 'Order Failed', 'ERR-400');
        
        const container = document.getElementById('tx-toast-container');
        if (!container) return { error: '#tx-toast-container not in DOM' };
        
        const toasts = container.querySelectorAll('.tx-toast-card');
        return {
            success: true,
            count: toasts.length,
            firstTitle: toasts[0]?.querySelector('.tx-toast-title')?.textContent,
            firstRef: toasts[0]?.querySelector('.tx-toast-badge')?.textContent
        };
    })()`);
    console.log('Toast Evaluation Result:', toastResult);
    assert.strictEqual(toastResult.count, 2, 'Should render 2 toast notifications');
    assert.strictEqual(toastResult.firstTitle, 'Swap Executed');
    assert.strictEqual(toastResult.firstRef, 'TX-SWAP-999');
    console.log('✓ Right-side corner toast popups successfully rendered and verified in browser DOM!');

    // Test 3: Homepage Table View Switcher (Curve vs Candle)
    console.log('\n[Test 3: Homepage Table View Switcher - Curve vs Candle]');
    const tableToggleResult = await evalInPage(`(() => {
        if (!window.MarketsView) return { error: 'MarketsView not found' };
        
        // Check default view
        const initialMode = MarketsView.chartMode;
        
        // Trigger switch to Candle View
        const candleBtn = document.getElementById('btn-chart-candle');
        if (candleBtn) candleBtn.click();
        
        const candleMode = MarketsView.chartMode;
        const tbody = document.getElementById('markets-tbody');
        const candleSvgs = tbody.querySelectorAll('.cg-sparkline-svg rect');
        
        // Trigger switch to Curve View
        const curveBtn = document.getElementById('btn-chart-curve');
        if (curveBtn) curveBtn.click();
        
        const curveMode = MarketsView.chartMode;
        const curvePaths = tbody.querySelectorAll('.cg-sparkline-svg path');
        
        return {
            initialMode,
            candleMode,
            candleRectCount: candleSvgs.length,
            curveMode,
            curvePathCount: curvePaths.length
        };
    })()`);
    console.log('Table Switcher Result:', tableToggleResult);
    assert.strictEqual(tableToggleResult.candleMode, 'candle', 'Candle mode should be active');
    assert.ok(tableToggleResult.candleRectCount > 0, 'Candle view must render candlestick rectangles');
    assert.strictEqual(tableToggleResult.curveMode, 'curve', 'Curve mode should be active');
    assert.ok(tableToggleResult.curvePathCount > 0, 'Curve view must render cubic bezier paths');
    console.log('✓ Homepage market table successfully toggles between flexible curve and 7-day candlestick views!');

    // Test 4: Transaction Security Password Modal
    console.log('\n[Test 4: Transaction Security Password PIN Authorization]');
    const securityPromptResult = await evalInPage(`(() => {
        if (!window.SecurityModal) return { error: 'SecurityModal not found' };
        
        // Open modal
        App.promptTransactionSecurity({
            title: 'Authorize Order',
            actionDescription: 'BUY 50,000 BDX (~$3,610.00 USD)'
        });
        
        const dialog = document.querySelector('.tx-security-dialog');
        if (!dialog) return { error: 'Dialog element not created' };
        
        const pwdInput = dialog.querySelector('#tx-security-pwd');
        const autoFillBtn = dialog.querySelector('#tx-quick-fill-pin');
        
        // Click auto-fill demo PIN
        if (autoFillBtn) autoFillBtn.click();
        const filledValue = pwdInput?.value;
        
        // Submit
        const form = dialog.querySelector('#tx-security-form');
        const submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
        
        const isDialogClosed = !document.querySelector('.tx-security-dialog');
        
        return {
            filledValue,
            isDialogClosed
        };
    })()`);
    console.log('Security PIN Evaluation Result:', securityPromptResult);
    assert.strictEqual(securityPromptResult.filledValue, '123456', 'Auto-fill PIN should fill 123456');
    assert.strictEqual(securityPromptResult.isDialogClosed, true, 'Dialog should close upon valid authorization');
    console.log('✓ Transaction security PIN verification successfully prompted, validated and authorized!');

    // Test 5: Admin User Governance & Controls
    console.log('\n[Test 5: Admin User Governance Directory & Controls]');
    const adminResult = await evalInPage(`(async () => {
        // Set target hash first
        window.location.hash = '#admin?tab=users';
        
        // Login as admin
        const loginRes = await API.auth.login({ email: 'admin@ccpulse.com', password: 'Admin@CCPulse2026!' });
        State.setAuth(loginRes.user, loginRes.token, loginRes.wallet);
        
        // Ensure route executed
        await App.route();
        
        // Wait for async table population
        await new Promise(r => setTimeout(r, 600));
        
        const rows = document.querySelectorAll('.data-table tbody tr');
        const firstRow = rows[0];
        
        const hasTiming = firstRow ? firstRow.innerHTML.includes('Active:') : false;
        const hasIncreaseBtn = firstRow ? (firstRow.querySelector('.quick-increase-btn') !== null) : false;
        const hasFreezeBtn = firstRow ? (firstRow.querySelector('.user-freeze-btn') !== null) : false;
        const hasBlockBtn = firstRow ? (firstRow.querySelector('.user-block-btn') !== null) : false;
        const hasSpamBtn = firstRow ? (firstRow.querySelector('.user-spam-btn') !== null) : false;
        
        return {
            adminCrumb: document.getElementById('cf-current-crumb')?.textContent,
            userRowCount: rows.length,
            hasTiming,
            hasIncreaseBtn,
            hasFreezeBtn,
            hasBlockBtn,
            hasSpamBtn
        };
    })()`);
    console.log('Admin Governance Result:', adminResult);
    assert.ok(adminResult.userRowCount >= 2, 'Admin directory should list registered users');
    assert.strictEqual(adminResult.hasTiming, true, 'User row must display active timing');
    assert.strictEqual(adminResult.hasIncreaseBtn, true, 'User row must provide Increase Balance button');
    assert.strictEqual(adminResult.hasFreezeBtn, true, 'User row must provide Freeze button');
    assert.strictEqual(adminResult.hasBlockBtn, true, 'User row must provide Block button');
    assert.strictEqual(adminResult.hasSpamBtn, true, 'User row must provide Spam button');
    console.log('✓ Admin User Governance controls (Increase, Freeze, Block, Spam, Timing) verified!');

    // Test 6: Market Simulation Lab 405 Resilience & Interactive Shock Engine
    console.log('\n[Test 6: Market Simulation Lab 405 Resilience & Stress Test]');
    const simLabResult = await evalInPage(`(async () => {
        window.location.hash = '#simulation-lab';
        await App.route();
        await new Promise(r => setTimeout(r, 600));

        const grid = document.getElementById('scenarios-grid');
        const cards = grid ? grid.querySelectorAll('.scenario-card') : [];
        const activeCard = grid ? grid.querySelector('.active-scenario') : null;
        
        // Trigger Flash Crash scenario
        const flashCrashCard = grid ? Array.from(cards).find(c => c.textContent.includes('Flash Crash')) : null;
        if (flashCrashCard) flashCrashCard.click();
        await new Promise(r => setTimeout(r, 400));

        const output = document.getElementById('sim-results-output');
        const has405Error = output ? output.textContent.includes('405') : false;
        const hasTable = output ? (output.querySelectorAll('table.data-table tbody tr').length > 0) : false;
        const netShiftText = output ? output.querySelector('.font-mono.text-danger, .font-mono.text-success')?.textContent : '';

        return {
            scenarioCardCount: cards.length,
            hasActiveCard: activeCard !== null,
            has405Error,
            hasTable,
            netShiftText: netShiftText.trim()
        };
    })()`);
    console.log('Simulation Lab Result:', simLabResult);
    assert.strictEqual(simLabResult.scenarioCardCount, 5, 'Must render all 5 market scenarios in selection grid');
    assert.strictEqual(simLabResult.hasActiveCard, true, 'Default scenario must be actively highlighted');
    assert.strictEqual(simLabResult.has405Error, false, 'Output must NEVER contain 405 Method Not Allowed error');
    assert.strictEqual(simLabResult.hasTable, true, 'Stress test must render asset-by-asset simulated shock breakdown');
    console.log('✓ Market Simulation Lab 405 resilience and stress-test calculation verified!');

    // Check for runtime errors
    console.log('\nRuntime console errors during test:', consoleErrors);
    assert.strictEqual(consoleErrors.length, 0, 'There should be 0 unhandled console errors');

    console.log('\n========================================');
    console.log('✓ ALL BROWSER SMOKE TESTS PASSED PERFECTLY!');
    console.log('========================================\n');

    // Cleanup
    ws.close();
    chromeProc.kill();
    serverProc.kill();
    process.exit(0);
}

main().catch(err => {
    console.error('Smoke test failed:', err);
    process.exit(1);
});
