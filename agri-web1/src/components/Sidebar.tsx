export function Sidebar({ onSelect, current }: { onSelect: (key: string) => void; current: string }) {
    const Item = ({ k, text }: { k: string; text: string }) => (
        <button
            onClick={() => onSelect(k)}
            className={`w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 transition ${
                current === k ? "bg-gray-100 font-semibold" : ""
            }`}
        >
            {text}
        </button>
    )

    return (
        <aside className="w-64 p-4 border-r bg-white">
            <div className="text-2xl font-bold mb-4">菜单</div>
            <div className="space-y-2">
                <Item k="welcome" text="欢迎" />
                <Item k="realtime" text="气象站实时数据" />
            </div>
        </aside>
    )
}
