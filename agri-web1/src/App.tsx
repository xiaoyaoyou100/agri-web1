import { useState } from "react"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import { Sidebar } from "./components/Sidebar"

export default function App() {
    const [authed, setAuthed] = useState(false)
    const [tab, setTab] = useState<"welcome"|"realtime">("welcome")

    if (!authed) return <Login onOk={() => setAuthed(true)} />

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar current={tab} onSelect={(k) => setTab(k as any)} />
            <main className="flex-1">
                {tab === "welcome" && (
                    <div className="p-10">
                        <div className="text-3xl font-bold mb-2">欢迎使用气象站监测系统</div>
                        <div className="text-gray-600">请从左侧选择“气象站实时数据”查看最新指标。</div>
                    </div>
                )}
                {tab === "realtime" && <Dashboard />}
            </main>
        </div>
    )
}
