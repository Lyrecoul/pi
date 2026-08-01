# 设置

Pi 使用 JSON 设置文件，项目设置覆盖全局设置。

| 位置 | 作用域 |
|----------|-------|
| `~/.pi/agent/settings.json` | 全局（所有项目） |
| `.pi/settings.json` | 项目（当前目录） |

直接编辑或使用 `/settings` 处理常用选项。

## 项目信任

在交互式启动时，如果项目文件夹包含项目本地设置、资源或项目 `.agents/skills`，且在 `~/.pi/agent/trust.json` 中没有该文件夹或父文件夹的已保存决策，pi 会先询问是否信任该项目。信任项目允许 pi 加载 `.pi/settings.json` 和 `.pi` 资源、安装缺失的项目包以及执行项目扩展。

非交互模式（`-p`、`--mode json` 和 `--mode rpc`）不显示信任提示。在没有适用的已保存信任决策时，它们使用全局设置中的 `defaultProjectTrust`：`ask`（默认）和 `never` 忽略这些项目资源，而 `always` 信任它们。传入 `--approve`/`-a` 或 `--no-approve`/`-na` 可在单次运行中覆盖项目信任。

如果没有扩展或已保存的决策适用，`defaultProjectTrust` 控制回退行为。在 `~/.pi/agent/settings.json` 中将其设置为 `"ask"`、`"always"` 或 `"never"`，或通过 `/settings` 更改。

`pi config` 和包命令使用相同的项目信任流程，但 `pi update` 从不提示。传入 `--approve` 可在单次命令中信任项目本地设置，或传入 `--no-approve` 忽略它们。

在交互模式中使用 `/trust` 保存项目信任决策以供未来会话使用，包括对直接父文件夹的信任。它只写入 `~/.pi/agent/trust.json`；当前会话不会被重新加载，因此更改后需要重启 pi 才能生效。

## 全部设置

### 模型与思维

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `defaultProvider` | string | - | 默认提供商（如 `"anthropic"`、`"openai"`） |
| `defaultModel` | string | - | 默认模型 ID |
| `defaultThinkingLevel` | string | - | `"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"`、`"max"` |
| `hideThinkingBlock` | boolean | `false` | 在输出中隐藏思维块 |
| `showCacheMissNotices` | boolean | `false` | 对显著的提示词缓存未命中显示转录通知 |
| `thinkingBudgets` | object | - | 每个思维级别的自定义 token 预算 |

#### thinkingBudgets

```json
{
  "thinkingBudgets": {
    "minimal": 1024,
    "low": 4096,
    "medium": 10240,
    "high": 32768
  }
}
```

### UI 与显示

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `theme` | string | `"dark"` | 主题名称（`"dark"`、`"light"` 或自定义） |
| `language` | string | `"auto"` | UI 语言：`"auto"`（从环境检测，见 `LC_ALL`/`LC_MESSAGES`/`LANG`）、`"en"` 或 `"zh-CN"` |
| `externalEditor` | string | `$VISUAL`，然后 `$EDITOR`，Windows 上为 Notepad，其他位置为 `nano` | Ctrl+G 外部编辑器的命令；优先于环境变量 |
| `quietStartup` | boolean | `false` | 隐藏启动头部 |
| `defaultProjectTrust` | string | `"ask"` | 回退项目信任行为：`"ask"`、`"always"` 或 `"never"`。仅全局设置 |
| `collapseChangelog` | boolean | `false` | 更新后显示精简的更新日志 |
| `enableInstallTelemetry` | boolean | `true` | 在首次安装或更新日志检测到更新后发送匿名的安装/更新版本 ping。这不控制更新检查 |
| `enableAnalytics` | boolean | `false` | 选择加入的分析数据共享。目前仅在实验性首次设置（`PI_EXPERIMENTAL=1`）期间询问 |
| `trackingId` | string | - | 分析跟踪标识符，在 `enableAnalytics` 开启时生成 |
| `doubleEscapeAction` | string | `"tree"` | 双击 Escape 的操作：`"tree"`、`"fork"` 或 `"none"` |
| `treeFilterMode` | string | `"default"` | `/tree` 的默认过滤器：`"default"`、`"no-tools"`、`"user-only"`、`"labeled-only"`、`"all"` |
| `editorPaddingX` | number | `0` | 输入编辑器的水平内边距（0-3） |
| `outputPad` | number | `1` | 用户消息、助手消息和思维的水平内边距（0 或 1） |
| `autocompleteMaxVisible` | number | `5` | 自动补全下拉菜单中可见的最大项数（3-20） |
| `showHardwareCursor` | boolean | `false` | 在 TUI 定位光标以支持 IME 时显示终端光标；启用后隐藏软件光标，只保留终端光标，避免双重光标 |
| `uiMode` | string | `"regular"` | 交互 UI 模式：`"regular"` 或实验性的 `"fullscreen"`。通过 `/settings` 的更改在重启后生效；`--ui-mode` 在单次运行中覆盖此设置 |
| `fullscreenScrollbar` | string | `"auto"` | 全屏转录滚动条：`"auto"` 在滚动时临时显示，`"always"` 保留最右列并保持可见，`"hidden"` 隐藏它。在普通 UI 模式下无效 |

