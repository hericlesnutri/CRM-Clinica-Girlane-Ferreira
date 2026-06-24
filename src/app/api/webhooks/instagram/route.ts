import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type InstagramMessagingEvent = {
  message?: {
    mid?: string;
    text?: string;
  };
  postback?: {
    payload?: string;
    title?: string;
  };
  sender?: {
    id?: string;
  };
  timestamp?: number;
};

type InstagramWebhookPayload = {
  entry?: Array<{
    messaging?: InstagramMessagingEvent[];
  }>;
  object?: string;
};

type InboxCardPayload = {
  instagram_message_id: string | null;
  instagram_sender_id: string;
  message_text: string;
  raw_payload: InstagramWebhookPayload;
  received_at?: string;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

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

  const payload = JSON.parse(rawBody) as InstagramWebhookPayload;
  const cards = extractInboxCards(payload);

  if (!cards.length) {
    return NextResponse.json({ received: true, inserted: 0 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("instagram_inbox_cards")
    .upsert(cards, {
      ignoreDuplicates: true,
      onConflict: "instagram_message_id",
    });

  if (error) {
    return NextResponse.json(
      { error: "Could not save Instagram message." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true, inserted: cards.length });
}

function extractInboxCards(payload: InstagramWebhookPayload): InboxCardPayload[] {
  const cards: InboxCardPayload[] = [];

  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const messageText = event.message?.text ?? event.postback?.title ?? "";

      if (!senderId || !messageText.trim()) {
        continue;
      }

      cards.push({
        instagram_message_id: event.message?.mid ?? null,
        instagram_sender_id: senderId,
        message_text: messageText.trim(),
        raw_payload: payload,
        received_at: event.timestamp
          ? new Date(event.timestamp).toISOString()
          : undefined,
      });
    }
  }

  return cards;
}

function isValidSignature(request: NextRequest, rawBody: string) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

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
