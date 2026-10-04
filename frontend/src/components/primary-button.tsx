import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { AppColors } from '@/constants/colors';

type Props = {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  variante?: 'primario' | 'secundario';
};

export function PrimaryButton({ titulo, onPress, carregando = false, variante = 'primario' }: Props) {
  const secundario = variante === 'secundario';
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.botao,
        secundario ? styles.secundario : styles.primario,
        (pressed || carregando) && styles.apagado,
      ]}>
      {carregando ? (
        <ActivityIndicator color={secundario ? AppColors.primary : '#fff'} />
      ) : (
        <Text style={[styles.texto, secundario && styles.textoSecundario]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primario: { backgroundColor: AppColors.primary },
  secundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: AppColors.primary },
  apagado: { opacity: 0.7 },
  texto: { color: '#fff', fontSize: 15, fontWeight: '600' },
  textoSecundario: { color: AppColors.primary },
});
