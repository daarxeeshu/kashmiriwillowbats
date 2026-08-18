const DEFAULT_NUMBER = "919XXXXXXXXX";

export function getWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_NUMBER;
}

export function buildWhatsAppUrl(message: string): string {
  const number = getWhatsAppNumber().replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  general: "Hi, I need help choosing cricket equipment from Kashmiri Willow Bats.",
  batExpert:
    "Hi, I'd like to speak with a bat expert. Can you help me choose the right Kashmir Willow bat?",
  videoCall:
    "Hi, I'd like to schedule a video call to see available bats — weight, grains, pickup, and ping. Please assist.",
  engraving:
    "Hi, I'm interested in laser name engraving on my bat. Can you share details?",
} as const;
