import { bookingSchema, createBooking } from "@/lib/bookings";
import { clientIp, handler, json, parseJson } from "@/lib/http";

export const POST = handler(async (req: Request) => {
  const input = await parseJson(req, bookingSchema);
  const booking = await createBooking(input, clientIp(req));
  return json({ ok: true, id: booking.id }, 201);
});
