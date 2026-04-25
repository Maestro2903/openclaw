# Telegram Gemini Bot

Webhook-based Telegram bot that sends user messages to Google Gemini and replies in Telegram.

## Local Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env` from `.env.example` and fill in real values.

   Rotate any token that has been pasted into chat or logs before using it.

3. Run locally:

   ```sh
   npm run dev
   ```

4. Expose the local server with a tunnel and set `BASE_URL` to that public HTTPS URL.

## Environment Variables

- `TELEGRAM_BOT_TOKEN`: Telegram bot token from BotFather.
- `TELEGRAM_WEBHOOK_SECRET`: random webhook secret, at least 16 characters.
- `GEMINI_API_KEY`: Google AI Studio API key.
- `GEMINI_MODEL`: Gemini model name. Defaults to `gemini-2.5-flash`.
- `PORT`: HTTP port. Render sets this, default is `10000`.
- `BASE_URL`: public Render URL, for example `https://telegram-gemini-bot.onrender.com`.
- `ADMIN_CHAT_ID`: optional Telegram chat id for error notifications.

## Deploy To Render

The root `render.yaml` defines a `telegram-gemini-bot` web service.

1. Create or sync the Render Blueprint from the repo.
2. Set required secrets in Render:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `GEMINI_API_KEY`
   - `BASE_URL`
3. Deploy the service.
4. Watch logs for `Telegram webhook registered`.
5. Check health:

   ```sh
   curl https://your-render-url.onrender.com/health
   ```

## Testing

Build and type-check:

```sh
npm run build
npm run typecheck
```

Webhook smoke test without calling Telegram or Gemini:

```sh
curl -i https://your-render-url.onrender.com/health
```

Telegram webhook requests must include `X-Telegram-Bot-Api-Secret-Token`, which Telegram sends automatically after `setWebhook` is registered with `secret_token`.
