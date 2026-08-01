import assert from "node:assert";
import { describe, it } from "node:test";
import { Input } from "../src/components/input.ts";
import { TuiMainScreen } from "../src/TuiMainScreen.ts";
import { CURSOR_MARKER, stripCursorMarker, type TUI } from "../src/tui.ts";
import { VirtualTerminal } from "./virtual-terminal.ts";

class LoggingVirtualTerminal extends VirtualTerminal {
	private writes: string[] = [];

	override write(data: string): void {
		this.writes.push(data);
		super.write(data);
	}

	getWrites(): string {
		return this.writes.join("");
	}
}

describe("stripCursorMarker", () => {
	it("strips the marker but keeps the software cursor when the hardware cursor is hidden", () => {
		const line = `ab${CURSOR_MARKER}\x1b[7mc\x1b[0mde`;
		assert.strictEqual(stripCursorMarker(line, false), "ab\x1b[7mc\x1b[0mde");
	});

	it("strips the marker and the software cursor when the hardware cursor is shown", () => {
		const line = `ab${CURSOR_MARKER}\x1b[7mc\x1b[0mde`;
		// The full SGR reset is preserved so styles remain bounded.
		assert.strictEqual(stripCursorMarker(line, true), "abc\x1b[0mde");
	});

	it("keeps styles applied before the cursor cell when stripping", () => {
		const line = `ab${CURSOR_MARKER}\x1b[7m\x1b[32mc\x1b[0mde`;
		assert.strictEqual(stripCursorMarker(line, true), "ab\x1b[32mc\x1b[0mde");
	});

	it("handles the Input component's reverse-video reset (ESC[27m)", () => {
		const line = `ab${CURSOR_MARKER}\x1b[7mc\x1b[27mde`;
		assert.strictEqual(stripCursorMarker(line, true), "abcde");
	});

	it("strips only the marker when no software cursor follows it", () => {
		const line = `ab${CURSOR_MARKER}cde`;
		assert.strictEqual(stripCursorMarker(line, true), "abcde");
	});

	it("leaves lines without a marker untouched", () => {
		const line = "abcde";
		assert.strictEqual(stripCursorMarker(line, true), "abcde");
	});
});

describe("TUI hardware cursor rendering", () => {
	function setup(showHardwareCursor: boolean): {
		terminal: LoggingVirtualTerminal;
		tui: TUI;
		input: Input;
	} {
		const terminal = new LoggingVirtualTerminal(40, 10);
		const tui: TUI = new TuiMainScreen(terminal, showHardwareCursor);
		const input = new Input();
		for (const ch of "abcd") {
			input.handleInput(ch);
		}
		tui.addChild(input);
		tui.setFocus(input);
		return { terminal, tui, input };
	}

	it("keeps the software cursor and hides the hardware cursor by default", async () => {
		const { terminal, tui } = setup(false);
		tui.start();
		await terminal.waitForRender();

		const writes = terminal.getWrites();
		assert.ok(writes.includes("\x1b[7m"), "software cursor should be rendered");
		assert.ok(writes.includes("\x1b[?25l"), "hardware cursor should be hidden");
		tui.stop();
	});

	it("strips the software cursor and shows the hardware cursor in IME mode", async () => {
		const { terminal, tui } = setup(true);
		tui.start();
		await terminal.waitForRender();

		const writes = terminal.getWrites();
		assert.ok(!writes.includes("\x1b[7m"), "software cursor should be stripped in IME mode");
		assert.ok(writes.includes("\x1b[?25h"), "hardware cursor should be shown");

		// Prompt is "> ", so the text cursor after "abcd" sits at column 6.
		const cursor = terminal.getCursorPosition();
		assert.strictEqual(cursor.x, 6, "hardware cursor should sit at the text cursor column");
		tui.stop();
	});

	it("positions the hardware cursor at a mid-text cursor position", async () => {
		const { terminal, tui, input } = setup(true);
		for (let i = 0; i < 2; i++) {
			input.handleInput("\x1b[D"); // cursor left
		}
		tui.start();
		await terminal.waitForRender();

		const writes = terminal.getWrites();
		assert.ok(!writes.includes("\x1b[7m"), "software cursor should be stripped in IME mode");
		// Cursor moved 2 left of "abcd", so it sits on "c" (column 4 with the prompt).
		const cursor = terminal.getCursorPosition();
		assert.strictEqual(cursor.x, 4, "hardware cursor should follow the text cursor");
		tui.stop();
	});
});
