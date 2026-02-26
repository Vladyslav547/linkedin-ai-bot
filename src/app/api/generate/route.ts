import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TONE_MODIFIERS: Record<string, string> = {
  professional:
    "Tone: polished, authoritative, data-driven. Use industry language. Keep it formal yet warm.",
  creative:
    "Tone: storytelling, vivid, unexpected angles. Use a narrative arc. Surprise the reader with your opening.",
  bold:
    "Tone: high energy, direct, conviction-driven. Short punchy sentences. Use power words. Make bold claims backed by the content.",
};

export async function POST(req: Request) {
  const { sourceText, tone } = await req.json();

  if (!sourceText || sourceText.trim().length < 10) {
    return new Response(JSON.stringify({ error: "Source text is too short." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const toneInstruction = TONE_MODIFIERS[tone] ?? TONE_MODIFIERS.professional;

  const systemPrompt = `Ти — експерт із LinkedIn ghostwriting. Твоє завдання: перетворити вхідний текст на пост, що зупиняє скрол.

${toneInstruction}

Структура поста (дотримуйся суворо):
1. Сильний гачок (Hook): перше речення має заінтригувати — питання, провокація або несподіваний факт.
2. Проблема/Контекст: 2-3 речення, що розкривають суть теми.
3. 3-4 пункти (Bullet points): ключові висновки або поради. Кожен пункт починається з "•".
4. Висновок + Питання (CTA): сильне завершення + запитання, що провокує коментарі.

Правила:
- Емодзі — мінімально (не більше 2-3 на весь пост, тільки там де підсилює)
- Пиши професійно, але живо — не корпоративний шаблон
- Додай рівно 3 хештеги в кінці
- Виводь лише текст поста, без пояснень і преамбули`;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const stream = await client.messages.stream({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Згенеруй LinkedIn пост на основі цього матеріалу:\n\n${sourceText}`,
      },
    ],
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
