import { useState, useEffect, useCallback } from 'react'
import { useTheme } from './hooks/useTheme'
import { useStatus } from './hooks/useStatus'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ToastContainer from './components/ToastContainer'
import StatusPage from './pages/StatusPage'
import ManagePage from './pages/ManagePage'
import CardsPage from './pages/CardsPage'

export type PageId = 'status' | 'manage' | 'cards'

interface PageMeta {
    title: string
    description: string
}

const pageMeta: Record<PageId, PageMeta> = {
    status: { title: '状态概览', description: '查看授权管理助手运行状态与业务数据统计' },
    manage: { title: '授权管理', description: '查询域名正版授权、快速添加开通、封禁解封与删除' },
    cards: { title: '生成授权码', description: '批量生成授权激活码，支持自定义项目、天数与前缀' },
}

export default function App() {
    useTheme()

    const [currentPage, setCurrentPage] = useState<PageId>('status')
    const [isScrolled, setIsScrolled] = useState(false)
    const { status, fetchStatus } = useStatus()

    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 8000)
        return () => clearInterval(interval)
    }, [fetchStatus])

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 0)
    }, [])

    const meta = pageMeta[currentPage]

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#18191C] text-gray-900 dark:text-gray-100 font-sans">
            <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title={meta.title}
                    description={meta.description}
                    isScrolled={isScrolled}
                    status={status as any}
                    currentPage={currentPage}
                />
                <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8" onScroll={handleScroll}>
                    {currentPage === 'status' && <StatusPage status={status} onRefresh={fetchStatus} />}
                    {currentPage === 'manage' && <ManagePage onRefresh={fetchStatus} />}
                    {currentPage === 'cards' && <CardsPage onRefresh={fetchStatus} />}
                </div>
            </main>
            <ToastContainer />
        </div>
    )
}
