// Minimal MCP-like STDIO server for claudeSkills.plan & claudeSkills.run
// 安全约束（run）：仅允许执行白名单 Notion 脚本，且仅允许 --token / --payload-file 两个参数；默认 dry-run 预览命令，需 confirm=true 才会执行。

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 白名单脚本（Windows 路径兼容）
const SCRIPTS = {
  'notion.create_page': path.join('SkillGen-MVP', 'scripts', 'notion_page_create.py'),
  'notion.create_database': path.join('SkillGen-MVP', 'scripts', 'notion_db_create.py'),
};

// 仅允许的参数键
const ALLOWED_PARAMS = new Set(['token', 'payloadFile', 'confirm']);

// 计划工具：技能文档映射（只读，不执行）
const DOCS_DIR = path.join('Claude skills', 'n8n-workflow-patterns');
const SKILL_DOC_MAP = {
  'http_api_integration': path.join(DOCS_DIR, 'http_api_integration.md'),
  'database_operations': path.join(DOCS_DIR, 'database_operations.md'),
  'scheduled_tasks': path.join(DOCS_DIR, 'scheduled_tasks.md'),
  'webhook_processing': path.join(DOCS_DIR, 'webhook_processing.md'),
  'ai_agent_workflow': path.join(DOCS_DIR, 'ai_agent_workflow.md'),
  // Notion 技能参考原始资料说明文档（仅做计划，不执行）
  'notion_page_create': path.join('原始资料', 'notion测试用.md'),
  'notion_db_create': path.join('原始资料', 'notion测试用.md'),
};

function nowStamp() {
  const d = new Date();
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) + '_' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function validateParams(params) {
  // 拒绝未知参数
  for (const k of Object.keys(params)) {
    if (!ALLOWED_PARAMS.has(k)) {
      throw new Error(`未知参数：${k}（仅允许 token、payloadFile、confirm）`);
    }
  }
  if (!params.payloadFile) {
    throw new Error('payloadFile 必填');
  }
  // 仅允许 payloads/ 目录下的 JSON 文件
  const normalized = params.payloadFile.replace(/\\/g, '/');
  if (!normalized.startsWith('SkillGen-MVP/payloads/') || !normalized.endsWith('.json')) {
    throw new Error('payloadFile 仅允许指向 SkillGen-MVP/payloads/ 下的 .json 文件');
  }
}

function buildCommand(skillId, token, payloadFile) {
  const script = SCRIPTS[skillId];
  if (!script) throw new Error(`不支持的 skillId：${skillId}`);
  if (!token) token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('未检测到 NOTION_TOKEN，请设置环境变量或在参数中提供 token');

  // 生成 PowerShell 命令（避免注入，仅拼接允许的参数）
  const cmd = `python ${script} --token ${token} --payload-file ${payloadFile}`;
  return cmd;
}

function runCommandPS(cmd) {
  return new Promise((resolve, reject) => {
    // 使用 PowerShell 执行命令，并将输出写入 artifacts/run_logs
    const logDir = path.join('artifacts', 'run_logs');
    if (!fs.existsSync(logDir)) {
      // 不自动创建，遵守规则：如需可先提示用户创建
    }
    const logFile = path.join(logDir, `notion_${nowStamp()}.json`);

    const ps = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], {
      env: {
        ...process.env,
        HTTP_PROXY: process.env.HTTP_PROXY || 'http://127.0.0.1:7890',
        HTTPS_PROXY: process.env.HTTPS_PROXY || 'http://127.0.0.1:7890',
      },
    });

    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    ps.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    ps.on('error', (err) => reject(err));
    ps.on('close', (code) => {
      try {
        if (fs.existsSync(path.join('artifacts'))) {
          fs.mkdirSync(logDir, { recursive: true });
          fs.writeFileSync(logFile, JSON.stringify({ code, stdout, stderr }, null, 2));
        }
      } catch (e) {
        // 记录写日志失败但不抛出
      }
      resolve({ code, stdout, stderr, logFile });
    });
  });
}

// 读取技能文档并生成最小步骤计划（不执行）
function readDocLines(docPath) {
  try {
    const txt = fs.readFileSync(docPath, 'utf8');
    return txt.split(/\r?\n/);
  } catch (e) {
    return [];
  }
}

