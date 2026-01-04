import { createServerFn } from '@tanstack/react-start'

export interface Language {
  code: string
  name: string
  nativeName: string
  family: string
  speakers: number
}

export const getLanguages = createServerFn({
  method: 'GET',
}).handler(async () => {
  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', family: 'Indo-European', speakers: 1452000000 },
    { code: 'zh', name: 'Chinese', nativeName: '中文', family: 'Sino-Tibetan', speakers: 1118000000 },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', family: 'Indo-European', speakers: 602000000 },
    { code: 'es', name: 'Spanish', nativeName: 'Español', family: 'Indo-European', speakers: 548000000 },
    { code: 'fr', name: 'French', nativeName: 'Français', family: 'Indo-European', speakers: 274000000 },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', family: 'Afro-Asiatic', speakers: 274000000 },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', family: 'Indo-European', speakers: 272000000 },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', family: 'Indo-European', speakers: 264000000 },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', family: 'Indo-European', speakers: 258000000 },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', family: 'Japonic', speakers: 125000000 },
  ]

  return languages
})
