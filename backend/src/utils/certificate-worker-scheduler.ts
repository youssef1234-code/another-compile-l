/**
 * Certificate Worker Scheduler
 * 
 * Automatically sends certificates to workshop attendees after events end
 * Requirement #30: Students receive certificates upon workshop completion
 * 
 * @module utils/certificate-worker-scheduler
 */

import { certificateWorkerService } from '../services/certificate-worker.service.js';

/**
 * Run the certificate worker to process completed workshops
 * Should be called periodically (e.g., every 30 minutes)
 */
export async function runCertificateWorker() {
  try {
    console.log('[Certificate Worker] Starting certificate distribution check...');
    
    const results = await certificateWorkerService.runCertificateWorker();
    
    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    
    if (results.length > 0) {
      console.log(`[Certificate Worker] Processed ${results.length} workshops: ${totalSent} certificates sent, ${totalFailed} failed`);
    } else {
      console.log('[Certificate Worker] No pending certificates to send');
    }
  } catch (error) {
    console.error('[Certificate Worker] Error running certificate worker:', error);
  }
}

/**
 * Initialize certificate worker scheduler (call this from index.ts on server start)
 * Runs every 30 minutes to check for completed workshops with unsent certificates
 */
export function initializeCertificateWorkerScheduler() {
  // Run immediately on startup (after a delay to let DB connect)
  setTimeout(() => {
    runCertificateWorker();
  }, 10000); // 10 second delay after startup
  
  // Run every 30 minutes
  setInterval(runCertificateWorker, 30 * 60 * 1000);
  
  console.log('[Certificate Worker] Scheduler initialized - running every 30 minutes');
}
