import { useCallback, useEffect, useState } from "react"
import { fetchLatest, type Telemetry } from "../lib/api"
import { MetricsCard } from "../components/MetricsCard"

function getErrorMessage(e: unknown) {
    if (e instanceof Error) return e.message
    try { return JSON.stringify(e) } catch { return String(e) }
}

export default function Dashboard() {
    const [devId, setDevId] = useState("dev01")
    const [t, setT] = useState<Telemetry | null>(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setErr(null)
        try {
            const data = await fetchLatest(devId)
            setT(data)
        } catch (e: unknown) {
            setErr(getErrorMessage(e))
        } finally {
            setLoading(false)
        }
    }, [devId])

    useEffect(() => {
        void load()
        const timer = setInterval(() => { void load() }, 5000)
        return () => clearInterval(timer)
    }, [load])

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                <div className="text-2xl font-bold">气象站实时数据</div>
                <div className="ml-auto flex items-center gap-2">
                    <label className="text-sm text-gray-600">设备ID：</label>
                    <input
                        className="border rounded-xl px-3 py-1"
                        value={devId}
                        onChange={e => setDevId(e.target.value)}
                    />
                    <button onClick={() => void load()} className="border rounded-xl px-3 py-1">刷新</button>
                </div>
            </div>

            {err && <div className="text-red-600">{err}</div>}
            {loading && <div className="text-gray-500">加载中...</div>}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricsCard label="温度"   value={t?.temp10 != null ? (t.temp10 / 10).toFixed(1) : undefined} unit="°C" />
                <MetricsCard label="湿度"   value={t?.hum10  != null ? (t.hum10  / 10).toFixed(1) : undefined} unit="%" />
                <MetricsCard label="大气压" value={t?.press10 != null ? (t.press10 / 10).toFixed(1) : undefined} unit="hPa" />
                <MetricsCard label="光照"   value={t?.lux} unit="lx" />
                <MetricsCard label="风速"   value={t?.wind10 != null ? (t.wind10 / 10).toFixed(1) : undefined} unit="m/s" />
                <MetricsCard label="风级"   value={t?.windLv} />
                <MetricsCard label="雨量"   value={t?.rain10 != null ? (t.rain10 / 10).toFixed(1) : undefined} unit="mm" />
                <MetricsCard label="土壤氮" value={t?.soilN} unit="mg/kg" />
                <MetricsCard label="土壤磷" value={t?.soilP} unit="mg/kg" />
                <MetricsCard label="土壤钾" value={t?.soilK} unit="mg/kg" />
            </div>

            {t?.ts && <div className="text-sm text-gray-500">更新时间：{new Date(t.ts).toLocaleString()}</div>}
        </div>
    )
}
