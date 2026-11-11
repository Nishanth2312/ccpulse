const db = require('../database/db');
const { logAdminAction } = require('./auditService');

/**
 * Get current configured default welcome bonus
 */
function getConfiguredWelcomeBonus() {
    try {
        const row = db.prepare("SELECT value FROM system_settings WHERE key = 'default_welcome_bonus'").get();
        return row ? parseFloat(row.value) : 10000.00;
    } catch (e) {
        return 10000.00;
    }
}

/**
 * Atomically credit welcome bonus to a newly registered user
 * Guaranteed exactly once per user account:
 * Grants $10,000.00 USD Virtual Cash + 1.00000000 Bitcoin (BTC)
 */
function creditWelcomeBonus(userId) {
    const bonusAmount = getConfiguredWelcomeBonus();

    return db.transaction(() => {
        // 1. Check if user already has a wallet or was already credited
        const existingWallet = db.prepare('SELECT * FROM virtual_wallets WHERE user_id = ?').get(userId);

        if (existingWallet) {
            if (existingWallet.welcome_bonus_credited) {
                // Already received welcome bonus. Do NOT distribute again!
                return {
                    success: false,
                    alreadyCredited: true,
                    wallet: existingWallet,
                    message: 'Welcome bonus has already been credited to this account.'
                };
            }
        }

        // 2. Also check if a WELCOME_BONUS transaction already exists for this user (double-guard)
        const existingTx = db.prepare("SELECT id FROM virtual_wallet_transactions WHERE user_id = ? AND type = 'WELCOME_BONUS'").get(userId);
        if (existingTx) {
            return {
                success: false,
                alreadyCredited: true,
                message: 'Welcome bonus transaction record already exists.'
            };
        }

        let walletId;
        if (!existingWallet) {
            // Create new wallet with $10,000 USD
            const insertWallet = db.prepare(`
                INSERT INTO virtual_wallets (
                    user_id, currency, balance_usd, invested_usd, total_deposited_usd,
                    total_withdrawn_usd, welcome_bonus_credited
                ) VALUES (?, 'USD', ?, 0.00, ?, 0.00, 1)
            `);
            const res = insertWallet.run(userId, bonusAmount, bonusAmount);
            walletId = res.lastInsertRowid;
        } else {
            // Update existing uncredited wallet
            walletId = existingWallet.id;
            const newBalance = existingWallet.balance_usd + bonusAmount;
            const newTotalDep = existingWallet.total_deposited_usd + bonusAmount;
            db.prepare(`
                UPDATE virtual_wallets
                SET balance_usd = ?, total_deposited_usd = ?, welcome_bonus_credited = 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newBalance, newTotalDep, walletId);
        }

        // 3. Record cash transaction in auditable ledger
        const txRef = `WB-${Date.now()}-${userId}`;
        db.prepare(`
            INSERT INTO virtual_wallet_transactions (
                wallet_id, user_id, transaction_ref, type, amount_usd,
                currency, balance_before_usd, balance_after_usd, description, audit_reason
            ) VALUES (?, ?, ?, 'WELCOME_BONUS', ?, 'USD', 0.00, ?, 'CCPulse Welcome Bonus ($10,000 USD + 1.0 BTC)', 'Automated Registration Welcome Credit')
        `).run(walletId, userId, txRef, bonusAmount, bonusAmount);

        // 4. Also grant 1.00000000 Bitcoin (BTC) welcome bonus holding
        const btc = db.prepare("SELECT * FROM cryptocurrencies WHERE symbol = 'BTC'").get();
        if (btc) {
            const btcPrice = btc.current_price_usd || 73932.53;
            db.prepare(`
                INSERT INTO virtual_holdings (wallet_id, user_id, crypto_id, symbol, quantity, avg_buy_price_usd, total_invested_usd)
                VALUES (?, ?, ?, 'BTC', 1.00000000, ?, ?)
                ON CONFLICT(user_id, crypto_id) DO UPDATE SET quantity = quantity + 1.0
            `).run(walletId, userId, btc.id, btcPrice, btcPrice);

            // Record BTC transaction
            const btcTxRef = `WB-BTC-${Date.now()}-${userId}`;
            db.prepare(`
                INSERT INTO virtual_wallet_transactions (
                    wallet_id, user_id, transaction_ref, type, amount_usd,
                    currency, balance_before_usd, balance_after_usd, description, audit_reason
                ) VALUES (?, ?, ?, 'WELCOME_BONUS', ?, 'USD', ?, ?, 'Welcome Bonus: 1.00000000 BTC Gift Credited', 'Automated Registration BTC Welcome Gift')
            `).run(walletId, userId, btcTxRef, btcPrice, bonusAmount, bonusAmount);

            db.prepare('UPDATE virtual_wallets SET invested_usd = ? WHERE id = ?').run(btcPrice, walletId);
        }

        // 5. Create mandatory welcome notification
        db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Welcome to CCPulse!', 'Welcome to CCPulse! Your $10,000 virtual trading cash and 1.0 Bitcoin bonus are ready. Start learning, explore the markets, and practice trading without risking real money.', 'WELCOME_BONUS')
        `).run(userId);

        const updatedWallet = db.prepare('SELECT * FROM virtual_wallets WHERE id = ?').get(walletId);

        return {
            success: true,
            alreadyCredited: false,
            amount: bonusAmount,
            wallet: updatedWallet,
            notificationMessage: 'Welcome to CCPulse! Your $10,000 virtual trading cash and 1.0 Bitcoin bonus are ready. Start learning, explore the markets, and practice trading without risking real money.'
        };
    })();
}

/**
 * Get user wallet and portfolio summary
 */
function getUserWallet(userId) {
    const wallet = db.prepare('SELECT * FROM virtual_wallets WHERE user_id = ?').get(userId);
    if (!wallet) return null;

    const holdings = db.prepare(`
        SELECT h.*, c.name as crypto_name, c.current_price_usd, c.change_24h, c.logo_url
        FROM virtual_holdings h
        JOIN cryptocurrencies c ON h.crypto_id = c.id
        WHERE h.user_id = ? AND h.quantity > 0
    `).all(userId);

    let totalCurrentHoldingsValue = 0;
    let totalInvestedInActiveHoldings = 0;

    const enrichedHoldings = holdings.map(h => {
        const currentValue = h.quantity * h.current_price_usd;
        const pnlUsd = currentValue - h.total_invested_usd;
        const pnlPercent = h.total_invested_usd > 0 ? (pnlUsd / h.total_invested_usd) * 100 : 0;

        totalCurrentHoldingsValue += currentValue;
        totalInvestedInActiveHoldings += h.total_invested_usd;

        return {
            ...h,
            current_value_usd: currentValue,
            pnl_usd: pnlUsd,
            pnl_percent: pnlPercent
        };
    });

    const totalPortfolioValue = wallet.balance_usd + totalCurrentHoldingsValue;
    const totalPnlUsd = totalPortfolioValue - wallet.total_deposited_usd;
    const totalPnlPercent = wallet.total_deposited_usd > 0 ? (totalPnlUsd / wallet.total_deposited_usd) * 100 : 0;

    return {
        walletId: wallet.id,
        userId: wallet.user_id,
        availableCashUsd: wallet.balance_usd,
        investedUsd: totalCurrentHoldingsValue,
        totalPortfolioValueUsd: totalPortfolioValue,
        totalDepositedUsd: wallet.total_deposited_usd,
        totalProfitLossUsd: totalPnlUsd,
        totalProfitLossPercent: totalPnlPercent,
        holdings: enrichedHoldings
    };
}

/**
 * Execute simulated trade (BUY or SELL)
 */
function executeSimulatedTrade({ userId, cryptoId, type, quantity, customPrice = null }) {
    if (!userId) {
        throw new Error('User ID required for permanent simulated trading.');
    }

    const tradeType = type.toUpperCase();
    if (!['BUY', 'SELL'].includes(tradeType)) {
        throw new Error('Invalid trade type. Must be BUY or SELL.');
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
        throw new Error('Quantity must be a positive number.');
    }

    return db.transaction(() => {
        // 1. Fetch cryptocurrency
        const crypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(cryptoId);
        if (!crypto) {
            throw new Error('Cryptocurrency not found.');
        }
        if (!crypto.is_active) {
            throw new Error(`Cryptocurrency ${crypto.symbol} is currently inactive for trading.`);
        }

        const priceUsd = customPrice ? parseFloat(customPrice) : crypto.current_price_usd;
        if (priceUsd <= 0) {
            throw new Error('Invalid market price for cryptocurrency.');
        }

        const totalCostUsd = qty * priceUsd;

        // 2. Fetch Wallet
        const wallet = db.prepare('SELECT * FROM virtual_wallets WHERE user_id = ?').get(userId);
        if (!wallet) {
            throw new Error('Virtual wallet not found for user.');
        }

        const tradeRef = `TR-${tradeType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        if (tradeType === 'BUY') {
            // Check cash balance
            if (wallet.balance_usd < totalCostUsd) {
                throw new Error(`Insufficient virtual balance. Required: $${totalCostUsd.toFixed(2)}, Available: $${wallet.balance_usd.toFixed(2)} USD.`);
            }

            const newBalance = wallet.balance_usd - totalCostUsd;
            const newInvested = wallet.invested_usd + totalCostUsd;

            // Update wallet
            db.prepare(`
                UPDATE virtual_wallets
                SET balance_usd = ?, invested_usd = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newBalance, newInvested, wallet.id);

            // Update or insert holding
            const existingHolding = db.prepare('SELECT * FROM virtual_holdings WHERE user_id = ? AND crypto_id = ?').get(userId, crypto.id);
            if (existingHolding) {
                const newTotalQty = existingHolding.quantity + qty;
                const newTotalInvested = existingHolding.total_invested_usd + totalCostUsd;
                const newAvgPrice = newTotalInvested / newTotalQty;

                db.prepare(`
                    UPDATE virtual_holdings
                    SET quantity = ?, avg_buy_price_usd = ?, total_invested_usd = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(newTotalQty, newAvgPrice, newTotalInvested, existingHolding.id);
            } else {
                db.prepare(`
                    INSERT INTO virtual_holdings (wallet_id, user_id, crypto_id, symbol, quantity, avg_buy_price_usd, total_invested_usd)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(wallet.id, userId, crypto.id, crypto.symbol, qty, priceUsd, totalCostUsd);
            }

            // Record transaction
            db.prepare(`
                INSERT INTO virtual_wallet_transactions (
                    wallet_id, user_id, transaction_ref, type, amount_usd,
                    currency, balance_before_usd, balance_after_usd, description
                ) VALUES (?, ?, ?, 'BUY_ORDER', ?, 'USD', ?, ?, ?)
            `).run(
                wallet.id, userId, tradeRef, totalCostUsd, wallet.balance_usd, newBalance,
                `Purchased ${qty.toFixed(4)} ${crypto.symbol} at $${priceUsd.toFixed(2)} USD`
            );

        } else {
            // SELL ORDER
            const holding = db.prepare('SELECT * FROM virtual_holdings WHERE user_id = ? AND crypto_id = ?').get(userId, crypto.id);
            if (!holding || holding.quantity < qty) {
                const available = holding ? holding.quantity : 0;
                throw new Error(`Insufficient ${crypto.symbol} holding. Required: ${qty}, Available: ${available}`);
            }

            const proceedsUsd = qty * priceUsd;
            const newBalance = wallet.balance_usd + proceedsUsd;

            // Reduce holding
            const newQty = holding.quantity - qty;
            const costBasisPortion = holding.avg_buy_price_usd * qty;
            const newTotalInvested = Math.max(0, holding.total_invested_usd - costBasisPortion);

            db.prepare(`
                UPDATE virtual_holdings
                SET quantity = ?, total_invested_usd = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newQty, newTotalInvested, holding.id);

            // Update wallet
            const newWalletInvested = Math.max(0, wallet.invested_usd - costBasisPortion);
            db.prepare(`
                UPDATE virtual_wallets
                SET balance_usd = ?, invested_usd = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newBalance, newWalletInvested, wallet.id);

            // Record transaction
            db.prepare(`
                INSERT INTO virtual_wallet_transactions (
                    wallet_id, user_id, transaction_ref, type, amount_usd,
                    currency, balance_before_usd, balance_after_usd, description
                ) VALUES (?, ?, ?, 'SELL_ORDER', ?, 'USD', ?, ?, ?)
            `).run(
                wallet.id, userId, tradeRef, proceedsUsd, wallet.balance_usd, newBalance,
                `Sold ${qty.toFixed(4)} ${crypto.symbol} at $${priceUsd.toFixed(2)} USD`
            );
        }

        // Record simulated trade
        db.prepare(`
            INSERT INTO simulated_trades (
                trade_ref, user_id, is_guest, crypto_id, symbol,
                type, quantity, price_usd, total_value_usd, status
            ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, 'EXECUTED')
        `).run(tradeRef, userId, crypto.id, crypto.symbol, tradeType, qty, priceUsd, totalCostUsd);

        // Increment simulation count on cryptocurrency
        db.prepare('UPDATE cryptocurrencies SET simulation_count = simulation_count + 1 WHERE id = ?').run(crypto.id);

        return {
            success: true,
            tradeRef,
            type: tradeType,
            symbol: crypto.symbol,
            quantity: qty,
            priceUsd,
            totalValueUsd: totalCostUsd,
            message: `Successfully executed ${tradeType} for ${qty.toFixed(4)} ${crypto.symbol} at $${priceUsd.toFixed(2)} USD`
        };
    })();
}

