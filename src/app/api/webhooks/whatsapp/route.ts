import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{
          profile?: {
            name?: string;
          };
          wa_id?: string;
        }>;
        messages?: WhatsAppMessage[];
      };
    }>;
  }>;
  object?: string;
};

type WhatsAppMessage = {
  button?: {
    text?: string;
  };
  id?: string;
  interactive?: {
    button_reply?: {
      title?: string;
    };
    list_reply?: {
      title?: string;
    };
  };
  text?: {
    body?: string;
  };
  timestamp?: string;
  type?: string;
  from?: string;
};

type InboxCardPayload = {
  contact_name: string | null;
  message_text: string;
  raw_payload: WhatsAppWebhookPayload;
  received_at?: string;
  whatsapp_from: string;
  whatsapp_message_id: string | null;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Webhook verification failed.", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidSignature(request, rawBody)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  const payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  const cards = extractInboxCards(payload);

  if (!cards.length) {
    return NextResponse.json({ received: true, inserted: 0 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("whatsapp_inbox_cards")
    .upsert(cards, {
      ignoreDuplicates: true,
      onConflict: "whatsapp_message_id",
    });

  if (error) {
    return NextResponse.json(
      { error: "Could not save WhatsApp message." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true, inserted: cards.length });
}

function extractInboxCards(payload: WhatsAppWebhookPayload): InboxCardPayload[] {
  const cards: InboxCardPayload[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const contacts = change.value?.contacts ?? [];

      for (const message of change.value?.messages ?? []) {
        const from = message.from;
        const contact = contacts.find((item) => item.wa_id === from) ?? contacts[0];
        const messageText = getMessageText(message);

        if (!from || !messageText.trim()) {
          continue;
        }

        cards.push({
          contact_name: contact?.profile?.name ?? null,
          message_text: messageText.trim(),
          raw_payload: payload,
          received_at: message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : undefined,
          whatsapp_from: from,
          whatsapp_message_id: message.id ?? null,
        });
      }
    }
  }

  return cards;
}

function getMessageText(message: WhatsAppMessage) {
  if (message.text?.body) {
    return message.text.body;
  }

  if (message.button?.text) {
    return message.button.text;
  }

  if (message.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }

  if (message.interactive?.list_reply?.title) {
    return message.interactive.list_reply.title;
  }

  return message.type ? `Mensagem recebida: ${message.type}` : "";
}

function isValidSignature(request: NextRequest, rawBody: string) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    return true;
  }

  const signature = request.headers.get("x-hub-signature-256");

  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
}
