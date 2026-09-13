import path from 'path';
import fs from 'fs';

var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2["META"] = "meta_event";
  EventType2["REQUEST"] = "request";
  EventType2["NOTICE"] = "notice";
  EventType2["MESSAGE"] = "message";
  EventType2["MESSAGE_SENT"] = "message_sent";
  return EventType2;
})(EventType || {});

const defaultConfig = {
  enabled: true,
  admin_qqs: "2322796106",
  api_url: "https://auth.example.com",
  web_key: "Nathan_Auth",
  admin_name: "admin",
  admin_password: "",
  default_appid: "1",
  allow_user_activate: true,
  allow_user_query: true,
  allow_user_replace: true,
  allowed_groups: "",
  report_self_message: false,
  tg_enable: false,
  tg_bot_token: "",
  tg_chat_id: ""
};
function buildConfigSchema(_ctx) {
  return [
    {
      key: "enabled",
      label: "插件总开关",
      type: "boolean",
      default: true,
      description: "开启或关闭域名授权管理插件"
    },
    {
      key: "admin_qqs",
      label: "管理员 QQ",
      type: "string",
      default: "2322796106",
      description: "拥有全部后台特权操作权限的 QQ 号，多个请用英文逗号分隔"
    },
    {
      key: "api_url",
      label: "Nathan 授权系统域名",
      type: "string",
      default: "https://auth.example.com",
      description: "授权站点访问根地址，无需末尾斜杠"
    },
    {
      key: "web_key",
      label: "网站安全密钥 (webkey)",
      type: "string",
      default: "Nathan_Auth",
      description: "授权系统后台配置的通讯安全密钥"
    },
    {
      key: "admin_name",
      label: "管理员账号",
      type: "string",
      default: "admin",
      description: "用于管理员添加授权的账户"
    },
    {
      key: "admin_password",
      label: "管理员密码",
      type: "string",
      default: "",
      description: "用于管理员添加授权的密码"
    },
    {
      key: "default_appid",
      label: "默认应用 ID (appid)",
      type: "string",
      default: "1",
      description: "不指定应用时的默认授权应用 ID"
    },
    {
      key: "allow_user_activate",
      label: "允许普通用户授权码激活",
      type: "boolean",
      default: true,
      description: "开启后群成员可通过 #激活授权 授权码 域名 激活"
    },
    {
      key: "allow_user_query",
      label: "允许普通用户查授权",
      type: "boolean",
      default: true,
      description: "开启后群成员可通过 #查授权 域名 查询状态"
    },
    {
      key: "allow_user_replace",
      label: "允许用户自助换绑",
      type: "boolean",
      default: true,
      description: "开启后允许原授权 QQ 提交 #换绑授权"
    },
    {
      key: "allowed_groups",
      label: "允许响应群号",
      type: "string",
      default: "",
      description: "留空表示全部群聊及私聊均可响应，多个群号用英文逗号隔开"
    },
    {
      key: "report_self_message",
      label: "响应自身消息 (Bot自身外发消息触发)",
      type: "boolean",
      default: false,
      description: "开启后机器人自身在手机或PC端发出的指令也能正常响应"
    }
  ];
}

class PluginState {
  static instance;
  ctx;
  config = { ...defaultConfig };
  configPath = "";
  startTime = Date.now();
  onConfigChange;
  // 运行统计
  stats = {
    totalQueries: 0,
    totalActivates: 0,
    totalAdds: 0,
    totalCardsCreated: 0,
    totalSelfMessages: 0,
    lastActiveTime: ""
  };
  constructor() {
  }
  static getInstance() {
    if (!PluginState.instance) {
      PluginState.instance = new PluginState();
    }
    return PluginState.instance;
  }
  init(ctx) {
    this.ctx = ctx;
    this.configPath = path.join(ctx.dataPath, "config.json");
    this.loadConfig();
  }
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf-8");
        const saved = JSON.parse(data);
        this.config = { ...defaultConfig, ...saved };
        this.ctx.logger.info("已加载插件配置文件");
      } else {
        this.config = { ...defaultConfig };
        this.saveConfig();
      }
    } catch (e) {
      this.ctx.logger.error("加载配置文件失败，使用默认配置:", e);
      this.config = { ...defaultConfig };
    }
  }
  saveConfig() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
      this.ctx.logger.info("插件配置文件已保存");
      if (this.onConfigChange) {
        this.onConfigChange();
      }
    } catch (e) {
      this.ctx.logger.error("保存配置文件失败:", e);
    }
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }
  isAdmin(userId) {
    const uid = String(userId).trim();
    const admins = this.config.admin_qqs.split(/[,，|]/).map((s) => s.trim()).filter(Boolean);
    return admins.includes(uid);
  }
  isGroupAllowed(groupId) {
    if (!groupId) return true;
    const gid = String(groupId).trim();
    const allowed = this.config.allowed_groups.split(/[,，|]/).map((s) => s.trim()).filter(Boolean);
    if (allowed.length === 0) return true;
    return allowed.includes(gid);
  }
  getUptimeFormatted() {
    const diff = Math.floor((Date.now() - this.startTime) / 1e3);
    const days = Math.floor(diff / 86400);
    const hours = Math.floor(diff % 86400 / 3600);
    const minutes = Math.floor(diff % 3600 / 60);
    const seconds = diff % 60;
    return `${days}天 ${hours}小时 ${minutes}分 ${seconds}秒`;
  }
}
const pluginState = PluginState.getInstance();

