# 开发

更多准则请参阅 [AGENTS.md](https://github.com/earendil-works/pi-mono/blob/main/AGENTS.md)。

## 环境搭建

```bash
git clone https://github.com/earendil-works/pi-mono
cd pi-mono
npm install
npm run build
```

从源码运行：

```bash
/path/to/pi-mono/pi-test.sh
```

该脚本可以从任何目录运行。Pi 会保留调用者的当前工作目录。

## Fork / 品牌重塑

通过 `package.json` 配置：

```json
{
  "piConfig": {
    "name": "pi",
    "configDir": ".pi"
  }
}
```

为你的 fork 修改 `name`、`configDir` 和 `bin` 字段。这会影响到 CLI 横幅、配置路径和环境变量名称。

## 路径解析

三种运行模式：npm 安装、独立二进制、从源码通过 tsx 运行。

**包资源请始终使用 `src/config.ts`**：

```typescript
import { getPackageDir, getThemeDir } from "./config.js";
```

切勿直接使用 `__dirname` 访问包资源。

## 调试命令

`/debug`（隐藏命令）写入 `~/.pi/agent/pi-debug.log`：
- 带 ANSI 代码的已渲染 TUI 行
- 发送给 LLM 的最后几条消息

## 测试

```bash
./test.sh                         # Run non-LLM tests (no API keys needed)
npm test                          # Run all tests
npm test -- test/specific.test.ts # Run specific test
```

## 项目结构

```
packages/
  ai/           # LLM provider abstraction
  agent/        # Agent loop and message types  
  tui/          # Terminal UI components
  coding-agent/ # CLI and interactive mode
```
