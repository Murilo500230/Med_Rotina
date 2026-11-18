import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErroComRetentar, Selo } from '@/components/estado';
import { AdicionarMedicamentoForm } from '@/components/medicamentos/adicionar-medicamento-form';
import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api';
import { carregarHoje, tomarDose, type DoseApi, type PainelHoje } from '@/services/doses';
import {
  atualizarMedicamento,
  excluirMedicamento,
  listarMedicamentos,
  type Medicamento,
  type NovoMedicamento,
} from '@/services/medicamentos';
import {
  cancelarLembretesDoMedicamento,
  configurarNotificacoes,
  reagendarLembretesDoMedicamento,
  sincronizarLembretes,
} from '@/services/notificacoes';
import { agoraEmMinutos, classificar, horaLocal, horarioCurto, minutosDoDia, type StatusTela } from '@/utils/doses';
import { dataLonga, duracaoCurta } from '@/utils/formatacao';

type DoseTela = DoseApi & { tela: StatusTela };

const COR_STATUS: Record<StatusTela, string> = {
  tomada: AppColors.accent,
  pendente: AppColors.primary,
  atrasada: AppColors.danger,
  futura: AppColors.textMuted,
};

function Icone({ status }: { status: StatusTela }) {
  const simbolo = status === 'tomada' ? '✓' : status === 'futura' ? '○' : '●';
  return <Text style={{ color: COR_STATUS[status], fontSize: 18 }}>{simbolo}</Text>;
}

// T12: refaz os lembretes locais a partir da lista que veio da API
async function sincronizarSePermitido(lista: Medicamento[]) {
  try {
    const permitido = await configurarNotificacoes();
    if (permitido) {
      await sincronizarLembretes(lista);
    }
  } catch {
    // se falhar, o app segue normal; tenta de novo na próxima vez que abrir
  }
}

function montarBanner(doses: DoseTela[], agoraMin: number) {
  if (doses.length === 0) {
    return { texto: 'Nenhuma dose programada para hoje', tom: 'normal' as const };
  }
  const atrasadas = doses.filter((d) => d.tela === 'atrasada');
  if (atrasadas.length > 0) {
    return {
      texto: atrasadas.length === 1 ? '1 dose atrasada' : `${atrasadas.length} doses atrasadas`,
      detalhe: 'Tome e marque abaixo para o seu cuidador não ser avisado.',
      tom: 'alerta' as const,
    };
  }
  const pendente = doses.find((d) => d.tela === 'pendente');
  if (pendente) {
    return {
      texto: `Hora de tomar ${pendente.nome_medicamento}`,
      detalhe: `Programada para ${horarioCurto(pendente.horario)}`,
      tom: 'normal' as const,
    };
  }
  const proxima = doses.find((d) => d.tela === 'futura');
  if (proxima) {
    return {
      texto: `Próxima dose em ${duracaoCurta(minutosDoDia(proxima.horario) - agoraMin)}`,
      detalhe: `${proxima.nome_medicamento} às ${horarioCurto(proxima.horario)}`,
      tom: 'normal' as const,
    };
  }
  return { texto: 'Tudo em dia! Você tomou todas as doses de hoje.', tom: 'ok' as const };
}

