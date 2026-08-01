/**
 * Lightweight i18n layer for Pi's interactive UI.
 *
 * English is the default language. The English source string doubles as the
 * dictionary key: `t("Open settings menu")` looks up the active locale's
 * dictionary and falls back to the original English string when no
 * translation exists, so unlocalized strings degrade gracefully.
 */

import { detectLocaleFromEnv } from "./detect.ts";
import { zhCN } from "./zh-CN.ts";

export type Locale = "en" | "zh-CN";

export type LanguageSetting = "auto" | Locale;

const dictionaries: Record<Locale, Readonly<Record<string, string>>> = {
	en: {},
	"zh-CN": zhCN,
};

let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
	currentLocale = locale;
}

export function getLocale(): Locale {
	return currentLocale;
}

/**
 * Resolve the effective locale from a settings value.
 * An explicit "en"/"zh-CN" wins; "auto" (and undefined) falls back to
 * environment detection.
 */
export function resolveLocale(languageSetting: LanguageSetting | undefined): Locale {
	if (languageSetting === "en" || languageSetting === "zh-CN") return languageSetting;
	return detectLocaleFromEnv();
}

/**
 * Translate a user-facing string. Uses the English source string as the key;
 * returns the key unchanged when the active locale has no translation.
 * Interpolation: `t("Copied {n} messages", { n: 3 })`.
 */
export function t(key: string, params?: Readonly<Record<string, string | number>>): string {
	const dictionary = dictionaries[currentLocale];
	let text = dictionary[key] ?? key;
	if (params) {
		for (const [name, value] of Object.entries(params)) {
			text = text.split(`{${name}}`).join(String(value));
		}
	}
	return text;
}
