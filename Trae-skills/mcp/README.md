# MCP 集成占位（claude-skills-runner）

目标：
- 最小 MCP server 示例（STDIO），提供工具 claudeSkills.run
- 工具注册模板（notion.create_page / notion.create_database 对应脚本）
- 与 Trae 规则的路由衔接说明（预览+确认）

快速开始（本地最小服务器）
1) 启动（PowerShell）：
   - 进入目录：`cd Trae-skills\\mcp`
   - 启动：`npm start` 或 `node mcp-server.js`

2) 在 Trae 配置 MCP 服务器（示例）：
```
{
  "mcpServers": {
    "claude-skills-runner": {
      "command": "node",
      "args": ["mcp-server.js"],
      "cwd": "e:\\User\\Documents\\GitHub\\Claude Skills\\Trae-skills\\mcp"
    }
  }
}
```

3) 工具调用约定（STDIO JSON 行）：
- 预览：
```
{"type":"tool_call","tool":"claudeSkills.run","params":{"skillId":"notion.create_page","payloadFile":"SkillGen-MVP/payloads/page_simple.json"}}
```
- 确认执行：
```
{"type":"tool_call","tool":"claudeSkills.run","params":{"skillId":"notion.create_page","payloadFile":"SkillGen-MVP/payloads/page_simple.json","confirm":true,"token":"<可选覆盖，默认取环境NOTION_TOKEN>"}}
```

安全约束：
- 白名单脚本：SkillGen-MVP/scripts/notion_page_create.py、notion_db_create.py
- 仅允许参数：--token、--payload-file（对应 JSON 的 token/payloadFile）
- 必须先预览，确认（confirm=true）才执行
- 输出日志：artifacts/run_logs/notion_YYYYMMDD_HHMMSS.json
- 可选代理：HTTP_PROXY/HTTPS_PROXY 默认使用 127.0.0.1:7890（Windows Clash）

注意：当前服务器为最小骨架，协议交互为“每行一条 JSON”，与 Trae 的 MCP 集成需在设置中将其作为 STDIO 服务器添加后再测试工具调用。