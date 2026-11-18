export type UiLocale = 'en' | 'de' | 'fr' | 'jp' | 'es' | 'pt';

export function normalizeUiLocale(locale?: string | null): UiLocale {
  if (locale === 'de' || locale === 'fr' || locale === 'jp' || locale === 'es' || locale === 'pt') {
    return locale;
  }
  return 'en';
}

export interface UiLocaleDictionary {
  header: {
    fastWorkflow: string;
    privateProcessing: string;
    browserNative: string;
    aiEnhanced: string;
    serverOptimized: string;
    offlineProofOnline: string;
    offlineProofActive: string;
    shortcuts: string;
    openLabel: string;
    saveLabel: string;
    compareLabel: string;
    resetLabel: string;
    inputLabel: string;
    engineLabel: string;
    outputLabel: string;
    pdfFiles: string;
    imageFiles: string;
    signatureOrImage: string;
    extractedText: string;
    exportReadyPdf: string;
    optimizedImage: string;
    recommendedFlow: string;
    step1: string;
    step2: string;
    step3: string;
    aiPowered: string;
  };
  limits: {
    title: string;
    subtitle: string;
    stableOutput: string;
  };
  upload: {
    uploadPdf: string;
    uploadFile: string;
    dropPdf: string;
    dropFile: string;
    dragDropDesc: string;
    maxLimit: (mb: number) => string;
    singleFile: string;
    trustHttps: string;
    trustNoSignup: string;
    trustPreview: string;
    supportedPdfHint: string;
    supportedImgHint: string;
    selectedFile: string;
    sizeLabel: string;
    limitLabel: string;
    widthLabel: string;
    heightLabel: string;
    readyForProcessing: string;
    readyDesc: string;
    replaceFile: string;
    removeFile: string;
    convertingHeic: string;
    decodingHeic: string;
    processingFile: string;
    preparingResult: string;
    previewUnavailable: string;
    pdfReady: string;
    unsupportedFileTitle: string;
    fileTooLargeTitle: string;
  };
  result: {
    download: string;
    summaryTitle: string;
    auditComplete: string;
    verifyingProgress: (seconds: number) => string;
    verifiedBadge: (fmt: string) => string;
    checkingBadge: (pct: number) => string;
    originalSize: string;
    outputSize: string;
    percentSaved: string;
    savedValue: (pct: number) => string;
    optimizedZero: string;
    formatDpi: string;
    privacyPurge: string;
    localMemoryOnly: string;
    auditingLocalBuffer: string;
    serverPurged: string;
    scrubbingServerBuffer: string;
    cleanStatus: string;
    inProgressStatus: string;
    chainTitle: string;
    chainSubtitle: string;
    downloadComplete: string;
    clickCarryOver: string;
    loadingFile: string;
  };
  office: {
    readyToConvert: string;
    convertToPdf: string;
    convertToWord: string;
    convertingPercent: (pct: number) => string;
    conversionCompleted: string;
    downloadStarted: string;
    previewLabel: string;
    whyTitle: string;
    benefitsTitle: string;
    wordSubtitle: string;
    wordReadySummary: string;
    wordCardTitle: string;
    wordCardDesc: string;
    wordUploadAnother: string;
    wordLimits: string[];
    wordBenefits: Array<{ label: string; detail: string }>;
    excelSubtitle: string;
    excelReadySummary: string;
    excelCardTitle: string;
    excelCardDesc: string;
    excelUploadAnother: string;
    excelLimits: string[];
    pptSubtitle: string;
    pptReadySummary: string;
    pptCardTitle: string;
    pptCardDesc: string;
    pptUploadAnother: string;
    pptLimits: string[];
    pdfToWordReadySummary: string;
    pdfToWordUploadAnother: string;
    pdfToWordCardTitle: string;
    pdfToWordCardDesc: string;
    pdfToWordLimits: string[];
    pdfToWordBenefits: Array<{ label: string; detail: string }>;
  };
}

