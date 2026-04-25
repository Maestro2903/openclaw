export function commandResponse(text: string): string | undefined {
  const command = text.trim().split(/\s+/)[0]?.toLowerCase();

  switch (command) {
    case "/start":
      return "Hi. Send me a message and I will answer with Gemini.";
    case "/help":
      return [
        "Send any text message to chat with Gemini.",
        "",
        "Commands:",
        "/start - introduce the bot",
        "/help - show this help",
        "/reset - clear your session memory"
      ].join("\n");
    case "/reset":
      return "Session memory cleared.";
    default:
      return undefined;
  }
}

export function isResetCommand(text: string): boolean {
  return text.trim().split(/\s+/)[0]?.toLowerCase() === "/reset";
}
