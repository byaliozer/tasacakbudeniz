import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for tracking if notifications are scheduled
const NOTIFICATIONS_SCHEDULED_KEY = '@denizquiz_notifications_scheduled';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 30 Daytime notifications (12:00)
const DAYTIME_NOTIFICATIONS = [
  "Deniz taşmadan yetiş! Sıralamada yerini al, Oyunun Adil'i olduğunu kanıtla! 🌊",
  "Liderlik tablosu dalgalanıyor! Esme gibi stratejik düşün, zirveye adını yazdır. 🏆",
  "Sadece en dikkatli izleyiciler zirvede kalır! 5 saniyede cevapla, puanları topla! 🚀",
  "Oyunun Esme'si olmaya ne dersin? Zekanla rakiplerini geride bırak! 🧠",
  "Sıralamada geride mi kaldın? Öğle molasında atağa geç, liderlik koltuğunu geri al! 🔥",
  "Adil'in cesareti sende var mı? En hızlı sen ol, rakiplerine fark at! 💪",
  "Pazar bereketiyle gel! Haftanın şampiyonu olup \"Dizi Uzmanı\" ünvanını kazan! 🎖️",
  "Eleni'nin geçmişini en iyi sen mi biliyorsun? Teste başla, bilgisini konuştur! 🩺",
  "Oruç'un fedakarlığı boşa mı gitsin? Soruları çöz, kahramanların yanındaki yerini al! 🏥",
  "Liderlik tablosu yanıyor! Adil gibi korkusuz ol ve puanını ikiye katla! 🔥",
  "NIKO projesini geliştirmeye ne dersin? Tıbbi detayları bil, uzmanlığını göster! 💻",
  "Bir Koçari asla pes etmez! Öğle molasında zirve için savaşmaya devam et! ⚔️",
  "Adil ve Esme'nin kaderi senin elinde. Soruları doğru bil, onları kavuştur! ❤️",
  "Bir Fırtına uşağı gibi hızlı ol! Sorulara anında cevap ver, bonusları topla. 🚀",
  "Büyük finale hazır mısın? Son bölümlerin sorularıyla liderlik savaşı başladı! ⚔️",
  "Adil'in silahının yerini sadece sen mi biliyorsun? Göster kendini! 🔫",
  "Esme'nin cesaretiyle yarış! Kimse senin hızına yetişemesin. 🏇",
  "\"Taşacak Bu Deniz\" oyununun efsanesi ol! İsmine yakışır bir skor yap. ✨",
  "Boşanma davası öncesi son hazırlık! Esme'nin özgürlüğü senin bilgine bağlı. 📄",
  "Her gün yeni bir bölüm, her gün yeni bir macera! Bugünün şampiyonu sen ol. 🌟",
  "Sıralama her an değişebilir! Koltuğunu kimseye kaptırma, Oyunun Adil'i kal! 👑",
  "Son düzlüğe girildi! Ayın birincisi olup efsanevi ödülünü almaya hak kazan! 🥇",
  "Ve büyük gün! Deniz taşmadı ama senin puanların taştı mı? Son kez yarış! 🌊",
  "Yaylalarda hava sert, sorular daha sert! Günün lideri olmaya var mısın? 🏔️",
  "Adil'in tüfeği patlamadan yetiş! En hızlı cevapla Süper Zeka bonusunu kap! 🔫",
  "\"Cacık\" tartışması mı, büyük aşk mı? 17. bölüm sorularıyla zekanı kanıtla! 🥒",
  "Aleyna'nın sırrı hala toprağın altında. Esme'nin acısını sadece sen anlarsın. 🥀",
  "Kalandar rüzgarı esiyor! Puan torbanı doldur, haftanın birincisi sen ol! 🎒",
  "Oruç'un feda ettiği her şeyi hatırla. Gerçek bir Fırtına lideri gibi yarış! 🏥",
  "Zeynep'in kaderi değişiyor. Ona en doğru yolu ancak senin bilgin gösterebilir! 🤱",
];

