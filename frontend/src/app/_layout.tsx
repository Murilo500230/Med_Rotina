import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { configurarNotificacoes } from '@/services/notificacoes';

SplashScreen.preventAutoHideAsync();

// Decide qual grupo de telas fica disponível conforme o usuário esteja logado ou não
function RootNavigator() {
  const { sessao, carregando, onboardingVisto } = useAuth();

  // Pede permissão de notificações assim que o usuário estiver logado
  useEffect(() => {
    if (sessao) {
      configurarNotificacoes();
    }
  }, [sessao]);

  // Enquanto a sessão salva é restaurada (e a preferência do usuário lida), mantém só a splash na tela
  if (carregando || (sessao && onboardingVisto === null)) return <AnimatedSplashOverlay />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!sessao && onboardingVisto === false}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!!sessao && onboardingVisto === true}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!sessao}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
