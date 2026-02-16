/**
 * App Configuration & Feature Flags
 * Fetches from D1 app_config table
 */

import type { FeatureFlags } from '../../../shared/types';

export async function getConfig(db: D1Database): Promise<FeatureFlags> {
    const results = await db.prepare(`
    SELECT key, value, value_type FROM app_config
    WHERE key IN ('enable_phone_login', 'require_phone_verification_for_booking', 
                  'max_trip_requests_per_day', 'map_provider')
  `).all();

    const config: any = {};

    for (const row of results.results) {
        const key = row.key as string;
        const value = row.value as string;
        const type = row.value_type as string;

        switch (type) {
            case 'boolean':
                config[key] = value === 'true';
                break;
            case 'number':
                config[key] = parseInt(value, 10);
                break;
            case 'json':
                config[key] = JSON.parse(value);
                break;
            default:
                config[key] = value;
        }
    }

    // Defaults if not found
    return {
        enable_phone_login: config.enable_phone_login ?? false,
        require_phone_verification_for_booking: config.require_phone_verification_for_booking ?? false,
        max_trip_requests_per_day: config.max_trip_requests_per_day ?? 5,
        map_provider: config.map_provider ?? 'neshan',
    };
}

export async function updateConfig(
    db: D1Database,
    key: string,
    value: string,
    valueType: string,
    adminId: string
): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);

    await db.prepare(`
    UPDATE app_config 
    SET value = ?, value_type = ?, updated_at = ?, updated_by = ?
    WHERE key = ?
  `).bind(value, valueType, timestamp, adminId, key).run();
}
