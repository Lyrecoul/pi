# 自定义模型

通过 `~/.pi/agent/models.json` 添加自定义提供商和模型（Ollama、vLLM、LM Studio、代理）。

## 目录

- [最小示例](#最小示例)
- [完整示例](#完整示例)
- [支持的 API](#支持的-api)
- [提供商配置](#提供商配置)
- [模型配置](#模型配置)
- [覆盖内置提供商](#覆盖内置提供商)
- [逐模型覆盖](#逐模型覆盖)
- [Anthropic Messages 兼容性](#anthropic-messages-兼容性)
- [OpenAI 兼容性](#openai-兼容性)

## 最小示例

对于本地模型（Ollama、LM Studio、vLLM），每个模型只需要 `id`：

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "llama3.1:8b" },
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

`apiKey` 的值是占位符，因为 Ollama 会忽略它。pi 仍然会要求模型在出现在 `/model` 之前配置认证，因此无密钥的本地服务器应保留一个虚拟值、用 `/login` 为该提供商保存密钥，或在选择模型时传入 `--api-key`。

一些 OpenAI 兼容服务器不理解用于支持推理的模型的 `developer` 角色。对于这些提供商，请设置 `compat.supportsDeveloperRole` 为 `false`，这样 pi 会改为以 `system` 消息发送系统提示词。如果服务器也不支持 `reasoning_effort`，也请将 `compat.supportsReasoningEffort` 设为 `false`。

你可以在提供商级别设置 `compat` 以应用于所有模型，或在模型级别设置以覆盖特定模型。这通常适用于 Ollama、vLLM、SGLang 以及类似的 OpenAI 兼容服务器。

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        {
          "id": "gpt-oss:20b",
          "reasoning": true
        }
      ]
    }
  }
}
```

## 完整示例

当你需要特定值时覆盖默认值：

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        {
          "id": "llama3.1:8b",
          "name": "Llama 3.1 8B (Local)",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    }
  }
}
```

每次打开 `/model` 时文件都会重新加载。可在会话中编辑；无需重启。

## Google AI Studio 示例

使用带 `baseUrl` 的 `google-generative-ai` 添加来自 Google AI Studio 的模型，包括自定义的 Gemma 4 条目：

```json
{
  "providers": {
    "my-google": {
      "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
      "api": "google-generative-ai",
      "apiKey": "$GEMINI_API_KEY",
      "models": [
        {
          "id": "gemma-4-31b-it",
          "name": "Gemma 4 31B",
          "input": ["text", "image"],
          "contextWindow": 262144,
          "reasoning": true
        }
      ]
    }
  }
}
```

向 `google-generative-ai` API 类型添加自定义模型时，`baseUrl` 是必需的。

## 支持的 API

| API | 描述 |
|-----|-------------|
| `openai-completions` | OpenAI Chat Completions（最兼容） |
| `openai-responses` | OpenAI Responses API |
| `anthropic-messages` | Anthropic Messages API |
| `google-generative-ai` | Google Generative AI |

在提供商级别设置 `api`（所有模型的默认值）或在模型级别设置（逐模型覆盖）。

## 提供商配置

| 字段 | 描述 |
|-------|-------------|
| `baseUrl` | API 端点 URL |
| `api` | API 类型（见上文） |
| `apiKey` | 可选的 API 密钥配置（见下方值解析）。当认证由 `/login`/`auth.json` 或 CLI `--api-key` 提供时省略它。 |
| `oauth` | 动态 OAuth 提供商类型。目前支持 `"radius"`；需要网关 `baseUrl`。 |
| `headers` | 自定义请求头（见下方值解析） |
| `authHeader` | 设为 `true` 以自动添加 `Authorization: Bearer <apiKey>` |
| `models` | 模型配置数组 |
| `modelOverrides` | 针对此提供商的、应用于内置或扩展注册模型的逐模型覆盖 |

对于带 `models` 的提供商，非内置的提供商配置需要在提供商或模型级别有 `baseUrl` 和 `api` 值。加载文件不需要 `apiKey`：当通过 `/login`/`auth.json`、CLI `--api-key` 或提供商 `apiKey` 配置认证时，模型变为可用。如果没有配置认证，模型会加载但在 `/model` 和 `--list-models` 中保持不可用。

### 值解析

`apiKey` 和 `headers` 字段支持命令执行、环境变量插值和字面量：

- **Shell 命令：** 开头的 `"!command"` 将整个值作为命令执行并使用 stdout
  ```json
  "apiKey": "!security find-generic-password -ws 'anthropic'"
  "apiKey": "!op read 'op://vault/item/credential'"
  ```
- **环境变量插值：** `"$ENV_VAR"` 或 `"${ENV_VAR}"` 使用指定变量的值。插值可以在更大的字面量内部工作。
  ```json
  "apiKey": "$MY_API_KEY"
  "apiKey": "${KEY_PREFIX}_${KEY_SUFFIX}"
  ```
  `$FOO_BAR` 是变量 `FOO_BAR`；当 `BAR` 是字面文本时使用 `${FOO}_BAR`。缺失的环境变量会使值无法解析。
- **转义：** `"$$"` 输出一个字面 `"$"`；`"$!"` 输出一个字面 `"!"` 而不触发命令执行。
  ```json
  "apiKey": "$$literal-dollar-prefix"
  "apiKey": "$!literal-bang-prefix"
  ```
- **字面量：** 直接使用。`MY_API_KEY` 等纯大写字符串是字面量；环境变量请使用 `$MY_API_KEY`。
  ```json
  "apiKey": "sk-..."
  ```

对于 `models.json`，shell 命令在请求时解析。pi 有意不对任意命令应用内置的 TTL、过期值复用或恢复逻辑。不同的命令需要不同的缓存和失败策略，pi 无法推断正确的策略。

如果你的命令较慢、昂贵、受限速，或应在瞬时失败时继续使用之前的值，请将其包装在你自己的脚本或命令中，实现你想要的缓存或 TTL 行为。

`/model` 的可用性检查使用已配置的认证存在性，不执行 shell 命令。

### 自定义请求头

```json
{
  "providers": {
    "custom-proxy": {
      "baseUrl": "https://proxy.example.com/v1",
      "apiKey": "$MY_API_KEY",
      "api": "anthropic-messages",
      "headers": {
        "x-portkey-api-key": "$PORTKEY_API_KEY",
        "x-secret": "!op read 'op://vault/item/secret'"
      },
      "models": [...]
    }
  }
}
```

## 模型配置

| 字段 | 必需 | 默认值 | 描述 |
|-------|----------|---------|-------------|
| `id` | 是 | — | 模型标识符（传给 API） |
| `name` | 否 | `id` | 人类可读的模型标签。用于匹配（`--model` 模式），并显示为次要模型详情文本。 |
| `api` | 否 | 提供商的 `api` | 为此模型覆盖提供商的 API |
| `reasoning` | 否 | `false` | 支持扩展思考 |
| `thinkingLevelMap` | 否 | 省略 | 将 pi 思考级别映射到提供商值并标记不支持的级别（见下文） |
| `input` | 否 | `["text"]` | 输入类型：`["text"]` 或 `["text", "image"]` |
| `contextWindow` | 否 | `128000` | 上下文窗口大小（token） |
| `maxTokens` | 否 | `16384` | 最大输出 token |
| `cost` | 否 | 全零 | 每百万 token 费率，带可选的按请求输入定价层级 |
| `compat` | 否 | 提供商的 `compat` | 提供商兼容性覆盖。两者都设置时与提供商级别的 `compat` 合并。 |

当总输入用量（`input + cacheRead + cacheWrite`）超过 `inputTokensAbove` 时，成本层级提供一套完整的替代费率并应用于整个请求。多个层级匹配时，最高阈值生效。

```json
{
  "cost": {
    "input": 5,
    "output": 30,
    "cacheRead": 0.5,
    "cacheWrite": 6.25,
    "tiers": [
      {
        "inputTokensAbove": 272000,
        "input": 10,
        "output": 45,
        "cacheRead": 1,
        "cacheWrite": 12.5
      }
    ]
  }
}
```

当前行为：
- `/model`、`--list-models` 和交互式 footer 按模型 `id` 显示条目。
- 配置的 `name` 用于模型匹配和次要模型详情文本。它不会替换 footer/状态栏中的模型 id。

### 思考级别映射

在模型上使用 `thinkingLevelMap` 描述模型特定的思考控制。键是 pi 思考级别：`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`。映射可以包含空洞；例如，模型可以暴露 `high` 和 `max` 而不暴露 `xhigh`。

值为三态：

| 值 | 含义 |
|-------|---------|
| 省略 | 到 `high` 为止的标准级别使用提供商的默认映射；扩展的 `xhigh` 和 `max` 级别不支持 |
| 字符串 | 级别受支持，该值会发送给提供商 |
| `null` | 级别不受支持，被隐藏/跳过/限制掉 |

仅支持 off、high 和 max 推理的模型示例：

```json
{
  "id": "deepseek-v4-pro",
  "reasoning": true,
  "thinkingLevelMap": {
    "minimal": null,
    "low": null,
    "medium": null,
    "high": "high",
    "xhigh": null,
    "max": "max"
  }
}
```

思考无法被禁用的模型示例：

```json
{
  "id": "always-thinking-model",
  "reasoning": true,
  "thinkingLevelMap": {
    "off": null
  }
}
```

迁移：使用 `compat.reasoningEffortMap` 的旧配置应将该映射移到模型级的 `thinkingLevelMap`。对不应出现在 UI 中的级别使用 `null`。

## 覆盖内置提供商

通过代理路由内置提供商，无需重新定义模型：

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1"
    }
  }
}
```

所有内置的 Anthropic 模型仍然可用。现有的 OAuth 或 API 密钥认证继续有效。

要将自定义模型合并到内置提供商中，请包含 `models` 数组：

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1",
      "apiKey": "$ANTHROPIC_API_KEY",
      "api": "anthropic-messages",
      "models": [...]
    }
  }
}
```

合并语义：
- 内置模型保留。
- 自定义模型按 `id` 在提供商内 upsert。
- 如果自定义模型 `id` 与内置模型 `id` 匹配，自定义模型替换该内置模型。
- 如果自定义模型 `id` 是新的，它会与内置模型一起添加。

## 逐模型覆盖

使用 `modelOverrides` 自定义内置模型和匹配的扩展注册模型，而无需替换提供商的完整模型列表。

```json
{
  "providers": {
    "openrouter": {
      "modelOverrides": {
        "anthropic/claude-sonnet-4": {
          "name": "Claude Sonnet 4 (Bedrock Route)",
          "compat": {
            "openRouterRouting": {
              "only": ["amazon-bedrock"]
            }
          }
        }
      }
    }
  }
}
```

`modelOverrides` 支持每个模型的这些字段：`name`、`reasoning`、`thinkingLevelMap`、`input`、`cost`（部分）、`contextWindow`、`maxTokens`、`headers`、`compat`。

直接的 OpenAI GPT-5.6 Sol、Terra 和 Luna 默认使用 `272000` 的上下文窗口，以便请求保持在 OpenAI 的短上下文定价层级内。要选用 OpenAI 的 1.05M 上下文窗口，请为你使用的每个模型增大它：

```json
{
  "providers": {
    "openai": {
      "modelOverrides": {
        "gpt-5.6-sol": {
          "contextWindow": 1050000
        }
      }
    }
  }
}
```

该覆盖保留内置的定价元数据。总输入 token 超过 272K 的请求会对整个请求使用 GPT-5.6 的长上下文费率。需要时对 `gpt-5.6-terra` 或 `gpt-5.6-luna` 应用同样的覆盖。

行为说明：
- `modelOverrides` 应用于内置提供商模型和匹配的扩展注册提供商模型。
- 未知的模型 ID 会被忽略。
- 你可以将提供商级别的 `baseUrl`/`headers` 与 `modelOverrides` 组合。
- 覆盖 `name` 只改变模型匹配和次要详情文本；footer 和主模型列表继续显示模型 `id`。
- 如果提供商还定义了 `models`，自定义模型会在内置覆盖之后合并。相同 `id` 的自定义模型会替换被覆盖的内置模型条目。

## Anthropic Messages 兼容性

对于使用 `api: "anthropic-messages"` 的提供商或代理，使用 `compat` 控制 Anthropic 特定的请求兼容性。

默认情况下，pi 发送每个工具的 `eager_input_streaming: true`。如果代理或 Anthropic 兼容后端拒绝该字段，请设置 `supportsEagerToolInputStreaming` 为 `false`。Pi 将省略 `tools[].eager_input_streaming`，并改为对启用工具请求发送旧的 `fine-grained-tool-streaming-2025-05-14` beta 头。

一些 Anthropic 模型需要自适应思考（`thinking.type: "adaptive"` 加 `output_config.effort`），而不是旧的基于预算的思考负载。内置模型会自动设置这一点。对于路由到这些模型的自定义提供商或别名，请设置 `forceAdaptiveThinking` 为 `true`。

一些 Anthropic 兼容提供商发出带空签名的思考块，并仍然期望在重放时保留它们。只对这些提供商设置 `allowEmptySignature` 为 `true`；真正的 Anthropic 会拒绝空的思考签名。

内置的 Anthropic 模型在其模型元数据中启用 `supportsStrictTools`。自定义的 Anthropic 兼容模型必须在其端点接受严格 JSON-schema 工具定义时将其设为 `true`。

```json
{
  "providers": {
    "anthropic-proxy": {
      "baseUrl": "https://proxy.example.com",
      "api": "anthropic-messages",
      "apiKey": "$ANTHROPIC_PROXY_KEY",
      "compat": {
        "supportsEagerToolInputStreaming": false,
        "supportsLongCacheRetention": true,
        "forceAdaptiveThinking": true,
        "allowEmptySignature": true
      },
      "models": [
        {
          "id": "claude-opus-4-7",
          "reasoning": true,
          "input": ["text", "image"]
        }
      ]
    }
  }
}
```

| 字段 | 描述 |
|-------|-------------|
| `supportsEagerToolInputStreaming` | 提供商是否接受每个工具的 `eager_input_streaming`。默认值：`true`。设为 `false` 以省略该字段，并在启用工具请求上使用旧的细粒度工具流式 beta 头。 |
| `supportsLongCacheRetention` | 当缓存保留为 `long` 时，提供商是否接受 Anthropic 长缓存保留（`cache_control.ttl: "1h"`）。默认值：`true`。 |
| `sendSessionAffinityHeaders` | 启用缓存时是否从会话 id 发送 `x-session-affinity`。默认值：对已知提供商自动检测。 |
| `supportsCacheControlOnTools` | 提供商是否在工具定义上接受 Anthropic 风格的 `cache_control` 标记。默认值：`true`。 |
| `forceAdaptiveThinking` | 是否为此模型发送自适应思考（`thinking.type: "adaptive"` 加 `output_config.effort`）。内置的自适应模型会自动设置。默认值：`false`。 |
| `allowEmptySignature` | 是否将空思考签名重放为 `signature: ""`，而不是将思考转换为文本。默认值：`false`。 |
| `supportsStrictTools` | 提供商是否接受严格的 JSON-schema 工具定义。默认值：`false`；内置 Anthropic 模型在生成的元数据中启用它。 |

## OpenAI 兼容性

对于具有部分 OpenAI 兼容性的提供商，使用 `compat` 字段。

- 提供商级别的 `compat` 将默认值应用于该提供商下的所有模型。
- 模型级别的 `compat` 覆盖该模型的提供商级别值。

```json
{
  "providers": {
    "local-llm": {
      "baseUrl": "http://localhost:8080/v1",
      "api": "openai-completions",
      "compat": {
        "supportsUsageInStreaming": false,
        "maxTokensField": "max_tokens"
      },
      "models": [...]
    }
  }
}
```

| 字段 | 描述 |
|-------|-------------|
| `supportsStore` | 提供商支持 `store` 字段 |
| `supportsDeveloperRole` | 使用 `developer` 角色而非 `system` |
| `supportsReasoningEffort` | 支持 `reasoning_effort` 参数 |
| `supportsUsageInStreaming` | 支持 `stream_options: { include_usage: true }`（默认：`true`） |
| `supportsFinishReason` | 流式响应是否包含 `finish_reason`。为 `false` 时，pi 会在流结束时推断 `stop` 或 `toolUse`。默认值：`true`。 |
| `maxTokensField` | 使用 `max_completion_tokens` 还是 `max_tokens` |
| `requiresToolResultName` | 在工具结果消息上包含 `name` |
| `requiresAssistantAfterToolResult` | 在工具结果之后、用户消息之前插入一条助手消息 |
| `requiresThinkingAsText` | 将思考块转换为纯文本 |
| `requiresReasoningContentOnAssistantMessages` | 启用推理时，在所有重放的助手消息上包含空的 `reasoning_content` |
| `thinkingFormat` | 使用 `reasoning_effort`、`openrouter`、`deepseek`、`together`、`zai`、`qwen`、`chat-template` 或 `qwen-chat-template` 思考参数 |
| `chatTemplateKwargs` | 用于 `thinkingFormat: "chat-template"` 的 `chat_template_kwargs` 值；对 pi 控制的思考值使用 `{ "$var": "thinking.enabled" }` 或 `{ "$var": "thinking.effort" }` |
| `cacheControlFormat` | 在系统提示词、最后一个工具定义以及最后的用户、助手或工具结果文本内容上使用 Anthropic 风格的 `cache_control` 标记。目前仅支持 `anthropic`。 |
| `sendSessionAffinityHeaders` | 对于 `openai-completions`，启用缓存时从会话 id 发送会话亲和性头。默认值：`false`。 |
| `sessionAffinityFormat` | 对于 `openai-completions` 和 `openai-responses`，会话亲和性头格式：`openai` 发送 `session_id`/`x-client-request-id`（completions 还发送 `x-session-affinity`），`openai-nosession` 省略包含下划线的 `session_id` 头，`openrouter` 发送 `x-session-id`。不影响 `prompt_cache_key` 请求体参数。默认值：自动检测。 |
| `supportsStrictMode` | 提供商是否接受严格的 JSON-schema 函数工具定义。默认值取决于 API；内置的 OpenAI 模型带有显式的能力元数据。 |
| `supportsOpenAIGrammarTools` | OpenAI 兼容 API 是否发出自定义的 Lark/regex 语法工具。为 `false` 时，语法受限工具回退为普通函数工具。默认值：`false`；内置模型目录为 OpenAI、OpenAI Codex、Azure OpenAI、GitHub Copilot、opencode 和 Cloudflare AI Gateway 上的 GPT-5+ 模型启用它。 |
| `deferredToolsMode` | 使用提供商特定的延迟工具序列化。目前仅为 Kimi 的 OpenAI 兼容 Chat Completions 格式支持 `"kimi"`。 |
| `supportsLongCacheRetention` | 当缓存保留为 `long` 时，提供商是否接受长缓存保留：OpenAI 提示缓存为 `prompt_cache_retention: "24h"`，或 `cacheControlFormat` 为 `anthropic` 时为 `cache_control.ttl: "1h"`。默认值：`true`。 |
| `openRouterRouting` | OpenRouter 提供商路由偏好。此对象按原样放在 [OpenRouter API 请求](https://openrouter.ai/docs/guides/routing/provider-selection) 的 `provider` 字段中。 |
| `vercelGatewayRouting` | 用于提供商选择的 Vercel AI Gateway 路由配置（`only`、`order`） |

`openrouter` 使用 `reasoning: { effort }`。`together` 使用 `reasoning: { enabled }`，并在启用 `supportsReasoningEffort` 时也发送 `reasoning_effort`。`qwen` 使用顶层 `enable_thinking`。对于需要 `chat_template_kwargs.enable_thinking` 和 `preserve_thinking` 的本地 Qwen 兼容服务器，使用 `qwen-chat-template`。对于需要可配置 `chat_template_kwargs` 的 vLLM/Hugging Face 聊天模板，使用 `chat-template`，例如 DeepSeek V3.x 模板的 `chatTemplateKwargs: { "thinking": { "$var": "thinking.enabled" } }`。

`cacheControlFormat: "anthropic"` 适用于通过文本内容和工具定义上的 `cache_control` 标记暴露 Anthropic 风格提示缓存的 OpenAI 兼容提供商。

示例：

```json
{
  "providers": {
    "openrouter": {
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "$OPENROUTER_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "openrouter/anthropic/claude-3.5-sonnet",
          "name": "OpenRouter Claude 3.5 Sonnet",
          "compat": {
            "openRouterRouting": {
              "allow_fallbacks": true,
              "require_parameters": false,
              "data_collection": "deny",
              "zdr": true,
              "enforce_distillable_text": false,
              "order": ["anthropic", "amazon-bedrock", "google-vertex"],
              "only": ["anthropic", "amazon-bedrock"],
              "ignore": ["gmicloud", "friendli"],
              "quantizations": ["fp16", "bf16"],
              "sort": {
                "by": "price",
                "partition": "model"
              },
              "max_price": {
                "prompt": 10,
                "completion": 20
              },
              "preferred_min_throughput": {
                "p50": 100,
                "p90": 50
              },
              "preferred_max_latency": {
                "p50": 1,
                "p90": 3,
                "p99": 5
              }
            }
          }
        }
      ]
    }
  }
}
```

Vercel AI Gateway 示例：

```json
{
  "providers": {
    "vercel-ai-gateway": {
      "baseUrl": "https://ai-gateway.vercel.sh/v1",
      "apiKey": "$AI_GATEWAY_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "moonshotai/kimi-k2.5",
          "name": "Kimi K2.5 (Fireworks via Vercel)",
          "reasoning": true,
          "input": ["text", "image"],
          "cost": { "input": 0.6, "output": 3, "cacheRead": 0, "cacheWrite": 0 },
          "contextWindow": 262144,
          "maxTokens": 262144,
          "compat": {
            "vercelGatewayRouting": {
              "only": ["fireworks", "novita"],
              "order": ["fireworks", "novita"]
            }
          }
        }
      ]
    }
  }
}
```