function extractStepsFromDoc(lines) {
  const steps = [];
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    // 提取标题与要点
    if (l.startsWith('#')) {
      steps.push(l.replace(/^#+\s*/, '章节: '));
    } else if (l.startsWith('- ') || l.startsWith('* ')) {
      steps.push(l.replace(/^[-*]\s*/, '步骤: '));
    }
    if (steps.length >= 12) break; // 控制长度，避免冗长
  }
  if (steps.length === 0) {
    steps.push('阅读技能文档并提取关键步骤');
    steps.push('准备必要的环境变量与权限');
  }
  return steps;
}

function inferEnv(skillId) {
  const env = {
    HTTP_PROXY: 'http://127.0.0.1:7890',
    HTTPS_PROXY: 'http://127.0.0.1:7890',
  };
  if (skillId.startsWith('notion')) {
    env.NOTION_TOKEN = 'required_or_env';
  }
  return env;
}

function inferPermissions(skillId) {
  const perms = ['filesystem:read_docs'];
  if (skillId === 'http_api_integration' || skillId === 'webhook_processing' || skillId === 'ai_agent_workflow') {
    perms.push('network:outbound');
  }
  if (skillId === 'scheduled_tasks') {
    perms.push('scheduler');
  }
  if (skillId === 'database_operations') {
    perms.push('database');
  }
  if (skillId.startsWith('notion')) {
    perms.push('network:outbound');
  }
  return perms;
}

function isExecutableSkill(skillId) {
  return skillId === 'notion_page_create' || skillId === 'notion_db_create';
}

async function handlePlanCall(msg) {
  const { skillId, params } = msg.params || {};
  if (!skillId) {
    return { type: 'tool_error', tool: msg.tool, error: 'skillId 必填' };
  }
  const docPath = SKILL_DOC_MAP[skillId];
  const lines = docPath ? readDocLines(docPath) : [];
  const steps = extractStepsFromDoc(lines);
  const env = inferEnv(skillId);
  const permissions = inferPermissions(skillId);
  const executable = isExecutableSkill(skillId);
  return {
    type: 'tool_result',
    tool: msg.tool,
    plan: { steps, env, permissions, executable, doc_refs: docPath && fs.existsSync(docPath) ? [docPath] : [] },
  };
}

// 简单的 STDIO 循环：接收 JSON 输入，返回 JSON 输出
process.stdin.setEncoding('utf8');
console.log(JSON.stringify({ type: 'ready', server: 'claude-skills-runner', version: '0.2.0' }));

let buffer = '';
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const parts = buffer.split('\n');
  // 简单逐行 JSON 解析
  while (parts.length > 1) {
    const line = parts.shift();
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.type === 'tool_call' && msg.tool === 'claudeSkills.run') {
        const { skillId, token, payloadFile, confirm } = msg.params || {};
        try {
          validateParams({ token, payloadFile, confirm });
          const cmd = buildCommand(skillId, token, payloadFile);
          if (!confirm) {
            // 预览模式：不执行，仅返回将要运行的命令
            process.stdout.write(
              JSON.stringify({ type: 'tool_result', tool: msg.tool, preview: cmd, executed: false }) + '\n'
            );
          } else {
            const res = await runCommandPS(cmd);
            process.stdout.write(
              JSON.stringify({ type: 'tool_result', tool: msg.tool, executed: true, ...res }) + '\n'
            );
          }
        } catch (err) {
          process.stdout.write(
            JSON.stringify({ type: 'tool_error', tool: msg.tool, error: err.message }) + '\n'
          );
        }
      } else if (msg.type === 'tool_call' && msg.tool === 'claudeSkills.plan') {
        try {
          const res = await handlePlanCall(msg);
          process.stdout.write(JSON.stringify(res) + '\n');
        } catch (err) {
          process.stdout.write(
            JSON.stringify({ type: 'tool_error', tool: msg.tool, error: err.message }) + '\n'
          );
        }
      } else {
        process.stdout.write(JSON.stringify({ type: 'noop' }) + '\n');
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({ type: 'parse_error', error: e.message }) + '\n');
    }
  }
  buffer = parts[0] || '';
});