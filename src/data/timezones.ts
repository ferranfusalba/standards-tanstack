import { createServerFn } from '@tanstack/react-start'

export interface Timezone {
  id: string
  name: string
  offset: string
  region: string
}

export const getTimezones = createServerFn({
  method: 'GET',
}).handler(async () => {
  const timezones: Timezone[] = [
    { id: 'America/New_York', name: 'Eastern Time', offset: 'UTC-5', region: 'North America' },
    { id: 'America/Chicago', name: 'Central Time', offset: 'UTC-6', region: 'North America' },
    { id: 'America/Denver', name: 'Mountain Time', offset: 'UTC-7', region: 'North America' },
    { id: 'America/Los_Angeles', name: 'Pacific Time', offset: 'UTC-8', region: 'North America' },
    { id: 'Europe/London', name: 'Greenwich Mean Time', offset: 'UTC+0', region: 'Europe' },
    { id: 'Europe/Paris', name: 'Central European Time', offset: 'UTC+1', region: 'Europe' },
    { id: 'Asia/Tokyo', name: 'Japan Standard Time', offset: 'UTC+9', region: 'Asia' },
    { id: 'Asia/Shanghai', name: 'China Standard Time', offset: 'UTC+8', region: 'Asia' },
    { id: 'Asia/Dubai', name: 'Gulf Standard Time', offset: 'UTC+4', region: 'Asia' },
    { id: 'Australia/Sydney', name: 'Australian Eastern Time', offset: 'UTC+10', region: 'Oceania' },
  ]

  return timezones
})