const enUi: UiLocaleDictionary = {
  header: {
    fastWorkflow: 'Fast workflow',
    privateProcessing: 'Private processing',
    browserNative: 'Browser-native',
    aiEnhanced: 'AI-enhanced',
    serverOptimized: 'Server-optimized',
    offlineProofOnline: 'Works 100% offline — test by turning off Wi-Fi',
    offlineProofActive: 'Offline Mode Active · Running Locally',
    shortcuts: 'Shortcuts:',
    openLabel: 'Open',
    saveLabel: 'Save',
    compareLabel: 'Hold to compare',
    resetLabel: 'Reset',
    inputLabel: 'Input',
    engineLabel: 'Engine',
    outputLabel: 'Output',
    pdfFiles: 'PDF files',
    imageFiles: 'Image files',
    signatureOrImage: 'Image or signature',
    extractedText: 'Extracted text',
    exportReadyPdf: 'Export-ready PDF',
    optimizedImage: 'Optimized image',
    recommendedFlow: 'Recommended flow',
    step1: '1. Upload your file',
    step2: '2. Tune output settings',
    step3: '3. Download polished result',
    aiPowered: 'AI powered',
  },
  limits: {
    title: 'Tool limits',
    subtitle: 'Keep the workflow predictable across devices.',
    stableOutput: 'Stable output',
  },
  upload: {
    uploadPdf: 'Upload PDF',
    uploadFile: 'Upload file',
    dropPdf: 'Drop your PDF here',
    dropFile: 'Drop your file here',
    dragDropDesc: 'Drag and drop from your device or click anywhere in this panel. The workflow is optimized for fast uploads, clean previews, and reliable output.',
    maxLimit: (mb) => `Max ${mb} MB`,
    singleFile: 'Single file',
    trustHttps: 'HTTPS upload / local canvas',
    trustNoSignup: 'No signup required',
    trustPreview: 'Preview before export',
    supportedPdfHint: 'PDF files up to the size limit',
    supportedImgHint: 'Supports JPG, PNG, WebP, HEIC, AVIF and more',
    selectedFile: 'Selected file',
    sizeLabel: 'Size',
    limitLabel: 'Limit',
    widthLabel: 'Width',
    heightLabel: 'Height',
    readyForProcessing: 'Ready for processing',
    readyDesc: 'You can replace this file, keep editing settings, or start processing immediately.',
    replaceFile: 'Replace file',
    removeFile: 'Remove',
    convertingHeic: 'Converting HEIC',
    decodingHeic: 'Decoding iPhone photo for preview',
    processingFile: 'Processing file',
    preparingResult: 'Preparing a high-quality result',
    previewUnavailable: 'Preview unavailable',
    pdfReady: 'PDF ready for processing',
    unsupportedFileTitle: 'File type not supported',
    fileTooLargeTitle: 'File too large',
  },
  result: {
    download: 'Download',
    summaryTitle: 'Optimization & Verification Summary',
    auditComplete: 'Output checksum & quality audit complete',
    verifyingProgress: (seconds) => `Verifying output integrity & privacy purge (${seconds}s)...`,
    verifiedBadge: (fmt) => `Verified · ${fmt}`,
    checkingBadge: (pct) => `Checking ${pct}%`,
    originalSize: 'Original Size',
    outputSize: 'Output Size',
    percentSaved: '% Saved',
    savedValue: (pct) => `${pct}% saved`,
    optimizedZero: '0% (Optimized)',
    formatDpi: 'Format / DPI',
    privacyPurge: 'Privacy Purge:',
    localMemoryOnly: 'Local browser memory only · Zero server upload',
    auditingLocalBuffer: 'Auditing local browser execution buffer...',
    serverPurged: 'Ephemeral buffer purged · Zero server retention',
    scrubbingServerBuffer: 'Scrubbing temporary server buffer...',
    cleanStatus: '100% Clean',
    inProgressStatus: 'In Progress',
    chainTitle: 'Continue With This File (No Re-Upload Needed)',
    chainSubtitle: 'Your processed file stays ready in memory — open the next tool in 1 click.',
    downloadComplete: 'Download Complete',
    clickCarryOver: '1-click carry-over',
    loadingFile: 'Loading file...',
  },
  office: {
    readyToConvert: 'Ready to Convert',
    convertToPdf: 'Convert to PDF',
    convertToWord: 'Convert to Word (.docx)',
    convertingPercent: (pct) => `Converting… ${pct}%`,
    conversionCompleted: 'Conversion Completed!',
    downloadStarted: 'Download started',
    previewLabel: 'Page 1 Preview',
    whyTitle: 'Why Convert to PDF?',
    benefitsTitle: 'Key Benefits',
    wordSubtitle: 'Microsoft Word (.docx)',
    wordReadySummary: 'Your Word document is now a standard PDF file.',
    wordCardTitle: 'Professional PDF Output',
    wordCardDesc: 'Converts DOCX headings, body paragraphs, and bold typography into standard vector PDF pages that look identical on mobile devices, Macs, and PCs.',
    wordUploadAnother: 'Upload Different Word File',
    wordLimits: [
      'Word (.docx) only · max 50 MB',
      'Preserves headings, paragraphs, bold emphasis, and clean pagination',
      'Instant ephemeral processing — nothing stored permanently',
    ],
    wordBenefits: [
      { label: 'Universal Compatibility:', detail: 'Anyone can open and view a PDF without needing Microsoft Office installed.' },
      { label: 'Preserved Formatting:', detail: 'Consistent typography and locked page layout across macOS, Windows, iOS, and Android.' },
      { label: 'Read-Only Security:', detail: 'Ideal for sending resumes, contracts, and client proposals that should not be accidentally edited.' },
    ],
    excelSubtitle: 'Spreadsheet',
    excelReadySummary: 'Your spreadsheet is now a print-ready PDF.',
    excelCardTitle: 'Print-Ready PDF Output',
    excelCardDesc: 'Renders the printable sheet layout into standard vector PDF pages — ideal for sharing budgets, inventories, and reports that must not be edited.',
    excelUploadAnother: 'Upload Different Spreadsheet',
    excelLimits: [
      'Excel (.xlsx, .xls) and CSV · max 25 MB',
      'Column layout, number formats, and table alignment preserved',
      'Files are deleted after processing — nothing is stored',
    ],
    pptSubtitle: 'Presentation',
    pptReadySummary: 'Your presentation is now a shareable PDF.',
    pptCardTitle: 'Share-Ready PDF Slides',
    pptCardDesc: 'Every slide becomes a standard 16:9 widescreen PDF page — no font substitution, no slide shifting, identical appearance on every screen.',
    pptUploadAnother: 'Upload Different Presentation',
    pptLimits: [
      'PowerPoint (.pptx, .ppt) · max 25 MB',
      'One slide per page — shareable on any device without PowerPoint',
      'Files are deleted after processing — nothing is stored',
    ],
    pdfToWordReadySummary: 'Your editable Word document (.docx) is ready to download.',
    pdfToWordUploadAnother: 'Upload Different PDF',
    pdfToWordCardTitle: 'Editable Word Document',
    pdfToWordCardDesc: 'Extracts text paragraphs, headings, and runs (with OCR fallback when needed) into a clean .docx file for Word, Google Docs, and LibreOffice Writer.',
    pdfToWordLimits: [
      'PDF only · max 50 MB',
      'Converts PDF text streams into editable Microsoft Word (.docx) format',
      'Maintains paragraph divisions and clean text formatting',
    ],
    pdfToWordBenefits: [
      { label: 'Full Text Editability:', detail: 'Fix typos, change wording, and add paragraphs to locked PDF documents.' },
      { label: 'No Software Required:', detail: 'Convert instantly online without needing paid desktop subscriptions.' },
      { label: 'Total Privacy:', detail: 'Secure processing with automatic file purging.' },
    ],
  },
};