对于 VS Code，加入 `--wait` 以便 pi 在编辑器退出后恢复：

```json
{
  "externalEditor": "code --wait"
}
```

### 遥测与更新检查

`enableInstallTelemetry` 只控制向 `https://pi.dev/api/report-install` 发送的匿名安装/更新 ping。退出遥测不会禁用更新检查；Pi 仍可能获取 `https://pi.dev/api/latest-version` 以查找最新版本。

设置 `PI_SKIP_VERSION_CHECK=1` 以禁用 Pi 版本更新检查。使用 `--offline` 或 `PI_OFFLINE=1` 禁用此处描述的所有启动网络操作，包括更新检查、包更新检查以及安装/更新遥测。

### 网络

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `httpProxy` | string | - | HTTP 代理 URL，应用为 `HTTP_PROXY` 和 `HTTPS_PROXY`。仅全局设置。 |

```json
{
  "httpProxy": "http://127.0.0.1:7890"
}
```

### 警告

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `warnings.anthropicExtraUsage` | boolean | `true` | 当 Anthropic 订阅身份验证可能使用付费的额外用量时显示警告 |

```json
{
  "warnings": {
    "anthropicExtraUsage": false
  }
}
```

### 压缩

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `compaction.enabled` | boolean | `true` | 启用自动压缩 |
| `compaction.reserveTokens` | number | `16384` | 为 LLM 响应保留的 token |
| `compaction.keepRecentTokens` | number | `20000` | 保留的最近 token 数（不进行摘要） |

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

### 分支摘要

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `branchSummary.reserveTokens` | number | `16384` | 为分支摘要保留的 token |
| `branchSummary.skipPrompt` | boolean | `false` | 在 `/tree` 导航时跳过「总结分支？」提示（默认为不总结） |

### 重试

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `retry.enabled` | boolean | `true` | 在瞬时错误上启用自动的 agent 级重试 |
| `retry.maxRetries` | number | `3` | 最大 agent 级重试次数 |
| `retry.baseDelayMs` | number | `2000` | agent 级指数退避的基础延迟（2s、4s、8s） |
| `retry.provider.timeoutMs` | number | SDK 默认值 | 提供商/SDK 请求超时（毫秒） |
| `retry.provider.maxRetries` | number | `0` | 提供商/SDK 重试次数 |
| `retry.provider.maxRetryDelayMs` | number | `60000` | 失败前服务器请求的最大延迟（60s） |

当提供商请求的重试延迟超过 `retry.provider.maxRetryDelayMs` 时，请求立即失败并给出信息性错误，而不是静默等待。将其设置为 `0` 以禁用该限制。

除非明确需要提供商级重试，否则保持 `retry.provider.maxRetries` 为 `0`。将其设置为高于 `0` 可能会使 SDK/提供商重试在 Pi 看到错误之前处理超出使用限制的错误，在某些情况下可能阻塞 agent，直到提供商配额重置。

```json
{
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "baseDelayMs": 2000,
    "provider": {
      "timeoutMs": 3600000,
      "maxRetries": 0,
      "maxRetryDelayMs": 60000
    }
  }
}
```

### 消息投递

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `steeringMode` | string | `"one-at-a-time"` | steering 消息的发送方式：`"all"` 或 `"one-at-a-time"` |
| `followUpMode` | string | `"one-at-a-time"` | follow-up 消息的发送方式：`"all"` 或 `"one-at-a-time"` |
| `transport` | string | `"auto"` | 支持多种传输的提供商的优选传输：`"sse"`、`"websocket"`、`"websocket-cached"` 或 `"auto"` |
| `httpIdleTimeoutMs` | number | `300000` | HTTP 头/体空闲超时（毫秒），也用于具有显式流空闲超时的提供商。设置为 `0` 以禁用。 |
| `websocketConnectTimeoutMs` | number | `15000` | 支持 WebSocket 传输的提供商的 WebSocket 连接/打开握手超时（毫秒）。设置为 `0` 以禁用。 |