class NathanApiService {
  /**
   * 发送统一请求
   */
  static async request(endpoint, params = {}) {
    const baseUrl = pluginState.config.api_url.replace(/\/+$/, "");
    const url = new URL(`${baseUrl}${endpoint}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== void 0 && v !== null && v !== "") {
        url.searchParams.append(k, String(v));
      }
    }
    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 NapCat-Plugin-Nathan-Auth/1.0",
          "Accept": "application/json, text/plain, */*"
        }
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { code: -1, msg: text };
      }
    } catch (err) {
      pluginState.ctx.logger.error(`请求 Nathan API 失败 [${endpoint}]:`, err);
      return { code: -1, msg: `网络请求失败: ${err.message || err}` };
    }
  }
  /**
   * 1. 授权查询
   */
  static async queryAuth(url, appid) {
    pluginState.stats.totalQueries++;
    pluginState.stats.lastActiveTime = (/* @__PURE__ */ new Date()).toLocaleString();
    return this.request("/api/Index/query_auth", {
      appid: appid || pluginState.config.default_appid,
      url: url.trim()
    });
  }
  /**
   * 2. 授权码自助授权
   */
  static async createAuthByCard(params) {
    pluginState.stats.totalActivates++;
    pluginState.stats.lastActiveTime = (/* @__PURE__ */ new Date()).toLocaleString();
    return this.request("/api/Index/create_auth", {
      appid: params.appid || pluginState.config.default_appid,
      key: params.key.trim(),
      url: params.url.trim(),
      qq: params.qq.trim(),
      ip: params.ip || "127.0.0.1",
      email: params.email || `${params.qq}@qq.com`,
      phone: params.phone || ""
    });
  }
  /**
   * 3. 管理员直接添加授权
   */
  static async adminAddAuth(params) {
    pluginState.stats.totalAdds++;
    pluginState.stats.lastActiveTime = (/* @__PURE__ */ new Date()).toLocaleString();
    return this.request("/api/Index/admin_add_auth", {
      appid: params.appid || pluginState.config.default_appid,
      url: params.url.trim(),
      qq: params.qq.trim(),
      authdate: params.authdate !== void 0 ? params.authdate : "0",
      adminname: pluginState.config.admin_name,
      password: pluginState.config.admin_password,
      ip: params.ip || "127.0.0.1",
      email: params.email || `${params.qq}@qq.com`,
      phone: params.phone || ""
    });
  }
  /**
   * 4. 批量生成授权码
   */
  static async createCards(params) {
    pluginState.stats.totalCardsCreated += params.count;
    pluginState.stats.lastActiveTime = (/* @__PURE__ */ new Date()).toLocaleString();
    return this.request("/api/index/createCard", {
      webkey: pluginState.config.web_key,
      CardAct: 1,
      count: params.count || 1,
      appid: params.appid || pluginState.config.default_appid,
      authdate: params.authdate !== void 0 ? params.authdate : 0,
      money: params.money || 0,
      prefix: params.prefix || "AUTH"
    });
  }
  /**
   * 5. 封禁授权
   */
  static async freezeAuth(url, reason = "违规拉黑", appid) {
    return this.request("/api/Index/freeze_auth", {
      appid: appid || pluginState.config.default_appid,
      url: url.trim(),
      reason: reason.trim(),
      webkey: pluginState.config.web_key
    });
  }
  /**
   * 6. 解封授权
   */
  static async unsealAuth(url, appid) {
    return this.request("/api/Index/unseal_auth", {
      appid: appid || pluginState.config.default_appid,
      url: url.trim(),
      webkey: pluginState.config.web_key
    });
  }
  /**
   * 7. 删除授权
   */
  static async deleteAuth(url, appid) {
    return this.request("/api/Index/del_auth", {
      appid: appid || pluginState.config.default_appid,
      url: url.trim(),
      webkey: pluginState.config.web_key
    });
  }
  /**
   * 8. 更改授权 (换绑)
   */
  static async replaceAuth(params) {
    return this.request("/api/Index/replace_auth", {
      appid: params.appid || pluginState.config.default_appid,
      webkey: pluginState.config.web_key,
      qq: params.qq.trim(),
      url: params.url.trim(),
      new_url: params.new_url.trim(),
      phone: params.phone || "",
      email: params.email || `${params.qq}@qq.com`,
      ip: params.ip || "127.0.0.1"
    });
  }
  /**
   * 9. 获取应用列表
   */
  static async getAppList() {
    return this.request("/api/Index/applist", {
      webkey: pluginState.config.web_key
    });
  }
  /**
   * 10. 获取授权站公告
   */
  static async getNotice() {
    return this.request("/api/Index/auth_notice", {
      webkey: pluginState.config.web_key
    });
  }
}

async function handleMessage(ctx, event) {
  const rawMsg = event.raw_message?.trim() || "";
  if (!rawMsg.startsWith("#")) return;
  const userId = event.user_id;
  const groupId = event.group_id;
  if (groupId && !pluginState.isGroupAllowed(groupId)) {
    return;
  }
  const isAdmin = pluginState.isAdmin(userId);
  const args = rawMsg.slice(1).trim().split(/\s+/);
  const command = args[0]?.toLowerCase();
  const reply = async (text) => {
    try {
      if (groupId) {
        await ctx.actions.call("send_group_msg", { group_id: groupId, message: text }, ctx.adapterName);
      } else {
        await ctx.actions.call("send_private_msg", { user_id: userId, message: text }, ctx.adapterName);
      }
    } catch (e) {
      ctx.logger.error("回复消息失败:", e);
    }
  };
  switch (command) {
    // ================= 普通用户指令 =================
    case "授权帮助":
    case "authhelp": {
      let help = `🐾 【Nathan 域名授权管理助手】
------------------------
#查授权 [域名] - 查询域名是否正版授权
#激活授权 [授权码] [域名] - 自助核销授权码绑定授权
#换绑授权 [旧域名] [新域名] - 自助更换授权域名
`;
      if (isAdmin) {
        help += `
👑 【管理员后台特权指令】
#开通授权 [域名] [QQ] [天数/0为永久] [应用ID可选]
#生成授权码 [数量] [天数/0为永久] [应用ID可选]
#封禁授权 [域名] [原因可选]
#解封授权 [域名]
#删除授权 [域名]
#应用列表 - 查看所有授权项目
#授权公告 - 查看系统最新公告`;
      }
      await reply(help);
      break;
    }
    case "查授权": {
      if (!pluginState.config.allow_user_query && !isAdmin) {
        await reply("❌ 当前管理员未开放普通用户查授权功能。");
        return;
      }
      const domain = args[1];
      if (!domain) {
        await reply("💡 格式：#查授权 [域名]\n例如：#查授权 example.com");
        return;
      }
      const res = await NathanApiService.queryAuth(domain);
      if (String(res.code) === "1") {
        await reply(`✅ 【正版授权】
域名: ${domain}
状态: 授权有效
详情: ${res.msg || "正版授权"}`);
      } else {
        await reply(`⚠️ 【授权未通过】
域名: ${domain}
提示: ${res.msg || "未查询到有效授权记录"}`);
      }
      break;
    }
    case "激活授权": {
      if (!pluginState.config.allow_user_activate && !isAdmin) {
        await reply("❌ 当前管理员未开放普通用户自助授权码激活。");
        return;
      }
      const key = args[1];
      const domain = args[2];
      if (!key || !domain) {
        await reply("💡 格式：#激活授权 [授权码] [域名]\n例如：#激活授权 AUTH-XXXXX test.com");
        return;
      }
      const res = await NathanApiService.createAuthByCard({
        key,
        url: domain,
        qq: String(userId)
      });
      if (String(res.code) === "1") {
        await reply(`🎉 激活成功！
域名：${domain}
绑定 QQ：${userId}
反馈：${res.msg}`);
      } else {
        await reply(`❌ 激活失败：${res.msg || "授权码无效或已被使用"}`);
      }
      break;
    }
    case "换绑授权": {
      if (!pluginState.config.allow_user_replace && !isAdmin) {
        await reply("❌ 当前管理员未开放自助换绑授权。");
        return;
      }
      const oldDomain = args[1];
      const newDomain = args[2];
      if (!oldDomain || !newDomain) {
        await reply("💡 格式：#换绑授权 [旧域名] [新域名]\n例如：#换绑授权 old.com new.com");
        return;
      }
      const res = await NathanApiService.replaceAuth({
        url: oldDomain,
        new_url: newDomain,
        qq: String(userId)
      });
      if (String(res.code) === "1") {
        await reply(`✅ 换绑成功！
原域名：${oldDomain}
新域名：${newDomain}`);
      } else {
        await reply(`❌ 换绑失败：${res.msg || "信息不匹配或无权操作"}`);
      }
      break;
    }
    // ================= 管理员特权指令 =================
    case "开通授权":
    case "添加授权": {
      if (!isAdmin) {
        await reply("⛔ 无权执行此操作，该指令仅限系统管理员。");
        return;
      }
      const domain = args[1];
      const targetQQ = args[2] || String(userId);
      const days = args[3] !== void 0 ? args[3] : "0";
      const appid = args[4];
      if (!domain) {
        await reply("💡 格式：#开通授权 [域名] [QQ] [天数/0为永久] [应用ID]\n例如：#开通授权 test.com 10001 0 1");
        return;
      }
      const res = await NathanApiService.adminAddAuth({
        url: domain,
        qq: targetQQ,
        authdate: days,
        appid
      });
      if (String(res.code) === "1") {
        await reply(`🎉 授权添加成功！
域名：${domain}
站长 QQ：${targetQQ}
有效时长：${days === "0" ? "永久" : `${days}天`}`);
      } else {
        await reply(`❌ 开通失败：${res.msg || "接口返回错误"}`);
      }
      break;
    }
    case "生成授权码":
    case "生成激活码": {
      if (!isAdmin) {
        await reply("⛔ 无权执行此操作，该指令仅限系统管理员。");
        return;
      }
      const count = parseInt(args[1] || "1", 10);
      const days = parseInt(args[2] || "0", 10);
      const appid = args[3];
      if (isNaN(count) || count < 1 || count > 50) {
        await reply("💡 格式：#生成授权码 [数量1-50] [天数/0为永久] [应用ID]\n例如：#生成授权码 5 0 1");
        return;
      }
      const res = await NathanApiService.createCards({
        count,
        authdate: days,
        appid
      });
      if (String(res.code) === "1" || res.data && Array.isArray(res.data)) {
        const cards = Array.isArray(res.data) ? res.data : [res.msg || "生成完成"];
        let text = `📦 已成功生成 ${count} 张授权码 (${days === 0 ? "永久" : `${days}天`})：
`;
        text += cards.map((c) => typeof c === "string" ? c : c.card || JSON.stringify(c)).join("\n");
        await reply(text);
      } else {
        await reply(`❌ 生成激活码失败：${res.msg || "请检查网站安全密钥是否正确"}`);
      }
      break;
    }
    case "封禁授权":
    case "拉黑域名": {
      if (!isAdmin) {
        await reply("⛔ 无权执行此操作，该指令仅限系统管理员。");
        return;
      }
      const domain = args[1];
      const reason = args[2] || "违规倒卖/违规使用";
      if (!domain) {
        await reply("💡 格式：#封禁授权 [域名] [原因]");
        return;
      }
      const res = await NathanApiService.freezeAuth(domain, reason);
      if (String(res.code) === "1") {
        await reply(`🔒 授权已封禁！
域名：${domain}
原因：${reason}`);
      } else {
        await reply(`❌ 封禁失败：${res.msg || "操作失败"}`);
      }
      break;
    }
    case "解封授权": {
      if (!isAdmin) {
        await reply("⛔ 无权执行此操作，该指令仅限系统管理员。");
        return;
      }
      const domain = args[1];
      if (!domain) {
        await reply("💡 格式：#解封授权 [域名]");
        return;
      }
      const res = await NathanApiService.unsealAuth(domain);
      if (String(res.code) === "1") {
        await reply(`🔓 授权已解除封禁：${domain}`);
      } else {
        await reply(`❌ 解封失败：${res.msg || "操作失败"}`);
      }
      break;
    }
    case "删除授权": {
      if (!isAdmin) {
        await reply("⛔ 无权执行此操作，该指令仅限系统管理员。");
        return;
      }
      const domain = args[1];
      if (!domain) {
        await reply("💡 格式：#删除授权 [域名]");
        return;
      }
      const res = await NathanApiService.deleteAuth(domain);
      if (String(res.code) === "1") {
        await reply(`🗑️ 授权已永久删除：${domain}`);
      } else {
        await reply(`❌ 删除失败：${res.msg || "操作失败"}`);
      }
      break;
    }
    case "应用列表": {
      if (!isAdmin) {
        await reply("⛔ 无权执行此操作，该指令仅限系统管理员。");
        return;
      }
      const res = await NathanApiService.getAppList();
      if (Array.isArray(res)) {
        let msg = `📱 【Nathan 授权应用列表】(共 ${res.length} 个)
`;
        for (const app of res) {
          msg += `
ID: [${app.id}] ${app.app_name}
团队: ${app.app_team || "无"} | 单价: ¥${app.app_auth_money || "0"}`;
        }
        await reply(msg);
      } else {
        await reply(`❌ 获取失败：${res.msg || "网络或安全密钥错误"}`);
      }
      break;
    }
    case "授权公告": {
      const res = await NathanApiService.getNotice();
      await reply(`📢 【授权站公告】
${res.msg || res.data || "暂无公告内容"}`);
      break;
    }
  }
}

