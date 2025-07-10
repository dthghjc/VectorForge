#!/bin/bash
# VectorForge 开发环境一键设置脚本

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查文件是否存在
check_file() {
    if [ ! -f "$1" ]; then
        print_error "文件不存在: $1"
        exit 1
    fi
}

print_info "🚀 开始设置 VectorForge 开发环境..."

# 1. 检查必要的工具
print_info "检查必要工具..."
check_command "uv"
check_command "mysql"
print_success "必要工具检查完成"

# 2. 检查环境变量文件
print_info "检查环境配置..."
if [ ! -f ".env" ]; then
    print_warning ".env 文件不存在"
    read -p "是否需要创建 .env 文件? (y/n): " create_env
    if [ "$create_env" = "y" ]; then
        print_info "请手动创建 .env 文件并配置数据库连接信息"
        print_info "必需配置项："
        print_info "  - DB_HOST=localhost"
        print_info "  - DB_PORT=3306"
        print_info "  - DB_USER=你的数据库用户名"
        print_info "  - DB_PASSWORD=你的数据库密码"
        print_info "  - DB_NAME=vectorforge"
        print_info "  - SECRET_KEY=你的密钥"
        exit 1
    fi
else
    print_success "找到 .env 配置文件"
fi

# 3. 安装 Python 依赖
print_info "安装 Python 依赖..."
if [ ! -d ".venv" ]; then
    print_info "创建虚拟环境..."
    uv venv
fi

print_info "激活虚拟环境并安装依赖..."
uv sync
print_success "依赖安装完成"

# 4. 初始化数据库
print_info "初始化数据库..."
if uv run python scripts/init_db.py; then
    print_success "数据库初始化完成"
else
    print_error "数据库初始化失败"
    print_warning "请检查数据库配置和连接"
    exit 1
fi

# 5. 询问是否创建测试数据
read -p "是否创建测试数据? (y/n): " create_seed
if [ "$create_seed" = "y" ]; then
    print_info "创建测试数据..."
    if uv run python scripts/seed_data.py; then
        print_success "测试数据创建完成"
    else
        print_warning "测试数据创建失败，可以稍后手动运行"
    fi
fi

# 6. 完成设置
print_success "🎉 开发环境设置完成！"
echo ""
print_info "📖 接下来你可以："
echo "  1. 启动开发服务器:"
echo "     uv run uvicorn app.main:app --reload"
echo ""
echo "  2. 访问 API 文档:"
echo "     http://localhost:8009/docs"
echo ""
echo "  3. 管理数据库迁移:"
echo "     uv run python scripts/migrate.py --help"
echo ""
echo "  4. 测试账户信息:"
echo "     - 管理员: admin / admin123456"
echo "     - 测试用户: testuser1 / testpass123"
echo "     - 标注员: annotator1 / testpass123"
echo ""
print_warning "⚠️ 请及时修改默认密码！" 