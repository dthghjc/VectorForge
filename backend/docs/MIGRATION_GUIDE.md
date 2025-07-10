# VectorForge 数据库迁移指南

## 概述

本项目使用 Alembic 进行数据库迁移管理，确保多设备开发环境的数据库版本一致性。

## 🚀 快速开始（新设备）

### 方法一：一键设置（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd VectorForge/backend

# 确保已配置 .env 文件
# 一键设置开发环境
./scripts/setup_dev.sh
```

### 方法二：手动设置

```bash
# 1. 安装依赖
uv sync

# 2. 初始化数据库
uv run python scripts/init_db.py

# 3. 创建测试数据（可选）
uv run python scripts/seed_data.py

# 4. 启动开发服务器
uv run uvicorn app.main:app --reload
```

## 📊 数据库迁移工作流

### 创建新迁移

当你修改了 SQLAlchemy 模型后：

```bash
# 自动生成迁移文件
uv run python scripts/migrate.py create "描述你的修改"

# 或者直接使用 alembic
uv run alembic revision --autogenerate -m "描述你的修改"
```

### 应用迁移

```bash
# 升级到最新版本
uv run python scripts/migrate.py upgrade

# 升级到特定版本
uv run python scripts/migrate.py upgrade <revision_id>
```

### 回滚迁移

```bash
# 回滚到上一个版本
uv run python scripts/migrate.py downgrade -1

# 回滚到特定版本
uv run python scripts/migrate.py downgrade <revision_id>
```

### 查看迁移状态

```bash
# 当前版本
uv run python scripts/migrate.py current

# 迁移历史
uv run python scripts/migrate.py history

# 验证迁移
uv run python scripts/migrate.py validate
```

## 🔧 常用命令

### 开发常用命令

```bash
# 查看当前数据库状态
uv run python scripts/migrate.py current

# 创建新迁移
uv run python scripts/migrate.py create "add new field to user table"

# 应用所有迁移
uv run python scripts/migrate.py upgrade

# 重置数据库（危险操作）
uv run python scripts/migrate.py reset
```

### 数据库管理

```bash
# 重新初始化数据库
uv run python scripts/init_db.py

# 创建测试数据
uv run python scripts/seed_data.py

# 检查数据库状态（在 Python 中）
python -c "
from app.db.session import get_database_status
import json
print(json.dumps(get_database_status(), indent=2))
"
```

## 🌐 多设备协作流程

### 场景1：新成员加入项目

```bash
# 1. 克隆项目
git clone <repository-url>
cd VectorForge/backend

# 2. 配置环境变量
cp .env.example .env  # 如果有的话
# 编辑 .env 文件，配置数据库连接

# 3. 一键设置
./scripts/setup_dev.sh

# 4. 验证设置
uv run uvicorn app.main:app --reload
```

### 场景2：同步最新数据库变更

```bash
# 1. 拉取最新代码
git pull

# 2. 应用新的迁移
uv run python scripts/migrate.py upgrade

# 3. 重启开发服务器
uv run uvicorn app.main:app --reload
```

### 场景3：开发新功能时的数据库变更

```bash
# 1. 修改 SQLAlchemy 模型
# 2. 生成迁移文件
uv run python scripts/migrate.py create "add user profile fields"

# 3. 应用迁移
uv run python scripts/migrate.py upgrade

# 4. 测试功能
# 5. 提交代码（包括迁移文件）
git add .
git commit -m "feat: add user profile fields"
git push
```

## 📁 文件结构

```
backend/
├── alembic/                     # Alembic 配置和迁移文件
│   ├── env.py                   # 环境配置（已集成项目配置）
│   ├── script.py.mako          # 迁移文件模板
│   └── versions/               # 迁移版本文件
│       └── 20250710_1419_c1f5213960dd_initial_database_schema.py
├── scripts/                     # 管理脚本
│   ├── init_db.py              # 数据库初始化
│   ├── migrate.py              # 迁移管理工具
│   ├── seed_data.py            # 种子数据
│   └── setup_dev.sh            # 一键开发环境设置
├── alembic.ini                 # Alembic 配置文件
└── app/
    ├── models/                 # SQLAlchemy 模型
    │   ├── base.py            # 基础模型
    │   ├── user.py            # 用户模型
    │   └── chat.py            # 对话模型
    └── db/
        └── session.py          # 数据库会话（已移除自动建表）
```

## ⚠️ 注意事项

### 环境变量配置

确保 `.env` 文件包含必要的数据库配置：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=vectorforge

# 安全配置
SECRET_KEY=your-secret-key-at-least-32-characters-long

# 可选配置
ENVIRONMENT=development
DEBUG=true
```

### 数据库权限

确保数据库用户具有以下权限：
- 创建数据库的权限
- 创建、修改、删除表的权限
- 插入、更新、删除数据的权限

### 版本控制

- ✅ **提交迁移文件**：所有 `alembic/versions/` 中的文件都应该被提交到 Git
- ❌ **不要修改已提交的迁移文件**：如果需要修改，创建新的迁移文件
- ✅ **按顺序应用迁移**：不要跳过中间的迁移版本

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查数据库服务状态
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# 检查配置
uv run python -c "from app.core.config import settings; print(settings.database_url)"
```

#### 2. 迁移冲突

```bash
# 查看当前状态
uv run python scripts/migrate.py current
uv run python scripts/migrate.py heads

