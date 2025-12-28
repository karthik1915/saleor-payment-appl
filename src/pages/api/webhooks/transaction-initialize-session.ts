import { gql } from "urql";
import { nanoid } from "nanoid";
import { saleorApp } from "@/saleor-app";
import { razorpay } from "@/lib/razorpay";
import { db, paymentAttempts } from "@/lib/database/instance";
import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import TransactionInitializeSessionPayloadFragment from "@/generated/graphql";

const TransactionInitializeSessionPayload = gql`
  fragment TransactionInitializeSessionPayload on TransactionInitializeSession {
    action {
      amount
      currency
      actionType
    }
    transaction {
      id
    }
    data
  }
`;

const TransactionInitializeSessionSubscription = gql`
  # Payload fragment must be included in the root query
  ${TransactionInitializeSessionPayload}
  subscription TransactionInitializeSession {
    event {
      ...TransactionInitializeSessionPayload
    }
  }
`;

export const transactionInitializeSessionWebhook = new SaleorSyncWebhook<
  typeof TransactionInitializeSessionPayloadFragment
>({
  name: "Razorpay Transaction Initialize",
  apl: saleorApp.apl,
  webhookPath: "/api/webhooks/transaction-initialize-session",
  event: "TRANSACTION_INITIALIZE_SESSION",
  query: TransactionInitializeSessionSubscription,
});

export default transactionInitializeSessionWebhook.createHandler(async (req, res, ctx) => {
  const payload = ctx.payload as any;

  if (!("action" in payload)) {
    return res.status(200).json({
      result: "CHARGE_FAILURE",
      data: { message: "Introspection" },
    });
  }

  try {
    const { amount, currency } = payload.action;
    const transactionId = payload.transaction?.id;

    // Generate a unique, secure ID
    const receiptId = `slr_rzp_${nanoid(10)}`;

    const source = payload.sourceObject;
    const orderId = source?.__typename === "Order" ? source.id : null;
    const checkoutId = source?.__typename === "Checkout" ? source.id : null;

    const notes = {
      receipt_id: receiptId,
      saleor_transaction_id: transactionId,
      saleor_source_id: source?.id || "N/A",
      ...payload.data,
    };

    // 1. Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: receiptId,
      notes: notes,
    });

    await db.insert(paymentAttempts).values({
      id: receiptId,
      amount: amount,
      status: "PENDING",
      currency: currency,
      saleorOrderId: orderId,
      saleorCheckoutId: checkoutId,
      externalOrderId: razorpayOrder.id,
      saleorTransactionId: transactionId,
    });

    // 2. Return data to Saleor
    return res.status(200).json({
      result: "CHARGE_ACTION_REQUIRED",
      data: {
        razorpay_order_id: razorpayOrder.id,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
        amount_paise: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error: any) {
    console.error("Razorpay Error:", error);

    return res.status(500).json({
      result: "CHARGE_FAILURE",
      data: {
        message: error.message || "Failed to create Razorpay order",
      },
    });
  }
});

export const config = {
  api: { bodyParser: false },
};