const esUi: UiLocaleDictionary = {
  header: {
    fastWorkflow: 'Flujo rápido',
    privateProcessing: 'Proceso privado',
    browserNative: 'Nativo en tu navegador',
    aiEnhanced: 'Con IA',
    serverOptimized: 'Servidor seguro',
    offlineProofOnline: 'Funciona 100% sin conexión — pruébalo sin Wi-Fi',
    offlineProofActive: 'Modo sin conexión activo · Ejecución local',
    shortcuts: 'Atajos:',
    openLabel: 'Abrir',
    saveLabel: 'Guardar',
    compareLabel: 'Mantener para comparar',
    resetLabel: 'Reiniciar',
    inputLabel: 'Entrada',
    engineLabel: 'Motor',
    outputLabel: 'Salida',
    pdfFiles: 'Archivos PDF',
    imageFiles: 'Archivos de imagen',
    signatureOrImage: 'Imagen o firma',
    extractedText: 'Texto extraído',
    exportReadyPdf: 'PDF listo para usar',
    optimizedImage: 'Imagen optimizada',
    recommendedFlow: 'Pasos recomendados',
    step1: '1. Sube tu archivo',
    step2: '2. Ajusta las opciones',
    step3: '3. Descarga el resultado',
    aiPowered: 'Impulsado por IA',
  },
  limits: {
    title: 'Límites de la herramienta',
    subtitle: 'Mantén un flujo rápido y predecible en cualquier dispositivo.',
    stableOutput: 'Resultado estable',
  },
  upload: {
    uploadPdf: 'Subir PDF',
    uploadFile: 'Seleccionar archivo',
    dropPdf: 'Suelta tu PDF aquí',
    dropFile: 'Suelta tu archivo aquí',
    dragDropDesc: 'Arrastra y suelta desde tu dispositivo o haz clic en este recuadro. Diseñado para cargas rápidas, vista previa limpia y resultado confiable.',
    maxLimit: (mb) => `Máx. ${mb} MB`,
    singleFile: 'Un archivo',
    trustHttps: 'Subida HTTPS / navegador local',
    trustNoSignup: 'Sin registro',
    trustPreview: 'Vista previa antes de guardar',
    supportedPdfHint: 'Archivos PDF dentro del tamaño máximo',
    supportedImgHint: 'Compatible con JPG, PNG, WebP, HEIC, AVIF y más',
    selectedFile: 'Archivo seleccionado',
    sizeLabel: 'Tamaño',
    limitLabel: 'Límite',
    widthLabel: 'Ancho',
    heightLabel: 'Alto',
    readyForProcessing: 'Listo para convertir',
    readyDesc: 'Puedes reemplazar este archivo, ajustar la configuración o iniciar el proceso ahora.',
    replaceFile: 'Cambiar archivo',
    removeFile: 'Quitar',
    convertingHeic: 'Convirtiendo HEIC',
    decodingHeic: 'Decodificando foto para vista previa',
    processingFile: 'Procesando archivo',
    preparingResult: 'Preparando un resultado de alta calidad',
    previewUnavailable: 'Vista previa no disponible',
    pdfReady: 'PDF listo para procesar',
    unsupportedFileTitle: 'Formato no compatible',
    fileTooLargeTitle: 'Archivo demasiado grande',
  },
  result: {
    download: 'Descargar',
    summaryTitle: 'Resumen de Optimización y Verificación',
    auditComplete: 'Comprobación de integridad y limpieza completada',
    verifyingProgress: (seconds) => `Verificando integridad y borrado seguro (${seconds}s)...`,
    verifiedBadge: (fmt) => `Verificado · ${fmt}`,
    checkingBadge: (pct) => `Comprobando ${pct}%`,
    originalSize: 'Tamaño original',
    outputSize: 'Tamaño final',
    percentSaved: 'Ahorro',
    savedValue: (pct) => `${pct}% menos`,
    optimizedZero: '0% (Optimizado)',
    formatDpi: 'Formato / Calidad',
    privacyPurge: 'Limpieza RGPD:',
    localMemoryOnly: 'Solo memoria local del navegador · Cero subidas',
    auditingLocalBuffer: 'Auditando memoria local del navegador...',
    serverPurged: 'Búfer temporal eliminado · Cero retención',
    scrubbingServerBuffer: 'Limpiando búfer temporal del servidor...',
    cleanStatus: '100% Limpio',
    inProgressStatus: 'En curso',
    chainTitle: 'Continuar con este archivo (Sin volver a subirlo)',
    chainSubtitle: 'Tu archivo procesado sigue listo en memoria — abre la siguiente herramienta en 1 clic.',
    downloadComplete: 'Descarga completada',
    clickCarryOver: 'Siguiente paso en 1 clic',
    loadingFile: 'Cargando archivo...',
  },
  office: {
    readyToConvert: 'Listo para convertir',
    convertToPdf: 'Convertir a PDF',
    convertToWord: 'Convertir a Word (.docx)',
    convertingPercent: (pct) => `Convirtiendo… ${pct}%`,
    conversionCompleted: '¡Conversión completada!',
    downloadStarted: 'Descarga iniciada',
    previewLabel: 'Vista previa (Página 1)',
    whyTitle: '¿Por qué convertir Word a PDF?',
    benefitsTitle: 'Ventajas principales',
    wordSubtitle: 'Microsoft Word (.docx)',
    wordReadySummary: 'Tu documento de Word ya está listo en formato PDF.',
    wordCardTitle: 'Salida PDF profesional',
    wordCardDesc: 'Convierte encabezados, párrafos, viñetas y texto DOCX en un documento PDF estándar que mantiene su diseño intacto en móvil, Mac y Windows.',
    wordUploadAnother: 'Subir otro archivo Word',
    wordLimits: [
      'Solo Word (.docx) · máximo 50 MB',
      'Conserva títulos, párrafos, negritas y saltos de página',
      'Procesamiento seguro y borrado automático tras convertir',
    ],
    wordBenefits: [
      { label: 'Compatibilidad universal:', detail: 'Cualquier persona puede abrir el PDF sin tener Microsoft Word instalado.' },
      { label: 'Diseño inalterable:', detail: 'Evita descuadres de márgenes y fuentes en sedes electrónicas o clientes.' },
      { label: 'Entrega profesional:', detail: 'Perfecto para enviar currículums, contratos, facturas y presupuestos.' },
    ],
    excelSubtitle: 'Hoja de cálculo',
    excelReadySummary: 'Tu hoja de cálculo ya está convertida a PDF.',
    excelCardTitle: 'PDF listo para imprimir',
    excelCardDesc: 'Convierte tablas de Excel y archivos CSV en páginas PDF claras y ordenadas — ideal para presupuestos, inventarios e informes.',
    excelUploadAnother: 'Subir otra hoja de cálculo',
    excelLimits: [
      'Excel (.xlsx, .xls) y CSV · máximo 25 MB',
      'Mantiene columnas, alineación y estructura tabular',
      'Los archivos se eliminan automáticamente al finalizar',
    ],
    pptSubtitle: 'Presentación',
    pptReadySummary: 'Tu presentación ya es un PDF listo para compartir.',
    pptCardTitle: 'Diapositivas en PDF',
    pptCardDesc: 'Cada diapositiva pasa a una página PDF panorámica sin cambios de fuente ni desajustes en ningún dispositivo.',
    pptUploadAnother: 'Subir otra presentación',
    pptLimits: [
      'PowerPoint (.pptx, .ppt) · máximo 25 MB',
      'Una diapositiva por página lista para enviar por correo o WhatsApp',
      'Sin almacenamiento permanente de tus archivos',
    ],
    pdfToWordReadySummary: 'Tu documento Word (.docx) editable está listo para descargar.',
    pdfToWordUploadAnother: 'Subir otro PDF',
    pdfToWordCardTitle: 'Documento Word editable',
    pdfToWordCardDesc: 'Extrae párrafos, encabezados y estructura (con OCR automático si el PDF es escaneado) a un archivo .docx editable en Word o Google Docs.',
    pdfToWordLimits: [
      'Solo archivos PDF · máximo 50 MB',
      'Convierte texto PDF en documentos Microsoft Word (.docx) editables',
      'Mantiene párrafos y organización general del documento',
    ],
    pdfToWordBenefits: [
      { label: 'Edición directa:', detail: 'Corrige erratas, actualiza fechas o reutiliza cláusulas sin reescribir todo.' },
      { label: 'Sin programas caros:', detail: 'Funciona online al instante sin suscripciones de pago.' },
      { label: 'Privacidad garantizada:', detail: 'Eliminación automática tras completar la conversión.' },
    ],
  },
};

