/** WebUI 前端类型定义 */

export interface PluginStatus {
    pluginName: string
    uptime: string
    stats: {
        totalQueries: number
        totalActivates: number
        totalAdds: number
        totalCardsCreated: number
        totalSelfMessages: number
        lastActiveTime: string
    }
    config: PluginConfig
}

export interface PluginConfig {
    enabled: boolean
    admin_qqs: string
    api_url: string
    web_key?: string
    admin_name?: string
    admin_password?: string
    default_appid: string
    command_prefix: string
    allow_user_activate: boolean
    allow_user_query: boolean
    allow_user_replace: boolean
    allowed_groups: string
    report_self_message: boolean
    tg_enable?: boolean
    tg_bot_token?: string
    tg_chat_id?: string
}

export interface ApiResponse<T = unknown> {
    code: number
    data?: T
    message?: string
}
