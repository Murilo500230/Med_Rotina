import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';

type Medicamento = {
  id: string;
  nome: string;
  dosagem: string;
  horario: string;
  status: 'tomado' | 'pendente' | 'futuro';
};

// Dados de exemplo (mock) - serão substituídos pela chamada à API (T4) quando estiver pronta
const medicamentosMock: Medicamento[] = [
  { id: '1', nome: 'Losartana', dosagem: '50mg', horario: '08:00', status: 'tomado' },
  { id: '2', nome: 'Metformina', dosagem: '850mg', horario: '13:00 - com almoço', status: 'pendente' },
  { id: '3', nome: 'Sinvastatina', dosagem: '20mg', horario: '21:00 - antes de dormir', status: 'futuro' },
];

function IconePorStatus({ status }: { status: Medicamento['status'] }) {
  if (status === 'tomado') return <Text style={{ color: AppColors.accent, fontSize: 18 }}>✓</Text>;
  if (status === 'pendente') return <Text style={{ color: AppColors.primary, fontSize: 18 }}>●</Text>;
  return <Text style={{ color: AppColors.textSecondary, fontSize: 18 }}>○</Text>;
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.saudacao}>Olá, Murilo</Text>
          <Text style={styles.titulo}>Hoje, terça-feira</Text>
        </View>

        <View style={styles.bannerDestaque}>
          <Text style={styles.bannerTexto}>Próxima dose em 45 min</Text>
        </View>

        <Text style={styles.subtitulo}>Doses de hoje</Text>

        {medicamentosMock.map((med) => (
          <View key={med.id} style={styles.card}>
            <View style={styles.iconeWrapper}>
              <IconePorStatus status={med.status} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeMedicamento}>
                {med.nome} {med.dosagem}
              </Text>
              <Text style={styles.horario}>{med.horario}</Text>
            </View>
            {med.status === 'pendente' && (
              <TouchableOpacity style={styles.botaoMarcar}>
                <Text style={styles.botaoMarcarTexto}>Marcar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  container: {
    padding: 20,
    gap: 12,
  },
  header: {
    marginBottom: 8,
  },
  saudacao: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text,
  },
  bannerDestaque: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  bannerTexto: {
    color: AppColors.primary,
    fontWeight: '500',
  },
  subtitulo: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  iconeWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomeMedicamento: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
  },
  horario: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  botaoMarcar: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  botaoMarcarTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});