export default function HomeScreen() {
  const { sessao, signOut } = useAuth();
  const token = sessao?.token;
  const [painel, setPainel] = useState<PainelHoje | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState<number | null>(null);
  const [erroAcao, setErroAcao] = useState('');
  const [emEdicao, setEmEdicao] = useState<Medicamento | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  // Alert.alert não funciona no navegador: a confirmação de exclusão aparece no próprio cartão
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);
  const primeiraCarga = useRef(true);
  const lembretesSincronizados = useRef(false);

  const tratarErro = useCallback(
    (falha: unknown, padrao: string) => {
      if (falha instanceof ApiError && falha.status === 401) {
        void signOut();
        return padrao;
      }
      return falha instanceof Error ? falha.message : padrao;
    },
    [signOut],
  );

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!token) return;
      try {
        const [hoje, lista] = await Promise.all([carregarHoje(token), listarMedicamentos(token)]);
        setPainel(hoje);
        setMedicamentos(lista);
        setErro('');

        // T12: sincroniza os lembretes só uma vez, na primeira carga com sucesso
        if (!lembretesSincronizados.current) {
          lembretesSincronizados.current = true;
          void sincronizarSePermitido(lista);
        }
      } catch (falha) {
        // Em atualizações automáticas, mantém o que já está na tela
        if (!silencioso || primeiraCarga.current) setErro(tratarErro(falha, 'Não foi possível carregar as doses'));
      } finally {
        primeiraCarga.current = false;
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [token, tratarErro],
  );

  // Recarrega ao voltar para a tela e a cada minuto, para os status acompanharem o relógio
  useFocusEffect(
    useCallback(() => {
      void carregar(true);
      const intervalo = setInterval(() => void carregar(true), 60_000);
      return () => clearInterval(intervalo);
    }, [carregar]),
  );

  async function marcar(dose: DoseApi) {
    if (!token || processando !== null) return;
    setProcessando(dose.id);
    setErroAcao('');
    try {
      await tomarDose(dose.id, token);
      await carregar(true);
    } catch (falha) {
      setErroAcao(tratarErro(falha, 'Não foi possível marcar a dose'));
    } finally {
      setProcessando(null);
    }
  }

  // T16: salva a edição e reagenda os lembretes com os novos horários
  async function salvarEdicao(dados: NovoMedicamento) {
    if (!token || !emEdicao) return;

    await atualizarMedicamento(emEdicao.id, dados, token);

    try {
      const permitido = await configurarNotificacoes();
      if (permitido) {
        await reagendarLembretesDoMedicamento(
          { id: emEdicao.id, nome: dados.nome, dosagem: dados.dosagem },
          dados.horarios,
        );
      }
    } catch {
      // o medicamento já foi salvo; segue o fluxo mesmo se o lembrete falhar
    }

    setEmEdicao(null);
    await carregar(true);
  }

  async function excluir(medicamento: Medicamento) {
    if (!token || excluindo !== null) return;
    setExcluindo(medicamento.id);
    setErroAcao('');
    try {
      await excluirMedicamento(medicamento.id, token);
      setConfirmandoExclusao(null);

      try {
        await cancelarLembretesDoMedicamento(medicamento.id);
      } catch {
        // o medicamento já foi excluído; segue o fluxo
      }

      await carregar(true);
    } catch (falha) {
      setErroAcao(tratarErro(falha, 'Não foi possível excluir o medicamento'));
    } finally {
      setExcluindo(null);
    }
  }

  const primeiroNome = sessao?.usuario.nome.split(' ')[0] || 'usuário';
  const agoraMin = painel ? agoraEmMinutos(painel.fuso) : 0;
  const doses: DoseTela[] = painel ? painel.doses.map((d) => ({ ...d, tela: classificar(d, agoraMin) })) : [];
  const tomadas = doses.filter((d) => d.tela === 'tomada').length;
  const banner = painel ? montarBanner(doses, agoraMin) : null;
  const progresso = doses.length > 0 ? tomadas / doses.length : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              void carregar(true);
            }}
          />
        }>
        <View style={styles.header}>
          <Text style={styles.saudacao}>Olá, {primeiroNome}</Text>
          <Text style={styles.titulo}>{painel ? `Hoje, ${dataLonga(painel.data)}` : 'Hoje'}</Text>
        </View>

        {carregando ? <ActivityIndicator color={AppColors.primary} /> : null}
        {erro && !painel ? <ErroComRetentar mensagem={erro} onRetentar={() => void carregar()} /> : null}

        {banner ? (
          <View
            style={[
              styles.banner,
              banner.tom === 'alerta' && styles.bannerAlerta,
              banner.tom === 'ok' && styles.bannerOk,
            ]}>
            <Text
              style={[
                styles.bannerTexto,
                banner.tom === 'alerta' && { color: AppColors.danger },
                banner.tom === 'ok' && { color: '#0B7A60' },
              ]}>
              {banner.texto}
            </Text>
            {'detalhe' in banner && banner.detalhe ? <Text style={styles.bannerDetalhe}>{banner.detalhe}</Text> : null}
          </View>
        ) : null}

        {doses.length > 0 ? (
          <View style={styles.progressoBloco}>
            <View style={styles.progressoTrilho}>
              <View style={[styles.progressoBarra, { width: `${Math.round(progresso * 100)}%` }]} />
            </View>
            <Text style={styles.progressoTexto}>
              {tomadas} de {doses.length} doses tomadas hoje
            </Text>
          </View>
        ) : null}

        {painel ? <Text style={styles.subtitulo}>Doses de hoje</Text> : null}
        {erroAcao ? <Text style={styles.erroAcao}>{erroAcao}</Text> : null}

        {painel && doses.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhuma dose por aqui ainda</Text>
            <Text style={styles.vazioTexto}>
              Cadastre um medicamento com seus horários e as doses do dia aparecem nesta tela.
            </Text>
          </View>
        ) : null}

        {doses.map((dose) => (
          <View
            key={dose.id}
            style={[styles.card, dose.tela === 'atrasada' && styles.cardAtrasado]}
            accessibilityLabel={`${dose.nome_medicamento} ${dose.dosagem}, ${horarioCurto(dose.horario)}, ${dose.tela}`}>
            <View style={styles.iconeWrapper}>
              <Icone status={dose.tela} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeMedicamento}>
                {dose.nome_medicamento} {dose.dosagem}
              </Text>
              <Text style={styles.horario}>
                {horarioCurto(dose.horario)}
                {dose.tela === 'tomada' && dose.tomada_em && painel
                  ? `  ·  tomada às ${horaLocal(dose.tomada_em, painel.fuso)}`
                  : ''}
                {dose.tela === 'futura' ? '  ·  ainda não chegou' : ''}
              </Text>
              {dose.tela === 'atrasada' ? (
                <View style={styles.selo}>
                  <Selo texto="ATRASADA" cor={AppColors.danger} fundo="#FBE9E9" />
                </View>
              ) : null}
            </View>

            {dose.tela === 'pendente' || dose.tela === 'atrasada' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Marcar ${dose.nome_medicamento} como tomada`}
                disabled={processando !== null}
                onPress={() => void marcar(dose)}
                style={[styles.botaoMarcar, processando === dose.id && { opacity: 0.6 }]}>
                {processando === dose.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.botaoMarcarTexto}>Marcar</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ))}

        {painel ? <Text style={styles.subtitulo}>Seus medicamentos</Text> : null}

        {painel && medicamentos.length === 0 ? (
          <Text style={styles.vazioTexto}>Nenhum medicamento cadastrado ainda.</Text>
        ) : null}

        {medicamentos.map((medicamento) => (
          <View key={medicamento.id} style={styles.card}>
            <View style={styles.iconeWrapper}>
              <Text style={{ color: AppColors.primary, fontSize: 18 }}>●</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeMedicamento}>
                {medicamento.nome} {medicamento.dosagem}
              </Text>
              <Text style={styles.horario}>
                {medicamento.horarios.length > 0 ? medicamento.horarios.join(' • ') : medicamento.frequencia}
              </Text>
              {confirmandoExclusao === medicamento.id ? (
                <View style={styles.confirmacao}>
                  <Text style={styles.confirmacaoTexto}>
                    Excluir {medicamento.nome}? Os lembretes e as doses de hoje dele também serão removidos.
                  </Text>
                  <View style={styles.acoes}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={excluindo !== null}
                      onPress={() => setConfirmandoExclusao(null)}>
                      <Text style={styles.acaoCancelar}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Confirmar exclusão de ${medicamento.nome}`}
                      disabled={excluindo !== null}
                      onPress={() => void excluir(medicamento)}>
                      {excluindo === medicamento.id ? (
                        <ActivityIndicator color={AppColors.danger} size="small" />
                      ) : (
                        <Text style={styles.acaoExcluir}>Sim, excluir</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.acoes}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${medicamento.nome}`}
                    disabled={excluindo !== null}
                    onPress={() => setEmEdicao(medicamento)}>
                    <Text style={styles.acaoEditar}>Editar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${medicamento.nome}`}
                    disabled={excluindo !== null}
                    onPress={() => setConfirmandoExclusao(medicamento.id)}>
                    <Text style={styles.acaoExcluir}>Excluir</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}

        <View style={{ marginTop: 8 }}>
          <PrimaryButton
            titulo="+ Adicionar medicamento"
            variante="secundario"
            onPress={() => router.push('/adicionar-medicamento')}
          />
        </View>
      </ScrollView>

      <Modal visible={emEdicao !== null} animationType="slide" onRequestClose={() => setEmEdicao(null)}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.titulo}>Editar medicamento</Text>
            {emEdicao ? (
              <AdicionarMedicamentoForm
                key={emEdicao.id}
                inicial={{
                  nome: emEdicao.nome,
                  dosagem: emEdicao.dosagem,
                  horarios: emEdicao.horarios,
                }}
                rotuloBotao="Salvar alterações"
                limparAoSalvar={false}
                onSubmit={salvarEdicao}
              />
            ) : null}
            <PrimaryButton titulo="Cancelar" variante="secundario" onPress={() => setEmEdicao(null)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: { padding: 20, gap: 12 },
  header: { marginBottom: 4 },
  saudacao: { fontSize: 13, color: AppColors.textSecondary },
  titulo: { fontSize: 20, fontWeight: '600', color: AppColors.text },
  banner: { backgroundColor: AppColors.primaryLight, borderRadius: 12, padding: 14, gap: 2 },
  bannerAlerta: { backgroundColor: '#FBE9E9' },
  bannerOk: { backgroundColor: '#E1F7EF' },
  bannerTexto: { color: AppColors.primary, fontWeight: '600', fontSize: 15 },
  bannerDetalhe: { color: AppColors.textSecondary, fontSize: 13 },
  progressoBloco: { gap: 6 },
  progressoTrilho: { height: 6, borderRadius: 3, backgroundColor: AppColors.border, overflow: 'hidden' },
  progressoBarra: { height: 6, backgroundColor: AppColors.accent },
  progressoTexto: { fontSize: 12, color: AppColors.textSecondary },
  subtitulo: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4 },
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
  cardAtrasado: { borderColor: '#F0BDBD' },
  iconeWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomeMedicamento: { fontSize: 15, fontWeight: '600', color: AppColors.text },
  horario: { fontSize: 13, color: AppColors.textSecondary, marginTop: 2 },
  selo: { marginTop: 4, alignSelf: 'flex-start' },
  botaoMarcar: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 70,
    alignItems: 'center',
  },
  botaoMarcarTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  acoes: { flexDirection: 'row', gap: 18, marginTop: 8 },
  acaoEditar: { fontSize: 13, fontWeight: '600', color: AppColors.primary },
  acaoExcluir: { fontSize: 13, fontWeight: '600', color: AppColors.danger },
  acaoCancelar: { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary },
  confirmacao: { marginTop: 8, gap: 8, backgroundColor: '#FBE9E9', borderRadius: 8, padding: 10 },
  confirmacaoTexto: { color: AppColors.text, fontSize: 13, lineHeight: 18 },
  erroAcao: { color: AppColors.danger, fontSize: 13 },
  vazio: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  vazioTitulo: { fontSize: 15, fontWeight: '600', color: AppColors.text },
  vazioTexto: { fontSize: 13, color: AppColors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
