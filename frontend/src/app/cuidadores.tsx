// T15 — Tela de cuidadores: listar, adicionar, editar e remover (integrada à API T13)
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CuidadorForm } from '@/components/cuidadores/cuidador-form';
import { ErroComRetentar, EstadoVazio } from '@/components/estado';
import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api';
import {
  atualizarCuidador,
  cadastrarCuidador,
  excluirCuidador,
  listarCuidadores,
  type Cuidador,
  type DadosCuidador,
} from '@/services/cuidadores';

// "novo" abre o formulário vazio; um cuidador abre a edição; null fecha o modal
type Edicao = 'novo' | Cuidador | null;

export default function CuidadoresScreen() {
  const { sessao, signOut } = useAuth();
  const token = sessao?.token;

  const [cuidadores, setCuidadores] = useState<Cuidador[] | null>(null);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [edicao, setEdicao] = useState<Edicao>(null);
  const [removendo, setRemovendo] = useState<Cuidador | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  // Sessão expirada: o token não vale mais, volta para o login
  const tratarFalha = useCallback(
    (falha: unknown, padrao: string) => {
      if (falha instanceof ApiError && falha.status === 401) void signOut();
      return falha instanceof Error ? falha.message : padrao;
    },
    [signOut],
  );

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      setCuidadores(await listarCuidadores(token));
      setErro('');
    } catch (falha) {
      setErro(tratarFalha(falha, 'Não foi possível carregar os cuidadores.'));
    } finally {
      setAtualizando(false);
    }
  }, [token, tratarFalha]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  async function salvar(dados: DadosCuidador) {
    if (!token) throw new Error('Faça login novamente.');
    try {
      if (edicao && edicao !== 'novo') {
        await atualizarCuidador(edicao.id, dados, token);
      } else {
        await cadastrarCuidador(dados, token);
      }
    } catch (falha) {
      throw new Error(tratarFalha(falha, 'Não foi possível salvar o cuidador.'));
    }
    setEdicao(null);
    await carregar();
  }

  async function confirmarRemocao() {
    if (!token || !removendo) return;
    setExcluindo(true);
    setErroExclusao('');
    try {
      await excluirCuidador(removendo.id, token);
      setRemovendo(null);
      await carregar();
    } catch (falha) {
      setErroExclusao(tratarFalha(falha, 'Não foi possível remover o cuidador.'));
    } finally {
      setExcluindo(false);
    }
  }

  function fecharRemocao() {
    if (excluindo) return;
    setRemovendo(null);
    setErroExclusao('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              void carregar();
            }}
          />
        }>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={8}
          style={styles.voltar}>
          <Text style={styles.voltarTexto}>‹ Voltar</Text>
        </Pressable>

        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>Cuidadores</Text>
          <Text style={styles.descricao}>
            Quando uma dose não é confirmada a tempo, seus cuidadores recebem um aviso automático.
          </Text>
        </View>

        {!cuidadores && !erro ? <ActivityIndicator color={AppColors.primary} /> : null}
        {erro && !cuidadores ? <ErroComRetentar mensagem={erro} onRetentar={() => void carregar()} /> : null}

        {cuidadores ? (
          <>
            <PrimaryButton titulo="Adicionar cuidador" onPress={() => setEdicao('novo')} />

            {erro ? <Text style={styles.erroLista}>{erro}</Text> : null}

            {cuidadores.length === 0 ? (
              <EstadoVazio
                titulo="Nenhum cuidador cadastrado"
                texto="Adicione alguém de confiança para ser avisado caso você esqueça de tomar uma dose."
              />
            ) : (
              cuidadores.map((c) => (
                <View key={c.id} style={styles.card}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.nome} numberOfLines={1}>
                      {c.nome}
                    </Text>
                    <Text style={styles.contato} numberOfLines={1}>
                      {c.contato}
                    </Text>
                  </View>
                  <View style={styles.cardAcoes}>
                    <Pressable
                      onPress={() => setEdicao(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${c.nome}`}
                      hitSlop={6}>
                      <Text style={styles.acaoEditar}>Editar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setRemovendo(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${c.nome}`}
                      hitSlop={6}>
                      <Text style={styles.acaoRemover}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Cadastro / edição */}
      <Modal visible={edicao !== null} transparent animationType="slide" onRequestClose={() => setEdicao(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fundoModal}>
          <View style={styles.painel}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {edicao !== null ? (
                <CuidadorForm
                  // key garante campos novos ao alternar entre cadastro e edição de outro cuidador
                  key={edicao === 'novo' ? 'novo' : edicao.id}
                  cuidador={edicao === 'novo' ? null : edicao}
                  onSalvar={salvar}
                  onCancelar={() => setEdicao(null)}
                />
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmação de remoção (Alert.alert não funciona na web) */}
      <Modal visible={removendo !== null} transparent animationType="fade" onRequestClose={fecharRemocao}>
        <View style={[styles.fundoModal, styles.centro]}>
          <View style={styles.dialogo}>
            <Text style={styles.dialogoTitulo}>Remover cuidador?</Text>
            <Text style={styles.dialogoTexto}>
              {removendo?.nome} deixará de receber avisos sobre suas doses.
            </Text>
            {erroExclusao ? <Text style={styles.erroLista}>{erroExclusao}</Text> : null}
            <View style={styles.dialogoAcoes}>
              <PrimaryButton titulo="Remover" onPress={() => void confirmarRemocao()} carregando={excluindo} />
              {excluindo ? null : <PrimaryButton titulo="Cancelar" variante="secundario" onPress={fecharRemocao} />}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: { padding: 20, gap: 14 },
  voltar: { alignSelf: 'flex-start', paddingVertical: 4 },
  voltarTexto: { color: AppColors.primary, fontSize: 15, fontWeight: '600' },
  cabecalho: { gap: 6 },
  titulo: { fontSize: 24, fontWeight: '700', color: AppColors.text },
  descricao: { fontSize: 14, lineHeight: 20, color: AppColors.textSecondary },
  erroLista: { fontSize: 13, color: AppColors.danger },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
  },
  cardInfo: { flex: 1, gap: 2 },
  nome: { fontSize: 15, fontWeight: '600', color: AppColors.text },
  contato: { fontSize: 13, color: AppColors.textSecondary },
  cardAcoes: { alignItems: 'flex-end', gap: 10 },
  acaoEditar: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
  acaoRemover: { fontSize: 13, fontWeight: '600', color: AppColors.danger },
  fundoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(27, 37, 40, 0.45)' },
  centro: { justifyContent: 'center', padding: 24 },
  painel: {
    maxHeight: '90%',
    backgroundColor: AppColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  dialogo: { backgroundColor: AppColors.surface, borderRadius: 14, padding: 20, gap: 10 },
  dialogoTitulo: { fontSize: 17, fontWeight: '700', color: AppColors.text },
  dialogoTexto: { fontSize: 14, lineHeight: 20, color: AppColors.textSecondary },
  dialogoAcoes: { gap: 10, marginTop: 6 },
});
