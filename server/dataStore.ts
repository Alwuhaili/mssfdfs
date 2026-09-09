/**
 * Central Server-Side School Data Store
 * خادم التخزين المركزي الموحد لمزامنة كافة بيانات المدرسة لجميع المستخدمين
 * ثانوية ميسان للمتميزات
 */

import fs from "fs";
import path from "path";

export interface SchoolDataPayload {
  teachers?: any[];
  students?: any[];
  parents?: any[];
  supervisors?: any[];
  graduates?: any[];
  exams?: any[];
  submissions?: any[];
  attendance?: any[];
  announcements?: any[];
  messages?: any[];
  lectures?: any[];
  deletedLectureIds?: string[];
  deletedChallengeIds?: string[];
  timetable?: any[];
  subjectQuotas?: any[];
  financial?: any[];
  notifications?: any[];
  certificates?: any[];
  calendarEvents?: any[];
  challenges?: any[];
  userPasscodes?: any;
  schoolAdminData?: any;
  decisionSettings?: any;
  auditLogs?: any[];
  annualPlans?: any[];
  dailyLessonPlans?: any[];
  examSchedules?: any[];
  customFolders?: any[];
  [key: string]: any;
}

export interface SyncStoreState {
  version: number;
  lastModified: string;
  lastSyncedBy?: {
    id?: string;
    name?: string;
    role?: string;
  };
  data: SchoolDataPayload;
}

export type StoreSubscriber = (event: {
  type: string;
  version: number;
  lastModified: string;
  lastSyncedBy?: any;
  data: SchoolDataPayload;
}) => void;

class CentralDataStore {
  private dbFilePath: string;
  private dbDir: string;
  private state: SyncStoreState;
  private isSaving: boolean = false;
  private pendingSave: boolean = false;
  private subscribers: Set<StoreSubscriber> = new Set();

  constructor() {
    this.dbDir = path.join(process.cwd(), "data");
    this.dbFilePath = path.join(this.dbDir, "maysan_school_database.json");
    this.state = {
      version: 1,
      lastModified: new Date().toISOString(),
      data: {},
    };

    this.init();
  }

