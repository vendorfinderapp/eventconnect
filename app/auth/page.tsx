'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../src/utils/supabase/client'

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('guest')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSignUp = async () => {
    setMessage('')

    if (!email || !password) {
      setMessage('Please enter your email and password.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (!user) {
      setMessage('Signup worked, but no user was returned.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert([
      {
        user_id: user.id,
        email,
        role,
      },
    ])

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    setMessage('Account created successfully. You can now use NextFaire.')
    setLoading(false)
    router.push('/')
    router.refresh()
  }

  const handleLogin = async () => {
    setMessage('')

    if (!email || !password) {
      setMessage('Please enter your email and password.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="border border-border rounded-2xl bg-card shadow-sm p-8 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Next<span className="text-primary font-extrabold">Faire</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Discover vendor events, explore experiences, and connect locally.
            </p>

            <div className="mt-8 space-y-4 text-sm text-secondary-foreground">
              <div className="border border-border rounded-xl p-4 bg-secondary">
                <h2 className="font-semibold mb-1">For vendors</h2>
                <p>Browse events, save favorites, and go straight to application links.</p>
              </div>

              <div className="border border-border rounded-xl p-4 bg-secondary">
                <h2 className="font-semibold mb-1">For hosts</h2>
                <p>Create events, manage listings, edit details, and keep opportunities updated.</p>
              </div>

              <div className="border border-border rounded-xl p-4 bg-secondary">
                <h2 className="font-semibold mb-1">For guests</h2>
                <p>Discover events happening near you, explore local markets, and find things to do in your area.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-2xl bg-card shadow-sm p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode('login')
                setMessage('')
              }}
              className={`px-4 py-2 rounded-lg text-sm ${mode === 'login'
                ? 'bg-primary text-primary-foreground'
                : ':bg-secondary text-secondary-foreground hover:opacity-90'
                }`}
            >
              Log In
            </button>

            <button
              onClick={() => {
                setMode('signup')
                setMessage('')
              }}
              className={`px-4 py-2 rounded-lg text-sm ${mode === 'signup'
                ? 'bg-primary text-primary-foreground'
                : ':bg-secondary text-secondary-foreground hover:opacity-90'
                }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === 'login'
                ? 'Log in to save favorites, manage your account, and keep exploring.'
                : role === 'vendor'
                  ? 'Create a vendor account to save events and apply to opportunities.'
                  : role === 'host'
                    ? 'Create a host account to post events, manage listings, and attract vendors.'
                    : 'Create a guest account to save favorites and discover events near you.'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="flex gap-2">
                <input
                  className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="px-4 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1">Account Type</label>
                <select
                  className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="guest">Guest</option>
                  <option value="vendor">Vendor</option>
                  <option value="host">Host</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {role === 'vendor'
                    ? 'Vendors can browse events, save favorites, and apply to opportunities.'
                    : role === 'host'
                      ? 'Hosts can create events, manage listings, and attract vendors.'
                      : 'Guests can browse events, explore local markets, and save favorites.'}
                </p>
              </div>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleSignUp}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg disabled:opacity-50"
            >
              {loading
                ? mode === 'login'
                  ? 'Logging In...'
                  : 'Creating Account...'
                : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>

            {message && (
              <div className="border border-border rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
                {message}
              </div>
            )}
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            <a href="/" className="underline">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}