const frUi: UiLocaleDictionary = {
  header: {
    fastWorkflow: 'Flux rapide',
    privateProcessing: 'Traitement privé',
    browserNative: 'Local dans le navigateur',
    aiEnhanced: 'Assisté par IA',
    serverOptimized: 'Serveur sécurisé',
    offlineProofOnline: 'Fonctionne 100% hors ligne — testez sans Wi-Fi',
    offlineProofActive: 'Mode hors ligne actif · Exécution locale',
    shortcuts: 'Raccourcis :',
    openLabel: 'Ouvrir',
    saveLabel: 'Enregistrer',
    compareLabel: 'Maintenir pour comparer',
    resetLabel: 'Réinitialiser',
    inputLabel: 'Entrée',
    engineLabel: 'Moteur',
    outputLabel: 'Sortie',
    pdfFiles: 'Fichiers PDF',
    imageFiles: 'Fichiers image',
    signatureOrImage: 'Image ou signature',
    extractedText: 'Texte extrait',
    exportReadyPdf: 'PDF prêt à exporter',
    optimizedImage: 'Image optimisée',
    recommendedFlow: 'Étapes recommandées',
    step1: '1. Importez votre fichier',
    step2: '2. Ajustez les options',
    step3: '3. Téléchargez le résultat',
    aiPowered: 'Propulsé par IA',
  },
  limits: {
    title: 'Limites de l’outil',
    subtitle: 'Flux fiable et rapide sur ordinateur comme sur mobile.',
    stableOutput: 'Rendu stable',
  },
  upload: {
    uploadPdf: 'Importer un PDF',
    uploadFile: 'Choisir un fichier',
    dropPdf: 'Déposez votre PDF ici',
    dropFile: 'Déposez votre fichier ici',
    dragDropDesc: 'Glissez-déposez un fichier depuis votre appareil ou cliquez ici. Prévisualisation instantanée et export propre sans inscription.',
    maxLimit: (mb) => `Max ${mb} Mo`,
    singleFile: 'Un fichier',
    trustHttps: 'Envoi HTTPS / traitement local',
    trustNoSignup: 'Sans inscription',
    trustPreview: 'Aperçu avant export',
    supportedPdfHint: 'Fichiers PDF dans la limite autorisée',
    supportedImgHint: 'Compatible JPG, PNG, WebP, HEIC, AVIF et plus',
    selectedFile: 'Fichier sélectionné',
    sizeLabel: 'Taille',
    limitLabel: 'Limite',
    widthLabel: 'Largeur',
    heightLabel: 'Hauteur',
    readyForProcessing: 'Prêt pour le traitement',
    readyDesc: 'Vous pouvez remplacer ce fichier, ajuster les réglages ou lancer la conversion.',
    replaceFile: 'Remplacer',
    removeFile: 'Retirer',
    convertingHeic: 'Conversion HEIC',
    decodingHeic: 'Décodage de la photo pour aperçu',
    processingFile: 'Traitement en cours',
    preparingResult: 'Préparation d’un fichier optimisé',
    previewUnavailable: 'Aperçu indisponible',
    pdfReady: 'PDF prêt',
    unsupportedFileTitle: 'Format non pris en charge',
    fileTooLargeTitle: 'Fichier trop volumineux',
  },
  result: {
    download: 'Télécharger',
    summaryTitle: 'Résumé d’optimisation et de vérification',
    auditComplete: 'Contrôle d’intégrité et confidentialité terminé',
    verifyingProgress: (s) => `Vérification et purge de confidentialité (${s}s)...`,
    verifiedBadge: (fmt) => `Vérifié · ${fmt}`,
    checkingBadge: (pct) => `Contrôle ${pct}%`,
    originalSize: 'Taille initiale',
    outputSize: 'Taille finale',
    percentSaved: 'Gain',
    savedValue: (pct) => `${pct}% réduit`,
    optimizedZero: '0% (Optimisé)',
    formatDpi: 'Format / Qualité',
    privacyPurge: 'Purge RGPD :',
    localMemoryOnly: 'Mémoire locale uniquement · Aucun envoi serveur',
    auditingLocalBuffer: 'Contrôle du tampon local...',
    serverPurged: 'Tampon temporaire purgé · Zéro conservation',
    scrubbingServerBuffer: 'Nettoyage du tampon serveur...',
    cleanStatus: '100% Propre',
    inProgressStatus: 'En cours',
    chainTitle: 'Continuer avec ce fichier (Sans réimporter)',
    chainSubtitle: 'Votre fichier reste prêt en mémoire — passez à l’outil suivant en 1 clic.',
    downloadComplete: 'Téléchargement terminé',
    clickCarryOver: 'Action suivante en 1 clic',
    loadingFile: 'Chargement...',
  },
  office: {
    readyToConvert: 'Prêt à convertir',
    convertToPdf: 'Convertir en PDF',
    convertToWord: 'Convertir en Word (.docx)',
    convertingPercent: (pct) => `Conversion… ${pct}%`,
    conversionCompleted: 'Conversion terminée !',
    downloadStarted: 'Téléchargement lancé',
    previewLabel: 'Aperçu Page 1',
    whyTitle: 'Pourquoi convertir en PDF ?',
    benefitsTitle: 'Avantages clés',
    wordSubtitle: 'Microsoft Word (.docx)',
    wordReadySummary: 'Votre document Word est converti en PDF standard.',
    wordCardTitle: 'Rendu PDF professionnel',
    wordCardDesc: 'Transforme titres, paragraphes et styles DOCX en pages PDF nettes et verrouillées pour mobile, Mac et PC.',
    wordUploadAnother: 'Importer un autre document Word',
    wordLimits: [
      'Word (.docx) uniquement · 50 Mo max',
      'Titres, paragraphes et mise en page conservés',
      'Suppression automatique après traitement',
    ],
    wordBenefits: [
      { label: 'Compatibilité totale :', detail: 'Lisible sur tout appareil sans Microsoft Office.' },
      { label: 'Mise en page fixe :', detail: 'Aucune police ou marge décalée lors de l’envoi.' },
      { label: 'Partage fiable :', detail: 'Idéal pour CV, contrats et dossiers administratifs.' },
    ],
    excelSubtitle: 'Tableur',
    excelReadySummary: 'Votre tableur est prêt en PDF.',
    excelCardTitle: 'PDF prêt à imprimer',
    excelCardDesc: 'Convertit feuilles Excel et CSV en tableaux PDF lisibles et propres.',
    excelUploadAnother: 'Importer un autre tableur',
    excelLimits: [
      'Excel (.xlsx, .xls) et CSV · 25 Mo max',
      'Colonnes et alignement préservés',
      'Fichiers effacés après conversion',
    ],
    pptSubtitle: 'Présentation',
    pptReadySummary: 'Votre présentation est prête en PDF.',
    pptCardTitle: 'Diapositives PDF',
    pptCardDesc: 'Une diapositive par page au format 16:9 lisible partout.',
    pptUploadAnother: 'Importer une autre présentation',
    pptLimits: [
      'PowerPoint (.pptx, .ppt) · 25 Mo max',
      'Une diapositive par page sans décalage',
      'Fichiers supprimés après traitement',
    ],
    pdfToWordReadySummary: 'Votre document Word (.docx) est prêt.',
    pdfToWordUploadAnother: 'Importer un autre PDF',
    pdfToWordCardTitle: 'Document Word modifiable',
    pdfToWordCardDesc: 'Extrait paragraphes et structure du PDF vers un fichier .docx modifiable dans Word ou Google Docs.',
    pdfToWordLimits: [
      'PDF uniquement · 50 Mo max',
      'Exportation vers .docx modifiable',
      'Suppression automatique après conversion',
    ],
    pdfToWordBenefits: [
      { label: 'Texte modifiable :', detail: 'Corrigez ou mettez à jour votre PDF en quelques secondes.' },
      { label: 'Sans logiciel payant :', detail: 'Convertissez gratuitement depuis votre navigateur.' },
      { label: 'Confidentialité :', detail: 'Purge automatique après traitement.' },
    ],
  },
};

