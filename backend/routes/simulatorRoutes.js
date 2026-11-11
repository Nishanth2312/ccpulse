const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const {
    executeSimulatedTrade,
    executeSimulatedSwap,
    getUserWallet,
    getWalletTransactions
} = require('../services/walletService');

/**
 * POST /api/simulator/trade
 * Execute simulated cryptocurrency buy or sell
 */
router.post('/trade', authenticateToken, (req, res) => {
    try {
        const { crypto_id, cryptoId, type, quantity, custom_price } = req.body;
        const cid = crypto_id || cryptoId;

        if (!cid || !type || !quantity) {
            return res.status(400).json({ success: false, error: 'Cryptocurrency ID, order type (BUY/SELL), and quantity are required.' });
        }

        const crypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(cid);
        if (!crypto) {
            return res.status(404).json({ success: false, error: 'Cryptocurrency not found.' });
        }
        if (!crypto.is_active) {
            return res.status(400).json({ success: false, error: `Trading for ${crypto.symbol} is currently disabled.` });
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ success: false, error: 'Quantity must be a positive number.' });
        }

        const priceUsd = custom_price ? parseFloat(custom_price) : crypto.current_price_usd;
        const totalValueUsd = qty * priceUsd;

        // If Guest User
        if (req.isGuest || !req.user) {
            // Guest trade simulation (in-memory calculation returned to client)
            const tradeRef = `GUEST-TR-${type.toUpperCase()}-${Date.now()}`;
            // Increment simulation count on cryptocurrency for popularity tracking
            db.prepare('UPDATE cryptocurrencies SET simulation_count = simulation_count + 1 WHERE id = ?').run(crypto.id);

            return res.json({
                success: true,
                isGuest: true,
                trade: {
                    tradeRef,
                    type: type.toUpperCase(),
                    symbol: crypto.symbol,
                    quantity: qty,
                    priceUsd,
                    totalValueUsd,
                    status: 'EXECUTED_TEMPORARY',
                    note: 'Temporary guest simulated trade. Register or sign in to permanently save your portfolio and $5,000 welcome bonus!'
                }
            });
        }

        // Authenticated user: Atomic execution in database
        const result = executeSimulatedTrade({
            userId: req.user.id,
            cryptoId: crypto.id,
            type,
            quantity: qty,
            customPrice: priceUsd
        });

        const updatedWallet = getUserWallet(req.user.id);

        return res.json({
            success: true,
            isGuest: false,
            ...result,
            wallet: updatedWallet
        });

    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/simulator/swap
 * Instant DEX Coin-to-Coin token swap with realistic network and liquidity fees
 */
router.post('/swap', authenticateToken, (req, res) => {
    try {
        const {
            from_crypto_id, fromCryptoId,
            to_crypto_id, toCryptoId,
            from_quantity, fromQuantity,
            slippage_tolerance, slippageTolerance
        } = req.body;

        const fid = from_crypto_id || fromCryptoId;
        const tid = to_crypto_id || toCryptoId;
        const qty = parseFloat(from_quantity || fromQuantity);
        const slip = parseFloat(slippage_tolerance || slippageTolerance || 0.5);

        if (!fid || !tid) {
            return res.status(400).json({ success: false, error: 'Source crypto and target crypto are required.' });
        }
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ success: false, error: 'Swap quantity must be a positive number.' });
        }
        if (String(fid) === String(tid)) {
            return res.status(400).json({ success: false, error: 'Cannot swap a cryptocurrency for itself.' });
        }

        // Support lookup by ID or Symbol
        let fromCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(fid);
        if (!fromCrypto && typeof fid === 'string') {
            fromCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE LOWER(symbol) = LOWER(?)').get(fid);
        }
        let toCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(tid);
        if (!toCrypto && typeof tid === 'string') {
            toCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE LOWER(symbol) = LOWER(?)').get(tid);
        }

        if (!fromCrypto || !toCrypto) {
            return res.status(404).json({ success: false, error: 'Selected cryptocurrency pair not found.' });
        }

        // Guest user simulation
        if (req.isGuest || !req.user) {
            const gross = qty * fromCrypto.current_price_usd;
            const netFee = gross * 0.0015; // 0.15% network gas
            const handFee = gross * 0.0025; // 0.25% handling
            const net = gross - (netFee + handFee);
            const toQty = net / toCrypto.current_price_usd;
            const minRec = toQty * (1 - (slip / 100));

            return res.json({
                success: true,
                isGuest: true,
                swapRef: `GUEST-SWAP-${Date.now()}`,
                fromSymbol: fromCrypto.symbol,
                toSymbol: toCrypto.symbol,
                fromQuantity: qty,
                toQuantity: toQty,
                rate: fromCrypto.current_price_usd / toCrypto.current_price_usd,
                networkFeeUsd: netFee,
                handlingFeeUsd: handFee,
                totalFeesUsd: netFee + handFee,
                netUsd: net,
                minReceived: minRec,
                message: `Simulated swap: ${qty} ${fromCrypto.symbol} -> ${toQty.toFixed(6)} ${toCrypto.symbol}`
            });
        }

        // Authenticated user execution
        const result = executeSimulatedSwap({
            userId: req.user.id,
            fromCryptoId: fromCrypto.id,
            toCryptoId: toCrypto.id,
            fromQuantity: qty,
            slippageTolerance: slip
        });

        const updatedWallet = getUserWallet(req.user.id);

        return res.json({
            success: true,
            isGuest: false,
            ...result,
            wallet: updatedWallet,
            portfolio: updatedWallet
        });

    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/simulator/portfolio
 * User portfolio overview and holdings
 */
router.get('/portfolio', authenticateToken, (req, res) => {
    try {
        const btc = db.prepare("SELECT current_price_usd FROM cryptocurrencies WHERE symbol = 'BTC'").get();
        const btcPrice = btc ? btc.current_price_usd : 73932.53;

        if (req.isGuest || !req.user) {
            const guestHoldings = [
                {
                    symbol: 'BTC',
                    crypto_name: 'Bitcoin',
                    quantity: 1.0,
                    avg_buy_price_usd: btcPrice,
                    current_price_usd: btcPrice,
                    current_value_usd: btcPrice,
                    total_invested_usd: btcPrice,
                    pnl_usd: 0,
                    pnl_percent: 0,
                    logo_url: './assets/coins/btc.svg'
                }
            ];
            const p = {
                availableCashUsd: 10000.00,
                investedUsd: btcPrice,
                totalPortfolioValueUsd: 10000.00 + btcPrice,
                totalProfitLossUsd: 0.00,
                totalProfitLossPercent: 0.00,
                holdings: guestHoldings
            };

            return res.json({
                success: true,
                isGuest: true,
                portfolio: p,
                wallet: p,
                holdings: guestHoldings,
                transactions: [],
                trades: []
            });
        }

        const portfolio = getUserWallet(req.user.id);
        const transactions = getWalletTransactions(req.user.id, 20);

        const trades = db.prepare(`
            SELECT t.*, c.name as crypto_name, c.logo_url
            FROM simulated_trades t
            JOIN cryptocurrencies c ON t.crypto_id = c.id
            WHERE t.user_id = ?
            ORDER BY t.executed_at DESC
            LIMIT 50
        `).all(req.user.id);

        return res.json({
            success: true,
            isGuest: false,
            portfolio,
            wallet: portfolio,
            holdings: portfolio ? portfolio.holdings : [],
            transactions,
            trades
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/simulator/trades
 * Trade history
 */
router.get('/trades', authenticateToken, (req, res) => {
    try {
        if (req.isGuest || !req.user) {
            return res.json({ success: true, isGuest: true, trades: [] });
        }

        const trades = db.prepare(`
            SELECT t.*, c.name as crypto_name, c.logo_url
            FROM simulated_trades t
            JOIN cryptocurrencies c ON t.crypto_id = c.id
            WHERE t.user_id = ?
            ORDER BY t.executed_at DESC
            LIMIT 50
        `).all(req.user.id);

        return res.json({ success: true, isGuest: false, trades });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

