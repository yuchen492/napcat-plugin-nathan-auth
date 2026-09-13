import { useState } from 'react'
import { showToast } from '../hooks/useToast'
import { noAuthFetch } from '../utils/api'

interface ManagePageProps {
    onRefresh: () => void
}

export default function ManagePage({ onRefresh }: ManagePageProps) {
    // 查询
    const [queryDomain, setQueryDomain] = useState('')
    const [queryAppid, setQueryAppid] = useState('')
    const [queryResult, setQueryResult] = useState<any>(null)
    const [queryLoading, setQueryLoading] = useState(false)

    // 添加授权
    const [addForm, setAddForm] = useState({
        url: '',
        qq: '',
        authdate: '0',
        appid: '',
        ip: '',
        email: '',
    })
    const [addLoading, setAddLoading] = useState(false)
    const [addResult, setAddResult] = useState<any>(null)

    // 封禁 / 解封 / 删除
    const [actionDomain, setActionDomain] = useState('')
    const [freezeReason, setFreezeReason] = useState('违规使用/倒卖')
    const [actionLoading, setActionLoading] = useState(false)

    // 查询授权
    const handleQuery = async () => {
        if (!queryDomain.trim()) {
            showToast('请输入要查询的域名', 'warning')
            return
        }
        setQueryLoading(true)
        setQueryResult(null)
        try {
            const res = await noAuthFetch<any>(`/query-auth?url=${encodeURIComponent(queryDomain.trim())}&appid=${queryAppid.trim()}`)
            setQueryResult(res.data)
            if (String(res.data?.code) === '1') {
                showToast('正版授权有效', 'success')
            } else {
                showToast(res.data?.msg || '未查询到授权', 'warning')
            }
        } catch (e: any) {
            showToast(e.message || '查询请求失败', 'error')
        } finally {
            setQueryLoading(false)
        }
    }

    // 手动开通
    const handleAdd = async () => {
        if (!addForm.url.trim() || !addForm.qq.trim()) {
            showToast('请填写域名与站长QQ', 'warning')
            return
        }
        setAddLoading(true)
        setAddResult(null)
        try {
            const res = await noAuthFetch<any>('/add-auth', {
                method: 'POST',
                body: JSON.stringify(addForm),
            })
            setAddResult(res.data)
            if (String(res.data?.code) === '1') {
                showToast('开通授权成功！', 'success')
                onRefresh()
            } else {
                showToast(res.data?.msg || '开通失败', 'error')
            }
        } catch (e: any) {
            showToast(e.message || '网络请求失败', 'error')
        } finally {
            setAddLoading(false)
        }
    }

    // 快捷管理
    const handleAction = async (action: 'freeze' | 'unseal' | 'delete') => {
        if (!actionDomain.trim()) {
            showToast('请输入操作目标域名', 'warning')
            return
        }
        setActionLoading(true)
        try {
            const pathMap = {
                freeze: '/freeze-auth',
                unseal: '/unseal-auth',
                delete: '/delete-auth',
            }
            const payload: any = { url: actionDomain.trim() }
            if (action === 'freeze') payload.reason = freezeReason

            const res = await noAuthFetch<any>(pathMap[action], {
                method: 'POST',
                body: JSON.stringify(payload),
            })
            if (String(res.data?.code) === '1') {
                showToast(`操作成功: ${res.data?.msg || '完成'}`, 'success')
                onRefresh()
            } else {
                showToast(res.data?.msg || '操作失败', 'error')
            }
        } catch (e: any) {
            showToast(e.message || '请求失败', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in-up max-w-5xl">
            {/* 1. 在线查询授权 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span>🔍</span> 在线查询域名授权
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">域名 / 站点地址</label>
                        <input
                            type="text"
                            placeholder="例如：example.com"
                            value={queryDomain}
                            onChange={e => setQueryDomain(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">项目 AppID (可选)</label>
                        <input
                            type="text"
                            placeholder="留空使用默认项目"
                            value={queryAppid}
                            onChange={e => setQueryAppid(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleQuery}
                        disabled={queryLoading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        {queryLoading ? '正在查询...' : '立即查询授权'}
                    </button>
                </div>

                {queryResult && (
                    <div className="mt-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-sm space-y-1 font-mono">
                        <div className="flex items-center gap-2 font-sans font-bold">
                            <span>状态：</span>
                            <span className={String(queryResult.code) === '1' ? 'text-emerald-500' : 'text-amber-500'}>
                                {String(queryResult.code) === '1' ? '正版授权有效' : '未授权或异常'}
                            </span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">反馈：{queryResult.msg || JSON.stringify(queryResult)}</div>
                        {queryResult.data && (
                            <pre className="text-xs text-gray-500 mt-2 p-2 bg-black/5 dark:bg-black/20 rounded overflow-x-auto">
                                {JSON.stringify(queryResult.data, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>

            {/* 2. 快速开通新授权 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span>➕</span> 管理员手动开通授权
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">授权域名 *</label>
                        <input
                            type="text"
                            placeholder="如：auth.example.com"
                            value={addForm.url}
                            onChange={e => setAddForm({ ...addForm, url: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">站长 QQ *</label>
                        <input
                            type="text"
                            placeholder="如：2567138148"
                            value={addForm.qq}
                            onChange={e => setAddForm({ ...addForm, qq: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">授权天数 (0 为永久)</label>
                        <input
                            type="text"
                            placeholder="0 为永久，如 30、365"
                            value={addForm.authdate}
                            onChange={e => setAddForm({ ...addForm, authdate: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">指定 AppID (可选)</label>
                        <input
                            type="text"
                            placeholder="留空则使用默认 AppID"
                            value={addForm.appid}
                            onChange={e => setAddForm({ ...addForm, appid: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleAdd}
                        disabled={addLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        {addLoading ? '正在开通...' : '立即添加开通'}
                    </button>
                </div>
                {addResult && (
                    <div className="mt-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-sm font-mono text-gray-700 dark:text-gray-300">
                        反馈：{addResult.msg || JSON.stringify(addResult)}
                    </div>
                )}
            </div>

            {/* 3. 封禁 / 解封 / 删除 */}
            <div className="bg-white dark:bg-[#25262B] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span>⚡</span> 授权快捷运维 (封禁 / 解封 / 删除)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">目标域名 *</label>
                        <input
                            type="text"
                            placeholder="请输入待操作的域名"
                            value={actionDomain}
                            onChange={e => setActionDomain(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">封禁原因 (仅封禁时有效)</label>
                        <input
                            type="text"
                            value={freezeReason}
                            onChange={e => setFreezeReason(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mt-5 flex gap-3 justify-end">
                    <button
                        onClick={() => handleAction('freeze')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        🚫 封禁授权
                    </button>
                    <button
                        onClick={() => handleAction('unseal')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        🔓 解封授权
                    </button>
                    <button
                        onClick={() => handleAction('delete')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        🗑️ 删除授权
                    </button>
                </div>
            </div>
        </div>
    )
}
