import { absoluteUrl, SITE_CONTENT_UPDATED } from '@/lib/seo';

export const LOCALIZED_TOOL_SLUGS = [
  'compress-pdf',
  'merge-pdf',
  'split-pdf',
  'pdf-to-jpg',
  'image-to-pdf',
  'heic-to-jpg',
] as const;

export type LocalizedToolSlug = (typeof LOCALIZED_TOOL_SLUGS)[number];
export type LocaleCode = 'de' | 'fr' | 'jp';

export type LocalizedToolCopy = {
  name: string;
  title: string;
  description: string;
  howTitle: string;
  intro: string;
  steps: string[];
};

type LocalePack = {
  htmlLang: string;
  ogLocale: string;
  hreflang: string;
  limitNote: string;
  englishLabel: string;
  tools: Record<LocalizedToolSlug, LocalizedToolCopy>;
};

const deTools: Record<LocalizedToolSlug, LocalizedToolCopy> = {
  'compress-pdf': {
    name: 'PDF komprimieren',
    title: 'PDF komprimieren – kostenlos, ohne Anmeldung',
    description: 'PDF-Dateien im Browser verkleinern. Drei Stufen, Ghostscript für Bilder, Text bleibt scharf.',
    howTitle: 'PDF verkleinern',
    intro: 'Der Kompressor nutzt Ghostscript und reduziert nur die Bilder im PDF. Vektortext bleibt erhalten. Sehr kleine Einsparungen werden abgelehnt, damit ein bereits optimiertes Dokument nicht als Erfolg ausgegeben wird.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Stufe wählen: kleinste Datei, empfohlen oder hohe Qualität.',
      'Die kleinere PDF herunterladen und die Prozentzahl prüfen.',
    ],
  },
  'merge-pdf': {
    name: 'PDF zusammenführen',
    title: 'PDF zusammenführen – kostenlos, ohne Anmeldung',
    description: 'Mehrere PDFs in der gewünschten Reihenfolge zu einer Datei verbinden.',
    howTitle: 'Mehrere PDFs verbinden',
    intro: 'Die Seiten werden serverseitig in der Reihenfolge zusammengefügt, die Sie festlegen. Lesezeichen der Quelldateien werden dabei nicht neu aufgebaut.',
    steps: [
      'Bis zu 20 PDFs hinzufügen, je 50 MB, zusammen höchstens 100 MB und 1000 Seiten.',
      'Die Reihenfolge per Ziehen festlegen.',
      'Eine PDF herunterladen.',
    ],
  },
  'split-pdf': {
    name: 'PDF teilen',
    title: 'PDF teilen – kostenlos, ohne Anmeldung',
    description: 'Seiten extrahieren oder ein PDF in einzelne Dateien aufteilen.',
    howTitle: 'Seiten herauslösen',
    intro: 'Bereiche und einzelne Seiten werden als neue PDF gespeichert. Der Modus alle Seiten liefert ein ZIP und stoppt bei 20 Seiten.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Seiten oder einen Bereich angeben. Ein Extrakt umfasst höchstens 50 Seiten.',
      'PDF oder ZIP herunterladen.',
    ],
  },
  'pdf-to-jpg': {
    name: 'PDF in JPG',
    title: 'PDF in JPG umwandeln – kostenlos, ohne Anmeldung',
    description: 'PDF-Seiten mit Ghostscript als JPG, PNG oder WebP ausgeben.',
    howTitle: 'Seiten als Bilder speichern',
    intro: 'Jede Seite wird gerastert. Die Auflösung liegt zwischen 72 und 300 DPI, der Standard ist 150. Pro Durchlauf werden höchstens 10 Seiten ausgegeben.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Format, Qualität und DPI wählen.',
      'Die Bilder herunterladen.',
    ],
  },
  'image-to-pdf': {
    name: 'JPG in PDF',
    title: 'JPG in PDF umwandeln – kostenlos, ohne Anmeldung',
    description: 'JPG, PNG, WebP und HEIC zu einer PDF zusammenstellen.',
    howTitle: 'Bilder in ein PDF legen',
    intro: 'Bis zu 30 Bilder, je 15 MB und zusammen höchstens 120 MB. Seitengröße, Ausrichtung und Ränder legen Sie vor dem Erzeugen fest.',
    steps: [
      'Bilder hinzufügen und sortieren.',
      'Seitengröße und Passform wählen.',
      'Die PDF herunterladen.',
    ],
  },
  'heic-to-jpg': {
    name: 'HEIC in JPG',
    title: 'HEIC in JPG umwandeln – kostenlos, ohne Anmeldung',
    description: 'iPhone-HEIC-Fotos in JPG umwandeln, das sich unter Windows öffnen lässt.',
    howTitle: 'HEIC-Fotos umwandeln',
    intro: 'HEIC wird serverseitig nach JPG gewandelt. Eine Datei darf höchstens 25 MB groß sein.',
    steps: [
      'HEIC-Datei hochladen.',
      'Die Umwandlung starten.',
      'JPG herunterladen.',
    ],
  },
};

