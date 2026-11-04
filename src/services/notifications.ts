
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepareNotifications() {
  const permission = await Notifications.getPermissionsAsync();

  if (permission.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  if (!requested.granted) {
    throw new Error("Notification permission denied.");
  }

  return true;
}

export async function scheduleTaskReminder(
  title: string,
  description: string,
  reminderDate: Date
) {
  await prepareNotifications();

  if (reminderDate.getTime() <= Date.now()) {
    throw new Error("Choose a future reminder time.");
  }

  const notificationId =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Sharper Notes · ${title}`,
        body: description || "It's time to complete your task.",
        sound: "default",
        data: {
          type: "todo-reminder",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

  console.log("Task reminder scheduled:", notificationId);

  return notificationId;
}

export async function cancelTaskReminder(
  notificationId?: string | null
) {
  if (!notificationId) return;

  await Notifications.cancelScheduledNotificationAsync(
    notificationId
  );
}
