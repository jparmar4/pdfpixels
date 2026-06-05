export type ToolContent = {
    about: string;
    features: string[];
    useCases: string[];
    faqs: { question: string; answer: string }[];
    supportedFormats: string;
    relatedTools: string[];
};

export const toolContentMap: Record<string, ToolContent> = {
    // ═══════════════════════════════════════════════════════════════════════
    // MOST POPULAR TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    'compress-image': {
        about: 'Compress Image is a powerful online tool that reduces your image file size to any target — from 5 KB to 2 MB and beyond — without noticeable quality loss. Whether you need to meet strict upload limits for government forms, optimize images for faster website loading speeds, or shrink photos before emailing, this compressor handles JPG, PNG, WebP, and more. The intelligent compression algorithm balances file size reduction with visual quality, giving you full control through an intuitive quality slider. Processing happens securely in your browser for maximum privacy, with no installation, no signup, and completely free access.',
        features: [
            'Target any file size from 5 KB to 10 MB+ with precision control',
            'Smart lossy and lossless compression for JPG, PNG, and WebP',
            'Real-time preview with before/after file size comparison',
            'Batch compression for multiple images at once',
            'Maintains EXIF metadata or strips it for privacy',
        ],
        useCases: [
            'Students compressing ID photos to under 50 KB for exam applications',
            'Web developers optimizing hero images for faster Core Web Vitals scores',
            'Job applicants reducing resume photos to meet portal upload limits',
            'Social media managers preparing images for platform-specific size requirements',
        ],
        faqs: [
            { question: 'How much can I compress an image without losing quality?', answer: 'For JPEG images, you can typically reduce file size by 60-80% with minimal visible quality loss. PNG compression is lossless by default. Use the quality slider to find the perfect balance between size and clarity for your specific needs.' },
            { question: 'Can I compress an image to a specific file size like 20 KB or 100 KB?', answer: 'Yes! Enter your target file size in KB or MB, and our algorithm will automatically adjust compression to hit that exact target. This is perfect for government forms, exam portals, and job applications with strict size limits.' },
            { question: 'Is Compress Image free to use?', answer: 'Absolutely. PdfPixels Compress Image is 100% free with no registration, no watermarks, and no usage limits. Process as many images as you need.' },
            { question: 'What image formats are supported for compression?', answer: 'We support JPG/JPEG, PNG, WebP, GIF, BMP, TIFF, and HEIC formats. The compressed output is available in the same format or you can convert during compression.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC',
        relatedTools: ['resize-image', 'increase-image-size-in-kb', 'convert-dpi', 'png-to-jpeg'],
    },

    'resize-image': {
        about: 'Resize Image lets you change image dimensions precisely using pixels, centimeters, millimeters, or inches — perfect for print documents, social media posts, and official submissions. Choose from built-in presets for Instagram, Facebook, LinkedIn, YouTube thumbnails, and standard document sizes like A4 and Letter, or enter custom dimensions. The tool maintains aspect ratio by default to prevent distortion, with an option to override for exact sizing. Whether you need a 35×45mm passport photo, a 1080×1080 Instagram post, or a 4K wallpaper, Resize Image delivers pixel-perfect results instantly.',
        features: [
            'Resize in pixels, centimeters, millimeters, or inches with unit conversion',
            'Social media presets: Instagram, Facebook, Twitter, LinkedIn, YouTube',
            'Document presets: A4, Letter, Legal, passport photo sizes',
            'Lock/unlock aspect ratio with smart scaling',
            'Percentage-based resizing for proportional scaling',
        ],
        useCases: [
            'Creating passport-size photos (35×45mm) for visa and ID applications',
            'Designers preparing images for specific social media platform dimensions',
            'Photographers resizing prints for standard frame sizes',
            'Web developers creating responsive image variants for different breakpoints',
        ],
        faqs: [
            { question: 'How do I resize an image to exact pixel dimensions?', answer: 'Upload your image, select "Pixels" as the unit, enter your desired width and height, and click Resize. You can lock the aspect ratio to maintain proportions or unlock it for exact dimensions.' },
            { question: 'Can I resize an image in centimeters or inches for printing?', answer: 'Yes! Select CM, MM, or Inches as your unit, set the DPI (300 DPI recommended for print), and enter your desired dimensions. The tool automatically calculates the correct pixel values for crisp printing.' },
            { question: 'What social media presets are available?', answer: 'We include presets for Instagram (1080×1080 post, 1080×1920 story), Facebook (1200×630 link, 820×312 cover), Twitter (1600×900), LinkedIn (1200×627), YouTube (1280×720 thumbnail), and more.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC',
        relatedTools: ['compress-image', 'crop-image', 'convert-dpi', 'passport-size-photo'],
    },

    'remove-image-background': {
        about: 'Remove Background uses advanced AI-powered machine learning to instantly detect the subject in your photo and remove the background, producing a clean transparent PNG. The AI model accurately handles complex edges like hair, fur, and semi-transparent objects that manual editing would take hours to perfect. Ideal for creating product photography with white backgrounds, professional headshots, marketing materials, and social media graphics. The entire process takes just 10-30 seconds and works with photos of people, products, animals, and objects.',
        features: [
            'AI-powered edge detection for hair, fur, and complex boundaries',
            'Instant transparent PNG output with alpha channel',
            'Works with people, products, animals, and objects',
            'No manual selection or masking required',
            'High-resolution output up to 4096×4096 pixels',
        ],
        useCases: [
            'E-commerce sellers creating product photos with white/transparent backgrounds',
            'Job seekers making professional headshots for LinkedIn and resumes',
            'Graphic designers isolating subjects for composite images and marketing materials',
            'Social media creators making stickers, memes, and overlay graphics',
        ],
        faqs: [
            { question: 'How accurate is the AI background removal?', answer: 'Our AI model achieves over 95% accuracy on most images, including complex edges like hair and fur. It uses deep learning trained on millions of images to distinguish foreground subjects from backgrounds with precision.' },
            { question: 'Can I remove the background from product photos?', answer: 'Yes! The AI works excellently with product photography. Upload your product image and get a clean transparent PNG perfect for e-commerce listings on Amazon, Shopify, eBay, and other marketplaces.' },
            { question: 'What output format do I get after background removal?', answer: 'The output is always a PNG file with transparency (alpha channel). This allows you to place the subject on any background in design tools like Canva, Photoshop, or Figma.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC — Output: Transparent PNG',
        relatedTools: ['blur-background', 'increase-image-quality', 'compress-image', 'beautify-image'],
    },

    'passport-size-photo': {
        about: 'Passport Photo Maker creates compliant passport and ID photos for any country in the world — USA, UK, India, Canada, Australia, Schengen, and 100+ more. The tool auto-crops your face to official government dimensions (e.g., 35×45mm for most countries, 2×2 inches for US passport), ensures proper head positioning, and adjusts the background to meet submission requirements. Save money by creating your own passport photos at home instead of paying studio fees. Works with smartphone selfies and delivers print-ready results instantly.',
        features: [
            'Country-specific presets: USA (2×2 in), UK (35×45mm), India (35×45mm), and 100+ more',
            'Auto face detection and centering to meet official guidelines',
            'Print-ready output at 300+ DPI for photo printing',
            'Multiple photos on a single 4×6 or 6×4 print sheet',
            'Supports visa, ID card, and driving license photo sizes',
        ],
        useCases: [
            'Travelers creating passport photos at home for visa applications',
            'Students preparing ID photos for exam hall tickets and admissions',
            'HR departments generating employee ID badge photos',
            'Immigration consultants processing bulk passport photos for clients',
        ],
        faqs: [
            { question: 'What passport photo sizes are supported?', answer: 'We support 100+ country standards including US Passport (2×2 inches), Indian Passport (35×45mm), UK Passport (35×45mm), Canadian Passport (50×70mm), Schengen Visa (35×45mm), and many more. Each preset follows official government guidelines.' },
            { question: 'Can I print passport photos at home?', answer: 'Yes! The output is 300+ DPI print-ready. You can print on standard 4×6 inch photo paper at any pharmacy, photo shop, or home printer. We arrange multiple copies on a single sheet to save paper.' },
            { question: 'Will my passport photo be accepted by the government?', answer: 'Our tool follows official government specifications for dimensions, head size ratio, and positioning. However, final acceptance depends on additional factors like lighting, expression, and background. We recommend taking your photo against a plain white wall with even lighting.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC — Output: JPG at 300+ DPI',
        relatedTools: ['resize-image', 'compress-image', 'crop-image', 'remove-image-background'],
    },

    'image-to-pdf': {
        about: 'Image to PDF converts one or multiple images into a single, organized PDF document. Upload JPG, PNG, or WebP images, drag to reorder pages, choose your page size (A4, Letter, Legal, or fit-to-image), set orientation, and generate a professional PDF in seconds. Perfect for creating photo albums, document scans, portfolios, and multi-page reports from image files. The tool preserves image quality during conversion and supports both portrait and landscape orientations with smart auto-detection.',
        features: [
            'Convert multiple images to a single multi-page PDF',
            'Drag and drop to reorder pages before conversion',
            'Page size options: A4, Letter, Legal, A3, A5, and Fit to Image',
            'Auto-detect orientation or force portrait/landscape',
            'Image fit modes: contain (no crop) or fill (auto crop)',
        ],
        useCases: [
            'Students compiling scanned notes and assignments into a single PDF',
            'Professionals creating image-based reports and presentations',
            'Photographers building portfolio PDFs for clients',
            'Office workers digitizing receipts and documents into organized PDFs',
        ],
        faqs: [
            { question: 'How many images can I combine into one PDF?', answer: 'There is no hard limit on the number of images. You can combine dozens of images into a single PDF. For very large batches, we recommend keeping file sizes reasonable for faster processing.' },
            { question: 'Can I choose the page size for the PDF?', answer: 'Yes! Choose from A4, Letter, Legal, A3, A5, or "Fit to Image" which automatically sizes each page to match the image dimensions. You can also set portrait, landscape, or auto-detect orientation.' },
            { question: 'Will the image quality be preserved in the PDF?', answer: 'Yes, images are embedded at their original resolution. The output PDF maintains the full quality of your source images with no additional compression applied.' },
        ],
        supportedFormats: 'Input: JPG, JPEG, PNG, WebP, BMP — Output: PDF',
        relatedTools: ['compress-image', 'resize-image', 'merge-pdf', 'compress-pdf'],
    },

    'increase-image-size-in-kb': {
        about: 'Increase Image Size helps you enlarge an image\'s file size to meet minimum upload requirements — without visibly changing the image. Many government portals, exam registrations, and official forms require photos between specific file size ranges (e.g., 50 KB to 200 KB). If your compressed photo falls below the minimum threshold, this tool intelligently increases the file size by adjusting quality parameters and embedding metadata, ensuring the image passes upload validation while looking identical to the original.',
        features: [
            'Increase file size to any target in KB or MB',
            'Visual quality remains virtually identical to the original',
            'Works with JPG, PNG, and WebP formats',
            'Meets minimum file size requirements for government portals',
            'No visible artifacts or quality degradation added',
        ],
        useCases: [
            'Students uploading photos to exam portals with minimum size requirements (e.g., 50 KB)',
            'Government form submissions that reject files below a file size threshold',
            'Job applicants meeting strict photo specifications for recruitment portals',
            'Document submissions requiring images within a specific file size range',
        ],
        faqs: [
            { question: 'Why would I need to increase an image file size?', answer: 'Many government portals, exam registration sites, and official forms require photos within a specific file size range (e.g., 50 KB to 200 KB). If your image is too small, it gets rejected. This tool increases the file size to meet those minimum requirements.' },
            { question: 'Does increasing file size reduce quality?', answer: 'No. The tool increases file size through quality parameter adjustments that are virtually invisible to the human eye. Your image will look identical to the original at the larger file size.' },
            { question: 'Can I increase an image to an exact file size?', answer: 'Yes! Enter your target size in KB or MB and the tool will adjust the image to match that exact file size while preserving visual quality.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP',
        relatedTools: ['compress-image', 'resize-image', 'passport-size-photo', 'convert-dpi'],
    },

    'increase-image-quality': {
        about: 'AI Image Enhancer uses cutting-edge artificial intelligence to automatically improve photo quality — fixing poor lighting, sharpening blurry details, reducing noise and grain, and enhancing colors. Upload any low-quality, blurry, or poorly-lit photo and the AI model will analyze and enhance it in 10-30 seconds. The enhancement works on portraits, landscapes, product photos, old scanned photos, and screenshots. Perfect for restoring old family photos, improving smartphone shots, or preparing images for professional use.',
        features: [
            'AI-powered auto-enhancement for lighting, sharpness, and color',
            'Noise and grain reduction for old or low-light photos',
            'Detail sharpening without introducing artifacts',
            'Color correction and white balance adjustment',
            'Works on portraits, landscapes, products, and documents',
        ],
        useCases: [
            'Restoring old family photos and scanned vintage images',
            'Improving smartphone photos taken in poor lighting conditions',
            'Enhancing product photos for e-commerce listings',
            'Sharpening screenshots and presentation slides for clarity',
        ],
        faqs: [
            { question: 'How does AI image enhancement work?', answer: 'Our AI model analyzes your image to detect and fix common quality issues — underexposure, blur, noise, and color imbalance. It applies targeted corrections using deep learning trained on millions of high-quality reference images.' },
            { question: 'Can AI fix a very blurry image?', answer: 'AI can significantly improve mildly to moderately blurry images by reconstructing detail. However, severely blurred or extremely low-resolution images may have limited improvement potential as the original detail data is lost.' },
            { question: 'Is AI Image Enhancer free?', answer: 'Yes, it is completely free to use. There are no hidden costs, subscriptions, or watermarks. Upload and enhance as many images as you need.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['upscale-image', 'remove-image-background', 'beautify-image', 'convert-dpi'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BASIC EDITING TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    'crop-image': {
        about: 'Crop Image lets you trim and frame your photos with precision. Choose from preset aspect ratios (16:9, 4:3, 1:1, 3:2) or enter custom dimensions for exact cropping. The intuitive drag-and-drop crop area makes it easy to select exactly the region you want to keep. All processing happens directly in your browser — your images never leave your device, ensuring complete privacy. Perfect for removing unwanted edges, reframing compositions, and preparing images for specific platform dimensions.',
        features: ['Preset aspect ratios: 16:9, 4:3, 1:1, 3:2, and more', 'Custom dimension input for exact pixel cropping', 'Drag-and-drop crop area with handles', 'Client-side processing — images never uploaded', 'Real-time preview of cropped result'],
        useCases: ['Removing unwanted borders or distracting edges from photos', 'Cropping product images to consistent dimensions for e-commerce', 'Preparing social media posts with platform-specific aspect ratios', 'Reframing compositions to follow the rule of thirds'],
        faqs: [
            { question: 'Can I crop to an exact pixel size?', answer: 'Yes! Switch to custom mode and enter exact width and height in pixels. The crop area will lock to those dimensions, ensuring precision.' },
            { question: 'Is cropping done on my device or uploaded?', answer: 'All cropping is done 100% in your browser using client-side Canvas technology. Your images are never uploaded to any server, guaranteeing complete privacy.' },
            { question: 'Can I crop and maintain the original quality?', answer: 'Yes. Cropping only removes unwanted areas — the remaining pixels retain their original quality with no recompression.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['circle-crop', 'square-image-cropper', 'freehand-crop', 'resize-image'],
    },

    'circle-crop': {
        about: 'Circle Crop transforms any image into a perfectly circular shape with a transparent background. The tool automatically centers on the image and allows you to adjust the crop area to capture exactly the subject you want. The output is a PNG file with transparency, making it ideal for profile pictures, avatars, logo elements, and design components that need a clean circular frame without any background artifacts.',
        features: ['Perfect circle cropping with transparent background', 'Adjustable crop position and radius', 'PNG output with alpha channel for overlay use', 'Client-side processing for complete privacy', 'Works with any image size or aspect ratio'],
        useCases: ['Creating profile pictures for social media and messaging apps', 'Making circular avatars for websites and forums', 'Designing circular logo elements and icons', 'Preparing team member photos for company websites'],
        faqs: [
            { question: 'What format is the circle-cropped image?', answer: 'The output is PNG with transparency. Areas outside the circle are transparent, allowing the image to blend seamlessly onto any background.' },
            { question: 'Can I adjust where the circle crop is positioned?', answer: 'Yes, you can drag the crop area to position the circle exactly over the subject you want to keep, such as centering on a face for a profile picture.' },
        ],
        supportedFormats: 'Input: JPG, PNG, WebP — Output: Transparent PNG',
        relatedTools: ['crop-image', 'square-image-cropper', 'remove-image-background', 'resize-image'],
    },

    'square-image-cropper': {
        about: 'Square Crop creates perfect 1:1 square images from any photo. Ideal for Instagram posts, profile pictures, product thumbnails, and any context where a square format is required. The tool lets you position the crop area to capture the best part of your image while maintaining the exact 1:1 aspect ratio. Processing happens entirely in your browser for speed and privacy.',
        features: ['Perfect 1:1 square aspect ratio crop', 'Drag to position crop area on any part of the image', 'Client-side processing — instant results', 'Multiple output size options', 'No quality loss during cropping'],
        useCases: ['Preparing Instagram feed posts in square format', 'Creating uniform product thumbnails for online stores', 'Making square profile pictures for apps and websites', 'Standardizing image galleries with consistent square dimensions'],
        faqs: [
            { question: 'What size is the square output?', answer: 'The square output matches the smaller dimension of your original image by default. For example, a 1200×800 pixel image will produce an 800×800 square. You can also specify a custom square size.' },
            { question: 'Is this different from regular cropping with 1:1 ratio?', answer: 'It works similarly but is optimized for the square use case with a simpler interface. One click gives you a perfect square with no need to manually set aspect ratios.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['crop-image', 'circle-crop', 'resize-image', 'compress-image'],
    },

    'freehand-crop': {
        about: 'Freehand Crop lets you draw a custom shape to crop your image — no rectangles or circles required. Use your mouse or finger to trace any irregular shape, and the tool will cut out exactly that region with a transparent background. Perfect for isolating irregular objects, creating custom stickers, or cropping around specific elements in a photo without the limitations of rectangular cropping.',
        features: ['Draw any custom shape to define the crop area', 'Transparent background outside the drawn shape', 'Precision point editing for fine adjustments', 'PNG output with alpha channel', 'Undo/redo support for drawing corrections'],
        useCases: ['Isolating irregular-shaped objects from photos', 'Creating custom-shaped stickers and decals', 'Cropping around specific elements in group photos', 'Making custom-shaped design elements for presentations'],
        faqs: [
            { question: 'How do I draw the freehand crop area?', answer: 'Click and drag your mouse (or use your finger on touch screens) to trace the outline of the area you want to keep. When you release, the shape closes automatically and everything outside is removed.' },
            { question: 'Can I edit the shape after drawing it?', answer: 'Yes, you can adjust control points after drawing to fine-tune the crop boundary. Use undo/redo to correct mistakes.' },
        ],
        supportedFormats: 'Input: JPG, PNG, WebP — Output: Transparent PNG',
        relatedTools: ['crop-image', 'circle-crop', 'remove-image-background', 'censor-photo'],
    },

    'rotate-image': {
        about: 'Rotate Image turns your photos by any angle — 90°, 180°, 270°, or any custom degree. Fix sideways or upside-down photos from your camera, align scanned documents, or create artistic tilted compositions. The rotation is precise and maintains full image quality. Processing happens instantly in your browser with no uploads or waiting.',
        features: ['Quick rotate: 90° clockwise, counterclockwise, 180°', 'Custom angle rotation with degree input', 'Maintains original image quality', 'Client-side processing for instant results', 'Works with all common image formats'],
        useCases: ['Fixing sideways phone photos and camera images', 'Aligning scanned documents and receipts', 'Creating tilted artistic compositions', 'Correcting orientation before uploading to websites'],
        faqs: [
            { question: 'Can I rotate by a specific custom angle like 15 degrees?', answer: 'Yes! Enter any angle from 0 to 360 degrees for precise rotation. The image canvas will automatically adjust to accommodate the rotated content.' },
            { question: 'Does rotation reduce image quality?', answer: 'For 90°, 180°, and 270° rotations, quality is perfectly preserved. Custom angle rotations use high-quality interpolation that maintains near-original quality.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['flip-image', 'crop-image', 'resize-image', 'straighten-image'],
    },

    'flip-image': {
        about: 'Flip Image mirrors your photos horizontally (left-right) or vertically (top-bottom) with a single click. Create mirror reflections, fix reversed selfies, or prepare images for printing transfers. The flip operation is lossless — every pixel is preserved, just rearranged. Processing is instant and happens entirely in your browser.',
        features: ['Horizontal flip (mirror left to right)', 'Vertical flip (mirror top to bottom)', 'Lossless operation — zero quality loss', 'Instant client-side processing', 'Combine with rotation for full orientation control'],
        useCases: ['Fixing mirrored selfies from front-facing cameras', 'Creating symmetrical designs and reflections', 'Preparing images for T-shirt iron-on transfers', 'Correcting orientation from flatbed scanner captures'],
        faqs: [
            { question: 'What is the difference between flip and rotate?', answer: 'Flip creates a mirror image (reversing left-right or top-bottom), while rotate turns the entire image around its center point. Use flip for mirroring and rotate for orientation changes.' },
            { question: 'Does flipping reduce quality?', answer: 'No. Flipping is a lossless pixel rearrangement with absolutely no quality loss. Every pixel is preserved.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['rotate-image', 'crop-image', 'resize-image'],
    },

    'watermark-image': {
        about: 'Add Watermark places custom text or image watermarks on your photos to protect your intellectual property and brand your images. Customize the font, size, color, opacity, position, and rotation of your watermark. Perfect for photographers protecting portfolio images, businesses branding marketing materials, and content creators claiming ownership of their visual content.',
        features: ['Text watermark with custom font, size, color, and opacity', 'Image watermark overlay with position and scaling control', 'Adjustable opacity from subtle to prominent', 'Multiple positioning options: center, corners, tile pattern', 'Rotation control for diagonal watermarks'],
        useCases: ['Photographers watermarking portfolio images before sharing online', 'Businesses adding brand logos to marketing and social media visuals', 'Real estate agents branding property listing photos', 'Content creators protecting original artwork and designs'],
        faqs: [
            { question: 'Can I use my own logo as a watermark?', answer: 'Yes! Upload any PNG or JPG image as a watermark. PNG with transparent background works best for logo overlays. You can adjust the size, position, and opacity.' },
            { question: 'Can I add a tiled watermark pattern?', answer: 'Yes, choose the "Tile" positioning option to repeat your watermark across the entire image in a diagonal pattern — commonly used by stock photography sites.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['add-text-to-image', 'add-logo-to-image', 'compress-image', 'resize-image'],
    },

    'add-text-to-image': {
        about: 'Add Text to Image places custom text on your photos with full control over font, size, color, position, and effects. Choose from dozens of web fonts, add text shadows, outlines, and backgrounds for readability. Create social media quotes, memes, announcements, event invitations, and captioned photos without needing design software.',
        features: ['Dozens of premium Google Fonts to choose from', 'Custom font size, color, and opacity', 'Text effects: shadow, outline, background highlight', 'Precise drag-and-drop positioning', 'Multiple text layers on a single image'],
        useCases: ['Creating quote graphics for social media', 'Adding captions and labels to photos', 'Making event invitations and announcements', 'Building memes and captioned images'],
        faqs: [
            { question: 'Can I add multiple text elements to one image?', answer: 'Yes! Add as many text layers as you need, each with different fonts, sizes, colors, and positions.' },
            { question: 'What fonts are available?', answer: 'We offer dozens of Google Fonts including popular choices like Inter, Roboto, Playfair Display, Montserrat, and more. All fonts are free for commercial use.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['watermark-image', 'add-logo-to-image', 'resize-image'],
    },

    'add-logo-to-image': {
        about: 'Add Logo to Image overlays your brand logo on photos with precise control over position, size, and opacity. Upload any logo (PNG with transparency recommended), place it anywhere on your image, adjust the scale and transparency, and download the branded result. Ideal for businesses, agencies, and content creators who need to brand images consistently.',
        features: ['Upload any logo image (PNG transparency supported)', 'Precise position control: drag or choose preset positions', 'Adjustable scale and opacity for subtle to bold branding', 'Maintains logo quality during overlay', 'Client-side processing for privacy'],
        useCases: ['Branding social media images with company logos', 'Adding agency watermarks to client deliverables', 'Placing sponsor logos on event photos', 'Creating branded product images for e-commerce'],
        faqs: [
            { question: 'What logo format works best?', answer: 'PNG files with a transparent background produce the best results. The transparent areas will show the underlying image, giving a professional overlay appearance.' },
            { question: 'Can I adjust the logo transparency?', answer: 'Yes, use the opacity slider to make the logo as subtle or prominent as you like — from nearly invisible to fully opaque.' },
        ],
        supportedFormats: 'Image: JPG, PNG, WebP — Logo: PNG (transparent), JPG',
        relatedTools: ['watermark-image', 'add-text-to-image', 'resize-image'],
    },

    'join-images-online': {
        about: 'Join Images combines multiple images side by side (horizontal) or stacked (vertical) into a single image. Perfect for creating before/after comparisons, photo collages, panoramic composites, and multi-image layouts. The tool automatically aligns images and lets you control spacing, background color, and output dimensions.',
        features: ['Horizontal and vertical joining modes', 'Custom spacing (gap) between images', 'Background color selection for gaps', 'Auto-resize to match largest or smallest image', 'Support for combining 2-10+ images at once'],
        useCases: ['Creating before/after comparison images', 'Building photo collages for social media', 'Combining screenshots for tutorials and documentation', 'Making panoramic composite images from multiple shots'],
        faqs: [
            { question: 'Can I combine more than 2 images?', answer: 'Yes! You can join multiple images at once — just upload all the images you want to combine and arrange them in your preferred order.' },
            { question: 'What if my images are different sizes?', answer: 'The tool can auto-resize images to match. You can choose to scale all images to the height (for horizontal joining) or width (for vertical stacking) of the largest or smallest image.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['image-splitter', 'crop-image', 'resize-image', 'compress-image'],
    },

    'image-splitter': {
        about: 'Split Image divides a single image into a grid of equal parts — 2×2, 3×3, 4×4, or any custom grid. Perfect for creating Instagram carousel grids, puzzle pieces, print layouts, and design elements. Each split piece is saved as a separate image file, ready to upload. The tool handles the math automatically, ensuring each piece is exactly the same size.',
        features: ['Custom grid sizes: 2×2, 3×3, 4×4, and custom rows/columns', 'Automatic equal-size splitting', 'Individual download of each piece or download all as ZIP', 'Numbered pieces for easy reassembly', 'Preview grid lines before splitting'],
        useCases: ['Creating Instagram grid layouts for panoramic posts', 'Splitting large images for multi-panel printing', 'Making puzzle pieces from photos', 'Dividing maps or diagrams into printable sections'],
        faqs: [
            { question: 'Can I create a 3×3 Instagram grid from one image?', answer: 'Yes! Select 3 rows × 3 columns, upload your panoramic or portrait image, and the tool will split it into 9 equal pieces — perfect for Instagram\'s grid layout.' },
            { question: 'Are the split pieces downloadable individually?', answer: 'Yes, you can download each piece separately or download all pieces at once as a ZIP file. Each piece is numbered for easy ordering when uploading.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['join-images-online', 'crop-image', 'resize-image'],
    },

    'color-code-from-image': {
        about: 'Image Color Picker extracts exact color codes from any image — click anywhere on your photo to get the HEX, RGB, and HSL values of that pixel. Build color palettes from photos, match brand colors, or identify specific colors for your design projects. The tool shows a magnified view for precise pixel-level color picking and lets you copy codes with a single click.',
        features: ['Extract HEX, RGB, and HSL color codes', 'Magnified pixel view for precise selection', 'One-click copy to clipboard', 'Color history for recently picked colors', 'Works with any image format'],
        useCases: ['Designers matching brand colors from reference images', 'Web developers extracting exact colors for CSS', 'Artists building color palettes from photographs', 'Marketers ensuring consistent brand color usage'],
        faqs: [
            { question: 'What color formats are provided?', answer: 'For each selected pixel, you get the color in HEX (#FF5733), RGB (rgb(255, 87, 51)), and HSL (hsl(14, 100%, 60%)) formats. Click to copy any format to your clipboard.' },
            { question: 'Can I build a palette from an image?', answer: 'Yes, pick multiple colors from your image to build a palette. Each picked color is saved in the color history, allowing you to compare and export your palette.' },
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP, SVG',
        relatedTools: ['grayscale-image', 'sepia-filter', 'invert-image-colors'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECTS & FILTERS
    // ═══════════════════════════════════════════════════════════════════════
    'blur-image': {
        about: 'Blur Image applies smooth Gaussian blur to your entire photo with adjustable intensity. Use it to create dreamy soft-focus backgrounds, obscure sensitive information, generate depth-of-field effects, or prepare images for use as website background textures. The intensity slider gives you precise control from a subtle soft glow to a heavy artistic blur.',
        features: ['Adjustable Gaussian blur intensity from subtle to heavy', 'Real-time preview of blur effect', 'Client-side processing for instant results', 'Works on entire image uniformly', 'No quality degradation beyond the intended blur effect'],
        useCases: ['Creating soft background images for websites and presentations', 'Obscuring sensitive information in screenshots', 'Producing dreamy, artistic portrait effects', 'Making blurred textures for graphic design'],
        faqs: [{ question: 'Can I blur only part of the image?', answer: 'This tool blurs the entire image uniformly. For selective area blurring, try our Blur Face or Censor Photo tools which target specific regions.' }, { question: 'What is Gaussian blur?', answer: 'Gaussian blur is a smooth, natural-looking blur that averages pixels using a bell-curve (Gaussian) distribution. It produces a soft, optically realistic out-of-focus effect.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-background', 'blur-face', 'motion-blur', 'censor-photo'],
    },
    'blur-background': {
        about: 'Blur Background uses AI to automatically detect the main subject in your photo and blur only the background, creating a professional portrait-mode depth-of-field effect. The subject remains perfectly sharp while the background gets a beautiful bokeh-style blur. Perfect for turning ordinary smartphone photos into professional-looking portraits, product shots, and headshots.',
        features: ['AI-powered subject detection and segmentation', 'Adjustable background blur intensity', 'Subject remains perfectly sharp', 'Natural bokeh-style depth of field effect', 'Works with people, products, and animals'],
        useCases: ['Creating professional portrait-mode photos from regular smartphone shots', 'Enhancing product photography with isolated subject focus', 'Making professional headshots for LinkedIn and corporate profiles', 'Blurring distracting backgrounds in video call screenshots'],
        faqs: [{ question: 'How does AI detect the subject?', answer: 'Our AI model uses deep learning semantic segmentation to identify and separate the foreground subject from the background. It works accurately with people, animals, and products.' }, { question: 'Can I control how much the background is blurred?', answer: 'Yes! Use the blur intensity slider to adjust from a subtle soft focus to a heavy bokeh effect.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['remove-image-background', 'blur-image', 'blur-face', 'beautify-image'],
    },
    'blur-face': {
        about: 'Blur Face uses AI face detection to automatically find and blur all faces in your photo for privacy protection. The tool detects faces at various angles, sizes, and positions, then applies a customizable blur to each face while keeping the rest of the image sharp. Essential for complying with privacy regulations (GDPR, CCPA) when sharing photos that contain identifiable people.',
        features: ['AI auto-detection of multiple faces in a single image', 'Adjustable blur intensity per face', 'Detects faces at various angles and sizes', 'GDPR/CCPA privacy compliance', 'Non-destructive — original areas outside faces remain sharp'],
        useCases: ['Anonymizing people in street photography and public photos', 'Complying with GDPR privacy requirements for face data', 'Blurring faces in real estate listing photos', 'Protecting identities in documentary and journalistic photography'],
        faqs: [{ question: 'How many faces can it detect at once?', answer: 'The AI can detect and blur multiple faces in a single image — there is no practical limit. It works with front-facing, profile, and partially obscured faces.' }, { question: 'Is this GDPR compliant?', answer: 'Blurring faces helps meet GDPR requirements for anonymizing personal data in images. For full compliance, ensure faces are sufficiently blurred to be unrecognizable.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['censor-photo', 'blur-background', 'blur-image', 'pixelate-image'],
    },
    'pixelate-image': {
        about: 'Pixelate Image adds a mosaic/pixelation effect to your entire photo. The tool enlarges pixel blocks to create the classic censorship mosaic effect or a retro pixel-art aesthetic. Adjust the pixel block size from subtle to heavy pixelation. Commonly used for censoring sensitive content, creating retro visuals, and anonymizing information in screenshots.',
        features: ['Adjustable pixel block size for censoring or artistic effects', 'Real-time preview of pixelation level', 'Client-side processing for privacy', 'Works on entire image', 'No quality loss beyond intended pixelation'],
        useCases: ['Censoring sensitive information in screenshots and documents', 'Creating retro pixel-art aesthetic for design projects', 'Anonymizing license plates and identifiers in photos', 'Adding mosaic effects for creative purposes'],
        faqs: [{ question: 'Can I pixelate only a specific area?', answer: 'This tool pixelates the entire image. For selective area pixelation, use our Censor Photo tool which lets you draw rectangles over specific areas.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-image', 'censor-photo', 'picture-to-pixel-art', 'grayscale-image'],
    },
    'grayscale-image': {
        about: 'Grayscale Image converts any color photo into professional-looking grayscale tones. The tool removes all color information while preserving luminance detail, producing smooth tonal transitions. Ideal for creating professional document photos, artistic black-and-white aesthetics, and preparing images for monochrome printing.',
        features: ['Professional grayscale conversion with smooth tonal range', 'Preserves original luminance detail and contrast', 'Client-side processing for instant results', 'No color banding or artifacts', 'Works with all major image formats'],
        useCases: ['Creating professional grayscale document photos', 'Artistic monochrome photography processing', 'Preparing images for monochrome laser printing', 'Reducing visual noise for cleaner document scans'],
        faqs: [{ question: 'What is the difference between grayscale and black & white?', answer: 'Grayscale contains full range of gray tones from white to black (256 shades). Black & White uses only pure black and pure white with a threshold — no gray tones.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['turn-image-to-black-and-white', 'sepia-filter', 'invert-image-colors'],
    },
    'turn-image-to-black-and-white': {
        about: 'Black & White converter transforms your photos into high-contrast two-tone images using only pure black and pure white pixels. Adjust the threshold to control where the cutoff falls between dark and light areas. Perfect for creating dramatic silhouettes, preparing images for laser engraving, making stencils, and producing high-contrast artistic prints.',
        features: ['Adjustable threshold for black/white cutoff point', 'High-contrast two-tone output', 'Real-time threshold preview', 'Ideal for stencil and laser engraving preparation', 'Client-side processing'],
        useCases: ['Creating stencils and templates for crafting', 'Preparing images for laser engraving and CNC cutting', 'Making dramatic black and white artistic prints', 'Converting logos and line art to pure monochrome'],
        faqs: [{ question: 'How does threshold control work?', answer: 'The threshold determines the brightness level at which pixels become black vs white. Lower threshold = more white areas, higher threshold = more black areas.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['grayscale-image', 'sepia-filter', 'invert-image-colors'],
    },
    'sepia-filter': {
        about: 'Sepia Filter applies a warm, vintage brownish tone to your photos — reminiscent of aged photographs from the early 20th century. The effect adds a nostalgic, timeless quality to modern digital images. Adjust the intensity to go from a subtle warm tint to a fully saturated vintage sepia look.',
        features: ['Adjustable sepia intensity from subtle to full vintage', 'Warm brownish tone for nostalgic aesthetic', 'Preserves image detail and contrast', 'Client-side processing for instant results', 'Works with all common image formats'],
        useCases: ['Adding vintage aesthetics to modern photographs', 'Creating nostalgic social media and blog post visuals', 'Preparing images for retro-themed design projects', 'Simulating aged photograph styles for creative work'],
        faqs: [{ question: 'Can I adjust the sepia intensity?', answer: 'Yes! Use the intensity slider to control how strong the sepia effect is — from a subtle warm tint to a fully vintage look.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['grayscale-image', 'turn-image-to-black-and-white', 'invert-image-colors'],
    },
    'invert-image-colors': {
        about: 'Invert Colors creates a photographic negative by reversing all color values in your image. Each pixel\'s color is replaced with its complementary opposite — white becomes black, red becomes cyan, blue becomes yellow. Useful for creating artistic effects, analyzing images, and producing negatives.',
        features: ['Full RGB color inversion to create negative images', 'One-click instant inversion', 'Client-side processing', 'Works with both color and grayscale images', 'Reversible — invert again to get original back'],
        useCases: ['Creating artistic negative and psychedelic effects', 'Analyzing X-rays and medical images', 'Producing design elements with inverted color schemes', 'Comparing original and negative versions for detail inspection'],
        faqs: [{ question: 'Is color inversion reversible?', answer: 'Yes! Inverting an already-inverted image returns it to the original colors. Color inversion is a perfectly reversible, lossless operation.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['grayscale-image', 'sepia-filter', 'turn-image-to-black-and-white'],
    },
    'motion-blur': {
        about: 'Motion Blur adds a directional blur effect that simulates the appearance of movement in your photographs. Adjust the angle and intensity to create dynamic action shots, speed lines, and artistic motion trails. The effect works great for sports photography, car shots, and abstract art.',
        features: ['Adjustable blur angle for any direction of motion', 'Intensity control from subtle to dramatic', 'Simulates realistic camera pan and motion effects', 'Client-side processing for instant preview', 'Works with all common image formats'],
        useCases: ['Adding sense of speed and action to sports photos', 'Creating dynamic car and vehicle motion shots', 'Making abstract art with directional movement effects', 'Simulating camera pan effects for cinematic look'],
        faqs: [{ question: 'Can I control the direction of the motion blur?', answer: 'Yes! Set the angle in degrees to control the direction — 0° for horizontal, 90° for vertical, or any custom angle for diagonal motion effects.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-image', 'blur-background', 'pixelate-image'],
    },
    'censor-photo': {
        about: 'Censor Photo lets you hide sensitive areas of images using blur, pixelation, or solid black bars. Draw rectangles over the content you want to censor — personal information, license plates, faces, or any private data. Essential for journalists, bloggers, HR departments, and anyone sharing images that contain sensitive information.',
        features: ['Multiple censor styles: blur, pixelate, or black bar', 'Draw rectangles over areas to censor', 'Adjustable intensity for blur and pixelation', 'Multiple censor regions on one image', 'Client-side processing — images never leave your device'],
        useCases: ['Redacting personal information from document screenshots', 'Censoring license plates and addresses in photos', 'Blurring sensitive content for blog posts and articles', 'Hiding confidential data in business presentations'],
        faqs: [{ question: 'Is the censored content truly hidden?', answer: 'Yes, when you download the censored image, the hidden areas are permanently obscured. The original pixel data beneath the censoring is destroyed in the output file.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-face', 'pixelate-image', 'blur-image'],
    },
    'picture-to-pixel-art': {
        about: 'Pixel Art Converter transforms any photograph into retro-style pixel art reminiscent of classic 8-bit and 16-bit video games. Adjust the pixel size and color palette to create anything from subtle low-res effects to bold retro masterpieces. Perfect for creating game assets, retro-themed profile pictures, and nostalgic social media content.',
        features: ['Adjustable pixel block size for fine to coarse pixel art', 'Color palette reduction for authentic retro look', 'Real-time preview of pixel art conversion', 'Client-side processing for instant results', 'Export as PNG for crisp pixel edges'],
        useCases: ['Creating retro game-style profile pictures and avatars', 'Making 8-bit style art from real photographs', 'Designing pixel art assets for indie games', 'Producing nostalgic retro content for social media'],
        faqs: [{ question: 'Can I control the level of pixelation?', answer: 'Yes! Adjust the pixel size to control how blocky the result is. Larger pixels create a more retro 8-bit look, while smaller pixels produce a subtler effect.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['pixelate-image', 'grayscale-image', 'resize-image'],
    },
    'beautify-image': {
        about: 'Beautify Image uses AI to enhance portrait photos automatically — smoothing skin texture, brightening under-eye areas, balancing facial lighting, and subtly improving overall appearance. The AI applies natural-looking retouching that enhances without creating an artificial look. Perfect for preparing profile photos, headshots, and portrait images for professional use.',
        features: ['AI skin smoothing with natural texture preservation', 'Under-eye brightening and blemish reduction', 'Facial lighting balance and color correction', 'Natural, non-artificial enhancement results', 'Works on selfies, portraits, and group photos'],
        useCases: ['Preparing professional headshots for LinkedIn', 'Enhancing selfies for social media posting', 'Retouching wedding and event photos', 'Improving passport and ID photos'],
        faqs: [{ question: 'Does it look artificial?', answer: 'No. Our AI applies subtle, natural-looking enhancements that improve appearance while preserving skin texture. The result looks like professional photography, not heavy editing.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['retouch-photo', 'increase-image-quality', 'remove-image-background'],
    },
    'retouch-photo': {
        about: 'Retouch Photo uses AI to automatically detect and remove skin blemishes, spots, acne marks, and small imperfections from portrait photos. The AI intelligently fills removed areas with surrounding skin texture for a flawless, natural result. Unlike manual retouching that takes hours, this tool delivers professional results in seconds.',
        features: ['AI-powered blemish and spot detection', 'Automatic removal with natural texture fill', 'Preserves skin pores and natural texture', 'Works on acne, marks, spots, and small scars', 'Professional retouching in seconds'],
        useCases: ['Removing acne and blemishes from portrait photos', 'Cleaning up professional headshots', 'Retouching senior and graduation portraits', 'Preparing skin for beauty and fashion photography'],
        faqs: [{ question: 'Can it remove large scars or tattoos?', answer: 'The tool is optimized for small blemishes, spots, and marks. Very large areas may not be fully removed and could benefit from professional editing software.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['beautify-image', 'increase-image-quality', 'remove-image-background'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DPI & QUALITY
    // ═══════════════════════════════════════════════════════════════════════
    'convert-dpi': {
        about: 'DPI Converter changes the resolution (DPI — dots per inch) of your images for print or digital use. Check your current DPI, then convert to standard values like 72 DPI (web), 150 DPI (draft print), 300 DPI (high-quality print), or 600 DPI (professional print). Essential for ensuring your images meet print shop requirements and document submission guidelines.',
        features: ['Check current image DPI/PPI information', 'Convert to standard DPI: 72, 96, 150, 200, 300, 600', 'Custom DPI input for non-standard requirements', 'Option to resample or just update metadata', 'Supports print and web DPI standards'],
        useCases: ['Preparing images for professional printing at 300 DPI', 'Meeting publisher and print shop DPI requirements', 'Converting web images (72 DPI) to print quality', 'Checking DPI of received images before printing'],
        faqs: [{ question: 'What DPI should I use for printing?', answer: '300 DPI is the standard for high-quality photo printing. 150 DPI for large format posters. 600 DPI for fine art and professional publications.' }, { question: 'Does changing DPI change the file size?', answer: 'If you resample, pixel dimensions change and so does file size. If you only update DPI metadata, file size stays the same.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, TIFF, BMP',
        relatedTools: ['resize-image', 'compress-image', 'upscale-image', 'increase-image-quality'],
    },
    'upscale-image': {
        about: 'AI Upscale Image increases your photo resolution by 2x or 4x using advanced AI super-resolution technology. Unlike traditional upscaling that produces blurry results, our AI reconstructs fine details, sharpens edges, and fills in missing information. Perfect for enlarging old photos, low-resolution downloads, screenshots, and small product images.',
        features: ['AI-powered 2x and 4x resolution increase', 'Detail reconstruction and edge sharpening', 'No pixelation or blurriness in upscaled output', 'Works on photos, illustrations, and screenshots', 'Preserves color accuracy and natural appearance'],
        useCases: ['Enlarging old family photos for large format printing', 'Upscaling product thumbnails for high-resolution displays', 'Increasing resolution of downloaded web images', 'Preparing low-resolution images for print materials'],
        faqs: [{ question: 'How does AI upscaling work?', answer: 'Our AI uses deep learning super-resolution to analyze existing pixels and predict what additional detail should exist at higher resolution, effectively filling in missing information.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP',
        relatedTools: ['increase-image-quality', 'convert-dpi', 'resize-image', 'compress-image'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FORMAT CONVERSION
    // ═══════════════════════════════════════════════════════════════════════
    'png-to-jpeg': {
        about: 'PNG to JPEG converts your PNG images to the widely compatible JPEG format with adjustable quality. JPEG files are typically 5-10x smaller than PNG because they use lossy compression — ideal when you need smaller file sizes and don\'t require transparency. Perfect for uploading photos to websites, social media, and email attachments.',
        features: ['Adjustable JPEG quality from 1-100%', 'Significant file size reduction (5-10x smaller)', 'Custom background color for transparent PNGs', 'Preserves EXIF metadata', 'Batch conversion support'],
        useCases: ['Reducing large PNG screenshot file sizes for web upload', 'Converting PNG photos to JPEG for email attachments', 'Preparing images for platforms that require JPEG format', 'Batch converting design exports to web-friendly JPEG'],
        faqs: [{ question: 'What happens to transparency when converting PNG to JPEG?', answer: 'JPEG does not support transparency. Transparent areas will be filled with a solid color (white by default). You can choose a custom background color.' }, { question: 'What quality setting should I use?', answer: '80-85% offers excellent balance between file size and visual quality. Use 90-100% for prints. Use 60-75% for web thumbnails.' }],
        supportedFormats: 'Input: PNG — Output: JPG/JPEG',
        relatedTools: ['jpeg-to-png', 'webp-to-jpg', 'compress-image', 'resize-image'],
    },
    'jpeg-to-png': {
        about: 'JPEG to PNG converts your JPEG/JPG images to lossless PNG format. PNG preserves every pixel without compression artifacts and supports transparency. Essential when you need lossless quality for graphic design, when adding transparent backgrounds, or when working with images that require precise pixel-level accuracy.',
        features: ['Lossless conversion preserving every pixel', 'PNG transparency support', 'No additional compression artifacts introduced', 'Ideal for design and illustration workflows', 'Batch conversion support'],
        useCases: ['Preparing images for design work requiring lossless quality', 'Converting photos before adding transparent backgrounds', 'Archiving important images in lossless format', 'Converting product photos for design software workflows'],
        faqs: [{ question: 'Will the PNG file be larger than the JPEG?', answer: 'Yes, typically 2-10x larger. PNG uses lossless compression while JPEG uses lossy compression. The larger file size is the trade-off for perfect quality.' }],
        supportedFormats: 'Input: JPG/JPEG — Output: PNG',
        relatedTools: ['png-to-jpeg', 'remove-image-background', 'compress-image'],
    },
    'webp-to-jpg': {
        about: 'WebP to JPG converts Google\'s WebP format to universally compatible JPEG. WebP is widely used on the web for its small file sizes but isn\'t supported by all software and older devices. Convert to JPG for maximum compatibility across all image viewers, editors, social media, and print services.',
        features: ['Converts WebP to universally compatible JPEG', 'Adjustable JPEG quality output', 'Handles both lossy and lossless WebP inputs', 'Preserves image dimensions and color accuracy', 'Batch conversion support'],
        useCases: ['Making web-downloaded WebP images compatible with older software', 'Converting WebP screenshots for sharing', 'Preparing WebP images for print services', 'Opening WebP files on devices that lack support'],
        faqs: [{ question: 'Why can\'t I open WebP files on my computer?', answer: 'WebP is a newer Google format. While modern browsers support it, some older image viewers don\'t. Converting to JPEG ensures compatibility with virtually all software.' }],
        supportedFormats: 'Input: WebP — Output: JPG/JPEG',
        relatedTools: ['png-to-jpeg', 'heic-to-jpg', 'compress-image'],
    },
    'heic-to-jpg': {
        about: 'HEIC to JPG converts iPhone\'s HEIC/HEIF photo format to standard JPEG that works everywhere. Since iOS 11, Apple devices save photos in HEIC format — a newer format that offers better compression but isn\'t universally supported on Windows, Android, and many websites. Convert your iPhone photos to JPG for easy sharing, uploading, and editing.',
        features: ['Converts Apple HEIC/HEIF to standard JPEG', 'Adjustable output quality', 'Preserves EXIF metadata from iPhone photos', 'Handles Live Photo stills and burst shots', 'Batch conversion for multiple HEIC files'],
        useCases: ['Converting iPhone photos for sharing with Android and Windows users', 'Uploading HEIC photos to websites that only accept JPEG', 'Preparing iPhone photos for editing in non-Apple software', 'Converting bulk iPhone photo libraries to JPEG'],
        faqs: [{ question: 'Why does my iPhone save photos as HEIC?', answer: 'Since iOS 11, iPhones use HEIC by default because it produces smaller files than JPEG at the same quality. You can change this in Settings > Camera > Formats.' }],
        supportedFormats: 'Input: HEIC, HEIF — Output: JPG/JPEG',
        relatedTools: ['webp-to-jpg', 'png-to-jpeg', 'compress-image'],
    },
    'image-to-text': {
        about: 'Image to Text (OCR) extracts readable text from images using Optical Character Recognition supporting 100+ languages. Upload a photo of a document, receipt, whiteboard, or sign, and the OCR engine will recognize and output editable, copyable text. Supports printed and handwritten text in Latin, Cyrillic, Chinese, Japanese, Korean, Arabic, Hindi, and more.',
        features: ['OCR text extraction supporting 100+ languages', 'Recognizes printed text, signs, documents, and receipts', 'Multiple script support: Latin, Cyrillic, CJK, Arabic, Devanagari', 'Copy extracted text to clipboard with one click', 'Client-side processing using Tesseract.js'],
        useCases: ['Digitizing printed documents and paper forms', 'Extracting text from photos of whiteboards', 'Converting receipt photos to text for expense tracking', 'Making text in images searchable and editable'],
        faqs: [{ question: 'What languages are supported?', answer: 'We support 100+ languages including English, Spanish, French, German, Chinese, Japanese, Korean, Hindi, Arabic, Russian, and many more.' }, { question: 'Is my document data safe?', answer: 'Completely safe. OCR processing happens entirely in your browser using Tesseract.js. Your images are never uploaded to any server.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, BMP, TIFF',
        relatedTools: ['compress-image', 'resize-image', 'convert-dpi'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SIGNATURE TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    'generate-signature': {
        about: 'Signature Maker lets you create professional digital signatures by drawing, typing, or uploading. Draw your signature with mouse or touch, type your name and choose from signature fonts, or upload a handwritten signature image. Export as transparent PNG for use in PDFs, documents, emails, and contracts. No registration needed — completely free and private.',
        features: ['Draw signatures with mouse, stylus, or finger', 'Type-to-signature with multiple handwriting fonts', 'Upload existing signature images', 'Export as transparent PNG', 'Adjustable pen color and stroke width'],
        useCases: ['Creating digital signatures for PDF documents', 'Generating email signature images', 'Making consistent signatures for contracts and agreements', 'Creating stylized name signatures for branding'],
        faqs: [{ question: 'Can I use this signature on legal documents?', answer: 'The tool creates a visual signature image. Legal validity of digital signatures depends on your jurisdiction and the document type. For legally binding e-signatures, consider dedicated e-signature platforms like DocuSign.' }, { question: 'What format is the signature output?', answer: 'Transparent PNG — perfect for overlaying on documents, PDFs, and emails without a white box background.' }],
        supportedFormats: 'Output: Transparent PNG',
        relatedTools: ['resize-signature', 'merge-photo-and-signature', 'add-text-to-image'],
    },
    'resize-signature': {
        about: 'Resize Signature lets you resize your digital signature to exact dimensions required by applications, forms, and documents. Common presets include 6cm × 2cm (Indian government forms), 3.5cm × 1.5cm, and custom sizes. Enter dimensions in pixels, cm, or mm for precise results. Maintains signature clarity at any size.',
        features: ['Preset sizes: 6×2cm, 3.5×1.5cm, and more', 'Custom dimensions in pixels, cm, or mm', 'Maintains signature clarity and sharpness', 'Supports transparent PNG input/output', 'DPI-aware sizing for print'],
        useCases: ['Resizing signatures for Indian government exam forms (6×2cm)', 'Preparing signature images for job applications', 'Matching exact signature size requirements for official documents', 'Scaling signatures for different document types'],
        faqs: [{ question: 'What size should my signature be for government forms?', answer: 'Most Indian government forms require 6cm × 2cm. Check your specific form requirements. Enter the dimensions and the tool will resize precisely.' }],
        supportedFormats: 'Input: PNG, JPG — Output: PNG, JPG',
        relatedTools: ['generate-signature', 'merge-photo-and-signature', 'resize-image'],
    },
    'merge-photo-and-signature': {
        about: 'Merge Photo & Signature combines your passport-size photo and signature into a single composite image — a common requirement for Indian government exam applications, job forms, and official submissions. Upload both images, position them, and download the merged result meeting exact specifications.',
        features: ['Combine photo and signature into one image', 'Adjustable positioning and spacing', 'Common layout presets for exam forms', 'Supports transparent signature overlays', 'Output in required dimensions'],
        useCases: ['Indian government exam applications (SSC, UPSC, Banking)', 'Job application forms requiring photo+signature composite', 'University admission forms', 'Official document submissions'],
        faqs: [{ question: 'What layout is used?', answer: 'The standard layout places the passport photo on top and signature below, matching the common format required by Indian government exam applications.' }],
        supportedFormats: 'Input: JPG, PNG — Output: JPG, PNG',
        relatedTools: ['generate-signature', 'resize-signature', 'passport-size-photo'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // METADATA TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    'photo-metadata-viewer': {
        about: 'View Metadata displays all EXIF data embedded in your images — camera make and model, lens information, shutter speed, aperture, ISO, GPS coordinates, date taken, image dimensions, color space, and more. Useful for photographers analyzing camera settings, verifying image authenticity, and checking location data. Processing happens entirely in your browser for complete privacy.',
        features: ['Full EXIF data display: camera, lens, settings', 'GPS coordinates and location data', 'Date/time information', 'Image dimensions, resolution, and color space', 'Client-side processing — images never uploaded'],
        useCases: ['Photographers reviewing camera settings of their shots', 'Verifying image authenticity and origin', 'Checking GPS location embedded in photos', 'Analyzing image technical properties'],
        faqs: [{ question: 'What metadata can I see?', answer: 'You can view camera make/model, lens info, shutter speed, aperture, ISO, GPS coordinates, date taken, dimensions, DPI, color space, software used, and more.' }, { question: 'Can I see where a photo was taken?', answer: 'If the photo has GPS data embedded (common with smartphone photos), you\'ll see the exact coordinates and can view the location on a map.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, TIFF, HEIC',
        relatedTools: ['photo-exif-editor', 'remove-image-metadata', 'convert-dpi'],
    },
    'photo-exif-editor': {
        about: 'Edit Metadata lets you modify EXIF data in your images — change the date taken, update camera information, edit GPS coordinates, modify copyright details, and more. Essential for photographers organizing their libraries, correcting wrong dates, updating copyright information, and managing image metadata for publishing.',
        features: ['Edit date/time, camera info, GPS coordinates', 'Update copyright and author information', 'Modify image description and tags', 'Batch metadata editing', 'Client-side processing for privacy'],
        useCases: ['Correcting wrong dates on photos after timezone travel', 'Adding copyright information before publishing', 'Updating GPS coordinates for location accuracy', 'Organizing photo libraries with consistent metadata'],
        faqs: [{ question: 'Can I change the date a photo was taken?', answer: 'Yes! You can modify the DateTimeOriginal and other date fields to correct timestamps, helpful when your camera date was wrong or for organizing photos.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, TIFF',
        relatedTools: ['photo-metadata-viewer', 'remove-image-metadata'],
    },
    'remove-image-metadata': {
        about: 'Remove Metadata strips all EXIF and metadata from your images for privacy protection. Photos from smartphones and cameras contain hidden data including GPS location, device information, date/time, and more. Removing metadata before sharing online prevents others from seeing where, when, and with what device your photos were taken.',
        features: ['Strips all EXIF, IPTC, and XMP metadata', 'Removes GPS location data for privacy', 'Removes camera and device information', 'Preserves image quality — only metadata is removed', 'Batch metadata removal'],
        useCases: ['Protecting privacy before sharing photos online', 'Removing GPS location data from images', 'Stripping device information for anonymous sharing', 'Cleaning metadata before submitting to stock photography sites'],
        faqs: [{ question: 'Why should I remove metadata from photos?', answer: 'Photos contain hidden data like your GPS location, device model, and capture time. Removing this data before sharing online protects your privacy and prevents location tracking.' }, { question: 'Does removing metadata change the image?', answer: 'No. Only invisible metadata is removed. The visual content and quality of your image remain completely unchanged.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, TIFF',
        relatedTools: ['photo-metadata-viewer', 'photo-exif-editor', 'compress-image'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PDF TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    'compress-pdf': {
        about: 'Compress PDF reduces your PDF file size significantly while maintaining readable quality. Upload large PDFs and choose compression levels — low (best quality, moderate reduction), medium (balanced), or high (maximum compression). Perfect for email attachments with size limits, uploading to portals, and reducing storage usage. Handles text-heavy, image-heavy, and mixed PDFs.',
        features: ['Three compression levels: low, medium, high', 'Handles text-heavy and image-heavy PDFs', 'Maintains readable text quality', 'Significant file size reduction (50-90%)', 'Secure processing with automatic cleanup'],
        useCases: ['Reducing PDF size for email attachments under 10 MB', 'Compressing scanned documents for upload portals', 'Optimizing large reports for web distribution', 'Reducing storage usage for PDF archives'],
        faqs: [{ question: 'How much can I compress a PDF?', answer: 'Compression depends on content type. Image-heavy PDFs can be reduced by 50-90%. Text-only PDFs have less room for compression. Try different levels to find the best balance.' }, { question: 'Will compressed PDFs still be readable?', answer: 'Yes. Text remains sharp and readable at all compression levels. Images may show slight quality reduction at high compression but remain clear.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['merge-pdf', 'split-pdf', 'compress-image'],
    },
    'merge-pdf': {
        about: 'Merge PDF combines multiple PDF files into a single document. Upload PDFs, drag to reorder, and download the merged result. Perfect for combining report sections, merging scanned pages, creating document packages, and organizing multi-part files into one cohesive PDF.',
        features: ['Combine unlimited PDF files into one', 'Drag and drop to reorder files', 'Preserves original formatting and quality', 'Handles standard PDF inputs', 'Fast processing'],
        useCases: ['Combining multiple report sections into one document', 'Merging scanned document pages into a single PDF', 'Creating application packages from separate files', 'Organizing invoices and receipts into monthly compilations'],
        faqs: [{ question: 'Is there a limit on the number of PDFs I can merge?', answer: 'There is no strict limit. You can merge dozens of PDF files. For very large batches, we recommend keeping total file size under 50 MB for optimal performance.' }, { question: 'Will the formatting be preserved?', answer: 'Yes, each page retains its original formatting, fonts, images, and layout. The merge simply concatenates pages in your specified order.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['split-pdf', 'compress-pdf', 'reorder-pdf-pages', 'image-to-pdf'],
    },
    'split-pdf': {
        about: 'Split PDF lets you extract specific pages or divide a PDF into multiple smaller files. Select individual pages, page ranges, or split at fixed intervals. Perfect for extracting chapters from books, separating specific pages from reports, and breaking large PDFs into manageable sections.',
        features: ['Extract specific pages or page ranges', 'Split into equal-sized sections', 'Select individual pages with visual preview', 'Download each split section separately', 'Preserves original page quality'],
        useCases: ['Extracting specific chapters from e-books', 'Separating individual pages from multi-page reports', 'Breaking large documents into emailable sections', 'Isolating forms or certificates from bundled PDFs'],
        faqs: [{ question: 'Can I extract non-consecutive pages?', answer: 'Yes! Select any combination of pages — consecutive or non-consecutive. For example, extract pages 1, 3, 7-10, 15 into a single new PDF.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['merge-pdf', 'compress-pdf', 'delete-pdf-pages', 'reorder-pdf-pages'],
    },
    'pdf-to-jpg': {
        about: 'PDF to JPG converts each page of your PDF document into high-quality JPG or PNG images. Set the output resolution and quality, then download individual page images or all pages as a ZIP file. Perfect for extracting images from PDFs, creating presentation slides from PDF reports, and sharing PDF content as images on social media.',
        features: ['Convert each PDF page to JPG or PNG', 'Adjustable output resolution and quality', 'Download individual pages or all as ZIP', 'High-quality rendering of text and graphics', 'Handles multi-page PDFs of any length'],
        useCases: ['Extracting pages as images for presentations', 'Converting PDF reports to images for social media sharing', 'Creating image previews of PDF documents', 'Converting PDF certificates and diplomas to image format'],
        faqs: [{ question: 'What resolution are the output images?', answer: 'You can set the output resolution. Higher DPI produces larger, sharper images. 150 DPI is good for screen viewing, 300 DPI for printing.' }],
        supportedFormats: 'Input: PDF — Output: JPG, PNG',
        relatedTools: ['image-to-pdf', 'compress-pdf', 'split-pdf'],
    },
    'rotate-pdf': {
        about: 'Rotate PDF lets you rotate individual pages or all pages in your PDF document by 90°, 180°, or 270°. Fix scanned documents that were fed sideways, correct orientation for specific pages, and ensure consistent page orientation throughout your document.',
        features: ['Rotate individual pages or all pages at once', 'Options: 90° clockwise, 90° counterclockwise, 180°', 'Visual page preview before rotation', 'Preserves all content and formatting', 'Handles multi-page PDFs'],
        useCases: ['Fixing sideways-scanned documents', 'Correcting orientation of specific pages in mixed-orientation PDFs', 'Rotating landscape pages to portrait or vice versa', 'Standardizing page orientation for professional documents'],
        faqs: [{ question: 'Can I rotate only specific pages?', answer: 'Yes! Select individual pages to rotate while leaving others unchanged. This is helpful for PDFs with mixed portrait and landscape pages.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['reorder-pdf-pages', 'split-pdf', 'merge-pdf'],
    },
    'add-watermark-pdf': {
        about: 'PDF Watermark adds text or image watermarks to every page or selected pages of your PDF. Add "CONFIDENTIAL", "DRAFT", company logos, or custom text overlays. Control position, size, opacity, rotation, and color. Essential for protecting intellectual property and marking document status.',
        features: ['Text and image watermark options', 'Adjustable opacity, position, and rotation', 'Apply to all pages or selected pages', 'Custom font, size, and color for text watermarks', 'Diagonal and centered positioning options'],
        useCases: ['Marking documents as CONFIDENTIAL or DRAFT', 'Adding company logos to internal documents', 'Protecting PDF content from unauthorized redistribution', 'Branding client deliverables and reports'],
        faqs: [{ question: 'Can I watermark only specific pages?', answer: 'Yes! Choose to apply the watermark to all pages, odd pages only, even pages only, or select specific page numbers.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['protect-pdf', 'compress-pdf', 'merge-pdf'],
    },
    'protect-pdf': {
        about: 'Protect PDF secures your document with password-based encryption so only people with the password can open it. Upload a PDF, set a password, and download a protected copy for private sharing, client handoffs, or internal document control.',
        features: ['Password-based PDF encryption', 'Creates a separate protected copy for download', 'Works for private sharing, client delivery, and access control', 'Simple password entry and confirmation flow'],
        useCases: ['Protecting contracts, invoices, and reports before sharing', 'Sending private PDF attachments with access control', 'Securing internal documents before upload or distribution'],
        faqs: [{ question: 'How does Protect PDF work?', answer: 'Upload your PDF, enter a password, and download a newly encrypted copy. Anyone opening that protected file will need the password.' }, { question: 'Does Protect PDF change my original file?', answer: 'No. The original file is left unchanged. The tool creates a separate protected PDF for download.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['unlock-pdf', 'add-watermark-pdf', 'compress-pdf'],
    },
    'unlock-pdf': {
        about: 'Unlock PDF removes password protection from a PDF when you know the current password. Upload the file, enter the correct password, and download a separate unlocked copy for easier editing, printing, or sharing inside trusted workflows.',
        features: ['Remove password protection from a PDF', 'Requires the current PDF password', 'Creates a separate unlocked copy for download', 'Useful for trusted internal workflows and editing'],
        useCases: ['Removing passwords before editing or printing a PDF', 'Preparing trusted internal copies of protected documents', 'Simplifying repeated access to PDFs you already own'],
        faqs: [{ question: 'Do I need the current password to unlock a PDF?', answer: 'Yes. You must provide the correct existing password before the tool can generate an unlocked copy.' }, { question: 'Will Unlock PDF remove security from my original file?', answer: 'No. The original stays unchanged, and the tool returns a separate unlocked version for download.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['protect-pdf', 'compress-pdf', 'merge-pdf'],
    },
    'reorder-pdf-pages': {
        about: 'Reorder PDF Pages lets you rearrange the page order in your PDF document using an intuitive drag-and-drop interface. See page thumbnails, drag pages to new positions, and download the reorganized PDF. Perfect for fixing page order mistakes, reorganizing content flow, and customizing document structure.',
        features: ['Drag-and-drop page reordering', 'Visual page thumbnails for easy identification', 'Move single or multiple pages at once', 'Preserves page content and formatting', 'Handles multi-page PDFs'],
        useCases: ['Fixing page order mistakes in scanned documents', 'Reorganizing report sections for better flow', 'Moving appendices and references to the correct position', 'Customizing document structure for different audiences'],
        faqs: [{ question: 'Can I move multiple pages at once?', answer: 'Yes, select multiple pages and drag them to a new position as a group. This makes reorganizing large documents much faster.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['split-pdf', 'merge-pdf', 'delete-pdf-pages', 'rotate-pdf'],
    },
    'delete-pdf-pages': {
        about: 'Delete PDF Pages removes unwanted pages from any PDF document. Select the pages you want to delete using the visual interface, and download a clean PDF with only the pages you need. Perfect for removing blank pages, cover pages, advertisements, and irrelevant content from downloaded documents.',
        features: ['Visual page selection for easy identification', 'Delete single or multiple pages', 'Preserves remaining pages exactly as they are', 'Page thumbnail preview before deletion', 'Handles multi-page PDFs of any size'],
        useCases: ['Removing blank pages from scanned documents', 'Deleting cover pages and table of contents', 'Removing advertisements from downloaded PDFs', 'Cleaning up exam papers by removing instruction pages'],
        faqs: [{ question: 'Can I undo page deletion?', answer: 'The original file is not modified. If you need the deleted pages, simply re-upload the original PDF. Always keep a backup of important documents.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['reorder-pdf-pages', 'split-pdf', 'merge-pdf'],
    },
    'add-page-numbers-to-pdf': {
        about: 'Add Page Numbers to PDF lets you automatically insert page numbers across your entire PDF document. You can customize the numbering format (e.g., "1", "Page 1", "1 of 5"), choose exactly where the numbers appear on the page (bottom, top, left, right), and adjust the font size and margins. The tool processes files completely in the browser for maximum privacy and speed.',
        features: ['Multiple numbering formats (e.g., Page N of Total)', 'Custom positioning (top-left, bottom-center, etc.)', 'Adjustable font sizes and margins', 'Fast server-side processing without quality loss', 'High privacy with encrypted transfers'],
        useCases: ['Adding page numbers to printed reports and ebooks', 'Numbering legal documents for court submissions', 'Organizing scanned documents and lecture notes', 'Bates numbering for large PDF portfolios'],
        faqs: [
            { question: 'Will this tool overwrite existing text?', answer: 'No, the page numbers are placed as an overlay on top of the PDF. We recommend using margins to ensure numbers do not overlap with existing text.' },
            { question: 'Is it free to use?', answer: 'Yes! Our tool is 100% free with no watermarks and no limits on the number of pages.' }
        ],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['watermark-pdf', 'merge-pdf', 'reorder-pdf-pages'],
    },
    'svg-to-png': {
        about: 'SVG to PNG Converter easily transforms your scalable vector graphics into transparent, high-quality raster PNG images. Perfect for converting web icons, logos, and illustrations into universally supported image formats that work across all software and platforms.',
        features: ['Preserves background transparency', 'Maintains crisp edges and colors', 'Fast server-side rendering', 'Processes files instantly', 'High privacy with no image storage'],
        useCases: ['Converting web icons to PNG for email signatures', 'Transforming vector logos for presentation software', 'Preparing SVG graphics for social media posts', 'Converting designer assets for non-technical clients'],
        faqs: [
            { question: 'Will my transparent background be kept?', answer: 'Yes, our SVG to PNG converter automatically preserves any transparent backgrounds present in your original SVG file.' },
            { question: 'Is there a file size limit?', answer: 'You can upload SVG files up to 25MB, which is more than enough for extremely complex vector graphics.' }
        ],
        supportedFormats: 'Input: SVG | Output: PNG',
        relatedTools: ['svg-to-jpg', 'png-to-jpeg', 'resize-image'],
    },
    'svg-to-jpg': {
        about: 'Convert your SVG vector graphics into standard JPG images instantly. While SVG is great for scalable design, JPG is the universal standard for photos and general web use. This tool renders your SVG against a solid white background (since JPG does not support transparency) and outputs a highly compressed, shareable image file.',
        features: ['Replaces transparent backgrounds with solid white', 'Highly optimized JPEG compression', 'Lightning-fast conversion', 'Works entirely without downloading software'],
        useCases: ['Converting vector logos into profile pictures', 'Sharing illustrations on platforms that don\'t support SVG', 'Compressing graphics for faster page loads', 'Creating thumbnails from vector assets'],
        faqs: [
            { question: 'Why does my background turn white?', answer: 'The JPG format does not support transparency. Any transparent areas in your SVG will be automatically converted to a white background during processing.' }
        ],
        supportedFormats: 'Input: SVG | Output: JPG',
        relatedTools: ['svg-to-png', 'webp-to-jpg', 'compress-image'],
    },
    'webp-to-png': {
        about: 'WebP to PNG Converter transforms next-gen WebP images back into the universally recognized PNG format. Since many older applications, email clients, and image viewers still struggle to open WebP files, converting them to PNG ensures your graphics load correctly with full transparency intact.',
        features: ['100% lossless conversion', 'Preserves alpha-channel transparency', 'No software installation required', 'Processes files in seconds'],
        useCases: ['Converting downloaded WebP images for Photoshop editing', 'Fixing images that won\'t open in older software', 'Preparing graphics for older email clients', 'Standardizing assets for legacy systems'],
        faqs: [
            { question: 'Will the image lose quality?', answer: 'No, converting from WebP to PNG is a completely lossless process, meaning your image will look exactly the same as the original.' }
        ],
        supportedFormats: 'Input: WebP | Output: PNG',
        relatedTools: ['webp-to-jpg', 'png-to-jpeg', 'remove-image-background'],
    },
};
