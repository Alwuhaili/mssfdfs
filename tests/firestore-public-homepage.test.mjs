import fs from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const HOST = process.env.FIRESTORE_EMULATOR_HOST || "";
if (!/^127\.0\.0\.1:\d+$/.test(HOST) && !/^localhost:\d+$/.test(HOST)) {
  throw new Error("SAFETY STOP: FIRESTORE_EMULATOR_HOST must point to localhost.");
}
const [host, portText] = HOST.split(":");
const rules = fs.readFileSync("firestore.rules", "utf8");
const env = await initializeTestEnvironment({
  projectId: "public-homepage-emulator-only",
  firestore: { host, port: Number(portText), rules },
});

const homepage = "publicContent/homepage";
const publicDoc = {
  schoolInfo: {
    schoolName: "ثانوية ميسان للمتميزات",
    schoolWorkingHoursInfo: "حتى 1:45 ظهراً",
    principalName: "الهام صبيح سعدون",
  },
  news: [{ id: "n1", title: "مهرجان", category: "مهرجانات", date: "2026", image: "https://example.com/n.jpg", summary: "س", fullContent: "ت", location: "القاعة", organizer: "الإدارة" }],
  gallery: [{ id: "g1", title: "مختبر", category: "المختبرات العلمية", url: "https://example.com/g.jpg", date: "2026", desc: "وصف" }],
  faculty: [{ id: "tech-1", name: "أ. سناء", subject: "فيزياء", avatar: "", facultyRoleTitle: "مدرسة", facultyDegree: "ماجستير", researchCount: 1, booksCount: 0, gamesCount: 0, facultyAchievements: ["بحث"] }],
  honorBoard: [{ sourceId: "grad-1", sourceType: "graduate", academicYear: "2025-2026", grade: "الصف السادس العلمي", rank: 1, name: "خريجة", avatar: "", section: "أ", gpa: 98.4, specialty: "طب", dream: "جراحة" }],
  updatedAt: "2026-09-21T00:00:00.000Z",
};

