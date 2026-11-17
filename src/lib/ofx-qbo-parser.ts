export interface OfxTransaction {
  id: string;
  fitid: string;
  date: string;
  rawDate: string;
  type: string;
  name: string;
  memo: string;
  checkNum: string;
  amount: number;
  debit: number | null;
  credit: number | null;
}

export interface ParsedOfxStatement {
  bankId: string;
  accountId: string;
  accountType: string;
  currency: string;
  startDate: string;
  endDate: string;
  ledgerBalance: number | null;
  ledgerDate: string;
  transactions: OfxTransaction[];
  totalDebits: number;
  totalCredits: number;
  netChange: number;
}

function formatOfxDate(raw: string): string {
  const clean = (raw || '').trim();
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return clean;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function readTag(block: string, tagName: string): string {
  // Supports both OFX 2.x (<TAG>value</TAG>) and OFX 1.x SGML (<TAG>value\n or next <)
  const xmlRe = new RegExp(`<${tagName}>([^<]*)</${tagName}>`, 'i');
  const xmlMatch = block.match(xmlRe);
  if (xmlMatch) return decodeEntities(xmlMatch[1].trim());

  const sgmlRe = new RegExp(`<${tagName}>([^<\\r\\n]+)`, 'i');
  const sgmlMatch = block.match(sgmlRe);
  if (sgmlMatch) return decodeEntities(sgmlMatch[1].trim());

  return '';
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function maskAccountId(rawId: string): string {
  const trimmed = rawId.trim();
  if (trimmed.length <= 4) return trimmed || 'Primary Account';
  return `••••${trimmed.slice(-4)}`;
}

export function parseOfxQboQfx(content: string): ParsedOfxStatement {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized || (!/<OFX/i.test(normalized) && !/<STMTTRN>/i.test(normalized))) {
    throw new Error('This does not appear to be a valid .QBO, .QFX, or .OFX bank statement file.');
  }

  const currency = readTag(normalized, 'CURDEF') || 'USD';
  const bankId = readTag(normalized, 'BANKID') || readTag(normalized, 'ORG') || 'Institution';
  const rawAcctId = readTag(normalized, 'ACCTID');
  const accountType =
    readTag(normalized, 'ACCTTYPE') ||
    (/CREDITCARD|CCSTMTTRNRS/i.test(normalized) ? 'CREDIT CARD' : 'CHECKING');
  const startDate = formatOfxDate(readTag(normalized, 'DTSTART'));
  const endDate = formatOfxDate(readTag(normalized, 'DTEND'));

  const ledgerBlock = normalized.match(/<LEDGERBAL>([\s\S]*?)(?:<\/LEDGERBAL>|<AVAILBAL>|<\/BANKTRANLIST>|$)/i)?.[1] || normalized;
  const ledgerAmtRaw = readTag(ledgerBlock, 'BALAMT');
  const ledgerBalance = ledgerAmtRaw !== '' && Number.isFinite(Number(ledgerAmtRaw)) ? Number(ledgerAmtRaw) : null;
  const ledgerDate = formatOfxDate(readTag(ledgerBlock, 'DTASOF'));

  const transactions: OfxTransaction[] = [];
  const blockRe = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|<\/BANKTRANLIST>)/gi;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = blockRe.exec(normalized)) !== null) {
    const block = match[1];
    const type = readTag(block, 'TRNTYPE') || 'OTHER';
    const rawDate = readTag(block, 'DTPOSTED');
    const date = formatOfxDate(rawDate);
    const amtNum = Number.parseFloat(readTag(block, 'TRNAMT').replace(/,/g, ''));
    const amount = Number.isFinite(amtNum) ? amtNum : 0;
    const fitid = readTag(block, 'FITID') || `row-${idx + 1}`;
    const name = readTag(block, 'NAME') || readTag(block, 'PAYEE') || '';
    const memo = readTag(block, 'MEMO') || '';
    const checkNum = readTag(block, 'CHECKNUM') || '';

    const debit = amount < 0 ? Number(Math.abs(amount).toFixed(2)) : null;
    const credit = amount > 0 ? Number(amount.toFixed(2)) : null;

    transactions.push({
      id: `${fitid}-${idx++}`,
      fitid,
      date,
      rawDate,
      type,
      name: name || memo || type,
      memo,
      checkNum,
      amount: Number(amount.toFixed(2)),
      debit,
      credit,
    });
  }

  if (transactions.length === 0) {
    throw new Error('No <STMTTRN> transaction records found inside this QBO/OFX file.');
  }

  const totalDebits = Number(
    transactions.reduce((sum, t) => sum + (t.debit ?? 0), 0).toFixed(2),
  );
  const totalCredits = Number(
    transactions.reduce((sum, t) => sum + (t.credit ?? 0), 0).toFixed(2),
  );

  return {
    bankId,
    accountId: maskAccountId(rawAcctId),
    accountType,
    currency,
    startDate,
    endDate,
    ledgerBalance,
    ledgerDate,
    transactions,
    totalDebits,
    totalCredits,
    netChange: Number((totalCredits - totalDebits).toFixed(2)),
  };
}

