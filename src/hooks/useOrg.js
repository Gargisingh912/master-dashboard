import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useOrg(userId) {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function getOrgContext() {
      try {
        setLoading(true);
        
        // This exact syntax is what PostgREST (Supabase) expects for a relational join
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            role,
            org_id,
            organizations (
              id,
              name,
              niche,
              industry_type
            )
          `)
          .eq('id', userId)
          .single(); // Throws 406 if 0 or multiple rows are found!

        if (error) throw error;

        if (data && data.organizations) {
          // Flatten the object format so your React app can read it easily
          setOrgData({
            id: data.org_id,
            role: data.role,
            name: data.organizations.name,
            industry_type: data.organizations.industry_type
          });
        }
      } catch (err) {
        console.error("Error inside useOrg hook layer:", err.message);
      } finally {
        setLoading(false);
      }
    }

    getOrgContext();
  }, [userId]);

  return { orgData, loading };
}