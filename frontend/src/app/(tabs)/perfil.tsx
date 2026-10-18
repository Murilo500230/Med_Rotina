import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';

export default function PerfilScreen() {
  const { sessao, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Perfil</Text>

        <View style={styles.card}>
          <Text style={styles.rotulo}>Nome</Text>
          <Text style={styles.valor}>{sessao?.usuario.nome}</Text>
          <Text style={[styles.rotulo, { marginTop: 12 }]}>E-mail</Text>
          <Text style={styles.valor}>{sessao?.usuario.email}</Text>
        </View>

        <PrimaryButton titulo="Sair da conta" variante="secundario" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: { padding: 20, gap: 16 },
  titulo: { fontSize: 20, fontWeight: '600', color: AppColors.text },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  rotulo: { fontSize: 12, color: AppColors.textSecondary },
  valor: { fontSize: 15, fontWeight: '500', color: AppColors.text, marginTop: 2 },
});
