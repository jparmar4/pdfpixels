export interface TransactionRow {
  date: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

export type ParseFailure = 'empty' | 'no-dates' | 'no-amounts' | 'no-rows' | 'scanned_pdf';

export interface StatementSummary {
  totalDebits: number;
  totalCredits: number;
  netChange: number;
  totalRows: number;
  openingBalance?: number;
  closingBalance?: number;
}

export interface BankStatementParseResult {
  transactions: TransactionRow[];
  summary?: StatementSummary;
  failure: ParseFailure | null;
}

type ColumnRole = 'date' | 'desc' | 'debit' | 'credit' | 'balance' | 'amount' | 'check' | 'unknown';

interface Amount {
  value: number;
  signed: number;
  empty?: boolean;
  explicitSign?: boolean;
}

interface DraftRow {
  date: string;
  description: string;
  amounts: Amount[];
  debit?: number;
  credit?: number;
  balance?: number;
  kind?: 'opening' | 'closing' | 'normal';
  section?: 'debit' | 'credit' | 'balance';
}

const MONTHS = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';

// Supports ISO, US, UK, Indian, European, and alphanumerical month dates
const DATE_RE = new RegExp(
  String.raw`\b(?:` +
    String.raw`\d{4}[/-]\d{1,2}[/-]\d{1,2}` +
    String.raw`|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}` +
    String.raw`|\d{1,2}[ -/.]?(?:${MONTHS})[ -/.]?\d{2,4}` +
    String.raw`|(?:${MONTHS})[ .,-]+\d{1,2}(?:st|nd|rd|th)?(?:,?[ -]+\d{2,4})?` +
    String.raw`|\d{1,2}[ -/.]?(?:${MONTHS})` +
    String.raw`|\d{1,2}[./-]\d{1,2}` +
  String.raw`)\b`,
  'i',
);

const JUNK_RE = /^(page\s+\d+|statement\s+period|account\s+(number|#|summary)|balance\s+summary|member\s+fdic|routing\s+(number|no)|questions\??$|customer\s+service|www\.|https?:|continued\s+on|please\s+(note|retain)|important\s+(disclosures|information)|total\s+(deposits|withdrawals|credits|debits|payments)|opening\s+balance\s+summary)/i;

const HEADER_DATE_RE = /^(trans(?:action)?|posted|posting|value|txn|booking|statement|eff(?:ective)?)?\s*dates?$/i;
const HEADER_DESC_RE = /desc|particular|narrative|details|payee|merchant|remark|memo|description|transaction|reference|narration/i;
const HEADER_DEBIT_RE = /withdraw|debit|payment|money out|paid out|\bdr\b|charge|payout|disbursement/i;
const HEADER_CREDIT_RE = /deposit|credit|money in|paid in|\bcr\b|receipt|addition/i;
const HEADER_BALANCE_RE = /balance|running|outstanding|closing bal/i;
const HEADER_AMOUNT_RE = /^(amount|value|sum|trans(?:action)?\s*amount)$/i;
const HEADER_CHECK_RE = /check|cheque|\bchq\b|\bref(?:\s*no|\s*num)?\b/i;

const SECTION_CREDIT_RE = /^(deposits?(\s*(&|and)\s*(other\s*)?credits?)?|credits?|additions?|money\s*in|funds\s*received)$/i;
const SECTION_DEBIT_RE = /^(withdrawals?(\s*(&|and)\s*(other\s*)?debits?)?|debits?|checks?\s*paid|electronic\s*withdrawals?|atm\s*(&|and)\s*debit|fees?\s*(charged)?|payments?\s*(&|and)\s*charges?|other\s*subtractions?|money\s*out)$/i;

const DEBIT_HINT = /\b(pos|purchase|withdrawal|withdraw|atm|fee|charge|check|cheque|debit|payment|paid|bill|subscription|visa|mastercard|maestro|sent|outgoing|overdraft|nsf|card|upi|neft|imps|ach debit|transfer to|dr|paid out)\b/i;
const CREDIT_HINT = /\b(deposit|payroll|salary|credit|refund|interest earned|dividend|incoming|received|ach credit|transfer from|reversal|cashback|reward|direct dep|direct deposit|incoming wire|mobile deposit|neft in|interest paid|cr|paid in)\b/i;
const BALANCE_LABEL = /\b(beginning|opening|closing|ending|previous|carry[- ]forward)\b.*\bbalance\b|\bbalance\b.*\b(beginning|opening|closing|ending|forward)\b|\b(beginning|opening|closing|ending) balance\b/i;

function normalizeLine(line: string): string {
  return line
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2212\u2013\u2014\uff0d]/g, '-')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/ +/g, ' ')
    .trim();
}

