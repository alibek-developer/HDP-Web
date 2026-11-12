import { MOCK_NOW, avatarTone } from './format'
import type {
  AdminUser,
  AppSettings,
  Backup,
  Campaign,
  CertTemplate,
  Certificate,
  LogEntry,
  LessonExample,
  NotificationAutomation,
  NotificationRecord,
  Olympiad,
  OlympiadResult,
  Order,
  PackageId,
  PermissionsMap,
  Product,
  Profile,
  Promo,
  Referral,
  RegionStat,
  Role,
  Subject,
  Test,
  Ticket,
  Topic,
  Transaction,
  User,
  Video,
} from './types'

const DAY = 86_400_000
const HOUR = 3_600_000
const NOW = MOCK_NOW.getTime()

const iso = (ms: number) => new Date(ms).toISOString()

const mulberry32 = (seed: number) => {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

const rand = mulberry32(0x48_44_50)
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)]

const FIRST_MALE = [
  'Alibek', 'Sardor', 'Jasur', 'Aziz', 'Bekzod', 'Dilshod', 'Doniyor', 'Elyor', 'Farrux',
  'Firdavs', 'Islom', 'Javohir', 'Kamron', 'Laziz', 'Mirjalol', 'Nodir', 'Otabek', 'Oybek',
  'Ravshan', 'Rustam', 'Sanjar', 'Shohruh', 'Temur', "Ulug'bek", 'Xurshid', 'Yusuf', 'Zafar',
  'Abdulloh', 'Anvar', 'Botir', 'Diyor', 'Erkin', "G'ayrat", 'Hikmat', 'Ibrohim', 'Jaxongir',
  'Komil', 'Mansur', 'Nurbek', 'Sherzod',
]

const FIRST_FEMALE = [
  'Dilnoza', 'Gulnoza', 'Madina', 'Malika', 'Nilufar', 'Sevara', 'Shaxnoza', 'Zilola', 'Aziza',
  'Dildora', 'Feruza', 'Gulbahor', 'Iroda', 'Jamila', 'Kamola', 'Laylo', 'Mohira', 'Munisa',
  'Nargiza', 'Nigora', 'Oysha', 'Rayhona', 'Sabina', 'Shahzoda', 'Sitora', 'Umida', 'Yulduz',
  'Zarina', 'Zulfiya', 'Barno', 'Charos', 'Dilbar', "E'tibor", 'Farida', 'Gavhar', 'Hulkar',
  'Intizora', 'Jazira', 'Kumush', 'Lola',
]

const LAST_NAMES = [
  'Aliyev', 'Karimov', 'Tursunov', 'Rahmonov', 'Yusupov', 'Abdullayev', 'Ergashev', 'Qodirov',
  'Ismoilov', 'Nazarov', 'Sobirov', "To'rayev", 'Umarov', 'Xolmatov', "Yo'ldoshev", 'Ziyoyev',
  'Mirzayev', 'Salimov', 'Fayziyev', 'Rashidov', "Jo'rayev", 'Xudoyberdiyev', 'Sattorov',
  'Nurmatov', 'Mahmudov', "Toshpo'latov", 'Olimov', 'Jalilov', 'Xasanov', 'Saidov',
]

const REGIONS = [
  { name: 'Urganch shahri', count: 2580, growth: 12.4 },
  { name: 'Xiva shahri', count: 1420, growth: 10.1 },
  { name: 'Urganch tumani', count: 1260, growth: 8.9 },
  { name: 'Xonqa', count: 1080, growth: 8.2 },
  { name: 'Gurlan', count: 960, growth: 7.6 },
  { name: 'Shovot', count: 900, growth: 7.2 },
  { name: 'Hazorasp', count: 840, growth: 6.8 },
  { name: "Bog'ot", count: 760, growth: 6.1 },
  { name: 'Yangiariq', count: 700, growth: 5.8 },
  { name: "Qo'shko'pir", count: 660, growth: 5.4 },
  { name: 'Yangibozor', count: 540, growth: 4.9 },
  { name: 'Xiva tumani', count: 460, growth: 4.4 },
  { name: "Tuproqqal'a", count: 687, growth: 3.7 },
]

export const REGION_NAMES = REGIONS.map((region) => region.name)

