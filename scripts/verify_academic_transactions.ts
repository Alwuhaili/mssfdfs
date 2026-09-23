import {
  ACADEMIC_ERROR,
  incrementAcademicYear,
  isEnteredGrade,
  mapCertificateStatusToFinalResult,
  normalizeAcademicYear,
  type AccelerationAttempt,
  type AccelerationPolicy,
  type AcademicEnrollment,
  type StudentAcademicRef,
} from '../src/types/academicHistory.ts';
import {
  assertAuthoritativeCurrentEnrollment,
  assertEnrollmentDeletable,
  detectExistingTransition,
  getStudentEnrollmentsWithLegacyFallback,
  planAccelerationPromotionTransition,
  planRegularPromotionTransition,
  planRepeatYearTransition,
  resolveCertificateEnrollment,
} from '../src/services/academicHistoryService.ts';
import {
  assertAttemptDeletable,
  assertPolicyDeletable,
  calculateAccelerationResult,
  capturePolicySnapshot,
  createAccelerationAttempt,
  evaluateAccelerationEligibility,
  evaluateSubjectGradesAgainstRule,
  resolvePolicyThresholds,
  validateAccelerationGradeSemantics,
  validateAccelerationSubjectGradeRule,
} from '../src/services/accelerationService.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let pass = 0;
let total = 0;

function test(name: string, fn: () => void) {
  total += 1;
  try {
    fn();
    pass += 1;
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name, error instanceof Error ? error.message : error);
  }
}

function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function throwsCode(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (error) {
    const actual = (error as { code?: string }).code;
    if (actual !== code) throw new Error(`expected ${code}, got ${actual}`);
    return;
  }
  throw new Error(`expected throw ${code}`);
}

