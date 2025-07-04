export async function notifyDiscord(
  name: string,
  email: string,
  createdAt: string,
  isDuplicate: boolean = false
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('Discord webhook URL is not set in environment variables.');
    return;
  }

  const message = isDuplicate
    ? {
        content: `🔄 Duplicate waitlist signup attempt:\n\n� **Name**: ${name}\n📧 **Email**: ${email}\n🕒 **Time**: ${createdAt}\n\n⚠️ This email is already on the waitlist!`,
      }
    : {
        content: `�📥 New waitlist signup:\n\n👤 **Name**: ${name}\n📧 **Email**: ${email}\n🕒 **Time**: ${createdAt}`,
      };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error('Failed to send Discord webhook:', err);
  }
}
