# 环境变量

Pi 以三种方式使用环境变量：

- 诸如 `PI_OFFLINE` 之类的变量用于配置 Pi 进程。
- Pi 设置进程标记，以便子进程可以将 Pi 识别为启动代理。
- 由可调用 LLM 的 bash 工具运行的命令会收到描述当前会话的 `PI_*` 变量。

提供商 API 密钥变量在[提供商](providers.md#environment-variables-or-auth-file)中单独说明。

## 进程标记

CLI 和 RPC 入口点设置两个进程标记：

- `AI_AGENT=pi` 是通用标记，让工具可以识别 Pi 是启动进程的代理。
- `PI_CODING_AGENT=true` 是 Pi 特有的标记，让子进程可以检测到自己运行在 Pi 内部。

子进程会继承这两个标记。它们不是会话特定的，并且当 Pi 通过 SDK 嵌入时不会自动设置。

## Bash 工具的会话环境

由 bash 工具运行的命令会收到当前的 Pi 会话状态：

| 变量 | 描述 |
|----------|-------------|
| `PI_SESSION_ID` | 当前会话 ID |
| `PI_SESSION_FILE` | 当前会话 JSONL 文件的绝对路径；临时会话不设置 |
| `PI_PROVIDER` | 当前选择的模型提供商 |
| `PI_MODEL` | 当前选择的模型 ID |
| `PI_REASONING_LEVEL` | 当前生效的推理级别：`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max` |

这些值在每条命令启动时解析。因此切换模型或更改推理级别会影响下一条 bash 命令，而无需重启 Pi。`PI_PROVIDER` 和 `PI_MODEL` 标识所选用的 Pi 模型，而非路由器可能内部选择的不同的上游模型。

当被问到正在运行哪个模型或提供商时，请检查这些变量，而不是从系统提示词中推断答案：

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

当会话是持久的时，可以直接检查会话文件：

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

这些变量被注入到可调用 LLM 的 bash 工具中。它们不会被注入到用户输入的 `!` 或 `!!` 命令中。

### 自定义 bash 工具

使用 `createBashTool()` 创建的 bash 工具在注册到 Pi 时默认暴露会话环境。注入发生在 `spawnHook` 之前，因此钩子可以在 `ctx.env` 中收到这些变量：

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

独立于 spawn hook 禁用会话元数据：

```typescript
const bashTool = createBashTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

禁用后，Pi 会移除这些变量的继承值，这样嵌套的 Pi 进程就不会暴露过期的父会话元数据。

## Pi 进程配置

以下变量由 Pi 自身读取：

| 变量 | 描述 |
|----------|-------------|
| `PI_CODING_AGENT_DIR` | 覆盖配置目录；默认为 `~/.pi/agent` |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储；被 `--session-dir` 覆盖 |
| `PI_PACKAGE_DIR` | 覆盖包目录，对 Nix/Guix 存储路径很有用 |
| `PI_OFFLINE` | 禁用启动时的网络操作，包括更新检查、包更新以及安装/更新遥测 |
| `PI_SKIP_VERSION_CHECK` | 禁用 `pi.dev` 的最新版本请求 |
| `PI_TELEMETRY` | 覆盖安装/更新遥测和提供商归因头：`1`/`true`/`yes` 或 `0`/`false`/`no` |
| `PI_CACHE_RETENTION` | 设为 `long` 以在支持的地方启用扩展的提供商提示缓存 |
| `LC_ALL`, `LC_MESSAGES`, `LANG` | 当 `language` 设置为 `"auto"` 时选择 UI 语言：按 `LC_ALL`、`LC_MESSAGES`、`LANG` 的顺序检测，`zh*` 选择简体中文，`en*` 选择英语，其他值回退到英语 |
| `PI_SHARE_VIEWER_URL` | 覆盖 `/share` 使用的基础 URL |
| `PI_HARDWARE_CURSOR` | 设为 `1` 以显示硬件光标；参见[终端配置](terminal-setup.md) |
| `PI_TUI_ESC_TIMEOUT` | 单独的 ESC 之后、将其视为 Escape 之前的等待毫秒数；SSH 下默认为 `100`，其他情况为 `10`。如果 Alt 键输入被误读为 Escape，可增大此值 |
| `VISUAL`, `EDITOR` | 当 `externalEditor` 未设置时作为外部编辑器回退 |
| `HTTP_PROXY`, `HTTPS_PROXY` | 为出站 HTTP 请求设置代理 |

提供商凭据，如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 和云提供商配置，列于[提供商](providers.md#environment-variables-or-auth-file)中。
