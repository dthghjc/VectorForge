# VectorForge 登录系统使用指南

## 功能概述

VectorForge 登录系统是一个基于 JWT 的身份认证系统，支持用户角色权限管理。系统包含三种用户角色：

- **用户（USER）**：普通用户，可使用基本对话功能
- **审核员（REVIEWER）**：可进行对话标注和审核操作
- **管理员（ADMIN）**：拥有所有权限，包括用户管理

## 技术栈

### 前端
- React 19 + TypeScript
- Ant Design + Ant Design X
- Redux Toolkit (状态管理)
- React Router (路由管理)
- Axios (HTTP 请求)

### 后端
- FastAPI + SQLAlchemy
- JWT 认证
- MySQL 数据库
- Pydantic 数据验证

## 核心组件

### 1. 登录页面 (`frontend/src/page/login/index.tsx`)

**功能特点：**
- 现代化的渐变背景设计
- 表单验证（用户名最少3字符，密码最少6字符）
- 加载状态显示
- 错误处理和用户反馈
- 根据用户角色自动跳转

**使用示例：**
```tsx
// 访问 /login 页面
// 输入演示账号进行登录测试
```

### 2. 认证 API (`frontend/src/api/auth.ts`)

**主要接口：**
- `loginApi(data)` - 用户登录
- `getCurrentUserApi()` - 获取当前用户信息
- `logoutApi()` - 用户登出
- `registerApi(data)` - 用户注册（待实现）

**示例：**
```typescript
import { loginApi } from '../api/auth';

const handleLogin = async () => {
  const response = await loginApi({
    username: 'admin',
    password: '123456'
  });
  console.log('登录成功:', response.user);
};
```

### 3. 受保护路由 (`frontend/src/components/ProtectedRoute.tsx`)

**功能：**
- 验证用户登录状态
- 角色权限检查
- 自动重定向未授权用户

**使用示例：**
```tsx
import ProtectedRoute from '../components/ProtectedRoute';

// 普通受保护路由
<ProtectedRoute>
  <ChatPage />
</ProtectedRoute>

// 需要管理员权限的路由
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// 需要审核员权限的路由
<ProtectedRoute requiredRole="reviewer">
  <ReviewPage />
</ProtectedRoute>
```

### 4. 用户头像组件 (`frontend/src/components/UserAvatar.tsx`)

**功能：**
- 显示用户头像和基本信息
- 下拉菜单包含用户详情、统计信息
- 一键登出功能
- 根据角色显示不同的标识

## Redux 状态管理

### AuthSlice (`frontend/src/store/login/authSlice.ts`)

**状态结构：**
```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  menuList: any[];
}
```

**Actions：**
- `setToken` - 设置用户 token 和信息
- `clearToken` - 清除认证信息
- `updateUser` - 更新用户信息

## 后端 API 端点

### 认证路由 (`backend/app/api/v1/auth/router.py`)

| 端点 | 方法 | 功能 | 权限要求 |
|------|------|------|----------|
| `/v1/auth/token` | POST | 用户登录获取 token | 无 |
| `/v1/auth/test_token` | POST | 验证 token 有效性 | 登录用户 |
| `/v1/auth/register` | POST | 用户注册 | 无 |
| `/v1/auth/admin/users` | GET | 获取用户列表 | 管理员 |
| `/v1/auth/admin/users/{id}` | PUT | 修改用户信息 | 管理员 |

## 用户数据模型

### 后端用户模型 (`backend/app/models/user.py`)

```python
class User(Base, TimestampMixin):
    id: str                    # 用户ID (UUID)
    username: str              # 用户名（唯一）
    email: str                 # 邮箱（可选）
    hashed_password: str       # 加密密码
    role: UserRole             # 用户角色
    is_active: bool            # 是否激活
    total_annotations: int     # 总标注数
    approved_annotations: int  # 通过标注数
    approval_rate: float       # 通过率（计算属性）
```

### 前端用户接口 (`frontend/src/api/auth.ts`)

```typescript
interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  total_annotations: number;
  approved_annotations: number;
  approval_rate: number;
  created_at: string;
  updated_at: string;
}
```

## 演示账号

为了方便测试，系统提供以下演示账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 管理员 | 拥有所有权限 |
| demo | 123456 | 普通用户 | 基础对话功能 |

## 安全特性

1. **JWT Token 认证**：使用 JWT 进行无状态认证
2. **密码加密**：使用 bcrypt 加密存储密码
3. **Token 过期**：Token 具有有效期，过期后需重新登录
4. **权限控制**：基于角色的访问控制（RBAC）
5. **请求拦截**：自动处理 401 错误并重定向到登录页

## 开发建议

1. **环境变量配置**：
   ```bash
   # 前端 .env 文件
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

2. **路由配置示例**：
   ```tsx
   import { Routes, Route } from 'react-router-dom';
   import ProtectedRoute from './components/ProtectedRoute';
   import Login from './page/login';
   import Chat from './page/chat';
   
   function App() {
     return (
       <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="/chat" element={
           <ProtectedRoute>
             <Chat />
           </ProtectedRoute>
         } />
         <Route path="/admin" element={
           <ProtectedRoute requiredRole="admin">
             <AdminPanel />
           </ProtectedRoute>
         } />
       </Routes>
     );
   }
   ```

3. **错误处理**：
   - 登录失败会显示具体错误信息
   - Token 过期会自动清除本地存储并跳转登录页
   - 权限不足会重定向到未授权页面

## 下一步开发

1. **注册功能**：完善用户注册流程
2. **密码重置**：邮箱验证重置密码
3. **用户设置**：个人信息修改页面
4. **角色管理**：管理员用户管理界面
5. **审核工作流**：完善对话标注审核功能

---

此登录系统为 VectorForge 平台提供了完整的身份认证和权限管理基础，支持多角色用户的安全访问控制。 