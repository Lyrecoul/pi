/**
 * Locale detection from the process environment.
 */

import type { Locale } from "./index.ts";

/**
 * Detect the preferred UI locale from environment variables.
 * Checks `LC_ALL`, then `LC_MESSAGES`, then `LANG`; a value starting with
 * `zh` selects Chinese, `en` selects English, anything else defaults to
 * English.
 */
export function detectLocaleFromEnv(): Locale {
	const candidates = [process.env.LC_ALL, process.env.LC_MESSAGES, process.env.LANG];
	for (const candidate of candidates) {
		if (!candidate) continue;
		const normalized = candidate.toLowerCase();
		if (normalized.startsWith("zh")) return "zh-CN";
		if (normalized.startsWith("en")) return "en";
	}
	return "en";
}
