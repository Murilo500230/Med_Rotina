import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { validarConfirmacao, validarEmail, validarNome, validarSenha } from '@/utils/validacao';

type Erros = { nome?: string; email?: string; senha?: string; confirmacao?: string };

export default function CadastroScreen() {
  const { signUp } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleCadastrar() {
    const novosErros: Erros = {
      nome: validarNome(nome),
      email: validarEmail(email),
      senha: validarSenha(senha),
      confirmacao: validarConfirmacao(senha, confirmacao),
    };
    setErros(novosErros);
    setErroApi(null);
    if (Object.values(novosErros).some(Boolean)) return;

    setCarregando(true);
    try {
      await signUp(nome.trim(), email.trim().toLowerCase(), senha);
    } catch (e) {
      setErroApi(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.marca}>MedRotina</Text>
            <Text style={styles.titulo}>Criar conta</Text>
            <Text style={styles.subtitulo}>Leva menos de um minuto.</Text>
          </View>

          <View style={styles.form}>
            <FormField
              label="Nome"
              value={nome}
              onChangeText={setNome}
              erro={erros.nome}
              placeholder="Seu nome completo"
              autoCapitalize="words"
              autoComplete="name"
            />
            <FormField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              erro={erros.email}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
            <FormField
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              erro={erros.senha}
              placeholder="Mínimo de 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
            />
            <FormField
              label="Confirmar senha"
              value={confirmacao}
              onChangeText={setConfirmacao}
              erro={erros.confirmacao}
              placeholder="Repita a senha"
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleCadastrar}
            />

            {erroApi ? <Text style={styles.erroApi}>{erroApi}</Text> : null}

            <PrimaryButton titulo="Criar conta" onPress={handleCadastrar} carregando={carregando} />
          </View>

          <View style={styles.rodape}>
            <Text style={styles.rodapeTexto}>Já tem uma conta?</Text>
            <Link href="/login" replace style={styles.link}>
              Entrar
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 28 },
  header: { gap: 6 },
  marca: { fontSize: 14, fontWeight: '700', color: AppColors.primary, letterSpacing: 0.5 },
  titulo: { fontSize: 28, fontWeight: '700', color: AppColors.text },
  subtitulo: { fontSize: 14, color: AppColors.textSecondary },
  form: { gap: 16 },
  erroApi: {
    color: AppColors.danger,
    fontSize: 13,
    backgroundColor: '#FBEAEA',
    borderRadius: 8,
    padding: 10,
  },
  rodape: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  rodapeTexto: { color: AppColors.textSecondary, fontSize: 14 },
  link: { color: AppColors.primary, fontSize: 14, fontWeight: '600' },
});
