import { errorFromCode } from "fragmentor";
import toast from "react-hot-toast";

function getProgramErrorNumber(str: string): string | undefined {
  return str.split(":").at(-1)?.trim();
}

export function getErrorMessage(err: unknown) {
  if ((err as Error).message.includes("custom program error")) {
    const errorNumber = getProgramErrorNumber((err as Error).message);
    const errr = errorFromCode(Number(errorNumber));
    toast.error(errr?.message ?? errr?.name ?? "Unknown error");
  }
}
