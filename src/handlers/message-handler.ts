import type { NapCatPluginContext, OB11Message } from 'napcat-types/napcat-onebot/network/plugin/types';
import { pluginState } from '../core/state';
import { NathanApiService } from '../services/nathan-api';

export async function handleMessage(ctx: NapCatPluginContext, event: OB11Message): Promise<void> {
    const rawMsg = event.raw_message?.trim() || '';
    const prefix = pluginState.config.command_prefix !== undefined ? pluginState.config.command_prefix : '#';
    if (prefix && !rawMsg.startsWith(prefix)) return;

    const userId = event.user_id;
    const groupId = event.group_id;

    // 群聊过滤
    if (groupId && !pluginState.isGroupAllowed(groupId)) {
        return;
    }

    const isAdmin = pluginState.isAdmin(userId);
    const content = prefix ? rawMsg.slice(prefix.length).trim() : rawMsg.trim();
    const args = content.split(/\s+/);
    const command = args[0]?.toLowerCase();

    // 辅助回复函数
    const reply = async (text: string) => {
        try {
            if (groupId) {
                await ctx.actions.call('send_group_msg', { group_id: groupId, message: text }, ctx.adapterName);
            } else {
                await ctx.actions.call('send_private_msg', { user_id: userId, message: text }, ctx.adapterName);
            }
        } catch (e) {
            ctx.logger.error('回复消息失败:', e);
        }
    };

    const p = prefix || '';

    switch (command) {
        // ================= 普通用户指令 =================
        case '授权帮助':
        case 'authhelp': {
            let help = `🐾 【Nathan 域名授权管理助手】\n` +
                `------------------------\n` +
                `${p}查授权 [域名] - 查询域名是否正版授权\n` +
                `${p}激活授权 [授权码] [域名] - 自助核销授权码绑定授权\n` +
                `${p}换绑授权 [旧域名] [新域名] - 自助更换授权域名\n`;

            if (isAdmin) {
                help += `\n👑 【管理员后台特权指令】\n` +
                    `${p}开通授权 [域名] [QQ] [天数/0为永久] [应用ID可选]\n` +
                    `${p}生成授权码 [数量] [天数/0为永久] [应用ID可选]\n` +
                    `${p}封禁授权 [域名] [原因可选]\n` +
                    `${p}解封授权 [域名]\n` +
                    `${p}删除授权 [域名]\n` +
                    `${p}应用列表 - 查看所有授权项目\n` +
                    `${p}授权公告 - 查看系统最新公告`;
            }
            await reply(help);
            break;
        }

        case '查授权': {
            if (!pluginState.config.allow_user_query && !isAdmin) {
                await reply('❌ 当前管理员未开放普通用户查授权功能。');
                return;
            }
            const domain = args[1];
            if (!domain) {
                await reply(`💡 格式：${p}查授权 [域名]\n例如：${p}查授权 example.com`);
                return;
            }
            const res = await NathanApiService.queryAuth(domain);
            if (String(res.code) === '1') {
                await reply(`✅ 【正版授权】\n域名: ${domain}\n状态: 授权有效\n详情: ${res.msg || '正版授权'}`);
            } else {
                await reply(`⚠️ 【授权未通过】\n域名: ${domain}\n提示: ${res.msg || '未查询到有效授权记录'}`);
            }
            break;
        }

        case '激活授权': {
            if (!pluginState.config.allow_user_activate && !isAdmin) {
                await reply('❌ 当前管理员未开放普通用户自助授权码激活。');
                return;
            }
            const key = args[1];
            const domain = args[2];
            if (!key || !domain) {
                await reply(`💡 格式：${p}激活授权 [授权码] [域名]\n例如：${p}激活授权 AUTH-XXXXX test.com`);
                return;
            }
            const res = await NathanApiService.createAuthByCard({
                key,
                url: domain,
                qq: String(userId),
            });
            if (String(res.code) === '1') {
                await reply(`🎉 激活成功！\n域名：${domain}\n绑定 QQ：${userId}\n反馈：${res.msg}`);
            } else {
                await reply(`❌ 激活失败：${res.msg || '授权码无效或已被使用'}`);
            }
            break;
        }

        case '换绑授权': {
            if (!pluginState.config.allow_user_replace && !isAdmin) {
                await reply('❌ 当前管理员未开放自助换绑授权。');
                return;
            }
            const oldDomain = args[1];
            const newDomain = args[2];
            if (!oldDomain || !newDomain) {
                await reply('💡 格式：#换绑授权 [旧域名] [新域名]\n例如：#换绑授权 old.com new.com');
                return;
            }
            const res = await NathanApiService.replaceAuth({
                url: oldDomain,
                new_url: newDomain,
                qq: String(userId),
            });
            if (String(res.code) === '1') {
                await reply(`✅ 换绑成功！\n原域名：${oldDomain}\n新域名：${newDomain}`);
            } else {
                await reply(`❌ 换绑失败：${res.msg || '信息不匹配或无权操作'}`);
            }
            break;
        }

        // ================= 管理员特权指令 =================
        case '开通授权':
        case '添加授权': {
            if (!isAdmin) {
                await reply('⛔ 无权执行此操作，该指令仅限系统管理员。');
                return;
            }
            const domain = args[1];
            const targetQQ = args[2] || String(userId);
            const days = args[3] !== undefined ? args[3] : '0';
            const appid = args[4];

            if (!domain) {
                await reply('💡 格式：#开通授权 [域名] [QQ] [天数/0为永久] [应用ID]\n例如：#开通授权 test.com 10001 0 1');
                return;
            }

            const res = await NathanApiService.adminAddAuth({
                url: domain,
                qq: targetQQ,
                authdate: days,
                appid,
            });

            if (String(res.code) === '1') {
                await reply(`🎉 授权添加成功！\n域名：${domain}\n站长 QQ：${targetQQ}\n有效时长：${days === '0' ? '永久' : `${days}天`}`);
            } else {
                await reply(`❌ 开通失败：${res.msg || '接口返回错误'}`);
            }
            break;
        }

        case '生成授权码':
        case '生成激活码': {
            if (!isAdmin) {
                await reply('⛔ 无权执行此操作，该指令仅限系统管理员。');
                return;
            }
            const count = parseInt(args[1] || '1', 10);
            const days = parseInt(args[2] || '0', 10);
            const appid = args[3];

            if (isNaN(count) || count < 1 || count > 50) {
                await reply('💡 格式：#生成授权码 [数量1-50] [天数/0为永久] [应用ID]\n例如：#生成授权码 5 0 1');
                return;
            }

            const res = await NathanApiService.createCards({
                count,
                authdate: days,
                appid,
            });

            if (String(res.code) === '1' || (res.data && Array.isArray(res.data))) {
                const cards = Array.isArray(res.data) ? res.data : [res.msg || '生成完成'];
                let text = `📦 已成功生成 ${count} 张授权码 (${days === 0 ? '永久' : `${days}天`})：\n`;
                text += cards.map((c: any) => (typeof c === 'string' ? c : c.card || JSON.stringify(c))).join('\n');
                await reply(text);
            } else {
                await reply(`❌ 生成激活码失败：${res.msg || '请检查网站安全密钥是否正确'}`);
            }
            break;
        }

        case '封禁授权':
        case '拉黑域名': {
            if (!isAdmin) {
                await reply('⛔ 无权执行此操作，该指令仅限系统管理员。');
                return;
            }
            const domain = args[1];
            const reason = args[2] || '违规倒卖/违规使用';
            if (!domain) {
                await reply('💡 格式：#封禁授权 [域名] [原因]');
                return;
            }
            const res = await NathanApiService.freezeAuth(domain, reason);
            if (String(res.code) === '1') {
                await reply(`🔒 授权已封禁！\n域名：${domain}\n原因：${reason}`);
            } else {
                await reply(`❌ 封禁失败：${res.msg || '操作失败'}`);
            }
            break;
        }

        case '解封授权': {
            if (!isAdmin) {
                await reply('⛔ 无权执行此操作，该指令仅限系统管理员。');
                return;
            }
            const domain = args[1];
            if (!domain) {
                await reply('💡 格式：#解封授权 [域名]');
                return;
            }
            const res = await NathanApiService.unsealAuth(domain);
            if (String(res.code) === '1') {
                await reply(`🔓 授权已解除封禁：${domain}`);
            } else {
                await reply(`❌ 解封失败：${res.msg || '操作失败'}`);
            }
            break;
        }

        case '删除授权': {
            if (!isAdmin) {
                await reply('⛔ 无权执行此操作，该指令仅限系统管理员。');
                return;
            }
            const domain = args[1];
            if (!domain) {
                await reply('💡 格式：#删除授权 [域名]');
                return;
            }
            const res = await NathanApiService.deleteAuth(domain);
            if (String(res.code) === '1') {
                await reply(`🗑️ 授权已永久删除：${domain}`);
            } else {
                await reply(`❌ 删除失败：${res.msg || '操作失败'}`);
            }
            break;
        }

        case '应用列表': {
            if (!isAdmin) {
                await reply('⛔ 无权执行此操作，该指令仅限系统管理员。');
                return;
            }
            const res = await NathanApiService.getAppList();
            if (Array.isArray(res)) {
                let msg = `📱 【Nathan 授权应用列表】(共 ${res.length} 个)\n`;
                for (const app of res) {
                    msg += `\nID: [${app.id}] ${app.app_name}\n团队: ${app.app_team || '无'} | 单价: ¥${app.app_auth_money || '0'}`;
                }
                await reply(msg);
            } else {
                await reply(`❌ 获取失败：${res.msg || '网络或安全密钥错误'}`);
            }
            break;
        }

        case '授权公告': {
            const res = await NathanApiService.getNotice();
            await reply(`📢 【授权站公告】\n${res.msg || res.data || '暂无公告内容'}`);
            break;
        }
    }
}
