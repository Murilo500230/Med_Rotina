import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore não existe na web; lá usamos localStorage (apenas para testes no navegador).
const CHAVE = 'medrotina.sessao';

export async function salvarSessao(valor: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(CHAVE, valor);
    return;
  }
  await SecureStore.setItemAsync(CHAVE, valor);
}

export async function lerSessao(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(CHAVE);
  }
  return SecureStore.getItemAsync(CHAVE);
}

export async function apagarSessao() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(CHAVE);
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE);
}
