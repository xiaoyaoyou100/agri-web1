import React, { useState } from "react"

export default function Login({ onOk }: { onOk: () => void }) {
    const [u, setU] = useState("")
    const [p, setP] = useState("")
    const [err, setErr] = useState<string | null>(null)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (u === "admin" && p === "abc123456") onOk()
        else setErr("账号或密码不正确")
    }

    return (
        <div className="min-h-screen grid place-items-center bg-gray-50">
            <form onSubmit={submit} className="w-full max-w-sm p-6 bg-white rounded-2xl shadow border space-y-4">
                <div className="text-2xl font-bold text-center">登录</div>
                <div>
                    <label className="text-sm text-gray-600">账号</label>
                    <input className="mt-1 w-full border rounded-xl px-3 py-2" value={u} onChange={e => setU(e.target.value)} />
                </div>
                <div>
                    <label className="text-sm text-gray-600">密码</label>
                    <input type="password" className="mt-1 w-full border rounded-xl px-3 py-2" value={p} onChange={e => setP(e.target.value)} />
                </div>
                {err && <div className="text-red-500 text-sm">{err}</div>}
                <button className="w-full rounded-xl bg-black text-white py-2">登录</button>
                <div className="text-xs text-gray-500 text-center">admin / abc123456</div>
            </form>
        </div>
    )
}