const frTools: Record<LocalizedToolSlug, LocalizedToolCopy> = {
  'compress-pdf': {
    name: 'Compresser un PDF',
    title: 'Compresser un PDF – gratuit, sans inscription',
    description: 'Réduire un PDF dans le navigateur. Trois niveaux, Ghostscript pour les images, texte vectoriel conservé.',
    howTitle: 'Réduire un PDF',
    intro: 'La compression Ghostscript ne rééchantillonne que les images. Le texte vectoriel reste net. Un gain trop faible est refusé pour ne pas présenter un fichier déjà optimisé comme un succès.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Choisissez le plus petit fichier, le niveau recommandé ou la haute qualité.',
      'Téléchargez le PDF et vérifiez le pourcentage gagné.',
    ],
  },
  'merge-pdf': {
    name: 'Fusionner des PDF',
    title: 'Fusionner des PDF – gratuit, sans inscription',
    description: 'Réunir plusieurs PDF dans l’ordre choisi.',
    howTitle: 'Assembler des PDF',
    intro: 'Les pages sont copiées dans l’ordre affiché. Les signets des fichiers sources ne sont pas reconstruits.',
    steps: [
      'Ajoutez jusqu’à 20 PDF, 50 Mo chacun, 100 Mo et 1000 pages au total.',
      'Réglez l’ordre.',
      'Téléchargez un seul PDF.',
    ],
  },
  'split-pdf': {
    name: 'Diviser un PDF',
    title: 'Diviser un PDF – gratuit, sans inscription',
    description: 'Extraire des pages ou séparer un PDF en plusieurs fichiers.',
    howTitle: 'Extraire des pages',
    intro: 'Une plage devient un nouveau PDF. Le mode toutes les pages renvoie un ZIP limité à 20 pages.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Indiquez les pages. Une extraction est limitée à 50 pages.',
      'Téléchargez le PDF ou le ZIP.',
    ],
  },
  'pdf-to-jpg': {
    name: 'PDF en JPG',
    title: 'Convertir un PDF en JPG – gratuit, sans inscription',
    description: 'Rasteriser les pages d’un PDF en JPG, PNG ou WebP avec Ghostscript.',
    howTitle: 'Exporter les pages en images',
    intro: 'La résolution va de 72 à 300 DPI, 150 par défaut. Dix pages maximum par traitement.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Choisissez le format, la qualité et le DPI.',
      'Téléchargez les images.',
    ],
  },
  'image-to-pdf': {
    name: 'JPG en PDF',
    title: 'Convertir un JPG en PDF – gratuit, sans inscription',
    description: 'Assembler des JPG, PNG, WebP ou HEIC dans un PDF.',
    howTitle: 'Créer un PDF à partir d’images',
    intro: 'Jusqu’à 30 images, 15 Mo chacune et 120 Mo au total. Le format de page, l’orientation et les marges se règlent avant la création.',
    steps: [
      'Ajoutez et triez les images.',
      'Choisissez la page et l’ajustement.',
      'Téléchargez le PDF.',
    ],
  },
  'heic-to-jpg': {
    name: 'HEIC en JPG',
    title: 'Convertir HEIC en JPG – gratuit, sans inscription',
    description: 'Transformer une photo iPhone HEIC en JPG ouvrable sous Windows.',
    howTitle: 'Convertir une photo HEIC',
    intro: 'La conversion HEIC vers JPG se fait sur le serveur. Chaque fichier est limité à 25 Mo.',
    steps: [
      'Déposez le fichier HEIC.',
      'Lancez la conversion.',
      'Téléchargez le JPG.',
    ],
  },
};

