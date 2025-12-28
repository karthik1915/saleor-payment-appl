import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const paymentAttempts = sqliteTable("payment_attempts", {
  id: text("id").primaryKey(),
  saleorTransactionId: text("saleor_transaction_id").unique().notNull(),
  saleorCheckoutId: text("saleor_checkout_id"),
  saleorOrderId: text("saleor_order_id"),
  provider: text("provider").default("razorpay"),
  externalOrderId: text("external_order_id").unique().notNull(),
  externalPaymentId: text("external_payment_id").unique(),
  status: text("status").default("PENDING"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

const client = createClient({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(client, { schema: { paymentAttempts } });