# 如果有冲突，合并迁移分支
uv run alembic merge -m "merge migrations" <rev1> <rev2>
```

#### 3. 表已存在错误

如果是从旧系统迁移：

```bash
# 标记当前状态为已迁移（不实际执行SQL）
uv run alembic stamp head
```

#### 4. 重置开发环境

```bash
# 完全重置数据库
uv run python scripts/migrate.py reset

# 或者手动重置
uv run alembic downgrade base
uv run alembic upgrade head
```

## 📝 最佳实践

1. **频繁迁移**：每次模型修改后立即创建迁移
2. **描述性命名**：使用清晰的迁移描述信息
3. **测试迁移**：在应用到生产前充分测试
4. **备份数据**：重要操作前备份数据库
5. **团队同步**：及时同步迁移文件到团队

## 🎯 生产环境部署

```bash
# 1. 确保配置正确
export ENVIRONMENT=production

# 2. 应用迁移
uv run alembic upgrade head

# 3. 验证部署
uv run python -c "
from app.db.session import get_database_status
status = get_database_status()
if status['initialized']:
    print('✅ Database ready')
else:
    print('❌ Database not ready:', status['message'])
"
```

## 📞 获取帮助

- 查看迁移管理工具帮助：`uv run python scripts/migrate.py --help`
- 查看 Alembic 文档：https://alembic.sqlalchemy.org/
- 项目问题：提交 GitHub Issue 

## 🔄 **数据库结构修改流程**

### **第一步：修改 SQLAlchemy 模型**

在 `app/models/` 目录下修改相应的模型文件：

```python
# 例如：修改 app/models/user.py
class User(Base, TimestampMixin):
    __tablename__ = 'users'
    
    # 现有字段...
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(64), unique=True, index=True, nullable=False)
    
    # 新增字段
    phone = Column(String(20), nullable=True, comment="手机号码")
    bio = Column(Text, nullable=True, comment="个人简介")
```

### **第二步：生成迁移文件**

```bash
# 自动生成迁移文件
uv run python scripts/migrate.py create "add phone and bio fields to user table"

# 或者直接使用 alembic
uv run alembic revision --autogenerate -m "add phone and bio fields to user table"
``` 

### **第三步：检查生成的迁移文件**

查看生成的迁移文件（在 `alembic/versions/` 目录）：

```python
def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True, comment='手机号码'))
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True, comment='个人简介'))
    # ### end Alembic commands ###

def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'bio')
    op.drop_column('users', 'phone')
    # ### end Alembic commands ###
```

### **第四步：应用迁移**

```bash
# 应用迁移到数据库
uv run python scripts/migrate.py upgrade

# 或者
uv run alembic upgrade head
```

### **第五步：验证修改**

```bash
# 查看当前迁移状态
uv run python scripts/migrate.py current

# 查看迁移历史
uv run python scripts/migrate.py history
```

## 📋 **完整示例流程**

假设你要给用户表添加一个 `birthday` 字段：

### 1. 修改模型
```python
# app/models/user.py
class User(Base, TimestampMixin):
    # ... 现有字段
    birthday = Column(Date, nullable=True, comment="生日")
```

### 2. 生成迁移
```bash
uv run python scripts/migrate.py create "add birthday field to user table"
```

### 3. 应用迁移
```bash
uv run python scripts/migrate.py upgrade
```

### 4. 验证修改
```bash
uv run python scripts/migrate.py current
```

### 5. 提交代码
```bash
git add .
git commit -m "feat: add birthday field to user model"
git push
```

## 🌟 **高级操作**

### **复杂迁移**
如果 Alembic 自动生成的迁移不够完善，你可以手动编辑：

```python
def upgrade() -> None:
    # 添加字段
    op.add_column('users', sa.Column('status', sa.String(20), nullable=True))
    
    # 设置默认值
    op.execute("UPDATE users SET status = 'active' WHERE status IS NULL")
    
    # 修改为非空
    op.alter_column('users', 'status', nullable=False)
    
    # 添加索引
    op.create_index('idx_users_status', 'users', ['status'])
```

### **数据迁移**
包含数据变更的迁移：

```python
def upgrade() -> None:
    # 结构变更
    op.add_column('users', sa.Column('full_name', sa.String(255), nullable=True))
    
    # 数据迁移
    connection = op.get_bind()
    connection.execute("""
        UPDATE users 
        SET full_name = CONCAT(first_name, ' ', last_name)
        WHERE first_name IS NOT NULL AND last_name IS NOT NULL
    """)
```

### **回滚操作**
如果发现问题需要回滚：

```bash
# 回滚到上一个版本
uv run python scripts/migrate.py downgrade -1

# 回滚到特定版本
uv run python scripts/migrate.py downgrade <revision_id>
```

## 🚨 **注意事项**

1. **测试先行**：在开发环境充分测试后再应用到生产
2. **备份数据**：重要变更前备份数据库
3. **团队同步**：及时提交迁移文件给团队
4. **不要修改已提交的迁移**：如需修改，创建新的迁移文件
5. **命名规范**：使用描述性的迁移消息

## 🔍 **常用检查命令**

```bash
# 检查当前状态
uv run python scripts/migrate.py current

# 查看所有迁移
uv run python scripts/migrate.py history

# 验证迁移完整性
uv run python scripts/migrate.py validate

# 查看数据库状态
uv run python -c "
from app.db.session import get_database_status
import json
print(json.dumps(get_database_status(), indent=2))
"
```

这样你就有了一个完整、可控、可追踪的数据库结构修改流程！每次修改都会有版本记录，团队成员之间可以轻松同步数据库变更。 