function splitCells(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map(cell => cell.replace(/\u00a0/g, ' ').trim());
  if (line.includes('|') && line.split('|').length >= 3) {
    return line.split('|').map(cell => cell.trim());
  }
  if (/\s{2,}/.test(line)) return line.split(/\s{2,}/).map(cell => cell.trim());
  return [line.trim()];
}

function detectDecimal(lines: string[]): '.' | ',' {
  let us = 0;
  let eu = 0;
  for (const line of lines) {
    if (/\d{1,3}(?:,\d{3})+\.\d{2}\b/.test(line) || /\d+\.\d{2}\b/.test(line)) us += 1;
    if (/\d{1,3}(?:\.\d{3})+,\d{2}\b/.test(line) || /(?<!\d)\d+,\d{2}\b/.test(line)) eu += 1;
    if (/\d{1,3}(?:,\d{3})+\.\d{2}\b/.test(line)) us += 2;
    if (/\d{1,3}(?:\.\d{3})+,\d{2}\b/.test(line)) eu += 3;
  }
  return eu > us ? ',' : '.';
}

function isPlausibleDate(text: string): boolean {
  const t = text.trim().replace(/^[^\w]+|[^\w]+$/g, '');
  if (!t || t.length > 24) return false;

  // Reject standalone month name without day or year, e.g. "January"
  if (new RegExp(`^(?:${MONTHS})$`, 'i').test(t)) return false;

  const iso = t.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const year = Number(iso[1]);
    return year >= 1990 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
  }

  const numeric = t.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    const validPair = (a >= 1 && a <= 12 && b >= 1 && b <= 31) || (a >= 1 && a <= 31 && b >= 1 && b <= 12);
    if (!validPair) return false;
    if (!numeric[3]) return true;
    const year = Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]);
    return year >= 1990 && year <= 2100;
  }

  // Text month format (e.g., 15-Jan-2024 or Jan 15, 2024)
  const hasMonth = new RegExp(`(?:${MONTHS})`, 'i').test(t);
  const hasDigits = /\d{1,2}/.test(t);
  return hasMonth && hasDigits;
}

function findDates(text: string): { text: string; start: number; end: number }[] {
  const hits: { text: string; start: number; end: number }[] = [];
  const re = new RegExp(DATE_RE.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const value = match[0].replace(/[.,;:]+$/, '');
    if (isPlausibleDate(value)) {
      hits.push({ text: value, start: match.index, end: match.index + match[0].length });
    }
    if (match.index === re.lastIndex) re.lastIndex += 1;
  }
  return hits;
}

function parseNumeric(raw: string, decimal: '.' | ','): number | null {
  const isParen = /^\(.*\)$/.test(raw.trim());
  const isMinus = /^-|-$|[\u2212\u2013\u2014]/.test(raw.trim());
  const isDr = /\b(DR|Dr\.)\b/i.test(raw);

  let s = raw
    .replace(/[€£$₹¥]|USD|EUR|GBP|INR|CAD|AUD|SGD|CHF|AED|SAR|Rs\.?|CR|DR|Cr\.|Dr\./gi, '')
    .replace(/[()\s]/g, '');

  s = s.replace(/^[+-]/, '').replace(/[+-]$/, '');

  if (decimal === ',') {
    if (s.includes('.') && s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    } else if (/\.\d{3}$/.test(s)) {
      s = s.replace(/\./g, '');
    }
  } else {
    // US, UK, and Indian formats (supporting lakhs and crores groupings)
    if (/,.*\.\d{1,2}$/.test(s) || /^\d{1,3}(,\d{2,3})+/.test(s)) {
      s = s.replace(/,/g, '');
    } else if (/^\d+,\d{1,2}$/.test(s) && decimal === '.') {
      return null;
    } else {
      s = s.replace(/,/g, '');
    }
  }

  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  const isNegative = isParen || isMinus || isDr;
  return isNegative ? -Math.abs(value) : Math.abs(value);
}

