# Claude Skills OpenSpec 规范（最小版）

## 概述
- 目标：在 Trae 中通过规则与 MCP 工具，使用 `Claude skills/n8n-workflow-patterns` 技能集。
- 工具：
  - `claudeSkills.plan`：根据技能文档生成执行计划（不可执行）。
  - `claudeSkills.run`：仅对白名单 Notion 技能执行（默认预览，确认后执行）。
- 安全策略：确认必需、脚本与参数白名单、统一日志、Windows+Clash 代理。

## 技能目录（示例）
- `http_api_integration`（HTTP API 集成）
- `database_operations`（数据库操作）
- `scheduled_tasks`（定时任务）
- `webhook_processing`（Webhook 处理）
- `ai_agent_workflow`（智能体编排）
- `notion_page_create`（白名单可执行）
- `notion_db_create`（白名单可执行）

## 工具定义
### claudeSkills.plan（只读）
- 输入：`skillId`、`params?`
- 输出：`{ steps[], env{}, permissions[], executable: boolean, doc_refs[] }`
- 行为：从 `Claude skills/n8n-workflow-patterns/*.md` 读取并提取要点；非白名单技能 `executable=false`。

### claudeSkills.run（白名单执行）
- 输入：`skillId`、`payloadFile`、`token?`、`confirm`（默认 false）
- 约束：仅允许白名单脚本 `SkillGen-MVP/scripts/notion_page_create.py`、`notion_db_create.py`；参数仅 `--token`、`--payload-file`。
- 输出：`{ executed, code, stdout, stderr, logFile }`
- 行为：默认预览；确认后执行；日志写入 `artifacts/run_logs/notion_YYYYMMDD_HHmmss.json`。

## 安全策略
- `confirm_required_for_execution: true`
- `whitelist_paths: SkillGen-MVP/scripts/...`
- `whitelist_args: ['--token','--payload-file']`
- `proxy: 127.0.0.1:7890 (HTTP/HTTPS)`
- `logging_dir: artifacts/run_logs`

## 路由建议
- 任意技能先调用 `claudeSkills.plan` 获取步骤与依赖；若为 Notion 白名单技能再走 `run` 的预览+确认。