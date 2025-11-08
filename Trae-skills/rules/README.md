# Trae 规则占位

内容：
- 个人规则（路由与安全要求）
- 项目规则（目录约定与执行策略）

与 Notion Skill 的路由安全约束需体现：
- 白名单脚本：notion_page_create.py / notion_db_create.py
- 仅允许参数：--token、--payload-file
- 执行前需显式确认命令与 payload 路径
- 代理变量（如需）：HTTP_PROXY/HTTPS_PROXY
- 日志输出：artifacts/run_logs/ 下 Tee-Object 保存