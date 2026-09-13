import type { NapCatPluginContext } from 'napcat-types/napcat-onebot/network/plugin/types';
import { pluginState } from '../core/state';
import { NathanApiService } from './nathan-api';
import type { PluginConfig } from '../types';

export function registerApiRoutes(ctx: NapCatPluginContext): void {
    const router = ctx.router;

    /** 获取系统运行状态与统计 */
    router.getNoAuth('/status', (_req, res) => {
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
                    report_self_message: pluginState.config.report_self_message,
                },
            },
        });
    });

    /** 获取完整配置 */
    router.getNoAuth('/config', (_req, res) => {
        res.json({ code: 0, data: pluginState.config });
    });

    /** 保存配置 */
    router.postNoAuth('/config', (req, res) => {
        try {
            const body = req.body as Partial<PluginConfig> | undefined;
            if (!body) {
                return res.status(400).json({ code: -1, message: '请求体为空' });
            }
            pluginState.updateConfig(body);
            ctx.logger.info('配置已通过 WebUI API 更新');
            res.json({ code: 0, message: '配置已成功保存！' });
        } catch (e: any) {
            res.status(500).json({ code: -1, message: e.message || String(e) });
        }
    });

    /** WebUI: 在线查询域名授权 */
    router.getNoAuth('/query-auth', async (req, res) => {
        const domain = req.query.url as string;
        const appid = req.query.appid as string;
        if (!domain) {
            return res.status(400).json({ code: -1, message: '请输入要查询的域名' });
        }
        const result = await NathanApiService.queryAuth(domain, appid);
        res.json({ code: 0, data: result });
    });

    /** WebUI: 在线添加授权 */
    router.postNoAuth('/add-auth', async (req, res) => {
        const body = req.body as any;
        if (!body || !body.url || !body.qq) {
            return res.status(400).json({ code: -1, message: '域名与站长QQ为必填项' });
        }
        const result = await NathanApiService.adminAddAuth({
            url: body.url,
            qq: body.qq,
            authdate: body.authdate !== undefined ? body.authdate : '0',
            appid: body.appid,
            ip: body.ip,
            email: body.email,
            phone: body.phone,
        });
        res.json({ code: 0, data: result });
    });

    /** WebUI: 批量生成授权码 */
    router.postNoAuth('/create-cards', async (req, res) => {
        const body = req.body as any;
        const count = parseInt(body?.count || '1', 10);
        const authdate = parseInt(body?.authdate || '0', 10);
        const prefix = body?.prefix || 'AUTH';
        const appid = body?.appid;
        const money = parseFloat(body?.money || '0');

        const result = await NathanApiService.createCards({
            count,
            authdate,
            prefix,
            appid,
            money,
        });
        res.json({ code: 0, data: result });
    });

    /** WebUI: 封禁授权 */
    router.postNoAuth('/freeze-auth', async (req, res) => {
        const { url, reason, appid } = req.body || {};
        if (!url) return res.status(400).json({ code: -1, message: '域名为必填项' });
        const result = await NathanApiService.freezeAuth(url, reason, appid);
        res.json({ code: 0, data: result });
    });

    /** WebUI: 解封授权 */
    router.postNoAuth('/unseal-auth', async (req, res) => {
        const { url, appid } = req.body || {};
        if (!url) return res.status(400).json({ code: -1, message: '域名为必填项' });
        const result = await NathanApiService.unsealAuth(url, appid);
        res.json({ code: 0, data: result });
    });

    /** WebUI: 删除授权 */
    router.postNoAuth('/delete-auth', async (req, res) => {
        const { url, appid } = req.body || {};
        if (!url) return res.status(400).json({ code: -1, message: '域名为必填项' });
        const result = await NathanApiService.deleteAuth(url, appid);
        res.json({ code: 0, data: result });
    });

    /** WebUI: 获取所有授权项目列表 */
    router.getNoAuth('/apps', async (_req, res) => {
        const result = await NathanApiService.getAppList();
        res.json({ code: 0, data: result });
    });
}
