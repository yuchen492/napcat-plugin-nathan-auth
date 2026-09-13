import { useState, useEffect } from 'react'
import type { PluginConfig } from '../types'
import { showToast } from '../hooks/useToast'
import { noAuthFetch } from '../utils/api'

interface SettingsPageProps {
    onRefresh: () => void
}

export default function SettingsPage({ onRefresh }: SettingsPageProps) {
    const [config, setConfig] = useState<PluginConfig | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        noAuthFetch<PluginConfig>('/config')
            .then(res => {
                if (res.code === 0 && res.data) {
                    setConfig(res.data)
                }
            })
            .catch(() => showToast('获取配置失败', 'error'))
    }, [])

    const handleSave = async () => {
        if (!config) return
        setSaving(true)
        try {
            const res = await noAuthFetch<any>('/config', {
                method: 'POST',
                body: JSON.stringify(config),
            })
            if (res.code === 0) {
                showToast('配置保存成功！', 'success')
                onRefresh()
            } else {
                showToast(res.message || '保存配置失败', 'error')
            }
        } catch (e: any) {
            showToast(e.message || '保存配置网络异常', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (!config) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">加载配置中...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in-up max-w-4xl">
            {/* 基本运行与交互设置 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">基本交互设置</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">启用插件功能</div>
                            <div className="text-xs text-gray-400">开启或关闭授权管理助手的所有指令响应</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                            className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">响应自身上报消息 (report_self_message)</div>
                            <div className="text-xs text-gray-400">允许当前机器人账号（如手机登录）自己发送的指令并获得处理响应</div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.report_self_message}
                            onChange={e => setConfig({ ...config, report_self_message: e.target.checked })}
                            className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                        />
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                            指令唤醒前缀
                        </label>
                        <input
                            type="text"
                            value={config.command_prefix}
                            onChange={e => setConfig({ ...config, command_prefix: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            placeholder="如 #、/ 或留空"
                        />
                    </div>
                </div>
            </div>

            {/* Nathan 授权系统通讯设置 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Nathan 授权系统对接参数</h3>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">授权系统根地址 (api_url)</label>
                        <input
                            type="text"
                            value={config.api_url}
                            onChange={e => setConfig({ ...config, api_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                            placeholder="https://auth.yunbai.icu"
                        />
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">通讯安全密钥 (web_key)</label>
                        <input
                            type="text"
                            value={config.web_key || ''}
                            onChange={e => setConfig({ ...config, web_key: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                            placeholder="网站安全密钥"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">默认项目 ID (default_appid)</label>
                            <input
                                type="text"
                                value={config.default_appid}
                                onChange={e => setConfig({ ...config, default_appid: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                                placeholder="1"
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">管理员账号 (admin_name)</label>
                            <input
                                type="text"
                                value={config.admin_name || ''}
                                onChange={e => setConfig({ ...config, admin_name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">管理员 QQ 列表 (英文逗号分隔)</label>
                        <input
                            type="text"
                            value={config.admin_qqs}
                            onChange={e => setConfig({ ...config, admin_qqs: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                            placeholder="2567138148,2171129194"
                        />
                    </div>
                </div>
            </div>

            {/* 用户权限开关 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">普通用户功能开放设置</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">允许普通用户使用授权码激活 (#激活授权)</span>
                        <input
                            type="checkbox"
                            checked={config.allow_user_activate}
                            onChange={e => setConfig({ ...config, allow_user_activate: e.target.checked })}
                            className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-700 dark:text-gray-300">允许普通用户查授权 (#查授权)</span>
                        <input
                            type="checkbox"
                            checked={config.allow_user_query}
                            onChange={e => setConfig({ ...config, allow_user_query: e.target.checked })}
                            className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-700 dark:text-gray-300">允许普通用户自助换绑授权 (#换绑授权)</span>
                        <input
                            type="checkbox"
                            checked={config.allow_user_replace}
                            onChange={e => setConfig({ ...config, allow_user_replace: e.target.checked })}
                            className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* 底部保存按钮 */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                    {saving ? '正在保存...' : '保存插件配置'}
                </button>
            </div>
        </div>
    )
}
