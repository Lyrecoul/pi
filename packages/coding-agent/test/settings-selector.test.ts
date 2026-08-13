import { setKeybindings } from "@earendil-works/pi-tui";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { KeybindingsManager } from "../src/core/keybindings.ts";
import { setLocale } from "../src/i18n/index.ts";
import {
	type SettingsCallbacks,
	type SettingsConfig,
	SettingsSelectorComponent,
} from "../src/modes/interactive/components/settings-selector.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

function createSettingsConfig(): SettingsConfig {
	return {
		autoCompact: true,
		showImages: true,
		imageWidthCells: 80,
		autoResizeImages: false,
		blockImages: false,
		enableSkillCommands: true,
		steeringMode: "all",
		followUpMode: "all",
		transport: "sse",
		httpIdleTimeoutMs: 300_000,
		thinkingLevel: "medium",
		availableThinkingLevels: ["off", "minimal", "low", "medium", "high", "xhigh", "max"],
		currentTheme: "dark",
		terminalTheme: "dark",
		availableThemes: ["dark", "light"],
		hideThinkingBlock: false,
		mermaidRenderingMode: "off",
		showCacheMissNotices: false,
		collapseChangelog: true,
		enableInstallTelemetry: true,
		doubleEscapeAction: "tree",
		treeFilterMode: "default",
		showHardwareCursor: false,
		editorPaddingX: 1,
		outputPad: 0,
		autocompleteMaxVisible: 7,
		quietStartup: false,
		defaultProjectTrust: "ask",
		clearOnShrink: false,
		showTerminalProgress: false,
		tuiMode: "regular",
		fullscreenScrollbar: "auto",
		warnings: {},
	};
}

describe("SettingsSelectorComponent", () => {
	beforeAll(() => {
		initTheme("dark");
		setKeybindings(new KeybindingsManager());
	});

	it("cycles through fullscreen scrollbar modes", () => {
		const onChange = vi.fn();
		const selector = new SettingsSelectorComponent(
			{
				fullscreenScrollbar: "auto",
				warnings: {},
				availableThinkingLevels: [],
				availableThemes: [],
			} as unknown as SettingsConfig,
			{ onFullscreenScrollbarChange: onChange } as unknown as SettingsCallbacks,
		);
		const settingsList = selector.getSettingsList();

		for (const character of "Fullscreen scrollbar") settingsList.handleInput(character);
		settingsList.handleInput("\r");
		settingsList.handleInput("\r");
		settingsList.handleInput("\r");

		expect(onChange.mock.calls.flat()).toEqual(["always", "hidden", "auto"]);
	});

	it("localizes labels, descriptions, and values with zh-CN active", () => {
		setLocale("zh-CN");
		try {
			const selector = new SettingsSelectorComponent(createSettingsConfig(), {} as unknown as SettingsCallbacks);
			const settingsList = selector.getSettingsList();
			const renderText = () => stripAnsi(selector.render(120).join("\n"));

			// First item (auto-compact): label and description are translated
			let output = renderText();
			expect(output).toContain("自动压缩");
			expect(output).toContain("上下文过大时自动压缩");
			expect(output).not.toContain("Auto-compact");

			// Filter to the mermaid item: label and description are translated
			for (const character of "Mermaid") settingsList.handleInput(character);
			output = renderText();
			expect(output).toContain("Mermaid 图表");
			expect(output).toContain("将 Mermaid 代码块渲染为 Unicode 图表");

			// Filter to default project trust: value "Ask" is translated
			const trustSelector = new SettingsSelectorComponent(
				createSettingsConfig(),
				{} as unknown as SettingsCallbacks,
			);
			const trustList = trustSelector.getSettingsList();
			for (const character of "默认项目信任") trustList.handleInput(character);
			output = stripAnsi(trustSelector.render(120).join("\n"));
			expect(output).toContain("默认项目信任");
			expect(output).toContain("询问");
			expect(output).not.toContain("Ask");
		} finally {
			setLocale("en");
		}
	});
});