function findMoney(text: string, decimal: '.' | ',', allowBareInteger = false): { raw: string; amount: Amount; start: number; end: number }[] {
  const hits: { raw: string; amount: Amount; start: number; end: number }[] = [];

  // Global currency symbols and abbreviations
  const currencies = String.raw`[€£$₹¥]|USD|EUR|GBP|INR|CAD|AUD|SGD|CHF|AED|SAR|Rs\.?`;
  const token = decimal === ','
    ? String.raw`(?:\d{1,3}(?:[.\s]\d{3})+|\d+)(?:,\d{1,2})?`
    : String.raw`(?:\d{1,3}(?:,\d{2})+(?:,\d{3})|\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?`;

  const re = new RegExp(
    String.raw`(?:\()?\s*[-+]?\s*(?:${currencies})?\s*[-+]?\s*${token}\s*(?:${currencies})?\s*(?:CR|DR|Cr\.|Dr\.)?\s*[-+]?\s*\)?`,
    'gi',
  );

  let match: RegExpExecArray | null;
  const dateSpans = findDates(text);
  while ((match = re.exec(text))) {
    const start = match.index;
    const end = match.index + match[0].length;
    if (match.index === re.lastIndex) re.lastIndex += 1;

    // Never treat a date fragment (e.g. "01.202" inside "02.01.2026") as money.
    if (dateSpans.some(span => start < span.end && end > span.start)) continue;

    const raw = match[0].trim();
    const hasDecimal = decimal === ','
      ? /,\d{1,2}\s*(?:[€£$₹¥]|CR|DR|Cr\.|Dr\.)?\s*[-+]?\)?$/i.test(raw)
      : /\.\d{1,2}\s*(?:[€£$₹¥]|CR|DR|Cr\.|Dr\.)?\s*[-+]?\)?$/i.test(raw);
    const hasThousands = decimal === ',' ? /[.\s]\d{3}/.test(raw) : /,\d{2,3}/.test(raw);
    const crdr = /\b(CR|DR|Cr\.|Dr\.)\b/i.test(raw);
    const hasCurrency = new RegExp(currencies, 'i').test(raw);

    if (!hasDecimal && !hasThousands && !crdr && !hasCurrency && !allowBareInteger) continue;

    const value = parseNumeric(raw, decimal);
    if (value === null || Math.abs(value) > 1e11) continue;

    // Filter out apparent standalone years unless qualified
    if (!hasDecimal && !hasThousands && !hasCurrency && (value >= 1900 && value <= 2100 && Number.isInteger(value))) {
      continue;
    }

    const explicitPositive = /^\+/.test(raw) || /\b(CR|Cr\.)\b/i.test(raw);
    const signed = value;

    hits.push({
      raw,
      amount: {
        value: Math.abs(value),
        signed,
        explicitSign: explicitPositive || signed < 0,
      },
      start,
      end,
    });
  }

  return hits;
}

function classifyHeaderCell(cell: string): ColumnRole {
  const t = cell.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!t) return 'unknown';
  if (HEADER_DATE_RE.test(t) || t === 'date' || t === 'dt') return 'date';
  if (HEADER_CHECK_RE.test(t) && !/credit/.test(t)) return 'check';
  if (HEADER_DEBIT_RE.test(t) && !HEADER_CREDIT_RE.test(t)) return 'debit';
  if (HEADER_CREDIT_RE.test(t) && !HEADER_DEBIT_RE.test(t)) return 'credit';
  if (HEADER_BALANCE_RE.test(t)) return 'balance';
  if (HEADER_AMOUNT_RE.test(t)) return 'amount';
  if (HEADER_DESC_RE.test(t)) return 'desc';
  return 'unknown';
}

function classifyHeader(cells: string[]): ColumnRole[] | null {
  const roles = cells.map(classifyHeaderCell);
  const known = roles.filter(role => role !== 'unknown').length;
  if (known < 2) return null;
  if (!roles.includes('date') && !roles.includes('desc') && !roles.includes('amount') && !roles.includes('debit') && !roles.includes('credit')) {
    return null;
  }
  return roles;
}

function isJunkRow(cells: string[]): boolean {
  const text = cells.join(' ').trim();
  if (!text) return true;
  if (JUNK_RE.test(text)) return true;
  if (classifyHeader(cells)) return true;
  if (/^\s*(date|description|particulars)\b/i.test(text) && findMoney(text, '.').length === 0 && findMoney(text, ',').length === 0) return true;
  return false;
}