function registerApiRoutes(ctx) {
  const router = ctx.router;
  router.getNoAuth("/status", (_req, res) => {
    res.json({
      code: 0,
      data: {
        pluginName: ctx.pluginName,
        uptime: pluginState.getUptimeFormatted(),
        stats: pluginState.stats,
        config: {
          enabled: pluginState.config.enabled,
          admin_qqs: pluginState.config.admin_qqs,
          api_url: pluginState.config.api_url,
          default_appid: pluginState.config.default_appid,
          allow_user_activate: pluginState.config.allow_user_activate,
          allow_user_query: pluginState.config.allow_user_query,
          allow_user_replace: pluginState.config.allow_user_replace,
          allowed_groups: pluginState.config.allowed_groups,
          report_self_message: pluginState.config.report_self_message
        }
      }
    });
  });
  router.getNoAuth("/config", (_req, res) => {
    res.json({ code: 0, data: pluginState.config });
  });
  router.postNoAuth("/config", (req, res) => {
    try {
      const body = req.body;
      if (!body) {
        return res.status(400).json({ code: -1, message: "请求体为空" });
      }
      pluginState.updateConfig(body);
      ctx.logger.info("配置已通过 WebUI API 更新");
      res.json({ code: 0, message: "配置已成功保存！" });
    } catch (e) {
      res.status(500).json({ code: -1, message: e.message || String(e) });
    }
  });
  router.getNoAuth("/query-auth", async (req, res) => {
    const domain = req.query.url;
    const appid = req.query.appid;
    if (!domain) {
      return res.status(400).json({ code: -1, message: "请输入要查询的域名" });
    }
    const result = await NathanApiService.queryAuth(domain, appid);
    res.json({ code: 0, data: result });
  });
  router.postNoAuth("/add-auth", async (req, res) => {
    const body = req.body;
    if (!body || !body.url || !body.qq) {
      return res.status(400).json({ code: -1, message: "域名与站长QQ为必填项" });
    }
    const result = await NathanApiService.adminAddAuth({
      url: body.url,
      qq: body.qq,
      authdate: body.authdate !== void 0 ? body.authdate : "0",
      appid: body.appid,
      ip: body.ip,
      email: body.email,
      phone: body.phone
    });
    res.json({ code: 0, data: result });
  });
  router.postNoAuth("/create-cards", async (req, res) => {
    const body = req.body;
    const count = parseInt(body?.count || "1", 10);
    const authdate = parseInt(body?.authdate || "0", 10);
    const prefix = body?.prefix || "AUTH";
    const appid = body?.appid;
    const money = parseFloat(body?.money || "0");
    const result = await NathanApiService.createCards({
      count,
      authdate,
      prefix,
      appid,
      money
    });
    res.json({ code: 0, data: result });
  });
  router.postNoAuth("/freeze-auth", async (req, res) => {
    const { url, reason, appid } = req.body || {};
    if (!url) return res.status(400).json({ code: -1, message: "域名为必填项" });
    const result = await NathanApiService.freezeAuth(url, reason, appid);
    res.json({ code: 0, data: result });
  });
  router.postNoAuth("/unseal-auth", async (req, res) => {
    const { url, appid } = req.body || {};
    if (!url) return res.status(400).json({ code: -1, message: "域名为必填项" });
    const result = await NathanApiService.unsealAuth(url, appid);
    res.json({ code: 0, data: result });
  });
  router.postNoAuth("/delete-auth", async (req, res) => {
    const { url, appid } = req.body || {};
    if (!url) return res.status(400).json({ code: -1, message: "域名为必填项" });
    const result = await NathanApiService.deleteAuth(url, appid);
    res.json({ code: 0, data: result });
  });
  router.getNoAuth("/apps", async (_req, res) => {
    const result = await NathanApiService.getAppList();
    res.json({ code: 0, data: result });
  });
}

