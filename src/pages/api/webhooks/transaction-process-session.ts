import { gql } from "urql";
import { eq } from "drizzle-orm";
import { saleorApp } from "@/saleor-app";
import { razorpay } from "@/lib/razorpay";
import { db, paymentAttempts } from "@/lib/database/instance";
import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import TransactionProcessSessionPayloadFragment from "@/generated/graphql";

const TransactionProcessSessionPayload = gql`
  fragment TransactionProcessSessionPayload on TransactionProcessSession {
    transaction {
      id
    }
    data
  }
`;

const TransactionProcessSubscription = gql`
  ${TransactionProcessSessionPayload}
  subscription TransactionProcessSession {
    event {
      ...TransactionProcessSessionPayload
    }
  }
`;

export const transactionProcessSessionWebhook = new SaleorSyncWebhook<
  typeof TransactionProcessSessionPayloadFragment
>({
  name: "Razorpay Transaction Process",
  apl: saleorApp.apl,
  webhookPath: "/api/webhooks/transaction-process-session",
  event: "TRANSACTION_PROCESS_SESSION",
  query: TransactionProcessSubscription,
});

export default transactionProcessSessionWebhook.createHandler(async (req, res, ctx) => {
  const { transaction, data } = ctx.payload as any;

  console.log(transaction, data, "data recieved");

  // 1. Extract the payment ID passed from your Storefront
  const rzpPaymentId = data?.razorpay_payment_id;

  if (!rzpPaymentId) {
    return res.status(200).json({
      result: "CHARGE_FAILURE",
      data: { message: "No Razorpay payment ID provided from frontend." },
    });
  }

  try {
    // 2. Verify status directly with Razorpay API (The "Source of Truth")
    const rzpPayment = await razorpay.payments.fetch(rzpPaymentId);

    // 3. Check if payment is actually successful (captured or authorized)
    const isSuccessful = rzpPayment.status === "captured" || rzpPayment.status === "authorized";

    console.log(rzpPayment.status);

    if (isSuccessful) {
      // 4. Update your local Drizzle DB for your Admin Iframe/Audit logs
      await db
        .update(paymentAttempts)
        .set({
          status: "SUCCESS",
          externalPaymentId: rzpPaymentId,
          // We use the Saleor Transaction ID to find the right record
        })
        .where(eq(paymentAttempts.saleorTransactionId, transaction.id));

      console.log(transaction.id);

      const amount =
        typeof rzpPayment.amount === "string" ? Number(rzpPayment.amount) : rzpPayment.amount;

      // 5. Respond to Saleor to finalize the transaction
      return res.status(200).json({
        result: "CHARGE_SUCCESS",
        amount: amount / 100,
        currency: rzpPayment.currency,
        externalReference: rzpPaymentId,
        pspReference: rzpPaymentId,
      });
    } else {
      // If payment is failed/refunded/created but not paid
      await db
        .update(paymentAttempts)
        .set({ status: "FAILED" })
        .where(eq(paymentAttempts.saleorTransactionId, transaction.id));

      return res.status(200).json({
        result: "CHARGE_FAILURE",
        data: { message: `Razorpay payment status: ${rzpPayment.status}` },
      });
    }
  } catch (error: any) {
    console.error("Verification Error:", error);
    return res.status(200).json({
      result: "CHARGE_FAILURE",
      data: { message: error.message || "Failed to verify payment with Razorpay" },
    });
  }
});

export const config = {
  api: { bodyParser: false },
};