const deUi: UiLocaleDictionary = {
  header: {
    fastWorkflow: 'Schneller Ablauf',
    privateProcessing: 'Datenschutzfreundlich',
    browserNative: 'Direkt im Browser',
    aiEnhanced: 'KI-gestützt',
    serverOptimized: 'Sicherer Server',
    offlineProofOnline: '100% offline nutzbar — ohne WLAN testen',
    offlineProofActive: 'Offline-Modus aktiv · Lokal ausgeführt',
    shortcuts: 'Tastenkürzel:',
    openLabel: 'Öffnen',
    saveLabel: 'Speichern',
    compareLabel: 'Halten zum Vergleichen',
    resetLabel: 'Zurücksetzen',
    inputLabel: 'Eingabe',
    engineLabel: 'Engine',
    outputLabel: 'Ausgabe',
    pdfFiles: 'PDF-Dateien',
    imageFiles: 'Bilddateien',
    signatureOrImage: 'Bild oder Signatur',
    extractedText: 'Extrahierter Text',
    exportReadyPdf: 'Exportfertiges PDF',
    optimizedImage: 'Optimiertes Bild',
    recommendedFlow: 'Empfohlener Ablauf',
    step1: '1. Datei hochladen',
    step2: '2. Optionen wählen',
    step3: '3. Ergebnis laden',
    aiPowered: 'KI-Funktion',
  },
  limits: {
    title: 'Tool-Grenzwerte',
    subtitle: 'Zuverlässige Ergebnisse auf Desktop und Mobilgeräten.',
    stableOutput: 'Stabile Ausgabe',
  },
  upload: {
    uploadPdf: 'PDF hochladen',
    uploadFile: 'Datei wählen',
    dropPdf: 'PDF hier ablegen',
    dropFile: 'Datei hier ablegen',
    dragDropDesc: 'Datei einfach hierher ziehen oder klicken. Optimiert für schnellen Upload, Vorschau und zuverlässige Ausgabe.',
    maxLimit: (mb) => `Max. ${mb} MB`,
    singleFile: 'Einzeldatei',
    trustHttps: 'HTTPS-Upload / lokal im Browser',
    trustNoSignup: 'Keine Anmeldung',
    trustPreview: 'Vorschau vor Export',
    supportedPdfHint: 'PDF-Dateien bis zum Größenlimit',
    supportedImgHint: 'Unterstützt JPG, PNG, WebP, HEIC, AVIF u. v. m.',
    selectedFile: 'Gewählte Datei',
    sizeLabel: 'Größe',
    limitLabel: 'Limit',
    widthLabel: 'Breite',
    heightLabel: 'Höhe',
    readyForProcessing: 'Bereit zur Verarbeitung',
    readyDesc: 'Datei ersetzen, Einstellungen ändern oder direkt starten.',
    replaceFile: 'Datei ersetzen',
    removeFile: 'Entfernen',
    convertingHeic: 'HEIC konvertieren',
    decodingHeic: 'Foto für Vorschau vorbereiten',
    processingFile: 'Wird verarbeitet',
    preparingResult: 'Ergebnis wird erstellt',
    previewUnavailable: 'Keine Vorschau verfügbar',
    pdfReady: 'PDF bereit',
    unsupportedFileTitle: 'Dateiformat nicht unterstützt',
    fileTooLargeTitle: 'Datei zu groß',
  },
  result: {
    download: 'Herunterladen',
    summaryTitle: 'Optimierungs- & Prüfbericht',
    auditComplete: 'Integritäts- und Datenschutzprüfung abgeschlossen',
    verifyingProgress: (s) => `Ausgabe und Löschstatus prüfen (${s}s)...`,
    verifiedBadge: (fmt) => `Geprüft · ${fmt}`,
    checkingBadge: (pct) => `Prüfung ${pct}%`,
    originalSize: 'Originalgröße',
    outputSize: 'Ausgabegröße',
    percentSaved: 'Ersparnis',
    savedValue: (pct) => `${pct}% kleiner`,
    optimizedZero: '0% (Optimiert)',
    formatDpi: 'Format / Qualität',
    privacyPurge: 'DSGVO-Löschung:',
    localMemoryOnly: 'Nur lokaler Arbeitsspeicher · Kein Server-Upload',
    auditingLocalBuffer: 'Lokalen Speicher prüfen...',
    serverPurged: 'Zwischenspeicher gelöscht · Keine Speicherung',
    scrubbingServerBuffer: 'Temporären Puffer bereinigen...',
    cleanStatus: '100% Bereinigt',
    inProgressStatus: 'Läuft',
    chainTitle: 'Mit dieser Datei direkt weiterarbeiten',
    chainSubtitle: 'Die Ausgabedatei bleibt im Speicher — nächstes Tool mit 1 Klick öffnen.',
    downloadComplete: 'Download abgeschlossen',
    clickCarryOver: '1-Klick-Weiterverarbeitung',
    loadingFile: 'Datei wird geladen...',
  },
  office: {
    readyToConvert: 'Bereit zum Umwandeln',
    convertToPdf: 'In PDF umwandeln',
    convertToWord: 'In Word (.docx) umwandeln',
    convertingPercent: (pct) => `Umwandlung… ${pct}%`,
    conversionCompleted: 'Umwandlung abgeschlossen!',
    downloadStarted: 'Download gestartet',
    previewLabel: 'Vorschau Seite 1',
    whyTitle: 'Warum in PDF umwandeln?',
    benefitsTitle: 'Wichtigste Vorteile',
    wordSubtitle: 'Microsoft Word (.docx)',
    wordReadySummary: 'Ihr Word-Dokument ist jetzt ein fertiges PDF.',
    wordCardTitle: 'Saubere PDF-Ausgabe',
    wordCardDesc: 'Wandelt DOCX-Überschriften, Absätze und Formatierung in ein stabiles PDF für Mac, Windows und Smartphone um.',
    wordUploadAnother: 'Andere Word-Datei wählen',
    wordLimits: [
      'Nur Word (.docx) · max. 50 MB',
      'Behält Überschriften, Absätze und Seitenlayout',
      'Automatische Löschung nach der Verarbeitung',
    ],
    wordBenefits: [
      { label: 'Überall lesbar:', detail: 'Jeder kann das PDF ohne installiertes Microsoft Office öffnen.' },
      { label: 'Festes Layout:', detail: 'Keine verschobenen Zeilen oder Schriftarten bei Bewerbungen und Verträgen.' },
      { label: 'Schreibgeschützt:', detail: 'Perfekt für Angebote, Lebensläufe und offizielle Anträge.' },
    ],
    excelSubtitle: 'Tabelle',
    excelReadySummary: 'Ihre Tabelle ist jetzt ein druckfertiges PDF.',
    excelCardTitle: 'Druckfertige PDF-Tabelle',
    excelCardDesc: 'Wandelt Excel- und CSV-Tabellen in übersichtliche PDF-Seiten um.',
    excelUploadAnother: 'Andere Tabelle wählen',
    excelLimits: [
      'Excel (.xlsx, .xls) & CSV · max. 25 MB',
      'Spalten und Tabellenstruktur bleiben sauber lesbar',
      'Sofortige Löschung nach Abschluss',
    ],
    pptSubtitle: 'Präsentation',
    pptReadySummary: 'Ihre Präsentation ist jetzt ein PDF.',
    pptCardTitle: 'PDF-Folien zum Teilen',
    pptCardDesc: 'Jede Folie als einzelne 16:9-PDF-Seite ohne Schriftverschiebung.',
    pptUploadAnother: 'Andere Präsentation wählen',
    pptLimits: [
      'PowerPoint (.pptx, .ppt) · max. 25 MB',
      'Eine Folie pro Seite für jeden Bildschirm',
      'Keine dauerhafte Speicherung',
    ],
    pdfToWordReadySummary: 'Ihr bearbeitbares Word-Dokument (.docx) ist bereit.',
    pdfToWordUploadAnother: 'Anderes PDF wählen',
    pdfToWordCardTitle: 'Bearbeitbare Word-Datei',
    pdfToWordCardDesc: 'Überträgt Text und Absätze aus dem PDF in ein bearbeitbares .docx-Dokument.',
    pdfToWordLimits: [
      'Nur PDF · max. 50 MB',
      'Erzeugt bearbeitbares Microsoft-Word-Format (.docx)',
      'Automatische Bereinigung nach Verarbeitung',
    ],
    pdfToWordBenefits: [
      { label: 'Direkt bearbeiten:', detail: 'Texte korrigieren ohne alles neu abzutippen.' },
      { label: 'Ohne Zusatzsoftware:', detail: 'Funktioniert sofort im Browser.' },
      { label: 'Datenschutz:', detail: 'Dateien werden nicht gespeichert.' },
    ],
  },
};

