const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = __dirname; // 获取脚本所在目录 (项目根目录)
let command = '';
let scriptPath = '';

console.log('开始检测操作系统并准备执行下载脚本...');
const platform = os.platform();

if (platform === 'win32') {
    console.log('检测到 Windows 系统。');
    scriptPath = path.join(scriptDir, 'download.ps1');
    // 使用 PowerShell 执行 .ps1 脚本
    // -ExecutionPolicy Bypass 尝试绕过执行策略限制 (仅限当前进程)
    // -File 参数比 -Command 更适合执行脚本文件
    command = `powershell -ExecutionPolicy Bypass -Scope Process -File "${scriptPath}"`;

} else if (platform === 'linux' || platform === 'darwin') { // darwin 是 macOS
    const osName = platform === 'linux' ? 'Linux' : 'macOS';
    console.log(`检测到 ${osName} 系统。`);
    scriptPath = path.join(scriptDir, 'download.sh');
    // 确保 download.sh 有执行权限 (chmod +x download.sh)
    // 使用 bash 命令显式执行脚本
    command = `bash "${scriptPath}"`;

} else {
    console.error(`错误：不支持的操作系统: ${platform}`);
    process.exit(1); // 异常退出
}

console.log(`准备执行命令: ${command}`);
console.log('--- 开始执行下载脚本 ---');

try {
    // 同步执行命令，并将子进程的 stdio 连接到当前进程
    // 这意味着你会实时看到 download.sh 或 download.ps1 的输出和错误
    execSync(command, { stdio: 'inherit' });
    console.log('\n--- 下载脚本成功执行完毕 ---');

} catch (error) {
    // 如果子脚本执行失败 (例如返回非零退出码)，execSync 会抛出错误
    console.error(`\n--- 错误：下载脚本执行失败 ---`);
    // 具体的错误信息应该已经在上面的 stdio: 'inherit' 中显示出来了
    process.exit(1); // 异常退出
}

process.exit(0); // 正常退出 