import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [org, setOrg]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchProfile = async (userId) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', userId)
      .single()

    if (prof) {
      setProfile(prof)
      setOrg(prof.organizations)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setOrg(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    return { error }
  }

  const logout = () => supabase.auth.signOut()

  return {
    user,
    profile,
    org,
    role: profile?.role || 'viewer',
    niche: org?.niche || 'restaurant',
    loading,
    error,
    login,
    logout,
  }
}