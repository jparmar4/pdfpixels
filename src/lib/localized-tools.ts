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
export type LocaleCode = 'de' | 'fr' | 'jp' | 'es' | 'pt';

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

const esTools: Record<LocalizedToolSlug, LocalizedToolCopy> = {
  'compress-pdf': {
    name: 'Comprimir PDF',
    title: 'Comprimir PDF – gratis, sin registro',
    description: 'Reduce el tamaño de un PDF en el navegador. Tres niveles, Ghostscript para las imágenes, el texto vectorial se conserva.',
    howTitle: 'Reducir el tamaño de un PDF',
    intro: 'El compresor usa Ghostscript y reduce únicamente las imágenes del PDF. El texto vectorial queda nítido. Si el ahorro es demasiado pequeño se rechaza, para no presentar como éxito un documento que ya estaba optimizado.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Elige el archivo más pequeño, el nivel recomendado o alta calidad.',
      'Descarga el PDF y comprueba el porcentaje ahorrado.',
    ],
  },
  'merge-pdf': {
    name: 'Unir PDF',
    title: 'Unir PDF – gratis, sin registro',
    description: 'Combina varios PDF en un solo archivo, en el orden que tú elijas.',
    howTitle: 'Unir varios PDF en uno',
    intro: 'Las páginas se copian en el servidor en el orden que establezcas. Los marcadores de los archivos de origen no se reconstruyen.',
    steps: [
      'Añade hasta 20 PDF, de 50 MB cada uno, 100 MB y 1000 páginas en total.',
      'Define el orden arrastrando los archivos.',
      'Descarga un único PDF.',
    ],
  },
  'split-pdf': {
    name: 'Dividir PDF',
    title: 'Dividir PDF – gratis, sin registro',
    description: 'Extrae páginas o separa un PDF en varios archivos.',
    howTitle: 'Extraer páginas',
    intro: 'Un rango se guarda como un PDF nuevo. El modo de todas las páginas devuelve un ZIP y se detiene en 20 páginas.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Indica las páginas o un rango. Cada extracción admite hasta 50 páginas.',
      'Descarga el PDF o el ZIP.',
    ],
  },
  'pdf-to-jpg': {
    name: 'PDF a JPG',
    title: 'Convertir PDF a JPG – gratis, sin registro',
    description: 'Convierte las páginas de un PDF a JPG, PNG o WebP con Ghostscript.',
    howTitle: 'Guardar las páginas como imágenes',
    intro: 'Cada página se rasteriza. La resolución va de 72 a 300 DPI, con 150 por defecto. Máximo 10 páginas por procesamiento.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Elige formato, calidad y DPI.',
      'Descarga las imágenes.',
    ],
  },
  'image-to-pdf': {
    name: 'JPG a PDF',
    title: 'Convertir JPG a PDF – gratis, sin registro',
    description: 'Reúne imágenes JPG, PNG, WebP y HEIC en un solo PDF.',
    howTitle: 'Crear un PDF a partir de imágenes',
    intro: 'Hasta 30 imágenes, 15 MB cada una y 120 MB en total. El tamaño de página, la orientación y los márgenes se definen antes de crear el PDF.',
    steps: [
      'Añade las imágenes y ordénalas.',
      'Elige el tamaño de página y el ajuste.',
      'Descarga el PDF.',
    ],
  },
  'heic-to-jpg': {
    name: 'HEIC a JPG',
    title: 'Convertir HEIC a JPG – gratis, sin registro',
    description: 'Convierte fotos HEIC del iPhone a JPG, que se abre en cualquier Windows.',
    howTitle: 'Convertir fotos HEIC',
    intro: 'La conversión de HEIC a JPG se realiza en el servidor. Cada archivo puede pesar como máximo 25 MB.',
    steps: [
      'Sube el archivo HEIC.',
      'Inicia la conversión.',
      'Descarga el JPG.',
    ],
  },
};

