export async function sendTicketViaWhatsApp(
  phoneNumber: string,
  guestName: string,
  eventName: string,
  ticketUrl: string
) {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp API credentials missing. Skipping WhatsApp delivery.");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: {
            name: "ticket_confirmation",
            language: {
              code: "en_US",
            },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: guestName },
                  { type: "text", text: eventName },
                ],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [
                  { type: "text", text: ticketUrl }
                ]
              }
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to send WhatsApp message:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}
