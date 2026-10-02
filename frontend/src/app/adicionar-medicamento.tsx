import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdicionarMedicamentoForm } from '@/components/medicamentos/adicionar-medicamento-form';
import { AppColors } from '@/constants/colors';
import { obterAuthToken } from '@/services/auth-session';
import { cadastrarMedicamento, type NovoMedicamento } from '@/services/medicamentos';

export default function AdicionarMedicamentoScreen() {
  async function salvarMedicamento(dados: NovoMedicamento) {
    const token = obterAuthToken();

    if (!token) {
      throw new Error('Faça login novamente antes de cadastrar um medicamento');
    }

    await cadastrarMedicamento(dados, token);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>Adicionar medicamento</Text>
          <Text style={styles.descricao}>
            Informe o medicamento, a dosagem e os horários em que ele deve ser tomado.
          </Text>
        </View>

        <AdicionarMedicamentoForm onSubmit={salvarMedicamento} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: AppColors.background,
    flex: 1,
  },
  container: {
    gap: 24,
    padding: 20,
  },
  cabecalho: {
    gap: 6,
  },
  titulo: {
    color: AppColors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  descricao: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