### 终端与图片

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `terminal.showImages` | boolean | `true` | 在终端中显示图片（如果支持） |
| `terminal.imageWidthCells` | number | `60` | 内联图片在终端单元格中的优选宽度 |
| `terminal.clearOnShrink` | boolean | `false` | 内容缩小时清除空行（可能导致闪烁） |
| `images.autoResize` | boolean | `true` | 将图片调整为最大 2000x2000 |
| `images.blockImages` | boolean | `false` | 阻止所有图片发送给 LLM |

### Shell

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `shellPath` | string | - | 自定义 shell 路径（例如 Windows 上用于 Cygwin）；支持开头的 `~` 表示主目录 |
| `shellCommandPrefix` | string | - | 每条 bash 命令的前缀（如 `"shopt -s expand_aliases"`） |
| `npmCommand` | string[] | - | 用于 npm 包查找/安装操作的命令 argv（如 `["mise", "exec", "node@20", "--", "npm"]`） |

```json
{
  "npmCommand": ["mise", "exec", "node@20", "--", "npm"]
}
```

`npmCommand` 用于所有 npm 包管理器操作，包括安装、卸载以及 git 包内的依赖安装。用户级 npm 包安装到 `~/.pi/agent/npm/` 下；项目级 npm 包安装到 `.pi/npm/` 下。使用与进程启动方式完全一致的 argv 风格条目。配置了 `npmCommand` 后，git 包依赖安装使用普通的 `install`，以避免在包装器或替代包管理器中引入 npm 特定标志。

### 会话

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `sessionDir` | string | - | 会话文件存储目录。接受绝对路径或相对路径，以及 `~`。 |

```json
{ "sessionDir": ".pi/sessions" }
```

当多个来源指定会话目录时，优先级为 `--session-dir`、`PI_CODING_AGENT_SESSION_DIR`，然后是 settings.json 中的 `sessionDir`。

### 模型循环

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `enabledModels` | string[] | - | 用于 Ctrl+P 循环的模型模式（与 `--models` CLI 标志格式相同） |

```json
{
  "enabledModels": ["claude-*", "gpt-4o", "gemini-2*"]
}
```

### Markdown

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `markdown.codeBlockIndent` | string | `"  "` | 代码块的缩进 |

### 资源

这些设置定义从哪里加载扩展、技能、提示词和主题。

`~/.pi/agent/settings.json` 中的路径相对于 `~/.pi/agent` 解析。`.pi/settings.json` 中的路径相对于 `.pi` 解析。支持绝对路径和 `~`。

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `packages` | array | `[]` | 从中加载资源的 npm/git 包 |
| `extensions` | string[] | `[]` | 本地扩展文件路径或目录 |
| `skills` | string[] | `[]` | 本地技能文件路径或目录 |
| `prompts` | string[] | `[]` | 本地提示词模板路径或目录 |
| `themes` | string[] | `[]` | 本地主题文件路径或目录 |
| `enableSkillCommands` | boolean | `true` | 将技能注册为 `/skill:name` 命令 |

数组支持 glob 模式和排除项。使用 `!pattern` 排除。使用 `+path` 强制包含精确路径，使用 `-path` 强制排除精确路径。

#### packages

字符串形式从包中加载所有资源：

```json
{
  "packages": ["pi-skills", "@org/my-extension"]
}
```

对象形式过滤要加载的资源：

```json
{
  "packages": [
    {
      "source": "pi-skills",
      "skills": ["brave-search", "transcribe"],
      "extensions": []
    }
  ]
}
```

有关包管理的详细信息，请参阅 [packages.md](packages.md)。

## 示例

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-20250514",
  "defaultThinkingLevel": "medium",
  "theme": "dark",
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  },
  "retry": {
    "enabled": true,
    "maxRetries": 3
  },
  "enabledModels": ["claude-*", "gpt-4o"],
  "warnings": {
    "anthropicExtraUsage": true
  },
  "packages": ["pi-skills"]
}
```

## 项目覆盖

项目设置（`.pi/settings.json`）覆盖全局设置。嵌套对象会合并：

```json
// ~/.pi/agent/settings.json（全局）
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 16384 }
}

// .pi/settings.json（项目）
{
  "compaction": { "reserveTokens": 8192 }
}

// 结果
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 8192 }
}
```
