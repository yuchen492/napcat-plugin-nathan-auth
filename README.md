# NapCat Nathan 域名授权管理插件 (napcat-plugin-nathan-auth)

[![Node](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org/)
[![NapCat](https://img.shields.io/badge/NapCat-Plugin-blue.svg)](https://napcat.wlynxe.com/)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](./LICENSE)

专为 **NapCat / OneBot 11** 生态打造的 **Nathan 域名授权管理系统** 全功能插件。  
内置**现代化独立 WebUI 管理面板**与丰富的 **QQ 机器人交互指令**，支持在线查验授权、手动开通、卡密批量生成、拉黑封禁与换绑，并提供**自身消息监听上报开关与实时图表统计**。

---

## 🌟 核心特性

- 🖥️ **独立现代化 WebUI 控制台**：
  - **仪表盘总览**：实时统计总查询数、自助激活数、手动开通数、已生成授权码总数以及**自身消息监听处理数**。
  - **在线实时核验**：直接在网页端输入域名与 AppID 查验授权有效性，并提供**一键封禁、解封、删除**快捷操作。
  - **手动开通授权**：网页表单批量开通站长授权（支持指定有效天数、绑定 IP、联系邮箱与 QQ）。
  - **批量生成授权码（卡密）**：自定义生成数量、有效期（支持永久）、前缀（如 `AUTH`）及项目 AppID，支持一键复制。
  - **系统接口与安全配置**：可视化配置授权根地址、网站安全密钥 (`web_key`)、管理员特权 QQ、群聊白名单以及**是否处理自身消息 (`report_self_message`) 开关**。
- 🤖 **QQ 机器人双端联动**：
  - **普通用户指令**：支持自助查授权、授权码核销激活、自助换绑域名。
  - **管理员特权指令**：在 QQ 群或私聊中随时开通授权、制卡导出、封禁/解封域名。
- 🔄 **自身消息上报与响应支持 (`report_self_message`)**：
  - 完美支持捕获 Bot 自己发出的指令（`message_sent` 事件），由 WebUI 独立开关控制，满足自发自收与测试需求。

---

## 📖 QQ 交互指令指南

### 1. 普通用户指令（支持群聊与私聊）
| 指令格式 | 说明 | 示例 |
| :--- | :--- | :--- |
| `#查授权 [域名]` | 查询目标域名是否为官方正版有效授权 | `#查授权 example.com` |
| `#激活授权 [授权码] [域名]` | 使用购买的卡密/授权码自助激活并绑定自身 QQ | `#激活授权 AUTH-ABCDE example.com` |
| `#换绑授权 [旧域名] [新域名]`| 原授权绑定的 QQ 自助更换授权域名 | `#换绑授权 old.com new.com` |
| `#授权帮助` 或 `#authhelp` | 呼出机器人指令帮助菜单 | `#授权帮助` |

### 2. 管理员特权指令（仅限 `admin_qqs` 中配置的 QQ 号）
| 指令格式 | 说明 | 示例 |
| :--- | :--- | :--- |
| `#开通授权 [域名] [QQ] [天数] [项目ID]` | 手动开通授权（天数为 0 表示永久） | `#开通授权 app.com 10001 0 1` |
| `#生成授权码 [数量] [天数] [项目ID]` | 批量生成授权码并在聊天窗口导出列表 | `#生成授权码 5 0 1` |
| `#封禁授权 [域名] [原因]` | 将违规或倒卖源码的域名拉黑失效 | `#封禁授权 evil.com 倒卖违规` |
| `#解封授权 [域名]` | 解除指定域名的拉黑状态 | `#解封授权 evil.com` |
| `#删除授权 [域名]` | 从授权系统中彻底移除该域名的记录 | `#删除授权 test.com` |
| `#应用列表` | 查看 Nathan 后台当前所有上架项目及单价 | `#应用列表` |

---

## 🛠️ 安装与部署方式

### 方法一：通过 NapCat 插件目录直接安装（推荐）

1. 下载最新的 Release 产物或构建产物包解压至 NapCat 的插件目录：
   ```bash
   /app/napcat/plugins/napcat-plugin-nathan-auth/
   ```
2. 确保目录结构如下：
   ```text
   napcat-plugin-nathan-auth/
   ├── index.mjs
   ├── package.json
   ├── icon.png
   └── webui/
       └── index.html
   ```
3. 在 NapCat 的 `config/plugins.json` 中配置启用：
   ```json
   {
     "napcat-plugin-nathan-auth": true
   }
   ```
4. 重启 NapCat 或在控制台热重载插件。

---

### 方法二：从源码编译构建

```bash
# 1. 克隆本仓库
git clone https://github.com/yuchen492/napcat-plugin-nathan-auth.git
cd napcat-plugin-nathan-auth

# 2. 安装依赖并构建
npm install
npm run build:webui
npm run build

# 3. 产物生成在 dist/ 目录中，可直接复制至 NapCat plugins 目录
```

---

## ⚙️ 配置说明

插件支持直接在 **WebUI 面板** 进行可视化配置，也可以在 `config/plugins/napcat-plugin-nathan-auth/config.json` 中修改：

```json
{
  "enabled": true,
  "admin_qqs": "2322796106",
  "api_url": "https://auth.yourdomain.com",
  "web_key": "Nathan_Auth",
  "admin_name": "admin",
  "admin_password": "your_password",
  "default_appid": "1",
  "allow_user_activate": true,
  "allow_user_query": true,
  "allow_user_replace": true,
  "allowed_groups": "",
  "report_self_message": false
}
```

| 参数项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enabled` | boolean | `true` | 插件总开关 |
| `admin_qqs` | string | `2322796106` | 管理员 QQ 列表，多个用英文逗号隔开 |
| `api_url` | string | `https://auth.example.com` | Nathan 域名授权系统根访问地址 |
| `web_key` | string | `Nathan_Auth` | 授权系统后台通讯安全密钥 |
| `admin_name` | string | `admin` | 后台管理员用户名（用于特权操作接口） |
| `admin_password`| string | `""` | 后台管理员密码 |
| `default_appid` | string | `1` | 默认授权项目的 AppID |
| `report_self_message` | boolean | `false` | **是否处理自身发送的消息**。开启后机器人将响应自身发出的指令并在 WebUI 统计自身消息量 |
| `allowed_groups`| string | `""` | 限制响应的群号（留空表示所有群及私聊均可响应） |

---

## 📄 开源许可证

本项目基于 [MIT License](./LICENSE) 协议开源。

---

## ❓ 常见问题：提示 `not in official plugin whitelist` 无法加载？

若在 NapCat 启动日志中出现类似以下警告并导致插件被跳过：
```text
[WARN] [PluginLoader] Rejected napcat-plugin-nathan-auth (napcat-plugin-nathan-auth): not in official plugin whitelist
```

### 🔍 原因说明
这是 **NapCat 官方在近期最新版本中引入的插件 ID 白名单限制**。官方默认仅允许加载内置指定的官方插件，导致非白名单内的第三方插件被拦截。

### 🛠️ 解决方案（任选其一）

#### 方案 A：解除 NapCat 核心的白名单限制（彻底放行所有第三方插件，推荐）
- **Docker 容器环境**：
  ```bash
  docker exec -it <你的napcat容器名> sed -i 's/return "not in official plugin whitelist"/return null/g' /app/napcat/napcat.mjs
  docker restart <你的napcat容器名>
  ```
- **源码 / 单文件运行环境**：
  在 `napcat.mjs` 中搜索 `not in official plugin whitelist`，将该行返回值修改为 `return null;` 后重启 NapCat 即可。

#### 方案 B：借用官方白名单插件 ID（免改核心）
如果你的 NapCat 中未安装官方的 `napcat-plugin-cleaner`，可以直接借用该 ID 伪装放行：
1. 进入 plugins 插件目录，将本插件目录重命名为 `napcat-plugin-cleaner`；
2. 打开插件目录下的 `package.json`，将 `"name": "napcat-plugin-nathan-auth"` 改为 `"name": "napcat-plugin-cleaner"`；
3. 重启 NapCat 即可正常加载。
