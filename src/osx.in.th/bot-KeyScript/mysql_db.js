const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'osxhub_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Verify key_code and script_name for Roblox client execution.
 * Accepts account's user_key or a legacy key_code.
 * Verifies if user is not banned, and has purchased script_name.
 */
async function verifyKey(keyString, hwid, scriptName = null) {
    try {
        // 1. Check if the keyString belongs to a user (Account Key system)
        const [users] = await pool.execute(
            'SELECT id, username, is_banned, ban_reason, user_key FROM users WHERE user_key = ?',
            [keyString]
        );

        if (users.length > 0) {
            const user = users[0];
            if (user.is_banned) {
                return { success: false, message: `Access denied: You are banned for: ${user.ban_reason || 'No reason provided'}` };
            }

            // If scriptName is not provided (just checking key format)
            if (!scriptName) {
                return { success: true, message: 'Account key verified' };
            }

            // Clean the script name (e.g. Evade.lua -> Evade.lua, or Evade if no extension)
            const safeScriptName = scriptName.endsWith('.lua') ? scriptName : scriptName + '.lua';

            // Check if user bought this script
            // Find script ID by exact script_file match (e.g. Evade.lua)
            const [scripts] = await pool.execute(
                'SELECT id, name FROM scripts WHERE script_file = ? OR script_file = ?',
                [scriptName, safeScriptName]
            );

            if (scripts.length === 0) {
                return { success: false, message: `Script file mapping not found: ${scriptName}` };
            }

            const scriptId = scripts[0].id;

            // Fetch active or used keys belonging to this owner for this script
            const [keys] = await pool.execute(
                'SELECT id, key_code, duration, status, used_at, hwid FROM keys_store WHERE owner_id = ? AND script_id = ? ORDER BY id DESC',
                [user.id, scriptId]
            );

            if (keys.length === 0) {
                return { success: false, message: `You have not purchased this script: ${scripts[0].name}` };
            }

            const keyInfo = keys[0];
            
            // Check expiration based on duration & purchase/use date
            const usedTime = new Date(keyInfo.used_at).getTime();
            const now = Date.now();
            let expTime = null;
            const plan = keyInfo.duration;

            if (plan.includes('1 วัน')) {
                expTime = usedTime + 86400 * 1000;
            } else if (plan.includes('7 วัน')) {
                expTime = usedTime + 86400 * 7 * 1000;
            } else if (plan.includes('30 วัน')) {
                expTime = usedTime + 86400 * 30 * 1000;
            }

            if (expTime && now > expTime) {
                return { success: false, message: 'License expired for this script' };
            }

            // HWID Lock Verification
            if (!keyInfo.hwid) {
                // First run: Link HWID to keys_store
                await pool.execute(
                    'UPDATE keys_store SET hwid = ? WHERE id = ?',
                    [hwid, keyInfo.id]
                );
                return { success: true, message: 'License activated and HWID linked' };
            } else if (keyInfo.hwid === hwid) {
                return { success: true, message: 'License verified' };
            } else {
                // HWID Mismatch - Anti-share
                const banReason = `Automatic Ban: HWID Sharing detected for script ${scripts[0].name}. (Registered: ${keyInfo.hwid}, Run: ${hwid})`;
                await banUser(user.id, banReason);

                return {
                    success: false,
                    message: 'HWID mismatch. Key sharing detected. You have been automatically banned.',
                    is_automatic_ban: true,
                    discord_id: user.id,
                    key_string: keyString,
                    hwid1: keyInfo.hwid,
                    hwid2: hwid,
                    reason: banReason
                };
            }
        }

        // 2. Fallback: Check if it's a legacy license key code directly in keys_store (for backwards compatibility)
        const [keys] = await pool.execute(
            'SELECT k.id, k.key_code, k.duration, k.status, k.used_at, k.hwid, k.owner_id, s.name as script_name ' +
            'FROM keys_store k JOIN scripts s ON k.script_id = s.id WHERE k.key_code = ?',
            [keyString]
        );

        if (keys.length > 0) {
            const keyInfo = keys[0];

            if (keyInfo.owner_id) {
                const [owners] = await pool.execute('SELECT is_banned, ban_reason FROM users WHERE id = ?', [keyInfo.owner_id]);
                if (owners.length > 0 && owners[0].is_banned) {
                    return { success: false, message: `Access denied: User is banned` };
                }
            }

            // Check HWID
            if (!keyInfo.hwid) {
                await pool.execute('UPDATE keys_store SET hwid = ? WHERE id = ?', [hwid, keyInfo.id]);
                return { success: true, message: 'Key activated and HWID linked' };
            } else if (keyInfo.hwid === hwid) {
                return { success: true, message: 'Key verified' };
            } else {
                return { success: false, message: 'HWID mismatch' };
            }
        }

        return { success: false, message: 'Invalid Account Key or License Key' };
    } catch (error) {
        console.error('MySQL DB Verify Error:', error);
        return { success: false, message: 'Internal server validation error' };
    }
}

/**
 * Ban a user in MySQL db
 */
async function banUser(userId, reason) {
    try {
        await pool.execute(
            'UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?',
            [reason, userId]
        );
        return true;
    } catch (err) {
        console.error('banUser Error:', err);
        return false;
    }
}

module.exports = {
    pool,
    verifyKey,
    banUser
};