function moneyFromCell(cell: string, decimal: '.' | ','): Amount | null {
  if (!cell || !cell.trim()) return { value: 0, signed: 0, empty: true };
  const hits = findMoney(cell, decimal, true);
  if (hits.length === 1 && cell.replace(hits[0].raw, '').replace(/[\s\-$€£₹¥]/g, '') === '') {
    return hits[0].amount;
  }
  if (hits.length === 1 && cell.trim() === hits[0].raw) {
    return hits[0].amount;
  }
  return null;
}

function isPureDateCell(cell: string): boolean {
  const dates = findDates(cell);
  return dates.length === 1 && cell.replace(dates[0].text, '').trim() === '';
}

function stripMatched(text: string, spans: { start: number; end: number }[]): string {
  if (spans.length === 0) return text.trim();
  const sorted = [...spans].sort((a, b) => b.start - a.start);
  let result = text;
  for (const span of sorted) {
    result = result.slice(0, span.start) + ' ' + result.slice(span.end);
  }
  return result.replace(/[ \t]{2,}/g, ' ').trim();
}

function parseByRoles(cells: string[], roles: ColumnRole[], decimal: '.' | ','): DraftRow | null {
  let date = '';
  const desc: string[] = [];
  let debit: number | undefined;
  let credit: number | undefined;
  let balance: number | undefined;
  let amount: Amount | undefined;

  const width = Math.max(cells.length, roles.length);
  for (let i = 0; i < width; i++) {
    const role = roles[i] || 'unknown';
    const cell = cells[i] || '';
    if (role === 'date') {
      const dates = findDates(cell);
      if (dates[0] && !date) {
        date = dates[0].text;
        // Keep second date if present (e.g. Value Date)
        if (dates[1] && dates[1].text !== dates[0].text) {
          desc.push(`[Value Dt: ${dates[1].text}]`);
        }
      } else if (cell && !date && isPlausibleDate(cell)) {
        date = cell;
      }
      continue;
    }
    if (role === 'desc' || role === 'check') {
      if (cell) desc.push(cell);
      continue;
    }
    const money = moneyFromCell(cell, decimal);
    if (role === 'debit' && money && !money.empty) {
      debit = money.value;
    } else if (role === 'credit' && money && !money.empty) {
      credit = money.value;
    } else if (role === 'balance' && money && !money.empty) {
      balance = money.signed < 0 ? money.signed : money.value;
    } else if (role === 'amount' && money && !money.empty) {
      amount = money;
    } else if (role === 'unknown' && cell) {
      if (!date && isPureDateCell(cell)) {
        date = findDates(cell)[0].text;
      } else {
        desc.push(cell);
      }
    }
  }

  if (!date) {
    const joined = cells.join(' ');
    const dates = findDates(joined);
    if (dates[0]) date = dates[0].text;
  }
  if (!date) return null;

  const draft: DraftRow = {
    date,
    description: desc.join(' ').replace(/[ \t]{2,}/g, ' ').trim(),
    amounts: [],
    debit,
    credit,
    balance,
  };

  if (amount) {
    draft.amounts = [amount];
    if (amount.signed < 0) draft.debit = amount.value;
    else if (amount.explicitSign) draft.credit = amount.value;
  }

  if (BALANCE_LABEL.test(draft.description)) {
    draft.kind = /clos|end/i.test(draft.description) ? 'closing' : 'opening';
  }
  if (draft.kind && balance === undefined && amount) {
    draft.balance = amount.value;
    draft.amounts = [];
    draft.debit = undefined;
    draft.credit = undefined;
  }
  return draft;
}