const jpTools: Record<LocalizedToolSlug, LocalizedToolCopy> = {
  'compress-pdf': {
    name: 'PDFを圧縮',
    title: 'PDFを圧縮 – 無料、登録不要',
    description: 'ブラウザでPDFを小さくします。3段階。画像はGhostscript、文字はベクターのままです。',
    howTitle: 'PDFを小さくする',
    intro: 'Ghostscriptは文書内の画像だけをdownsampleします。ベクターの文字はそのままです。ほとんど縮まないファイルは、最適化済みとして拒否します。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '最小、推奨、高画質のいずれかを選ぶ。',
      '小さくなったPDFと削減率を確認してダウンロード。',
    ],
  },
  'merge-pdf': {
    name: 'PDFを結合',
    title: 'PDFを結合 – 無料、登録不要',
    description: '複数のPDFを指定した順序で1つにまとめます。',
    howTitle: '複数のPDFを1つにする',
    intro: 'ページは表示中の順序で結合されます。元のしおりは作り直しません。',
    steps: [
      '最大20ファイル、各50MB、合計100MB、1000ページまで追加。',
      '順序を並べ替える。',
      '1つのPDFをダウンロード。',
    ],
  },
  'split-pdf': {
    name: 'PDFを分割',
    title: 'PDFを分割 – 無料、登録不要',
    description: 'ページの抽出、またはPDFを複数ファイルに分けます。',
    howTitle: '必要なページだけ取り出す',
    intro: '範囲指定は新しいPDFになります。全ページモードはZIPで、20ページで打ち切ります。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      'ページを指定。抽出は50ページまで。',
      'PDFまたはZIPをダウンロード。',
    ],
  },
  'pdf-to-jpg': {
    name: 'PDFをJPGに',
    title: 'PDFをJPGに変換 – 無料、登録不要',
    description: 'GhostscriptでPDFの各ページをJPG、PNG、WebPにします。',
    howTitle: 'ページを画像にする',
    intro: '解像度は72から300DPI、初期値は150です。1回につき10ページまでです。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '形式、画質、DPIを選ぶ。',
      '画像をダウンロード。',
    ],
  },
  'image-to-pdf': {
    name: 'JPGをPDFに',
    title: 'JPGをPDFに変換 – 無料、登録不要',
    description: 'JPG、PNG、WebP、HEICを1つのPDFにまとめます。',
    howTitle: '画像からPDFを作る',
    intro: '画像は30枚まで、1枚15MB、合計120MBまでです。用紙、向き、余白は作成前に指定します。',
    steps: [
      '画像を追加して並べる。',
      '用紙とフィットを選ぶ。',
      'PDFをダウンロード。',
    ],
  },
  'heic-to-jpg': {
    name: 'HEICをJPGに',
    title: 'HEICをJPGに変換 – 無料、登録不要',
    description: 'iPhoneのHEIC写真を、Windowsで開けるJPGにします。',
    howTitle: 'HEIC写真を変換する',
    intro: 'HEICからJPGへの変換はサーバーで行います。1ファイル25MBまでです。',
    steps: [
      'HEICをアップロード。',
      '変換を開始。',
      'JPGをダウンロード。',
    ],
  },
};

const packs: Record<LocaleCode, LocalePack> = {
  de: {
    htmlLang: 'de',
    ogLocale: 'de_DE',
    hreflang: 'de-DE',
    limitNote: 'Passwortgeschützte PDFs müssen zuerst entsperrt werden. Die Dateien werden nur zur Verarbeitung gehalten und innerhalb von 60 Minuten gelöscht.',
    englishLabel: 'English',
    tools: deTools,
  },
  fr: {
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    hreflang: 'fr-FR',
    limitNote: 'Un PDF protégé par mot de passe doit d’abord être déverrouillé. Les fichiers ne sont gardés que le temps du traitement et sont effacés dans les 60 minutes.',
    englishLabel: 'English',
    tools: frTools,
  },
  jp: {
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    hreflang: 'ja-JP',
    limitNote: 'パスワード付きPDFは、先にロック解除が必要です。ファイルは処理中だけ保持し、60分以内に削除します。',
    englishLabel: 'English',
    tools: jpTools,
  },
};

export function isLocaleCode(value: string): value is LocaleCode {
  return value === 'de' || value === 'fr' || value === 'jp';
}

export function isLocalizedToolSlug(slug: string): slug is LocalizedToolSlug {
  return (LOCALIZED_TOOL_SLUGS as readonly string[]).includes(slug);
}

export function getLocalePack(locale: LocaleCode): LocalePack {
  return packs[locale];
}

export function getLocalizedTool(locale: LocaleCode, slug: string): LocalizedToolCopy | undefined {
  if (!isLocalizedToolSlug(slug)) return undefined;
  return packs[locale].tools[slug];
}

export function toolLanguageAlternates(slug: string): Record<string, string> | undefined {
  if (!isLocalizedToolSlug(slug)) return undefined;
  return {
    en: `/tools/${slug}`,
    'x-default': `/tools/${slug}`,
    'de-DE': `/de/tools/${slug}`,
    'fr-FR': `/fr/tools/${slug}`,
    'ja-JP': `/jp/tools/${slug}`,
  };
}

export function localizedSitemapEntries() {
  return (Object.keys(packs) as LocaleCode[]).flatMap((locale) =>
    LOCALIZED_TOOL_SLUGS.map((slug) => ({
      url: absoluteUrl(`/${locale}/tools/${slug}`),
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: 'weekly' as const,
      priority: 0.84,
    })),
  );
}
