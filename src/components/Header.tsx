import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import {
  Coins,
  Globe,
  Home,
  Languages,
  Map,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <header className="p-4 flex items-center bg-secondary text-secondary-foreground shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold flex-1">
          <Link to="/">Standards</Link>
        </h1>
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-background text-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/currencies"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Coins size={20} />
            <span className="font-medium">Currencies</span>
          </Link>

          <Link
            to="/timezones"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Map size={20} />
            <span className="font-medium">Timezones</span>
          </Link>

          <Link
            to="/countries"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Globe size={20} />
            <span className="font-medium">Countries</span>
          </Link>

          <Link
            to="/languages"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Languages size={20} />
            <span className="font-medium">Languages</span>
          </Link>
        </nav>
      </aside>
    </>
  )
}
