# 快速开始

本页带你从安装到运行第一个有用的 pi 会话。

## 安装

Pi 以 npm 包形式分发：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

`--ignore-scripts` 会在安装时禁用依赖的生命周期脚本。Pi 的正常 npm 安装不需要安装脚本。

### 卸载

使用安装 pi 的包管理器。curl 安装脚本使用全局 npm，因此 curl 和 npm 安装都通过 npm 卸载：

```bash
# curl 安装脚本或 npm install -g
npm uninstall -g @earendil-works/pi-coding-agent

# pnpm
pnpm remove -g @earendil-works/pi-coding-agent

# Yarn
yarn global remove @earendil-works/pi-coding-agent

# Bun
bun uninstall -g @earendil-works/pi-coding-agent
```

卸载 pi 会在 `~/.pi/agent/` 中保留设置、凭据、会话和已安装的 pi 包。

然后在你要处理的项目目录中启动 pi：

```bash
cd /path/to/project
pi
```

## 身份验证

Pi 可以通过 `/login` 使用订阅型提供商，或通过环境变量或身份验证文件使用 API 密钥型提供商。

### 选项 1：订阅登录

启动 pi 并运行：

```text
/login
```

然后选择一个提供商。内置的订阅登录包括 Claude Pro/Max、ChatGPT Plus/Pro (Codex) 和 GitHub Copilot。

### 选项 2：API 密钥

在启动 pi 前设置 API 密钥：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

你也可以运行 `/login` 并选择 API 密钥提供商，将密钥存储在 `~/.pi/agent/auth.json` 中。

有关所有受支持的提供商、环境变量和云提供商设置，请参阅[提供商](providers.md)。

## 第一个会话

pi 启动后，输入请求并按 Enter：

```text
Summarize this repository and tell me how to run its checks.
```

默认情况下，pi 给模型提供四个工具：

- `read` - 读取文件
- `write` - 创建或覆盖文件
- `edit` - 修补文件
- `bash` - 运行 shell 命令

其他内置的只读工具（`grep`、`find`、`ls`）可通过工具选项使用。Pi 在你当前的工作目录中运行，可以修改那里的文件。如果需要轻松回滚，请使用 git 或其他检查点工作流。

## 给 pi 项目指令

Pi 在启动时加载上下文文件。添加一个 `AGENTS.md` 文件来告诉它如何在项目中工作：

```markdown
# Project Instructions

- Run `npm run check` after code changes.
- Do not run production migrations locally.
- Keep responses concise.
```

Pi 会加载：

- `~/.pi/agent/AGENTS.md` 用于全局指令
- 父目录和当前目录中的 `AGENTS.md` 或 `CLAUDE.md`

更改上下文文件后，重启 pi 或运行 `/reload`。

## 常见尝试事项

### 引用文件

在编辑器中输入 `@` 模糊搜索文件，或在命令行中传入文件：

```bash
pi @README.md "Summarize this"
pi @src/app.ts @src/app.test.ts "Review these together"
```

可以使用 Ctrl+V（Windows 上为 Alt+V）粘贴图片或文本；图片也可以拖入受支持的终端。

### 运行 shell 命令

在交互模式下：

```text
!npm run lint
```

命令输出会发送给模型。使用 `!!command` 运行命令但不将其输出添加到模型上下文。

### 切换模型

使用 `/model` 或 Ctrl+L 选择模型。使用 Shift+Tab 循环思维级别。使用 Ctrl+P / Shift+Ctrl+P 在作用域模型间循环。

### 稍后继续

会话会自动保存：

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览之前的会话
pi --name "my task"    # 启动时设置会话显示名称
pi --session <path|id> # 打开特定会话
```

在 pi 内部，使用 `/resume`、`/new`、`/tree`、`/fork` 和 `/clone` 管理会话。

### 非交互模式

用于一次性提示词：

```bash
pi -p "Summarize this codebase"
cat README.md | pi -p "Summarize this text"
pi -p @screenshot.png "What's in this image?"
```

使用 `--mode json` 获取 JSON 事件输出，或 `--mode rpc` 进行进程集成。

## 后续步骤

- [使用 Pi](usage.md) - 交互模式、斜杠命令、会话、上下文文件和 CLI 参考。
- [提供商](providers.md) - 身份验证和模型设置。
- [设置](settings.md) - 全局和项目配置。
- [按键绑定](keybindings.md) - 快捷键和自定义。
- [Pi 包](packages.md) - 安装共享的扩展、技能、提示词和主题。

平台说明：[Windows](windows.md)、[Termux](termux.md)、[tmux](tmux.md)、[终端设置](terminal-setup.md)、[Shell 别名](shell-aliases.md)。
