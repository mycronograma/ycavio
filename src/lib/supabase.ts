import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../types';

const supabaseUrl =
  (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

const supabaseAnonKey =
  (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('YOUR_PROJECT_ID') &&
    !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function translateSupabaseError(message?: string): string {
  if (!message) return 'Não foi possível concluir a operação. Tente novamente.';
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('user already registered')) {
    return 'Este e-mail já está cadastrado. Faça login para continuar.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  }
  if (lower.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.';
  }
  if (
    lower.includes('exceed_egress_quota') ||
    lower.includes('spend cap') ||
    lower.includes('service for this project is restricted') ||
    lower.includes('quota')
  ) {
    return 'A nuvem atingiu o limite temporário de tráfego gratuito. Você pode usar o acesso local neste dispositivo ou tentar novamente mais tarde.';
  }
  return message;
}

export interface CloudWorkspacePayload {
  profileRow: {
    id: string;
    name: string;
    email: string;
    preset_chosen: boolean;
    onboarding_completed: boolean;
  } | null;
  workspaceRow: {
    user_id: string;
    profile_settings: Partial<AppState['profile']>;
    subjects: AppState['subjects'];
    tasks: AppState['tasks'];
    reviews: AppState['reviews'];
    sessions: AppState['sessions'];
    achievements: AppState['achievements'];
    daily_goal: Partial<AppState['dailyGoal']>;
    question_logs: NonNullable<AppState['questionLogs']>;
    fixed_commitments: NonNullable<AppState['fixedCommitments']>;
    notifications: NonNullable<AppState['notifications']>;
    last_schedule_generated_at: string | null;
  } | null;
}

export async function fetchUserWorkspace(userId: string): Promise<CloudWorkspacePayload | null> {
  if (!supabase) return null;

  const [profileRes, workspaceRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('study_workspaces').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (profileRes.error && profileRes.error.code !== 'PGRST116') {
    throw profileRes.error;
  }
  if (workspaceRes.error && workspaceRes.error.code !== 'PGRST116') {
    throw workspaceRes.error;
  }

  return {
    profileRow: profileRes.data || null,
    workspaceRow: workspaceRes.data || null,
  };
}

export async function syncUserWorkspace(userId: string, state: AppState): Promise<void> {
  if (!supabase || !userId || userId === 'local-guest') return;

  const [profileRes, workspaceRes] = await Promise.all([
    supabase.from('profiles').upsert(
      {
        id: userId,
        name: state.profile.name || state.currentUser?.name || '',
        email: state.currentUser?.email || state.profile.email || '',
        preset_chosen: Boolean(state.profile.presetChosen),
        onboarding_completed: Boolean(state.profile.onboardingCompleted),
      },
      { onConflict: 'id' }
    ),
    supabase.from('study_workspaces').upsert(
      {
        user_id: userId,
        profile_settings: state.profile,
        subjects: state.subjects,
        tasks: state.tasks,
        reviews: state.reviews,
        sessions: state.sessions,
        achievements: state.achievements,
        daily_goal: state.dailyGoal,
        question_logs: state.questionLogs || [],
        fixed_commitments: state.fixedCommitments || [],
        notifications: state.notifications || [],
        last_schedule_generated_at: state.lastScheduleGeneratedAt || null,
      },
      { onConflict: 'user_id' }
    ),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (workspaceRes.error) throw workspaceRes.error;
}