const USER_COUNT = 12_847
const PRO_COUNT = 1_240
const TODAY_ACTIVE = 3_421
const YESTERDAY_ACTIVE = 3_541
const WEEKLY_NEW = 234
const BLOCKED_COUNT = 385

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[ʻʼ'’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

const PACKAGES: PackageId[] = ['1m', '3m', '1y']
const PACKAGE_PRICE: Record<PackageId, number> = { '1m': 49_000, '3m': 129_000, '1y': 399_000 }
const PACKAGE_DAYS: Record<PackageId, number> = { '1m': 30, '3m': 90, '1y': 365 }

interface PlanInfo {
  packageId: PackageId
  paid: number
  startAt: number
  endsAt: number
}

const buildPlanMap = (): Map<number, PlanInfo> => {
  const map = new Map<number, PlanInfo>()
  const range = USER_COUNT - WEEKLY_NEW
  for (let k = 0; k < PRO_COUNT; k += 1) {
    const index = Math.floor((k * (range - 1)) / (PRO_COUNT - 1))
    const packageId: PackageId = k < 234 ? '1m' : k < 814 ? '3m' : '1y'
    const endsAt = NOW + (k < 234 ? rand() * 7 : 7 + rand() * 23) * DAY
    map.set(index, {
      packageId,
      paid: PACKAGE_PRICE[packageId],
      startAt: endsAt - PACKAGE_DAYS[packageId] * DAY,
      endsAt,
    })
  }
  return map
}

const planMap = buildPlanMap()

const blockedIndexes = (): Set<number> => {
  const set = new Set<number>()
  const start = 6_962
  const span = USER_COUNT - start
  let k = 0
  while (set.size < BLOCKED_COUNT && k < span * 3) {
    const index = start + Math.floor((k * (span - 1)) / (BLOCKED_COUNT - 1)) % span
    if (!planMap.has(index) && !set.has(index)) set.add(index)
    k += 1
  }
  return set
}

const blockedSet = blockedIndexes()

const regionPool: string[] = []
for (const region of REGIONS) {
  for (let i = 0; i < region.count; i += 1) regionPool.push(region.name)
}
for (let i = regionPool.length - 1; i > 0; i -= 1) {
  const j = Math.floor(rand() * (i + 1))
  const tmp = regionPool[i]
  regionPool[i] = regionPool[j]
  regionPool[j] = tmp
}

const buildUsers = (): User[] => {
  const users: User[] = []
  for (let i = 0; i < USER_COUNT; i += 1) {
    const female = i % 2 === 1
    const first = female ? FIRST_FEMALE[(i * 13) % FIRST_FEMALE.length] : FIRST_MALE[(i * 7) % FIRST_MALE.length]
    const last = LAST_NAMES[(i * 11) % LAST_NAMES.length]
    const name = `${first} ${female ? `${last}a` : last}`
    const username = `${slug(first)}_${1000 + i}`
    const plan = planMap.get(i)
    const blocked = blockedSet.has(i)
    const verified = Boolean(plan) || rand() < 0.18

    let createdAt = i >= USER_COUNT - WEEKLY_NEW ? NOW - rand() * 6.8 * DAY : NOW - (7 + rand() ** 1.5 * 720) * DAY
    if (plan) createdAt = Math.max(NOW - 730 * DAY, Math.min(createdAt, plan.startAt - rand() * 60 * DAY))

    let lastSeen = 0
    if (i < TODAY_ACTIVE) lastSeen = NOW - rand() * 23 * HOUR
    else if (i < TODAY_ACTIVE + YESTERDAY_ACTIVE) lastSeen = NOW - (24 + rand() * 23) * HOUR
    else lastSeen = NOW - (48 + rand() * 178) * DAY

    const status: User['status'] = blocked
      ? 'blocked'
      : lastSeen > NOW - 14 * DAY
        ? 'active'
        : 'inactive'

    const level = plan ? randInt(3, 7) : randInt(1, 7)
    const xp = level * 800 + Math.floor(rand() * 900)
    const accuracy = randInt(61, 99)

    users.push({
      id: `HDP-${84219 - i}`,
      name,
      username,
      email: `${username}@${verified ? 'hdp.uz' : 'gmail.com'}`,
      telegram: `@${username}`,
      verified,
      plan: plan ? 'pro' : 'free',
      planEndsAt: plan ? iso(plan.endsAt) : null,
      planPackage: plan ? plan.packageId : null,
      planPaid: plan ? plan.paid : null,
      xp,
      level,
      coins: Math.round((rand() * 12_000) / 10) * 10,
      streak: status === 'active' ? randInt(0, 64) : 0,
      solved: Math.floor((level * 180 * (accuracy / 100)) * (0.3 + rand() * 0.7)),
      accuracy,
      region: regionPool[i],
      grade: randInt(5, 11),
      status,
      createdAt: iso(createdAt),
      lastSeenAt: iso(lastSeen),
      tone: avatarTone(name),
    })
  }
  return users
}

export const users = buildUsers()

const SUBJECT_SEED: Array<Pick<Subject, 'id' | 'nameUz' | 'nameRu' | 'description' | 'color' | 'icon' | 'order'>> = [
  {
    id: 'sub-algebra-1',
    nameUz: 'Algebra I',
    nameRu: 'Алгебра I',
    description: 'Sonlar, tenglamalar va funksiyalarning asoslari. 5–7 sinf o‘quvchilari uchun.',
    color: 'green',
    icon: 'A',
    order: 1,
  },
  {
    id: 'sub-algebra-2',
    nameUz: 'Algebra II',
    nameRu: 'Алгебра II',
    description: 'Trigonometriya, logarifm, progressiyalar va ehtimollik. 8–11 sinflar uchun.',
    color: 'blue',
    icon: 'G',
    order: 2,
  },
  {
    id: 'sub-geometry',
    nameUz: 'Geometriya',
    nameRu: 'Геометрия',
    description: 'Planimetriya va stereometriya. Shakllar, formulalar va koordinatalar usuli.',
    color: 'violet',
    icon: 'S',
    order: 3,
  },
]

export const subjects: Subject[] = SUBJECT_SEED.map((seed) => ({
  ...seed,
  status: 'active',
  createdAt: iso(NOW - 420 * DAY),
}))

const TOPIC_SEED: Array<{ subjectId: string; name: string; description: string; proOnly?: boolean; views?: number }> = [
  { subjectId: 'sub-algebra-1', name: 'Sonlar va amallar', description: 'Natural, butun va ratsional sonlar ustida amallar.', views: 3_260 },
  { subjectId: 'sub-algebra-1', name: 'Kasrlar va nisbatlar', description: 'Oddiy va o‘nli kasrlar, proporsiya masalalari.', views: 2_840 },
  { subjectId: 'sub-algebra-1', name: 'Daraja va ildiz', description: 'Daraja xossalari, kvadrat va kub ildizlar.', views: 3_020 },
  { subjectId: 'sub-algebra-1', name: 'Chiziqli tenglamalar', description: 'Bir noma’lumli tenglamalar va ularning sistemalari.', views: 3_480 },
  { subjectId: 'sub-algebra-1', name: 'Kvadrat tenglamalar', description: 'Diskriminant, to‘liq va chala kvadrat tenglamalar.', views: 10_080 },
  { subjectId: 'sub-algebra-1', name: 'Viyet teoremasi', description: 'Ildizlar yig‘indisi va ko‘paytmasi, amaliy masalalar.', views: 12_460 },
  { subjectId: 'sub-algebra-1', name: 'Tengsizliklar', description: 'Chiziqli va kvadrat tengsizliklar, intervallar usuli.', views: 2_660 },
  { subjectId: 'sub-algebra-1', name: 'Funksiya asoslari', description: 'Grafiklar, xossalar va o‘zgarishlar.', views: 2_240 },
  { subjectId: 'sub-algebra-1', name: 'Arifmetik progressiya', description: 'n-had, yig‘indi va amaliy masalalar.', views: 1_980 },
  { subjectId: 'sub-algebra-1', name: 'Geometrik progressiya', description: 'Qator hadlari va yig‘indi formulalari.', views: 1_720 },
  { subjectId: 'sub-algebra-2', name: 'Trigonometriya', description: 'Sinus, kosinus, tangens va asosiy ayniyatlar.', views: 7_560 },
  { subjectId: 'sub-algebra-2', name: 'Trigonometrik tenglamalar', description: 'Eng sodda tenglamalar va ularning yechimlari.', views: 3_880 },
  { subjectId: 'sub-algebra-2', name: 'Logarifm', description: 'Logarifm xossalari va tenglamalar.', views: 4_480, proOnly: true },
  { subjectId: 'sub-algebra-2', name: "Ko'rsatkichli funksiya", description: 'Darajali funksiya va uning grafigi.', views: 3_120 },
  { subjectId: 'sub-algebra-2', name: 'Kompleks sonlar', description: 'Kompleks sonlar, amallar va geometrik talqin.', views: 1_860, proOnly: true },
  { subjectId: 'sub-algebra-2', name: 'Vektorlar', description: 'Vektorlar ustida amallar va skalyar ko‘paytma.', views: 2_420 },
  { subjectId: 'sub-algebra-2', name: 'Matritsalar', description: 'Matritsalar, determinant va sistemalarni yechish.', views: 1_640, proOnly: true },
  { subjectId: 'sub-algebra-2', name: 'Ehtimollik', description: 'Ehtimollik nazariyasi asoslari va misollar.', views: 2_980 },
  { subjectId: 'sub-algebra-2', name: 'Statistika', description: "Ma'lumotlarni yig‘ish, tahlil qilish va diagrammalar.", views: 1_540 },
  { subjectId: 'sub-geometry', name: 'Planimetriya asoslari', description: 'Nuqta, to‘g‘ri chiziq, burchaklar va aksiomalar.', views: 3_180 },
  { subjectId: 'sub-geometry', name: 'Uchburchaklar', description: 'Tenglik va o‘xshashlik belgilari, mediana va bissektrisa.', views: 5_740 },
  { subjectId: 'sub-geometry', name: "To'rtburchaklar", description: 'Parallelogramm, trapetsiya va ularning xossalari.', views: 2_760 },
  { subjectId: 'sub-geometry', name: 'Aylana va doira', description: 'Markaziy va ichki burchaklar, vatarlar.', views: 3_360 },
  { subjectId: 'sub-geometry', name: 'Stereometriya', description: 'Fazoviy shakllar va tekisliklar.', views: 2_180, proOnly: true },
  { subjectId: 'sub-geometry', name: 'Prizma va piramida', description: 'Hajm va sirt yuzasi formulalari.', views: 2_040 },
  { subjectId: 'sub-geometry', name: 'Silindr va konus', description: 'Aylanma jismlar va ularning kesimlari.', views: 1_780 },
  { subjectId: 'sub-geometry', name: 'Koordinatalar usuli', description: 'Tekislikda va fazoda koordinatalar.', views: 1_960 },
  { subjectId: 'sub-geometry', name: 'Integral va yuza', description: 'Aniq integral yordamida yuza hisoblash.', views: 4_480, proOnly: true },
]

export const topics: Topic[] = TOPIC_SEED.map((seed, index) => {
  const subjectOrder = TOPIC_SEED.slice(0, index).filter((item) => item.subjectId === seed.subjectId).length + 1
  return {
    id: `topic-${index + 1}`,
    subjectId: seed.subjectId,
    name: seed.name,
    description: seed.description,
    order: subjectOrder,
    status: index === 18 || index === 27 ? 'draft' : 'active',
    proOnly: Boolean(seed.proOnly),
    views: seed.views ?? 1_200,
    avgMinutes: randInt(8, 26),
    testTakers: Math.round((seed.views ?? 1_200) * (0.42 + rand() * 0.3)),
    avgScore: Number((6 + rand() * 3.6).toFixed(1)),
    createdAt: iso(NOW - (400 - index * 11) * DAY),
  }
})

const VIDEO_IDS = [
  'H0WLBu3sT6I', '2MGetEnqjH0', 'LBURU5cp7F8', 'rhrTGdSEruU', 'YOuKXnJ5E34',
  'KM_Ku5PA6LE', 'JYW3SUbCaeo', '8Mbf-9KnH4c', 'gOSjz_WaTEU', 'Zij9buDPbQU',
  'fqO0WvF9wgA', 'n6jQxtH5K98',
]

const VIDEO_TITLES = ['Mavzuga kirish', 'Nazariy qism', 'Amaliy misollar', 'Mustahkamlash']

export const videos: Video[] = topics.flatMap((topic, topicIndex) => {
  const count = topicIndex % 3 === 0 ? 3 : 2
  return Array.from({ length: count }, (_, index) => ({
    id: `video-${topicIndex + 1}-${index + 1}`,
    topicId: topic.id,
    name: `${topic.name} — ${VIDEO_TITLES[index % VIDEO_TITLES.length]}`,
    youtubeId: VIDEO_IDS[(topicIndex * 3 + index) % VIDEO_IDS.length],
    duration: `${randInt(8, 23)}:${String(randInt(5, 55)).padStart(2, '0')}`,
    views: Math.max(120, Math.round(topic.views / count) - randInt(0, 180)),
    status: index === 2 && topicIndex % 7 === 0 ? 'draft' : 'active',
    proOnly: topic.proOnly && index > 0,
    order: index + 1,
    createdAt: topic.createdAt,
  }))
})

const testQuestion = (topicName: string, index: number) => {
  const a = 2 + (index % 7)
  const b = 1 + (index % 5)
  const c = 3 + (index % 9)
  const variants = [
    {
      question: `${a}x + ${b} = ${a * c + b} tenglamaning ildizini toping.`,
      options: [c, c + 1, c - 1, c + 2],
      unit: '',
    },
    {
      question: `x² − ${a + b}x + ${a * b} = 0 tenglamaning katta ildizini toping.`,
      options: [Math.max(a, b), Math.min(a, b), a + b, a * b],
      unit: '',
    },
    {
      question: `${a}² + ${b}² ifodaning qiymatini hisoblang.`,
      options: [a * a + b * b, a * a - b * b, a * b, (a + b) * (a + b)],
      unit: '',
    },
    {
      question: `${topicName} mavzusida ${a * 10} dan ${b * 10}% oshirilsa, natija necha bo'ladi?`,
      options: [a * 10 + b, a * 10 + b * 2, a * 10 - b, a * 10 + b / 2],
      unit: '',
    },
  ]
  const variant = variants[index % variants.length]
  const correctIndex = index % 4
  const unique = variant.options.filter((value, position) => variant.options.indexOf(value) === position)
  while (unique.length < 4) unique.push(unique[unique.length - 1] + 1)
  const options = [unique[correctIndex], ...unique.filter((_, pos) => pos !== correctIndex)].slice(0, 4)
  const letters: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd']
  return {
    question: variant.question,
    options: { a: String(options[0]), b: String(options[1]), c: String(options[2]), d: String(options[3]) },
    correct: letters[correctIndex],
  }
}

export const tests: Test[] = topics.flatMap((topic, topicIndex) =>
  Array.from({ length: 10 }, (_, index) => {
    const built = testQuestion(topic.name, topicIndex * 10 + index)
    const difficulty = index === 9 ? (topicIndex % 3 === 0 ? 'olympiad' : 'hard') : index < 3 ? 'easy' : index < 7 ? 'medium' : 'hard'
    const letters: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd']
    return {
      id: `test-${topicIndex + 1}-${index + 1}`,
      question: built.question,
      options: built.options,
      correct: built.correct,
      topicId: topic.id,
      difficulty,
      status: 'active',
      used: randInt(12, 480),
      errorRate: randInt(14, 68),
      topWrong: letters.filter((letter) => letter !== built.correct)[randInt(0, 2)],
      note: index === 9 ? "Manba: olimpiada to'plami" : '',
      createdAt: iso(NOW - (110 - topicIndex) * DAY),
    } satisfies Test
  }),
)

export const lessonExamples: LessonExample[] = topics.flatMap((topic, topicIndex) =>
  Array.from({ length: 4 }, (_, index) => {
    const a = 2 + ((topicIndex + index) % 7)
    const x = 3 + ((topicIndex * 2 + index) % 9)
    const b = 1 + ((topicIndex + index) % 5)
    const total = a * x + b
    const price = 60 + ((topicIndex + index) % 5) * 20
    const discount = [10, 20, 25][index % 3]
    const save = (price * discount) / 100
    const w = 4 + ((topicIndex + index) % 5)
    const h = 3 + ((topicIndex + index) % 4)
    const set = [
      {
        title: 'Tenglamani yeching',
        prompt: `${a}x + ${b} = ${total}`,
        solution: `${a}x = ${total} − ${b} = ${total - b}\nx = ${total - b} : ${a} = ${x}`,
        answer: `x = ${x}`,
        level: 'easy' as const,
      },
      {
        title: 'Chegirma hisobi',
        prompt: `${price} ming so'mlik tovar ${discount}% chegirma bilan sotilmoqda. Yangi narx qancha?`,
        solution: `Chegirma = ${price} × ${discount}% = ${save} ming\nYangi narx = ${price} − ${save} = ${price - save} ming`,
        answer: `${price - save} ming so'm`,
        level: 'easy' as const,
      },
      {
        title: 'Ifodaning qiymati',
        prompt: `${a}² + ${b}² ni hisoblang.`,
        solution: `${a}² = ${a * a}, ${b}² = ${b * b}\n${a * a} + ${b * b} = ${a * a + b * b}`,
        answer: `${a * a + b * b}`,
        level: 'medium' as const,
      },
      {
        title: "To'g'ri to'rtburchak",
        prompt: `Tomlari ${w} sm va ${h} sm bo'lgan to'g'ri to'rtburchakning perimetri va yuzini toping.`,
        solution: `P = 2 × (${w} + ${h}) = ${2 * (w + h)} sm\nS = ${w} × ${h} = ${w * h} sm²`,
        answer: `P = ${2 * (w + h)} sm, S = ${w * h} sm²`,
        level: 'medium' as const,
      },
    ]
    return {
      id: `example-${topicIndex + 1}-${index + 1}`,
      topicId: topic.id,
      ...set[index],
    } satisfies LessonExample
  }),
)

const olympiadResults = (count: number, total: number, seed: number): OlympiadResult[] => {
  const local = mulberry32(seed)
  return users
    .filter((_, index) => index % Math.max(1, Math.floor(users.length / count)) === 0)
    .slice(0, count)
    .map((user) => ({
      userId: user.id,
      name: user.name,
      score: Math.round(total - Math.floor(local() * (total * 0.45))),
      total,
      timeSeconds: 2_400 + Math.floor(local() * 3_000),
      region: user.region,
    }))
    .sort((left, right) => right.score - left.score || left.timeSeconds - right.timeSeconds)
}

export const olympiads: Olympiad[] = [
  {
    id: 'olymp-republic',
    name: 'Respublika Matematik Olimpiadasi',
    description: "O'zbekiston bo'ylab 5–11 sinf o'quvchilari uchun asosiy matematik olimpiada.",
    startAt: iso(NOW - 25 * 60_000),
    duration: 90,
    audience: 'all',
    regionLimit: '',
    gradeLimit: '',
    rewards: [3_000_000, 1_500_000, 750_000],
    questionIds: tests.slice(0, 30).map((test) => test.id),
    status: 'live',
    registered: 1_240,
    playing: 847,
    finished: 124,
    left: 269,
    shuffleQuestions: true,
    shuffleOptions: true,
    resultReveal: 'after',
    blockScreenshot: true,
    certificate: true,
    certMinScore: 24,
    certTemplate: 'tpl-olympiad',
    resultsPublished: false,
    results: [],
    createdAt: iso(NOW - 40 * DAY),
  },
  {
    id: 'olymp-regions',
    name: 'Viloyatlar chempionati',
    description: "Viloyatlar o'rtasidagi jamoaviy chempionat. Har bir viloyatdan eng kuchli 50 o'quvchi.",
    startAt: '2026-12-15T10:00:00+05:00',
    duration: 120,
    audience: 'all',
    regionLimit: '',
    gradeLimit: '8-11',
    rewards: [5_000_000, 2_500_000, 1_000_000],
    questionIds: tests.slice(30, 60).map((test) => test.id),
    status: 'scheduled',
    registered: 320,
    playing: 0,
    finished: 0,
    left: 0,
    shuffleQuestions: true,
    shuffleOptions: false,
    resultReveal: 'after',
    blockScreenshot: false,
    certificate: true,
    certMinScore: 30,
    certTemplate: 'tpl-olympiad',
    resultsPublished: false,
    results: [],
    createdAt: iso(NOW - 18 * DAY),
  },
  {
    id: 'olymp-spring',
    name: 'Bahorgi matematika kubogi',
    description: "Bahorgi mavsum yakuniy kubogi. 980 nafar o'quvchi qatnashgan.",
    startAt: '2026-10-20T10:00:00+05:00',
    duration: 90,
    audience: 'pro',
    regionLimit: '',
    gradeLimit: '',
    rewards: [2_000_000, 1_000_000, 500_000],
    questionIds: tests.slice(60, 90).map((test) => test.id),
    status: 'finished',
    registered: 980,
    playing: 0,
    finished: 932,
    left: 48,
    shuffleQuestions: true,
    shuffleOptions: true,
    resultReveal: 'now',
    blockScreenshot: true,
    certificate: true,
    certMinScore: 22,
    certTemplate: 'tpl-olympiad',
    resultsPublished: true,
    results: olympiadResults(980, 30, 0x51_11),
    createdAt: iso(NOW - 90 * DAY),
  },
  {
    id: 'olymp-youth',
    name: 'Yoshlar ligasi',
    description: "6–7 sinf o'quvchilari uchun qiziqarli matematik bellashuv. Tayyorlanmoqda.",
    startAt: '2027-01-20T09:00:00+05:00',
    duration: 60,
    audience: 'all',
    regionLimit: '',
    gradeLimit: '5-7',
    rewards: [1_000_000, 500_000, 250_000],
    questionIds: [],
    status: 'draft',
    registered: 0,
    playing: 0,
    finished: 0,
    left: 0,
    shuffleQuestions: false,
    shuffleOptions: false,
    resultReveal: 'after',
    blockScreenshot: false,
    certificate: false,
    certMinScore: 0,
    certTemplate: 'tpl-olympiad',
    resultsPublished: false,
    results: [],
    createdAt: iso(NOW - 4 * DAY),
  },
]

const METHODS: Array<{ method: Transaction['method']; weight: number }> = [
  { method: 'payme', weight: 0.68 },
  { method: 'click', weight: 0.22 },
  { method: 'uzum', weight: 0.07 },
  { method: 'uzcard', weight: 0.03 },
]

const randomMethod = (): Transaction['method'] => {
  const roll = rand()
  let cumulative = 0
  for (const item of METHODS) {
    cumulative += item.weight
    if (roll <= cumulative) return item.method
  }
  return 'payme'
}

const txId = (dateMs: number, counter: number) => {
  const d = new Date(dateMs)
  const formatted = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `TXN-${formatted}-${String(counter).padStart(4, '0')}`
}

const buildTransactions = (): Transaction[] => {
  const list: Transaction[] = []
  let counter = 1
  planMap.forEach((plan, index) => {
    const user = users[index]
    if (!user) return
    list.push({
      id: txId(plan.startAt, counter),
      userId: user.id,
      userName: user.name,
      packageId: plan.packageId,
      amount: plan.paid,
      method: randomMethod(),
      status: 'success',
      providerTxId: String(8_472_000_000 + counter * 137),
      createdAt: iso(plan.startAt),
    })
    counter += 1

    const renewals = plan.packageId === '1m' ? 5 : plan.packageId === '3m' ? 1 : 0
    for (let k = 1; k <= renewals; k += 1) {
      const at = plan.startAt - k * PACKAGE_DAYS[plan.packageId] * DAY
      const roll = rand()
      list.push({
        id: txId(at, counter),
        userId: user.id,
        userName: user.name,
        packageId: plan.packageId,
        amount: plan.paid,
        method: randomMethod(),
        status: roll < 0.9 ? 'success' : roll < 0.95 ? 'pending' : 'cancelled',
        providerTxId: String(8_472_000_000 + counter * 137),
        createdAt: iso(at),
      })
      counter += 1
    }
  })
  const fillMonth = (year: number, month: number, target: number) => {
    const start = new Date(year, month, 1).getTime()
    const end = Math.min(NOW, new Date(year, month + 1, 1).getTime() - 1)
    const base = list
      .filter((transaction) => transaction.status === 'success')
      .filter((transaction) => {
        const at = new Date(transaction.createdAt)
        return at.getFullYear() === year && at.getMonth() === month
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    let remaining = Math.max(0, target - base)
    const add = (amount: number) => {
      const user = users[Math.floor(rand() * users.length)]
      const at = start + rand() * Math.max(1, end - start)
      list.push({
        id: txId(at, counter),
        userId: user.id,
        userName: user.name,
        packageId: amount === 399_000 ? '1y' : amount === 129_000 ? '3m' : '1m',
        amount,
        method: randomMethod(),
        status: 'success',
        providerTxId: String(8_472_000_000 + counter * 137),
        createdAt: iso(at),
      })
      counter += 1
    }

    let filled = remaining === 0
    for (let yearly = Math.floor(remaining / 399_000); yearly >= 0 && !filled; yearly -= 1) {
      const afterYearly = remaining - yearly * 399_000
      for (let quarterly = Math.floor(afterYearly / 129_000); quarterly >= 0 && !filled; quarterly -= 1) {
        const rest = afterYearly - quarterly * 129_000
        if (rest % 49_000 !== 0) continue
        const monthly = rest / 49_000
        for (let index = 0; index < yearly; index += 1) add(399_000)
        for (let index = 0; index < quarterly; index += 1) add(129_000)
        for (let index = 0; index < monthly; index += 1) add(49_000)
        filled = true
      }
    }
  }

  const currentYear = MOCK_NOW.getFullYear()
  const currentMonth = MOCK_NOW.getMonth()
  fillMonth(currentYear, currentMonth, 48_360_000)
  const previous = new Date(currentYear, currentMonth - 1, 1)
  fillMonth(previous.getFullYear(), previous.getMonth(), 43_120_000)

  return list.sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1))
}

export const transactions = buildTransactions()

const PRODUCT_SEED: Array<[string, string, Product['category'], number, number, string]> = [
  ['iPhone 17', "HDP do'konidagi eng yuqori qiymatli sovg'a. 256 GB.", 'Texnika', 75_000, 1, '📱'],
  ['Samsung Galaxy S25', 'Bayroqli smartfon, 256 GB xotira.', 'Texnika', 50_000, 2, '📲'],
  ['Elektr scooter', "Shahar bo'ylab yurish uchun elektr scooter.", 'Texnika', 15_000, 3, '🛴'],
  ['Velosiped', "Yengil ramali tog' velosipedi.", 'Texnika', 6_500, 5, '🚲'],
  ['Smartwatch', 'Fitnes va bildirishnomalar uchun aqlli soat.', 'Texnika', 750, 12, '⌚'],
  ['AirPods', 'Simsiz quloqchinlar, zaryad qutisi bilan.', 'Aksesuar', 500, 8, '🎧'],
  ['Powerbank', '20 000 mAh quvvat banki.', 'Aksesuar', 1_250, 15, '🔋'],
  ['HDP backpack', "Noutbuk bo'limi bor shahar ryukzagi.", 'Aksesuar', 1_000, 20, '🎒'],
  ['HDP shopper', 'Kundalik xarid uchun qulay mato sumka.', 'Aksesuar', 600, 100, '🛍️'],
  ['HDP hoddie', 'Qishki kolleksiya, issiq va yumshoq.', 'Kiyim', 600, 40, '🧥'],
  ['Koptok', "Futbol o'yinlari uchun standart koptok.", 'Aksesuar', 500, 25, '⚽'],
  ['Stol lampa', "Dars qilish uchun yorug'lik rejimli lampa.", 'Aksesuar', 1_000, 0, '💡'],
  ['Rolik', 'Yozgi faol dam olish uchun rolik.', 'Aksesuar', 700, 6, '🛼'],
  ["Sovg'a vaucheri", "Do'kondagi istalgan xaridga ishlatiladi.", 'Aksiya', 600, 100, '🎟️'],
  ['Discount 50%', 'Keyingi xaridga 50% chegirma.', 'Aksiya', 1_250, 50, '🏷️'],
  ['HDP ruchkasi', "Eng arzon sovg'a, birinchi xarid uchun.", 'Aksesuar', 250, 92, '🖊️'],
]

export const products: Product[] = PRODUCT_SEED.map(([name, description, category, price, stock, emoji], index) => ({
  id: `product-${index + 1}`,
  name,
  description,
  category,
  price,
  stock,
  status: stock === 0 ? 'out' : index === 11 ? 'draft' : 'active',
  image: null,
  emoji,
  sold: randInt(3, 88),
}))

export const orders: Order[] = Array.from({ length: 120 }, (_, index) => {
  const user = users[(index * 97) % users.length]
  const product = products[index % products.length]
  const roll = (index * 37) % 100
  return {
    id: `ORD-${20261000 + index}`,
    userId: user.id,
    userName: user.name,
    productId: product.id,
    productName: product.name,
    coins: product.price,
    status: roll < 30 ? 'pending' : roll < 89 ? 'done' : 'cancelled',
    createdAt: iso(NOW - rand() * 90 * DAY),
  }
})

export const promos: Promo[] = [
  { id: 'promo-1', code: 'HDP2026', discountType: 'percent', amount: 20, used: 142, limit: 500, expiresAt: '2026-12-31T23:59:00+05:00', packageId: 'all', status: 'active' },
  { id: 'promo-2', code: 'YANGIYIL', discountType: 'amount', amount: 30_000, used: 87, limit: 300, expiresAt: '2027-01-10T23:59:00+05:00', packageId: '1y', status: 'active' },
  { id: 'promo-3', code: 'PRO3M', discountType: 'percent', amount: 15, used: 64, limit: 200, expiresAt: '2026-12-01T23:59:00+05:00', packageId: '3m', status: 'active' },
  { id: 'promo-4', code: 'BLACKFRIDAY', discountType: 'percent', amount: 35, used: 380, limit: 400, expiresAt: '2026-11-30T23:59:00+05:00', packageId: 'all', status: 'active' },
  { id: 'promo-5', code: 'TELEGRAM', discountType: 'amount', amount: 10_000, used: 120, limit: 120, expiresAt: '2026-10-31T23:59:00+05:00', packageId: 'all', status: 'expired' },
  { id: 'promo-6', code: 'SUMMER', discountType: 'percent', amount: 25, used: 0, limit: 100, expiresAt: '2026-09-01T23:59:00+05:00', packageId: '3m', status: 'disabled' },
]

export const referrals: Referral[] = Array.from({ length: 18 }, (_, index) => {
  const user = users[(index * 613) % users.length]
  const invited = randInt(1, 42)
  return {
    id: `ref-${index + 1}`,
    userId: user.id,
    userName: user.name,
    code: `HDP${user.id.slice(-5)}`,
    invited,
    revenue: invited * randInt(6_000, 14_000),
    createdAt: iso(NOW - rand() * 180 * DAY),
  }
})

export const referralStats = {
  codes: 3_241,
  usedThisMonth: 234,
  revenue: 8_460_000,
}

export const campaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: "Yangi yil aksiyasi",
    type: 'discount',
    value: '1 yillik Pro — 299 000 so‘m',
    startsAt: '2026-12-20T00:00:00+05:00',
    endsAt: '2027-01-10T23:59:00+05:00',
    banner: 'Yangi yil sovg‘asi: yillik Proga 25% chegirma!',
    status: 'scheduled',
  },
  {
    id: 'camp-2',
    name: '7 kun bepul trial',
    type: 'trial',
    value: '7 kun',
    startsAt: '2026-11-01T00:00:00+05:00',
    endsAt: '2026-12-01T23:59:00+05:00',
    banner: 'Pro imkoniyatlarini 7 kun bepul sinab ko‘ring.',
    status: 'active',
  },
  {
    id: 'camp-3',
    name: '3 oy + 1 oy sovg‘a',
    type: 'bonus',
    value: '3+1 oy',
    startsAt: '2026-10-01T00:00:00+05:00',
    endsAt: '2026-11-15T23:59:00+05:00',
    banner: '3 oylik paketga yana 1 oy bepul qo‘shiladi.',
    status: 'active',
  },
  {
    id: 'camp-4',
    name: 'Yozgi chegirma',
    type: 'discount',
    value: 'Barcha paketlarga 20%',
    startsAt: '2026-06-01T00:00:00+05:00',
    endsAt: '2026-08-31T23:59:00+05:00',
    banner: 'Yozgi chegirma yakunlandi.',
    status: 'finished',
  },
]

