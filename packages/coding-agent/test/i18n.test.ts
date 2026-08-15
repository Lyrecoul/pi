import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { detectLocaleFromEnv } from "../src/i18n/detect.ts";
import { getLocale, resolveLocale, setLocale, t } from "../src/i18n/index.ts";

function walkTsFiles(dir: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(dir)) {
		const filePath = join(dir, entry);
		if (statSync(filePath).isDirectory()) {
			if (entry !== "i18n") files.push(...walkTsFiles(filePath));
		} else if (entry.endsWith(".ts")) {
			files.push(filePath);
		}
	}
	return files;
}

const originalLocaleEnv = {
	LC_ALL: process.env.LC_ALL,
	LC_MESSAGES: process.env.LC_MESSAGES,
	LANG: process.env.LANG,
} as const;

function clearLocaleEnv(): void {
	delete process.env.LC_ALL;
	delete process.env.LC_MESSAGES;
	delete process.env.LANG;
}

describe("i18n", () => {
	afterEach(() => {
		for (const key of ["LC_ALL", "LC_MESSAGES", "LANG"] as const) {
			const original = originalLocaleEnv[key];
			if (original === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = original;
			}
		}
		setLocale("en");
	});

	describe("t()", () => {
		it("returns the key unchanged for the default (English) locale", () => {
			expect(getLocale()).toBe("en");
			expect(t("Open settings menu")).toBe("Open settings menu");
		});

		it("returns the Chinese translation when zh-CN is active", () => {
			setLocale("zh-CN");
			expect(getLocale()).toBe("zh-CN");
			expect(t("Open settings menu")).toBe("打开设置菜单");
		});

		it("falls back to the key when no translation exists", () => {
			setLocale("zh-CN");
			expect(t("Untranslated string here")).toBe("Untranslated string here");
		});

		it("interpolates placeholders on the English fallback", () => {
			expect(t("Copied {n} messages", { n: 3 })).toBe("Copied 3 messages");
		});

		it("interpolates placeholders in translated strings", () => {
			setLocale("zh-CN");
			expect(t("Quit {app}", { app: "pi" })).toBe("退出 pi");
		});

		it("translates trust dialog strings", () => {
			setLocale("zh-CN");
			expect(t("Trust")).toBe("信任");
			expect(t("Do not trust (this session only)")).toBe("不信任（仅本次会话）");
			expect(t("Trust parent folder ({path})", { path: "/home/u" })).toBe("信任父文件夹（/home/u）");
			expect(
				t(
					"Trust project folder?\n{cwd}\n\nThis allows {app} to load {configDir} settings and resources, install missing project packages, and execute project extensions.",
					{
						app: "pi",
						cwd: "/repo",
						configDir: ".pi",
					},
				),
			).toBe("信任项目文件夹？\n/repo\n\n这将允许 pi 加载 .pi 设置和资源、安装缺失的项目包，并执行项目扩展。");
		});

		it("translates tool output expand hints", () => {
			setLocale("zh-CN");
			expect(t("to expand")).toBe("展开");
			expect(t("Empty regex")).toBe("空正则表达式");
			expect(t("Thinking...")).toBe("正在思考…");
		});

		it("translates CLI help strings", () => {
			setLocale("zh-CN");
			expect(t("Usage:")).toBe("用法：");
			expect(t("Show this help")).toBe("显示此帮助");
			expect(t('Model "{model}" not found. Use --list-models to see available models.', { model: "gpt-4" })).toBe(
				'找不到模型 "gpt-4"。使用 --list-models 查看可用模型。',
			);
			expect(t("{app} is already up to date (v{version})", { app: "pi", version: "0.83.0" })).toBe(
				"pi 已是最新版本（v0.83.0）",
			);
		});

		it("translates slash command and prompt descriptions", () => {
			setLocale("zh-CN");
			expect(t("Quit pi")).toBe("退出 pi");
			expect(t("Audit changelog entries before release")).toBe("发布前审计变更日志条目");
			expect(t("Analyze GitHub issues (bugs or feature requests)")).toBe("分析 GitHub issue（错误或功能请求）");
			expect(t("Show TUI stats")).toBe("显示 TUI 统计信息");
		});

		it("translates login dialog strings", () => {
			setLocale("zh-CN");
			expect(t("Select authentication method:")).toBe("选择认证方式：");
			expect(t("Sign in with an account")).toBe("使用账户登录");
			expect(t("Sign in with an API key")).toBe("使用 API 密钥登录");
			expect(t("No providers available")).toBe("没有可用的提供商");
		});

		it("translates extension notification strings", () => {
			setLocale("zh-CN");
			expect(t("TUI full redraws: {n}", { n: 1 })).toBe("TUI 全量重绘次数：1");
			expect(t("Import cancelled")).toBe("导入已取消");
			expect(t("Session already imported")).toBe("会话已导入");
			expect(
				t("TPS {tps} tok/s. out {out}, in {input}, cache r/w {cacheRead}/{cacheWrite}, total {total}, {elapsed}s", {
					tps: "55.7",
					out: "17,000",
					input: "9,024",
					cacheRead: "7,382,656",
					cacheWrite: "0",
					total: "7,408,680",
					elapsed: "305.2",
				}),
			).toBe("TPS 55.7 tok/s。输出 17,000，输入 9,024，缓存读/写 7,382,656/0，总计 7,408,680，305.2s");
		});

		it("covers every t() key used in src with a zh-CN translation", () => {
			const srcDir = fileURLToPath(new URL("../src", import.meta.url));
			const dictSource = readFileSync(join(srcDir, "i18n/zh-CN.ts"), "utf8");
			const dictKeys = new Set<string>();
			for (const match of dictSource.matchAll(/^\s*"((?:[^"\\]|\\.)*)":|^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:/gm)) {
				dictKeys.add((match[1] ?? match[2]).replace(/\\n/g, "\n"));
			}

			const missing: string[] = [];
			for (const file of walkTsFiles(srcDir)) {
				const source = readFileSync(file, "utf8");
				const callPattern = /(?<![A-Za-z0-9_$.])t\(\s*"((?:[^"\\]|\\.|\n)*)"/g;
				for (const match of source.matchAll(callPattern)) {
					const key = match[1].replace(/\\n/g, "\n");
					if (!dictKeys.has(key)) missing.push(key);
				}
			}

			expect([...new Set(missing)].sort()).toEqual([]);
		});
	});

	describe("resolveLocale()", () => {
		it("honors an explicit locale", () => {
			expect(resolveLocale("en")).toBe("en");
			expect(resolveLocale("zh-CN")).toBe("zh-CN");
		});

		it("resolves auto and undefined from the environment", () => {
			clearLocaleEnv();
			expect(resolveLocale("auto")).toBe("en");
			expect(resolveLocale(undefined)).toBe("en");
			process.env.LANG = "zh_CN.UTF-8";
			expect(resolveLocale("auto")).toBe("zh-CN");
		});
	});

	describe("detectLocaleFromEnv()", () => {
		it("detects Chinese from LANG", () => {
			clearLocaleEnv();
			process.env.LANG = "zh_CN.UTF-8";
			expect(detectLocaleFromEnv()).toBe("zh-CN");
		});

		it("detects English from LANG", () => {
			clearLocaleEnv();
			process.env.LANG = "en_US.UTF-8";
			expect(detectLocaleFromEnv()).toBe("en");
		});

		it("prefers LC_ALL over LANG", () => {
			clearLocaleEnv();
			process.env.LANG = "zh_CN.UTF-8";
			process.env.LC_ALL = "en_US.UTF-8";
			expect(detectLocaleFromEnv()).toBe("en");
		});

		it("prefers LC_MESSAGES over LANG", () => {
			clearLocaleEnv();
			process.env.LANG = "en_US.UTF-8";
			process.env.LC_MESSAGES = "zh_CN.UTF-8";
			expect(detectLocaleFromEnv()).toBe("zh-CN");
		});

		it("defaults to English when no locale is set", () => {
			clearLocaleEnv();
			expect(detectLocaleFromEnv()).toBe("en");
		});

		it("defaults to English for unrelated locales", () => {
			clearLocaleEnv();
			process.env.LANG = "de_DE.UTF-8";
			expect(detectLocaleFromEnv()).toBe("en");
		});
	});
});

