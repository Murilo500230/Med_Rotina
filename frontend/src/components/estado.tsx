// Pequenos blocos reutilizados nas telas: estado vazio, erro com "tentar de novo" e rótulo de status
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';

export function EstadoVazio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <View style={styles.vazio}>
      <Text style={styles.vazioTitulo}>{titulo}</Text>
      {texto ? <Text style={styles.vazioTexto}>{texto}</Text> : null}
    </View>
  );
}

export function ErroComRetentar({ mensagem, onRetentar }: { mensagem: string; onRetentar: () => void }) {
  return (
    <View style={styles.erroBox}>
      <Text style={styles.erroTexto}>{mensagem}</Text>
      <Pressable onPress={onRetentar} accessibilityRole="button">
        <Text style={styles.retentar}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

export function Selo({ texto, cor, fundo }: { texto: string; cor: string; fundo: string }) {
  return (
    <View style={[styles.selo, { backgroundColor: fundo }]}>
      <Text style={[styles.seloTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12, gap: 6 },
  vazioTitulo: { fontSize: 15, fontWeight: '600', color: AppColors.text, textAlign: 'center' },
  vazioTexto: { fontSize: 13, color: AppColors.textSecondary, textAlign: 'center', lineHeight: 19 },
  erroBox: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  erroTexto: { color: AppColors.danger, textAlign: 'center' },
  retentar: { color: AppColors.primary, fontWeight: '600' },
  selo: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  seloTexto: { fontSize: 11, fontWeight: '700' },
});
