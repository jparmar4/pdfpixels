import { absoluteUrl, SITE_CONTENT_UPDATED, ADSENSE_REVIEW_MODE } from '@/lib/seo';

export const LOCALIZED_TOOL_SLUGS = [
  'compress-pdf',
  'merge-pdf',
  'split-pdf',
  'pdf-to-jpg',
  'image-to-pdf',
  'heic-to-jpg',
  'ocr-pdf',
  'split-pdf-by-size',
  'compress-pdf-to-50kb',
  'compress-image',
  'resize-image',
  'pdf-to-word',
  'remove-image-background',
  'passport-size-photo',
  'pdf-to-excel',
  'sign-pdf',
  'unlock-pdf',
  'protect-pdf',
] as const;

export type LocalizedToolSlug = (typeof LOCALIZED_TOOL_SLUGS)[number];
export type LocaleCode = 'de' | 'fr' | 'jp' | 'es' | 'pt';

export const LOCALIZED_LOCALES: LocaleCode[] = ['de', 'fr', 'jp', 'es', 'pt'];

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
  'ocr-pdf': {
    name: 'PDF-OCR (Texterkennung)',
    title: 'PDF-OCR – Text aus Scans erkennen, kostenlos',
    description: 'Text aus gescannten PDFs per Texterkennung auslesen und als durchsuchbaren Text speichern.',
    howTitle: 'Text aus Scans erkennen',
    intro: 'Jede Seite wird hochauflösend gerastert und per OCR ausgewertet. Enthält das PDF bereits echten Text, wird dieser direkt extrahiert. Pro Durchlauf werden höchstens 10 Seiten erkannt.',
    steps: [
      'Gescanntes PDF hochladen (höchstens 50 MB).',
      'Die Texterkennung starten.',
      'Text kopieren oder als TXT herunterladen.',
    ],
  },
  'split-pdf-by-size': {
    name: 'PDF nach Größe teilen',
    title: 'PDF nach Dateigröße teilen – kostenlos, ohne Anmeldung',
    description: 'Ein großes PDF in Teile unter einem frei wählbaren Größenlimit aufteilen – ideal für E-Mail-Anhänge.',
    howTitle: 'In Teile unter dem Größenlimit aufteilen',
    intro: 'Seiten werden der Reihe nach in ein Teildokument kopiert und die tatsächliche Dateigröße gemessen. Kurz vor dem Limit beginnt ein neuer Teil. Es entstehen höchstens 100 Teile mit je 300 Seiten.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Limit wählen, z. B. 25 MB für Gmail.',
      'ZIP mit den Teilen herunterladen.',
    ],
  },
  'compress-pdf-to-50kb': {
    name: 'PDF auf 50 KB komprimieren',
    title: 'PDF auf 50 KB komprimieren – kostenlos, ohne Anmeldung',
    description: 'PDFs für strenge Portal-Limits auf 50 KB verkleinern, mit ehrlichem Ergebnis.',
    howTitle: 'Auf 50 KB verkleinern',
    intro: 'Das Extrem-Profil reduziert Bilder und Streams so weit wie möglich auf das 50-KB-Ziel. Vektortext bleibt scharf. Erreicht die Datei das Ziel nicht, sagt das Tool das ehrlich.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Das extreme Profil auf 50 KB anwenden.',
      'Ergebnis prüfen und herunterladen.',
    ],
  },
  'compress-image': {
    name: 'Bild komprimieren',
    title: 'Bild komprimieren – kostenlos, ohne Anmeldung',
    description: 'JPG-, PNG- und WebP-Bilder verkleinern, wahlweise auf eine Zielgröße in KB.',
    howTitle: 'Bilddatei verkleinern',
    intro: 'Bilder bis 25 MB werden serverseitig neu kodiert. Qualität frei wählen oder eine Zielgröße in KB vorgeben – Metadaten und Farbprofil bleiben erhalten.',
    steps: [
      'Bild hochladen (höchstens 25 MB).',
      'Qualität oder Zielgröße in KB wählen.',
      'Optimiertes Bild herunterladen.',
    ],
  },
  'resize-image': {
    name: 'Bildgröße ändern',
    title: 'Bildgröße ändern – kostenlos, ohne Anmeldung',
    description: 'Bilder auf exakte Pixel, cm, mm oder Zoll skalieren – mit Presets für Social Media und Dokumente.',
    howTitle: 'Bild skalieren',
    intro: 'Breite und Höhe in Pixel, cm, mm oder Zoll vorgeben. Das Seitenverhältnis lässt sich sperren, die Ausgabe erfolgt als JPG, PNG oder WebP.',
    steps: [
      'Bild hochladen (höchstens 25 MB).',
      'Maße und Einheit wählen.',
      'Bild in neuer Größe herunterladen.',
    ],
  },
  'pdf-to-word': {
    name: 'PDF in Word',
    title: 'PDF in Word umwandeln – kostenlos, ohne Anmeldung',
    description: 'PDF-Dateien in bearbeitbare Word-Dokumente (.docx) mit Absätzen und Layout umwandeln.',
    howTitle: 'PDF als Word weiterbearbeiten',
    intro: 'Text und Tabellen werden serverseitig in ein .docx-Dokument übertragen, bis zu 50 MB pro Datei. Komplexe Layouts und Scans ohne Textebene lassen sich nur begrenzt übernehmen.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Die Umwandlung starten.',
      'Word-Datei herunterladen und prüfen.',
    ],
  },
  'remove-image-background': {
    name: 'Hintergrund entfernen',
    title: 'Bildhintergrund entfernen – kostenlos, KI-gestützt',
    description: 'Per KI den Hintergrund entfernen und als transparentes PNG laden.',
    howTitle: 'Hintergrund per KI entfernen',
    intro: 'Die KI erkennt Motiv und Hintergrund und schneidet automatisch frei. Bis 20 MB pro Bild, Ausgabe als PNG mit Transparenz.',
    steps: [
      'Bild hochladen (höchstens 20 MB).',
      'Die KI-Freistellung starten.',
      'Transparentes PNG herunterladen.',
    ],
  },
  'passport-size-photo': {
    name: 'Passfoto erstellen',
    title: 'Passfoto online erstellen – kostenlos, ohne Anmeldung',
    description: 'Pass- und ID-Fotos für viele Länder: Porträt auf offizielle Maße zuschneiden.',
    howTitle: 'Passfoto nach Maß',
    intro: 'Das Porträt zuschneiden und auf gängige Formate wie 35×45 mm oder 2×2 Zoll bringen. Bis 25 MB pro Bild, Ausgabe als JPG oder PNG.',
    steps: [
      'Porträt hochladen (höchstens 25 MB).',
      'Land und Format wählen.',
      'Passfoto herunterladen.',
    ],
  },
  'pdf-to-excel': {
    name: 'PDF in Excel',
    title: 'PDF in Excel umwandeln – kostenlos, ohne Anmeldung',
    description: 'Tabellen aus PDF-Dateien in Excel (.xlsx) und CSV übertragen.',
    howTitle: 'PDF-Tabellen übernehmen',
    intro: 'Zeilen und Spalten werden serverseitig in eine Tabellenkalkulation übertragen, bis 50 MB pro Datei. Ideal für Rechnungen und Kontoauszüge.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Die Tabellen-Erkennung starten.',
      'Excel- oder CSV-Datei herunterladen.',
    ],
  },
  'sign-pdf': {
    name: 'PDF signieren',
    title: 'PDF online signieren – kostenlos, ohne Anmeldung',
    description: 'PDFs per Zeichnung, Schrift oder Bild unterschreiben.',
    howTitle: 'PDF unterschreiben',
    intro: 'Unterschrift zeichnen, tippen oder als Bild hochladen und auf der Seite platzieren. Bis 50 MB pro Datei.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Unterschrift erstellen und platzieren.',
      'Signiertes PDF herunterladen.',
    ],
  },
  'unlock-pdf': {
    name: 'PDF entsperren',
    title: 'PDF entsperren – kostenlos, ohne Anmeldung',
    description: 'Bekanntes Passwort entfernen und direkt weiterarbeiten.',
    howTitle: 'PDF vom Passwort befreien',
    intro: 'Das bekannte Passwort wird serverseitig entfernt, bis 50 MB pro Datei. Danach lassen sich Komprimieren, Zusammenführen oder OCR direkt anschließen.',
    steps: [
      'Geschütztes PDF hochladen (höchstens 50 MB).',
      'Bekanntes Passwort eingeben.',
      'Entsperrtes PDF herunterladen.',
    ],
  },
  'protect-pdf': {
    name: 'PDF schützen',
    title: 'PDF mit Passwort schützen – kostenlos, ohne Anmeldung',
    description: 'PDFs per AES-Verschlüsselung vor unbefugtem Zugriff schützen.',
    howTitle: 'PDF per Passwort sichern',
    intro: 'Ein Passwort sichert das Dokument per AES-Verschlüsselung, bis 50 MB pro Datei. Lesbar in allen gängigen Viewern.',
    steps: [
      'PDF hochladen (höchstens 50 MB).',
      'Sicheres Passwort vergeben.',
      'Geschütztes PDF herunterladen.',
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
  'ocr-pdf': {
    name: 'OCR PDF',
    title: 'OCR PDF – gratis, sin registro',
    description: 'Reconoce el texto de PDFs escaneados mediante OCR y recíbelo como texto seleccionable.',
    howTitle: 'Reconocer texto de páginas escaneadas',
    intro: 'Cada página se rasteriza en alta resolución y se procesa con OCR. Si el PDF ya contiene una capa de texto real, se extrae directamente. Máximo 10 páginas por procesamiento.',
    steps: [
      'Sube un PDF escaneado (máximo 50 MB).',
      'Inicia el reconocimiento.',
      'Copia el texto o descárgalo en TXT.',
    ],
  },
  'split-pdf-by-size': {
    name: 'Dividir PDF por tamaño',
    title: 'Dividir PDF por tamaño – gratis, sin registro',
    description: 'Divide un PDF grande en partes bajo un límite que elijas, pensado para los límites de los adjuntos de correo.',
    howTitle: 'Dividir bajo el límite de tamaño',
    intro: 'Las páginas se copian una a una y se mide el tamaño real del archivo tras cada una. Una nueva parte comienza justo antes de superar el límite. Máximo 100 partes de 300 páginas.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Elige un límite, por ejemplo 25 MB para Gmail.',
      'Descarga el ZIP con las partes.',
    ],
  },
  'compress-pdf-to-50kb': {
    name: 'Comprimir PDF a 50KB',
    title: 'Comprimir PDF a 50KB – gratis, sin registro',
    description: 'Reduce PDFs a 50KB para portales con límites estrictos, con resultados honestos.',
    howTitle: 'Reducir a 50KB',
    intro: 'El perfil extremo reduce imágenes y flujos al máximo hacia el objetivo de 50KB. El texto vectorial queda nítido. Si el objetivo no se alcanza, la herramienta lo indica con claridad.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Aplica el perfil extremo hacia 50KB.',
      'Revisa el resultado y descárgalo.',
    ],
  },
  'compress-image': {
    name: 'Comprimir imagen',
    title: 'Comprimir imagen – gratis, sin registro',
    description: 'Reduce JPG, PNG y WebP, con calidad ajustable o tamaño objetivo en KB.',
    howTitle: 'Reducir el peso de una imagen',
    intro: 'Las imágenes de hasta 25 MB se recodifican en el servidor. Elige la calidad o un tamaño objetivo en KB; los metadatos y el perfil de color se conservan.',
    steps: [
      'Sube una imagen (máximo 25 MB).',
      'Elige la calidad o el tamaño objetivo en KB.',
      'Descarga la imagen optimizada.',
    ],
  },
  'resize-image': {
    name: 'Cambiar tamaño de imagen',
    title: 'Cambiar tamaño de imagen – gratis, sin registro',
    description: 'Escala imágenes a píxeles, cm, mm o pulgadas exactos, con ajustes para redes sociales y documentos.',
    howTitle: 'Escalar una imagen',
    intro: 'Indica el ancho y el alto en píxeles, cm, mm o pulgadas. Puedes bloquear la proporción y exportar en JPG, PNG o WebP.',
    steps: [
      'Sube una imagen (máximo 25 MB).',
      'Elige las medidas y la unidad.',
      'Descarga la imagen con el nuevo tamaño.',
    ],
  },
  'pdf-to-word': {
    name: 'PDF a Word',
    title: 'Convertir PDF a Word – gratis, sin registro',
    description: 'Convierte PDF en documentos Word (.docx) editables, con párrafos y formato.',
    howTitle: 'Editar un PDF en Word',
    intro: 'El texto y las tablas se transfieren en el servidor a un .docx. Archivos de hasta 50 MB. Los diseños complejos y los escaneos sin capa de texto solo se recuperan de forma parcial.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Inicia la conversión.',
      'Descarga el Word y revísalo.',
    ],
  },
  'remove-image-background': {
    name: 'Quitar fondo',
    title: 'Quitar el fondo de una imagen – gratis, con IA',
    description: 'La IA recorta el fondo y entrega un PNG transparente.',
    howTitle: 'Recortar el fondo con IA',
    intro: 'La IA separa el sujeto del fondo automáticamente. Hasta 20 MB por imagen, salida en PNG con transparencia.',
    steps: [
      'Sube una imagen (máximo 20 MB).',
      'Inicia el recorte con IA.',
      'Descarga el PNG transparente.',
    ],
  },
  'passport-size-photo': {
    name: 'Foto carnet',
    title: 'Foto carnet online – gratis, sin registro',
    description: 'Fotos de pasaporte e identificación de varios países, recortadas a medidas oficiales.',
    howTitle: 'Foto a la medida oficial',
    intro: 'Recorta el retrato a formatos habituales como 35×45 mm o 2×2 pulgadas. Hasta 25 MB por imagen, salida en JPG o PNG.',
    steps: [
      'Sube un retrato (máximo 25 MB).',
      'Elige el país y el formato.',
      'Descarga la foto.',
    ],
  },
  'pdf-to-excel': {
    name: 'PDF a Excel',
    title: 'Convertir PDF a Excel – gratis, sin registro',
    description: 'Pasa tablas de un PDF a Excel (.xlsx) y CSV.',
    howTitle: 'Aprovechar las tablas del PDF',
    intro: 'Filas y columnas se transfieren en el servidor a una hoja de cálculo. Archivos de hasta 50 MB. Ideal para facturas y extractos.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Inicia la detección de tablas.',
      'Descarga el Excel o el CSV.',
    ],
  },
  'sign-pdf': {
    name: 'Firmar PDF',
    title: 'Firmar PDF online – gratis, sin registro',
    description: 'Firma PDFs dibujando, escribiendo o subiendo tu firma.',
    howTitle: 'Firmar un PDF',
    intro: 'Dibuja tu firma, escríbela o súbela como imagen y colócala en la página. Archivos de hasta 50 MB.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Crea tu firma y colócala.',
      'Descarga el PDF firmado.',
    ],
  },
  'unlock-pdf': {
    name: 'Desbloquear PDF',
    title: 'Desbloquear PDF – gratis, sin registro',
    description: 'Elimina una contraseña conocida y sigue trabajando.',
    howTitle: 'Liberar un PDF de su contraseña',
    intro: 'La contraseña conocida se elimina en el servidor. Archivos de hasta 50 MB. Después puedes comprimir, unir o aplicar OCR directamente.',
    steps: [
      'Sube el PDF protegido (máximo 50 MB).',
      'Introduce la contraseña conocida.',
      'Descarga el PDF desbloqueado.',
    ],
  },
  'protect-pdf': {
    name: 'Proteger PDF',
    title: 'Proteger PDF con contraseña – gratis, sin registro',
    description: 'Protege tus PDF con cifrado AES frente a accesos no deseados.',
    howTitle: 'Asegurar un PDF con contraseña',
    intro: 'Una contraseña protege el documento con cifrado AES. Archivos de hasta 50 MB. Se abre en los visores habituales.',
    steps: [
      'Sube un PDF (máximo 50 MB).',
      'Define una contraseña segura.',
      'Descarga el PDF protegido.',
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
  'ocr-pdf': {
    name: 'OCR de PDF',
    title: 'OCR de PDF – grátis, sem cadastro',
    description: 'Reconheça o texto de PDFs escaneados com OCR e receba-o como texto selecionável.',
    howTitle: 'Reconhecer texto de páginas escaneadas',
    intro: 'Cada página é renderizada em alta resolução e processada com OCR. Se o PDF já contiver uma camada de texto real, ela é extraída diretamente. Máximo de 10 páginas por processamento.',
    steps: [
      'Envie um PDF escaneado (máximo de 50 MB).',
      'Inicie o reconhecimento.',
      'Copie o texto ou baixe em TXT.',
    ],
  },
  'split-pdf-by-size': {
    name: 'Dividir PDF por tamanho',
    title: 'Dividir PDF por tamanho – grátis, sem cadastro',
    description: 'Divida um PDF grande em partes dentro de um limite que você escolher — ideal para anexos de e-mail.',
    howTitle: 'Dividir pelo limite de tamanho',
    intro: 'As páginas são copiadas uma a uma e o tamanho real do arquivo é medido após cada uma. Uma nova parte começa logo antes de estourar o limite. Máximo de 100 partes de 300 páginas.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Escolha um limite, por exemplo 25 MB para o Gmail.',
      'Baixe o ZIP com as partes.',
    ],
  },
  'compress-pdf-to-50kb': {
    name: 'Comprimir PDF para 50KB',
    title: 'Comprimir PDF para 50KB – grátis, sem cadastro',
    description: 'Reduza PDFs para 50KB em portais com limites rigorosos, com resultado honesto.',
    howTitle: 'Reduzir para 50KB',
    intro: 'O perfil extremo reduz imagens e fluxos ao máximo rumo à meta de 50KB. O texto vetorial permanece nítido. Se a meta for inalcançável, a ferramenta avisa com clareza.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Aplique o perfil extremo para 50KB.',
      'Confira o resultado e baixe.',
    ],
  },
  'compress-image': {
    name: 'Comprimir imagem',
    title: 'Comprimir imagem – grátis, sem cadastro',
    description: 'Reduza JPG, PNG e WebP, com qualidade ajustável ou tamanho-alvo em KB.',
    howTitle: 'Diminuir o peso da imagem',
    intro: 'Imagens de até 25 MB são recodificadas no servidor. Escolha a qualidade ou um tamanho-alvo em KB; metadados e perfil de cor são preservados.',
    steps: [
      'Envie uma imagem (máximo de 25 MB).',
      'Escolha a qualidade ou o tamanho-alvo em KB.',
      'Baixe a imagem otimizada.',
    ],
  },
  'resize-image': {
    name: 'Redimensionar imagem',
    title: 'Redimensionar imagem – grátis, sem cadastro',
    description: 'Ajuste imagens para pixels, cm, mm ou polegadas exatos, com predefinições para redes sociais e documentos.',
    howTitle: 'Ajustar o tamanho da imagem',
    intro: 'Informe largura e altura em pixels, cm, mm ou polegadas. É possível travar a proporção e exportar em JPG, PNG ou WebP.',
    steps: [
      'Envie uma imagem (máximo de 25 MB).',
      'Escolha as medidas e a unidade.',
      'Baixe a imagem no novo tamanho.',
    ],
  },
  'pdf-to-word': {
    name: 'PDF em Word',
    title: 'Converter PDF em Word – grátis, sem cadastro',
    description: 'Converta PDFs em documentos Word (.docx) editáveis, com parágrafos e formatação.',
    howTitle: 'Editar um PDF no Word',
    intro: 'Texto e tabelas são transferidos no servidor para um .docx. Arquivos de até 50 MB. Layouts complexos e digitalizações sem camada de texto têm recuperação parcial.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Inicie a conversão.',
      'Baixe o Word e confira.',
    ],
  },
  'remove-image-background': {
    name: 'Remover fundo',
    title: 'Remover fundo de imagem – grátis, com IA',
    description: 'A IA recorta o fundo e entrega um PNG transparente.',
    howTitle: 'Recortar o fundo com IA',
    intro: 'A IA separa o assunto do fundo automaticamente. Até 20 MB por imagem, saída em PNG com transparência.',
    steps: [
      'Envie uma imagem (máximo de 20 MB).',
      'Inicie o recorte com IA.',
      'Baixe o PNG transparente.',
    ],
  },
  'passport-size-photo': {
    name: 'Foto 3x4',
    title: 'Foto 3x4 e passaporte online – grátis, sem cadastro',
    description: 'Fotos de passaporte e documentos de vários países, cortadas em medidas oficiais.',
    howTitle: 'Foto na medida oficial',
    intro: 'Corte o retrato em formatos comuns como 3x4, 35×45 mm ou 2x2 polegadas. Até 25 MB por imagem, saída em JPG ou PNG.',
    steps: [
      'Envie um retrato (máximo de 25 MB).',
      'Escolha o país e o formato.',
      'Baixe a foto.',
    ],
  },
  'pdf-to-excel': {
    name: 'PDF em Excel',
    title: 'Converter PDF em Excel – grátis, sem cadastro',
    description: 'Transfira tabelas do PDF para Excel (.xlsx) e CSV.',
    howTitle: 'Aproveitar as tabelas do PDF',
    intro: 'Linhas e colunas são transferidas no servidor para uma planilha. Arquivos de até 50 MB. Ideal para faturas e extratos.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Inicie a detecção de tabelas.',
      'Baixe o Excel ou o CSV.',
    ],
  },
  'sign-pdf': {
    name: 'Assinar PDF',
    title: 'Assinar PDF online – grátis, sem cadastro',
    description: 'Assine PDFs desenhando, digitando ou enviando sua assinatura.',
    howTitle: 'Assinar um PDF',
    intro: 'Desenhe sua assinatura, digite-a ou envie-a como imagem e posicione-a na página. Arquivos de até 50 MB.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Crie sua assinatura e posicione-a.',
      'Baixe o PDF assinado.',
    ],
  },
  'unlock-pdf': {
    name: 'Desbloquear PDF',
    title: 'Desbloquear PDF – grátis, sem cadastro',
    description: 'Remova uma senha conhecida e continue trabalhando.',
    howTitle: 'Liberar um PDF da senha',
    intro: 'A senha conhecida é removida no servidor. Arquivos de até 50 MB. Depois dá para comprimir, juntar ou aplicar OCR direto.',
    steps: [
      'Envie o PDF protegido (máximo de 50 MB).',
      'Digite a senha conhecida.',
      'Baixe o PDF desbloqueado.',
    ],
  },
  'protect-pdf': {
    name: 'Proteger PDF',
    title: 'Proteger PDF com senha – grátis, sem cadastro',
    description: 'Proteja seus PDFs com criptografia AES contra acessos.',
    howTitle: 'Segurar um PDF com senha',
    intro: 'Uma senha protege o documento com criptografia AES. Arquivos de até 50 MB. Abre nos visualizadores habituais.',
    steps: [
      'Envie um PDF (máximo de 50 MB).',
      'Defina uma senha segura.',
      'Baixe o PDF protegido.',
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
    description: 'Convertir les photos HEIC de l’iPhone en JPG, lisible sous Windows.',
    howTitle: 'Convertir les photos HEIC',
    intro: 'La conversion HEIC vers JPG se fait sur le serveur. Chaque fichier est limité à 25 Mo.',
    steps: [
      'Déposez un fichier HEIC.',
      'Lancez la conversion.',
      'Téléchargez le JPG.',
    ],
  },
  'ocr-pdf': {
    name: 'OCR PDF',
    title: 'OCR PDF – reconnaître le texte des scans, gratuitement',
    description: 'Extraire le texte des PDF scannés grâce à la reconnaissance optique de caractères.',
    howTitle: 'Reconnaître le texte des pages scannées',
    intro: 'Chaque page est rasterisée en haute résolution puis analysée par OCR. Si le PDF contient déjà une couche de texte réelle, elle est extraite directement. Maximum 10 pages par traitement.',
    steps: [
      'Déposez un PDF scanné (50 Mo maximum).',
      'Lancez la reconnaissance.',
      'Copiez le texte ou téléchargez-le en TXT.',
    ],
  },
  'split-pdf-by-size': {
    name: 'Diviser un PDF par taille',
    title: 'Diviser un PDF par taille – gratuit, sans inscription',
    description: 'Découper un PDF volumineux en parties sous une limite choisie, pour les envois par e-mail.',
    howTitle: 'Découper sous la limite de taille',
    intro: 'Les pages sont copiées une à une et la taille réelle du fichier est mesurée après chaque page. Une nouvelle partie commence juste avant le dépassement. Maximum 100 parties de 300 pages.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Choisissez une limite, par exemple 25 Mo pour Gmail.',
      'Téléchargez le ZIP des parties.',
    ],
  },
  'compress-pdf-to-50kb': {
    name: 'Compresser un PDF à 50 Ko',
    title: 'Compresser un PDF à 50 Ko – gratuit, sans inscription',
    description: 'Réduire un PDF sous 50 Ko pour les portails les plus stricts, avec un résultat honnête.',
    howTitle: 'Réduire à 50 Ko',
    intro: 'Le profil extrême réduit au maximum images et flux vers l’objectif de 50 Ko. Le texte vectoriel reste net. Si la cible est inatteignable, l’outil le dit franchement.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Appliquez le profil extrême vers 50 Ko.',
      'Vérifiez le résultat puis téléchargez.',
    ],
  },
  'compress-image': {
    name: 'Compresser une image',
    title: 'Compresser une image – gratuit, sans inscription',
    description: 'Réduire les JPG, PNG et WebP, qualité réglable ou taille cible en Ko.',
    howTitle: 'Alléger une image',
    intro: 'Les images jusqu’à 25 Mo sont réencodées côté serveur. Choisissez la qualité ou une taille cible en Ko ; métadonnées et profil colorimétrique sont conservés.',
    steps: [
      'Déposez une image (25 Mo maximum).',
      'Choisissez la qualité ou la taille cible en Ko.',
      'Téléchargez l’image optimisée.',
    ],
  },
  'resize-image': {
    name: 'Redimensionner une image',
    title: 'Redimensionner une image – gratuit, sans inscription',
    description: 'Mettre une image aux dimensions exactes en pixels, cm, mm ou pouces, avec des préréglages réseaux sociaux et documents.',
    howTitle: 'Mettre une image à l’échelle',
    intro: 'Indiquez largeur et hauteur en pixels, cm, mm ou pouces. Le rapport peut être verrouillé, export en JPG, PNG ou WebP.',
    steps: [
      'Déposez une image (25 Mo maximum).',
      'Choisissez les mesures et l’unité.',
      'Téléchargez l’image redimensionnée.',
    ],
  },
  'pdf-to-word': {
    name: 'PDF en Word',
    title: 'Convertir un PDF en Word – gratuit, sans inscription',
    description: 'Convertir un PDF en document Word (.docx) modifiable, paragraphes et mise en forme conservés.',
    howTitle: 'Retravailler un PDF dans Word',
    intro: 'Le texte et les tableaux sont transférés côté serveur vers un .docx. Fichiers jusqu’à 50 Mo. Les mises en page complexes et les scans sans couche texte ne sont repris que partiellement.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Lancez la conversion.',
      'Téléchargez le Word et relisez-le.',
    ],
  },
  'remove-image-background': {
    name: 'Supprimer le fond',
    title: 'Supprimer le fond d’une image – gratuit, avec IA',
    description: 'L’IA détour le sujet et fournit un PNG transparent.',
    howTitle: 'Détourer avec l’IA',
    intro: 'L’IA sépare le sujet du fond automatiquement. Jusqu’à 20 Mo par image, sortie en PNG transparent.',
    steps: [
      'Déposez une image (20 Mo maximum).',
      'Lancez le détourage IA.',
      'Téléchargez le PNG transparent.',
    ],
  },
  'passport-size-photo': {
    name: 'Photo d’identité',
    title: 'Photo d’identité en ligne – gratuit, sans inscription',
    description: 'Photos de passeport et d’identité de plusieurs pays, recadrées aux formats officiels.',
    howTitle: 'Photo au format officiel',
    intro: 'Recadrez le portrait aux formats courants comme 35×45 mm ou 5×5 cm. Jusqu’à 25 Mo par image, sortie en JPG ou PNG.',
    steps: [
      'Déposez un portrait (25 Mo maximum).',
      'Choisissez le pays et le format.',
      'Téléchargez la photo.',
    ],
  },
  'pdf-to-excel': {
    name: 'PDF en Excel',
    title: 'Convertir un PDF en Excel – gratuit, sans inscription',
    description: 'Transférer les tableaux d’un PDF vers Excel (.xlsx) et CSV.',
    howTitle: 'Récupérer les tableaux du PDF',
    intro: 'Lignes et colonnes transférées côté serveur vers un tableur. Fichiers jusqu’à 50 Mo. Idéal pour factures et relevés.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Lancez la détection des tableaux.',
      'Téléchargez l’Excel ou le CSV.',
    ],
  },
  'sign-pdf': {
    name: 'Signer un PDF',
    title: 'Signer un PDF en ligne – gratuit, sans inscription',
    description: 'Signez vos PDF en dessinant, tapant ou important votre signature.',
    howTitle: 'Signer un PDF',
    intro: 'Dessinez votre signature, tapez-la ou importez-la en image, puis placez-la sur la page. Fichiers jusqu’à 50 Mo.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Créez votre signature et placez-la.',
      'Téléchargez le PDF signé.',
    ],
  },
  'unlock-pdf': {
    name: 'Déverrouiller un PDF',
    title: 'Déverrouiller un PDF – gratuit, sans inscription',
    description: 'Supprimer un mot de passe connu et continuer à travailler.',
    howTitle: 'Libérer un PDF de son mot de passe',
    intro: 'Le mot de passe connu est retiré côté serveur. Fichiers jusqu’à 50 Mo. Ensuite, compressez, fusionnez ou lancez l’OCR directement.',
    steps: [
      'Déposez le PDF protégé (50 Mo maximum).',
      'Saisissez le mot de passe connu.',
      'Téléchargez le PDF déverrouillé.',
    ],
  },
  'protect-pdf': {
    name: 'Protéger un PDF',
    title: 'Protéger un PDF par mot de passe – gratuit, sans inscription',
    description: 'Protéger vos PDF par chiffrement AES contre les accès.',
    howTitle: 'Sécuriser un PDF par mot de passe',
    intro: 'Un mot de passe protège le document par chiffrement AES. Fichiers jusqu’à 50 Mo. Lisible dans les visionneuses courantes.',
    steps: [
      'Déposez un PDF (50 Mo maximum).',
      'Définissez un mot de passe sûr.',
      'Téléchargez le PDF protégé.',
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
  'ocr-pdf': {
    name: 'PDFをOCR',
    title: 'PDFをOCR – 無料、登録不要',
    description: 'スキャンしたPDFからOCRで文字を認識し、検索・コピーできるテキストにします。',
    howTitle: 'スキャンページの文字を認識',
    intro: '各ページを高解像度でレンダリングし、OCRで認識します。すでにテキスト層があるPDFはそのまま抽出します。1回につき10ページまでです。',
    steps: [
      'スキャンしたPDFをアップロード（最大50MB）。',
      '認識を開始する。',
      'テキストをコピー、またはTXTでダウンロード。',
    ],
  },
  'split-pdf-by-size': {
    name: 'サイズでPDFを分割',
    title: 'サイズでPDFを分割 – 無料、登録不要',
    description: '大きなPDFを指定サイズ以下のパートに分割します。メール添付の容量制限対策に。',
    howTitle: 'サイズ制限ごとに分割',
    intro: 'ページを順にコピーし、保存後の実際のサイズを測定します。制限を超える直前で新しいパートに切り替えます。パートは最大100、各300ページまでです。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '制限サイズを選ぶ（Gmailは25MBなど）。',
      'パート入りのZIPをダウンロード。',
    ],
  },
  'compress-pdf-to-50kb': {
    name: 'PDFを50KBに圧縮',
    title: 'PDFを50KBに圧縮 – 無料、登録不要',
    description: '厳しいサイズ制限向けにPDFを50KBまで圧縮します。結果は正直に表示します。',
    howTitle: '50KBまで圧縮',
    intro: '最強プリセットが画像とストリームを50KB目標まで最大限に削減します。ベクトルテキストは鮮明なまま。目標に届かない場合は、その旨をはっきり伝えます。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '50KB向けの最強プリセットを実行。',
      '結果を確認してダウンロード。',
    ],
  },
  'compress-image': {
    name: '画像を圧縮',
    title: '画像を圧縮 – 無料、登録不要',
    description: 'JPG・PNG・WebPを軽量化。画質指定またはKB単位の目標サイズに対応。',
    howTitle: '画像を軽くする',
    intro: '25MBまでの画像をサーバーで再エンコードします。画質を選ぶか、KB単位の目標サイズを指定できます。',
    steps: [
      '画像をアップロード（最大25MB）。',
      '画質または目標サイズ（KB）を選ぶ。',
      '軽くなった画像をダウンロード。',
    ],
  },
  'resize-image': {
    name: '画像をリサイズ',
    title: '画像をリサイズ – 無料、登録不要',
    description: 'ピクセル・cm・mm・インチで正確なサイズに変更。SNSや書類向けプリセット付き。',
    howTitle: '画像サイズを変更する',
    intro: '幅と高さをピクセル・cm・mm・インチで指定します。縦横比の固定やJPG・PNG・WebP出力に対応しています。',
    steps: [
      '画像をアップロード（最大25MB）。',
      '寸法と単位を選ぶ。',
      '新しいサイズの画像をダウンロード。',
    ],
  },
  'pdf-to-word': {
    name: 'PDFをWordに',
    title: 'PDFをWordに変換 – 無料、登録不要',
    description: 'PDFを編集可能なWord（.docx）に変換し、段落とレイアウトを引き継ぎます。',
    howTitle: 'PDFをWordで編集する',
    intro: 'テキストと表をサーバーで.docxに変換します。1ファイル50MBまで。複雑なレイアウトやテキスト層のないスキャンは一部のみ復元されます。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '変換を開始する。',
      'Wordをダウンロードして確認。',
    ],
  },
  'remove-image-background': {
    name: '背景を除去',
    title: '画像の背景を除去 – 無料、AI搭載',
    description: 'AIが背景を切り抜き、透過PNGで保存します。',
    howTitle: 'AIで背景を切り抜く',
    intro: 'AIが被写体と背景を自動で分離します。1枚20MBまで。透過PNGで出力します。',
    steps: [
      '画像をアップロード（最大20MB）。',
      'AI切り抜きを開始。',
      '透過PNGをダウンロード。',
    ],
  },
  'passport-size-photo': {
    name: '証明写真を作成',
    title: '証明写真をオンラインで作成 – 無料、登録不要',
    description: '各国のパスポート・ID用写真を公式サイズに切り抜きます。',
    howTitle: '公式サイズで作成',
    intro: '35×45mmや2×2インチなど、よく使うサイズに対応。1枚25MBまで。JPG・PNGで出力します。',
    steps: [
      '顔写真をアップロード（最大25MB）。',
      '国とサイズを選ぶ。',
      '証明写真をダウンロード。',
    ],
  },
  'pdf-to-excel': {
    name: 'PDFをExcelに',
    title: 'PDFをExcelに変換 – 無料、登録不要',
    description: 'PDFの表をExcel（.xlsx）やCSVに移します。',
    howTitle: 'PDFの表を取り込む',
    intro: '行と列をサーバーで表計算に変換します。1ファイル50MBまで。請求書や明細書に最適です。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '表検出を開始。',
      'Excel・CSVをダウンロード。',
    ],
  },
  'sign-pdf': {
    name: 'PDFに署名',
    title: 'PDFにオンラインで署名 – 無料、登録不要',
    description: '手書き・入力・画像でPDFに署名します。',
    howTitle: 'PDFに署名する',
    intro: '署名を描く・入力する・画像で読み込み、ページに配置します。1ファイル50MBまで。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '署名を作って配置。',
      '署名済みPDFをダウンロード。',
    ],
  },
  'unlock-pdf': {
    name: 'PDFのロック解除',
    title: 'PDFのロックを解除 – 無料、登録不要',
    description: '既知のパスワードを除去して作業を続けます。',
    howTitle: 'PDFのパスワードを外す',
    intro: '既知のパスワードをサーバーで除去します。1ファイル50MBまで。そのまま圧縮・結合・OCRに進めます。',
    steps: [
      '保護付きPDFをアップロード（最大50MB）。',
      '既知のパスワードを入力。',
      '解除済みPDFをダウンロード。',
    ],
  },
  'protect-pdf': {
    name: 'PDFを保護',
    title: 'PDFをパスワードで保護 – 無料、登録不要',
    description: 'AES暗号化でPDFへのアクセスを防ぎます。',
    howTitle: 'PDFをパスワードで守る',
    intro: 'パスワードで文書をAES暗号化します。1ファイル50MBまで。主要なビューアで開けます。',
    steps: [
      'PDFをアップロード（最大50MB）。',
      '安全なパスワードを設定。',
      '保護済みPDFをダウンロード。',
    ],
  },
};

