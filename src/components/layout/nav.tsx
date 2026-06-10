'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  {
    href: '/',
    label: 'Roadmap',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16V4M4 4l3 3M4 4L1 7M10 16V8l3-3M10 8l3 3" />
        <circle cx="4" cy="4" r="1.5" fill={active ? 'white' : 'none'} />
        <circle cx="10" cy="8" r="1.5" fill={active ? 'white' : 'none'} />
        <circle cx="4" cy="16" r="1.5" fill={active ? 'white' : 'none'} />
        <circle cx="10" cy="16" r="1.5" fill={active ? 'white' : 'none'} />
        <circle cx="17" cy="5" r="1.5" fill={active ? 'white' : 'none'} />
        <circle cx="17" cy="13" r="1.5" fill={active ? 'white' : 'none'} />
        <path d="M10 8l7-3M10 8l7 5" />
      </svg>
    ),
  },
  {
    href: '/library',
    label: 'Library',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h12v13H4z" />
        <path d="M7 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
        <path d="M7 9h6M7 13h4" />
      </svg>
    ),
  },
  {
    href: '/rewards',
    label: 'Rewards',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l2.5 5 5.5.8-4 3.9 1 5.3L10 14.5l-5 2.5 1-5.3-4-3.9L7.5 7z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={active ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" strokeLinecap="round">
        <line x1="3" y1="6" x2="17" y2="6" />
        <line x1="3" y1="10" x2="17" y2="10" />
        <line x1="3" y1="14" x2="17" y2="14" />
        <circle cx="8" cy="6" r="1.5" fill={active ? 'white' : 'none'} />
        <circle cx="13" cy="10" r="1.5" fill={active ? 'white' : 'none'} />
        <circle cx="7" cy="14" r="1.5" fill={active ? 'white' : 'none'} />
      </svg>
    ),
  },
]

export function Nav() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollY.current && currentY > 40) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <ul className="flex justify-around items-center h-14">
        {links.map((l) => {
          const active = pathname === l.href
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-medium px-3 py-1 rounded-none transition-all ${
                  active ? 'text-white' : 'text-white/40'
                }`}
              >
                {l.icon(active)}
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
