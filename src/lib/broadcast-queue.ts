import { createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function processBroadcastJob(jobId: string, eventId: string, eventTitle: string, emails: string[], subject: string, body: string) {
  const service = createServiceClient();

  try {
    // 1. Mark as processing
    await service.from('broadcast_jobs').update({
      status: 'processing',
      total_recipients: emails.length,
    }).eq('id', jobId);

    if (!process.env.RESEND_API_KEY) {
      // Mock mode simulation
      await new Promise(r => setTimeout(r, 800));
      await service.from('broadcast_jobs').update({
        status: 'completed',
        sent_count: emails.length,
        failed_count: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', jobId);
      return { success: true, count: emails.length };
    }

    // 2. Batch send in chunks of 50 via BCC or batch endpoint
    const chunkSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < emails.length; i += chunkSize) {
      const emailChunk = emails.slice(i, i + chunkSize);

      try {
        const { error } = await resend.emails.send({
          from: 'SwiftVenue <updates@swiftvenuehq.com>',
          to: ['updates@swiftvenuehq.com'],
          bcc: emailChunk,
          subject: `${subject} - ${eventTitle}`,
          text: body,
        });

        if (error) {
          console.error(`Resend batch error at chunk ${i}:`, error);
          failedCount += emailChunk.length;
        } else {
          sentCount += emailChunk.length;
        }
      } catch (chunkErr) {
        console.error(`Chunk send failure at ${i}:`, chunkErr);
        failedCount += emailChunk.length;
      }

      // Update intermediate progress
      await service.from('broadcast_jobs').update({
        sent_count: sentCount,
        failed_count: failedCount,
      }).eq('id', jobId);
    }

    // 3. Mark completed
    await service.from('broadcast_jobs').update({
      status: failedCount > 0 && sentCount === 0 ? 'failed' : 'completed',
      sent_count: sentCount,
      failed_count: failedCount,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    return { success: true, sentCount, failedCount };
  } catch (err: any) {
    console.error('Broadcast job failed completely:', err);
    await service.from('broadcast_jobs').update({
      status: 'failed',
      error_message: err.message || 'Unknown processing error',
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
    throw err;
  }
}
