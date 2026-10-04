import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AppColors } from '@/constants/colors';

type Props = TextInputProps & {
  label: string;
  erro?: string;
};

export function FormField({ label, erro, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={AppColors.textMuted}
        style={[styles.input, erro ? styles.inputErro : null, style]}
        accessibilityLabel={label}
        {...props}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: AppColors.textSecondary },
  input: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.text,
  },
  inputErro: { borderColor: AppColors.danger },
  erro: { fontSize: 12, color: AppColors.danger },
});
