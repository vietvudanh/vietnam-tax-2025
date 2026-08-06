export type LatePaymentKind = 'tax' | 'administrativeFine';

export interface LatePaymentSegment {
  startDate: Date;
  endDate: Date;
  days: number;
  ratePerDay: number;
  amount: number;
  explanation: string;
}

export interface LatePaymentResult {
  segments: LatePaymentSegment[];
  totalAmount: number;
}

interface LatePaymentRule {
  start: Date;
  endExclusive: Date | null;
  ratePerDay: number;
  explanation: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const makeUtcDate = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

const TAX_RULES: LatePaymentRule[] = [
  {
    start: makeUtcDate(1900, 1, 1),
    endExclusive: makeUtcDate(2016, 7, 1),
    ratePerDay: 0.0005,
    explanation: 'Trước ngày 1/7/2016: Tính theo tỷ lệ 0,05%/ngày theo quy định trước Luật số 106/2016/QH13',
  },
  {
    start: makeUtcDate(2016, 7, 1),
    endExclusive: makeUtcDate(2020, 7, 1),
    ratePerDay: 0.0003,
    explanation: 'Từ ngày 1/7/2016: Tính theo tỷ lệ 0,03%/ngày (Quy định của Luật số 106/2016/QH13)',
  },
  {
    start: makeUtcDate(2020, 7, 1),
    endExclusive: null,
    ratePerDay: 0.0003,
    explanation: 'Từ ngày 1/7/2020: Mức tính tiền chậm nộp và thời gian tính tiền chậm nộp được quy định theo khoản 2 Điều 59 Luật số 38/2019/QH14 ngày 13/06/2019',
  },
];

const FINE_RULES: LatePaymentRule[] = [
  {
    start: makeUtcDate(1900, 1, 1),
    endExclusive: makeUtcDate(2020, 7, 1),
    ratePerDay: 0.0005,
    explanation: 'Trước ngày 1/7/2020: Tính theo tỷ lệ 0,05%/ngày theo Luật Xử lý vi phạm hành chính 2012',
  },
  {
    start: makeUtcDate(2020, 7, 1),
    endExclusive: null,
    ratePerDay: 0.0005,
    explanation: 'Từ ngày 1/7/2020: Tính theo tỷ lệ 0,05%/ngày theo Luật số 67/2020/QH14 (sửa đổi Luật Xử lý vi phạm hành chính)',
  },
];

const getRules = (kind: LatePaymentKind): LatePaymentRule[] => (
  kind === 'tax' ? TAX_RULES : FINE_RULES
);

const clampPeriod = (
  rangeStart: Date,
  rangeEndExclusive: Date,
  rule: LatePaymentRule
): { start: Date; endExclusive: Date } | null => {
  const start = rangeStart > rule.start ? rangeStart : rule.start;
  const ruleEnd = rule.endExclusive ?? rangeEndExclusive;
  const endExclusive = rangeEndExclusive < ruleEnd ? rangeEndExclusive : ruleEnd;
  if (endExclusive <= start) return null;
  return { start, endExclusive };
};

const diffDays = (start: Date, endExclusive: Date): number =>
  Math.floor((endExclusive.getTime() - start.getTime()) / DAY_MS);

export const parseVietnamDate = (value: string): Date | null => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const date = makeUtcDate(year, month, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

export const formatVietnamDate = (date: Date): string =>
  `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;

export const formatDotNumber = (amount: number): string =>
  Math.round(amount).toLocaleString('vi-VN').replace(/,/g, '.');

export const formatPercentPerDay = (ratePerDay: number): string =>
  `${(ratePerDay * 100).toFixed(2).replace('.', ',')}%`;

export const calculateLatePayment = (
  principal: number,
  fromDate: Date,
  toDate: Date,
  kind: LatePaymentKind
): LatePaymentResult => {
  const amount = Math.max(0, principal);
  if (toDate <= fromDate || amount === 0) {
    return { segments: [], totalAmount: 0 };
  }

  const segments: LatePaymentSegment[] = [];
  const rules = getRules(kind);
  let totalAmount = 0;

  for (const rule of rules) {
    const period = clampPeriod(fromDate, toDate, rule);
    if (!period) continue;
    const days = diffDays(period.start, period.endExclusive);
    if (days <= 0) continue;
    const segmentAmount = Math.round(amount * days * rule.ratePerDay);
    totalAmount += segmentAmount;
    segments.push({
      startDate: period.start,
      endDate: period.endExclusive,
      days,
      ratePerDay: rule.ratePerDay,
      amount: segmentAmount,
      explanation: rule.explanation,
    });
  }

  return { segments, totalAmount };
};

