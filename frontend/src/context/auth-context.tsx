import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { cadastrar, entrar, type Usuario } from '@/services/api';
import { apagarSessao, lerSessao, salvarSessao } from '@/services/token-storage';

type Sessao = { token: string; usuario: Usuario };

type AuthContextValue = {
  sessao: Sessao | null;
  carregando: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (nome: string, email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura a sessão salva ao abrir o app
  useEffect(() => {
    lerSessao()
      .then((salva) => {
        if (salva) setSessao(JSON.parse(salva) as Sessao);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

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
  }, []);

  const value = useMemo(
    () => ({ sessao, carregando, signIn, signUp, signOut }),
    [sessao, carregando, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