/**
 * Admin virtual balance adjustment (Grant or Deduct)
 */
function adminAdjustBalance({ adminId, adminUsername, targetUserId, action, amount, auditReason }) {
    const adjAmount = parseFloat(amount);
    if (isNaN(adjAmount) || adjAmount <= 0) {
        throw new Error('Adjustment amount must be a positive number.');
    }
    if (!auditReason || auditReason.trim().length === 0) {
        throw new Error('An audit reason is strictly mandatory for administrator balance adjustments.');
    }

    const act = action.toUpperCase();
    if (!['GRANT', 'DEDUCT'].includes(act)) {
        throw new Error('Action must be GRANT or DEDUCT.');
    }

    return db.transaction(() => {
        const wallet = db.prepare('SELECT * FROM virtual_wallets WHERE user_id = ?').get(targetUserId);
        if (!wallet) {
            throw new Error(`Target user ${targetUserId} does not have an active virtual wallet.`);
        }

        let newBalance;
        let txType;
        let description;

        if (act === 'GRANT') {
            newBalance = wallet.balance_usd + adjAmount;
            txType = 'ADMIN_GRANT';
            description = `Administrative Credit Grant: +$${adjAmount.toFixed(2)} USD`;
        } else {
            if (wallet.balance_usd < adjAmount) {
                throw new Error(`Cannot deduct $${adjAmount.toFixed(2)}. User only has $${wallet.balance_usd.toFixed(2)} USD available.`);
            }
            newBalance = wallet.balance_usd - adjAmount;
            txType = 'ADMIN_DEDUCT';
            description = `Administrative Debit Deduction: -$${adjAmount.toFixed(2)} USD`;
        }

        // Update wallet
        db.prepare(`
            UPDATE virtual_wallets
            SET balance_usd = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(newBalance, wallet.id);

        // Record transaction
        const txRef = `ADM-ADJ-${Date.now()}-${targetUserId}`;
        db.prepare(`
            INSERT INTO virtual_wallet_transactions (
                wallet_id, user_id, transaction_ref, type, amount_usd,
                currency, balance_before_usd, balance_after_usd, description, audit_reason
            ) VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?)
        `).run(
            wallet.id, targetUserId, txRef, txType, adjAmount,
            wallet.balance_usd, newBalance, description, auditReason
        );

        // Audit log
        logAdminAction({
            adminId,
            adminUsername,
            action: `WALLET_BALANCE_${act}`,
            entityType: 'virtual_wallets',
            entityId: wallet.id,
            oldValues: { balance_usd: wallet.balance_usd },
            newValues: { balance_usd: newBalance },
            auditReason,
            ipAddress: 'admin-action'
        });

        // Notification to user
        db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Virtual Balance Adjustment', ?, 'ADMIN')
        `).run(
            targetUserId,
            `Your virtual trading balance was adjusted by an administrator: ${act === 'GRANT' ? '+' : '-'}$${adjAmount.toFixed(2)} USD. Reason: ${auditReason}`
        );

        return {
            success: true,
            txRef,
            action: act,
            adjustedAmount: adjAmount,
            previousBalance: wallet.balance_usd,
            newBalance,
            auditReason
        };
    })();
}

