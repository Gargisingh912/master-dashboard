import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNicheData(niche, orgId) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!orgId) return
    setLoading(true)

    // Shared data every niche needs
    const [txRes, invRes, notifRes] = await Promise.all([
      supabase.from('transactions').select('*')
        .eq('org_id', orgId).order('date', { ascending: false }),
      supabase.from('inventory').select('*')
        .eq('org_id', orgId),
      supabase.from('notifications').select('*')
        .eq('org_id', orgId).eq('read', false)
        .order('created_at', { ascending: false }).limit(10),
    ])

    const shared = {
      transactions: txRes.data || [],
      inventory:    invRes.data || [],
      notifications: (notifRes.data || []).map(n => ({
        type: n.type,
        msg:  n.message,
        time: new Date(n.created_at).toLocaleTimeString(),
      })),
    }

    // Niche-specific data
    let nicheData = {}

    if (niche === 'restaurant') {
      const [ordRes, ffRes, menuRes] = await Promise.all([
        supabase.from('orders').select('*').eq('org_id', orgId)
          .order('created_at', { ascending: false }).limit(100),
        supabase.from('ff_discounts').select('*').eq('org_id', orgId)
          .order('created_at', { ascending: false }),
        supabase.from('menu_items').select('*').eq('org_id', orgId),
      ])
      nicheData = {
        orders:      ordRes.data || [],
        ffDiscounts: ffRes.data  || [],
        menuItems:   menuRes.data || [],
      }
    }

    else if (niche === 'salon') {
      const [apptRes, clientRes] = await Promise.all([
        supabase.from('appointments').select('*').eq('org_id', orgId)
          .order('created_at', { ascending: false }).limit(100),
        supabase.from('clients').select('*').eq('org_id', orgId),
      ])
      nicheData = {
        appointments: apptRes.data  || [],
        clients:      clientRes.data || [],
      }
    }

    else if (niche === 'sports') {
      const [studRes, attRes, feeRes] = await Promise.all([
        supabase.from('students').select('*').eq('org_id', orgId),
        supabase.from('attendance').select('*').eq('org_id', orgId)
          .eq('date', new Date().toISOString().slice(0, 10)),
        supabase.from('fee_collections').select('*').eq('org_id', orgId),
      ])
      nicheData = {
        students:   studRes.data || [],
        attendance: attRes.data  || [],
        fees:       feeRes.data  || [],
      }
    }

    else if (niche === 'agency') {
      const [cliRes, campRes, leadRes] = await Promise.all([
        supabase.from('agency_clients').select('*').eq('org_id', orgId),
        supabase.from('campaigns').select('*').eq('org_id', orgId),
        supabase.from('leads').select('*').eq('org_id', orgId)
          .order('created_at', { ascending: false }),
      ])
      nicheData = {
        agencyClients: cliRes.data  || [],
        campaigns:     campRes.data || [],
        leads:         leadRes.data || [],
      }
    }

    setData({ ...shared, ...nicheData })
    setLoading(false)
  }, [niche, orgId])

  useEffect(() => {
    fetch()

    // Realtime: re-fetch when any row changes
    const liveTable = {
      restaurant: 'orders',
      salon:      'appointments',
      sports:     'attendance',
      agency:     'leads',
    }[niche]

    const channel = supabase.channel(`live-${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: liveTable,
        filter: `org_id=eq.${orgId}` }, fetch)
      .on('postgres_changes', { event: 'INSERT', schema: 'public',
        table: 'notifications', filter: `org_id=eq.${orgId}` }, fetch)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetch, niche, orgId])

  // Mutation helpers — write to Supabase directly
  const insert = async (table, row) => {
    const { data, error } = await supabase
      .from(table).insert([{ ...row, org_id: orgId }]).select()
    if (!error) fetch()
    return { data, error }
  }

  const update = async (table, id, changes) => {
    const { data, error } = await supabase
      .from(table).update(changes).eq('id', id).eq('org_id', orgId).select()
    if (!error) fetch()
    return { data, error }
  }

  const remove = async (table, id) => {
    const { error } = await supabase
      .from(table).delete().eq('id', id).eq('org_id', orgId)
    if (!error) fetch()
    return { error }
  }

  return { data, loading, refetch: fetch, insert, update, remove }
}