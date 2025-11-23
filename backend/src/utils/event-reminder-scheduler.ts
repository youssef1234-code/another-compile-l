/**
 * Event Reminder Scheduler
 * 
 * Schedules and sends event reminders
 * Requirement #58: Send reminders 1 day and 1 hour before events
 * 
 * @module utils/event-reminder-scheduler
 */

import { notificationService } from '../services/notification.service.js';

/**
 * Check and send event reminders
 * Should be called periodically (e.g., every 15 minutes via cron job)
 */
export async function sendEventReminders() {
  try {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Find events starting in approximately 1 day (within 15-minute window)
    const dayReminderWindowStart = new Date(oneDayFromNow.getTime() - 7.5 * 60 * 1000);
    const dayReminderWindowEnd = new Date(oneDayFromNow.getTime() + 7.5 * 60 * 1000);
    
    // Find events starting in approximately 1 hour (within 15-minute window)
    const hourReminderWindowStart = new Date(oneHourFromNow.getTime() - 7.5 * 60 * 1000);
    const hourReminderWindowEnd = new Date(oneHourFromNow.getTime() + 7.5 * 60 * 1000);
    
    // Import Event model directly
    const { Event } = await import('../models/event.model.js');
    
    // Get events for 1-day reminders
    const eventsForDayReminder = await Event.find({
      startDate: { $gte: dayReminderWindowStart, $lte: dayReminderWindowEnd },
      status: 'PUBLISHED',
      isArchived: false,
    }).lean().exec();
    
    // Get events for 1-hour reminders
    const eventsForHourReminder = await Event.find({
      startDate: { $gte: hourReminderWindowStart, $lte: hourReminderWindowEnd },
      status: 'PUBLISHED',
      isArchived: false,
    }).lean().exec();
    
    // Send 1-day reminders
    for (const event of eventsForDayReminder) {
      await sendReminderForEvent(String(event._id), event.name, '1_DAY');
    }
    
    // Send 1-hour reminders
    for (const event of eventsForHourReminder) {
      await sendReminderForEvent(String(event._id), event.name, '1_HOUR');
    }
    
    console.log(`[Event Reminders] Sent ${eventsForDayReminder.length} 1-day reminders and ${eventsForHourReminder.length} 1-hour reminders`);
  } catch (error) {
    console.error('[Event Reminders] Error sending reminders:', error);
  }
}

/**
 * Send reminder for a specific event to all registered users
 */
async function sendReminderForEvent(
  eventId: string,
  eventName: string,
  timeframe: '1_DAY' | '1_HOUR'
) {
  try {
    // Import Registration model directly
    const { Registration } = await import('../models/registration.model.js');
    
    // Get all registrations for this event
    const registrations = await Registration.find({
      event: eventId,
      status: { $in: ['CONFIRMED', 'PENDING'] },
    }).lean().exec();
    
    if (registrations.length === 0) {
      return;
    }
    
    // Extract user IDs
    const userIds = registrations.map((reg: any) => String(reg.user));
    
    // Send notification to all registered users
    await notificationService.notifyEventReminder(
      userIds,
      eventId,
      eventName,
      timeframe
    );
    
    console.log(`[Event Reminders] Sent ${timeframe} reminder for "${eventName}" to ${userIds.length} users`);
  } catch (error) {
    console.error(`[Event Reminders] Error sending reminder for event ${eventId}:`, error);
  }
}

/**
 * Initialize scheduler (call this from index.ts on server start)
 */
export function initializeEventReminderScheduler() {
  // Run immediately on startup
  sendEventReminders();
  
  // Run every 15 minutes
  setInterval(sendEventReminders, 15 * 60 * 1000);
  
  console.log('[Event Reminders] Scheduler initialized - running every 15 minutes');
}
