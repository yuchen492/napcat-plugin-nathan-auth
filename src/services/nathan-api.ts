import { pluginState } from '../core/state';

export class NathanApiService {
    /**
     * 发送统一请求
     */
    private static async request<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        const baseUrl = pluginState.config.api_url.replace(/\/+$/, '');
        const url = new URL(`${baseUrl}${endpoint}`);

        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null && v !== '') {
                url.searchParams.append(k, String(v));
            }
        }

        try {
            const res = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 NapCat-Plugin-Nathan-Auth/1.0',
                    'Accept': 'application/json, text/plain, */*',
                },
            });

            const text = await res.text();
            try {
                return JSON.parse(text) as T;
            } catch {
                return { code: -1, msg: text } as any;
            }
        } catch (err: any) {
            pluginState.ctx.logger.error(`请求 Nathan API 失败 [${endpoint}]:`, err);
            return { code: -1, msg: `网络请求失败: ${err.message || err}` } as any;
        }
    }

    /**
     * 1. 授权查询
     */
    public static async queryAuth(url: string, appid?: string) {
        pluginState.stats.totalQueries++;
        pluginState.stats.lastActiveTime = new Date().toLocaleString();
        return this.request('/api/Index/query_auth', {
            appid: appid || pluginState.config.default_appid,
            url: url.trim(),
        });
    }

    /**
     * 2. 授权码自助授权
     */
    public static async createAuthByCard(params: {
        key: string;
        url: string;
        qq: string;
        ip?: string;
        email?: string;
        phone?: string;
        appid?: string;
    }) {
        pluginState.stats.totalActivates++;
        pluginState.stats.lastActiveTime = new Date().toLocaleString();
        return this.request('/api/Index/create_auth', {
            appid: params.appid || pluginState.config.default_appid,
            key: params.key.trim(),
            url: params.url.trim(),
            qq: params.qq.trim(),
            ip: params.ip || '127.0.0.1',
            email: params.email || `${params.qq}@qq.com`,
            phone: params.phone || '',
        });
    }

    /**
     * 3. 管理员直接添加授权
     */
    public static async adminAddAuth(params: {
        url: string;
        qq: string;
        authdate?: string | number; // 0 为永久，1 为 1 天
        appid?: string;
        ip?: string;
        email?: string;
        phone?: string;
    }) {
        pluginState.stats.totalAdds++;
        pluginState.stats.lastActiveTime = new Date().toLocaleString();
        return this.request('/api/Index/admin_add_auth', {
            appid: params.appid || pluginState.config.default_appid,
            url: params.url.trim(),
            qq: params.qq.trim(),
            authdate: params.authdate !== undefined ? params.authdate : '0',
            adminname: pluginState.config.admin_name,
            password: pluginState.config.admin_password,
            ip: params.ip || '127.0.0.1',
            email: params.email || `${params.qq}@qq.com`,
            phone: params.phone || '',
        });
    }

    /**
     * 4. 批量生成授权码
     */
    public static async createCards(params: {
        count: number;
        authdate?: number; // 0 为永久，单位天
        money?: number;
        prefix?: string;
        appid?: string;
    }) {
        pluginState.stats.totalCardsCreated += params.count;
        pluginState.stats.lastActiveTime = new Date().toLocaleString();
        return this.request('/api/index/createCard', {
            webkey: pluginState.config.web_key,
            CardAct: 2,
            count: params.count || 1,
            appid: params.appid || pluginState.config.default_appid,
            authdate: params.authdate !== undefined ? params.authdate : 0,
            money: params.money || 0,
            prefix: params.prefix || 'AUTH',
        });
    }

    /**
     * 5. 封禁授权
     */
    public static async freezeAuth(url: string, reason: string = '违规拉黑', appid?: string) {
        return this.request('/api/Index/freeze_auth', {
            appid: appid || pluginState.config.default_appid,
            url: url.trim(),
            reason: reason.trim(),
            webkey: pluginState.config.web_key,
        });
    }

    /**
     * 6. 解封授权
     */
    public static async unsealAuth(url: string, appid?: string) {
        return this.request('/api/Index/unseal_auth', {
            appid: appid || pluginState.config.default_appid,
            url: url.trim(),
            webkey: pluginState.config.web_key,
        });
    }

    /**
     * 7. 删除授权
     */
    public static async deleteAuth(url: string, appid?: string) {
        return this.request('/api/Index/del_auth', {
            appid: appid || pluginState.config.default_appid,
            url: url.trim(),
            webkey: pluginState.config.web_key,
        });
    }

    /**
     * 8. 更改授权 (换绑)
     */
    public static async replaceAuth(params: {
        url: string;
        new_url: string;
        qq: string;
        appid?: string;
        phone?: string;
        email?: string;
        ip?: string;
    }) {
        return this.request('/api/Index/replace_auth', {
            appid: params.appid || pluginState.config.default_appid,
            webkey: pluginState.config.web_key,
            qq: params.qq.trim(),
            url: params.url.trim(),
            new_url: params.new_url.trim(),
            phone: params.phone || '',
            email: params.email || `${params.qq}@qq.com`,
            ip: params.ip || '127.0.0.1',
        });
    }

    /**
     * 9. 获取应用列表
     */
    public static async getAppList() {
        return this.request('/api/Index/applist', {
            webkey: pluginState.config.web_key,
        });
    }

    /**
     * 10. 获取授权站公告
     */
    public static async getNotice() {
        return this.request('/api/Index/auth_notice', {
            webkey: pluginState.config.web_key,
        });
    }
}