const enrollment = (overrides: Partial<AcademicEnrollment> = {}): AcademicEnrollment => ({
  id: 'enr-current',
  studentId: 'std-1',
  academicYear: '2025-2026',
  gradeLevel: 'الصف الرابع العلمي',
  attemptNumber: 1,
  enrollmentType: 'regular',
  status: 'active',
  finalResult: 'passed',
  transitionType: 'none',
  isDerived: false,
  provenance: 'authoritative',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

const student = (overrides: Partial<StudentAcademicRef> = {}): StudentAcademicRef => ({
  id: 'std-1',
  gradeLevel: 'الصف الرابع العلمي',
  enrollmentYear: '2025-2026',
  currentEnrollmentId: 'enr-current',
  ...overrides,
});

const policy = (overrides: Partial<AccelerationPolicy> = {}): AccelerationPolicy => ({
  id: 'pol-1',
  name: 'configured',
  gradeLevel: 'الصف الرابع العلمي',
  targetExamGradeLevel: 'الصف الخامس العلمي',
  resultingGradeLevel: 'الصف السادس العلمي',
  requiredExams: ['aptitude'],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

test('1 academic year normalization', () => {
  ok(normalizeAcademicYear('2026-2027') === '2026-2027', 'dash');
  ok(normalizeAcademicYear('2026/2027') === '2026-2027', 'slash');
  ok(normalizeAcademicYear('2026 - 2027') === '2026-2027', 'spaced dash');
  ok(normalizeAcademicYear(' 2025 / 2026 ') === '2025-2026', 'padded slash');
  ok(normalizeAcademicYear('') === null, 'empty is not invented');
  ok(normalizeAcademicYear('2026') === null, 'single year rejected');
  ok(incrementAcademicYear('2025/2026') === '2026-2027', 'increment');
});

test('2 enrollment deletion guards', () => {
  const current = enrollment();
  throwsCode(
    () => assertEnrollmentDeletable(current, student(), []),
    ACADEMIC_ERROR.ENROLLMENT_DELETE_FORBIDDEN
  );
  const historical = enrollment({ id: 'enr-old', status: 'closed' });
  throwsCode(
    () => assertEnrollmentDeletable(historical, student(), [enrollment({ previousEnrollmentId: 'enr-old' })]),
    ACADEMIC_ERROR.ENROLLMENT_DELETE_FORBIDDEN
  );
});

test('3 policy deletion guards', () => {
  throwsCode(
    () => assertPolicyDeletable('pol-1', [{ policyId: 'pol-1' } as AccelerationAttempt]),
    ACADEMIC_ERROR.POLICY_DELETE_FORBIDDEN
  );
  assertPolicyDeletable('pol-1', []);
});

test('4 approved acceleration-attempt deletion guard', () => {
  throwsCode(
    () => assertAttemptDeletable({ status: 'approved', resultingEnrollmentId: 'enr-next' } as AccelerationAttempt),
    ACADEMIC_ERROR.ATTEMPT_DELETE_FORBIDDEN
  );
});

test('5 dynamic policy-driven acceleration', () => {
  const pol = policy({
    aptitudePassingScore: 81,
    requiredExams: ['aptitude'],
  });
  const attempt = createAccelerationAttempt({
    studentId: 'std-1',
    sourceEnrollment: enrollment(),
    policy: pol,
  });
  attempt.examResults = [{ kind: 'aptitude', score: 80 }];
  const failed = calculateAccelerationResult(attempt);
  ok(failed.finalResult === 'failed', 'uses snapshot threshold 81, not an implicit 75');
  attempt.examResults = [{ kind: 'aptitude', score: 81 }];
  const passed = calculateAccelerationResult(attempt);
  ok(passed.finalResult === 'passed', 'passes only configured threshold');
});

test('6 certificate-to-enrollment resolver', () => {
  const persisted = enrollment({ certificateId: 'c1' });
  const cert = {
    id: 'c1',
    studentId: 'std-1',
    studentName: 'A',
    nationalId: 'n',
    gradeLevel: 'الصف الرابع العلمي' as const,
    section: 'أ',
    academicYear: '2025 / 2026',
    subjects: [],
    overallFirstTermAvg: 0,
    overallMidYearGrade: 0,
    overallSecondTermAvg: 0,
    overallAnnualSaeiAvg: 0,
    overallFinalExamGrade: 0,
    overallFinalGrade: 0,
    status: 'ناجحة' as const,
    appreciation: '',
    issueDate: '2026-01-01',
  };
  const resolved = resolveCertificateEnrollment(cert, [persisted]);
  ok(resolved?.id === 'enr-current', 'normalized year+grade match');
  const otherYear = resolveCertificateEnrollment({ ...cert, academicYear: '2024-2025' }, [persisted]);
  ok(otherYear === null, 'unrelated year does not match');
  const explicit = resolveCertificateEnrollment({ ...cert, academicEnrollmentId: 'enr-current' }, [persisted]);
  ok(explicit?.id === 'enr-current', 'explicit id');
});

test('7 authoritative current enrollment guard', () => {
  throwsCode(
    () => assertAuthoritativeCurrentEnrollment(student({ currentEnrollmentId: undefined }), enrollment()),
    ACADEMIC_ERROR.AUTHORITATIVE_ENROLLMENT_REQUIRED
  );
});

test('8 historical enrollment mutation rejection', () => {
  throwsCode(
    () =>
      assertAuthoritativeCurrentEnrollment(
        student(),
        enrollment({ isDerived: true, provenance: 'derived', id: 'enr-current' })
      ),
    ACADEMIC_ERROR.HISTORICAL_ENROLLMENT_MUTATION_FORBIDDEN
  );
});

test('9 acceleration status guards', () => {
  const source = enrollment();
  const attempt = createAccelerationAttempt({ studentId: 'std-1', sourceEnrollment: source, policy: policy() });
  attempt.status = 'nominated';
  attempt.finalResult = 'passed';
  throwsCode(
    () => planAccelerationPromotionTransition({ student: student(), source, attempt }),
    ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID
  );
  attempt.status = 'in_progress';
  throwsCode(
    () => planAccelerationPromotionTransition({ student: student(), source, attempt }),
    ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID
  );
  attempt.status = 'eligible';
  attempt.finalResult = 'pending';
  throwsCode(
    () => planAccelerationPromotionTransition({ student: student(), source, attempt }),
    ACADEMIC_ERROR.ACCELERATION_ATTEMPT_STATUS_INVALID
  );
});

test('10 idempotent consistent replay', () => {
  const source = enrollment({ nextEnrollmentId: 'enr-std-1-2026-2027-%D8%A7%D9%84%D8%B5%D9%81_%D8%A7%D9%84%D8%B1%D8%A7%D8%A8%D8%B9_%D8%A7%D9%84%D8%B9%D9%84%D9%85%D9%8A-2-repeat' });
  const planned = planRepeatYearTransition({ student: student(), source: enrollment() });
  const existingNext = planned.nextEnrollment;
  const linkedSource = { ...enrollment(), nextEnrollmentId: existingNext.id, status: 'superseded' as const };
  const mode = detectExistingTransition(
    linkedSource,
    existingNext,
    existingNext,
    student({ currentEnrollmentId: existingNext.id })
  );
  ok(mode === 'idempotent', 'consistent replay');
  const again = planRepeatYearTransition({
    student: student({ currentEnrollmentId: existingNext.id }),
    source: linkedSource,
    existingNext,
  });
  ok(again.replay === true, 'repeat replay flagged');
});

test('11 inconsistent replay -> ACADEMIC_TRANSITION_CONFLICT', () => {
  throwsCode(
    () =>
      detectExistingTransition(
        enrollment({ nextEnrollmentId: 'other' }),
        enrollment({ id: 'expected' }),
        enrollment({ id: 'other', previousEnrollmentId: 'nope' }),
        student({ currentEnrollmentId: 'other' })
      ),
    ACADEMIC_ERROR.ACADEMIC_TRANSITION_CONFLICT
  );
});

test('12 no hardcoded acceleration thresholds', () => {
  const accelerationSrc = readFileSync(resolve('src/services/accelerationService.ts'), 'utf8');
  ok(!accelerationSrc.includes('DEFAULT_ACCELERATION_POLICIES'), 'no default policies');
  ok(!/\|\|\s*75\b/.test(accelerationSrc), 'no || 75');
  ok(!/\?\?\s*75\b/.test(accelerationSrc), 'no ?? 75');
  const empty = resolvePolicyThresholds(policy());
  ok(empty.ok && empty.thresholds.aptitudePassingScore === undefined, 'no implicit aptitude score');
});

test('13 missing subjectGradeSource when minSubjectGrade is configured', () => {
  const resolved = resolvePolicyThresholds(policy({ minSubjectGrade: 70 }));
  if (resolved.ok === false) {
    ok(resolved.code === ACADEMIC_ERROR.POLICY_CONFIGURATION_INCOMPLETE, 'source required');
  } else {
    throw new Error('expected incomplete policy');
  }
});

test('14 zero/unentered grade handling', () => {
  ok(isEnteredGrade(0) === false, 'zero is unentered');
  const evaluation = evaluateAccelerationEligibility(
    policy({ minSubjectGrade: 50, subjectGradeSource: 'finalGrade' }),
    {
      id: 'c',
      studentId: 'std-1',
      studentName: 'A',
      nationalId: 'n',
      gradeLevel: 'الصف الرابع العلمي',
      section: 'أ',
      academicYear: '2025-2026',
      subjects: [{
        id: 's1',
        subjectName: 'الرياضيات',
        firstTermAvg: 0,
        midYearGrade: 0,
        secondTermAvg: 0,
        annualSaeiAvg: 90,
        finalExamGrade: 0,
        finalGrade: 0,
      }],
      overallFirstTermAvg: 0,
      overallMidYearGrade: 0,
      overallSecondTermAvg: 0,
      overallAnnualSaeiAvg: 90,
      overallFinalExamGrade: 0,
      overallFinalGrade: 0,
      status: 'ناجحة',
      appreciation: '',
      issueDate: '',
    },
    enrollment()
  );
  ok(evaluation.incomplete, 'does not substitute annualSaeiAvg for missing finalGrade');
});

test('15 distinct source / exam / resulting grades', () => {
  const attempt = createAccelerationAttempt({
    studentId: 'std-1',
    sourceEnrollment: enrollment(),
    policy: policy(),
  });
  ok(attempt.sourceGradeLevel === 'الصف الرابع العلمي', 'source');
  ok(attempt.targetExamGradeLevel === 'الصف الخامس العلمي', 'exam');
  ok(attempt.resultingGradeLevel === 'الصف السادس العلمي', 'resulting');
});

test('16 missing resultingGradeLevel must not become targetExamGradeLevel', () => {
  const incomplete = {
    id: 'pol-x',
    name: 'x',
    gradeLevel: 'الصف الرابع العلمي' as const,
    targetExamGradeLevel: 'الصف الخامس العلمي' as const,
    resultingGradeLevel: undefined as unknown as AccelerationPolicy['resultingGradeLevel'],
    requiredExams: [],
    createdAt: '',
    updatedAt: '',
  };
  const semantics = validateAccelerationGradeSemantics(incomplete);
  ok(!semantics.ok, 'missing resulting fails');
  try {
    createAccelerationAttempt({ studentId: 'std-1', sourceEnrollment: enrollment(), policy: incomplete as AccelerationPolicy });
    throw new Error('should not create');
  } catch (error) {
    ok((error as { code?: string }).code === ACADEMIC_ERROR.ACCELERATION_SEMANTICS_INCOMPLETE, 'nomination blocked');
  }
});

test('17 canonical-vs-legacy threshold conflict rejection', () => {
  const resolved = resolvePolicyThresholds(
    policy({
      aptitudePassingScore: 80,
      eligibilityRules: { aptitudePassingScore: 70 },
    })
  );
  if (resolved.ok === false) {
    ok(resolved.code === ACADEMIC_ERROR.POLICY_RULE_CONFLICT, 'conflict rejected');
  } else {
    throw new Error('expected conflict');
  }
});

test('18 regular promotion ignores caller isSecondRound', () => {
  const source = enrollment({ finalResult: 'failed' });
  throwsCode(
    () =>
      planRegularPromotionTransition({
        student: student(),
        source,
        persistedFinalResult: 'failed',
        callerIsSecondRound: true,
      }),
    ACADEMIC_ERROR.HISTORICAL_ENROLLMENT_MUTATION_FORBIDDEN
  );
  const passedPlan = planRegularPromotionTransition({
    student: student(),
    source: enrollment({ finalResult: 'passed' }),
    persistedFinalResult: 'passed',
    callerIsSecondRound: true,
  });
  ok(passedPlan.sourceUpdate.finalResult === 'passed', 'persisted result kept');
  ok(passedPlan.audit.details.includes('callerIsSecondRound ignored'), 'flag not authoritative');
});

test('legacy certificate merge keeps persisted + unmatched derived', () => {
  const persisted = enrollment();
  const unmatched = {
    id: 'c-old',
    studentId: 'std-1',
    studentName: 'A',
    nationalId: 'n',
    gradeLevel: 'الصف الثالث المتوسط' as const,
    section: 'أ',
    academicYear: '2024-2025',
    subjects: [],
    overallFirstTermAvg: 0,
    overallMidYearGrade: 0,
    overallSecondTermAvg: 0,
    overallAnnualSaeiAvg: 0,
    overallFinalExamGrade: 0,
    overallFinalGrade: 0,
    status: 'مكملة' as const,
    appreciation: '',
    issueDate: '2025-01-01',
  };
  const matched = {
    ...unmatched,
    id: 'c-now',
    gradeLevel: 'الصف الرابع العلمي' as const,
    academicYear: '2025-2026',
    status: 'ناجحة' as const,
  };
  const merged = getStudentEnrollmentsWithLegacyFallback([persisted], [unmatched, matched], 'std-1');
  ok(merged.some((row) => row.id === 'enr-current'), 'persisted kept');
  ok(merged.some((row) => row.id === 'derived-cert-c-old' && row.isDerived && row.provenance === 'derived'), 'unmatched derived');
  ok(!merged.some((row) => row.id === 'derived-cert-c-now'), 'matched cert does not duplicate');
  ok(mapCertificateStatusToFinalResult('مكملة') === 'pending', 'مكملة stays pending');
});

test('eligible + passed acceleration plans a fresh transition', () => {
  const source = enrollment();
  const attempt = createAccelerationAttempt({ studentId: 'std-1', sourceEnrollment: source, policy: policy() });
  attempt.status = 'eligible';
  attempt.finalResult = 'passed';
  const planned = planAccelerationPromotionTransition({ student: student(), source, attempt });
  ok(planned.kind === 'acceleration_promotion', 'planned');
  ok(planned.nextEnrollment.gradeLevel === 'الصف السادس العلمي', 'uses resulting not exam grade');
  ok(planned.nextEnrollment.gradeLevel !== attempt.targetExamGradeLevel, 'exam grade is distinct');
});

const compositeRule = { baselineMinimum: 96, exceptionMinimum: 93, maxExceptionSubjects: 2 };

test('A composite subject rule all at or above baseline passes', () => {
  const result = evaluateSubjectGradesAgainstRule(
    [96, 97, 100].map((value, index) => ({ name: `s${index}`, value })),
    compositeRule
  );
  ok(result.status === 'passed', 'A pass');
});

test('B composite subject rule two exceptions passes', () => {
  const result = evaluateSubjectGradesAgainstRule(
    [93, 95, 96, 100].map((value, index) => ({ name: `s${index}`, value })),
    compositeRule
  );
  ok(result.status === 'passed', 'B pass');
});

test('C composite subject rule three exceptions fails', () => {
  const result = evaluateSubjectGradesAgainstRule(
    [93, 94, 95, 96].map((value, index) => ({ name: `s${index}`, value })),
    compositeRule
  );
  ok(result.status === 'failed' && 'code' in result && result.code === 'too_many_exception_subjects', 'C fail');
});

test('D composite subject rule below exception minimum fails', () => {
  const result = evaluateSubjectGradesAgainstRule(
    [92, 100, 100].map((value, index) => ({ name: `s${index}`, value })),
    compositeRule
  );
  ok(result.status === 'failed' && 'code' in result && result.code === 'below_exception_minimum', 'D fail');
});

test('E unentered zero grade is incomplete not academic fail', () => {
  const result = evaluateSubjectGradesAgainstRule(
    [{ name: 'math', value: 0 }, { name: 'ar', value: 100 }],
    compositeRule
  );
  ok(result.status === 'incomplete', 'E incomplete');
});

test('empty subject list is incomplete under a valid composite rule', () => {
  const result = evaluateSubjectGradesAgainstRule([], compositeRule);
  ok(result.status === 'incomplete', 'empty grades incomplete');
});

test('F legacy minSubjectGrade-only policy keeps previous semantics', () => {
  const legacyPolicy = policy({ minSubjectGrade: 97, subjectGradeSource: 'finalGrade' });
  const cert = {
    id: 'c-legacy',
    studentId: 'std-1',
    studentName: 'A',
    nationalId: 'n',
    gradeLevel: 'الصف الرابع العلمي' as const,
    section: 'أ',
    academicYear: '2025-2026',
    subjects: [
      {
        id: 's1',
        subjectName: 'الرياضيات',
        firstTermAvg: 0,
        midYearGrade: 0,
        secondTermAvg: 0,
        annualSaeiAvg: 99,
        finalExamGrade: 0,
        finalGrade: 96,
      },
    ],
    overallFirstTermAvg: 0,
    overallMidYearGrade: 0,
    overallSecondTermAvg: 0,
    overallAnnualSaeiAvg: 99,
    overallFinalExamGrade: 0,
    overallFinalGrade: 96,
    status: 'ناجحة' as const,
    appreciation: '',
    issueDate: '',
  };
  const evaluation = evaluateAccelerationEligibility(legacyPolicy, cert, enrollment());
  ok(evaluation.eligible === false && evaluation.incomplete === false, '96 < 97 still fails uniformly');
  cert.subjects[0].finalGrade = 97;
  cert.overallFinalGrade = 97;
  const passed = evaluateAccelerationEligibility(legacyPolicy, cert, enrollment());
  ok(passed.eligible === true, '97 meets minSubjectGrade');
});

test('G snapshot clones subjectGradeRule independently', () => {
  const live = policy({
    subjectGradeRule: { baselineMinimum: 96, exceptionMinimum: 93, maxExceptionSubjects: 2 },
    subjectGradeSource: 'finalGrade',
  });
  const snapshot = capturePolicySnapshot(live);
  ok(snapshot.subjectGradeRule?.baselineMinimum === 96, 'captured');
  live.subjectGradeRule!.baselineMinimum = 80;
  live.subjectGradeRule!.maxExceptionSubjects = 9;
  ok(snapshot.subjectGradeRule?.baselineMinimum === 96, 'snapshot baseline unchanged');
  ok(snapshot.subjectGradeRule?.maxExceptionSubjects === 2, 'snapshot exceptions unchanged');
  ok(snapshot.subjectGradeRule !== live.subjectGradeRule, 'different object');
});

test('H exceptionMinimum above baseline is a policy conflict', () => {
  const result = validateAccelerationSubjectGradeRule({
    baselineMinimum: 93,
    exceptionMinimum: 96,
    maxExceptionSubjects: 2,
  });
  ok(result.ok === false, 'invalid');
  if (result.ok === false) {
    ok(result.code === ACADEMIC_ERROR.POLICY_RULE_CONFLICT, 'H conflict');
  }
});

test('I negative or fractional maxExceptionSubjects is invalid', () => {
  const negative = validateAccelerationSubjectGradeRule({
    baselineMinimum: 96,
    exceptionMinimum: 93,
    maxExceptionSubjects: -1,
  });
  ok(negative.ok === false, 'negative invalid');
  const fractional = validateAccelerationSubjectGradeRule({
    baselineMinimum: 96,
    exceptionMinimum: 93,
    maxExceptionSubjects: 1.5,
  });
  ok(fractional.ok === false, 'fractional invalid');
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
