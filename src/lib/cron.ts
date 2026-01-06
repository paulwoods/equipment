import cron from 'node-cron';
import {sendDashboardEmail} from './emailService';

export function initCron() {
    console.log('Initializing scheduled tasks...');

    // Saturday at 7:00 AM CST
    // CST is UTC-6 (or UTC-5 during CDT). 
    // Cron usually runs in the server's local time.
    // If we want to be specific about CST, we should ideally use a timezone-aware cron or calculate the offset.
    // '0 7 * * 6' is 7:00 AM every Saturday.
    // To handle CST specifically (UTC-6), we can specify the timezone if node-cron supports it, 
    // or adjust the hour based on UTC.

    cron.schedule('0 7 * * 6', async () => {
        console.log('Running scheduled dashboard email task (Saturday 7:00 AM)...');
        try {
            await sendDashboardEmail();
            console.log('Scheduled dashboard email sent successfully.');
        } catch (error) {
            console.error('Failed to send scheduled dashboard email:', error);
        }
    }, {
        timezone: "America/Chicago" // Central Time (handles both CST and CDT)
    });

    console.log('Scheduled tasks initialized.');
}
