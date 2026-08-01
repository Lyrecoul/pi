# 会话

Pi 将对话保存为会话，以便你可以继续工作、从更早的轮次分支，并重新访问之前的路径。

## 会话存储

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。每个会话是一个 JSONL 文件，具有树结构。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并从过去的会话中选择
pi --no-session        # 临时模式；不保存
pi --name "my task"    # 启动时设置会话显示名称
pi --session <path|id> # 使用特定的会话文件或部分会话 ID
pi --fork <path|id>    # 将会话文件或部分会话 ID 分叉到新会话
```

在交互模式中使用 `/session` 查看当前会话文件、会话 ID、消息数、token 和成本。

有关 JSONL 文件格式和 SessionManager API，请参阅[会话格式](session-format.md)。

## 会话命令

| 命令 | 描述 |
|---------|-------------|
| `/resume` | 浏览并选择之前的会话 |
| `/new` | 开始新会话 |
| `/name <name>` | 设置当前会话的显示名称 |
| `/session` | 显示会话信息 |
| `/tree` | 导航当前会话树 |
| `/fork` | 从之前的用户消息创建新会话 |
| `/clone` | 将当前活动分支复制到新会话 |
| `/compact [prompt]` | 汇总较早的上下文；参阅[压缩](compaction.md) |
| `/export [file]` | 将会话导出为 HTML |
| `/share` | 上传为私有 GitHub gist，带可分享的 HTML 链接 |

## 恢复和删除会话

`/resume` 为当前项目打开交互式会话选择器。`pi -r` 在启动时打开相同的选择器。

在选择器中，你可以：

- 通过输入搜索
- 使用 Ctrl+P 切换路径显示
- 使用 Ctrl+S 切换排序模式
- 使用 Ctrl+N 过滤到命名会话
- 使用 Ctrl+R 重命名
- 使用 Ctrl+D 删除，然后确认

在可用时，pi 使用 `trash` CLI 进行删除，而不是永久移除文件。

## 命名会话

使用 `/name <name>` 设置人类可读的会话名称：

```text
/name Refactor auth module
```

使用 `--name` 或 `-n` 在启动时设置名称：

```bash
pi --name "Refactor auth module"
pi --name "CI audit" -p "Review this build failure"
```

命名会话在 `/resume` 和 `pi -r` 中更容易找到。

## 使用 `/tree` 分支

会话存储为树。每个条目都有一个 `id` 和 `parentId`，当前位置是活动叶子。`/tree` 允许你跳转到任何之前的点并从那里继续，而无需创建新文件。

<p align="center"><img src="images/tree-view.png" alt="Tree View" width="600"></p>

示例形状：

```text
├─ user: "Hello, can you help..."
│  └─ assistant: "Of course! I can..."
│     ├─ user: "Let's try approach A..."
│     │  └─ assistant: "For approach A..."
│     │     └─ user: "That worked..."  ← active
│     └─ user: "Actually, approach B..."
│        └─ assistant: "For approach B..."
```

### 树控件

| 按键 | 动作 |
|-----|--------|
| ↑/↓ | 在可见条目间导航 |
| ←/→ | 向上/向下翻页 |
| Ctrl+←/Ctrl+→ 或 Alt+←/Alt+→ | 折叠/展开或跳转到分支段之间 |
| Shift+L | 在选中条目上设置或清除标签 |
| Shift+T | 切换标签时间戳 |
| Enter | 选择条目 |
| Escape/Ctrl+C | 取消 |
| Ctrl+O | 循环过滤模式 |

过滤模式有：default、no-tools、user-only、labeled-only 和 all。在[设置](settings.md)中使用 `treeFilterMode` 配置默认值。

### 选择行为

选择用户或自定义消息：

1. 将叶子移动到所选消息的父节点。
2. 将所选消息的文本放入编辑器。
3. 允许你编辑并重新提交，创建新分支。

选择助手、工具、压缩或其他非用户条目：

1. 将叶子移动到该条目。
2. 保持编辑器为空。
3. 允许你从该点继续。

选择根用户消息会将叶子重置为空对话，并将原始提示词放入编辑器。

## `/tree`、`/fork` 和 `/clone`

| 功能 | `/tree` | `/fork` | `/clone` |
|---------|---------|---------|----------|
| 输出 | 同一会话文件 | 新会话文件 | 新会话文件 |
| 视图 | 完整树 | 用户消息选择器 | 当前活动分支 |
| 典型用途 | 原地探索备选方案 | 从较早的提示词开始新会话 | 在继续前复制当前工作 |
| 摘要 | 可选分支摘要 | 无 | 无 |

当你想将备选方案保留在一起时使用 `/tree`。当你想使用单独的会话文件时使用 `/fork` 或 `/clone`。

## 分支摘要

当 `/tree` 从一个分支切换到另一个分支时，pi 可以汇总被放弃的分支，并在新位置附加该摘要。这保留了从你离开的路径中重要的上下文，而无需重放整个分支。

提示时，选择以下之一：

1. 不总结
2. 使用默认提示词总结
3. 使用自定义关注指令总结

有关分支摘要的内部机制和扩展钩子，请参阅[压缩](compaction.md)。

## 会话格式

会话文件是 JSONL，包含消息条目、模型更改、思维级别更改、标签、压缩、分支摘要和扩展条目。

对于解析器、扩展、SDK 用法和完整的 SessionManager API，请参阅[会话格式](session-format.md)。
