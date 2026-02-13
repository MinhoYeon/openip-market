import { prisma } from '@/lib/prisma';

export async function createNotification(
  userId: string,
  type: 'OFFER' | 'DOCUMENT' | 'SETTLEMENT' | 'SYSTEM' | 'BID_RECEIVED' | 'NEW_MESSAGE',
  content: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        content,
        link,
        isRead: false
      }
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
    // Don't throw, notifications are auxiliary
  }
}
