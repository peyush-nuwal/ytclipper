export async function notifyDiscord(
  email: string,
  createdAt: string,
  isDuplicate: boolean = false
) {
  // Use different webhook URLs for regular and repeat signups
  const webhookUrl = isDuplicate
    ? process.env.DISCORD_WEBHOOK_URL_REPEAT
    : process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error(
      `Discord webhook URL is not set in environment variables. Missing: ${isDuplicate ? 'DISCORD_WEBHOOK_URL_REPEAT' : 'DISCORD_WEBHOOK_URL'}`
    );
    return;
  }

  // Format time in Asia/Kolkata timezone
  const formattedTime = new Date(createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const message = isDuplicate
    ? {
        content: `⚠️ Duplicate waitlist signup attempt:\n\n📧 **Email**: ${email}\n🕒 **Time**: ${formattedTime} (IST)\n\n`,
      }
    : {
        content: `📥 New waitlist signup:\n\n **Email**: ${email}\n🕒 **Time**: ${formattedTime} (IST)\n\n`,
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
