import axios from "axios"

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://8.153.173.131:8080"

export const api = axios.create({
    baseURL: API_BASE,
    headers: {
        Authorization: "Basic " + btoa("admin:abc123456"),
    },
    timeout: 10000,
})

export type Telemetry = {
    id?: number
    ts?: string
    deviceId: string
    temp10?: number
    hum10?: number
    press10?: number
    lux?: number
    wind10?: number
    windLv?: number
    rain10?: number
    soilN?: number
    soilP?: number
    soilK?: number
}

export async function fetchLatest(deviceId: string) {
    const res = await api.get<Telemetry>("/api/telemetry/latest", { params: { deviceId } })
    return res.data
}
