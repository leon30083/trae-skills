# Trae-skills 实现任务清单

阶段一：目录与规范初始化（高优先级）
- [x] 创建 Trae-skills 根目录与 README
- [x] 编写 openspec/specs/spec.md 标准草案
- [ ] 编写 openspec/specs/tasks.md（本文件）
- [ ] 创建 docs/、mcp/、rules/、examples/ 目录与占位 README

阶段二：规则与安全（高优先级）
- [ ] 编写 Notion Skill 路由白名单规则（rules/notion-skill-rules.md）
- [ ] 添加命令预览与显式确认的交互流程说明
- [ ] 定义日志命名与归档策略（artifacts/run_logs）

阶段三：互操作性与示例（中优先级）
- [ ] API-as-Tool 最小示例（examples/api/）
- [ ] MCP-as-Bus 最小 server 与工具注册（mcp/）
- [ ] Agent-as-Orchestrator ToT 编排示例（examples/orchestrator/）

阶段四：评估与审计（中优先级）
- [ ] 用例 1-10 的脚本化验证与记录
- [ ] 日志审计与回溯策略说明
- [ ] 失败用例与修正路径记录

阶段五：交付（低优先级）
- [ ] README 补充“如何使用 Trae 规则进行零命令初始化”章节
- [ ] 添加贡献指南与代码规范
- [ ] 初始版本发布与标签