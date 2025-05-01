#!/bin/bash

# 用于安装项目前后端所有依赖项和 Playwright 浏览器的脚本

# 函数：打印信息
print_info() {
  echo "INFO: $1"
}

# 函数：打印错误并退出
print_error() {
  echo "ERROR: $1" >&2
  exit 1
}

# 检查 yarn 是否安装
if ! command -v yarn &> /dev/null; then
  print_error "Yarn 未安装。请先使用 'npm install --global yarn' 安装 Yarn。"
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
  print_error "npm 未安装。请确保 Node.js 已正确安装并包含 npm。"
fi

# 检查 git 是否安装 (如果需要克隆)
# if ! command -v git &> /dev/null; then
#   print_error "Git 未安装。请先安装 Git。"
# fi

# 切换到脚本所在目录 (通常是项目根目录)
cd "$(dirname "$0")" || print_error "无法切换到项目根目录"
PROJECT_ROOT=$(pwd)
print_info "当前目录: ${PROJECT_ROOT}"

# 1. 安装前端依赖 (根目录)
print_info "正在安装前端依赖 (yarn install)..."
yarn install
if [ $? -ne 0 ]; then
  print_error "前端依赖安装失败 (yarn install)。请检查上面的错误信息。"
fi
print_info "前端依赖安装完成。"

# 2. 进入后端目录
BACKEND_DIR="${PROJECT_ROOT}/flowchart-backend"
if [ -d "${BACKEND_DIR}" ]; then
  cd "${BACKEND_DIR}" || print_error "无法进入后端目录: ${BACKEND_DIR}"
  print_info "已进入后端目录: $(pwd)"
else
  print_error "后端目录未找到: ${BACKEND_DIR}"
fi

# 3. 安装后端依赖 (flowchart-backend 目录)
print_info "正在安装后端依赖 (npm install)..."
npm install
if [ $? -ne 0 ]; then
  print_error "后端依赖安装失败 (npm install)。请检查上面的错误信息。"
fi
print_info "后端依赖安装完成。"

# 4. 安装 Playwright 浏览器 (flowchart-backend 目录)
print_info "正在安装 Playwright 浏览器 (npx playwright install --with-deps)..."
# 注意：如果系统缺少依赖，可能需要 sudo 权限，但这取决于 Playwright 的安装脚本
npx playwright install --with-deps
if [ $? -ne 0 ]; then
  print_error "Playwright 浏览器安装失败。请检查上面的错误信息，可能需要手动安装缺失的系统依赖。"
fi
print_info "Playwright 浏览器安装完成。"

# 返回项目根目录 (可选)
cd "${PROJECT_ROOT}" || print_info "无法返回项目根目录"

print_info "所有依赖和浏览器安装成功完成！"
exit 0 