import fs from 'fs';
import path from 'path';
import type { NapCatPluginContext } from 'napcat-types/napcat-onebot/network/plugin/types';
import { defaultConfig } from '../config';
import type { PluginConfig } from '../types';

export class PluginState {
    private static instance: PluginState;
    public ctx!: NapCatPluginContext;
    public config: PluginConfig = { ...defaultConfig };
    private configPath = '';
    public startTime = Date.now();
    public onConfigChange?: () => void;

    // 运行统计
    public stats = {
        totalQueries: 0,
        totalActivates: 0,
        totalAdds: 0,
        totalCardsCreated: 0,
        lastActiveTime: '',
    };

    private constructor() {}

    public static getInstance(): PluginState {
        if (!PluginState.instance) {
            PluginState.instance = new PluginState();
        }
        return PluginState.instance;
    }

    public init(ctx: NapCatPluginContext): void {
        this.ctx = ctx;
        this.configPath = path.join(ctx.dataPath, 'config.json');
        this.loadConfig();
    }

    public loadConfig(): void {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf-8');
                const saved = JSON.parse(data);
                this.config = { ...defaultConfig, ...saved };
                this.ctx.logger.info('已加载插件配置文件');
            } else {
                this.config = { ...defaultConfig };
                this.saveConfig();
            }
        } catch (e) {
            this.ctx.logger.error('加载配置文件失败，使用默认配置:', e);
            this.config = { ...defaultConfig };
        }
    }

    public saveConfig(): void {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
            this.ctx.logger.info('插件配置文件已保存');
            if (this.onConfigChange) {
                this.onConfigChange();
            }
        } catch (e) {
            this.ctx.logger.error('保存配置文件失败:', e);
        }
    }

    public updateConfig(newConfig: Partial<PluginConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }

    public isAdmin(userId: string | number): boolean {
        const uid = String(userId).trim();
        const admins = this.config.admin_qqs
            .split(/[,，|]/)
            .map((s) => s.trim())
            .filter(Boolean);
        return admins.includes(uid);
    }

    public isGroupAllowed(groupId?: string | number): boolean {
        if (!groupId) return true; // 私聊默认允许
        const gid = String(groupId).trim();
        const allowed = this.config.allowed_groups
            .split(/[,，|]/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (allowed.length === 0) return true;
        return allowed.includes(gid);
    }

    public getUptimeFormatted(): string {
        const diff = Math.floor((Date.now() - this.startTime) / 1000);
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        return `${days}天 ${hours}小时 ${minutes}分 ${seconds}秒`;
    }
}

export const pluginState = PluginState.getInstance();
