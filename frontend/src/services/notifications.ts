import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for tracking last schedule time
const LAST_SCHEDULED_KEY = '@denizquiz_notif_last_scheduled';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 30 Daytime notifications (12:00)
const DAYTIME_NOTIFICATIONS = [
  "Deniz taşmadan yetiş! Oyunun Adil'i olduğunu kanıtla! 🌊",
  "Esme gibi stratejik düşün, en yüksek skoru yap! 🏆",
  "Sadece en dikkatli izleyiciler en yüksek skoru yapar! 5 saniyede cevapla! 🚀",
  "Oyunun Esme'si olmaya ne dersin? Zekanla tüm soruları doğru bil! 🧠",
  "Öğle molasında atağa geç, en yüksek skorunu kır! 🔥",
  "Adil'in cesareti sende var mı? En hızlı sen ol! 💪",
  "Pazar bereketiyle gel! Haftanın en yüksek skorunu yap! 🎖️",
  "Eleni'nin geçmişini en iyi sen mi biliyorsun? Teste başla! 🩺",
  "Oruç'un fedakarlığı boşa mı gitsin? Soruları çöz, bilgini konuştur! 🏥",
  "En yüksek skoru yapmaya hazır mısın? Adil gibi korkusuz ol! 🔥",
  "NIKO projesini geliştirmeye ne dersin? Tıbbi detayları bil! 💻",
  "Bir Koçari asla pes etmez! Öğle molasında zirve için savaş! ⚔️",
  "Adil ve Esme'nin kaderi senin elinde. Soruları doğru bil! ❤️",
  "Bir Fırtına uşağı gibi hızlı ol! Sorulara anında cevap ver! 🚀",
  "Büyük finale hazır mısın? Son bölümlerin sorularıyla başla! ⚔️",
  "Adil'in silahının yerini sadece sen mi biliyorsun? Göster kendini! 🔫",
  "Esme'nin cesaretiyle yarış! Kimse senin hızına yetişemesin. 🏇",
  "\"Taşacak Bu Deniz\" oyununun efsanesi ol! İsmine yakışır bir skor yap. ✨",
  "Boşanma davası öncesi son hazırlık! Esme'nin özgürlüğü senin bilgine bağlı. 📄",
  "Her gün yeni bir bölüm, her gün yeni bir macera! Bugünün şampiyonu sen ol. 🌟",
  "En yüksek skoru yaparak tahtını koru! Oyunun Adil'i kal! 👑",
  "Son düzlüğe girildi! Tüm soruları doğru bilip rekor kır! 🥇",
  "Ve büyük gün! Deniz taşmadı ama senin puanların taştı mı? Hadi oyna! 🌊",
  "Yaylalarda hava sert, sorular daha sert! Günün en yüksek skorunu yap! 🏔️",
  "Adil'in tüfeği patlamadan yetiş! En hızlı cevapla Süper Zeka bonusunu kap! 🔫",
  "\"Cacık\" tartışması mı, büyük aşk mı? Sorularla zekanı kanıtla! 🥒",
  "Aleyna'nın sırrı hala toprağın altında. Esme'nin acısını sadece sen anlarsın. 🥀",
  "Kalandar rüzgarı esiyor! Puan torbanı doldur, rekorunu kır! 🎒",
  "Oruç'un feda ettiği her şeyi hatırla. Gerçek bir Fırtına lideri gibi yarış! 🏥",
  "Zeynep'in kaderi değişiyor. Ona en doğru yolu ancak senin bilgin gösterebilir! 🤱",
];