export type OfxExportPreset = 'xlsx' | 'quickbooks-3col' | 'xero' | 'wave' | 'csv';

function csvEscape(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function formatOfxCsv(parsed: ParsedOfxStatement, preset: Exclude<OfxExportPreset, 'xlsx'>): string {
  if (preset === 'quickbooks-3col' || preset === 'wave') {
    const header = 'Date,Description,Amount\n';
    const body = parsed.transactions
      .map((t) => {
        const desc = [t.name, t.memo && t.memo !== t.name ? t.memo : ''].filter(Boolean).join(' - ');
        return `${csvEscape(t.date)},${csvEscape(desc)},${t.amount.toFixed(2)}`;
      })
      .join('\n');
    return header + body;
  }

  if (preset === 'xero') {
    const header = '*Date,*Amount,Payee,Description,Reference\n';
    const body = parsed.transactions
      .map(
        (t) =>
          `${csvEscape(t.date)},${t.amount.toFixed(2)},${csvEscape(t.name)},${csvEscape(t.memo || t.type)},${csvEscape(t.checkNum || t.fitid)}`,
      )
      .join('\n');
    return header + body;
  }

  // Standard full CSV
  const header = 'Date,Payee,Memo,Type,Debit,Credit,Amount,Check Number,FITID\n';
  const body = parsed.transactions
    .map(
      (t) =>
        `${csvEscape(t.date)},${csvEscape(t.name)},${csvEscape(t.memo)},${csvEscape(t.type)},${t.debit !== null ? t.debit.toFixed(2) : ''},${t.credit !== null ? t.credit.toFixed(2) : ''},${t.amount.toFixed(2)},${csvEscape(t.checkNum)},${csvEscape(t.fitid)}`,
    )
    .join('\n');
  return header + body;
}

export const SAMPLE_QBO_STATEMENT = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <CURDEF>USD
        <BANKACCTFROM>
          <BANKID>021000021
          <ACCTID>4829104829
          <ACCTTYPE>CHECKING
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20261001000000
          <DTEND>20261031000000
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20261003000000
            <TRNAMT>4850.00
            <FITID>2026100301
            <NAME>STRIPE TRANSFER
            <MEMO>MERCHANT PAYOUT BATCH #904
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20261005000000
            <TRNAMT>-142.80
            <FITID>2026100502
            <NAME>AMAZON WEB SERVICES
            <MEMO>CLOUD INFRASTRUCTURE BILLING
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20261009000000
            <TRNAMT>-89.00
            <FITID>2026100903
            <NAME>QUICKBOOKS ONLINE
            <MEMO>MONTHLY SUBSCRIPTION
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CHECK
            <DTPOSTED>20261014000000
            <TRNAMT>-1250.00
            <FITID>2026101404
            <CHECKNUM>1042
            <NAME>COMMERCIAL OFFICE LEASE
            <MEMO>SUITE 400 OCT RENT
          </STMTTRN>
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>18368.20
          <DTASOF>20261031000000
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
