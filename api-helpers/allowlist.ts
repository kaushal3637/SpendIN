import { BACKEND_URL, API_KEY } from "@/config/constant";

export interface AllowlistCheckResponse {
  success: boolean;
  message?: string;
  data?: {
    walletAddress?: string;
    isSanctioned?: boolean;
    identifications?: unknown[];
    screenedAt?: string;
    addedToAllowlist?: boolean;
  };
  error?: string;
}

/**
 * Ensures the given wallet address is allowlisted via the external backend.
 * The backend will: look up in DB -> if missing, run sanctions check -> add to allowlist if clean.
 * Returns true when the address is allowed to proceed.
 */
export async function checkAndAllowlistWallet(walletAddress: string): Promise<{ allowed: boolean; details?: AllowlistCheckResponse["data"] }>{
  const response = await fetch(`${BACKEND_URL}/api/sanctions/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
    },
    body: JSON.stringify({ walletAddress }),
  });

  let data: AllowlistCheckResponse | null = null;
  try {
    data = await response.json();
  } catch {
    // non-JSON response
  }

  if (!response.ok || !data?.success) {
    const reason = data?.error || data?.message || `Allowlist check failed with status ${response.status}`;
    throw new Error(reason);
  }

  const isSanctioned = data.data?.isSanctioned === true;
  if (isSanctioned) {
    return { allowed: false, details: data.data };
  }

  return { allowed: true, details: data.data };
}


