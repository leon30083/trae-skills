# SkillProjectStandardizer OpenSpec v0.1

## 概述
SkillProjectStandardizer 旨在让现有项目快速具备 Claude Skills 能力，通过规则模板（.trae/rules）与检查器/脚手架实现标准化集成，可选提供最小 MCP 服务以集成受控读/写/执行接口。

参考资料：原始资料/AI Skills 互操作性架构设计.md

## 目标与范围
- 自动生成项目规则模板（路由、白名单、参数校验、确认提示）
- 提供项目检查器（合规检测）与脚手架（目录与示例）
- 可选 MCP：受控读取（Repo/HTTP/Notion）与受控执行（白名单脚本）
- 提供评估与审计报告（10 用例）

## 架构
```mermaid
flowchart TB
  T[项目根目录] --> R[规则模板生成 .trae/rules]
  T --> S[脚手架生成 skills/payloads/tests]
  T --> C[检查器: 规则/权限/参数/路径]
  C --> A[审计报告: 最小权限]
  S --> E[评估: 10 用例]
  subgraph MCP(可选)
    M1[读取接口: Repo/HTTP/Notion]
    M2[执行接口: PythonRunner(白名单)]
  end
  R --> E
  M1 --> E
  M2 --> E
```

## 核心模块
- RulesTemplate：输出 .trae/rules，绑定触发词→安全命令
- Scaffold：生成 skills/、payloads/、tests/ 基础结构与示例
- Checker：检查 SKILL.md、allowed-tools、payloads/、tests/ 的合规性
- Auditor：扫描并报告权限与参数问题，拒绝 Bash(*)
- MCP（可选）：只读接口与白名单执行接口，带参数校验与路径约束
- Evaluator：10 场景用例执行并统计通过率与误匹配率
- CLI：init/audit/apply-rules/eval

## 安全策略
- 白名单执行：仅受控 Python 脚本，限制参数集合（如 --token、--payload-file）
- 路径约束：限制在项目工作区与受控目录（payloads/、artifacts/）
- 网络代理：如需外网访问，需显式设置 HTTP_PROXY/HTTPS_PROXY
- 交互确认：每次执行前展示命令与参数，需用户确认

## CLI 设计
- standardizer init <project_dir>
  - 生成脚手架与基础 .trae/rules 模板
- standardizer audit <project_dir>
  - 输出合规审计报告（白名单/参数/路径）
- standardizer apply-rules <project_dir>
  - 根据模板写入规则文件，支持覆盖/合并策略
- standardizer eval <project_dir>
  - 执行 10 用例，输出评估报告

## 数据与文件模型
- .trae/rules/project_rules.md：路由与白名单、参数校验、确认提示
- skills/：技能说明与触发词
- payloads/：JSON 模板与 Schema
- tests/：场景用例定义
- artifacts/：日志与评估报告

## 评估指标与 10 条用例
指标：
- 10 用例通过率 ≥ 80%
- 误匹配率 < 5%
- 审计报告无高危项（如 Bash(*)）

用例（输入 → 期望）：
1. rules_template_generation → 生成 .trae/rules，含白名单与参数校验
2. skill_md_min_permission_check → 检查器识别 Bash(*) 并给出修复方案
3. scaffold_apply_and_eval → 空项目生成模板后 10 用例 ≥ 80% 通过
4. mcp_server_readonly_mode → 仅读模式仅能读取，不能执行脚本
5. route_match_accuracy → 多种触发词路由正确，误匹配率 < 5%
6. payload_schema_validation → 非法参数被拒绝并提示修复
7. proxy_env_required → 访问外网时提示并验证代理变量
8. artifacts_logging → 执行日志正确写入 artifacts/
9. rules_confirmation_flow → 执行需用户确认，拒绝未确认请求
10. minimal_scripts_whitelist → 仅白名单脚本可执行，越权被拦截

## 实施阶段
- M1：规则模板/脚手架/检查器基础；5 用例通过
- M2：MCP(可选) 与评估完善；10 用例通过；文档与示例补全