const ptTools: Record<LocalizedToolSlug, LocalizedToolCopy> = {
  'compress-pdf': {
    name: 'Comprimir PDF',
    title: 'Comprimir PDF – grátis, sem cadastro',
    description: 'Reduza o tamanho de um PDF no navegador. Três níveis, Ghostscript para as imagens, texto vetorial preservado.',
    howTitle: 'Diminuir o tamanho do PDF',
    intro: 'O compressor usa Ghostscript e reduz apenas as imagens do PDF. O texto vetorial permanece nítido. Um ganho muito pequeno é recusado, para não apresentar como sucesso um documento que já estava otimizado.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Escolha menor arquivo, nível recomendado ou alta qualidade.',
      'Baixe o PDF e confira a porcentagem economizada.',
    ],
  },
  'merge-pdf': {
    name: 'Juntar PDF',
    title: 'Juntar PDF – grátis, sem cadastro',
    description: 'Combine vários PDFs em um único arquivo, na ordem que você escolher.',
    howTitle: 'Unir vários PDFs em um',
    intro: 'As páginas são copiadas no servidor na ordem definida por você. Os marcadores dos arquivos de origem não são reconstruídos.',
    steps: [
      'Adicione até 20 PDFs, de 50 MB cada, 100 MB e 1000 páginas no total.',
      'Defina a ordem arrastando os arquivos.',
      'Baixe um único PDF.',
    ],
  },
  'split-pdf': {
    name: 'Dividir PDF',
    title: 'Dividir PDF – grátis, sem cadastro',
    description: 'Extraia páginas ou separe um PDF em vários arquivos.',
    howTitle: 'Extrair páginas',
    intro: 'Um intervalo se torna um novo PDF. O modo de todas as páginas devolve um ZIP e para em 20 páginas.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Indique as páginas ou um intervalo. Cada extração aceita até 50 páginas.',
      'Baixe o PDF ou o ZIP.',
    ],
  },
  'pdf-to-jpg': {
    name: 'PDF em JPG',
    title: 'Converter PDF em JPG – grátis, sem cadastro',
    description: 'Converta as páginas de um PDF em JPG, PNG ou WebP com o Ghostscript.',
    howTitle: 'Salvar as páginas como imagens',
    intro: 'Cada página é rasterizada. A resolução vai de 72 a 300 DPI, com 150 como padrão. Máximo de 10 páginas por processamento.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Escolha formato, qualidade e DPI.',
      'Baixe as imagens.',
    ],
  },
  'image-to-pdf': {
    name: 'JPG em PDF',
    title: 'Converter JPG em PDF – grátis, sem cadastro',
    description: 'Reúna imagens JPG, PNG, WebP e HEIC em um único PDF.',
    howTitle: 'Criar um PDF a partir de imagens',
    intro: 'Até 30 imagens, 15 MB cada e 120 MB no total. O tamanho da página, a orientação e as margens são definidos antes de gerar o PDF.',
    steps: [
      'Adicione as imagens e organize a ordem.',
      'Escolha o tamanho da página e o ajuste.',
      'Baixe o PDF.',
    ],
  },
  'heic-to-jpg': {
    name: 'HEIC em JPG',
    title: 'Converter HEIC em JPG – grátis, sem cadastro',
    description: 'Converta fotos HEIC do iPhone em JPG, que abre em qualquer Windows.',
    howTitle: 'Converter fotos HEIC',
    intro: 'A conversão de HEIC para JPG acontece no servidor. Cada arquivo pode ter no máximo 25 MB.',
    steps: [
      'Envie o arquivo HEIC.',
      'Inicie a conversão.',
      'Baixe o JPG.',
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
  es: {
    htmlLang: 'es',
    ogLocale: 'es_ES',
    hreflang: 'es',
    limitNote: 'Los PDF protegidos con contraseña deben desbloquearse primero. Los archivos se conservan solo durante el procesamiento y se eliminan en un plazo de 60 minutos.',
    englishLabel: 'English',
    tools: esTools,
  },
  pt: {
    htmlLang: 'pt',
    ogLocale: 'pt_BR',
    hreflang: 'pt',
    limitNote: 'PDFs protegidos por senha precisam ser desbloqueados primeiro. Os arquivos ficam retidos apenas durante o processamento e são excluídos em até 60 minutos.',
    englishLabel: 'English',
    tools: ptTools,
  },
};

export function isLocaleCode(value: string): value is LocaleCode {
  return value === 'de' || value === 'fr' || value === 'jp' || value === 'es' || value === 'pt';
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
    es: `/es/tools/${slug}`,
    pt: `/pt/tools/${slug}`,
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
