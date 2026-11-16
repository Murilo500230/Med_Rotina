import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
  return (primeira + ultima).toUpperCase();
}

export default function PerfilScreen() {
  const { sessao, signOut, reverOnboarding } = useAuth();
  const nome = sessao?.usuario.nome ?? '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Perfil</Text>

        <View style={styles.cabecalho}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciais(nome)}</Text>
          </View>
          <Text style={styles.nome}>{nome}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.rotulo}>Nome</Text>
          <Text style={styles.valor}>{nome}</Text>
          <Text style={[styles.rotulo, { marginTop: 12 }]}>E-mail</Text>
          <Text style={styles.valor}>{sessao?.usuario.email}</Text>
        </View>

        <PrimaryButton titulo="Meus cuidadores" variante="secundario" onPress={() => router.push('/cuidadores')} />
        <PrimaryButton titulo="Ver introdução novamente" variante="secundario" onPress={() => void reverOnboarding()} />
        <PrimaryButton titulo="Sair da conta" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: { padding: 20, gap: 16 },
  titulo: { fontSize: 20, fontWeight: '600', color: AppColors.text },
  cabecalho: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: 26, fontWeight: '700', color: AppColors.primary },
  nome: { fontSize: 17, fontWeight: '600', color: AppColors.text },
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
