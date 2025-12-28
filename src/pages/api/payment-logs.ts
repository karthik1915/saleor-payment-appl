import { NextApiRequest, NextApiResponse } from "next";
import { db, paymentAttempts } from "@/lib/database/instance";
import { desc } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests for this audit log
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 1. Fetch the data using Drizzle
    // We sort by createdAt descending so newest payments appear first
    const data = await db
      .select()
      .from(paymentAttempts)
      .orderBy(desc(paymentAttempts.createdAt))
      .limit(50);

    // 2. Return the data to your frontend table
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Database Fetch Error:", error);
    return res.status(500).json({
      error: "Failed to fetch audit logs",
      details: error.message,
    });
  }
}