const ptUi: UiLocaleDictionary = {
  header: {
    fastWorkflow: 'Fluxo rápido',
    privateProcessing: 'Processamento privado',
    browserNative: 'Nativo no navegador',
    aiEnhanced: 'Com IA',
    serverOptimized: 'Servidor seguro',
    offlineProofOnline: 'Funciona 100% offline — teste sem Wi-Fi',
    offlineProofActive: 'Modo offline ativo · Local no dispositivo',
    shortcuts: 'Atalhos:',
    openLabel: 'Abrir',
    saveLabel: 'Salvar',
    compareLabel: 'Segurar para comparar',
    resetLabel: 'Reiniciar',
    inputLabel: 'Entrada',
    engineLabel: 'Motor',
    outputLabel: 'Saída',
    pdfFiles: 'Arquivos PDF',
    imageFiles: 'Arquivos de imagem',
    signatureOrImage: 'Imagem ou assinatura',
    extractedText: 'Texto extraído',
    exportReadyPdf: 'PDF pronto',
    optimizedImage: 'Imagem otimizada',
    recommendedFlow: 'Fluxo recomendado',
    step1: '1. Envie seu arquivo',
    step2: '2. Ajuste as opções',
    step3: '3. Baixe o resultado',
    aiPowered: 'Com IA',
  },
  limits: {
    title: 'Limites da ferramenta',
    subtitle: 'Fluxo estável e rápido em qualquer dispositivo.',
    stableOutput: 'Saída estável',
  },
  upload: {
    uploadPdf: 'Enviar PDF',
    uploadFile: 'Escolher arquivo',
    dropPdf: 'Solte seu PDF aqui',
    dropFile: 'Solte seu arquivo aqui',
    dragDropDesc: 'Arraste e solte do seu dispositivo ou clique neste painel. Envio rápido, pré-visualização limpa e download seguro.',
    maxLimit: (mb) => `Máx. ${mb} MB`,
    singleFile: 'Arquivo único',
    trustHttps: 'Envio HTTPS / navegador local',
    trustNoSignup: 'Sem cadastro',
    trustPreview: 'Prévia antes de baixar',
    supportedPdfHint: 'Arquivos PDF dentro do limite de tamanho',
    supportedImgHint: 'Compatível com JPG, PNG, WebP, HEIC, AVIF e mais',
    selectedFile: 'Arquivo selecionado',
    sizeLabel: 'Tamanho',
    limitLabel: 'Limite',
    widthLabel: 'Largura',
    heightLabel: 'Altura',
    readyForProcessing: 'Pronto para processar',
    readyDesc: 'Você pode trocar o arquivo, ajustar opções ou iniciar agora.',
    replaceFile: 'Trocar arquivo',
    removeFile: 'Remover',
    convertingHeic: 'Convertendo HEIC',
    decodingHeic: 'Decodificando foto para prévia',
    processingFile: 'Processando arquivo',
    preparingResult: 'Preparando arquivo final',
    previewUnavailable: 'Prévia indisponível',
    pdfReady: 'PDF pronto',
    unsupportedFileTitle: 'Formato não compatível',
    fileTooLargeTitle: 'Arquivo muito grande',
  },
  result: {
    download: 'Baixar',
    summaryTitle: 'Resumo de Otimização e Verificação',
    auditComplete: 'Auditoria de integridade e privacidade concluída',
    verifyingProgress: (s) => `Verificando integridade e limpeza segura (${s}s)...`,
    verifiedBadge: (fmt) => `Verificado · ${fmt}`,
    checkingBadge: (pct) => `Verificando ${pct}%`,
    originalSize: 'Tamanho original',
    outputSize: 'Tamanho final',
    percentSaved: 'Economia',
    savedValue: (pct) => `${pct}% menor`,
    optimizedZero: '0% (Otimizado)',
    formatDpi: 'Formato / Qualidade',
    privacyPurge: 'Limpeza segura:',
    localMemoryOnly: 'Somente memória do navegador · Sem envio',
    auditingLocalBuffer: 'Auditando memória local...',
    serverPurged: 'Buffer temporário apagado · Zero retenção',
    scrubbingServerBuffer: 'Limpando buffer temporário...',
    cleanStatus: '100% Limpo',
    inProgressStatus: 'Em andamento',
    chainTitle: 'Continuar com este arquivo (Sem reenviar)',
    chainSubtitle: 'Seu arquivo continua pronto na memória — abra a próxima etapa em 1 clique.',
    downloadComplete: 'Download concluído',
    clickCarryOver: 'Próximo passo em 1 clique',
    loadingFile: 'Carregando...',
  },
  office: {
    readyToConvert: 'Pronto para converter',
    convertToPdf: 'Converter para PDF',
    convertToWord: 'Converter para Word (.docx)',
    convertingPercent: (pct) => `Convertendo… ${pct}%`,
    conversionCompleted: 'Conversão concluída!',
    downloadStarted: 'Download iniciado',
    previewLabel: 'Prévia (Página 1)',
    whyTitle: 'Por que converter para PDF?',
    benefitsTitle: 'Principais benefícios',
    wordSubtitle: 'Microsoft Word (.docx)',
    wordReadySummary: 'Seu documento Word agora é um PDF padrão.',
    wordCardTitle: 'Saída PDF profissional',
    wordCardDesc: 'Transforma títulos e parágrafos DOCX em páginas PDF estáveis para enviar por WhatsApp, e-mail ou portais públicos.',
    wordUploadAnother: 'Enviar outro arquivo Word',
    wordLimits: [
      'Apenas Word (.docx) · máx. 50 MB',
      'Preserva títulos, parágrafos e paginação limpa',
      'Exclusão automática após a conversão',
    ],
    wordBenefits: [
      { label: 'Compatibilidade universal:', detail: 'Qualquer pessoa abre sem precisar do Microsoft Word.' },
      { label: 'Layout travado:', detail: 'Sem fontes ou margens desalinhadas em outro computador.' },
      { label: 'Envio seguro:', detail: 'Ideal para currículos, contratos e documentos fiscais.' },
    ],
    excelSubtitle: 'Planilha',
    excelReadySummary: 'Sua planilha agora é um PDF pronto para imprimir.',
    excelCardTitle: 'PDF pronto para impressão',
    excelCardDesc: 'Converte planilhas Excel e CSV em tabelas PDF organizadas.',
    excelUploadAnother: 'Enviar outra planilha',
    excelLimits: [
      'Excel (.xlsx, .xls) e CSV · máx. 25 MB',
      'Colunas e alinhamento preservados',
      'Arquivos apagados após a conversão',
    ],
    pptSubtitle: 'Apresentação',
    pptReadySummary: 'Sua apresentação agora é um PDF.',
    pptCardTitle: 'Slides em PDF',
    pptCardDesc: 'Cada slide em uma página PDF 16:9 sem perda de formatação.',
    pptUploadAnother: 'Enviar outra apresentação',
    pptLimits: [
      'PowerPoint (.pptx, .ppt) · máx. 25 MB',
      'Um slide por página em alta nitidez',
      'Sem armazenamento permanente',
    ],
    pdfToWordReadySummary: 'Seu documento Word (.docx) editável está pronto.',
    pdfToWordUploadAnother: 'Enviar outro PDF',
    pdfToWordCardTitle: 'Documento Word editável',
    pdfToWordCardDesc: 'Extrai parágrafos e estrutura do PDF para um arquivo .docx editável no Word ou Google Docs.',
    pdfToWordLimits: [
      'Apenas PDF · máx. 50 MB',
      'Gera arquivo Word (.docx) editável',
      'Limpeza automática após processar',
    ],
    pdfToWordBenefits: [
      { label: 'Edição rápida:', detail: 'Atualize textos e tabelas sem redigitar tudo.' },
      { label: '100% gratuito:', detail: 'Sem assinaturas nem instalação.' },
      { label: 'Privacidade:', detail: 'Arquivos apagados logo após o download.' },
    ],
  },
};

