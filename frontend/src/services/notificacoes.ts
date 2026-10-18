import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
      title: 'Hora do remédio 💊',
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