try {
  await env.clearFirestore();

  const guest = env.unauthenticatedContext().firestore();
  const teacher = env.authenticatedContext("uid-teacher", { role: "teacher" }).firestore();
  const parent = env.authenticatedContext("uid-parent", { role: "parent" }).firestore();
  const student = env.authenticatedContext("uid-student", { role: "student" }).firestore();
  const supervisor = env.authenticatedContext("uid-supervisor", { role: "supervisor" }).firestore();
  const admin = env.authenticatedContext("uid-admin", { role: "admin" }).firestore();

  await assertFails(setDoc(doc(guest, homepage), publicDoc));
  console.log("B guest cannot write public homepage: PASS");

  await assertFails(setDoc(doc(teacher, homepage), publicDoc));
  await assertFails(setDoc(doc(parent, homepage), publicDoc));
  await assertFails(setDoc(doc(student, homepage), publicDoc));
  await assertFails(setDoc(doc(supervisor, homepage), publicDoc));
  console.log("C non-admin authenticated roles cannot write public homepage: PASS");

  await assertSucceeds(setDoc(doc(admin, homepage), publicDoc, { merge: true }));
  console.log("D admin can write public homepage: PASS");

  const guestSnap = await assertSucceeds(getDoc(doc(guest, homepage)));
  if (!guestSnap.exists() || guestSnap.data().schoolInfo.schoolWorkingHoursInfo !== "حتى 1:45 ظهراً") {
    throw new Error("guest read did not return published hours");
  }
  if (guestSnap.data().news?.[0]?.title !== "مهرجان") throw new Error("guest news missing");
  if (guestSnap.data().gallery?.[0]?.id !== "g1") throw new Error("guest gallery missing");
  console.log("A guest can read public homepage: PASS");
  console.log("F news persists in public Firestore content: PASS");
  console.log("G gallery persists in public Firestore content: PASS");

  const teacherRead = await assertSucceeds(getDoc(doc(teacher, homepage)));
  if (!teacherRead.exists()) throw new Error("authenticated read failed");
  console.log("authenticated non-admin can read public homepage: PASS");

  await assertFails(setDoc(doc(guest, homepage), {
    ...publicDoc,
    news: [{ id: "hack", title: "from guest localStorage", category: "x", date: "x", image: "x", summary: "x", fullContent: "x", location: "x", organizer: "x" }],
  }));
  const afterGuestAttempt = await getDoc(doc(admin, homepage));
  if (afterGuestAttempt.data().news?.[0]?.id !== "n1") throw new Error("guest overwrite succeeded");
  console.log("H guest localStorage/client cannot overwrite Firestore: PASS");

  await assertFails(getDoc(doc(guest, "appSettings/schoolAdminData")));
  await assertFails(getDoc(doc(guest, "teachers/tech-1")));
  await assertFails(getDoc(doc(guest, "students/st-1")));
  console.log("guest still cannot read private collections: PASS");

  await env.clearFirestore();
  const news = publicDoc.news;
  const gallery = publicDoc.gallery;
  await assertSucceeds(setDoc(doc(admin, homepage), {
    news,
    gallery,
    updatedAt: "before-schoolinfo",
  }));
  await assertFails(setDoc(doc(guest, homepage), { schoolInfo: publicDoc.schoolInfo }, { merge: true }));
  await assertFails(setDoc(doc(teacher, homepage), { schoolInfo: publicDoc.schoolInfo }, { merge: true }));
  console.log("A/B guest and teacher cannot initialize schoolInfo: PASS");

  await assertSucceeds(setDoc(doc(admin, homepage), {
    schoolInfo: {
      ...publicDoc.schoolInfo,
      schoolWorkingHoursDetail: "الأحد إلى الخميس",
      schoolUniformInfo: "الزي",
      schoolUniformDetail: "التفاصيل",
      schoolPolicyInfo: "السياسة",
      schoolPolicyDetail: "تفاصيل السياسة",
      principalBadge: "المديرة",
      principalTitle: "مديرة",
      visionMessage: "رؤية",
    },
    updatedAt: "after-schoolinfo",
  }, { merge: true }));
  const merged = await getDoc(doc(admin, homepage));
  if (merged.data().news?.[0]?.id !== "n1") throw new Error("news lost during schoolInfo init");
  if (merged.data().gallery?.[0]?.id !== "g1") throw new Error("gallery lost during schoolInfo init");
  if (merged.data().schoolInfo?.schoolWorkingHoursInfo !== "حتى 1:45 ظهراً") throw new Error("schoolInfo not initialized");
  console.log("F existing news/gallery survive schoolInfo initialization: PASS");
  console.log("C admin can initialize schoolInfo: PASS");

  await env.clearFirestore();
  await assertSucceeds(setDoc(doc(admin, homepage), {
    schoolInfo: publicDoc.schoolInfo,
    news,
    gallery,
    faculty: publicDoc.faculty,
    honorBoard: publicDoc.honorBoard,
  }));

  await assertFails(setDoc(doc(guest, homepage), { faculty: [{ id: "hack", name: "guest" }] }, { merge: true }));
  await assertFails(setDoc(doc(teacher, homepage), { faculty: [{ id: "hack", name: "teacher" }] }, { merge: true }));
  console.log("E guest cannot write faculty/honorBoard: PASS");
  console.log("F non-admin cannot write faculty/honorBoard: PASS");

  await assertSucceeds(setDoc(doc(admin, homepage), {
    faculty: [{
      id: "tech-2",
      name: "أ. زينب",
      subject: "كيمياء",
      avatar: "",
      facultyRoleTitle: "مدرسة",
      facultyDegree: "دكتوراه",
      researchCount: 2,
      booksCount: 1,
      gamesCount: 0,
      facultyAchievements: ["كتاب"],
    }],
    updatedAt: "faculty-update",
  }, { merge: true }));
  const afterFaculty = await getDoc(doc(admin, homepage));
  if (afterFaculty.data().schoolInfo?.schoolWorkingHoursInfo !== "حتى 1:45 ظهراً") throw new Error("schoolInfo lost during faculty update");
  if (afterFaculty.data().news?.[0]?.id !== "n1") throw new Error("news lost during faculty update");
  if (afterFaculty.data().gallery?.[0]?.id !== "g1") throw new Error("gallery lost during faculty update");
  if (afterFaculty.data().honorBoard?.[0]?.sourceId !== "grad-1") throw new Error("honorBoard lost during faculty update");
  if (afterFaculty.data().faculty?.[0]?.id !== "tech-2") throw new Error("faculty not published");
  console.log("G admin can publish faculty: PASS");
  console.log("H faculty update preserves schoolInfo/news/gallery/honorBoard: PASS");

  await assertSucceeds(setDoc(doc(admin, homepage), {
    honorBoard: [{
      sourceId: "grad-2",
      sourceType: "graduate",
      academicYear: "2025-2026",
      grade: "الصف السادس العلمي",
      rank: 1,
      name: "خريجة جديدة",
      avatar: "",
      section: "ب",
      gpa: 99.1,
      specialty: "هندسة",
      dream: "فضاء",
    }],
    updatedAt: "honor-update",
  }, { merge: true }));
  const afterHonor = await getDoc(doc(admin, homepage));
  if (afterHonor.data().schoolInfo?.principalName !== "الهام صبيح سعدون") throw new Error("schoolInfo lost during honor update");
  if (afterHonor.data().news?.[0]?.id !== "n1") throw new Error("news lost during honor update");
  if (afterHonor.data().gallery?.[0]?.id !== "g1") throw new Error("gallery lost during honor update");
  if (afterHonor.data().faculty?.[0]?.id !== "tech-2") throw new Error("faculty lost during honor update");
  if (afterHonor.data().honorBoard?.[0]?.sourceId !== "grad-2") throw new Error("honorBoard not published");
  console.log("G admin can publish honorBoard: PASS");
  console.log("I honor update preserves schoolInfo/news/gallery/faculty: PASS");

  await assertFails(getDoc(doc(guest, "teachers/tech-1")));
  await assertFails(getDoc(doc(guest, "students/st-1")));
  await assertFails(getDoc(doc(guest, "graduates/grad-1")));
  const guestHonor = await assertSucceeds(getDoc(doc(guest, homepage)));
  if (guestHonor.data().honorBoard?.[0]?.sourceType !== "graduate") throw new Error("guest honorBoard missing graduate sixth-grade projection");
  console.log("guest still cannot read teachers/students/graduates: PASS");

  console.log("PUBLIC HOMEPAGE FIRESTORE RULES TEST: PASS");
} finally {
  await env.cleanup();
}
