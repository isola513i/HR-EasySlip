#!/usr/bin/env node
// Blocks shell commands that attempt to overwrite .env files.
let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input);
    const cmd = (payload.tool_input && payload.tool_input.command) || '';
    const writesToEnv =
      /\.env(\.local)?[^\w]|\.env(\.local)?$/.test(cmd) &&
      /(echo\s.*>|tee\s|sed\s+-i|\bcp\b.*\.env|\.env.*\bcp\b)/.test(cmd);
    if (writesToEnv) {
      console.error('[Security] BLOCKED: Write to .env file detected: ' + cmd.substring(0, 120));
      process.exit(2);
    }
    console.log(input);
  } catch {
    console.log(input);
  }
});