function parseByContent(cells: string[], decimal: '.' | ','): DraftRow | null {
  const types = cells.map(cell => {
    if (!cell || !cell.trim()) return 'empty' as const;
    if (isPureDateCell(cell)) return 'date' as const;
    const money = moneyFromCell(cell, decimal);
    if (money && !money.empty) return 'money' as const;
    return 'text' as const;
  });

  const hasStructuredMoney = types.filter(type => type === 'money').length >= 1 && cells.length >= 3;

  if (hasStructuredMoney) {
    let date = '';
    const desc: string[] = [];
    const amounts: Amount[] = [];
    for (let i = 0; i < cells.length; i++) {
      if (types[i] === 'date') {
        const value = findDates(cells[i])[0]?.text || cells[i];
        if (!date) date = value;
        continue;
      }
      if (types[i] === 'text') {
        desc.push(cells[i]);
        continue;
      }
      if (types[i] === 'empty') {
        if (amounts.length || types.slice(i).includes('money')) {
          amounts.push({ value: 0, signed: 0, empty: true });
        }
        continue;
      }
      const money = moneyFromCell(cells[i], decimal);
      if (money) amounts.push(money);
    }
    if (!date) {
      const dates = findDates(cells.join(' '));
      if (dates[0]) date = dates[0].text;
    }
    if (date && amounts.some(amount => !amount.empty)) {
      return applyAmountPattern({
        date,
        description: desc.join(' ').trim(),
        amounts: collapseEmptyAmounts(amounts),
      });
    }
  }

  const line = cells.filter(Boolean).join('  ');
  const dates = findDates(line);
  if (dates.length === 0) return null;
  const money = findMoney(line, decimal);
  if (money.length === 0) {
    return {
      date: dates[0].text,
      description: stripMatched(line, dates).trim(),
      amounts: [],
    };
  }
  const description = stripMatched(line, [...dates, ...money]);
  return applyAmountPattern({
    date: dates[0].text,
    description,
    amounts: money.map(hit => hit.amount),
  });
}

function parseBalanceOnly(cells: string[], decimal: '.' | ','): DraftRow | null {
  const line = cells.join(' ').trim();
  if (!line || findDates(line).length > 0) return null;
  if (!BALANCE_LABEL.test(line)) return null;
  const money = findMoney(line, decimal);
  if (money.length !== 1) return null;
  const kind = /clos|end/i.test(line) ? 'closing' : 'opening';
  return {
    date: '',
    description: stripMatched(line, money),
    amounts: [],
    balance: money[0].amount.value,
    kind,
  };
}

function collapseEmptyAmounts(amounts: Amount[]): Amount[] {
  let start = 0;
  let end = amounts.length;
  while (start < end && amounts[start].empty) start++;
  while (end > start && amounts[end - 1].empty) end--;
  return amounts.slice(start, end);
}

function applyAmountPattern(draft: DraftRow): DraftRow {
  const filled = draft.amounts.filter(amount => !amount.empty);
  const empties = draft.amounts.some(amount => amount.empty);

  if (BALANCE_LABEL.test(draft.description)) {
    draft.kind = /clos|end/i.test(draft.description) ? 'closing' : 'opening';
    if (filled.length >= 1) {
      draft.balance = filled[filled.length - 1].value;
      draft.amounts = [];
    }
    return draft;
  }

  // If table columns have empty cells between Debit and Credit
  if (empties && draft.amounts.length >= 2) {
    const cols = draft.amounts.slice(-3);
    while (cols.length < 3) cols.unshift({ value: 0, signed: 0, empty: true });
    const [debitCol, creditCol, balanceCol] = cols;
    if (!debitCol.empty) draft.debit = debitCol.value;
    if (!creditCol.empty) draft.credit = creditCol.value;
    if (!balanceCol.empty) draft.balance = balanceCol.value;
    draft.amounts = [];
    return draft;
  }

  // 3 filled amounts: [Debit, Credit, Balance] or [Amount, Balance, ...]
  if (filled.length >= 3) {
    draft.debit = filled[0].value;
    draft.credit = filled[1].value;
    draft.balance = filled[2].value;
    draft.amounts = filled;
    return draft;
  }

  // 2 filled amounts: [Amount, Balance]
  if (filled.length === 2) {
    const [first, second] = filled;
    if (first.signed < 0) {
      draft.debit = first.value;
      draft.balance = second.value;
    } else if (first.explicitSign) {
      draft.credit = first.value;
      draft.balance = second.value;
    } else {
      draft.amounts = filled;
      draft.balance = second.value;
    }
    return draft;
  }

  // 1 filled amount
  if (filled.length === 1) {
    const amount = filled[0];
    if (amount.signed < 0) draft.debit = amount.value;
    else if (amount.explicitSign) draft.credit = amount.value;
    else draft.amounts = filled;
  }
  return draft;
}

function keywordDirection(description: string): 'debit' | 'credit' | null {
  const debit = DEBIT_HINT.test(description);
  const credit = CREDIT_HINT.test(description);
  if (debit && !credit) return 'debit';
  if (credit && !debit) return 'credit';
  return null;
}

function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(0.02, Math.abs(b) * 0.0005);
}