const packs: Record<LocaleCode, LocalePack> = {
  de: {
    htmlLang: 'de',
    ogLocale: 'de_DE',
    hreflang: 'de',
    limitNote: 'Passwortgeschützte PDFs müssen zuerst entsperrt werden. Die Dateien werden nur zur Verarbeitung gehalten und innerhalb von 60 Minuten gelöscht.',
    englishLabel: 'English',
    tools: deTools,
  },
  fr: {
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    hreflang: 'fr',
    limitNote: 'Un PDF protégé par mot de passe doit d’abord être déverrouillé. Les fichiers ne sont gardés que le temps du traitement et sont effacés dans les 60 minutes.',
    englishLabel: 'English',
    tools: frTools,
  },
  jp: {
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    hreflang: 'ja',
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
  if (ADSENSE_REVIEW_MODE || !isLocalizedToolSlug(slug)) return undefined;
  return {
    en: `/tools/${slug}`,
    'x-default': `/tools/${slug}`,
    ...Object.fromEntries(LOCALIZED_LOCALES.map((locale) => [
      packs[locale].hreflang, `/${locale}/tools/${slug}`,
    ])),
  };
}

export function toolSitemapAlternates(slug: string) {
  const languages = toolLanguageAlternates(slug);
  if (!languages) return undefined;
  return { languages: Object.fromEntries(
    Object.entries(languages).map(([language, path]) => [language, absoluteUrl(path)]),
  ) };
}

export function localizedSitemapEntries() {
  if (ADSENSE_REVIEW_MODE) return [];
  // Each localized URL declares its full hreflang cluster inside the sitemap
  // (xhtml:link alternates), so Bing/Yandex and answer engines can resolve the
  // right locale even without parsing page <head> links.
  return (Object.keys(packs) as LocaleCode[]).flatMap((locale) =>
    LOCALIZED_TOOL_SLUGS.map((slug) => ({
      url: absoluteUrl(`/${locale}/tools/${slug}`),
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: 'weekly' as const,
      priority: 0.84,
      alternates: toolSitemapAlternates(slug),
    })),
  );
}
