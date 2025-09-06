import { Model } from "mongoose";
import dbConnect from "./dbConnect";
import UpiTransaction from "@/models/Transactions";

// Generic function to get a collection
const getCollection = async <T>(
  model: Model<T>,
  errorMessage: string
): Promise<Model<T>> => {
  try {
    await dbConnect();
    return model;
  } catch {
    throw new Error(errorMessage);
  }
};

// To get UPI transaction collection
export const getUpiTransactionCollection = () =>
  getCollection(
    UpiTransaction,
    "Database connection error for UPI transaction collection"
  );
