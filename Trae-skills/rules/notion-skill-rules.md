# Notion Skill 项目规则（草案）

目的：确保在 Trae IDE 中执行与 Notion 交互的命令时，遵循白名单与安全约束。

允许的脚本：
- SkillGen-MVP/scripts/notion_page_create.py
- SkillGen-MVP/scripts/notion_db_create.py

允许的参数：
- --token (建议使用 $env:NOTION_TOKEN)
- --payload-file (仅允许指向 SkillGen-MVP/payloads/ 下文件)

安全前提：
1) 必须在执行前向用户展示即将运行的命令与 payload 路径，并征求确认。
2) 若未设置 NOTION_TOKEN，则拒绝执行并提示用户配置。
3) 可选代理（Windows + Clash）：
   - $env:HTTP_PROXY = "http://127.0.0.1:7890"
   - $env:HTTPS_PROXY = "http://127.0.0.1:7890"
4) 禁止执行任意 Bash/PowerShell；禁止访问非白名单脚本；禁止写入除 payloads/ 与 artifacts/ 以外目录。

示例命令：
- 创建页面：
  - `python SkillGen-MVP\scripts\notion_page_create.py --token $env:NOTION_TOKEN --payload-file SkillGen-MVP\payloads\page_simple.json`
- 创建数据库：
  - `python SkillGen-MVP\scripts\notion_db_create.py --token $env:NOTION_TOKEN --payload-file SkillGen-MVP\payloads\db_simple.json`

日志建议（PowerShell）：
- `python ... | Tee-Object -FilePath artifacts\run_logs\notion_$(Get-Date -Format "yyyyMMdd_HHmmss").json`

拒绝策略：
- 若命令包含非白名单脚本、未知参数、或未设置 NOTION_TOKEN，则助手拒绝执行并引导用户修正。
- 若请求与 Notion 无关，助手不应路由到这些脚本。