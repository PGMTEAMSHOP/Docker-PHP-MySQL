const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize database
// Table for users
db.exec(`CREATE TABLE IF NOT EXISTS users (
    discord_id TEXT PRIMARY KEY,
    username TEXT,
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT,
    last_hwid_reset DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Table for keys
db.exec(`CREATE TABLE IF NOT EXISTS keys (
    id TEXT PRIMARY KEY,
    key_string TEXT UNIQUE,
    hwid TEXT,
    discord_id TEXT,
    expires_at DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Migrations
try {
    db.exec("ALTER TABLE keys ADD COLUMN discord_id TEXT");
} catch (err) {}
try {
    db.exec("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0");
} catch (err) {}
try {
    db.exec("ALTER TABLE users ADD COLUMN ban_reason TEXT");
} catch (err) {}
try {
    db.exec("ALTER TABLE users ADD COLUMN last_hwid_reset DATETIME");
} catch (err) {}

/**
 * Generate a random key string
 */
function generateKey(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto.randomBytes(length);
    let result = 'OSXHUB-';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
}

/**
 * Create a new key
 */
function createKey(discordId = null, hours = 12) {
    return new Promise((resolve, reject) => {
        try {
            const keyString = generateKey();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + hours);
            const expiresAtStr = expiresAt.toISOString();

            const id = Math.random().toString(36).substring(7);

            const stmt = db.prepare("INSERT INTO keys (id, key_string, discord_id, expires_at) VALUES (?, ?, ?, ?)");
            stmt.run(id, keyString, discordId, expiresAtStr);

            // Ensure user exists in users table if discordId is provided
            if (discordId) {
                try {
                    const userStmt = db.prepare("INSERT OR IGNORE INTO users (discord_id) VALUES (?)");
                    userStmt.run(discordId);
                } catch (err) {}
            }

            resolve({ id, keyString, expiresAt });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Get an active key for a user
 */
function getUserActiveKey(discordId) {
    return new Promise((resolve, reject) => {
        try {
            const now = new Date().toISOString();
            const stmt = db.prepare("SELECT * FROM keys WHERE discord_id = ? AND expires_at > ? AND is_active = 1");
            const row = stmt.get(discordId, now);
            resolve(row || null);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Verify a key with HWID
 */
function verifyKey(keyString, hwid) {
    return new Promise((resolve, reject) => {
        try {
            const stmt = db.prepare("SELECT * FROM keys WHERE key_string = ? AND is_active = 1");
            const row = stmt.get(keyString);

            if (!row) return resolve({ success: false, message: 'Invalid key' });

            // Check if owner of the key is banned
            if (row.discord_id) {
                const userStmt = db.prepare("SELECT * FROM users WHERE discord_id = ?");
                const user = userStmt.get(row.discord_id);
                if (user && user.is_banned) {
                    return resolve({ success: false, message: `Access denied: You are banned for: ${user.ban_reason || 'No reason provided'}` });
                }
            }

            const now = new Date();
            const expiresAt = new Date(row.expires_at);

            if (now > expiresAt) {
                return resolve({ success: false, message: 'Key expired' });
            }

            // If HWID is not set, set it now (first time using)
            if (!row.hwid) {
                const updateStmt = db.prepare("UPDATE keys SET hwid = ? WHERE id = ?");
                updateStmt.run(hwid, row.id);
                resolve({ success: true, message: 'Key activated and HWID linked' });
            } else if (row.hwid === hwid) {
                resolve({ success: true, message: 'Key verified' });
            } else {
                // ANTI-SHARE: HWID Mismatch - Automatically BAN the user
                if (row.discord_id) {
                    const banReason = `Automatic Ban: Key Sharing/Multi-HWID usage detected. (First HWID: ${row.hwid}, Second HWID: ${hwid})`;
                    banUser(row.discord_id, banReason);
                    return resolve({ 
                        success: false, 
                        message: 'Key sharing detected. You have been automatically banned.',
                        is_automatic_ban: true,
                        discord_id: row.discord_id,
                        key_string: row.key_string,
                        hwid1: row.hwid,
                        hwid2: hwid,
                        reason: banReason
                    });
                }
                resolve({ success: false, message: 'HWID mismatch' });
            }
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Get info about a key
 */
function getKeyInfo(keyString) {
    return new Promise((resolve, reject) => {
        try {
            const stmt = db.prepare("SELECT * FROM keys WHERE key_string = ?");
            const row = stmt.get(keyString);
            resolve(row || null);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Delete a key
 */
function deleteKey(keyString) {
    return new Promise((resolve, reject) => {
        try {
            const stmt = db.prepare("DELETE FROM keys WHERE key_string = ?");
            const result = stmt.run(keyString);
            resolve({ changes: result.changes });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Get all keys
 */
function getAllKeys() {
    return new Promise((resolve, reject) => {
        try {
            const stmt = db.prepare("SELECT * FROM keys ORDER BY created_at DESC");
            const rows = stmt.all();
            resolve(rows || []);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Ban a user
 */
function banUser(discordId, reason) {
    try {
        const stmt = db.prepare("INSERT INTO users (discord_id, is_banned, ban_reason) VALUES (?, 1, ?) ON CONFLICT(discord_id) DO UPDATE SET is_banned = 1, ban_reason = ?");
        stmt.run(discordId, reason, reason);
        // Also deactivate their keys
        const deactivateStmt = db.prepare("UPDATE keys SET is_active = 0 WHERE discord_id = ?");
        deactivateStmt.run(discordId);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

/**
 * Unban a user
 */
function unbanUser(discordId) {
    try {
        const stmt = db.prepare("UPDATE users SET is_banned = 0, ban_reason = NULL WHERE discord_id = ?");
        stmt.run(discordId);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

/**
 * Unban all users
 */
function unbanAllUsers() {
    try {
        const stmt = db.prepare("UPDATE users SET is_banned = 0, ban_reason = NULL");
        const result = stmt.run();
        // Also reactivate keys for these users (optional, but usually desired if unbanning)
        const reactivateStmt = db.prepare("UPDATE keys SET is_active = 1 WHERE discord_id IN (SELECT discord_id FROM users WHERE is_banned = 0)");
        reactivateStmt.run();
        return { success: true, changes: result.changes };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
}

/**
 * Get list of banned users
 */
function getBannedUsers() {
    try {
        const stmt = db.prepare("SELECT * FROM users WHERE is_banned = 1 ORDER BY created_at DESC");
        return stmt.all() || [];
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Check if a user is banned
 */
function isUserBanned(discordId) {
    try {
        const stmt = db.prepare("SELECT is_banned, ban_reason FROM users WHERE discord_id = ?");
        const row = stmt.get(discordId);
        return row && row.is_banned === 1 ? { banned: true, reason: row.ban_reason } : { banned: false };
    } catch (err) {
        console.error(err);
        return { banned: false };
    }
}

/**
 * Delete all keys except those belonging to banned users
 */
function removeAllKeysExceptBanned() {
    return new Promise((resolve, reject) => {
        try {
            // ลบคีย์ทั้งหมด โดยยกเว้นคีย์ที่เจ้าของถูกแบนไว้
            // (รวมถึงลบคีย์ที่ไม่มีเจ้าของ หรือ discord_id เป็น null ด้วย)
            const stmt = db.prepare(`
                DELETE FROM keys 
                WHERE discord_id IS NULL 
                OR discord_id NOT IN (SELECT discord_id FROM users WHERE is_banned = 1)
            `);
            const result = stmt.run();
            resolve({ changes: result.changes });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Reset HWID for a user's active key
 */
function resetHWID(discordId) {
    return new Promise((resolve, reject) => {
        try {
            const updateStmt = db.prepare("UPDATE keys SET hwid = NULL WHERE discord_id = ? AND is_active = 1 AND expires_at > ?");
            const now = new Date().toISOString();
            const result = updateStmt.run(discordId, now);
            
            if (result.changes > 0) {
                // Update last_hwid_reset time
                const userUpdateStmt = db.prepare("UPDATE users SET last_hwid_reset = ? WHERE discord_id = ?");
                userUpdateStmt.run(new Date().toISOString(), discordId);
                resolve({ success: true, changes: result.changes });
            } else {
                resolve({ success: false, message: 'No active key found to reset HWID' });
            }
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Get user data
 */
function getUserData(discordId) {
    try {
        const stmt = db.prepare("SELECT * FROM users WHERE discord_id = ?");
        const row = stmt.get(discordId);
        return row || null;
    } catch (err) {
        console.error(err);
        return null;
    }
}

module.exports = {
    db,
    createKey,
    verifyKey,
    getKeyInfo,
    getUserActiveKey,
    deleteKey,
    getAllKeys,
    banUser,
    unbanUser,
    unbanAllUsers,
    getBannedUsers,
    isUserBanned,
    getUserData,
    resetHWID,
    removeAllKeysExceptBanned
};

