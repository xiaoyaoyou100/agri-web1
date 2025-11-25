export function MetricsCard({ label, value, unit }: { label: string; value?: string | number; unit?: string }) {
    return (
        <div className="rounded-2xl shadow p-4 bg-white border">
            <div className="text-gray-500 text-sm">{label}：</div>
            <div className="text-xl font-semibold mt-1 break-all">
                {value ?? "-"}
                {unit ? <span className="text-base font-normal ml-1">{unit}</span> : null}
            </div>
        </div>
    )
}
