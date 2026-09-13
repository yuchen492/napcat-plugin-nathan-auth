import type { PluginConfigSchema, NapCatPluginContext } from 'napcat-types/napcat-onebot/network/plugin/types';
import type { PluginConfig } from './types';

export const defaultConfig: PluginConfig = {
    enabled: true,
    admin_qqs: '2322796106',
    api_url: 'https://auth.example.com',
    web_key: 'Nathan_Auth',
    admin_name: 'admin',
    admin_password: '',
    default_appid: '1',

    allow_user_activate: true,
    allow_user_query: true,
    allow_user_replace: true,
    allowed_groups: '',

    report_self_message: false,

    tg_enable: false,
    tg_bot_token: '',
    tg_chat_id: '',
};

export function buildConfigSchema(_ctx: NapCatPluginContext): PluginConfigSchema {
    return [
        {
            key: 'enabled',
            label: '插件总开关',
            type: 'boolean',
            default: true,
            description: '开启或关闭域名授权管理插件',
        },
        {
            key: 'admin_qqs',
            label: '管理员 QQ',
            type: 'string',
            default: '2322796106',
            description: '拥有全部后台特权操作权限的 QQ 号，多个请用英文逗号分隔',
        },
        {
            key: 'api_url',
            label: 'Nathan 授权系统域名',
            type: 'string',
            default: 'https://auth.example.com',
            description: '授权站点访问根地址，无需末尾斜杠',
        },
        {
            key: 'web_key',
            label: '网站安全密钥 (webkey)',
            type: 'string',
            default: 'Nathan_Auth',
            description: '授权系统后台配置的通讯安全密钥',
        },
        {
            key: 'admin_name',
            label: '管理员账号',
            type: 'string',
            default: 'admin',
            description: '用于管理员添加授权的账户',
        },
        {
            key: 'admin_password',
            label: '管理员密码',
            type: 'string',
            default: '',
            description: '用于管理员添加授权的密码',
        },
        {
            key: 'default_appid',
            label: '默认应用 ID (appid)',
            type: 'string',
            default: '1',
            description: '不指定应用时的默认授权应用 ID',
        },
        {
            key: 'allow_user_activate',
            label: '允许普通用户授权码激活',
            type: 'boolean',
            default: true,
            description: '开启后群成员可通过 #激活授权 授权码 域名 激活',
        },
        {
            key: 'allow_user_query',
            label: '允许普通用户查授权',
            type: 'boolean',
            default: true,
            description: '开启后群成员可通过 #查授权 域名 查询状态',
        },
        {
            key: 'allow_user_replace',
            label: '允许用户自助换绑',
            type: 'boolean',
            default: true,
            description: '开启后允许原授权 QQ 提交 #换绑授权',
        },
        {
            key: 'allowed_groups',
            label: '允许响应群号',
            type: 'string',
            default: '',
            description: '留空表示全部群聊及私聊均可响应，多个群号用英文逗号隔开',
        },
    ];
}
