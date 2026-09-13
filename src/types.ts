/**
 * 插件配置与数据类型定义
 */

export interface PluginConfig {
    /** 插件总开关 */
    enabled: boolean;
    /** 管理员 QQ 列表 (支持逗号分隔或数组) */
    admin_qqs: string;
    /** Nathan 授权站点根地址 (例如 https://auth.example.com) */
    api_url: string;
    /** 网站安全密钥 (webkey, 接口核心认证密钥) */
    web_key: string;
    /** 后台管理员账号 (adminname, 用于开通授权/创建用户等特权接口) */
    admin_name: string;
    /** 后台管理员密码 (password) */
    admin_password: string;
    /** 默认应用 ID (appid) */
    default_appid: string;

    // 机器人指令与交互开关
    /** 允许普通用户自助激活授权码 (#激活授权) */
    allow_user_activate: boolean;
    /** 允许普通用户自助查询域名 (#查授权) */
    allow_user_query: boolean;
    /** 允许普通用户自助换绑 (#换绑授权) */
    allow_user_replace: boolean;
    /** 限制仅在指定群生效 (留空则私聊与所有群皆可，逗号分隔群号) */
    allowed_groups: string;

    // Telegram 告警配置 (可选)
    tg_enable: boolean;
    tg_bot_token: string;
    tg_chat_id: string;
}

export interface AuthQueryResponse {
    code: string | number;
    msg: string;
    data?: any;
}

export interface AppInfo {
    id: string | number;
    app_name: string;
    app_team?: string;
    app_url?: string;
    app_author?: string;
    app_qq?: string;
    app_auth_money?: string;
    app_addtime?: string;
    state?: string;
}
