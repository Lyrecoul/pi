# 使用 Pi

本页汇集了不适合放在快速开始页的日常使用细节。

## 交互模式

<p align="center"><img src="images/interactive-mode.png" alt="Interactive Mode" width="600"></p>

界面有四个主要区域：

- **启动头部** - 快捷键、已加载的上下文文件、提示词模板、技能和扩展
- **消息** - 用户消息、助手响应、工具调用、工具结果、通知、错误和扩展 UI
- **编辑器** - 你输入的地方；边框颜色表示当前的思维级别
- **底部栏** - 工作目录、会话名称、token/缓存使用量、成本、上下文使用量和当前模型。总计包括助手响应、工具报告的使用量以及摘要生成。

编辑器可以临时被内置 UI（如 `/settings`）或自定义扩展 UI 替换。

### 编辑器功能

| 功能 | 操作 |
|---------|-----|
| 文件引用 | 输入 `@` 模糊搜索项目文件 |
| 路径补全 | 按 Tab 补全路径 |
| 多行输入 | Shift+Enter，Windows Terminal 上为 Ctrl+Enter |
| 复制响应 | Ctrl+X 复制最后一条助手消息；在 `/tree` 中复制选中的消息 |
| 图片 | 使用 Ctrl+V 粘贴，Windows 上为 Alt+V，或拖入终端 |
| Shell 命令 | `!command` 运行并将输出发送给模型 |
| 隐藏 shell 命令 | `!!command` 运行但不将输出发送给模型 |
| 外部编辑器 | Ctrl+G 打开 `externalEditor`、`$VISUAL`、`$EDITOR`、Windows 上的 Notepad，或其他地方的 `nano` |

有关所有快捷键和自定义，请参阅[按键绑定](keybindings.md)。

## 斜杠命令

在编辑器中输入 `/` 打开命令补全。扩展可以注册自定义命令，技能可通过 `/skill:name` 使用，提示词模板通过 `/templatename` 展开。

| 命令 | 描述 |
|---------|-------------|
| `/login`, `/logout` | 管理 OAuth 或 API 密钥凭据 |
| [`/llama`](llama-cpp.md) | 下载、加载和卸载 llama.cpp 路由器模型 |
| `/model` | 切换模型 |
| `/scoped-models` | 启用/禁用用于 Ctrl+P 循环的模型 |
| `/settings` | 思维级别、主题、消息投递、传输 |
| `/resume` | 从之前的会话中选择 |
| `/new` | 开始新会话 |
| `/name <name>` | 设置会话显示名称 |
| `/session` | 显示会话文件、ID、消息、token 和成本 |
| `/tree` | 跳转到会话中的任意位置并从那里继续 |
| `/trust` | 保存项目信任决策以供未来的会话使用 |
| `/fork` | 从之前的用户消息创建新会话 |
| `/clone` | 将当前活动分支复制到新会话 |
| `/compact [prompt]` | 手动压缩上下文，可选带自定义指令 |
| `/copy` | 将最后一条助手消息复制到剪贴板 |
| `/export [file]` | 将会话导出为 HTML 或 JSONL |
| `/import <file>` | 从 JSONL 文件导入并继续会话 |
| `/share` | 上传为私有 GitHub gist，带可分享的 HTML 链接 |
| `/reload` | 重新加载按键绑定、扩展、技能、提示词、主题和上下文文件 |
| `/hotkeys` | 显示所有键盘快捷键 |
| `/changelog` | 显示版本历史 |
| `/quit` | 退出 pi |

## 消息队列

你可以在 agent 仍在工作时提交消息：

- **Enter** 排队一条 steering 消息，在当前助手回合执行完工具调用后投递。
- **Alt+Enter** 排队一条 follow-up 消息，在 agent 完成所有工作后投递。
- **Escape** 中止并将排队的消息恢复到编辑器。
- **Alt+Up** 将排队的消息取回编辑器。

在 Windows Terminal 上，Alt+Enter 默认是全屏。如果你想 pi 接收该快捷键，请按[终端设置](terminal-setup.md)中的说明重新映射。

使用[设置](settings.md)中的 `steeringMode` 和 `followUpMode` 配置投递。

