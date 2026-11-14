import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { AppColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';

const SLIDES = [
  {
    simbolo: '✚',
    titulo: 'Bem-vindo ao MedRotina',
    texto: 'Seus medicamentos e horários organizados em um só lugar, para você manter o tratamento em dia.',
  },
  {
    simbolo: '◔',
    titulo: 'Doses na hora certa',
    texto: 'Cadastre os horários e veja na tela inicial o que falta tomar hoje, com a próxima dose sempre em destaque.',
  },
  {
    simbolo: '✓',
    titulo: 'Acompanhe sua rotina',
    texto: 'Marque cada dose como tomada e consulte o histórico de adesão para ver como está o seu tratamento.',
  },
] as const;

// Introdução exibida no primeiro acesso de cada usuário (T19)
export default function OnboardingScreen() {
  const { concluirOnboarding } = useAuth();
  const [indice, setIndice] = useState(0);
  const slide = SLIDES[indice];
  const ultimo = indice === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topo}>
        {!ultimo ? (
          <Pressable onPress={() => void concluirOnboarding()} accessibilityRole="button" accessibilityLabel="Pular introdução">
            <Text style={styles.pular}>Pular</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.conteudo}>
        <View style={styles.circulo}>
          <Text style={styles.simbolo}>{slide.simbolo}</Text>
        </View>
        <Text style={styles.titulo}>{slide.titulo}</Text>
        <Text style={styles.texto}>{slide.texto}</Text>
      </View>

      <View style={styles.rodape}>
        <View style={styles.pontos} accessibilityLabel={`Passo ${indice + 1} de ${SLIDES.length}`}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.ponto, i === indice && styles.pontoAtivo]} />
          ))}
        </View>
        <PrimaryButton
          titulo={ultimo ? 'Começar' : 'Próximo'}
          onPress={() => (ultimo ? void concluirOnboarding() : setIndice(indice + 1))}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background, width: '100%', maxWidth: 520, alignSelf: 'center' },
  topo: { height: 48, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 24 },
  pular: { color: AppColors.textSecondary, fontSize: 14, fontWeight: '600' },
  conteudo: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  circulo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  simbolo: { fontSize: 52, color: AppColors.primary },
  titulo: { fontSize: 24, fontWeight: '700', color: AppColors.text, textAlign: 'center' },
  texto: { fontSize: 15, color: AppColors.textSecondary, textAlign: 'center', lineHeight: 22 },
  rodape: { padding: 24, gap: 20 },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppColors.border },
  pontoAtivo: { width: 24, backgroundColor: AppColors.primary },
});
