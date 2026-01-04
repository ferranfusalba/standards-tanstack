import { createServerFn } from '@tanstack/react-start'

export interface Currency {
  code: string
  name: string
  symbol: string
  numericCode: string
}

export const getCurrencies = createServerFn({
  method: 'GET',
}).handler(async () => {
  const currencies: Currency[] = [
    { code: 'USD', name: 'United States Dollar', symbol: '$', numericCode: '840' },
    { code: 'EUR', name: 'Euro', symbol: '€', numericCode: '978' },
    { code: 'GBP', name: 'British Pound Sterling', symbol: '£', numericCode: '826' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', numericCode: '392' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', numericCode: '756' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', numericCode: '124' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', numericCode: '036' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', numericCode: '156' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', numericCode: '356' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', numericCode: '986' },
  ]

  return currencies
})