// 30 Nighttime notifications (21:00)
const NIGHTTIME_NOTIFICATIONS = [
  "Fırtına öncesi sessizlik... Esme'nin kalbindeki sırrı çözmeye hazır mısın? 🕯️",
  "Bu akşam deniz çok hırçın! En zor soruları çöz, günün kahramanı sen ol. ✨",
  "Karanlık sırlar gün yüzüne çıkıyor. Adil'in kararlılığını göster ve liderliğe yüksel. ⚖️",
  "Dalgalar çekildiğinde gerçekler kalır. Bu geceki sorularla rütbeni yükselt! 🌊",
  "Fırtınalı bir geceye hazır mısın? Sırların derinliğine in ve en yüksek puanı kap! ⛈️",
  "Gözler sıralama tablosunda... Sen hangi ailenin gururu olacaksın? 🦅",
  "Haftalık hesaplaşma vakti! Deniz taşmadan son hamleni yap ve lider ol! 🌊",
  "Şerif'in oyunlarını bozma vakti! Adaletin terazisi senin ellerinde. ⚖️",
  "Bu gece sırlar taşacak! Esme'nin gözyaşının sebebini bil, puanları katla. 💧",
  "Gecenin en zor sorusu seni bekliyor. Bil ve Oyunun Esme'si ünvanını kazan! 💍",
  "Karanlık çöktü, kumpaslar kuruldu. Kimin doğru söylediğini bulabilecek misin? 🔦",
  "Fırtına Konağı'nda neler oluyor? Bu geceki sorularla gizemi sen aydınlat. 🏰",
  "Deniz sessiz ama derinden geliyor... Sıralamada büyük bir değişim yapmaya hazır mısın? 🌊",
  "Sırların dalgaları arasında boğulma! Bilginle suyun üstünde kal ve lider ol. ⛵",
  "Deniz taşmak üzere! Tüm bölümleri bildiğini ispatla, asıl şampiyon ol. 🌊",
  "Şerif için yolun sonu mu? Kumpasları çöz, puan tablosunu altüst et! 🏁",
  "Bu gece sırlar dökülecek... Sen hangi gerçeğin peşinden gideceksin? 🕯️",
  "Dalgalar duruluyor, kazanan belli oluyor... Senin adın nerede? 🏆",
  "\"Beni yakamadı ama sen yaktın...\" Adil'in bu sözü kimeydi? Bil ve kazan! 🔥",
  "Gece nöbetine hazır mısın? Hastane sırlarını Eleni'den daha iyi çöz! 🏥",
  "Esme'nin gizli sığınağına gir... Oradaki gizli soruyu bilip puanını katla! 🏚️",
  "\"Aşk kırılınca parçaları nefret olur.\" Bu gece nefret değil, bilgi kazansın! 💔",
  "\"Taşacak Bu Deniz\" oyununun mutlak hakimi belli oluyor. Sen misin? 🏆",
  "İhanetin bedeli ağırdır. Kimin kimi sattığını bil, puan tablosunu altüst et! 🐍",
  "Bu akşam bir itiraf var! Kulaklarını dört açanlar sıralamada en üste çıkıyor. 👂",
  "Gecenin sessizliğini sorularla boz! Oyunun Adil'i olmak için son bir hamle yap. 🏹",
  "Duygusal bir yüzleşmeye hazır mısın? Bu gece bilgi, nefreti yenecek! 💔",
  "\"Galandaris Kulandaris!\" Gelenekleri en iyi sen biliyorsan liderlik senin hakkın! 🕯️",
  "Kimin eli kimin cebinde? Karadeniz'in en karışık sorularını çöz ve puanları topla! 🔍",
  "Düşmanlık mı, akrabalık mı? Sırların okyanusunda en çok puanı toplayan kazanır! 🌊",
];

// Saturday special notification (15:00)
const SATURDAY_NOTIFICATION = "Yeni bölüm soruları eklendi, hemen oyna ve lider ol! 🎬";

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

// Check if notifications are already scheduled
async function areNotificationsScheduled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_SCHEDULED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Mark notifications as scheduled
async function markNotificationsScheduled(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_SCHEDULED_KEY, 'true');
  } catch (error) {
    console.error('[Notifications] Error saving scheduled status:', error);
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

  // Check if already scheduled
  const alreadyScheduled = await areNotificationsScheduled();
  if (alreadyScheduled) {
    console.log('[Notifications] Already scheduled, skipping');
    return;
  }

  // Request permission first
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('[Notifications] No permission, cannot schedule');
    return;
  }

  // Cancel any existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  console.log('[Notifications] Scheduling notifications...');

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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Taşacak Bu Deniz 🌊',
          body: getRandomNotification(DAYTIME_NOTIFICATIONS),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: noonDate,
        },
      });
    }

    // Schedule 21:00 (9 PM) notification
    const nightDate = new Date(date);
    nightDate.setHours(21, 0, 0, 0);
    
    if (nightDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Taşacak Bu Deniz 🌊',
          body: getRandomNotification(NIGHTTIME_NOTIFICATIONS),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nightDate,
        },
      });
    }

    // Schedule Saturday 15:00 special notification
    if (dayOfWeek === 6) { // Saturday
      const saturdayDate = new Date(date);
      saturdayDate.setHours(15, 0, 0, 0);
      
      if (saturdayDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Yeni Bölüm Eklendi! 🎬',
            body: SATURDAY_NOTIFICATION,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: saturdayDate,
          },
        });
      }
    }
  }

  // Mark as scheduled
  await markNotificationsScheduled();
  console.log('[Notifications] All notifications scheduled successfully');
}

// Reset notifications (useful for testing or re-scheduling)
export async function resetNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATIONS_SCHEDULED_KEY);
    console.log('[Notifications] Reset complete');
  } catch (error) {
    console.error('[Notifications] Error resetting:', error);
  }
}

// Get scheduled notifications count (for debugging)
export async function getScheduledNotificationsCount(): Promise<number> {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.length;
}
