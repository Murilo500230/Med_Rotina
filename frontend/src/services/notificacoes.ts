import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type Medicamento = {
  id: string | number;
  nome: string;
  dosagem: string;
};

export async function configurarNotificacoes(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('lembretes', {
      name: 'Lembretes de medicação',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// horario no formato "08:30"
export async function agendarLembrete(
  medicamento: Medicamento,
  horario: string
): Promise<string> {
  const [hour, minute] = horario.split(':').map(Number);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora do remédio',
      body: `${medicamento.nome} - ${medicamento.dosagem}`,
      data: { medicamentoId: medicamento.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'lembretes',
    },
  });
}

export async function cancelarLembrete(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// ---------------------------------------------------------------
// T12 - lembretes ligados aos medicamentos
// ---------------------------------------------------------------

// Cadastro: agenda um lembrete diario para cada horario do medicamento
export async function agendarLembretesDoMedicamento(
  medicamento: Medicamento,
  horarios: string[]
): Promise<void> {
  for (const horario of horarios) {
    await agendarLembrete(medicamento, horario);
  }
}

// Exclusao: cancela todos os lembretes daquele medicamento
export async function cancelarLembretesDoMedicamento(
  medicamentoId: string | number
): Promise<void> {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();

  for (const item of agendadas) {
    const idDaNotificacao = item.content.data?.medicamentoId;
    if (String(idDaNotificacao) === String(medicamentoId)) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}

// Edicao: cancela os lembretes antigos e agenda os novos
export async function reagendarLembretesDoMedicamento(
  medicamento: Medicamento,
  horarios: string[]
): Promise<void> {
  await cancelarLembretesDoMedicamento(medicamento.id);
  await agendarLembretesDoMedicamento(medicamento, horarios);
}

// Abrir o app / login: refaz tudo a partir da lista da API
// (util apos reinstalar o app ou trocar de celular)
export async function sincronizarLembretes(
  medicamentos: (Medicamento & { horarios: string[] })[]
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const medicamento of medicamentos) {
    await agendarLembretesDoMedicamento(medicamento, medicamento.horarios);
  }
}
