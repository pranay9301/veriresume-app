import { supabase } from './supabaseClient';

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const fetchJson = async (url, options = {}) => {
  const session = await getSession();
  const token = session?.access_token || '';
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(options.headers || {}),
    },
  });
  return res.json();
};
