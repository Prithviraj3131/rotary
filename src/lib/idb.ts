import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PendingReport } from '../types/reports';
import { ReportRow, CellRiskRow } from '../types/database';
import { OfflineQueuedMessage } from '../types/relay';

interface FloodGuardDB extends DBSchema {
  pendingReports: {
    key: string; // client_uuid
    value: PendingReport;
    indexes: { 'by-status': string };
  };
  seenAlerts: {
    key: string; // alert_id
    value: {
      id: string;
      issued_at: string;
      expires_at: string;
      received_at: string;
    };
  };
  cachedReports: {
    key: string;
    value: ReportRow;
  };
  cachedCellRisk: {
    key: string;
    value: CellRiskRow;
  };
  offlineMessages: {
    key: string; // id
    value: OfflineQueuedMessage;
  };
}

const DB_NAME = 'floodguard_pune_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<FloodGuardDB>> | null = null;

export function getIDB(): Promise<IDBPDatabase<FloodGuardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FloodGuardDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pendingReports')) {
          const store = db.createObjectStore('pendingReports', { keyPath: 'client_uuid' });
          store.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('seenAlerts')) {
          db.createObjectStore('seenAlerts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedReports')) {
          db.createObjectStore('cachedReports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedCellRisk')) {
          db.createObjectStore('cachedCellRisk', { keyPath: 'cell_id' });
        }
        if (!db.objectStoreNames.contains('offlineMessages')) {
          db.createObjectStore('offlineMessages', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function savePendingReport(report: PendingReport): Promise<void> {
  const db = await getIDB();
  await db.put('pendingReports', report);
}

export async function getPendingReports(): Promise<PendingReport[]> {
  const db = await getIDB();
  return db.getAll('pendingReports');
}

export async function removePendingReport(client_uuid: string): Promise<void> {
  const db = await getIDB();
  await db.delete('pendingReports', client_uuid);
}

export async function cacheReportsLocally(reports: ReportRow[]): Promise<void> {
  const db = await getIDB();
  const tx = db.transaction('cachedReports', 'readwrite');
  await tx.store.clear();
  for (const r of reports) {
    await tx.store.put(r);
  }
  await tx.done;
}

export async function getLocalCachedReports(): Promise<ReportRow[]> {
  const db = await getIDB();
  return db.getAll('cachedReports');
}

// Offline Mesh Messages in IndexedDB
export async function saveOfflineMessageIDB(msg: OfflineQueuedMessage): Promise<void> {
  const db = await getIDB();
  await db.put('offlineMessages', msg);
}

export async function getOfflineMessagesIDB(): Promise<OfflineQueuedMessage[]> {
  const db = await getIDB();
  return db.getAll('offlineMessages');
}

export async function deleteOfflineMessageIDB(id: string): Promise<void> {
  const db = await getIDB();
  await db.delete('offlineMessages', id);
}