function classifyWithBalance(rows: DraftRow[]): void {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.debit !== undefined || row.credit !== undefined) continue;
    const filled = row.amounts.filter(amount => !amount.empty);
    const amount = filled[0];
    if (!amount) continue;

    // Check section context first (e.g. statement section "Deposits and Additions")
    if (row.section === 'credit') {
      row.credit = amount.value;
      continue;
    }
    if (row.section === 'debit') {
      row.debit = amount.value;
      continue;
    }

    // Explicit sign check
    if (amount.signed < 0) {
      row.debit = amount.value;
      continue;
    }
    if (amount.explicitSign) {
      row.credit = amount.value;
      continue;
    }

    // Bidirectional balance math verification
    const prevBalance = i > 0 ? rows[i - 1].balance : undefined;
    const nextBalance = row.balance;

    if (prevBalance !== undefined && nextBalance !== undefined) {
      // Chronological: prevBalance - amount == nextBalance (debit)
      if (approxEqual(prevBalance - amount.value, nextBalance)) {
        row.debit = amount.value;
        continue;
      }
      // Chronological: prevBalance + amount == nextBalance (credit)
      if (approxEqual(prevBalance + amount.value, nextBalance)) {
        row.credit = amount.value;
        continue;
      }
      // Reverse chronological: nextBalance - amount == prevBalance (credit)
      if (approxEqual(nextBalance - amount.value, prevBalance)) {
        row.credit = amount.value;
        continue;
      }
      // Reverse chronological: nextBalance + amount == prevBalance (debit)
      if (approxEqual(nextBalance + amount.value, prevBalance)) {
        row.debit = amount.value;
        continue;
      }
    }

    // Keyword heuristics
    const hinted = keywordDirection(row.description);
    if (hinted === 'credit') {
      row.credit = amount.value;
    } else if (hinted === 'debit') {
      row.debit = amount.value;
    } else {
      row.debit = amount.value;
    }
  }
}

function formatAmount(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '';
  return Math.abs(value).toFixed(2);
}

function finalize(row: DraftRow): TransactionRow | null {
  if (!row.date && !row.kind) return null;
  if (row.debit === undefined && row.credit === undefined && row.balance === undefined) return null;
  const description = row.description.replace(/[ \t]{2,}/g, ' ').trim() || (row.kind === 'opening' ? 'Opening Balance' : row.kind === 'closing' ? 'Closing Balance' : 'Transaction');
  if (JUNK_RE.test(description) && row.kind === 'normal') return null;
  if (/^totals?\b/i.test(description) && !row.kind) return null;
  return {
    date: row.date,
    description,
    debit: formatAmount(row.debit),
    credit: formatAmount(row.credit),
    balance: formatAmount(row.balance),
  };
}

function calculateSummary(transactions: TransactionRow[], drafts: DraftRow[]): StatementSummary {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const t of transactions) {
    if (t.debit) totalDebits += Number(t.debit) || 0;
    if (t.credit) totalCredits += Number(t.credit) || 0;
  }

  const opening = drafts.find(d => d.kind === 'opening')?.balance;
  const closing = drafts.find(d => d.kind === 'closing')?.balance;

  return {
    totalDebits: Number(totalDebits.toFixed(2)),
    totalCredits: Number(totalCredits.toFixed(2)),
    netChange: Number((totalCredits - totalDebits).toFixed(2)),
    totalRows: transactions.length,
    openingBalance: opening,
    closingBalance: closing,
  };
}