/**
 * Get virtual account transaction history for a user
 */
function getWalletTransactions(userId, limit = 50) {
    return db.prepare(`
        SELECT * FROM virtual_wallet_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    `).all(userId, limit);
}

/**
 * Get all bonus distributions (for admin panel)
 */
function getBonusDistributionHistory(limit = 100) {
    return db.prepare(`
        SELECT t.*, u.username, u.email, u.full_name
        FROM virtual_wallet_transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.type = 'WELCOME_BONUS'
        ORDER BY t.created_at DESC
        LIMIT ?
    `).all(limit);
}

/**
 * Execute simulated cryptocurrency swap (Coin-to-Coin DEX simulation)
 */
function executeSimulatedSwap({
    userId,
    fromCryptoId,
    toCryptoId,
    fromQuantity,
    slippageTolerance = 0.5,
    networkFeePct = 0.15,
    handlingFeePct = 0.25
}) {
    if (!userId) {
        throw new Error('User ID required for simulated swap.');
    }

    const fromQty = parseFloat(fromQuantity);
    if (isNaN(fromQty) || fromQty <= 0) {
        throw new Error('From quantity must be a positive number.');
    }

    if (String(fromCryptoId) === String(toCryptoId)) {
        throw new Error('Cannot swap a token to itself. Please choose two different assets.');
    }

    return db.transaction(() => {
        // 1. Fetch both cryptocurrencies (support id or symbol)
        let fromCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(fromCryptoId);
        if (!fromCrypto && typeof fromCryptoId === 'string') {
            fromCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE LOWER(symbol) = LOWER(?)').get(fromCryptoId);
        }

        let toCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE id = ?').get(toCryptoId);
        if (!toCrypto && typeof toCryptoId === 'string') {
            toCrypto = db.prepare('SELECT * FROM cryptocurrencies WHERE LOWER(symbol) = LOWER(?)').get(toCryptoId);
        }

        if (!fromCrypto || !toCrypto) {
            throw new Error('One or both selected cryptocurrencies could not be found.');
        }

        const fromPrice = fromCrypto.current_price_usd;
        const toPrice = toCrypto.current_price_usd;

        if (fromPrice <= 0 || toPrice <= 0) {
            throw new Error('Invalid market pricing for selected swap pair.');
        }

        // 2. Fetch User Wallet and Holding
        const wallet = db.prepare('SELECT * FROM virtual_wallets WHERE user_id = ?').get(userId);
        if (!wallet) {
            throw new Error('User virtual wallet not found.');
        }

        const fromHolding = db.prepare('SELECT * FROM virtual_holdings WHERE user_id = ? AND crypto_id = ?').get(userId, fromCrypto.id);
        if (!fromHolding || fromHolding.quantity < fromQty) {
            const avail = fromHolding ? fromHolding.quantity : 0;
            throw new Error(`Insufficient ${fromCrypto.symbol} balance. Required: ${fromQty}, Available: ${avail}`);
        }

        // 3. Compute Gross Value and Realistic DEX Fees
        const grossUsd = fromQty * fromPrice;
        const netFeeUsd = grossUsd * (networkFeePct / 100);
        const handFeeUsd = grossUsd * (handlingFeePct / 100);
        const totalFeesUsd = netFeeUsd + handFeeUsd;
        const netUsd = grossUsd - totalFeesUsd;

        if (netUsd <= 0) {
            throw new Error('Swap value is too low to cover transaction and handling fees.');
        }

        const toQuantity = netUsd / toPrice;
        const minReceived = toQuantity * (1 - (slippageTolerance / 100));
        const rate = fromPrice / toPrice;

        // 4. Update fromHolding
        const newFromQty = fromHolding.quantity - fromQty;
        const costBasisPortion = fromHolding.avg_buy_price_usd * fromQty;
        const newFromInvested = Math.max(0, fromHolding.total_invested_usd - costBasisPortion);

        db.prepare(`
            UPDATE virtual_holdings
            SET quantity = ?, total_invested_usd = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(newFromQty, newFromInvested, fromHolding.id);

        // 5. Update or insert toHolding
        const toHolding = db.prepare('SELECT * FROM virtual_holdings WHERE user_id = ? AND crypto_id = ?').get(userId, toCrypto.id);
        if (toHolding) {
            const newToQty = toHolding.quantity + toQuantity;
            const newToInvested = toHolding.total_invested_usd + netUsd;
            const newAvgPrice = newToInvested / newToQty;

            db.prepare(`
                UPDATE virtual_holdings
                SET quantity = ?, avg_buy_price_usd = ?, total_invested_usd = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newToQty, newAvgPrice, newToInvested, toHolding.id);
        } else {
            db.prepare(`
                INSERT INTO virtual_holdings (wallet_id, user_id, crypto_id, symbol, quantity, avg_buy_price_usd, total_invested_usd)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(wallet.id, userId, toCrypto.id, toCrypto.symbol, toQuantity, toPrice, netUsd);
        }

        // Update wallet invested_usd
        const newInvestedUsd = Math.max(0, (wallet.invested_usd - costBasisPortion) + netUsd);
        db.prepare('UPDATE virtual_wallets SET invested_usd = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newInvestedUsd, wallet.id);

        // 6. Record in virtual_wallet_transactions
        const swapRef = `SWAP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        db.prepare(`
            INSERT INTO virtual_wallet_transactions (
                wallet_id, user_id, transaction_ref, type, amount_usd,
                currency, balance_before_usd, balance_after_usd, description, audit_reason
            ) VALUES (?, ?, ?, 'SWAP', ?, 'USD', ?, ?, ?, ?)
        `).run(
            wallet.id, userId, swapRef, grossUsd, wallet.balance_usd, wallet.balance_usd,
            `DEX Swap: ${fromQty.toFixed(4)} ${fromCrypto.symbol} -> ${toQuantity.toFixed(4)} ${toCrypto.symbol} (Fees: $${totalFeesUsd.toFixed(2)})`,
            `DEX Swap Execution (Network Gas: ${networkFeePct}%, Liquidity Handling: ${handlingFeePct}%)`
        );

        // 7. Record in simulated_trades
        db.prepare(`
            INSERT INTO simulated_trades (
                trade_ref, user_id, is_guest, crypto_id, symbol,
                type, quantity, price_usd, total_value_usd, status
            ) VALUES (?, ?, 0, ?, ?, 'SWAP', ?, ?, ?, 'EXECUTED')
        `).run(swapRef, userId, toCrypto.id, `${fromCrypto.symbol}->${toCrypto.symbol}`, toQuantity, toPrice, netUsd);

        return {
            success: true,
            swapRef,
            fromSymbol: fromCrypto.symbol,
            toSymbol: toCrypto.symbol,
            fromQuantity: fromQty,
            toQuantity,
            rate,
            fromPriceUsd: fromPrice,
            toPriceUsd: toPrice,
            grossUsd,
            networkFeeUsd: netFeeUsd,
            handlingFeeUsd: handFeeUsd,
            totalFeesUsd,
            netUsd,
            minReceived,
            message: `Successfully swapped ${fromQty} ${fromCrypto.symbol} for ${toQuantity.toFixed(6)} ${toCrypto.symbol}`
        };
    })();
}

module.exports = {
    getConfiguredWelcomeBonus,
    creditWelcomeBonus,
    getUserWallet,
    executeSimulatedTrade,
    executeSimulatedSwap,
    adminAdjustBalance,
    getWalletTransactions,
    getBonusDistributionHistory
};

