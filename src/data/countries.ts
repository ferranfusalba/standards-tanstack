import { createServerFn } from '@tanstack/react-start'

export interface Country {
  code: string
  name: string
  capital: string
  continent: string
  population: number
}

export const getCountries = createServerFn({
  method: 'GET',
}).handler(async () => {
  const countries: Country[] = [
    { code: 'US', name: 'United States', capital: 'Washington, D.C.', continent: 'North America', population: 331900000 },
    { code: 'CN', name: 'China', capital: 'Beijing', continent: 'Asia', population: 1444216000 },
    { code: 'IN', name: 'India', capital: 'New Delhi', continent: 'Asia', population: 1393409000 },
    { code: 'ID', name: 'Indonesia', capital: 'Jakarta', continent: 'Asia', population: 276362000 },
    { code: 'BR', name: 'Brazil', capital: 'Brasília', continent: 'South America', population: 213994000 },
    { code: 'PK', name: 'Pakistan', capital: 'Islamabad', continent: 'Asia', population: 225200000 },
    { code: 'NG', name: 'Nigeria', capital: 'Abuja', continent: 'Africa', population: 211401000 },
    { code: 'BD', name: 'Bangladesh', capital: 'Dhaka', continent: 'Asia', population: 166303000 },
    { code: 'RU', name: 'Russia', capital: 'Moscow', continent: 'Europe', population: 145912000 },
    { code: 'MX', name: 'Mexico', capital: 'Mexico City', continent: 'North America', population: 130263000 },
  ]

  return countries
})