## 会话

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并选择一个会话
pi --no-session        # 临时模式；不保存
pi --name "my task"    # 启动时设置会话显示名称
pi --session <path|id> # 使用特定的会话文件或会话 ID
pi --fork <path|id>    # 将会话分叉到新的会话文件中
```

有用的会话命令：

- `/session` 显示当前会话文件和 ID。
- `/tree` 导航文件内的会话树，并可汇总被放弃的分支。
- `/fork` 从较早的用户消息创建新会话。
- `/clone` 将当前活动分支复制到新的会话文件。
- `/compact` 汇总较早的消息以释放上下文。

详情请参阅[会话](sessions.md)和[压缩](compaction.md)。

## 上下文文件

Pi 在启动时从以下位置加载 `AGENTS.md` 或 `CLAUDE.md`：

- `~/.pi/agent/AGENTS.md` 用于全局指令
- 父目录，从当前工作目录向上查找
- 当前目录

使用上下文文件记录项目约定、命令、安全规则和偏好。使用 `--no-context-files` 或 `-nc` 禁用加载。

### 系统提示词文件

替换默认系统提示词：

- `.pi/SYSTEM.md` 用于项目
- `~/.pi/agent/SYSTEM.md` 用于全局

在任一位置使用 `APPEND_SYSTEM.md` 追加到默认提示词而不替换它。

### 项目信任

在交互式启动时，如果项目文件夹包含项目本地设置、资源或项目 `.agents/skills`，且在 `~/.pi/agent/trust.json` 中没有该文件夹或父文件夹的已保存决策，pi 会先询问是否信任该项目。信任项目允许 pi 加载 `.pi/settings.json` 和 `.pi` 资源、安装缺失的项目包以及执行项目扩展。

在信任决策之前，pi 只加载上下文文件、用户/全局扩展和 CLI `-e` 扩展，以便它们处理 `project_trust` 事件。项目本地扩展、项目包管理的扩展和项目设置只在项目被信任后加载。当切换到来自不同 cwd 且信任尚未在当前进程中解析的会话时，此拆分同样适用。

非交互模式（`-p`、`--mode json` 和 `--mode rpc`）不显示信任提示。在没有适用的已保存信任决策时，它们使用全局设置中的 `defaultProjectTrust`：`ask`（默认）和 `never` 忽略这些项目资源，而 `always` 信任它们。传入 `--approve`/`-a` 或 `--no-approve`/`-na` 可在单次运行中覆盖项目信任。

如果没有扩展或已保存的决策适用，`defaultProjectTrust` 控制回退行为。在 `~/.pi/agent/settings.json` 中将其设置为 `"ask"`、`"always"` 或 `"never"`，或通过 `/settings` 更改。

`pi config` 和包命令使用相同的项目信任流程，但 `pi update` 从不提示。传入 `--approve` 可在单次命令中信任项目本地设置，或传入 `--no-approve` 忽略它们。

在交互模式中使用 `/trust` 保存项目信任决策以供未来会话使用，包括对直接父文件夹的信任。它只写入 `~/.pi/agent/trust.json`；当前会话不会被重新加载，因此更改后需要重启 pi 才能生效。


## 导出和分享会话

使用 `/export [file]` 将会话写入 HTML。

使用 `/share` 上传带有可分享 HTML 链接的私有 GitHub gist。

如果你在开源工作中使用 pi，并希望为模型、提示词、工具和评估研究发布会话，请参阅 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。它会将会话发布到 Hugging Face 数据集。

## CLI 参考

```bash
pi [options] [@files...] [messages...]
```

### 包命令

```bash
pi install <source> [-l]     # 安装包，-l 为项目本地
pi remove <source> [-l]      # 移除包
pi uninstall <source> [-l]   # remove 的别名
pi update [source|self|pi]   # 仅更新 pi，或一个包源
pi update --all              # 更新 pi 和包；协调固定的 git 引用
pi update --extensions       # 仅更新包；协调固定的 git 引用
pi update --models           # 仅刷新模型目录
pi update --self             # 仅更新 pi
pi update --extension <src>  # 更新一个包
pi list                      # 列出已安装的包
pi config                    # 启用/禁用包资源
```

这些命令管理 pi 包，`pi update` 可以更新 pi CLI 安装本身。要卸载 pi 本身，请参阅[快速开始](quickstart.md#uninstall)。`pi config` 和项目包命令接受 `--approve`/`--no-approve` 以在单次命令中信任或忽略项目本地设置。`pi update` 从不提示项目信任。

有关包来源和安全说明，请参阅 [Pi 包](packages.md)。

### 模式

| 标志 | 描述 |
|------|-------------|
| default | 交互模式 |
| `-p`, `--print` | 打印响应并退出 |
| `--mode json` | 将所有事件输出为 JSON 行；参阅 [JSON 模式](json.md) |
| `--mode rpc` | 通过 stdin/stdout 的 RPC 模式；参阅 [RPC 模式](rpc.md) |
| `--export <in> [out]` | 将会话导出为 HTML |

在打印模式下，pi 还会读取管道 stdin 并将其合并到初始提示词中：

```bash
cat README.md | pi -p "Summarize this text"
```

### 模型选项

| 选项 | 描述 |
|--------|-------------|
| `--provider <name>` | 提供商，如 `anthropic`、`openai` 或 `google` |
| `--model <pattern>` | 模型模式或 ID；支持 `provider/id` 和可选的 `:<thinking>` |
| `--api-key <key>` | API 密钥，覆盖环境变量 |
| `--thinking <level>` | `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` |
| `--models <patterns>` | 用于 Ctrl+P 循环的逗号分隔模式 |
| `--list-models [search]` | 列出可用模型 |

### 会话选项

| 选项 | 描述 |
|--------|-------------|
| `-c`, `--continue` | 继续最近的会话 |
| `-r`, `--resume` | 浏览并选择一个会话 |
| `--session <path\|id>` | 使用特定的会话文件或部分 UUID |
| `--fork <path\|id>` | 将会话文件或部分 UUID 分叉到新会话 |
| `--session-dir <dir>` | 自定义会话存储目录 |
| `--no-session` | 临时模式；不保存 |
| `--name <name>`, `-n <name>` | 启动时设置会话显示名称 |

### 工具选项

| 选项 | 描述 |
|--------|-------------|
| `--tools <list>`, `-t <list>` | 允许列表特定的内置、扩展和自定义工具 |
| `--exclude-tools <list>`, `-xt <list>` | 禁用特定的内置、扩展和自定义工具 |
| `--no-builtin-tools`, `-nbt` | 禁用内置工具但保持扩展/自定义工具启用 |
| `--no-tools`, `-nt` | 禁用所有工具 |

内置工具：`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`。

### 资源选项

| 选项 | 描述 |
|--------|-------------|
| `-e`, `--extension <source>` | 从路径、npm 或 git 加载扩展；可重复 |
| `--no-extensions` | 禁用扩展发现 |
| `--skill <path>` | 加载技能；可重复 |
| `--no-skills` | 禁用技能发现 |
| `--prompt-template <path>` | 加载提示词模板；可重复 |
| `--no-prompt-templates` | 禁用提示词模板发现 |
| `--theme <path>` | 加载主题；可重复 |
| `--no-themes` | 禁用主题发现 |
| `--no-context-files`, `-nc` | 禁用 `AGENTS.md` 和 `CLAUDE.md` 发现 |

将 `--no-*` 与显式标志结合使用，忽略设置，精确加载所需内容。示例：

```bash
pi --no-extensions -e ./my-extension.ts
```

### 其他选项

| 选项 | 描述 |
|--------|-------------|
| `--system-prompt <text>` | 替换默认提示词；上下文文件和技能仍会追加 |
| `--append-system-prompt <text>` | 追加到系统提示词 |
| `--tui-mode <mode>` | TUI 模式：`regular`（默认）或实验性的 `fullscreen` |
| `--use-theme <name[/name]>` | 为本次运行设置初始交互主题，不更改已保存的设置 |
| `--verbose` | 强制详细启动输出 |
| `-a`, `--approve` | 本次运行信任项目本地文件 |
| `-na`, `--no-approve` | 本次运行忽略项目本地文件 |
| `-h`, `--help` | 显示帮助 |
| `-v`, `--version` | 显示版本 |

在 `fullscreen` 模式下，转录内容在终端视口内滚动，而排队的消息、工作状态、扩展小部件、编辑器和底部栏保持固定在底部。鼠标/触控板输入滚动指针下的区域；键盘视口操作始终可用。内联图片在支持 Kitty 图形协议的终端中可用，包括 Kitty 和 Ghostty。在 iTerm2 中它们会渲染为文本占位符，因为其内联图片协议无法在应用拥有的滚动期间删除或裁剪放置。在 `regular` 模式下，pi 使用主屏幕和终端拥有的滚动缓冲区，iTerm2 内联图片继续正常渲染。参见[终端配置](terminal-setup.md)了解终端特定的设置和变通方案。

在 `/settings` 中设置 **TUI 模式** 可立即在 `regular` 和 `fullscreen` 之间切换，并为以后的会话选择默认值。**全屏退出输出** 控制退出全屏时是打印最终转录，还是恢复之前的屏幕并只打印会话恢复提示。

### 文件参数

使用 `@` 前缀将文件包含在消息中：

```bash
pi @prompt.md "Answer this"
pi -p @screenshot.png "What's in this image?"
pi @code.ts @test.ts "Review these files"
```

### 示例

```bash
# 带初始提示词的交互模式
pi "List all .ts files in src/"

# 非交互模式
pi -p "Summarize this codebase"

# 非交互模式 + 管道 stdin
cat README.md | pi -p "Summarize this text"

# 命名的一次性会话
pi --name "release audit" -p "Audit this repository"

# 不同模型
pi --provider openai --model gpt-4o "Help me refactor"

# 带提供商前缀的模型
pi --model openai/gpt-4o "Help me refactor"

# 带思维级别简写的模型
pi --model sonnet:high "Solve this complex problem"

# 限制模型循环
pi --models "claude-*,gpt-4o"

# 只读模式
pi --tools read,grep,find,ls -p "Review the code"

# 禁用某个扩展或内置工具，同时保持其余可用
pi --exclude-tools ask_question
```

## 设计原则

Pi 保持核心小巧，并将工作流特定行为推入扩展、技能、提示词模板和包中。

它刻意不包含内置的 MCP、子 agent、权限弹窗、计划模式、待办事项或后台 bash。你可以将这些工作流构建或安装为扩展或包，或使用容器和 tmux 等外部工具。

完整理由请阅读[博客文章](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)。
