<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://www.npmjs.com/package/@earendil-works/pi-coding-agent"><img alt="npm" src="https://img.shields.io/npm/v/@earendil-works/pi-coding-agent?style=flat-square" /></a>
</p>

> 来自新贡献者的新 issue 和 PR 默认会被自动关闭。维护者会每天审核自动关闭的 issue。参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

# Pi Agent Harness

这里是 Pi agent harness 项目的家，包含我们可自我扩展的 coding agent。

* **[@earendil-works/pi-coding-agent](packages/coding-agent)**：交互式 coding agent CLI
* **[@earendil-works/pi-agent-core](packages/agent)**：带工具调用与状态管理的 Agent 运行时
* **[@earendil-works/pi-ai](packages/ai)**：统一的多提供商 LLM API（OpenAI、Anthropic、Google 等）

了解 Pi 的更多信息：

* 访问 [pi.dev](https://pi.dev) 项目官网，有演示
* [阅读文档](https://pi.dev/docs/latest)，也可以直接让 agent 向您解释

## 所有包

| 包 | 说明 |
|---------|-------------|
| **[@earendil-works/pi-ai](packages/ai)** | 统一的多提供商 LLM API（OpenAI、Anthropic、Google 等） |
| **[@earendil-works/pi-agent-core](packages/agent)** | 带工具调用与状态管理的 Agent 运行时 |
| **[@earendil-works/pi-coding-agent](packages/coding-agent)** | 交互式 coding agent CLI |
| **[@earendil-works/pi-tui](packages/tui)** | 带差分渲染的终端 UI 库 |

Slack/聊天自动化与工作流请参见 [earendil-works/pi-chat](https://github.com/earendil-works/pi-chat)。

## 权限与容器化

Pi 没有内置的权限系统来限制文件系统、进程、网络或凭据访问。默认情况下，它以启动它的用户和进程的权限运行。

如果需要更强的边界，请对 Pi 进行容器化或沙箱化。参见 [packages/coding-agent/docs/containerization.md](packages/coding-agent/docs/containerization.md) 中的三种模式：

- **Gondolin 扩展**：把 `pi` 和提供商认证保留在宿主机上，同时将内置工具和 `!` 命令路由到本地 Linux 微型虚拟机中。
- **纯 Docker**：在本地容器中运行整个 `pi` 进程以获得简单隔离。
- **OpenShell**：在策略控制的沙箱中运行整个 `pi` 进程。

## 贡献

贡献指南参见 [CONTRIBUTING.md](CONTRIBUTING.md)，项目专属规则（对人类和 agent 都适用）参见 [AGENTS.md](AGENTS.md)。Pi 的长期规划见 [RFCs](https://rfc.earendil.com/keyword/pi/)。

## 开发

```bash
npm install --ignore-scripts  # 安装所有依赖但不运行生命周期脚本
npm run build         # 刷新模型数据，然后构建所有包
npm run build:offline # 使用现有模型数据离线重建
npm run check         # 检查、格式化并做类型检查
./test.sh            # 运行测试（无 API 密钥时跳过依赖 LLM 的测试）
./pi-test.sh         # 从源码运行 pi（可从任意目录运行）
```

## 从发布源码构建独立二进制

GitHub 发布包含带版本的源码归档，由发布的 `SHA256SUMS` 文件覆盖。解压后运行与官方独立二进制相同的构建脚本：

```bash
VERSION="<release-version>"
tar -xzf "pi-${VERSION}-source.tar.gz"
cd "pi-${VERSION}"
./scripts/build-binaries.sh --offline-model-data --platform linux-x64 --out "$PWD/out"
```

源码归档包含发布所用的生成提供商模型数据。`--offline-model-data` 使用该快照构建，而不是从实时提供商目录刷新。脚本仍会安装依赖、构建 monorepo、编译 Bun 可执行文件并暂存其运行时资源。单独提供依赖的包维护者可以传入 `--skip-install --skip-deps`。

## 供应链加固

我们把 npm 依赖变更视为需要审查的代码变更。

- 直接外部依赖固定到精确版本。内部 workspace 包保持版本范围。
- `.npmrc` 设置 `save-exact=true` 和 `min-release-age=2`，避免 npm 解析时出现当日发布的依赖。
- `package-lock.json` 是依赖的最终事实来源。提交前会阻止意外提交 lockfile，除非设置 `PI_ALLOW_LOCKFILE_CHANGE=1`。
- `npm run check` 验证固定的直接依赖、原生 TypeScript 导入兼容性，以及生成的 coding-agent shrinkwrap。
- 发布的 CLI 包包含 `packages/coding-agent/npm-shrinkwrap.json`（从根 lockfile 生成），用于为 npm 用户固定传递依赖。
- 发布冒烟测试使用 `npm run release:local`，在打标签前于仓库外构建、打包并创建隔离的 npm 和 Bun 安装。
- 本地发布安装、文档化的 npm 安装以及 `pi update --self` 在支持的地方使用 `--ignore-scripts`。
- CI 使用 `npm ci --ignore-scripts` 安装，并有一个定时 GitHub 工作流运行 `npm audit --omit=dev` 和 `npm audit signatures --omit=dev`。
- Shrinkwrap 生成对依赖生命周期脚本有显式白名单；新的生命周期脚本依赖在审查前会通过检查。

## 分享您的 OSS coding agent 会话

如果您在开源工作中使用 Pi 或其他 coding agent，请分享您的会话。

公开的 OSS 会话数据有助于用真实世界的任务、工具使用、失败和修复（而非玩具基准）改进 coding agent。

完整说明参见 [X 上的这篇文章](https://x.com/badlogicgames/status/2037811643774652911)。

要发布会话，请使用 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。阅读其 README.md 了解设置说明。您只需要一个 Hugging Face 账号、Hugging Face CLI 和 `pi-share-hf`。

您也可以观看[这个视频](https://x.com/badlogicgames/status/2041151967695634619)，我在其中演示如何发布我的 `pi-mono` 会话。

我会定期在这里发布自己的 `pi-mono` 工作会话：

- [badlogicgames/pi-mono on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono)

## 许可证

MIT

<p align="center">
  <a href="https://pi.dev">pi.dev</a> domain graciously donated by
  <br /><br />
  <a href="https://exe.dev"><img src="packages/coding-agent/docs/images/exy.png" alt="Exy mascot" width="48" /><br />exe.dev</a>
</p>