const ticketSeed: Array<{ subject: string; userName: string; priority: Ticket['priority']; status: Ticket['status']; messages: Array<[TicketMessageFrom, string]> }> = [
  {
    subject: "Pro obuna to'lovi o'tmadi",
    userName: 'Sardor Tursunov',
    priority: 'high',
    status: 'new',
    messages: [
      ['user', "Assalomu alaykum! Payme orqali to'lov qildim, lekin Pro ochilmadi."],
      ['user', "To'lov chekini yubordim: TXN-20261107-4821."],
    ],
  },
  {
    subject: 'Video dars yuklanmayapti',
    userName: 'Dilnoza Karimova',
    priority: 'medium',
    status: 'progress',
    messages: [
      ['user', '"Trigonometriya" mavzusidagi video ochilmayapti. Xatolik chiqadi.'],
      ['admin', "Xush kelibsiz! Qaysi qurilmada va qaysi brauzerda kuzatdingiz?"],
      ['user', 'Telefonda, Chrome. Internet yaxshi ishlayapti.'],
    ],
  },
  {
    subject: 'Coinlar hisobimdan yechildi',
    userName: 'Jasur Aliyev',
    priority: 'high',
    status: 'new',
    messages: [['user', "Do'kondan sovg'a oldim, lekin coinlar ikki marta yechildi."]],
  },
  {
    subject: "Olimpiadaga ro'yxatdan o'tolmayapman",
    userName: 'Madina Yusupova',
    priority: 'medium',
    status: 'progress',
    messages: [
      ['user', "Respublika olimpiadasiga ro'yxatdan o'tish tugmasi bosilmayapti."],
      ['admin', "Muammoni tekshiryapmiz. Iltimos, ilovani yangilab qayta urinib ko'ring."],
    ],
  },
  {
    subject: 'Sertifikatni qayta yuborish',
    userName: 'Bekzod Rahmonov',
    priority: 'low',
    status: 'new',
    messages: [['user', "Kurs sertifikatim Telegram'ga kelmadi. Qayta yuborib bera olasizmi?"]],
  },
  {
    subject: 'Parolni tiklash',
    userName: 'Nilufar Qodirova',
    priority: 'medium',
    status: 'closed',
    messages: [
      ['user', "Parolimni esdan chiqardim, emailimga kod kelmayapti."],
      ['admin', "Email manzilingizni tasdiqladik, yangi parol yuborildi."],
      ['user', 'Rahmat, kirdim!'],
    ],
  },
  {
    subject: "Test natijasi noto'g'ri hisoblandi",
    userName: 'Aziz Ismoilov',
    priority: 'medium',
    status: 'progress',
    messages: [['user', "Kvadrat tenglamalar testida 8 ta to'g'ri javob berdim, 6 ta ko'rsatdi."]],
  },
  {
    subject: "Pro obunani bekor qilish",
    userName: 'Sevara Nazarova',
    priority: 'low',
    status: 'closed',
    messages: [
      ['user', "Pro obunani bekor qilmoqchiman, avtomatik yangilanmasin."],
      ['admin', "Bekor qilindi. Joriy muddat tugagach obuna yangilanmaydi."],
    ],
  },
  {
    subject: 'Do‘kondagi sovg‘a yetib kelmadi',
    userName: 'Doniyor Sobirov',
    priority: 'high',
    status: 'progress',
    messages: [
      ['user', "Hoddie buyurtma qilgandim, 10 kun bo'ldi yetib kelmadi."],
      ['admin', "Buyurtma holatini tekshirdik — yetkazib berishga topshirilgan."],
    ],
  },
  {
    subject: 'Olimpiada natijalari haqida',
    userName: 'Shaxnoza Umarov',
    priority: 'low',
    status: 'new',
    messages: [['user', "Bahorgi kubok natijalari qachon e'lon qilinadi?"]],
  },
]

