import React, { useState, useEffect } from 'react';

interface PluginStatus {
    pluginName: string;
    uptime: string;
    stats: {
        totalQueries: number;
        totalActivates: number;
        totalAdds: number;
        totalCardsCreated: number;
        lastActiveTime: string;
    };
    config: any;
}

export function App() {
    const [activeTab, setActiveTab] = useState<'status' | 'manage' | 'cards' | 'config'>('status');
    const [status, setStatus] = useState<PluginStatus | null>(null);
    const [config, setConfig] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 查询 / 开通 / 生成激活码 表单状态
    const [queryDomain, setQueryDomain] = useState('');
    const [queryAppid, setQueryAppid] = useState('');
    const [queryResult, setQueryResult] = useState<any>(null);

    const [addForm, setAddForm] = useState({
        url: '',
        qq: '',
        authdate: '0',
        appid: '',
        ip: '',
        email: '',
    });
    const [addResult, setAddResult] = useState<any>(null);

    const [cardForm, setCardForm] = useState({
        count: 5,
        authdate: 0,
        prefix: 'AUTH',
        appid: '',
        money: 0,
    });
    const [cardResult, setCardResult] = useState<any>(null);

    const [actionDomain, setActionDomain] = useState('');
    const [freezeReason, setFreezeReason] = useState('违规使用/倒卖');

    const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch('./api/status');
            const data = await res.json();
            if (data.code === 0) setStatus(data.data);
        } catch (e) {
            console.error('获取状态失败', e);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch('./api/config');
            const data = await res.json();
            if (data.code === 0) setConfig(data.data);
        } catch (e) {
            console.error('获取配置失败', e);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchConfig();
    }, []);

    // 保存配置
    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('./api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (data.code === 0) {
                showMsg('配置保存成功！');
                fetchStatus();
            } else {
                showMsg(data.message || '保存失败', 'error');
            }
        } catch (e: any) {
            showMsg(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 查询授权
    const handleQueryAuth = async () => {
        if (!queryDomain) return showMsg('请输入要查询的域名', 'error');
        setLoading(true);
        setQueryResult(null);
        try {
            const res = await fetch(`./api/query-auth?url=${encodeURIComponent(queryDomain)}&appid=${queryAppid}`);
            const data = await res.json();
            setQueryResult(data.data);
        } catch (e: any) {
            showMsg(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 添加授权
    const handleAddAuth = async () => {
        if (!addForm.url || !addForm.qq) return showMsg('请填写域名与站长QQ', 'error');
        setLoading(true);
        setAddResult(null);
        try {
            const res = await fetch('./api/add-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            });
            const data = await res.json();
            setAddResult(data.data);
            if (String(data.data?.code) === '1') {
                showMsg('开通授权成功！');
                fetchStatus();
            } else {
                showMsg(data.data?.msg || '操作失败', 'error');
            }
        } catch (e: any) {
            showMsg(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 生成授权码
    const handleCreateCards = async () => {
        setLoading(true);
        setCardResult(null);
        try {
            const res = await fetch('./api/create-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cardForm),
            });
            const data = await res.json();
            setCardResult(data.data);
            if (String(data.data?.code) === '1' || Array.isArray(data.data)) {
                showMsg('授权码生成成功！');
                fetchStatus();
            } else {
                showMsg(data.data?.msg || '生成失败', 'error');
            }
        } catch (e: any) {
            showMsg(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 快捷封禁 / 解封 / 删除
    const handleQuickAction = async (action: 'freeze' | 'unseal' | 'delete') => {
        if (!actionDomain) return showMsg('请输入目标域名', 'error');
        setLoading(true);
        try {
            const endpoint = `./api/${action}-auth`;
            const payload: any = { url: actionDomain };
            if (action === 'freeze') payload.reason = freezeReason;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (String(data.data?.code) === '1') {
                showMsg(`操作成功: ${data.data?.msg || '完成'}`);
            } else {
                showMsg(data.data?.msg || '操作失败', 'error');
            }
        } catch (e: any) {
            showMsg(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-xl font-bold">
                        🐾
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            Nathan 域名授权管理系统
                            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                NapCat Pro
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400">QQ 机器人与 WebUI 双端联动授权管理面板</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { fetchStatus(); fetchConfig(); }}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium transition"
                    >
                        🔄 刷新
                    </button>
                </div>
            </header>

            {/* Notification */}
            {message && (
                <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm flex items-center gap-2 transition-all ${
                    message.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
                }`}>
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    <span>{message.text}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="bg-slate-800/50 border-b border-slate-700/80 px-6 flex gap-2">
                {[
                    { id: 'status', label: '📊 仪表盘概览' },
                    { id: 'manage', label: '🌐 授权管理与查询' },
                    { id: 'cards', label: '🎫 授权码批量生成' },
                    { id: 'config', label: '⚙️ 系统与接口设置' },
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition -mb-px flex items-center gap-2 ${
                            activeTab === t.id
                                ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content Body */}
            <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
                {/* 1. 仪表盘 */}
                {activeTab === 'status' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
                                <div className="text-slate-400 text-xs font-medium">总查询次数</div>
                                <div className="text-2xl font-bold text-white mt-2">{status?.stats?.totalQueries || 0} 次</div>
                                <div className="text-xs text-indigo-400 mt-2">包含群聊与私聊指令</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
                                <div className="text-slate-400 text-xs font-medium">自助授权码激活</div>
                                <div className="text-2xl font-bold text-emerald-400 mt-2">{status?.stats?.totalActivates || 0} 次</div>
                                <div className="text-xs text-emerald-500/80 mt-2">用户自助兑换</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
                                <div className="text-slate-400 text-xs font-medium">管理员手动授权</div>
                                <div className="text-2xl font-bold text-amber-400 mt-2">{status?.stats?.totalAdds || 0} 个</div>
                                <div className="text-xs text-amber-500/80 mt-2">站长/管理员开通</div>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-sm">
                                <div className="text-slate-400 text-xs font-medium">已生成授权码总计</div>
                                <div className="text-2xl font-bold text-purple-400 mt-2">{status?.stats?.totalCardsCreated || 0} 张</div>
                                <div className="text-xs text-purple-400/80 mt-2">批量授权码生成数</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
                                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                    <span>🤖</span> 机器人服务信息
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-700/60 pb-2">
                                        <span className="text-slate-400">运行时间</span>
                                        <span className="text-slate-200 font-mono">{status?.uptime || '加载中...'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-700/60 pb-2">
                                        <span className="text-slate-400">管理员 QQ 列表</span>
                                        <span className="text-indigo-400 font-mono">{config?.admin_qqs || '未设置'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-700/60 pb-2">
                                        <span className="text-slate-400">Nathan 系统地址</span>
                                        <span className="text-slate-300 font-mono text-xs">{config?.api_url || '未设置'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-700/60 pb-2">
                                        <span className="text-slate-400">默认授权项目 (AppID)</span>
                                        <span className="text-slate-300 font-mono">{config?.default_appid || '1'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">最近业务活跃</span>
                                        <span className="text-slate-400 text-xs">{status?.stats?.lastActiveTime || '暂无业务'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
                                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                    <span>📖</span> 机器人可用指令速查
                                </h3>
                                <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                                    <div className="text-indigo-400 font-bold mb-1">【普通用户指令】</div>
                                    <div>#查授权 &lt;域名&gt;</div>
                                    <div>#激活授权 &lt;授权码&gt; &lt;域名&gt;</div>
                                    <div>#换绑授权 &lt;旧域名&gt; &lt;新域名&gt;</div>
                                    <div>#授权帮助</div>

                                    <div className="text-amber-400 font-bold mt-3 mb-1">【管理员特权指令】</div>
                                    <div>#开通授权 &lt;域名&gt; &lt;QQ&gt; [天数] [项目ID]</div>
                                    <div>#生成授权码 &lt;数量&gt; [天数] [项目ID]</div>
                                    <div>#封禁授权 &lt;域名&gt; [原因]</div>
                                    <div>#解封授权 &lt;域名&gt;</div>
                                    <div>#删除授权 &lt;域名&gt;</div>
                                    <div>#应用列表</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. 授权管理与查询 */}
                {activeTab === 'manage' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 左：在线查授权 */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <span>🔍</span> 授权在线实时核验
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">目标域名 / URL</label>
                                    <input
                                        type="text"
                                        placeholder="例如：baidu.com"
                                        value={queryDomain}
                                        onChange={(e) => setQueryDomain(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">项目 AppID (选填)</label>
                                    <input
                                        type="text"
                                        placeholder="留空使用默认 AppID"
                                        value={queryAppid}
                                        onChange={(e) => setQueryAppid(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={handleQueryAuth}
                                    disabled={loading}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                                >
                                    {loading ? '正在查询...' : '立即查询授权状态'}
                                </button>
                            </div>

                            {queryResult && (
                                <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700 text-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">查询反馈：</span>
                                        <span className={String(queryResult.code) === '1' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                            {String(queryResult.code) === '1' ? '正版有效授权 ✅' : '授权未通过 ❌'}
                                        </span>
                                    </div>
                                    <pre className="text-xs text-slate-400 overflow-x-auto bg-slate-950 p-2 rounded-lg">
                                        {JSON.stringify(queryResult, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* 快捷封禁/解封 */}
                            <div className="pt-4 border-t border-slate-700 space-y-3">
                                <h4 className="text-xs font-semibold text-slate-300">⚡ 快捷封禁 / 解封 / 删除</h4>
                                <input
                                    type="text"
                                    placeholder="输入要操作的域名"
                                    value={actionDomain}
                                    onChange={(e) => setActionDomain(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                                <input
                                    type="text"
                                    placeholder="封禁拉黑原因 (仅封禁时有效)"
                                    value={freezeReason}
                                    onChange={(e) => setFreezeReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleQuickAction('freeze')}
                                        className="flex-1 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-medium transition"
                                    >
                                        🔒 封禁拉黑
                                    </button>
                                    <button
                                        onClick={() => handleQuickAction('unseal')}
                                        className="flex-1 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition"
                                    >
                                        🔓 解除封禁
                                    </button>
                                    <button
                                        onClick={() => handleQuickAction('delete')}
                                        className="flex-1 py-2 bg-slate-700 hover:bg-red-700 text-white rounded-xl text-xs font-medium transition"
                                    >
                                        🗑️ 删除授权
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 右：管理员添加授权 */}
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <span>➕</span> 手动开通新授权
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">授权域名 *</label>
                                    <input
                                        type="text"
                                        placeholder="例如：domain.com"
                                        value={addForm.url}
                                        onChange={(e) => setAddForm({ ...addForm, url: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">站长 QQ *</label>
                                    <input
                                        type="text"
                                        placeholder="例如：2322796106"
                                        value={addForm.qq}
                                        onChange={(e) => setAddForm({ ...addForm, qq: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">有效时长 (天)</label>
                                        <input
                                            type="text"
                                            placeholder="0 为永久"
                                            value={addForm.authdate}
                                            onChange={(e) => setAddForm({ ...addForm, authdate: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">应用 AppID</label>
                                        <input
                                            type="text"
                                            placeholder="默认项目"
                                            value={addForm.appid}
                                            onChange={(e) => setAddForm({ ...addForm, appid: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">绑定的服务器 IP (选填)</label>
                                        <input
                                            type="text"
                                            placeholder="127.0.0.1"
                                            value={addForm.ip}
                                            onChange={(e) => setAddForm({ ...addForm, ip: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">联系邮箱 (选填)</label>
                                        <input
                                            type="text"
                                            placeholder="站长邮箱"
                                            value={addForm.email}
                                            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddAuth}
                                    disabled={loading}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                                >
                                    {loading ? '正在开通...' : '立即开通授权'}
                                </button>
                            </div>

                            {addResult && (
                                <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700 text-sm space-y-2">
                                    <pre className="text-xs text-slate-300 overflow-x-auto bg-slate-950 p-2 rounded-lg">
                                        {JSON.stringify(addResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. 授权码批量生成 */}
                {activeTab === 'cards' && (
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6 max-w-3xl mx-auto">
                        <div className="border-b border-slate-700 pb-4">
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <span>🎫</span> 批量生成激活码 / 生成授权码
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">自动调用 Nathan 后台生成激活码接口，生成授权码可供客户在 QQ 私聊或群内直接激活核销。</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">生成张数 (1-50)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={cardForm.count}
                                    onChange={(e) => setCardForm({ ...cardForm, count: parseInt(e.target.value) || 1 })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">授权码有效时长 (天，0为永久)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={cardForm.authdate}
                                    onChange={(e) => setCardForm({ ...cardForm, authdate: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">授权码前缀 (例如 AUTH)</label>
                                <input
                                    type="text"
                                    value={cardForm.prefix}
                                    onChange={(e) => setCardForm({ ...cardForm, prefix: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">应用 AppID (留空为默认项目)</label>
                                <input
                                    type="text"
                                    placeholder="默认 AppID"
                                    value={cardForm.appid}
                                    onChange={(e) => setCardForm({ ...cardForm, appid: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCreateCards}
                            disabled={loading}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                        >
                            {loading ? '正在批量生成激活码...' : `一键批量生成 ${cardForm.count} 张授权码`}
                        </button>

                        {cardResult && (
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                                <div className="text-xs text-slate-400 font-medium">授权码生成结果：</div>
                                <textarea
                                    readOnly
                                    rows={8}
                                    value={Array.isArray(cardResult) ? cardResult.map((c: any) => typeof c === 'string' ? c : c.card || JSON.stringify(c)).join('\n') : JSON.stringify(cardResult, null, 2)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 4. 系统设置 */}
                {activeTab === 'config' && (
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6 max-w-4xl mx-auto">
                        <div className="border-b border-slate-700 pb-4">
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <span>⚙️</span> 接口连接与鉴权配置
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">配置 Nathan 域名授权站点的访问地址、通信安全密钥及管理员特权 QQ。</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
                                <div>
                                    <div className="text-sm font-medium text-white">插件总开关</div>
                                    <div className="text-xs text-slate-400">关闭后暂停响应任何群指令与接口调用</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={config?.enabled !== false}
                                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 font-medium mb-1">
                                    管理员 QQ 列表 (admin_qqs) *
                                </label>
                                <input
                                    type="text"
                                    value={config?.admin_qqs || ''}
                                    onChange={(e) => setConfig({ ...config, admin_qqs: e.target.value })}
                                    placeholder="支持逗号分隔，如：2322796106,10001"
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                                />
                                <span className="text-xs text-slate-500 mt-1 block">该列表内的 QQ 拥有群聊与私聊的全部后台管理、添加授权、生成激活码拉黑特权。</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-300 font-medium mb-1">
                                        Nathan 授权系统根地址 (api_url) *
                                    </label>
                                    <input
                                        type="text"
                                        value={config?.api_url || ''}
                                        onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                                        placeholder="例如：https://auth.example.com"
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-300 font-medium mb-1">
                                        网站安全密钥 (web_key) *
                                    </label>
                                    <input
                                        type="text"
                                        value={config?.web_key || ''}
                                        onChange={(e) => setConfig({ ...config, web_key: e.target.value })}
                                        placeholder="后台设置的 webkey"
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-300 font-medium mb-1">后台管理员账号 (admin_name)</label>
                                    <input
                                        type="text"
                                        value={config?.admin_name || ''}
                                        onChange={(e) => setConfig({ ...config, admin_name: e.target.value })}
                                        placeholder="用于管理员开通接口"
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-300 font-medium mb-1">后台管理员密码 (admin_password)</label>
                                    <input
                                        type="password"
                                        value={config?.admin_password || ''}
                                        onChange={(e) => setConfig({ ...config, admin_password: e.target.value })}
                                        placeholder="管理员密码"
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-300 font-medium mb-1">默认项目 AppID</label>
                                    <input
                                        type="text"
                                        value={config?.default_appid || '1'}
                                        onChange={(e) => setConfig({ ...config, default_appid: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <label className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config?.allow_user_activate !== false}
                                        onChange={(e) => setConfig({ ...config, allow_user_activate: e.target.checked })}
                                        className="w-4 h-4 accent-indigo-600"
                                    />
                                    <span className="text-xs text-slate-300">允许用户自助授权码激活</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config?.allow_user_query !== false}
                                        onChange={(e) => setConfig({ ...config, allow_user_query: e.target.checked })}
                                        className="w-4 h-4 accent-indigo-600"
                                    />
                                    <span className="text-xs text-slate-300">允许用户查授权</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config?.allow_user_replace !== false}
                                        onChange={(e) => setConfig({ ...config, allow_user_replace: e.target.checked })}
                                        className="w-4 h-4 accent-indigo-600"
                                    />
                                    <span className="text-xs text-slate-300">允许用户自助换绑</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 font-medium mb-1">
                                    生效群号白名单 (allowed_groups)
                                </label>
                                <input
                                    type="text"
                                    value={config?.allowed_groups || ''}
                                    onChange={(e) => setConfig({ ...config, allowed_groups: e.target.value })}
                                    placeholder="留空则私聊与全部群均可响应；多个群号用逗号隔开"
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-mono"
                                />
                            </div>

                            <button
                                onClick={handleSaveConfig}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 mt-4"
                            >
                                {loading ? '正在保存...' : '💾 保存所有设置'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
export default App;
