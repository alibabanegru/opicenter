import { collection, getDocs, limit, query, type Firestore } from "firebase/firestore";

const LEGACY_ORDERS_STORAGE_KEY = "clinic_legacy_glasses_orders_has_docs_v1";
let cachedHasLegacyOrders: boolean | null = null;
let inFlightCheck: Promise<boolean> | null = null;

export function markLegacyGlassesOrdersStatus(hasDocs: boolean): void {
  cachedHasLegacyOrders = hasDocs;
  try {
    sessionStorage.setItem(LEGACY_ORDERS_STORAGE_KEY, hasDocs ? "1" : "0");
  } catch {
    // ignore storage errors
  }
}

export async function hasLegacyGlassesOrders(db: Firestore): Promise<boolean> {
  if (cachedHasLegacyOrders !== null) {
    return cachedHasLegacyOrders;
  }
  try {
    const stored = sessionStorage.getItem(LEGACY_ORDERS_STORAGE_KEY);
    if (stored === "0") {
      cachedHasLegacyOrders = false;
      return false;
    }
    if (stored === "1") {
      cachedHasLegacyOrders = true;
      return true;
    }
  } catch {
    // ignore storage errors
  }

  if (inFlightCheck) {
    return inFlightCheck;
  }

  inFlightCheck = (async () => {
    try {
      const snap = await getDocs(query(collection(db, "glasses_orders"), limit(1)));
      const exists = !snap.empty;
      markLegacyGlassesOrdersStatus(exists);
      return exists;
    } catch {
      return false;
    } finally {
      inFlightCheck = null;
    }
  })();

  return inFlightCheck;
}