export function parseBankStatement(lines: string[]): BankStatementParseResult {
  const normalized = lines
    .map(normalizeLine)
    .filter(line => line.trim());

  if (normalized.length === 0) {
    return { transactions: [], failure: 'empty' };
  }

  const decimal = detectDecimal(normalized);
  const rows = normalized.map(splitCells);

  let headerRoles: ColumnRole[] | null = null;
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const roles = classifyHeader(rows[i]);
    if (roles) {
      headerRoles = roles;
      headerIndex = i;
      break;
    }
  }

  const body = rows.filter((cells, index) => index !== headerIndex && !isJunkRow(cells));
  const drafts: DraftRow[] = [];
  let pending: DraftRow | null = null;
  let activeSection: 'debit' | 'credit' | 'balance' | undefined;

  const pushPending = () => {
    if (!pending) return;
    if (pending.date && (pending.amounts.some(amount => !amount.empty) || pending.debit !== undefined || pending.credit !== undefined || pending.balance !== undefined)) {
      if (activeSection && !pending.section) pending.section = activeSection;
      drafts.push(applyAmountPattern(pending));
    }
    pending = null;
  };

  for (const cells of body) {
    const joinedText = cells.join(' ').trim();

    // Check for statement section changes (e.g., "Deposits and Additions", "Electronic Withdrawals")
    if (cells.length <= 3 && findDates(joinedText).length === 0 && findMoney(joinedText, decimal).length === 0) {
      if (SECTION_CREDIT_RE.test(joinedText)) {
        activeSection = 'credit';
        continue;
      }
      if (SECTION_DEBIT_RE.test(joinedText)) {
        activeSection = 'debit';
        continue;
      }
    }

    const parsed = headerRoles && cells.length >= Math.min(3, headerRoles.length)
      ? parseByRoles(cells, headerRoles, decimal) || parseByContent(cells, decimal)
      : parseByContent(cells, decimal);

    if (parsed) {
      if (activeSection && !parsed.section) parsed.section = activeSection;
    }

    if (!parsed) {
      const balanceOnly = parseBalanceOnly(cells, decimal);
      if (balanceOnly) {
        drafts.push(balanceOnly);
        continue;
      }
    }

    if (parsed?.date && (parsed.amounts.some(amount => !amount.empty) || parsed.debit !== undefined || parsed.credit !== undefined || parsed.balance !== undefined)) {
      pushPending();
      drafts.push(parsed);
      pending = null;
      continue;
    }

    if (parsed?.date && parsed.amounts.length === 0 && parsed.debit === undefined) {
      pushPending();
      pending = parsed;
      continue;
    }

    if (pending) {
      const extraMoney = findMoney(cells.join(' '), decimal);
      const extraText = cells.filter(cell => cell && !isPureDateCell(cell) && !moneyFromCell(cell, decimal)).join(' ');
      if (extraText) pending.description = `${pending.description} ${extraText}`.trim();
      if (extraMoney.length) pending.amounts.push(...extraMoney.map(hit => hit.amount));
      continue;
    }

    // Continuation lines for multi-line transactions
    if (drafts.length && !findDates(joinedText).length) {
      const extraMoney = findMoney(joinedText, decimal);
      const last = drafts[drafts.length - 1];
      const extraText = cells.filter(Boolean).join(' ');
      if (extraText && extraMoney.length === 0 && !JUNK_RE.test(extraText)) {
        last.description = `${last.description} ${extraText}`.trim();
      } else if (extraMoney.length && last.debit === undefined && last.credit === undefined && last.amounts.length === 0) {
        last.amounts.push(...extraMoney.map(hit => hit.amount));
        last.description = `${last.description} ${stripMatched(joinedText, extraMoney)}`.trim();
      }
    }
  }
  pushPending();

  const hadDates = normalized.some(line => findDates(line).length > 0);
  const hadMoney = normalized.some(line => findMoney(line, decimal).length > 0);
  if (drafts.length === 0) {
    return { transactions: [], failure: !hadDates ? 'no-dates' : !hadMoney ? 'no-amounts' : 'no-rows' };
  }

  classifyWithBalance(drafts);

  const transactions = drafts.map(finalize).filter((row): row is TransactionRow => row !== null);
  const datedRows = transactions.filter(row => row.date);
  if (datedRows.length === 0) {
    return { transactions: [], failure: !hadDates ? 'no-dates' : !hadMoney ? 'no-amounts' : 'no-rows' };
  }

  const summary = calculateSummary(transactions, drafts);
  return { transactions, summary, failure: null };
}

export function parseFailureMessage(failure: ParseFailure | null): string {
  switch (failure) {
    case 'empty':
    case 'scanned_pdf':
      return 'No selectable text found. This looks like a scanned statement — download a digital PDF from your bank, or convert pages to images and run OCR first.';
    case 'no-dates':
      return 'Found text but no transaction dates. Use a digital statement from your bank, or run OCR on scanned pages first.';
    case 'no-amounts':
      return 'Found dates but no recognizable amounts. Try a text-based statement export rather than a scanned copy.';
    case 'no-rows':
      return 'No reliable transaction rows found. Use a text-based statement with dates and decimal amounts, or run OCR first.';
    default:
      return 'No reliable transaction rows found. Use a text-based statement with dates and decimal amounts, or run OCR first.';
  }
}
