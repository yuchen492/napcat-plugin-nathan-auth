/**
 * NapCat 插件 - Nathan 域名授权管理系统
 */

import type {
    PluginModule,
    PluginConfigSchema,
    NapCatPluginContext,
} from 'napcat-types/napcat-onebot/network/plugin/types';
import { EventType } from 'napcat-types/napcat-onebot/event/index';
import path from 'path';
import fs from 'fs';

import { buildConfigSchema } from './config';
import { pluginState } from './core/state';
import { handleMessage } from './handlers/message-handler';
import { registerApiRoutes } from './services/api-service';

export let plugin_config_ui: PluginConfigSchema = [];

export const plugin_init: PluginModule['plugin_init'] = async (ctx) => {
    try {
        pluginState.init(ctx);
        ctx.logger.info('🐾 Nathan 域名授权插件初始化中...');

        plugin_config_ui = buildConfigSchema(ctx);

        // 注册 WebUI
        registerWebUI(ctx);

        // 注册 API 路由
        registerApiRoutes(ctx);

        ctx.logger.info('✅ Nathan 域名授权插件加载完成！');
    } catch (error) {
        ctx.logger.error('插件初始化失败:', error);
    }
};

export const plugin_onmessage: PluginModule['plugin_onmessage'] = async (ctx, event) => {
    if (event.post_type !== EventType.MESSAGE) return;
    if (!pluginState.config.enabled) return;
    await handleMessage(ctx, event);
};

export const plugin_onevent: PluginModule['plugin_onevent'] = async (ctx, event) => {
    // 捕获 Bot 自身发送的消息 (message_sent 事件)
    if ((event as any).post_type === 'message_sent') {
        if (!pluginState.config.enabled) return;
        if (pluginState.config.report_self_message) {
            pluginState.stats.totalSelfMessages = (pluginState.stats.totalSelfMessages || 0) + 1;
            await handleMessage(ctx, event);
        }
    }
};

export const plugin_cleanup: PluginModule['plugin_cleanup'] = async (ctx) => {
    try {
        ctx.logger.info('🛑 Nathan 域名授权插件已卸载');
    } catch (e) {
        ctx.logger.warn('插件卸载时出错:', e);
    }
};

// ==================== 配置管理钩子 (支持NapCat插件管理面板) ====================

export const plugin_get_config: PluginModule['plugin_get_config'] = async (_ctx) => {
    return pluginState.config;
};

export const plugin_set_config: PluginModule['plugin_set_config'] = async (ctx, config) => {
    pluginState.replaceConfig(config as any);
    ctx.logger.info('⚙️ 配置已通过 NapCat 插件管理更新');
};

export const plugin_on_config_change: PluginModule['plugin_on_config_change'] = async (
    ctx, _ui, key, value, _currentConfig
) => {
    try {
        pluginState.updateConfig({ [key]: value });
        ctx.logger.info(`⚙️ 配置项 ${key} 已更新`);
    } catch (err) {
        ctx.logger.error(`更新配置项 ${key} 失败:`, err);
    }
};

/**
 * 注册 WebUI
 */
function registerWebUI(ctx: NapCatPluginContext): void {
    try {
        const webuiDist = path.resolve(ctx.pluginPath, 'webui');
        const router = ctx.router;

        // 1. 托管前端静态资源
        router.static('/webui', 'webui');
        router.static('/static', 'webui');

        // 2. 注册到 NapCat 扩展页面 (在 WebUI 顶部/侧边栏「插件扩展页面」Tab展示)
        router.page({
            path: 'auth',
            title: '域名授权管理',
            icon: '🐾',
            htmlFile: 'webui/index.html',
            description: 'Nathan 域名授权管理系统 Web 控制台',
        });

        // 兼容原独立访问根路由
        if (fs.existsSync(webuiDist)) {
            router.getNoAuth('/', (_req, res) => {
                res.sendFile(path.join(webuiDist, 'index.html'));
            });
            ctx.logger.info(`WebUI 静态资源已挂载: ${webuiDist}`);
        } else {
            router.getNoAuth('/', (_req, res) => {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send('<h3>WebUI 未构建，请执行 npm run build:webui</h3>');
            });
        }
    } catch (error) {
        ctx.logger.error('注册 WebUI 失败:', error);
    }
}