type TicketMessageFrom = 'user' | 'admin'

const ticketUser = (name: string, index: number) =>
  users.find((user) => user.name === name) ?? users[(index * 137 + 11) % users.length]

export const tickets: Ticket[] = ticketSeed.map((seed, index) => {
  const user = ticketUser(seed.userName, index)
  return {
    id: `TICKET-${1040 + index}`,
    subject: seed.subject,
    userId: user.id,
    userName: user.name,
    telegram: user.telegram,
    priority: seed.priority,
    status: seed.status,
    admin: seed.status === 'new' ? '' : 'Administrator',
    createdAt: iso(NOW - (index + 1) * 7 * HOUR),
    updatedAt: iso(NOW - index * 3 * HOUR),
    messages: seed.messages.map(([from, text], messageIndex) => ({
      id: `msg-${index}-${messageIndex}`,
      from,
      text,
      at: iso(NOW - (index + 1) * 7 * HOUR + messageIndex * 40 * 60_000),
    })),
  }
})

export const certificates: Certificate[] = Array.from({ length: 24 }, (_, index) => {
  const user = users[(index * 431) % users.length]
  const type = index % 3 === 0 ? 'olympiad' : index % 3 === 1 ? 'course' : 'pro'
  const statusRoll = index % 4
  return {
    id: `CERT-${2026000 + index}`,
    userId: user.id,
    userName: user.name,
    type,
    issuedAt: iso(NOW - rand() * 90 * DAY),
    status: statusRoll === 0 ? 'pending' : statusRoll < 3 ? 'sent' : 'issued',
  }
})