const jpUi: UiLocaleDictionary = {
  header: {
    fastWorkflow: '高速処理',
    privateProcessing: 'プライバシー保護',
    browserNative: 'ブラウザ完結',
    aiEnhanced: 'AI処理',
    serverOptimized: '安全サーバー',
    offlineProofOnline: '完全オフライン対応 — Wi-Fi切断でも動作',
    offlineProofActive: 'オフラインモード · ローカル実行中',
    shortcuts: 'ショートカット:',
    openLabel: '開く',
    saveLabel: '保存',
    compareLabel: '長押しで比較',
    resetLabel: 'リセット',
    inputLabel: '入力',
    engineLabel: 'エンジン',
    outputLabel: '出力',
    pdfFiles: 'PDFファイル',
    imageFiles: '画像ファイル',
    signatureOrImage: '画像または署名',
    extractedText: '抽出テキスト',
    exportReadyPdf: '出力用PDF',
    optimizedImage: '最適化済み画像',
    recommendedFlow: '使い方の手順',
    step1: '1. ファイルを選択',
    step2: '2. 設定を調整',
    step3: '3. 結果をダウンロード',
    aiPowered: 'AI対応',
  },
  limits: {
    title: '利用条件と上限',
    subtitle: 'PCでもスマホでも安定した品質で変換できます。',
    stableOutput: '安定出力',
  },
  upload: {
    uploadPdf: 'PDFをアップロード',
    uploadFile: 'ファイルを選択',
    dropPdf: 'ここにPDFをドロップ',
    dropFile: 'ここにファイルをドロップ',
    dragDropDesc: 'デバイスからファイルをドラッグ＆ドロップ、またはクリックして選択してください。登録不要で高速に変換できます。',
    maxLimit: (mb) => `最大 ${mb} MB`,
    singleFile: '1ファイルずつ',
    trustHttps: 'HTTPS暗号化 / ローカル処理',
    trustNoSignup: '登録不要',
    trustPreview: '保存前にプレビュー確認',
    supportedPdfHint: '上限サイズ以内のPDFに対応',
    supportedImgHint: 'JPG・PNG・WebP・HEIC・AVIFなどに対応',
    selectedFile: '選択中のファイル',
    sizeLabel: 'サイズ',
    limitLabel: '上限',
    widthLabel: '幅',
    heightLabel: '高さ',
    readyForProcessing: '変換の準備完了',
    readyDesc: 'ファイルの変更や設定の調整をしてそのまま実行できます。',
    replaceFile: 'ファイルを変更',
    removeFile: '削除',
    convertingHeic: 'HEICを変換中',
    decodingHeic: 'プレビュー用に画像を読み込んでいます',
    processingFile: '処理中',
    preparingResult: '高品質なファイルを生成しています',
    previewUnavailable: 'プレビュー不可',
    pdfReady: 'PDF読み込み完了',
    unsupportedFileTitle: '非対応のファイル形式',
    fileTooLargeTitle: 'ファイルサイズ超過',
  },
  result: {
    download: 'ダウンロード',
    summaryTitle: '最適化・検証サマリー',
    auditComplete: '整合性チェックとプライバシー消去が完了',
    verifyingProgress: (s) => `出力データと安全消去を確認中 (${s}秒)...`,
    verifiedBadge: (fmt) => `検証済み · ${fmt}`,
    checkingBadge: (pct) => `確認中 ${pct}%`,
    originalSize: '元サイズ',
    outputSize: '変換後サイズ',
    percentSaved: '削減率',
    savedValue: (pct) => `${pct}%削減`,
    optimizedZero: '0% (最適化済み)',
    formatDpi: '形式 / 品質',
    privacyPurge: '自動削除:',
    localMemoryOnly: 'ブラウザ内メモリのみ · サーバー送信なし',
    auditingLocalBuffer: 'ローカルメモリを確認中...',
    serverPurged: '一時バッファ消去済み · サーバー保存なし',
    scrubbingServerBuffer: '一時ファイルを安全消去中...',
    cleanStatus: '100% クリア',
    inProgressStatus: '確認中',
    chainTitle: 'このファイルで次の作業を続ける（再アップロード不要）',
    chainSubtitle: '変換済みファイルをそのまま引き継いで、次のツールを1クリックで開けます。',
    downloadComplete: 'ダウンロード完了',
    clickCarryOver: '1クリックで引き継ぐ',
    loadingFile: '読み込み中...',
  },
  office: {
    readyToConvert: '変換準備完了',
    convertToPdf: 'PDFに変換',
    convertToWord: 'Word (.docx) に変換',
    convertingPercent: (pct) => `変換中… ${pct}%`,
    conversionCompleted: '変換が完了しました！',
    downloadStarted: 'ダウンロードを開始しました',
    previewLabel: '1ページ目プレビュー',
    whyTitle: 'PDFに変換するメリット',
    benefitsTitle: '主な特長',
    wordSubtitle: 'Microsoft Word (.docx)',
    wordReadySummary: 'Word文書を標準PDFファイルに変換しました。',
    wordCardTitle: 'きれいなPDF出力',
    wordCardDesc: 'DOCXの見出し・段落・文字スタイルを標準PDFとして保存し、スマホ・Mac・Windowsでレイアウト崩れを防ぎます。',
    wordUploadAnother: '別のWordファイルを選ぶ',
    wordLimits: [
      'Word (.docx) 対応 · 最大 50 MB',
      '見出し・段落・改ページをきれいに保持',
      '変換後はサーバーから自動削除されます',
    ],
    wordBenefits: [
      { label: '環境を選ばず閲覧:', detail: 'Wordが入っていないPCやスマホでも崩れず開けます。' },
      { label: 'レイアウト固定:', detail: '提出書類や履歴書・請求書が意図せずズレません。' },
      { label: '編集防止に最適:', detail: 'そのまま送付・共有しやすい読み取り形式です。' },
    ],
    excelSubtitle: '表計算シート',
    excelReadySummary: '表計算ファイルを印刷用PDFに変換しました。',
    excelCardTitle: '印刷向けPDF表出力',
    excelCardDesc: 'ExcelやCSVの表データを崩れにくいPDF表として保存します。',
    excelUploadAnother: '別の表ファイルを選ぶ',
    excelLimits: [
      'Excel (.xlsx, .xls) / CSV 対応 · 最大 25 MB',
      '列構造と数値配置を保って変換',
      '処理完了後にファイルを自動消去',
    ],
    pptSubtitle: 'プレゼンテーション',
    pptReadySummary: 'スライドを共有用PDFに変換しました。',
    pptCardTitle: '共有向けPDFスライド',
    pptCardDesc: '1スライド1ページで16:9レイアウトのPDFに出力します。',
    pptUploadAnother: '別のスライドを選ぶ',
    pptLimits: [
      'PowerPoint (.pptx, .ppt) 対応 · 最大 25 MB',
      '1スライド1ページでどの端末でも共有可能',
      '一時ファイルは自動削除されます',
    ],
    pdfToWordReadySummary: '編集可能なWordファイル (.docx) が完成しました。',
    pdfToWordUploadAnother: '別のPDFを選ぶ',
    pdfToWordCardTitle: '編集できるWord文書',
    pdfToWordCardDesc: 'PDFのテキストと段落構成を抽出し、WordやGoogleドキュメントで編集できる .docx を作成します。',
    pdfToWordLimits: [
      'PDFファイル専用 · 最大 50 MB',
      'PDF内のテキストを編集可能なWord (.docx) へ変換',
      '変換後にファイルを自動削除',
    ],
    pdfToWordBenefits: [
      { label: 'すぐ編集可能:', detail: 'PDFの誤字修正や差し替えに打ち直す手間がありません。' },
      { label: 'ソフト不要:', detail: '有料アプリなしでブラウザから無料変換できます。' },
      { label: '安心の削除処理:', detail: '処理済みデータは自動消去されます。' },
    ],
  },
};

const uiDictionaries: Record<UiLocale, UiLocaleDictionary> = {
  en: enUi,
  es: esUi,
  fr: frUi,
  de: deUi,
  pt: ptUi,
  jp: jpUi,
};

export function getUiDictionary(locale?: string | null): UiLocaleDictionary {
  return uiDictionaries[normalizeUiLocale(locale)];
}
