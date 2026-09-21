import {
  persistPrivateHomepageImageUrl,
  sanitizeHomepagePathId,
  sanitizePublicHttpsImageUrl,
} from '../src/utils/publicHomepageImageUrl.ts';
import {
  collectLegacyHomepageDataUrlFields,
  parsePublicHomepageDocument,
  PUBLIC_HOMEPAGE_JSON_WARN_CHARS,
  publicHomepageImageFieldsAreHttpsOrEmpty,
} from '../src/utils/publicHomepageProjection.ts';

let pass = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    pass++;
    console.log('PASS', name);
  } catch (err) {
    console.error('FAIL', name, err.message);
  }
}

function ok(value, message) {
  if (!value) throw new Error(message);
}

const DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('sanitizePublicHttpsImageUrl allows https only', () => {
  ok(sanitizePublicHttpsImageUrl('https://cdn.example/a.jpg') === 'https://cdn.example/a.jpg', 'https kept');
  ok(sanitizePublicHttpsImageUrl(DATA_URL) === '', 'data dropped');
  ok(sanitizePublicHttpsImageUrl('blob:https://x/1') === '', 'blob dropped');
  ok(sanitizePublicHttpsImageUrl('javascript:alert(1)') === '', 'javascript dropped');
  ok(sanitizePublicHttpsImageUrl('http://insecure.example/a.jpg') === '', 'http dropped');
  ok(sanitizePublicHttpsImageUrl('') === '', 'empty allowed');
});

test('path ids are sanitized without PII-like punctuation', () => {
  ok(sanitizeHomepagePathId('tech-1') === 'tech-1', 'safe id kept');
  ok(!sanitizeHomepagePathId('a/../secret').includes('/'), 'slash removed');
  ok(!sanitizeHomepagePathId('user@school.local').includes('@'), 'email punctuation removed');
});

test('legacy private data URLs are not auto-uploaded', () => {
  const kept = persistPrivateHomepageImageUrl(DATA_URL, DATA_URL);
  ok(kept === DATA_URL, 'unchanged legacy private value left for later migration');
  const rejectedPaste = persistPrivateHomepageImageUrl(DATA_URL, 'https://example.com/old.jpg');
  ok(rejectedPaste === 'https://example.com/old.jpg', 'new data URL paste rejected');
  const https = persistPrivateHomepageImageUrl('https://firebasestorage.googleapis.com/v0/b/x/o/a.jpg?alt=media&token=t', DATA_URL);
  ok(https.startsWith('https://'), 'new https upload replaces legacy');
});

test('parsePublicHomepageDocument never publishes data/blob/javascript images', () => {
  const parsed = parsePublicHomepageDocument({
    schoolInfo: {
      schoolLogoUrl: DATA_URL,
      principalImageUrl: 'javascript:alert(1)',
      schoolWorkingHoursInfo: 'من 8:00',
      adminAuthUid: 'secret',
    },
    news: [{ id: 'n1', title: 'خبر', image: DATA_URL, organizer: 'الإدارة' }],
    gallery: [{ id: 'g1', title: 'معرض', url: 'blob:https://x/1', desc: 'وصف' }],
    faculty: [{ id: 't1', name: 'مدرسة', avatar: DATA_URL, email: 'hidden@school.local', subject: 'كيمياء' }],
    honorBoard: [{
      sourceId: 's1',
      sourceType: 'student',
      grade: 'الصف الأول المتوسط',
      rank: 1,
      name: 'زهراء',
      avatar: DATA_URL,
      gpa: 99,
      phone: '077',
    }],
  });
  ok(!parsed.schoolInfo.schoolLogoUrl, 'logo dropped');
  ok(!parsed.schoolInfo.principalImageUrl, 'principal dropped');
  ok(parsed.schoolInfo.schoolWorkingHoursInfo === 'من 8:00', 'hours kept');
  ok(!('adminAuthUid' in parsed.schoolInfo), 'private uid not leaked');
  ok(parsed.news[0].title === 'خبر', 'news title kept');
  ok(!parsed.news[0].image, 'news image dropped');
  ok(parsed.gallery[0].title === 'معرض', 'gallery title kept');
  ok(!parsed.gallery[0].url, 'gallery url dropped');
  ok(parsed.faculty[0].name === 'مدرسة', 'faculty name kept');
  ok(parsed.faculty[0].subject === 'كيمياء', 'faculty subject kept');
  ok(!parsed.faculty[0].avatar, 'faculty avatar dropped');
  ok(!('email' in parsed.faculty[0]), 'faculty email not leaked');
  ok(parsed.honorBoard[0].name === 'زهراء', 'honor name kept');
  ok(!parsed.honorBoard[0].avatar, 'honor avatar dropped');
  ok(!('phone' in parsed.honorBoard[0]), 'honor phone not leaked');
  ok(publicHomepageImageFieldsAreHttpsOrEmpty(parsed), 'https-or-empty guard');
  ok(JSON.stringify(parsed).length < PUBLIC_HOMEPAGE_JSON_WARN_CHARS, 'payload warning guard');
  const legacy = collectLegacyHomepageDataUrlFields({
    schoolInfo: { schoolLogoUrl: DATA_URL, principalImageUrl: DATA_URL },
    news: [{ image: DATA_URL }],
    gallery: [{ url: DATA_URL }],
    faculty: [{ avatar: DATA_URL }],
    honorBoard: [{ avatar: DATA_URL }],
  });
  ok(legacy.length === 6, `legacy fields reported: ${legacy.join(',')}`);
});

console.log(`HOME-018 STORAGE HARDENING TEST: ${pass}/${total} ${pass === total ? 'PASS' : 'FAIL'}`);
if (pass !== total) process.exit(1);