export const certTemplates: CertTemplate[] = [
  {
    id: 'tpl-course',
    name: 'Kurs sertifikati',
    type: 'course',
    theme: 'green',
    title: 'KURS SERTIFIKATI',
    subtitle: 'HDP Academy kursini muvaffaqiyatli tamomlaganligi uchun',
    footer: 'HDP Academy · 2026',
    elements: [
      { id: 'name', label: 'O‘quvchi ismi', x: 50, y: 46, size: 28, weight: 800 },
      { id: 'course', label: 'Kurs nomi', x: 50, y: 58, size: 15, weight: 600 },
      { id: 'date', label: 'Sana', x: 28, y: 78, size: 12, weight: 500 },
      { id: 'signature', label: 'Imzo', x: 72, y: 78, size: 12, weight: 500 },
    ],
  },
  {
    id: 'tpl-olympiad',
    name: 'Olimpiada sertifikati',
    type: 'olympiad',
    theme: 'gold',
    title: 'OLIMPIADA SERTIFIKATI',
    subtitle: 'Respublika matematik olimpiadasida yuqori natija uchun',
    footer: 'HDP Academy · Olimpiada qo‘mitasi',
    elements: [
      { id: 'name', label: 'O‘quvchi ismi', x: 50, y: 46, size: 28, weight: 800 },
      { id: 'place', label: 'O‘rin va ball', x: 50, y: 58, size: 15, weight: 600 },
      { id: 'date', label: 'Sana', x: 28, y: 78, size: 12, weight: 500 },
      { id: 'signature', label: 'Imzo', x: 72, y: 78, size: 12, weight: 500 },
    ],
  },
  {
    id: 'tpl-pro',
    name: 'Pro sertifikat',
    type: 'pro',
    theme: 'premium',
    title: 'PRO SERTIFIKAT',
    subtitle: 'HDP Academy Pro dasturini muvaffaqiyatli yakunlaganligi uchun',
    footer: 'HDP Academy · Premium',
    elements: [
      { id: 'name', label: 'O‘quvchi ismi', x: 50, y: 46, size: 28, weight: 800 },
      { id: 'program', label: 'Dastur nomi', x: 50, y: 58, size: 15, weight: 600 },
      { id: 'date', label: 'Sana', x: 28, y: 78, size: 12, weight: 500 },
      { id: 'signature', label: 'Imzo', x: 72, y: 78, size: 12, weight: 500 },
    ],
  },
]

