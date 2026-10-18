import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { listarMedicamentos, type Medicamento } from '@/services/medicamentos';

export default function HomeScreen() {
  const { sessao } = useAuth();
  const token = sessao?.token;
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarMedicamentos = useCallback(async () => {
    if (!token) return;
    setCarregando(true);
    setErro('');
    try {
      const lista = await listarMedicamentos(token);
      setMedicamentos(lista);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar os medicamentos');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void carregarMedicamentos();
    }, [carregarMedicamentos]),
  );

  const primeiroNome = sessao?.usuario.nome.split(' ')[0] || 'usuário';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.saudacao}>Olá, {primeiroNome}</Text>
          <Text style={styles.titulo}>Seus medicamentos</Text>
        </View>

        <View style={styles.bannerDestaque}>
          <Text style={styles.bannerTexto}>
            {medicamentos.length === 0
              ? 'Cadastre seu primeiro medicamento'
              : `${medicamentos.length} medicamento${medicamentos.length === 1 ? '' : 's'} cadastrado${medicamentos.length === 1 ? '' : 's'}`}
          </Text>
        </View>

        {carregando ? <ActivityIndicator color={AppColors.primary} /> : null}

        {erro ? (
          <View style={styles.estadoVazio}>
            <Text style={styles.erro}>{erro}</Text>
            <TouchableOpacity onPress={() => void carregarMedicamentos()}>
              <Text style={styles.tentarNovamente}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!carregando && !erro && medicamentos.length === 0 ? (
          <Text style={styles.estadoVazioTexto}>Nenhum medicamento cadastrado ainda.</Text>
        ) : null}

        {!erro && medicamentos.map((medicamento) => (
          <View key={medicamento.id} style={styles.card}>
            <View style={styles.iconeWrapper}>
              <Text style={styles.icone}>●</Text>
            </View>
            <View style={styles.cardConteudo}>
              <Text style={styles.nomeMedicamento}>
                {medicamento.nome} {medicamento.dosagem}
              </Text>
              <Text style={styles.horario}>
                {medicamento.horarios.length > 0
                  ? medicamento.horarios.join(' • ')
                  : medicamento.frequencia}
              </Text>
            </View>
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
  cardConteudo: {
    flex: 1,
  },
  iconeWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icone: {
    color: AppColors.primary,
    fontSize: 18,
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
  estadoVazio: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  estadoVazioTexto: {
    color: AppColors.textSecondary,
    paddingVertical: 20,
    textAlign: 'center',
  },
  erro: {
    color: AppColors.danger,
    textAlign: 'center',
  },
  tentarNovamente: {
    color: AppColors.primary,
    fontWeight: '600',
  },
});