let plugin_config_ui = [];
const plugin_init = async (ctx) => {
  try {
    pluginState.init(ctx);
    ctx.logger.info("🐾 Nathan 域名授权插件初始化中...");
    plugin_config_ui = buildConfigSchema(ctx);
    registerWebUI(ctx);
    registerApiRoutes(ctx);
    ctx.logger.info("✅ Nathan 域名授权插件加载完成！");
  } catch (error) {
    ctx.logger.error("插件初始化失败:", error);
  }
};
const plugin_onmessage = async (ctx, event) => {
  if (event.post_type !== EventType.MESSAGE) return;
  if (!pluginState.config.enabled) return;
  await handleMessage(ctx, event);
};
const plugin_onevent = async (ctx, event) => {
  if (event.post_type === "message_sent") {
    if (!pluginState.config.enabled) return;
    if (pluginState.config.report_self_message) {
      pluginState.stats.totalSelfMessages = (pluginState.stats.totalSelfMessages || 0) + 1;
      await handleMessage(ctx, event);
    }
  }
};
const plugin_cleanup = async (ctx) => {
  try {
    ctx.logger.info("🛑 Nathan 域名授权插件已卸载");
  } catch (e) {
    ctx.logger.warn("插件卸载时出错:", e);
  }
};
const plugin_get_config = async (_ctx) => {
  return pluginState.config;
};
const plugin_set_config = async (ctx, config) => {
  pluginState.replaceConfig(config);
  ctx.logger.info("⚙️ 配置已通过 NapCat 插件管理更新");
};
const plugin_on_config_change = async (ctx, _ui, key, value, _currentConfig) => {
  try {
    pluginState.updateConfig({ [key]: value });
    ctx.logger.info(`⚙️ 配置项 ${key} 已更新`);
  } catch (err) {
    ctx.logger.error(`更新配置项 ${key} 失败:`, err);
  }
};
function registerWebUI(ctx) {
  try {
    const webuiDist = path.resolve(ctx.pluginPath, "webui");
    const router = ctx.router;
    router.static("/webui", "webui");
    router.static("/static", "webui");
    router.page({
      path: "auth",
      title: "域名授权管理",
      icon: "🐾",
      htmlFile: "webui/index.html",
      description: "Nathan 域名授权管理系统 Web 控制台"
    });
    if (fs.existsSync(webuiDist)) {
      router.getNoAuth("/", (_req, res) => {
        res.sendFile(path.join(webuiDist, "index.html"));
      });
      ctx.logger.info(`WebUI 静态资源已挂载: ${webuiDist}`);
    } else {
      router.getNoAuth("/", (_req, res) => {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send("<h3>WebUI 未构建，请执行 npm run build:webui</h3>");
      });
    }
  } catch (error) {
    ctx.logger.error("注册 WebUI 失败:", error);
  }
}

export { plugin_cleanup, plugin_config_ui, plugin_get_config, plugin_init, plugin_on_config_change, plugin_onevent, plugin_onmessage, plugin_set_config };