export const notifications: NotificationRecord[] = [
  {
    id: 'notif-1',
    title: 'Yangi yil aksiyasi boshlandi',
    body: 'Yillik Pro obunaga 25% chegirma. 10-yanvargacha amal qiladi.',
    link: 'https://hdp.uz/pro',
    audience: 'all',
    type: 'both',
    sentAt: iso(NOW - 2 * HOUR),
    recipients: 12_847,
    read: 8_214,
    clicked: 2_106,
    scheduled: false,
  },
  {
    id: 'notif-2',
    title: 'Olimpiadaga ro‘yxatdan o‘ting',
    body: 'Respublika matematik olimpiadasida 1 240 o‘quvchi qatnashmoqda.',
    link: 'https://hdp.uz/olympiad',
    audience: 'all',
    type: 'push',
    sentAt: iso(NOW - 1 * DAY),
    recipients: 12_847,
    read: 7_903,
    clicked: 1_842,
    scheduled: false,
  },
  {
    id: 'notif-3',
    title: 'Pro obunangiz tugamoqda',
    body: 'Obunangiz 3 kunda yakunlanadi. Yangilash uchun ilovaga kiring.',
    link: 'https://hdp.uz/subscription',
    audience: 'pro',
    type: 'push',
    sentAt: iso(NOW - 2 * DAY),
    recipients: 1_240,
    read: 1_102,
    clicked: 486,
    scheduled: false,
  },
  {
    id: 'notif-4',
    title: 'Yangi mavzular qo‘shildi',
    body: 'Algebra II bo‘limida 5 ta yangi video dars va 30 ta test paydo bo‘ldi.',
    link: 'https://hdp.uz/algebra-2',
    audience: 'free',
    type: 'inapp',
    sentAt: iso(NOW - 4 * DAY),
    recipients: 11_607,
    read: 5_421,
    clicked: 1_203,
    scheduled: false,
  },
  {
    id: 'notif-5',
    title: 'Do‘konda yangi sovg‘alar',
    body: 'HDP hoddie, backpack va AirPods yana mavjud. Coinlaringizni sarflang!',
    link: 'https://hdp.uz/shop',
    audience: 'all',
    type: 'inapp',
    sentAt: iso(NOW - 6 * DAY),
    recipients: 12_847,
    read: 6_842,
    clicked: 1_640,
    scheduled: false,
  },
  {
    id: 'notif-6',
    title: 'Kunlik streakni unutmang',
    body: 'Bugun dars ko‘rib, streakni davom ettiring.',
    link: '',
    audience: 'all',
    type: 'push',
    sentAt: iso(NOW - 9 * DAY),
    recipients: 12_847,
    read: 9_214,
    clicked: 3_108,
    scheduled: false,
  },
]

