'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/src/utils/supabase/client'

export default function Navbar() {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const user = session?.user ?? null

      if (!user) {
        setLoggedIn(false)
        setRole(null)
        return
      }

      setLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      setRole(profile?.role ?? null)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const navLinkClass = (href: string) =>
    pathname === href
      ? 'px-3 py-2 rounded-lg bg-primary text-primary-foreground'
      : 'px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold tracking-tight w-fit">
            Next<span className="text-primary font-extrabold">Faire</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/" className={navLinkClass('/')}>
                Home
              </Link>

              {loggedIn && (
                <Link href="/favorites" className={navLinkClass('/favorites')}>
                  Favorites
                </Link>
              )}

              {role === 'host' && (
                <Link href="/my-events" className={navLinkClass('/my-events')}>
                  My Events
                </Link>
              )}
            </nav>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {!loggedIn && (
                <Link
                  href="/auth"
                  className={pathname === '/auth'
                    ? 'px-3 py-2 rounded-lg bg-primary text-primary-foreground'
                    : 'px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90'}
                >
                  Log In / Sign Up
                </Link>
              )}

              {role === 'host' && (
                <Link
                  href="/add-event"
                  className={pathname === '/add-event'
                    ? 'px-3 py-2 rounded-lg bg-primary text-primary-foreground'
                    : 'px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90'}
                >
                  Post Event
                </Link>
              )}

              {loggedIn && (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.reload()
                  }}
                  className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}