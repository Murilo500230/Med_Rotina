import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppColors } from '@/constants/colors';
import type { NovoMedicamento } from '@/services/medicamentos';

type Props = {
  onSubmit: (dados: NovoMedicamento) => Promise<void>;
};

const HORARIO_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function AdicionarMedicamentoForm({ onSubmit }: Props) {
  const [nome, setNome] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [horario, setHorario] = useState('');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  function adicionarHorario() {
    const horarioNormalizado = horario.trim();

    if (!HORARIO_PATTERN.test(horarioNormalizado)) {
      setErro('Informe o horário no formato HH:MM');
      return;
    }

    if (horarios.includes(horarioNormalizado)) {
      setErro('Este horário já foi adicionado');
      return;
    }

    setHorarios((atuais) => [...atuais, horarioNormalizado].sort());
    setHorario('');
    setErro('');
  }

  function removerHorario(horarioParaRemover: string) {
    setHorarios((atuais) => atuais.filter((item) => item !== horarioParaRemover));
  }

  async function enviar() {
    setErro('');
    setSucesso('');

    if (!nome.trim() || !dosagem.trim() || horarios.length === 0) {
      setErro('Preencha nome, dosagem e pelo menos um horário');
      return;
    }

    try {
      setEnviando(true);
      await onSubmit({
        nome: nome.trim(),
        dosagem: dosagem.trim(),
        horarios,
      });
      setNome('');
      setDosagem('');
      setHorario('');
      setHorarios([]);
      setSucesso('Medicamento cadastrado com sucesso');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível cadastrar o medicamento');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.formulario}>
      <View style={styles.campo}>
        <Text style={styles.label}>Nome do medicamento</Text>
        <TextInput
          accessibilityLabel="Nome do medicamento"
          autoCapitalize="words"
          editable={!enviando}
          onChangeText={setNome}
          placeholder="Ex.: Losartana"
          placeholderTextColor={AppColors.textMuted}
          style={styles.input}
          value={nome}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Dosagem</Text>
        <TextInput
          accessibilityLabel="Dosagem"
          editable={!enviando}
          onChangeText={setDosagem}
          placeholder="Ex.: 50 mg"
          placeholderTextColor={AppColors.textMuted}
          style={styles.input}
          value={dosagem}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Horários</Text>
        <View style={styles.horarioLinha}>
          <TextInput
            accessibilityLabel="Horário"
            editable={!enviando}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
            maxLength={5}
            onChangeText={setHorario}
            onSubmitEditing={adicionarHorario}
            placeholder="08:00"
            placeholderTextColor={AppColors.textMuted}
            style={[styles.input, styles.horarioInput]}
            value={horario}
          />
          <Pressable
            accessibilityRole="button"
            disabled={enviando}
            onPress={adicionarHorario}
            style={({ pressed }) => [styles.botaoSecundario, pressed && styles.botaoPressionado]}>
            <Text style={styles.botaoSecundarioTexto}>Adicionar</Text>
          </Pressable>
        </View>

        {horarios.length > 0 && (
          <View style={styles.horariosLista}>
            {horarios.map((item) => (
              <Pressable
                accessibilityHint="Remove este horário"
                accessibilityRole="button"
                key={item}
                onPress={() => removerHorario(item)}
                style={styles.horarioItem}>
                <Text style={styles.horarioTexto}>{item}  ×</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {!!erro && <Text style={styles.erro}>{erro}</Text>}
      {!!sucesso && <Text style={styles.sucesso}>{sucesso}</Text>}

      <Pressable
        accessibilityRole="button"
        disabled={enviando}
        onPress={() => enviar()}
        style={({ pressed }) => [
          styles.botaoPrincipal,
          pressed && styles.botaoPressionado,
          enviando && styles.botaoDesabilitado,
        ]}>
        {enviando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botaoPrincipalTexto}>Salvar medicamento</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: {
    gap: 18,
  },
  campo: {
    gap: 8,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: AppColors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  horarioLinha: {
    flexDirection: 'row',
    gap: 10,
  },
  horarioInput: {
    flex: 1,
  },
  botaoSecundario: {
    alignItems: 'center',
    borderColor: AppColors.primary,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  botaoSecundarioTexto: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  horariosLista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horarioItem: {
    backgroundColor: AppColors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  horarioTexto: {
    color: AppColors.primary,
    fontWeight: '600',
  },
  erro: {
    color: AppColors.danger,
    fontSize: 14,
  },
  sucesso: {
    color: AppColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  botaoPrincipal: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  botaoPrincipalTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  botaoPressionado: {
    opacity: 0.8,
  },
  botaoDesabilitado: {
    opacity: 0.65,
  },
});
