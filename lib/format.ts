export const MOCK_NOW = new Date('2026-11-08T09:00:00+05:00')

const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
]

const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']

const pad = (value: number) => String(value).padStart(2, '0')

export const number = (value: number): string =>
  new Intl.NumberFormat('ru-RU').format(Math.round(value)).replace(/\u00a0/g, ' ')

export const compact = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')} mln`
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 1000)}k`
  if (Math.abs(value) >= 1_000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`
  return number(value)
}

export const money = (value: number): string => `${number(value)} so'm`

export const percent = (value: number, digits = 0): string => `${value.toFixed(digits).replace('.0', '')}%`

const withTimeZone = (iso: string | number | Date): Date => {
  const date = iso instanceof Date ? iso : new Date(iso)
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000
  return new Date(utc + 5 * 60 * 60 * 1000)
}

export const date = (iso: string | number | Date): string => {
  const d = withTimeZone(iso)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export const dateInput = (iso: string | number | Date): string => {
  const d = withTimeZone(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const dateTimeInput = (iso: string | number | Date): string => {
  const d = withTimeZone(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const dateLong = (iso: string | number | Date): string => {
  const d = withTimeZone(iso)
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export const weekday = (iso: string | number | Date): string => WEEKDAYS[withTimeZone(iso).getDay()]

export const time = (iso: string | number | Date): string => {
  const d = withTimeZone(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const dateTime = (iso: string | number | Date): string => `${date(iso)}, ${time(iso)}`

export const shortDay = (iso: string | number | Date): string => {
  const d = withTimeZone(iso)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`
}

export const relative = (iso: string | number | Date, anchor: number = MOCK_NOW.getTime()): string => {
  const ms = new Date(iso).getTime()
  const diff = Math.max(0, anchor - ms)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'hozir'
  if (minutes < 60) return `${minutes} daq oldin`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} kun oldin`
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`
  if (days < 365) return `${Math.floor(days / 30)} oy oldin`
  return `${Math.floor(days / 365)} yil oldin`
}

export const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export const TONES = [
  'bg-[#dcfce7] text-[#15803d]',
  'bg-[#dbeafe] text-[#1d4ed8]',
  'bg-[#ede9fe] text-[#6d28d9]',
  'bg-[#fef3c7] text-[#b45309]',
  'bg-[#fee2e2] text-[#b91c1c]',
  'bg-[#ccfbf1] text-[#0f766e]',
]

export const avatarTone = (name: string): string => {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997
  return TONES[hash % TONES.length]
}

export const clock = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export const duration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${pad(s)}`
}

export const minutesToLabel = (value: number): string => `${value} daq`

export const monthName = (index: number): string => MONTHS[index]

export const downloadCsv = (filename: string, rows: Array<Array<string | number>>): void => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '')
          return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(';'),
    )
    .join('\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
