import { errorFromCode } from "fragmentor";
import toast from "react-hot-toast";

function getProgramErrorNumber(str: string): string | undefined {
  return str.split(":").at(-1)?.trim();
}

export function getErrorMessage(error: unknown) {
  if ((error as Error).message.includes("custom program error")) {
    const errorNumber = getProgramErrorNumber((error as Error).message);
    const err = errorFromCode(Number(errorNumber));
    toast.error(err?.message ?? err?.name ?? "Unknown error");
  }
}

export function trimAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}