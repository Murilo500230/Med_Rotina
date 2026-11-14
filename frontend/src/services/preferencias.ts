import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Preferências simples por usuário (ex.: já viu a introdução?). Mesma lógica do token-storage.
const chave = (usuarioId: number) => `medrotina.onboarding.${usuarioId}`;

export async function lerOnboardingVisto(usuarioId: number): Promise<boolean> {
  try {
    const valor =
      Platform.OS === 'web'
        ? localStorage.getItem(chave(usuarioId))
        : await SecureStore.getItemAsync(chave(usuarioId));
    return valor === '1';
  } catch {
    return false;
  }
}

export async function salvarOnboardingVisto(usuarioId: number, visto: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (visto) localStorage.setItem(chave(usuarioId), '1');
      else localStorage.removeItem(chave(usuarioId));
      return;
    }
    if (visto) await SecureStore.setItemAsync(chave(usuarioId), '1');
    else await SecureStore.deleteItemAsync(chave(usuarioId));
  } catch {
    // preferência é opcional: se falhar, o app segue normalmente
  }
}