export const notificationAutomations: NotificationAutomation[] = [
  {
    id: 'auto-signup',
    name: 'Xush kelibsiz xabari',
    trigger: 'signup',
    audience: 'all',
    type: 'inapp',
    delayHours: 0,
    enabled: true,
    title: 'HDP Academy ga xush kelibsiz!',
    body: 'Birinchi darsni boshlang va kunlik streakni yoqib oling.',
    link: 'https://hdp.uz/start',
    lastRunAt: iso(NOW - 4 * HOUR),
    sent: 184,
  },
  {
    id: 'auto-expiring',
    name: 'Obuna tugash eslatmasi',
    trigger: 'plan_expiring',
    audience: 'pro',
    type: 'push',
    delayHours: 72,
    enabled: true,
    title: 'Pro obunangiz tugamoqda',
    body: 'Obunani yangilab, barcha darslar va testlardan foydalanishda davom eting.',
    link: 'https://hdp.uz/subscription',
    lastRunAt: iso(NOW - 1 * DAY),
    sent: 96,
  },
  {
    id: 'auto-inactive',
    name: 'Qaytish taklifi',
    trigger: 'inactive',
    audience: 'all',
    type: 'push',
    delayHours: 168,
    enabled: false,
    title: 'Sizni sog‘indik!',
    body: 'Yangi mavzular va mashqlar sizni kutmoqda. Bugun davom eting.',
    link: '',
    sent: 412,
  },
  {
    id: 'auto-streak',
    name: 'Streak eslatmasi',
    trigger: 'streak',
    audience: 'all',
    type: 'inapp',
    delayHours: 20,
    enabled: true,
    title: 'Streakni yo‘qotmang',
    body: 'Bugun kamida bitta mashq yechib, seriyani davom ettiring.',
    link: '',
    lastRunAt: iso(NOW - 3 * HOUR),
    sent: 1_284,
  },
]


const LOG_MESSAGES: [LogEntry['level'], string][] = [
  ['info', 'User HDP-84102 completed lesson “Viyet teoremasi”'],
  ['info', 'Payment TXN-20261107-4821 confirmed via Payme'],
  ['warning', 'Video stream latency above threshold (1420ms)'],
  ['error', 'Failed to send Telegram notification to HDP-82013'],
  ['info', 'Admin updated topic “Trigonometriya”'],
  ['warning', 'Rate limit reached for /api/auth/login (IP 84.54.12.9)'],
  ['info', 'Backup completed successfully (148 MB)'],
  ['error', 'Payment webhook signature mismatch from Click'],
  ['info', 'New user registered HDP-84147'],
  ['warning', 'Certificate delivery queued for retry'],
  ['info', 'Olympiad results published'],
  ['error', 'Database query timeout on analytics endpoint'],
]

export const logs: LogEntry[] = Array.from({ length: 60 }, (_, index) => {
  const [level, message] = LOG_MESSAGES[index % LOG_MESSAGES.length]
  return {
    id: `log-${index + 1}`,
    at: iso(NOW - index * 37 * 60_000),
    level,
    message,
    user: index % 4 === 0 ? 'Administrator' : index % 3 === 0 ? 'system' : 'api',
    ip: `84.54.${randInt(1, 254)}.${randInt(1, 254)}`,
  }
})

export const backups: Backup[] = Array.from({ length: 6 }, (_, index) => ({
  id: `backup-${index + 1}`,
  at: iso(NOW - (index + 1) * DAY),
  size: `${randInt(120, 190)} MB`,
  status: index === 5 ? 'failed' : 'success',
}))

const allPermissions = (value: boolean): PermissionsMap => ({
  dashboard: value,
  users: value,
  content: value,
  tests: value,
  olympiads: value,
  analytics: value,
  payments: value,
  shop: value,
  marketing: value,
  support: value,
  certificates: value,
  notifications: value,
  system: value,
  settings: value,
})

const scopedPermissions = (keys: Array<keyof PermissionsMap>): PermissionsMap => {
  const permissions = allPermissions(false)
  for (const key of keys) permissions[key] = true
  return permissions
}

