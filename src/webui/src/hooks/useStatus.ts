import { useState, useCallback } from 'react'
import type { PluginStatus } from '../types'
import { noAuthFetch } from '../utils/api'

export function useStatus() {
    const [status, setStatus] = useState<PluginStatus | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true)
            const res = await noAuthFetch<PluginStatus>('/status')
            if (res.code === 0 && res.data) {
                setStatus(res.data)
            }
        } catch (e) {
            console.error('获取系统状态失败:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    return { status, loading, fetchStatus }
}