describe("SettingsManager language setting", () => {
	const testDir = join(process.cwd(), "test-i18n-settings-tmp");
	const agentDir = join(testDir, "agent");
	const projectDir = join(testDir, "project");

	beforeEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true });
		}
		mkdirSync(agentDir, { recursive: true });
		mkdirSync(join(projectDir, ".pi"), { recursive: true });
	});

	afterEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true });
		}
	});

	it("defaults to auto", () => {
		const manager = SettingsManager.create(projectDir, agentDir);
		expect(manager.getLanguageSetting()).toBe("auto");
	});

	it("reads an explicit language from settings.json", () => {
		writeFileSync(join(agentDir, "settings.json"), JSON.stringify({ language: "zh-CN" }));
		const manager = SettingsManager.create(projectDir, agentDir);
		expect(manager.getLanguageSetting()).toBe("zh-CN");
	});

	it("treats unknown language values as auto", () => {
		writeFileSync(join(agentDir, "settings.json"), JSON.stringify({ language: "fr" }));
		const manager = SettingsManager.create(projectDir, agentDir);
		expect(manager.getLanguageSetting()).toBe("auto");
	});

	it("persists setLanguageSetting", async () => {
		const manager = SettingsManager.create(projectDir, agentDir);
		manager.setLanguageSetting("zh-CN");
		await manager.flush();
		const saved = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf-8"));
		expect(saved.language).toBe("zh-CN");
	});
});
