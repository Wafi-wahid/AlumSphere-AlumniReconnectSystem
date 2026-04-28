import { getFirestore, initFirebaseAdmin } from '../firebaseAdmin';

export type NotificationItem = {
  type: string;
  title: string;
  body?: string;
  link?: string;
  createdAt: number;
  metadata?: Record<string, any>;
};

export async function sendInAppNotification(userId: string, item: Omit<NotificationItem, 'createdAt'> & { createdAt?: number }) {
  initFirebaseAdmin();
  const db = getFirestore();
  const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();
  const payload: NotificationItem = {
    type: item.type,
    title: item.title,
    body: item.body,
    link: item.link,
    createdAt,
    metadata: item.metadata,
  };

  await db.collection('notifications').doc(String(userId)).collection('items').add(payload);
}
