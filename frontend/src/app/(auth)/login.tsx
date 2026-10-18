import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { validarEmail, validarSenha } from '@/utils/validacao';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleEntrar() {
    const novosErros = { email: validarEmail(email), senha: validarSenha(senha) };
    setErros(novosErros);
    setErroApi(null);
    if (novosErros.email || novosErros.senha) return;

    setCarregando(true);
    try {
      await signIn(email.trim().toLowerCase(), senha);
      // Ao logar, o guard do layout raiz leva o usuário automaticamente para (tabs)
    } catch (e) {
      setErroApi(e instanceof Error ? e.message : 'Não foi possível entrar.');
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
            <Text style={styles.titulo}>Entrar</Text>
            <Text style={styles.subtitulo}>Acompanhe seus medicamentos e nunca perca uma dose.</Text>
          </View>

          <View style={styles.form}>
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
              placeholder="Sua senha"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              onSubmitEditing={handleEntrar}
            />

            {erroApi ? <Text style={styles.erroApi}>{erroApi}</Text> : null}

            <PrimaryButton titulo="Entrar" onPress={handleEntrar} carregando={carregando} />
          </View>

          <View style={styles.rodape}>
            <Text style={styles.rodapeTexto}>Ainda não tem conta?</Text>
            <Link href="/cadastro" style={styles.link}>
              Cadastre-se
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
