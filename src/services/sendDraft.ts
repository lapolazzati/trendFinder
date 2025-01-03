import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export async function sendDraft(draft_post: string) {
  try {
    if (!draft_post || draft_post.trim().length === 0) {
      throw new Error('Draft post is empty');
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error('Telegram bot token or chat ID not configured');
    }

    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: draft_post,
        parse_mode: 'HTML' // Supports HTML formatting if needed
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return `Success sending draft to Telegram at ${new Date().toISOString()}`;
  } catch (error) {
    console.log('error sending draft to Telegram');
    console.log(error);
    throw error; // Re-throwing the error for better error handling upstream
  }
}