import { useState } from 'react'
import { showToast } from '../hooks/useToast'
import { noAuthFetch } from '../utils/api'

interface CardsPageProps {
    onRefresh: () => void
}

export default function CardsPage({ onRefresh }: CardsPageProps) {
    const [form, setForm] = useState({
        count: 5,
        authdate: 0,
        prefix: 'AUTH',
        appid: '',
        money: 0,
    })
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleCreate = async () => {
        setLoading(true)
        setResult(null)
        try {
            const res = await noAuthFetch<any>('/create-cards', {
                method: 'POST',
                body: JSON.stringify(form),
            })
            if (res.code === 0) {
                setResult(res.data)
                showToast('批量生成授权码完成！', 'success')
                onRefresh()
            } else {
                showToast(res.message || '生成失败', 'error')
            }
        } catch (e: any) {
            showToast(e.message || '请求失败', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyAll = () => {
        if (!result?.cards || result.cards.length === 0) return
        navigator.clipboard.writeText(result.cards.join('\n'))
        showToast('已复制全部授权码到剪贴板！', 'success')
    }

    return (
        <div className="space-y-6 animate-fade-in-up max-w-4xl">
            <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span>🎫</span> 批量生成授权激活码
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">生成数量 (张)</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={form.count}
                            onChange={e => setForm({ ...form, count: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">授权时长 (0 为永久)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.authdate}
                            onChange={e => setForm({ ...form, authdate: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">自定义前缀</label>
                        <input
                            type="text"
                            value={form.prefix}
                            onChange={e => setForm({ ...form, prefix: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="AUTH"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">指定 AppID (可选)</label>
                        <input
                            type="text"
                            value={form.appid}
                            onChange={e => setForm({ ...form, appid: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="留空则使用系统默认"
                        />
                    </div>
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? '正在生成中...' : '立即批量生成'}
                    </button>
                </div>
            </div>

            {/* 生成结果卡片 */}
            {result && (
                <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            生成结果反馈 (共 {result.cards?.length || 0} 张)
                        </div>
                        <button
                            onClick={handleCopyAll}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 transition cursor-pointer"
                        >
                            📋 复制全部授权码
                        </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto font-mono text-xs text-gray-800 dark:text-gray-200 space-y-1.5 select-all">
                        {result.cards && result.cards.map((c: string, i: number) => (
                            <div key={i} className="py-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded px-1">
                                {c}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
