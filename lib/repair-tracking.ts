import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";

import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";

export type RepairTimelineEntry = {
  status: string;
  changedAt: string;
  employeeName?: string;
  note?: string;
};

export type RepairTrackingRecord = {
  id: string;
  trackingCode: string;
  customerName: string;
  deviceModel: string;
  currentStatus: string;
  createdAt: string;
  lastUpdatedAt: string;
  phone?: string;
  timeline: RepairTimelineEntry[];
};

export type RepairTrackingResult =
  | { kind: "success"; repair: RepairTrackingRecord }
  | { kind: "missing"; message: string }
  | { kind: "unconfigured"; message: string }
  | { kind: "error"; message: string };

function readText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readTimeline(doc: QueryDocumentSnapshot<DocumentData>): RepairTimelineEntry[] {
  const raw = doc.data().timeline;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => ({
      status: readText(entry?.status),
      changedAt: readText(entry?.changedAt),
      employeeName: readText(entry?.employeeName),
      note: readText(entry?.note),
    }))
    .filter((entry) => entry.status.length > 0);
}

function normalizeRepair(doc: QueryDocumentSnapshot<DocumentData>): RepairTrackingRecord {
  const data = doc.data();
  const timeline = readTimeline(doc);
  return {
    id: doc.id,
    trackingCode: readText(data.trackingCode),
    customerName: readText(data.customerName, "Unknown customer"),
    deviceModel: readText(data.deviceModel, "Unknown device"),
    currentStatus: readText(data.status, "RECEIVED"),
    createdAt: readText(data.createdAt),
    lastUpdatedAt: readText(data.lastUpdatedAt || data.updatedAt || data.createdAt),
    phone: readText(data.phone),
    timeline,
  };
}

export async function fetchRepairByCode(code: string): Promise<RepairTrackingResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { kind: "missing", message: "Enter a repair code to continue." };
  }

  if (!isFirebaseConfigured()) {
    return {
      kind: "unconfigured",
      message: "Firebase is not configured yet. Add the public config values to connect this page to Firestore.",
    };
  }

  try {
    const db = getFirebaseDb();
    if (!db) {
      return { kind: "unconfigured", message: "Firebase database is not available." };
    }

    const repairsRef = collection(db, "repairs");
    const repairsQuery = query(repairsRef, where("trackingCode", "==", normalized), limit(1));
    const repairSnapshot = await getDocs(repairsQuery);

    if (repairSnapshot.empty) {
      return { kind: "missing", message: "No repair found for this code." };
    }

    const repair = normalizeRepair(repairSnapshot.docs[0]);

    if (!repair.timeline.length) {
      const timelineSnapshot = await getDocs(
        query(collection(db, "repairs", repair.id, "timeline"), orderBy("changedAt", "asc")),
      );
      repair.timeline = timelineSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          status: readText(data.status),
          changedAt: readText(data.changedAt),
          employeeName: readText(data.employeeName),
          note: readText(data.note),
        };
      });
    }

    return { kind: "success", repair };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Could not load this repair.",
    };
  }
}