// 30 Nighttime notifications (21:00)
const NIGHTTIME_NOTIFICATIONS = [
  "Fırtına öncesi sessizlik... Esme'nin kalbindeki sırrı çözmeye hazır mısın? 🕯️",
  "Bu akşam deniz çok hırçın! En zor soruları çöz, günün kahramanı sen ol. ✨",
  "Karanlık sırlar gün yüzüne çıkıyor. Adil'in kararlılığını göster! ⚖️",
  "Dalgalar çekildiğinde gerçekler kalır. Bu geceki sorularla rekorunu kır! 🌊",
  "Fırtınalı bir geceye hazır mısın? Sırların derinliğine in ve en yüksek puanı kap! ⛈️",
  "Gözler en yüksek skorda... Sen hangi ailenin gururu olacaksın? 🦅",
  "Haftalık hesaplaşma vakti! Deniz taşmadan son hamleni yap! 🌊",
  "Şerif'in oyunlarını bozma vakti! Adaletin terazisi senin ellerinde. ⚖️",
  "Bu gece sırlar taşacak! Esme'nin gözyaşının sebebini bil, puanları katla. 💧",
  "Gecenin en zor sorusu seni bekliyor. Bil ve Oyunun Esme'si ünvanını kazan! 💍",
  "Karanlık çöktü, kumpaslar kuruldu. Kimin doğru söylediğini bulabilecek misin? 🔦",
  "Fırtına Konağı'nda neler oluyor? Bu geceki sorularla gizemi sen aydınlat. 🏰",
  "Deniz sessiz ama derinden geliyor... Büyük bir skor yapmaya hazır mısın? 🌊",
  "Sırların dalgaları arasında boğulma! Bilginle suyun üstünde kal! ⛵",
  "Deniz taşmak üzere! Tüm bölümleri bildiğini ispatla, asıl şampiyon ol. 🌊",
  "Şerif için yolun sonu mu? Kumpasları çöz, rekorunu kır! 🏁",
  "Bu gece sırlar dökülecek... Sen hangi gerçeğin peşinden gideceksin? 🕯️",
  "Dalgalar duruluyor, en yüksek skor belli oluyor... Senin adın nerede? 🏆",
  "\"Beni yakamadı ama sen yaktın...\" Adil'in bu sözü kimeydi? Bil ve kazan! 🔥",
  "Gece nöbetine hazır mısın? Hastane sırlarını Eleni'den daha iyi çöz! 🏥",
  "Esme'nin gizli sığınağına gir... Oradaki gizli soruyu bilip puanını katla! 🏚️",
  "\"Aşk kırılınca parçaları nefret olur.\" Bu gece nefret değil, bilgi kazansın! 💔",
  "\"Taşacak Bu Deniz\" oyununun mutlak hakimi belli oluyor. Sen misin? 🏆",
  "İhanetin bedeli ağırdır. Kimin kimi sattığını bil, rekorunu altüst et! 🐍",
  "Bu akşam bir itiraf var! Kulaklarını dört açanlar en yüksek skoru yapar. 👂",
  "Gecenin sessizliğini sorularla boz! Oyunun Adil'i olmak için son bir hamle yap. 🏹",
  "Duygusal bir yüzleşmeye hazır mısın? Bu gece bilgi, nefreti yenecek! 💔",
  "\"Galandaris Kulandaris!\" Gelenekleri en iyi sen biliyorsan en yüksek skor senin! 🕯️",
  "Kimin eli kimin cebinde? Karadeniz'in en karışık sorularını çöz! 🔍",
  "Düşmanlık mı, akrabalık mı? Sırların okyanusunda en çok puanı toplayan kazanır! 🌊",
];

// Saturday special notification (15:00)
const SATURDAY_NOTIFICATION = "Yeni bölüm soruları eklendi, hemen oyna! 🎬";

// Set up Android notification channel (required for Android 8+)
async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Taşacak Bu Deniz Bildirimler',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
    });
    console.log('[Notifications] Android channel created');
  }
}

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  console.log('[Notifications] Permission granted');
  return true;
}

