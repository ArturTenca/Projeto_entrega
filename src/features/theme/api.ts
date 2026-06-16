import { supabase } from '@/lib/supabase'
import type { ThemeMode } from '@/types/database'

export async function fetchUserTheme(
  userId: string,
): Promise<{ theme: ThemeMode; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('theme')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar tema do usuário')
    return { theme: 'light', error: 'Não foi possível carregar o tema.' }
  }

  const theme = data?.theme === 'dark' ? 'dark' : 'light'
  return { theme, error: null }
}

export async function updateUserTheme(
  userId: string,
  theme: ThemeMode,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ theme })
    .eq('id', userId)

  if (error) {
    console.error('Erro ao salvar tema do usuário')
    return { error: 'Não foi possível salvar o tema.' }
  }

  return { error: null }
}
