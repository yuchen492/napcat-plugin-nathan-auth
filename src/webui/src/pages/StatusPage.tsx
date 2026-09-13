import type { PluginStatus } from '../types'
import { IconRefresh } from '../components/icons'

interface StatusPageProps {
    status: PluginStatus | null
    onRefresh: () => void
}

export default function StatusPage({ status, onRefresh }: StatusPageProps) {
    if (!status) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400 dark:text-gray-500">正在采集授权系统运行状态...</div>
            </div>
        )
    }

    const s = status.stats || {
        totalQueries: 0,
        totalActivates: 0,
        totalAdds: 0,
        totalCardsCreated: 0,
        totalSelfMessages: 0,
        lastActiveTime: '',
    }

    const cards = [
        { label: '总查询次数', value: `${s.totalQueries} 次`, sub: '包含群聊与私聊指令', icon: '🔍' },
        { label: '自助授权码激活', value: `${s.totalActivates} 次`, sub: '用户自助兑换核销', icon: '🎫' },
        { label: '管理员手动开通', value: `${s.totalAdds} 个`, sub: '面板/指令添加授权', icon: '🛡️' },
        { label: '批量生成授权码', value: `${s.totalCardsCreated} 张`, sub: '已生成激活码总计', icon: '📦' },
    ]

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* 顶栏操作区 */}
            <div className="flex justify-between items-center bg-white dark:bg-[#25262B] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    授权系统地址：<span className="font-semibold text-gray-900 dark:text-white font-mono">{status.config?.api_url || '未配置'}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    默认项目ID：<code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-xs">{status.config?.default_appid || '1'}</code>
                </div>
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer"
                >
                    <IconRefresh size={14} />
                    <span>刷新状态</span>
                </button>
            </div>

            {/* 统计指标卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white dark:bg-[#25262B] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{card.icon}</span>
                            <span className="text-xs text-gray-400">{card.sub}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.value}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* 运行参数与信息 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">机器人服务与运行参数</h2>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium">
                        {status.pluginName}
                    </span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">持续运行时间</span>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mt-1">{status.uptime || '0秒'}</div>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">管理员 QQ 列表</span>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mt-1 font-mono">{status.config?.admin_qqs || '未设置'}</div>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">自身消息上报 (report_self_message)</span>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mt-1">
                            {status.config?.report_self_message ? '已开启 (响应自身发送指令)' : '未开启 (仅监听群/私聊)'}
                        </div>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">指令触发前缀</span>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mt-1 font-mono">{status.config?.command_prefix || '无前缀'}</div>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">最近业务活跃时间</span>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mt-1">{s.lastActiveTime || '暂无业务'}</div>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">自身消息处理计数</span>
                        <div className="font-medium text-gray-800 dark:text-gray-200 mt-1">{s.totalSelfMessages} 条</div>
                    </div>
                </div>
            </div>

            {/* 可用指令速查 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">常用机器人指令速查</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg space-y-1.5 text-gray-700 dark:text-gray-300">
                        <div className="font-bold text-blue-600 dark:text-blue-400 font-sans mb-1">【普通用户指令】</div>
                        <div>{status.config?.command_prefix || '#'}查授权 [域名]</div>
                        <div>{status.config?.command_prefix || '#'}激活授权 [授权码] [域名]</div>
                        <div>{status.config?.command_prefix || '#'}换绑授权 [旧域名] [新域名]</div>
                        <div>{status.config?.command_prefix || '#'}授权帮助</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-lg space-y-1.5 text-gray-700 dark:text-gray-300">
                        <div className="font-bold text-purple-600 dark:text-purple-400 font-sans mb-1">【管理员后台特权指令】</div>
                        <div>{status.config?.command_prefix || '#'}开通授权 [域名] [QQ] [天数/0为永久] [应用ID]</div>
                        <div>{status.config?.command_prefix || '#'}生成授权码 [数量] [天数/0为永久] [应用ID]</div>
                        <div>{status.config?.command_prefix || '#'}封禁授权 [域名] [原因]</div>
                        <div>{status.config?.command_prefix || '#'}解封授权 [域名]</div>
                        <div>{status.config?.command_prefix || '#'}删除授权 [域名]</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
