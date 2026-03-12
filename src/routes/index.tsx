import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Coins,
  Map,
  Globe,
  Languages,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: App,
  head: () => ({
    meta: [
      {
        title: 'Standards - International Standards Browser',
      },
      {
        name: 'description',
        content: 'Browse and compare international standards: ISO 4217 currencies, ISO 3166 countries, ISO 639 languages, and IANA timezones.',
      },
    ],
  }),
})

function App() {
  const pages = [
    {
      icon: <Coins className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />,
      title: 'Currencies',
      description:
        'Browse international currency codes, symbols, and numeric identifiers.',
      path: '/currencies',
    },
    {
      icon: <Map className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />,
      title: 'Timezones',
      description:
        'Explore timezone identifiers, offsets, and regional information.',
      path: '/timezones',
    },
    {
      icon: <Globe className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />,
      title: 'Countries',
      description:
        'View country codes, capitals, continents, and population data.',
      path: '/countries',
    },
    {
      icon: <Languages className="w-12 h-12 text-cyan-500 dark:text-cyan-400" />,
      title: 'Languages',
      description:
        'Discover language codes, native names, families, and speaker counts.',
      path: '/languages',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Standards
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4 font-light">
            Explore international standards data
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Browse and compare currencies, timezones, countries, and languages using
            TanStack Table and custom implementations.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pages.map((page, index) => (
            <Link
              key={index}
              to={page.path}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 block"
            >
              <div className="mb-4">{page.icon}</div>
              <h3 className="text-xl font-semibold mb-3">
                {page.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {page.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
