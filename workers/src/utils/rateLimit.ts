/**
 * Rate Limiting Utility
 * Uses D1 rate_limits table for persistence
 */

export async function rateLimitCheck(
    db: D1Database,
    key: string,
    maxAttempts: number,
    windowSeconds: number
): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Clean up expired entries first
    await db.prepare('DELETE FROM rate_limits WHERE expires_at < ?')
        .bind(now).run();

    // Check existing rate limit
    const existing = await db.prepare(
        'SELECT count, window_start, expires_at FROM rate_limits WHERE key = ?'
    ).bind(key).first();

    if (existing) {
        const count = existing.count as number;
        const expiresAt = existing.expires_at as number;

        // If still within window
        if (expiresAt > now) {
            if (count >= maxAttempts) {
                return false; // Rate limit exceeded
            }

            // Increment count
            await db.prepare(
                'UPDATE rate_limits SET count = count + 1 WHERE key = ?'
            ).bind(key).run();

            return true;
        } else {
            // Window expired, reset
            await db.prepare(`
        UPDATE rate_limits 
        SET count = 1, window_start = ?, expires_at = ?
        WHERE key = ?
      `).bind(now, now + windowSeconds, key).run();

            return true;
        }
    } else {
        // First attempt, create new entry
        await db.prepare(`
      INSERT INTO rate_limits (id, key, count, window_start, expires_at)
      VALUES (?, ?, 1, ?, ?)
    `).bind(crypto.randomUUID(), key, now, now + windowSeconds).run();

        return true;
    }
}

export async function getRateLimitStatus(
    db: D1Database,
    key: string,
    maxAttempts: number
): Promise<{ remaining: number; resetAt: number } | null> {
    const existing = await db.prepare(
        'SELECT count, expires_at FROM rate_limits WHERE key = ?'
    ).bind(key).first();

    if (!existing) {
        return { remaining: maxAttempts, resetAt: 0 };
    }

    const count = existing.count as number;
    const expiresAt = existing.expires_at as number;
    const now = Math.floor(Date.now() / 1000);

    if (expiresAt < now) {
        return { remaining: maxAttempts, resetAt: 0 };
    }

    return {
        remaining: Math.max(0, maxAttempts - count),
        resetAt: expiresAt,
    };
}