  public subscribe(callback: StoreSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public notifySubscribers(event: {
    type: string;
    version: number;
    lastModified: string;
    lastSyncedBy?: any;
    data: SchoolDataPayload;
  }) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error("[DataStore] Error in subscriber callback:", err);
      }
    });
  }

  private init() {
    try {
      if (!fs.existsSync(this.dbDir)) {
        fs.mkdirSync(this.dbDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, "utf-8");
        if (raw && raw.trim().length > 0) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            this.state = {
              version: Number(parsed.version) || 1,
              lastModified: parsed.lastModified || new Date().toISOString(),
              lastSyncedBy: parsed.lastSyncedBy,
              data: parsed.data || {},
            };
            console.log(
              `[DataStore] Loaded central database (version: ${this.state.version}, keys: ${Object.keys(this.state.data).length})`
            );
            return;
          }
        }
      }
      console.log("[DataStore] Initialized empty central database. Awaiting first client sync.");
    } catch (error) {
      console.error("[DataStore] Failed to initialize database file:", error);
    }
  }

  private persistToDisk(): void {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    this.isSaving = true;
    const tempFilePath = `${this.dbFilePath}.tmp`;

    try {
      if (!fs.existsSync(this.dbDir)) {
        fs.mkdirSync(this.dbDir, { recursive: true });
      }

      const serialized = JSON.stringify(this.state, null, 2);
      fs.writeFileSync(tempFilePath, serialized, "utf-8");
      fs.renameSync(tempFilePath, this.dbFilePath);
    } catch (error) {
      console.error("[DataStore] Failed to write database to disk:", error);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.persistToDisk();
      }
    }
  }

  public getData(): SyncStoreState {
    return {
      version: this.state.version,
      lastModified: this.state.lastModified,
      lastSyncedBy: this.state.lastSyncedBy,
      data: this.state.data,
    };
  }

  public getStatus() {
    const data = this.state.data;
    return {
      version: this.state.version,
      lastModified: this.state.lastModified,
      lastSyncedBy: this.state.lastSyncedBy,
      totalKeys: Object.keys(data).length,
      counts: {
        teachers: Array.isArray(data.teachers) ? data.teachers.length : 0,
        students: Array.isArray(data.students) ? data.students.length : 0,
        parents: Array.isArray(data.parents) ? data.parents.length : 0,
        certificates: Array.isArray(data.certificates) ? data.certificates.length : 0,
        exams: Array.isArray(data.exams) ? data.exams.length : 0,
        submissions: Array.isArray(data.submissions) ? data.submissions.length : 0,
        attendance: Array.isArray(data.attendance) ? data.attendance.length : 0,
        messages: Array.isArray(data.messages) ? data.messages.length : 0,
        announcements: Array.isArray(data.announcements) ? data.announcements.length : 0,
        lectures: Array.isArray(data.lectures) ? data.lectures.length : 0,
        challenges: Array.isArray(data.challenges) ? data.challenges.length : 0,
        annualPlans: Array.isArray(data.annualPlans) ? data.annualPlans.length : 0,
        dailyLessonPlans: Array.isArray(data.dailyLessonPlans) ? data.dailyLessonPlans.length : 0,
        examSchedules: Array.isArray(data.examSchedules) ? data.examSchedules.length : 0,
      },
    };
  }

  public updateData(
    updates: Partial<SchoolDataPayload>,
    sourceUser?: { id?: string; name?: string; role?: string }
  ): SyncStoreState {
    if (!updates || typeof updates !== "object") {
      return this.getData();
    }

    const currentData = this.state.data;
    const mergedData: SchoolDataPayload = { ...currentData };

    const isAdmin =
      sourceUser?.role === "admin" ||
      sourceUser?.id === "admin-main" ||
      sourceUser?.role === "director" ||
      (sourceUser?.name && (sourceUser.name.includes("المديرة") || sourceUser.name.includes("إدارة")));

    // Admin-exclusive entities that cannot be overwritten by students or teachers
    const ADMIN_EXCLUSIVE_KEYS = [
      "teachers",
      "students",
      "parents",
      "supervisors",
      "graduates",
      "certificates",
      "announcements",
      "timetable",
      "subjectQuotas",
      "financial",
      "schoolAdminData",
      "decisionSettings",
      "examSchedules",
    ];

    for (const key of Object.keys(updates)) {
      const val = updates[key];
      if (val === undefined) continue;

      if (isAdmin) {
        // The Administration / Directress has absolute authority: complete replacement for additions, modifications, and deletions
        mergedData[key] = val;
      } else {
        // Non-admin user (teacher, student, parent)
        if (ADMIN_EXCLUSIVE_KEYS.includes(key)) {
          // Prevent non-admin clients from overwriting admin-managed master school data
          continue;
        }

        // Intelligently merge operational entities
        if (key === "submissions" && Array.isArray(val)) {
          const currentList = Array.isArray(mergedData.submissions) ? [...mergedData.submissions] : [];
          val.forEach((sub: any) => {
            const matchIdx = currentList.findIndex(
              (item) => item.id === sub.id || (item.studentId === sub.studentId && item.examId === sub.examId)
            );
            if (matchIdx >= 0) {
              currentList[matchIdx] = { ...currentList[matchIdx], ...sub };
            } else {
              currentList.push(sub);
            }
          });
          mergedData.submissions = currentList;
        } else if (key === "attendance" && Array.isArray(val)) {
          const currentList = Array.isArray(mergedData.attendance) ? [...mergedData.attendance] : [];
          val.forEach((att: any) => {
            const matchIdx = currentList.findIndex(
              (item) => item.id === att.id || (item.date === att.date && item.grade === att.grade && item.section === att.section)
            );
            if (matchIdx >= 0) {
              currentList[matchIdx] = { ...currentList[matchIdx], ...att };
            } else {
              currentList.push(att);
            }
          });
          mergedData.attendance = currentList;
        } else if (key === "messages" && Array.isArray(val)) {
          const currentList = Array.isArray(mergedData.messages) ? [...mergedData.messages] : [];
          val.forEach((msg: any) => {
            const matchIdx = currentList.findIndex((item) => item.id === msg.id);
            if (matchIdx >= 0) {
              currentList[matchIdx] = { ...currentList[matchIdx], ...msg };
            } else {
              currentList.push(msg);
            }
          });
          mergedData.messages = currentList;
        } else if ((key === "lectures" || key === "challenges" || key === "annualPlans" || key === "dailyLessonPlans") && Array.isArray(val)) {
          const currentList = Array.isArray(mergedData[key]) ? [...mergedData[key]] : [];
          val.forEach((item: any) => {
            const matchIdx = currentList.findIndex((it) => it.id === item.id);
            if (matchIdx >= 0) {
              currentList[matchIdx] = { ...currentList[matchIdx], ...item };
            } else {
              currentList.push(item);
            }
          });
          mergedData[key] = currentList;
        } else {
          mergedData[key] = val;
        }
      }
    }

    this.state = {
      version: this.state.version + 1,
      lastModified: new Date().toISOString(),
      lastSyncedBy: sourceUser || this.state.lastSyncedBy,
      data: mergedData,
    };

    this.persistToDisk();

    console.log(
      `[DataStore] Database updated to v${this.state.version} by ${sourceUser?.name || "System"} (${sourceUser?.role || "user"})${isAdmin ? " [ADMIN_AUTHORITY]" : ""}`
    );

    // Notify all real-time SSE connected clients immediately
    this.notifySubscribers({
      type: "DATA_UPDATED",
      version: this.state.version,
      lastModified: this.state.lastModified,
      lastSyncedBy: this.state.lastSyncedBy,
      data: this.state.data,
    });

    return this.getData();
  }

  public resetDatabase(seedData?: SchoolDataPayload): SyncStoreState {
    this.state = {
      version: this.state.version + 1,
      lastModified: new Date().toISOString(),
      lastSyncedBy: { id: "system", name: "إعادة تعيين رسمية", role: "admin" },
      data: seedData || {},
    };

    this.persistToDisk();

    this.notifySubscribers({
      type: "DATABASE_RESET",
      version: this.state.version,
      lastModified: this.state.lastModified,
      lastSyncedBy: this.state.lastSyncedBy,
      data: this.state.data,
    });

    return this.getData();
  }
}

export const serverDataStore = new CentralDataStore();
