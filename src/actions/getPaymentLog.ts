// import { db, paymentAttempts } from "@/lib/database/instance";
// import { desc, eq } from "drizzle-orm";

export async function getPaymentLog(orderId: string) {
  if (!orderId) return [];

  // TODO: Implement saleor order's transaction id where it is success and
  // return the razorpay details from paymentAttempts table

  return;

  //   return db
  //     .select()
  //     .from(paymentAttempts)
  //     .where(eq(paymentAttempts.orderId, orderId))
  //     .orderBy(desc(paymentAttempts.createdAt))
  //     .limit(50);
}
