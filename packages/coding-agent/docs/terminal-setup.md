# 终端配置

Pi 使用 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/)来可靠地检测修饰键。大多数现代终端都支持该协议，但有些需要配置。

## Kitty、iTerm2

开箱即用。

## Apple Terminal

Pi 在可用时启用增强键上报。如果 Terminal.app 对 `Shift+Enter` 仍然发送普通的 Return，pi 会使用本地的 macOS 修饰键回退方案，将该 Return 视为 `Shift+Enter`。

该回退方案仅在 pi 与 Terminal.app 运行在同一台 Mac 上时有效。它无法在远程 SSH 上检测本地键盘。

## Ghostty

在 Ghostty 配置中添加（macOS 上是 `~/Library/Application Support/com.mitchellh.ghostty/config`，Linux 上是 `~/.config/ghostty/config`）：

```
keybind = alt+backspace=text:\x1b\x7f
```

旧版 Claude Code 可能添加过这个 Ghostty 映射：

```
keybind = shift+enter=text:\n
```

该映射会发送一个原始换行字节。在 pi 内部，这与 `Ctrl+J` 无法区分，因此 tmux 和 pi 将不再收到真正的 `shift+enter` 按键事件。

如果你添加该映射只是为了 Claude Code 2.x 或更新版本，则可以移除它，除非你想在 tmux 中使用 Claude Code（在那里它仍然需要该 Ghostty 映射）。

Pi 将 `Ctrl+J` 绑定为默认的换行别名，因此 `Shift+Enter` 会通过该重映射在 tmux 中继续工作，无需额外的 pi 配置。

## WezTerm

WezTerm 通常通过 xterm 的 modifyOtherKeys 开箱即用地支持 `Shift+Enter`。要显式使用 Kitty 键盘协议，请创建 `~/.wezterm.lua`：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

在 macOS 上，WezTerm 默认将 `Option+Enter` 绑定为全屏。要使用 `Option+Enter` 进行 pi 的 follow-up 排队，请添加此按键覆盖：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.keys = {
  {
    key = 'Enter',
    mods = 'ALT',
    action = wezterm.action.SendString('\x1b[13;3u'),
  },
}
return config
```

如果你已经有 `config.keys` 表，请将条目添加到其中。

在 WSL 上，WezTerm 可能需要可见的硬件光标来定位 IME 候选窗口。如果 CJK IME 候选不跟随文本光标，请在运行 pi 前设置 `PI_HARDWARE_CURSOR=1`，或在设置中设置 `showHardwareCursor` 为 `true`。启用后，TUI 会隐藏软件光标，只显示终端光标，避免出现双重光标。

## Alacritty

Alacritty 通常开箱即用地支持 `Shift+Enter`。在 macOS 上，`Option+Enter` 可能以普通的 `Enter` 到达。要使用 `Option+Enter` 进行 pi 的 follow-up 排队，请在 `~/.config/alacritty/alacritty.toml` 中添加：

```toml
[[keyboard.bindings]]
key = "Enter"
mods = "Alt"
chars = "\u001b[13;3u"
```

更改配置后重启 Alacritty。

## VS Code（集成终端）

VS Code 1.109.5 及更新版本默认在集成终端中启用 Kitty 键盘协议，因此 `Shift+Enter` 应该开箱即用。

早于 1.109.5 的 VS Code 版本需要为 `Shift+Enter` 添加显式的终端按键绑定。

`keybindings.json` 的位置：
- macOS：`~/Library/Application Support/Code/User/keybindings.json`
- Linux：`~/.config/Code/User/keybindings.json`
- Windows：`%APPDATA%\\Code\\User\\keybindings.json`

在 `keybindings.json` 中添加：

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

## Windows Terminal

在 `settings.json` 中添加（Ctrl+Shift+, 或 设置 → 打开 JSON 文件），以转发 pi 使用的带修饰键的 Enter 键：

```json
{
  "actions": [
    {
      "command": { "action": "sendInput", "input": "\u001b[13;2u" },
      "keys": "shift+enter"
    },
    {
      "command": { "action": "sendInput", "input": "\u001b[13;3u" },
      "keys": "alt+enter"
    }
  ]
}
```

- `Shift+Enter` 插入新行。
- Windows Terminal 默认将 `Alt+Enter` 绑定为全屏。这会阻止 pi 接收用于 follow-up 排队的 `Alt+Enter`。
- 将 `Alt+Enter` 重映射为 `sendInput` 会把真正的按键组合转发给 pi。

如果你已经有 `actions` 数组，请将对象添加到其中。如果旧的全屏行为仍然存在，请完全关闭并重新打开 Windows Terminal。

## xfce4-terminal、terminator

这些终端的转义序列支持有限。像 `Ctrl+Enter` 和 `Shift+Enter` 这样的带修饰键的 Enter 无法与普通的 `Enter` 区分，导致 `submit: ["ctrl+enter"]` 等自定义按键绑定无法工作。

为了获得最佳体验，请使用支持 Kitty 键盘协议的终端：
- [Kitty](https://sw.kovidgoyal.net/kitty/)
- [Ghostty](https://ghostty.org/)
- [WezTerm](https://wezfurlong.org/wezterm/)
- [iTerm2](https://iterm2.com/)
- [Alacritty](https://github.com/alacritty/alacritty)（需要编译时启用 Kitty 协议支持）

## IntelliJ IDEA（集成终端）

内置终端的转义序列支持有限。在 IntelliJ 的终端中，Shift+Enter 无法与 Enter 区分。

如果你希望硬件光标可见，请在运行 pi 前设置 `PI_HARDWARE_CURSOR=1`（为兼容性默认禁用）。

为获得最佳体验，请考虑使用专用的终端模拟器。
