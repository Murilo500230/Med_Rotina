// Formulário de cuidador (cadastro e edição) exibido dentro de um modal
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import type { Cuidador, DadosCuidador } from '@/services/cuidadores';
import { validarContatoCuidador, validarNomeCuidador } from '@/utils/validacao';

type Props = {
  // Quando informado, o formulário entra em modo de edição
  cuidador?: Cuidador | null;
  onSalvar: (dados: DadosCuidador) => Promise<void>;
  onCancelar: () => void;
};

export function CuidadorForm({ cuidador, onSalvar, onCancelar }: Props) {
  const [nome, setNome] = useState(cuidador?.nome ?? '');
  const [contato, setContato] = useState(cuidador?.contato ?? '');
  const [erros, setErros] = useState<{ nome?: string; contato?: string }>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    const novosErros = {
      nome: validarNomeCuidador(nome),
      contato: validarContatoCuidador(contato),
    };
    setErros(novosErros);
    setErroGeral('');
    if (novosErros.nome || novosErros.contato) return;

    try {
      setEnviando(true);
      await onSalvar({ nome: nome.trim(), contato: contato.trim() });
    } catch (falha) {
      setErroGeral(falha instanceof Error ? falha.message : 'Não foi possível salvar o cuidador.');
      setEnviando(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.titulo}>{cuidador ? 'Editar cuidador' : 'Adicionar cuidador'}</Text>

      <FormField
        label="Nome"
        value={nome}
        onChangeText={setNome}
        placeholder="Ex.: Maria de Lourdes"
        autoCapitalize="words"
        editable={!enviando}
        erro={erros.nome}
      />

      <FormField
        label="E-mail ou telefone"
        value={contato}
        onChangeText={setContato}
        placeholder="maria@email.com ou (77) 98888-7777"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        editable={!enviando}
        erro={erros.contato}
      />

      <Text style={styles.ajuda}>
        É para este contato que o aviso é enviado quando uma dose não é confirmada a tempo.
      </Text>

      {erroGeral ? <Text style={styles.erro}>{erroGeral}</Text> : null}

      <View style={styles.acoes}>
        <PrimaryButton titulo={cuidador ? 'Salvar alterações' : 'Salvar cuidador'} onPress={() => void salvar()} carregando={enviando} />
        {enviando ? null : <PrimaryButton titulo="Cancelar" variante="secundario" onPress={onCancelar} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  titulo: { fontSize: 18, fontWeight: '700', color: AppColors.text },
  ajuda: { fontSize: 12, color: AppColors.textSecondary, lineHeight: 17 },
  erro: { fontSize: 13, color: AppColors.danger },
  acoes: { gap: 10, marginTop: 4 },
});
