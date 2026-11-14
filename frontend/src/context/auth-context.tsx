import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { cadastrar, entrar, type Usuario } from '@/services/api';
import { lerOnboardingVisto, salvarOnboardingVisto } from '@/services/preferencias';
import { apagarSessao, lerSessao, salvarSessao } from '@/services/token-storage';

type Sessao = { token: string; usuario: Usuario };

type AuthContextValue = {
  sessao: Sessao | null;
  carregando: boolean;
  // null enquanto a preferência do usuário ainda está sendo lida
  onboardingVisto: boolean | null;
  concluirOnboarding: () => Promise<void>;
  reverOnboarding: () => Promise<void>;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (nome: string, email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [onboardingVisto, setOnboardingVisto] = useState<boolean | null>(null);

  // Restaura a sessão salva ao abrir o app
  useEffect(() => {
    lerSessao()
      .then((salva) => {
        if (salva) setSessao(JSON.parse(salva) as Sessao);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  // Descobre se este usuário já viu a introdução (guardado por usuário, neste aparelho)
  const usuarioId = sessao?.usuario.id;
  useEffect(() => {
    if (usuarioId === undefined) return;
    let ativo = true;
    lerOnboardingVisto(usuarioId).then((visto) => {
      if (ativo) setOnboardingVisto(visto);
    });
    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  const concluirOnboarding = useCallback(async () => {
    if (usuarioId !== undefined) await salvarOnboardingVisto(usuarioId, true);
    setOnboardingVisto(true);
  }, [usuarioId]);

  const reverOnboarding = useCallback(async () => {
    if (usuarioId !== undefined) await salvarOnboardingVisto(usuarioId, false);
    setOnboardingVisto(false);
  }, [usuarioId]);

  const signIn = useCallback(async (email: string, senha: string) => {
    const resposta = await entrar(email, senha);
    const nova = { token: resposta.token, usuario: resposta.usuario };
    await salvarSessao(JSON.stringify(nova));
    setSessao(nova);
  }, []);

  const signUp = useCallback(
    async (nome: string, email: string, senha: string) => {
      await cadastrar(nome, email, senha);
      // Após cadastrar, já autentica o usuário para levá-lo direto ao app
      await signIn(email, senha);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    await apagarSessao();
    setSessao(null);
    setOnboardingVisto(null);
  }, []);

  const value = useMemo(
    () => ({
      sessao,
      carregando,
      onboardingVisto,
      concluirOnboarding,
      reverOnboarding,
      signIn,
      signUp,
      signOut,
    }),
    [sessao, carregando, onboardingVisto, concluirOnboarding, reverOnboarding, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
