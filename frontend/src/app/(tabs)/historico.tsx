import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoVazio, ErroComRetentar } from '@/components/estado';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/services/api';
import { carregarHistorico, type DoseApi, type Historico } from '@/services/doses';
import { horaLocal, horarioCurto } from '@/utils/doses';
import { dataCurta, diaDaSemana } from '@/utils/formatacao';

const PERIODOS = [7, 30] as const;

function corAdesao(pct: number | null) {
  if (pct === null) return AppColors.textMuted;
  if (pct >= 80) return AppColors.accent;
  if (pct >= 50) return AppColors.primary;
  return AppColors.danger;
}

function textoDose(dose: DoseApi, hoje: boolean, fuso: string) {
  if (dose.status === 'tomada') return dose.tomada_em ? `Tomada às ${horaLocal(dose.tomada_em, fuso)}` : 'Tomada';
  if (dose.status === 'atrasada') return hoje ? 'Atrasada' : 'Não tomada';
  return 'Aguardando';
}

export default function HistoricoScreen() {
  const { sessao, signOut } = useAuth();
  const token = sessao?.token;
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(7);
  const [dados, setDados] = useState<Historico | null>(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      setDados(await carregarHistorico(token, dias));
      setErro('');
    } catch (falha) {
      if (falha instanceof ApiError && falha.status === 401) void signOut();
      setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar o histórico');
    } finally {
      setAtualizando(false);
    }
  }, [token, dias, signOut]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  const adesao = dados?.resumo.adesao ?? null;
  const hoje = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

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
        <Text style={styles.titulo}>Histórico de adesão</Text>

        <View style={styles.periodos}>
          {PERIODOS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setDias(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: dias === p }}
              style={[styles.periodo, dias === p && styles.periodoAtivo]}>
              <Text style={[styles.periodoTexto, dias === p && styles.periodoTextoAtivo]}>Últimos {p} dias</Text>
            </Pressable>
          ))}
        </View>

        {!dados && !erro ? <ActivityIndicator color={AppColors.primary} /> : null}
        {erro && !dados ? <ErroComRetentar mensagem={erro} onRetentar={() => void carregar()} /> : null}

        {dados ? (
          <View style={styles.resumo}>
            <Text style={[styles.resumoValor, { color: corAdesao(adesao) }]}>
              {adesao === null ? '—' : `${adesao}%`}
            </Text>
            <Text style={styles.resumoTexto}>
              {adesao === null
                ? 'Ainda não há doses vencidas neste período.'
                : `de adesão: ${dados.resumo.tomadas} de ${dados.resumo.vencidas} doses tomadas`}
            </Text>
          </View>
        ) : null}

        {dados && dados.historico.length === 0 ? (
          <EstadoVazio
            titulo="Nada para mostrar ainda"
            texto="Assim que você cadastrar medicamentos e marcar as doses, o histórico aparece aqui."
          />
        ) : null}

        {dados?.historico.map((dia) => {
          const expandido = aberto === dia.data;
          const ehHoje = dia.data === hoje;
          return (
            <View key={dia.data} style={styles.dia}>
              <Pressable
                onPress={() => setAberto(expandido ? null : dia.data)}
                accessibilityRole="button"
                accessibilityLabel={`${diaDaSemana(dia.data)} ${dataCurta(dia.data)}`}
                style={styles.diaTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.diaNome}>
                    {ehHoje ? 'Hoje' : diaDaSemana(dia.data)} · {dataCurta(dia.data)}
                  </Text>
                  <Text style={styles.diaDetalhe}>
                    {dia.tomadas} de {dia.total} {dia.total === 1 ? 'dose tomada' : 'doses tomadas'}
                    {dia.atrasadas > 0 ? ` · ${dia.atrasadas} ${dia.atrasadas === 1 ? 'atrasada' : 'atrasadas'}` : ''}
                    {dia.pendentes > 0 ? ` · ${dia.pendentes} ${dia.pendentes === 1 ? 'pendente' : 'pendentes'}` : ''}
                  </Text>
                </View>
                <Text style={[styles.diaPct, { color: corAdesao(dia.adesao) }]}>
                  {dia.adesao === null ? '—' : `${dia.adesao}%`}
                </Text>
                <Text style={styles.seta}>{expandido ? '▴' : '▾'}</Text>
              </Pressable>

              {expandido ? (
                <View style={styles.detalhes}>
                  {dia.doses.map((d) => (
                    <View key={d.id} style={styles.linhaDose}>
                      <Text style={styles.linhaHora}>{horarioCurto(d.horario)}</Text>
                      <Text style={styles.linhaNome} numberOfLines={1}>
                        {d.nome_medicamento} {d.dosagem}
                      </Text>
                      <Text
                        style={[
                          styles.linhaStatus,
                          d.status === 'tomada' && { color: '#0B7A60' },
                          d.status === 'atrasada' && { color: AppColors.danger },
                        ]}>
                        {textoDose(d, ehHoje, dados.fuso)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {dados ? (
          <Text style={styles.rodape}>
            A adesão considera só as doses cujo horário já passou. Dias em que o app não foi aberto não geram
            registro de doses.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: { padding: 20, gap: 12 },
  titulo: { fontSize: 20, fontWeight: '600', color: AppColors.text },
  periodos: { flexDirection: 'row', gap: 8 },
  periodo: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: AppColors.surface,
  },
  periodoAtivo: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  periodoTexto: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600' },
  periodoTextoAtivo: { color: '#fff' },
  resumo: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    alignItems: 'center',
    gap: 2,
  },
  resumoValor: { fontSize: 38, fontWeight: '700' },
  resumoTexto: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center' },
  dia: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  diaTopo: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  diaNome: { fontSize: 14, fontWeight: '600', color: AppColors.text },
  diaDetalhe: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  diaPct: { fontSize: 16, fontWeight: '700' },
  seta: { color: AppColors.textMuted, fontSize: 12 },
  detalhes: { borderTopWidth: 1, borderTopColor: AppColors.border, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  linhaDose: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linhaHora: { width: 42, fontSize: 13, color: AppColors.textSecondary },
  linhaNome: { flex: 1, fontSize: 13, color: AppColors.text },
  linhaStatus: { fontSize: 12, color: AppColors.textSecondary },
  rodape: { fontSize: 11, color: AppColors.textMuted, lineHeight: 16, marginTop: 4 },
});