export const roles: Role[] = [
  {
    id: 'role-super',
    name: 'Super Admin',
    description: 'Hamma narsaga kirish, rollarni boshqarish.',
    permissions: allPermissions(true),
  },
  {
    id: 'role-content',
    name: 'Kontent Manager',
    description: 'Kontent, testlar va olimpiadalar bilan ishlaydi.',
    permissions: scopedPermissions(['dashboard', 'content', 'tests', 'olympiads']),
  },
  {
    id: 'role-finance',
    name: 'Moliya',
    description: "To'lovlar va daromad analitikasi.",
    permissions: scopedPermissions(['dashboard', 'payments', 'analytics']),
  },
  {
    id: 'role-moderator',
    name: 'Moderator',
    description: "Foydalanuvchilar (cheklangan) va support.",
    permissions: scopedPermissions(['dashboard', 'users', 'support']),
  },
]

export const admins: AdminUser[] = [
  {
    id: 'admin-1',
    name: 'Administrator',
    email: 'admin@hdp.uz',
    roleId: 'role-super',
    lastLogin: iso(NOW - 20 * 60_000),
    status: 'active',
  },
  {
    id: 'admin-2',
    name: 'Dilnoza Karimova',
    email: 'dilnoza@hdp.uz',
    roleId: 'role-content',
    lastLogin: iso(NOW - 3 * HOUR),
    status: 'active',
  },
  {
    id: 'admin-3',
    name: 'Sardor Aliyev',
    email: 'sardor@hdp.uz',
    roleId: 'role-finance',
    lastLogin: iso(NOW - 2 * DAY),
    status: 'active',
  },
]

export const settings: AppSettings = {
  appName: 'HDP Academy',
  description: 'Matematika o‘quv platformasi',
  logo: null,
  favicon: null,
  maintenance: false,
  maintenanceMessage: 'Tizimda texnik ishlar olib borilmoqda. Tez orada qaytamiz.',
  allowedIps: '84.54.12.9, 91.186.4.2',
  currentVersion: '2.4.0',
  build: '892',
  minVersion: '2.0.0',
  forceUpdate: false,
  updateMessage: 'Yangi versiya mavjud. Ilovani yangilang.',
  payme: {
    merchantId: '5f8d9a2c71e4b3a0d6c8f1e2',
    secretKey: 'payme_sk_live_4b92f0c8d7a1e6f3',
    testMode: false,
    webhook: 'https://api.hdp.uz/payments/payme/webhook',
  },
  click: {
    serviceId: '84021',
    secretKey: 'click_sk_91c3a7e0d4f8b2a6',
  },
  uzum: {
    merchantId: 'uzum_8471',
    secretKey: 'uzum_sk_2d8a4f6c0b9e1a7d',
  },
  prices: { '1m': 49_000, '3m': 129_000, '1y': 399_000, trialDays: 7 },
  autoBackup: true,
  backupIntervalHours: 24,
}

export const profile: Profile = {
  name: 'Administrator',
  email: 'admin@hdp.uz',
  avatar: null,
  preferences: { emailReports: true, securityAlerts: true, weeklyDigest: false },
}

export const systemStatus = [
  { name: 'API Server', status: 'Online', uptime: '99.9%' },
  { name: 'Database (D1)', status: 'Online', uptime: '100%' },
  { name: 'Video (Bunny.net)', status: 'Online', uptime: '99.7%' },
  { name: "To'lov (Payme)", status: 'Online', uptime: '99.5%' },
  { name: 'Bot', status: 'Online', uptime: '100%' },
]

export const regionStats: RegionStat[] = REGIONS.map((region) => {
  const regionUsers = users.filter((user) => user.region === region.name)
  const proUsers = regionUsers.filter((user) => user.plan === 'pro').length
  return {
    name: region.name,
    users: regionUsers.length,
    proPercent: regionUsers.length ? Math.round((proUsers / regionUsers.length) * 1000) / 10 : 0,
    growth: region.growth,
  }
})

export const sessionDistribution = [
  { label: '0–5 daq', value: 2_140 },
  { label: '5–15 daq', value: 4_820 },
  { label: '15–30 daq', value: 3_980 },
  { label: '30+ daq', value: 1_907 },
]

export const cohortMatrix: number[][] = Array.from({ length: 8 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => {
    const base = 92 - week * 8
    return Math.max(12, Math.min(99, base - day * 2 + randInt(-3, 3)))
  }),
)

export const faqReplies = [
  { id: 'faq-1', label: "To'lov muammosi", text: "Assalomu alaykum! To'lov bo'yicha muammoni tekshiryapmiz. Iltimos, chek raqamini yuboring." },
  { id: 'faq-2', label: "Video ochilmayapti", text: "Iltimos, ilovani yangilang va internet aloqasini tekshiring. Muammo davom etsa, qurilma nomini yozing." },
  { id: 'faq-3', label: 'Coinlar yechilishi', text: "Coinlar tarixini tekshirdik. Xarid ikki marta hisoblangan bo'lsa, coinlar qaytariladi." },
  { id: 'faq-4', label: 'Sertifikat', text: "Sertifikatingizni qayta yubordik. Telegram profilingizni tekshiring." },
  { id: 'faq-5', label: 'Umumiy javob', text: "Murojaatingiz uchun rahmat! Muammoni tekshirib, tez orada javob beramiz." },
]

export interface UserActivity {
  weekly: Array<{ day: string; minutes: number }>
  lessons: Array<{ title: string; topic: string; minutes: number; completed: boolean }>
  problems: Array<{ title: string; topic: string; correct: boolean }>
}

export const activityFor = (user: User): UserActivity => {
  const seed = user.id.split('-')[1] ? Number(user.id.split('-')[1]) : user.xp
  const local = mulberry32(seed * 97 + 13)
  const days = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
  const activeTopicNames = topics.filter((topic) => topic.status === 'active').slice(0, 10)
  return {
    weekly: days.map((day) => ({
      day,
      minutes: Math.round(user.streak > 10 ? 15 + local() * 55 : local() * 40 + (local() > 0.5 ? 10 : 0)),
    })),
    lessons: Array.from({ length: 5 }, (_, index) => {
      const topic = activeTopicNames[(seed + index * 3) % activeTopicNames.length]
      return {
        title: `${topic.name} — ${VIDEO_TITLES[index % VIDEO_TITLES.length]}`,
        topic: topic.name,
        minutes: 6 + Math.floor(local() * 18),
        completed: local() > 0.25,
      }
    }),
    problems: Array.from({ length: 5 }, (_, index) => {
      const topic = activeTopicNames[(seed + index * 5 + 1) % activeTopicNames.length]
      return {
        title: `${topic.name} bo‘yicha ${index + 1}-masala`,
        topic: topic.name,
        correct: local() > 0.28,
      }
    }),
  }
}

export const topTopicViews = [...topics]
  .filter((topic) => topic.status === 'active')
  .sort((left, right) => right.views - left.views)
  .slice(0, 10)

export const totalRevenue = transactions
  .filter((transaction) => transaction.status === 'success')
  .reduce((sum, transaction) => sum + transaction.amount, 0)

export const monthRevenue = transactions
  .filter((transaction) => transaction.status === 'success')
  .filter((transaction) => {
    const date = new Date(transaction.createdAt)
    return date.getMonth() === MOCK_NOW.getMonth() && date.getFullYear() === MOCK_NOW.getFullYear()
  })
  .reduce((sum, transaction) => sum + transaction.amount, 0)

export const expiringThisWeek = [...planMap.values()].filter(
  (plan) => plan.endsAt <= NOW + 7 * DAY,
).length

export const expiringThisMonth = [...planMap.values()].filter(
  (plan) => plan.endsAt <= NOW + 30 * DAY,
).length

export const packagePrices = PACKAGE_PRICE