// Check if we should reschedule (every 7 days)
async function shouldReschedule(): Promise<boolean> {
  try {
    const lastScheduled = await AsyncStorage.getItem(LAST_SCHEDULED_KEY);
    if (!lastScheduled) return true;

    const lastDate = new Date(lastScheduled);
    const now = new Date();
    const daysDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    // Reschedule if more than 7 days have passed
    if (daysDiff >= 7) {
      console.log(`[Notifications] ${Math.floor(daysDiff)} days since last schedule, rescheduling`);
      return true;
    }

    // Also check if there are still enough scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length < 10) {
      console.log(`[Notifications] Only ${scheduled.length} notifications remaining, rescheduling`);
      return true;
    }

    console.log(`[Notifications] ${scheduled.length} notifications active, next reschedule in ${Math.ceil(7 - daysDiff)} days`);
    return false;
  } catch {
    return true;
  }
}

// Get a random notification from an array
function getRandomNotification(notifications: string[]): string {
  const index = Math.floor(Math.random() * notifications.length);
  return notifications[index];
}

// Schedule all notifications
export async function scheduleNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform, skipping');
    return;
  }

  // Check if we need to reschedule
  const needsReschedule = await shouldReschedule();
  if (!needsReschedule) {
    return;
  }

  // Request permission first
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('[Notifications] No permission, cannot schedule');
    return;
  }

  // Set up Android notification channel
  await setupNotificationChannel();

  // Cancel any existing notifications before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  console.log('[Notifications] Scheduling notifications for next 30 days...');

  let scheduledCount = 0;

  // Schedule notifications for the next 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();

    // Schedule 12:00 (noon) notification
    const noonDate = new Date(date);
    noonDate.setHours(12, 0, 0, 0);

    if (noonDate > new Date()) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Taşacak Bu Deniz 🌊',
            body: getRandomNotification(DAYTIME_NOTIFICATIONS),
            sound: 'default',
            channelId: Platform.OS === 'android' ? 'default' : undefined,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: noonDate,
          },
        });
        scheduledCount++;
      } catch (err) {
        console.log('[Notifications] Error scheduling noon:', err);
      }
    }

    // Schedule 21:00 (9 PM) notification
    const nightDate = new Date(date);
    nightDate.setHours(21, 0, 0, 0);

    if (nightDate > new Date()) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Taşacak Bu Deniz 🌊',
            body: getRandomNotification(NIGHTTIME_NOTIFICATIONS),
            sound: 'default',
            channelId: Platform.OS === 'android' ? 'default' : undefined,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: nightDate,
          },
        });
        scheduledCount++;
      } catch (err) {
        console.log('[Notifications] Error scheduling night:', err);
      }
    }

    // Schedule Saturday 15:00 special notification
    if (dayOfWeek === 6) {
      const saturdayDate = new Date(date);
      saturdayDate.setHours(15, 0, 0, 0);

      if (saturdayDate > new Date()) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Yeni Bölüm Eklendi! 🎬',
              body: SATURDAY_NOTIFICATION,
              sound: 'default',
              channelId: Platform.OS === 'android' ? 'default' : undefined,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: saturdayDate,
            },
          });
          scheduledCount++;
        } catch (err) {
          console.log('[Notifications] Error scheduling saturday:', err);
        }
      }
    }
  }

  // Mark the schedule time
  await AsyncStorage.setItem(LAST_SCHEDULED_KEY, new Date().toISOString());
  // Clear old flag if exists
  await AsyncStorage.removeItem('@denizquiz_notifications_scheduled');

  console.log(`[Notifications] ${scheduledCount} notifications scheduled successfully`);
}

// Reset notifications (useful for testing or re-scheduling)
export async function resetNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(LAST_SCHEDULED_KEY);
    await AsyncStorage.removeItem('@denizquiz_notifications_scheduled');
    console.log('[Notifications] Reset complete');
  } catch (error) {
    console.error('[Notifications] Error resetting:', error);
  }
}

// Force reschedule (ignores the 7-day check)
export async function forceRescheduleNotifications(): Promise<void> {
  await AsyncStorage.removeItem(LAST_SCHEDULED_KEY);
  await AsyncStorage.removeItem('@denizquiz_notifications_scheduled');
  await scheduleNotifications();
}

// Get scheduled notifications count (for debugging)
export async function getScheduledNotificationsCount(): Promise<number> {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.length;
}
