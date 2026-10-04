import { Stack } from 'expo-router';

import { AppColors } from '@/constants/colors';

// Stack do fluxo de autenticação: login -> cadastro
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: AppColors.background },
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
    </Stack>
  );
}
