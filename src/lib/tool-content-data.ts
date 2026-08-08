export type ToolContent = {
    about: string;
    directAnswer?: string;
    features: string[];
    useCases: string[];
    faqs: { question: string; answer: string }[];
    steps?: { title: string; description: string }[];
    commonProblems?: { problem: string; solution: string }[];
    supportedFormats: string;
    relatedTools: string[];
};

export const toolContentMap: Record<string, ToolContent> = {
    // ═══════════════════════════════════════════════════════════════════════
    // MOST POPULAR TOOLS
    // ═══════════════════════════════════════════════════════════════════════
    'compress-image': {
        about: 'Compress Image is a powerful online tool that reduces your image file size to any target — from 5 KB to 2 MB and beyond — without noticeable quality loss. Whether you need to meet strict upload limits for government forms, optimize images for faster website loading speeds, or shrink photos before emailing, this compressor handles JPG, PNG, WebP, and more. The intelligent compression algorithm balances file size reduction with visual quality, giving you full control through an intuitive quality slider. Processing happens securely in your browser for maximum privacy, with no installation, no signup, and completely free access.',
        directAnswer: 'The Compress Image tool by PdfPixels instantly reduces your photo file sizes without visible quality loss. Just upload your image, specify a target size (like 50 KB or 200 KB), and download the perfectly optimized result for free.',
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
        steps: [
            { title: 'Upload your photo', description: 'Drag and drop your JPG, PNG, WebP or HEIC image into the dropzone.' },
            { title: 'Set compression target', description: 'Enter an exact target file size (e.g. 100 KB) or use the quality slider to adjust compression manually.' },
            { title: 'Preview and download', description: 'Check the real-time preview to ensure quality, then click download to save the compressed image.' }
        ],
        commonProblems: [
            { problem: 'Image looks too blurry after compression', solution: 'If your target file size is extremely small (like under 20 KB) for a large photo, it will become blurry. Try reducing the image dimensions (resize) first, then compress.' },
            { problem: 'File size didn\'t decrease', solution: 'If your original image is already highly optimized, further compression won\'t help much. Try lowering the quality slider or converting it to WebP.' }
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC',
        relatedTools: ['resize-image', 'increase-image-size-in-kb', 'convert-dpi', 'png-to-jpeg'],
    },

    'resize-image': {
        about: 'Resize Image lets you change image dimensions precisely using pixels, centimeters, millimeters, or inches — perfect for print documents, social media posts, and official submissions. Choose from built-in presets for Instagram, Facebook, LinkedIn, YouTube thumbnails, and standard document sizes like A4 and Letter, or enter custom dimensions. The tool maintains aspect ratio by default to prevent distortion, with an option to override for exact sizing. Whether you need a 35×45mm passport photo, a 1080×1080 Instagram post, or a 4K wallpaper, Resize Image delivers pixel-perfect results instantly.',
        directAnswer: 'To resize an image instantly, upload it to the PdfPixels Resize tool, enter your desired width and height (in pixels, CM, or inches), and download the perfectly scaled photo for free.',
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
        steps: [
            { title: 'Upload image', description: 'Select the image you want to resize from your device.' },
            { title: 'Set dimensions', description: 'Choose your measurement unit (Pixels, CM, MM, Inches) and enter the new width and height, or select a preset.' },
            { title: 'Download resized photo', description: 'Click process to apply the new dimensions and download your resized file instantly.' }
        ],
        commonProblems: [
            { problem: 'Image looks stretched or squished', solution: 'This happens when you resize to exact dimensions without locking the aspect ratio. To prevent distortion, make sure the "Lock Aspect Ratio" icon is enabled so the image scales proportionally.' }
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC',
        relatedTools: ['compress-image', 'crop-image', 'convert-dpi', 'passport-size-photo'],
    },

    'remove-image-background': {
        about: 'Remove Background uses advanced AI-powered machine learning to instantly detect the subject in your photo and remove the background, producing a clean transparent PNG. The AI model accurately handles complex edges like hair, fur, and semi-transparent objects that manual editing would take hours to perfect. Ideal for creating product photography with white backgrounds, professional headshots, marketing materials, and social media graphics. The entire process takes just 10-30 seconds and works with photos of people, products, animals, and objects.',
        directAnswer: 'The AI Background Remover perfectly isolates the main subject of your photo by erasing the background in seconds. It outputs a high-quality transparent PNG ideal for product listings, headshots, or graphic design.',
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
        steps: [
            { title: 'Upload your image', description: 'Select a photo of a person, animal, or product that you want to isolate.' },
            { title: 'AI Processing', description: 'Wait a few seconds while our AI detects the subject and erases the background automatically.' },
            { title: 'Download PNG', description: 'Download the result as a transparent PNG, ready to place on any new background.' }
        ],
        commonProblems: [
            { problem: 'Parts of the subject were removed', solution: 'The AI might struggle if the subject is the exact same color as the background. Try uploading a photo with higher contrast between foreground and background.' }
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC — Output: Transparent PNG',
        relatedTools: ['blur-background', 'increase-image-quality', 'compress-image', 'beautify-image'],
    },

    'passport-size-photo': {
        about: 'Passport Photo Maker creates compliant passport and ID photos for any country in the world — USA, UK, India, Canada, Australia, Schengen, and 100+ more. The tool auto-crops your face to official government dimensions (e.g., 35×45mm for most countries, 2×2 inches for US passport), ensures proper head positioning, and adjusts the background to meet submission requirements. Save money by creating your own passport photos at home instead of paying studio fees. Works with smartphone selfies and delivers print-ready results instantly.',
        directAnswer: 'Make official passport and ID photos at home for free. Select your country, upload a portrait, and our tool auto-crops it to strict official government dimensions (like 2x2 inches or 35x45mm) for instant printing.',
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
        steps: [
            { title: 'Upload portrait', description: 'Take a photo of yourself against a plain wall and upload it.' },
            { title: 'Select country requirements', description: 'Choose the country and ID type (e.g., US Passport, Schengen Visa) to apply the correct size rules.' },
            { title: 'Download and print', description: 'Download the finalized single photo or a 4x6 print sheet with multiple copies ready for printing.' }
        ],
        commonProblems: [
            { problem: 'Photo was rejected by official agency', solution: 'Ensure you took the photo with flat, even lighting (no shadows across the face), a neutral expression, and a plain light background. Tool dimensions are exact, but lighting is often the cause of rejection.' }
        ],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC — Output: JPG at 300+ DPI',
        relatedTools: ['resize-image', 'compress-image', 'crop-image', 'remove-image-background'],
    },

    'image-to-pdf': {
        about: 'Image to PDF converts one or multiple images into a single, organized PDF document. Upload JPG, PNG, or WebP images, drag to reorder pages, choose your page size (A4, Letter, Legal, or fit-to-image), set orientation, and generate a professional PDF in seconds. Perfect for creating photo albums, document scans, portfolios, and multi-page reports from image files. The tool preserves image quality during conversion and supports both portrait and landscape orientations with smart auto-detection. Full walkthrough: https://www.pdfpixels.com/blog/convert-jpg-to-pdf-online-no-software',
        directAnswer: 'Easily combine multiple JPG, PNG, or WebP photos into a single PDF document. Just upload your images, drag them to rearrange the page order, choose a page size like A4, and download your consolidated PDF. Guide: https://www.pdfpixels.com/blog/convert-jpg-to-pdf-online-no-software',
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
        steps: [
            { title: 'Upload images', description: 'Select one or more images (JPG, PNG, WebP) you want to include in your PDF.' },
            { title: 'Arrange and configure', description: 'Drag and drop the thumbnails to reorder pages. Select your page size and orientation settings.' },
            { title: 'Generate PDF', description: 'Click process to embed the images into a single PDF document and save it.' }
        ],
        commonProblems: [
            { problem: 'Images are cut off in the PDF', solution: 'If your images are cut off, try changing the "Fit" setting to "Contain" so the entire image shrinks to fit the page without cropping.' }
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
        about: 'AI Image Enhancer uses artificial intelligence to improve photo quality — fixing poor lighting, sharpening soft detail, reducing noise and grain, and balancing color. Upload a low-quality, blurry, or dim photo and get a clearer result in seconds. Works on portraits, landscapes, product shots, scans, and screenshots. Free, no watermark. Full walkthrough: https://www.pdfpixels.com/blog/ai-image-enhancer-fix-blurry-photos',
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
        directAnswer: 'The Crop Image tool lets you trim your photos by removing unwanted outer areas to improve framing or focus on a specific subject. You can choose standard aspect ratios or set custom dimensions for precise pixel control without losing quality.',
        steps: [
            { title: 'Upload Image', description: 'Drag and drop your photo into the crop area or click to browse files from your device.' },
            { title: 'Select Crop Region', description: 'Choose a preset ratio like 16:9, or freely drag the corners of the crop box to frame your desired area.' },
            { title: 'Apply & Download', description: 'Click the crop button to process instantly, then download the newly framed image to your device.' }
        ],
        commonProblems: [
            { problem: 'My cropped image looks blurry.', solution: 'Ensure you are not zooming in too much on a low-resolution original photo. Cropping reduces the overall pixel count.' },
            { problem: 'I need an exact 800x600 size.', solution: 'Use the "Custom Dimensions" option in the settings panel to lock the crop box to those exact pixels.' }
        ],
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
        directAnswer: 'Circle Crop cuts your rectangular photos into perfect circles with transparent backgrounds. It is the fastest way to create round profile pictures, social media avatars, or circular design elements instantly in your browser.',
        steps: [
            { title: 'Upload Your Photo', description: 'Select the image you want to turn into a circle from your computer or phone.' },
            { title: 'Position the Circle', description: 'Drag the circular crop mask over your subject and resize it to fit perfectly.' },
            { title: 'Save as PNG', description: 'Download the final image. It will save as a transparent PNG so the corners remain invisible.' }
        ],
        commonProblems: [
            { problem: 'The corners are white instead of transparent.', solution: 'The tool automatically exports as a PNG to preserve transparency. If you convert it to JPG later, the transparent corners will turn white.' },
            { problem: 'The circle is cutting off my face.', solution: 'Before cropping, make sure your original image has enough padding around the subject to fit a perfect circle.' }
        ],
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
        directAnswer: 'The Square Image Cropper quickly transforms any rectangular photo into a perfect 1:1 square. It simplifies formatting pictures for Instagram feeds, profile avatars, and product thumbnails without stretching or distorting the original image.',
        steps: [
            { title: 'Choose an Image', description: 'Upload a picture that you need formatted into a perfect square.' },
            { title: 'Adjust the Square Frame', description: 'Move the locked 1:1 ratio box to highlight the most important part of your photo.' },
            { title: 'Download Square Image', description: 'Process the crop and save your perfectly proportioned square photo.' }
        ],
        commonProblems: [
            { problem: 'I want to add white borders instead of cropping.', solution: 'This tool cuts off the excess edges. To keep the whole image and add borders, use our Add Margin or Resize tools instead.' },
            { problem: 'The crop box cuts out too much.', solution: 'Square cropping requires removing either the sides or top/bottom of a rectangular image. Try resizing the box to its maximum limit.' }
        ],
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
        directAnswer: 'Freehand Crop allows you to manually draw a custom outline around any object in your photo to cut it out. It is perfect for extracting irregular shapes or subjects and saving them with a transparent background.',
        steps: [
            { title: 'Open Your Image', description: 'Load the picture containing the object you want to manually cut out.' },
            { title: 'Draw the Outline', description: 'Use your cursor or finger to carefully trace a continuous line around your subject.' },
            { title: 'Extract and Save', description: 'Close the shape to remove the background, then download the isolated object as a transparent PNG.' }
        ],
        commonProblems: [
            { problem: 'My drawn lines are too jagged.', solution: 'Try drawing slower for better precision, or zoom in on the image before you start tracing your shape.' },
            { problem: 'The background isn\'t transparent.', solution: 'Ensure you download the final image in PNG format, as JPG does not support transparent backgrounds.' }
        ],
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
        directAnswer: 'The Rotate Image tool easily fixes sideways or upside-down photos by turning them 90, 180, or 270 degrees. You can also straighten tilted pictures or apply custom degree rotations without losing image quality.',
        steps: [
            { title: 'Upload Photo', description: 'Select the sideways or tilted image you need to correct.' },
            { title: 'Choose Rotation Angle', description: 'Click the 90° quick-rotate buttons, or use the slider to enter a precise custom degree.' },
            { title: 'Save Corrected Image', description: 'Apply the rotation and download your properly oriented photo.' }
        ],
        commonProblems: [
            { problem: 'Custom rotation adds empty space at the corners.', solution: 'When rotating at custom angles (like 45°), the canvas expands to fit the tilted image, creating empty corners. Use a crop tool afterward if needed.' },
            { problem: 'My phone still shows it sideways.', solution: 'Some devices cache old image orientations (EXIF data). The downloaded file is correctly rotated; try opening it in a new viewer.' }
        ],
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
        directAnswer: 'The Flip Image tool creates a mirror reflection of your picture either horizontally or vertically. It is commonly used to fix backwards text in selfies or create symmetrical design effects instantly.',
        steps: [
            { title: 'Select an Image', description: 'Upload the photo you want to mirror or reverse.' },
            { title: 'Choose Flip Direction', description: 'Click "Flip Horizontal" to mirror left-to-right, or "Flip Vertical" to flip top-to-bottom.' },
            { title: 'Download Image', description: 'Instantly download the mirrored version of your photo with zero quality loss.' }
        ],
        commonProblems: [
            { problem: 'Text in my photo is backwards now.', solution: 'Flipping an image horizontally reverses everything, including text. If you only want to change orientation, use the Rotate tool instead.' },
            { problem: 'The image quality looks different.', solution: 'Flipping is a lossless process. Any perceived quality change might be due to the browser preview; the downloaded file will retain full quality.' }
        ],
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
        directAnswer: 'The Watermark Image tool protects your visual content by stamping a semi-transparent logo or text over your photos. It helps photographers and businesses prevent unauthorized use and build brand recognition.',
        steps: [
            { title: 'Upload Base Image', description: 'Choose the photo you want to protect with a watermark.' },
            { title: 'Configure Watermark', description: 'Add your text or upload a logo file, then adjust the opacity, size, and position on the canvas.' },
            { title: 'Apply and Download', description: 'Export the final image with the watermark permanently embedded into the pixels.' }
        ],
        commonProblems: [
            { problem: 'My watermark is too distracting.', solution: 'Lower the opacity slider to 30-50% to make the watermark semi-transparent, allowing the main image to show through.' },
            { problem: 'I can\'t remove a watermark later.', solution: 'Once applied and downloaded, watermarks are permanently flattened into the image. Always keep a backup of your original, unwatermarked photo.' }
        ],
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
        directAnswer: 'Add Text to Image lets you easily overlay custom typography onto your photos. You can design memes, YouTube thumbnails, and social media quotes by adjusting fonts, colors, borders, and shadows right in your browser.',
        steps: [
            { title: 'Upload Background Photo', description: 'Select the image you want to use as the base for your text.' },
            { title: 'Type and Style Text', description: 'Enter your message, select a font, pick a color, and add effects like shadows or outlines for readability.' },
            { title: 'Position and Save', description: 'Drag the text to the perfect spot, then download your newly captioned image.' }
        ],
        commonProblems: [
            { problem: 'The text is hard to read against the background.', solution: 'Try adding a text outline (stroke) or a drop shadow. Alternatively, use a contrasting color.' },
            { problem: 'Text wraps weirdly when I resize it.', solution: 'Use the text box handles to adjust the width of the text area, which will control how the words wrap to the next line.' }
        ],
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
        directAnswer: 'The Add Logo to Image tool lets you place your company logo or graphics on top of another photo. It is perfect for branding social media posts, adding watermarks, or creating composite product images.',
        steps: [
            { title: 'Upload Main Image', description: 'Load the background photo where you want the logo to appear.' },
            { title: 'Insert Your Logo', description: 'Upload your logo file (preferably a transparent PNG) and position it over the image.' },
            { title: 'Adjust and Export', description: 'Resize the logo, tweak its opacity if needed, and save the final branded image.' }
        ],
        commonProblems: [
            { problem: 'My logo has an ugly white background.', solution: 'You uploaded a JPG logo. For seamless blending, you must use a PNG file with a transparent background.' },
            { problem: 'The logo is pixelated when I make it larger.', solution: 'Your source logo file is too small. Upload a higher-resolution logo to scale it up without losing crispness.' }
        ],
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
        directAnswer: 'The Join Images tool seamlessly stitches multiple photos together horizontally or vertically. It is the easiest way to create before-and-after comparison shots, photo strips, and side-by-side collages without complex design software.',
        steps: [
            { title: 'Upload Multiple Images', description: 'Select two or more photos you want to combine into one file.' },
            { title: 'Choose Layout Options', description: 'Select whether to join them side-by-side (horizontal) or stacked (vertical), and adjust the border gaps.' },
            { title: 'Merge and Download', description: 'Click join to merge the files and download the single combined image.' }
        ],
        commonProblems: [
            { problem: 'The joined images have different heights/widths.', solution: 'Use the auto-resize settings in the tool to scale all images to match the dimensions of the largest or smallest photo.' },
            { problem: 'The final file size is too huge.', solution: 'Joining several large photos creates a massive file. Try compressing the original images first or use the resize options before joining.' }
        ],
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
        directAnswer: 'The Image Splitter divides one large picture into a grid of smaller, equally-sized pieces. It is commonly used to slice photos for seamless Instagram carousel posts or giant 3x3 profile grids.',
        steps: [
            { title: 'Upload Large Photo', description: 'Select the high-resolution image you want to chop into smaller pieces.' },
            { title: 'Set Grid Size', description: 'Define how many columns and rows you need (e.g., 3x3 for an Instagram grid).' },
            { title: 'Split and Save', description: 'Process the split and download a ZIP file containing all your perfectly sliced image parts.' }
        ],
        commonProblems: [
            { problem: 'The sliced pieces look stretched.', solution: 'Ensure your grid ratio matches your image ratio. For a 3x3 grid, your original image should be a perfect square to avoid distortion or cropping.' },
            { problem: 'I don\'t know what order to post them in.', solution: 'The downloaded files are automatically numbered in sequence. For Instagram grids, usually, you post them in reverse numerical order.' }
        ],
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
        directAnswer: 'The Image Color Picker helps you extract exact HEX, RGB, and HSL codes from any photo. Simply click on a specific pixel in your image to instantly copy its color code for your design projects.',
        steps: [
            { title: 'Upload Reference Image', description: 'Load the picture containing the colors you want to identify.' },
            { title: 'Pick a Color', description: 'Hover over the image using the magnifying tool and click exactly on the color you want to extract.' },
            { title: 'Copy Color Codes', description: 'Instantly copy the generated HEX, RGB, or HSL values to use in your CSS or design software.' }
        ],
        commonProblems: [
            { problem: 'I can\'t click the exact pixel I want.', solution: 'Use the zoom tool to enlarge the image. This makes it much easier to select a single, specific pixel accurately.' },
            { problem: 'The color looks slightly different than expected.', solution: 'Photos often have noise and gradients. The pixel you clicked might be slightly shadowed or highlighted compared to the overall area color.' }
        ],
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
        directAnswer: 'The Blur Image tool allows you to easily apply a uniform Gaussian blur effect to your entire photo. Adjust the intensity slider to achieve anything from a slight soft-focus look to a heavy, artistic blur perfect for website backgrounds.',
        steps: [
            { title: 'Upload your image', description: 'Select the photo you want to blur from your device.' },
            { title: 'Set the blur intensity', description: 'Use the slider to increase or decrease the Gaussian blur effect until you reach the desired softness.' },
            { title: 'Download the blurred image', description: 'Save your newly blurred photo in your preferred format.' }
        ],
        commonProblems: [
            { problem: 'The blur effect is too strong and my image is unrecognizable.', solution: 'Reduce the blur intensity using the slider. A lower setting will create a softer, more subtle out-of-focus effect.' },
            { problem: 'I only want to blur a specific part of the photo.', solution: 'This tool blurs the entire image. For selective blurring, try our Blur Face or Censor Photo tools.' }
        ],
        features: ['Adjustable Gaussian blur intensity from subtle to heavy', 'Real-time preview of blur effect', 'Client-side processing for instant results', 'Works on entire image uniformly', 'No quality degradation beyond the intended blur effect'],
        useCases: ['Creating soft background images for websites and presentations', 'Obscuring sensitive information in screenshots', 'Producing dreamy, artistic portrait effects', 'Making blurred textures for graphic design'],
        faqs: [{ question: 'Can I blur only part of the image?', answer: 'This tool blurs the entire image uniformly. For selective area blurring, try our Blur Face or Censor Photo tools which target specific regions.' }, { question: 'What is Gaussian blur?', answer: 'Gaussian blur is a smooth, natural-looking blur that averages pixels using a bell-curve (Gaussian) distribution. It produces a soft, optically realistic out-of-focus effect.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-background', 'blur-face', 'motion-blur', 'censor-photo'],
    },
    'blur-background': {
        about: 'Blur Background uses AI to automatically detect the main subject in your photo and blur only the background, creating a professional portrait-mode depth-of-field effect. The subject remains perfectly sharp while the background gets a beautiful bokeh-style blur. Perfect for turning ordinary smartphone photos into professional-looking portraits, product shots, and headshots.',
        directAnswer: 'Blur Background uses artificial intelligence to identify the main subject of your photo and applies a soft bokeh blur exclusively to the background. This instantly gives ordinary pictures a professional portrait-mode appearance.',
        steps: [
            { title: 'Upload a portrait or product photo', description: 'Select an image with a clear main subject.' },
            { title: 'Adjust background blur', description: 'Once the AI detects the subject, use the slider to change how out-of-focus the background appears.' },
            { title: 'Save your portrait', description: 'Download the finished image with its new depth-of-field effect.' }
        ],
        commonProblems: [
            { problem: "The AI didn't blur the background correctly around complex edges like hair.", solution: 'Try uploading an image with better contrast between the subject and the background, or adjust the blur intensity to make edge imperfections less noticeable.' },
            { problem: 'The wrong part of the image was kept in focus.', solution: 'Our AI looks for prominent subjects like people or products. If the wrong area is focused, try cropping the image to make the intended subject more central and prominent.' }
        ],
        features: ['AI-powered subject detection and segmentation', 'Adjustable background blur intensity', 'Subject remains perfectly sharp', 'Natural bokeh-style depth of field effect', 'Works with people, products, and animals'],
        useCases: ['Creating professional portrait-mode photos from regular smartphone shots', 'Enhancing product photography with isolated subject focus', 'Making professional headshots for LinkedIn and corporate profiles', 'Blurring distracting backgrounds in video call screenshots'],
        faqs: [{ question: 'How does AI detect the subject?', answer: 'Our AI model uses deep learning semantic segmentation to identify and separate the foreground subject from the background. It works accurately with people, animals, and products.' }, { question: 'Can I control how much the background is blurred?', answer: 'Yes! Use the blur intensity slider to adjust from a subtle soft focus to a heavy bokeh effect.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['remove-image-background', 'blur-image', 'blur-face', 'beautify-image'],
    },
    'blur-face': {
        about: 'Blur Face uses AI face detection to automatically find and blur all faces in your photo for privacy protection. The tool detects faces at various angles, sizes, and positions, then applies a customizable blur to each face while keeping the rest of the image sharp. Essential for complying with privacy regulations (GDPR, CCPA) when sharing photos that contain identifiable people.',
        directAnswer: 'Blur Face is an automated privacy tool that uses AI to detect and blur human faces in photographs. It allows you to quickly anonymize people in your images while keeping the rest of the picture sharp and clear.',
        steps: [
            { title: 'Upload photo with faces', description: 'Select an image containing people whose identities you need to protect.' },
            { title: 'Customize face blur', description: 'Review the automatically detected faces and adjust the blur intensity for each to ensure proper anonymization.' },
            { title: 'Export the anonymized photo', description: 'Save the image securely; the original sharp faces cannot be recovered from the downloaded file.' }
        ],
        commonProblems: [
            { problem: 'The AI missed a face in the background.', solution: 'Faces that are extremely small, heavily obscured, or at extreme angles might be missed. You can use our Censor Photo tool to manually obscure any undetected faces.' },
            { problem: 'The blur is not strong enough for privacy compliance.', solution: 'Increase the blur intensity slider until facial features are completely unrecognizable to ensure full GDPR or CCPA compliance.' }
        ],
        features: ['AI auto-detection of multiple faces in a single image', 'Adjustable blur intensity per face', 'Detects faces at various angles and sizes', 'GDPR/CCPA privacy compliance', 'Non-destructive — original areas outside faces remain sharp'],
        useCases: ['Anonymizing people in street photography and public photos', 'Complying with GDPR privacy requirements for face data', 'Blurring faces in real estate listing photos', 'Protecting identities in documentary and journalistic photography'],
        faqs: [{ question: 'How many faces can it detect at once?', answer: 'The AI can detect and blur multiple faces in a single image — there is no practical limit. It works with front-facing, profile, and partially obscured faces.' }, { question: 'Is this GDPR compliant?', answer: 'Blurring faces helps meet GDPR requirements for anonymizing personal data in images. For full compliance, ensure faces are sufficiently blurred to be unrecognizable.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['censor-photo', 'blur-background', 'blur-image', 'pixelate-image'],
    },
    'pixelate-image': {
        about: 'Pixelate Image adds a mosaic/pixelation effect to your entire photo. The tool enlarges pixel blocks to create the classic censorship mosaic effect or a retro pixel-art aesthetic. Adjust the pixel block size from subtle to heavy pixelation. Commonly used for censoring sensitive content, creating retro visuals, and anonymizing information in screenshots.',
        directAnswer: 'The Pixelate Image tool applies a classic mosaic effect across your entire photo. By enlarging pixel blocks, you can obscure details for privacy or create a stylized retro 8-bit aesthetic.',
        steps: [
            { title: 'Choose your image', description: 'Upload the screenshot or photo you wish to pixelate.' },
            { title: 'Adjust pixel block size', description: 'Slide the control to make the pixel blocks larger for heavy censorship or smaller for a detailed retro look.' },
            { title: 'Download the result', description: 'Save your newly pixelated image to your device.' }
        ],
        commonProblems: [
            { problem: 'The text in my screenshot is still readable after pixelation.', solution: 'Increase the pixel block size significantly. For sensitive text, larger pixel blocks are required to completely destroy legibility.' },
            { problem: 'I only need to pixelate a small section.', solution: 'This tool applies the effect globally. To pixelate specific areas, please use our interactive Censor Photo tool.' }
        ],
        features: ['Adjustable pixel block size for censoring or artistic effects', 'Real-time preview of pixelation level', 'Client-side processing for privacy', 'Works on entire image', 'No quality loss beyond intended pixelation'],
        useCases: ['Censoring sensitive information in screenshots and documents', 'Creating retro pixel-art aesthetic for design projects', 'Anonymizing license plates and identifiers in photos', 'Adding mosaic effects for creative purposes'],
        faqs: [{ question: 'Can I pixelate only a specific area?', answer: 'This tool pixelates the entire image. For selective area pixelation, use our Censor Photo tool which lets you draw rectangles over specific areas.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-image', 'censor-photo', 'picture-to-pixel-art', 'grayscale-image'],
    },
    'grayscale-image': {
        about: 'Grayscale Image converts any color photo into professional-looking grayscale tones. The tool removes all color information while preserving luminance detail, producing smooth tonal transitions. Ideal for creating professional document photos, artistic black-and-white aesthetics, and preparing images for monochrome printing.',
        directAnswer: 'Grayscale Image converts color photos into black and white by removing color information while preserving smooth tonal transitions. This creates a professional monochrome look with a full range of gray shades.',
        steps: [
            { title: 'Select a color photo', description: 'Upload the image you want to convert to black and white.' },
            { title: 'Preview the conversion', description: 'The tool instantly removes all color, replacing it with corresponding shades of gray based on luminance.' },
            { title: 'Download the grayscale image', description: 'Save the professional monochrome result for printing or digital use.' }
        ],
        commonProblems: [
            { problem: 'The grayscale image looks flat and lacks contrast.', solution: 'Because colors are mapped to gray tones, colors with similar brightness will look the same in grayscale. Try using an image with stronger lighting contrast.' },
            { problem: 'I wanted a pure black and white stencil effect.', solution: 'For a two-tone effect with no gray shades, use our Turn Image to Black & White tool instead of the Grayscale converter.' }
        ],
        features: ['Professional grayscale conversion with smooth tonal range', 'Preserves original luminance detail and contrast', 'Client-side processing for instant results', 'No color banding or artifacts', 'Works with all major image formats'],
        useCases: ['Creating professional grayscale document photos', 'Artistic monochrome photography processing', 'Preparing images for monochrome laser printing', 'Reducing visual noise for cleaner document scans'],
        faqs: [{ question: 'What is the difference between grayscale and black & white?', answer: 'Grayscale contains full range of gray tones from white to black (256 shades). Black & White uses only pure black and pure white with a threshold — no gray tones.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['turn-image-to-black-and-white', 'sepia-filter', 'invert-image-colors'],
    },
    'turn-image-to-black-and-white': {
        about: 'Black & White converter transforms your photos into high-contrast two-tone images using only pure black and pure white pixels. Adjust the threshold to control where the cutoff falls between dark and light areas. Perfect for creating dramatic silhouettes, preparing images for laser engraving, making stencils, and producing high-contrast artistic prints.',
        directAnswer: 'This tool transforms your images into high-contrast, two-tone graphics using only pure black and pure white. It is ideal for making silhouettes, stencils, or preparing artwork for laser engraving.',
        steps: [
            { title: 'Upload your image', description: 'Choose the photo or logo you want to convert to two tones.' },
            { title: 'Adjust the threshold', description: 'Move the threshold slider to determine which gray values become pure white and which become pure black.' },
            { title: 'Download the high-contrast image', description: 'Save the final two-tone graphic to your device.' }
        ],
        commonProblems: [
            { problem: "The image turned almost entirely black (or white).", solution: "Adjust the threshold slider. A very high or very low threshold will push most pixels to one extreme. Find the middle ground that preserves your subject's details." },
            { problem: 'I wanted a regular black and white photo with gray tones.', solution: 'This tool creates harsh two-tone images. For smooth photographic black and white, use our Grayscale Image tool.' }
        ],
        features: ['Adjustable threshold for black/white cutoff point', 'High-contrast two-tone output', 'Real-time threshold preview', 'Ideal for stencil and laser engraving preparation', 'Client-side processing'],
        useCases: ['Creating stencils and templates for crafting', 'Preparing images for laser engraving and CNC cutting', 'Making dramatic black and white artistic prints', 'Converting logos and line art to pure monochrome'],
        faqs: [{ question: 'How does threshold control work?', answer: 'The threshold determines the brightness level at which pixels become black vs white. Lower threshold = more white areas, higher threshold = more black areas.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['grayscale-image', 'sepia-filter', 'invert-image-colors'],
    },
    'sepia-filter': {
        about: 'Sepia Filter applies a warm, vintage brownish tone to your photos — reminiscent of aged photographs from the early 20th century. The effect adds a nostalgic, timeless quality to modern digital images. Adjust the intensity to go from a subtle warm tint to a fully saturated vintage sepia look.',
        directAnswer: 'The Sepia Filter adds a warm, reddish-brown tint to your photos, mimicking the look of aged, vintage photography from the late 19th and early 20th centuries.',
        steps: [
            { title: 'Upload a modern photo', description: 'Select the image you want to give a nostalgic, vintage feel.' },
            { title: 'Control sepia intensity', description: 'Adjust the slider to choose between a subtle warm tint and a deep, historical sepia tone.' },
            { title: 'Download the vintage image', description: 'Save your transformed photo to share on social media or use in design projects.' }
        ],
        commonProblems: [
            { problem: 'The sepia tone is too orange or intense.', solution: 'Lower the intensity slider to reduce the strength of the brownish tint, allowing more of the original image\'s natural contrast to show through.' },
            { problem: 'The image lost its original colors.', solution: 'Applying a sepia filter replaces the original colors with monochromatic brown tones. If you want to keep original colors, this effect may not be suitable.' }
        ],
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
        directAnswer: 'Motion Blur applies a directional smearing effect to your images, simulating the look of high-speed movement or a panning camera to add dynamic energy to static photos.',
        steps: [
            { title: 'Choose an action photo', description: 'Upload an image that could benefit from a sense of speed or movement.' },
            { title: 'Set angle and intensity', description: 'Adjust the angle to match the direction of the desired motion, and increase the intensity to make the speed effect more dramatic.' },
            { title: 'Download the dynamic image', description: 'Save your newly action-packed photo.' }
        ],
        commonProblems: [
            { problem: 'The blur is going in the wrong direction.', solution: 'Adjust the angle setting. For horizontal movement, use 0 or 180 degrees. For vertical, use 90 or 270 degrees.' },
            { problem: 'The main subject is too blurred to recognize.', solution: 'Decrease the blur intensity. Heavy motion blur will obscure details, so finding the right balance is key to keeping the subject visible while showing speed.' }
        ],
        features: ['Adjustable blur angle for any direction of motion', 'Intensity control from subtle to dramatic', 'Simulates realistic camera pan and motion effects', 'Client-side processing for instant preview', 'Works with all common image formats'],
        useCases: ['Adding sense of speed and action to sports photos', 'Creating dynamic car and vehicle motion shots', 'Making abstract art with directional movement effects', 'Simulating camera pan effects for cinematic look'],
        faqs: [{ question: 'Can I control the direction of the motion blur?', answer: 'Yes! Set the angle in degrees to control the direction — 0° for horizontal, 90° for vertical, or any custom angle for diagonal motion effects.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-image', 'blur-background', 'pixelate-image'],
    },
    'censor-photo': {
        about: 'Censor Photo lets you hide sensitive areas of images using blur, pixelation, or solid black bars. Draw rectangles over the content you want to censor — personal information, license plates, faces, or any private data. Essential for journalists, bloggers, HR departments, and anyone sharing images that contain sensitive information.',
        directAnswer: 'Censor Photo is a privacy tool that lets you selectively hide sensitive information like text, faces, or license plates by drawing customizable blur, pixelation, or black box regions over them.',
        steps: [
            { title: 'Upload image with sensitive data', description: 'Open the screenshot or photo containing information you need to hide.' },
            { title: 'Draw censor regions', description: 'Click and drag over the sensitive areas, then choose between blur, pixelate, or black bar effects for each region.' },
            { title: 'Export secure image', description: 'Download the safely redacted image. The original hidden pixels are permanently removed.' }
        ],
        commonProblems: [
            { problem: 'I accidentally censored the wrong area.', solution: 'You can select the drawn censor box and delete it, or adjust its size and position before downloading the final image.' },
            { problem: 'The text is still slightly visible through the blur.', solution: 'Increase the blur or pixelation intensity for that specific region, or switch the censor style to a solid black bar for absolute redaction.' }
        ],
        features: ['Multiple censor styles: blur, pixelate, or black bar', 'Draw rectangles over areas to censor', 'Adjustable intensity for blur and pixelation', 'Multiple censor regions on one image', 'Client-side processing — images never leave your device'],
        useCases: ['Redacting personal information from document screenshots', 'Censoring license plates and addresses in photos', 'Blurring sensitive content for blog posts and articles', 'Hiding confidential data in business presentations'],
        faqs: [{ question: 'Is the censored content truly hidden?', answer: 'Yes, when you download the censored image, the hidden areas are permanently obscured. The original pixel data beneath the censoring is destroyed in the output file.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['blur-face', 'pixelate-image', 'blur-image'],
    },
    'picture-to-pixel-art': {
        about: 'Pixel Art Converter transforms any photograph into retro-style pixel art reminiscent of classic 8-bit and 16-bit video games. Adjust the pixel size and color palette to create anything from subtle low-res effects to bold retro masterpieces. Perfect for creating game assets, retro-themed profile pictures, and nostalgic social media content.',
        directAnswer: 'The Pixel Art Converter turns standard photographs into retro video game-style pixel graphics by reducing the color palette and clustering pixels into visible, blocky squares.',
        steps: [
            { title: 'Upload a clear photo', description: 'Select an image with strong contrast and recognizable shapes.' },
            { title: 'Adjust pixel size', description: 'Change the block size to determine how detailed or abstract the retro 8-bit effect will be.' },
            { title: 'Download the pixel art', description: 'Save the image. It will be exported as a high-quality PNG to keep the pixel edges perfectly crisp.' }
        ],
        commonProblems: [
            { problem: 'The final pixel art looks like a messy blur rather than a retro graphic.', solution: 'This often happens with highly detailed or cluttered photos. Try increasing the pixel size or use simpler photos with clear subjects and plain backgrounds.' },
            { problem: 'The colors look washed out.', solution: 'The tool reduces the color palette to mimic older systems. For punchier results, try enhancing your photo\'s contrast and saturation before converting it.' }
        ],
        features: ['Adjustable pixel block size for fine to coarse pixel art', 'Color palette reduction for authentic retro look', 'Real-time preview of pixel art conversion', 'Client-side processing for instant results', 'Export as PNG for crisp pixel edges'],
        useCases: ['Creating retro game-style profile pictures and avatars', 'Making 8-bit style art from real photographs', 'Designing pixel art assets for indie games', 'Producing nostalgic retro content for social media'],
        faqs: [{ question: 'Can I control the level of pixelation?', answer: 'Yes! Adjust the pixel size to control how blocky the result is. Larger pixels create a more retro 8-bit look, while smaller pixels produce a subtler effect.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, GIF, BMP',
        relatedTools: ['pixelate-image', 'grayscale-image', 'resize-image'],
    },
    'beautify-image': {
        about: 'Beautify Image uses AI to enhance portrait photos automatically — smoothing skin texture, brightening under-eye areas, balancing facial lighting, and subtly improving overall appearance. The AI applies natural-looking retouching that enhances without creating an artificial look. Perfect for preparing profile photos, headshots, and portrait images for professional use.',
        directAnswer: 'Beautify Image uses AI to apply subtle, professional-grade retouching to portraits. It automatically smooths skin, balances lighting, and brightens features while maintaining a natural, realistic appearance.',
        steps: [
            { title: 'Upload a selfie or headshot', description: 'Select a portrait photo with clear visibility of the subject\'s face.' },
            { title: 'Review the AI enhancement', description: 'Our AI automatically analyzes the face and applies balanced skin smoothing and lighting corrections.' },
            { title: 'Download the enhanced portrait', description: 'Save your polished photo, ready for professional profiles or social media.' }
        ],
        commonProblems: [
            { problem: 'The skin smoothing looks too artificial.', solution: 'Our AI aims for natural results, but heavily textured skin or harsh lighting can cause overcompensation. Try uploading a photo with softer, more even lighting.' },
            { problem: "It didn't fix a specific large blemish.", solution: 'Beautify Image applies general enhancements. For targeted removal of specific spots or acne, use our dedicated Retouch Photo tool instead.' }
        ],
        features: ['AI skin smoothing with natural texture preservation', 'Under-eye brightening and blemish reduction', 'Facial lighting balance and color correction', 'Natural, non-artificial enhancement results', 'Works on selfies, portraits, and group photos'],
        useCases: ['Preparing professional headshots for LinkedIn', 'Enhancing selfies for social media posting', 'Retouching wedding and event photos', 'Improving passport and ID photos'],
        faqs: [{ question: 'Does it look artificial?', answer: 'No. Our AI applies subtle, natural-looking enhancements that improve appearance while preserving skin texture. The result looks like professional photography, not heavy editing.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, HEIC',
        relatedTools: ['retouch-photo', 'increase-image-quality', 'remove-image-background'],
    },
    'retouch-photo': {
        about: 'Retouch Photo uses AI to automatically detect and remove skin blemishes, spots, acne marks, and small imperfections from portrait photos. The AI intelligently fills removed areas with surrounding skin texture for a flawless, natural result. Unlike manual retouching that takes hours, this tool delivers professional results in seconds.',
        directAnswer: 'Retouch Photo utilizes AI to automatically identify and remove skin blemishes, acne, and small spots from portraits, seamlessly blending the corrected areas with natural skin texture.',
        steps: [
            { title: 'Upload your portrait', description: 'Select an image containing skin blemishes or spots you wish to remove.' },
            { title: 'Let AI detect and retouch', description: 'The tool will automatically find imperfections and intelligently replace them with surrounding natural skin texture.' },
            { title: 'Download the flawless photo', description: 'Save your professionally retouched image.' }
        ],
        commonProblems: [
            { problem: 'A large scar or birthmark was not removed.', solution: 'The AI is trained specifically to target common, small blemishes like acne or freckles. Very large marks may require professional manual editing software.' },
            { problem: 'The retouched area looks blurry.', solution: 'If the blemish was in a highly detailed area (like near an eyebrow or facial hair), the AI might struggle to recreate the complex texture perfectly.' }
        ],
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
        directAnswer: 'The DPI Converter changes the dots per inch (DPI) resolution of your image to meet specific printing or web requirements. You can upload an image, select standard resolutions like 300 DPI for high-quality printing, and instantly download the optimized file without quality loss.',
        steps: [
            { title: 'Upload Image', description: 'Select the photo or document whose DPI you need to change or verify.' },
            { title: 'Choose Target DPI', description: 'Select a standard DPI like 300 for print or enter a custom DPI value.' },
            { title: 'Convert and Download', description: 'Apply the new DPI setting and download your print-ready image.' }
        ],
        commonProblems: [
            { problem: 'My print shop says the image is still low quality.', solution: 'Changing DPI only updates the metadata or resamples the pixels. If the original image is too small, use our Upscale Image tool first to add more detail.' },
            { problem: 'The file size became huge after conversion.', solution: 'If you resampled a low-DPI image to 300 DPI, the pixel count increased. Uncheck "resample" if you only want to change the print metadata.' }
        ],
        features: ['Check current image DPI/PPI information', 'Convert to standard DPI: 72, 96, 150, 200, 300, 600', 'Custom DPI input for non-standard requirements', 'Option to resample or just update metadata', 'Supports print and web DPI standards'],
        useCases: ['Preparing images for professional printing at 300 DPI', 'Meeting publisher and print shop DPI requirements', 'Converting web images (72 DPI) to print quality', 'Checking DPI of received images before printing'],
        faqs: [{ question: 'What DPI should I use for printing?', answer: '300 DPI is the standard for high-quality photo printing. 150 DPI for large format posters. 600 DPI for fine art and professional publications.' }, { question: 'Does changing DPI change the file size?', answer: 'If you resample, pixel dimensions change and so does file size. If you only update DPI metadata, file size stays the same.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, TIFF, BMP',
        relatedTools: ['resize-image', 'compress-image', 'upscale-image', 'increase-image-quality'],
    },
    'upscale-image': {
        about: 'AI Upscale Image increases your photo resolution by 2x or 4x using advanced AI super-resolution technology. Unlike traditional upscaling that produces blurry results, our AI reconstructs fine details, sharpens edges, and fills in missing information. Perfect for enlarging old photos, low-resolution downloads, screenshots, and small product images.',
        directAnswer: 'The AI Upscale Image tool artificially increases the resolution of your photos by 2x or 4x using advanced machine learning. It reconstructs missing details and sharpens edges, allowing you to enlarge small images for printing or high-resolution displays without them becoming blurry.',
        steps: [
            { title: 'Upload Low-Res Image', description: 'Select the small or blurry image you want to enlarge.' },
            { title: 'Select Upscale Factor', description: 'Choose whether you want to double (2x) or quadruple (4x) the image resolution.' },
            { title: 'Process and Save', description: 'Let the AI rebuild the details, then download your high-resolution image.' }
        ],
        commonProblems: [
            { problem: 'The upscaled image looks slightly painted or unnatural.', solution: 'AI upscaling tries to guess missing details. For photos with complex textures, stick to 2x upscaling rather than 4x for more natural results.' },
            { problem: 'Processing takes a long time.', solution: 'AI super-resolution is computationally intensive. Please be patient, as the tool analyzes and reconstructs millions of pixels.' }
        ],
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
        directAnswer: 'The PNG to JPEG tool changes large PNG files into smaller, highly compatible JPEG images. It removes transparency and applies compression, drastically reducing file size while maintaining visual quality, making it perfect for web uploads and email attachments.',
        steps: [
            { title: 'Upload PNG Files', description: 'Select one or more PNG images to convert.' },
            { title: 'Adjust Background & Quality', description: 'Choose a background color for transparent areas and set the JPEG compression quality.' },
            { title: 'Convert to JPEG', description: 'Process the images and download the smaller JPEG files.' }
        ],
        commonProblems: [
            { problem: 'My image now has a white background instead of being transparent.', solution: 'JPEG does not support transparency. Select a different background color in the tool settings before converting if you don\'t want white.' },
            { problem: 'The image looks blurry or pixelated after conversion.', solution: 'Your JPEG quality setting is too low. Increase the quality slider to 80-90% for a better balance of file size and visual fidelity.' }
        ],
        features: ['Adjustable JPEG quality from 1-100%', 'Significant file size reduction (5-10x smaller)', 'Custom background color for transparent PNGs', 'Preserves EXIF metadata', 'Batch conversion support'],
        useCases: ['Reducing large PNG screenshot file sizes for web upload', 'Converting PNG photos to JPEG for email attachments', 'Preparing images for platforms that require JPEG format', 'Batch converting design exports to web-friendly JPEG'],
        faqs: [{ question: 'What happens to transparency when converting PNG to JPEG?', answer: 'JPEG does not support transparency. Transparent areas will be filled with a solid color (white by default). You can choose a custom background color.' }, { question: 'What quality setting should I use?', answer: '80-85% offers excellent balance between file size and visual quality. Use 90-100% for prints. Use 60-75% for web thumbnails.' }],
        supportedFormats: 'Input: PNG — Output: JPG/JPEG',
        relatedTools: ['jpeg-to-png', 'webp-to-jpg', 'compress-image', 'resize-image'],
    },
    'jpeg-to-png': {
        about: 'JPEG to PNG converts your JPEG/JPG images to lossless PNG format. PNG preserves every pixel without compression artifacts and supports transparency. Essential when you need lossless quality for graphic design, when adding transparent backgrounds, or when working with images that require precise pixel-level accuracy.',
        directAnswer: 'The JPEG to PNG tool transforms standard JPEG photos into the lossless PNG format. This conversion prevents further compression artifacts and prepares your image for design work that might require adding a transparent background later.',
        steps: [
            { title: 'Upload JPEGs', description: 'Select the JPEG photos you want to convert to PNG format.' },
            { title: 'Confirm Settings', description: 'Verify your files are ready for lossless conversion without further quality degradation.' },
            { title: 'Download PNGs', description: 'Convert and save your new PNG files ready for editing or design.' }
        ],
        commonProblems: [
            { problem: 'The PNG file size is much larger than the original JPEG.', solution: 'This is normal. PNG is a lossless format, so it stores data uncompressed to ensure maximum quality, resulting in larger file sizes.' },
            { problem: 'Converting didn\'t fix the blurriness in my JPEG.', solution: 'Converting to PNG prevents future quality loss, but it cannot restore details that were already lost to JPEG compression artifacts.' }
        ],
        features: ['Lossless conversion preserving every pixel', 'PNG transparency support', 'No additional compression artifacts introduced', 'Ideal for design and illustration workflows', 'Batch conversion support'],
        useCases: ['Preparing images for design work requiring lossless quality', 'Converting photos before adding transparent backgrounds', 'Archiving important images in lossless format', 'Converting product photos for design software workflows'],
        faqs: [{ question: 'Will the PNG file be larger than the JPEG?', answer: 'Yes, typically 2-10x larger. PNG uses lossless compression while JPEG uses lossy compression. The larger file size is the trade-off for perfect quality.' }],
        supportedFormats: 'Input: JPG/JPEG — Output: PNG',
        relatedTools: ['png-to-jpeg', 'remove-image-background', 'compress-image'],
    },
    'webp-to-jpg': {
        about: 'WebP to JPG converts Google\'s WebP format to universally compatible JPEG. WebP is widely used on the web for its small file sizes but isn\'t supported by all software and older devices. Convert to JPG for maximum compatibility across all image viewers, editors, social media, and print services.',
        directAnswer: 'The WebP to JPG converter changes modern WebP images into the traditional JPEG format. This ensures your downloaded images can be opened, viewed, and edited in any older software, social media platform, or device that doesn\'t support WebP.',
        steps: [
            { title: 'Upload WebP Image', description: 'Select the WebP file you downloaded from a website.' },
            { title: 'Select Quality', description: 'Adjust the output JPEG quality slider based on your file size needs.' },
            { title: 'Convert and Download', description: 'Process the conversion and download the universally compatible JPG file.' }
        ],
        commonProblems: [
            { problem: 'Transparent parts of my WebP turned white.', solution: 'Since JPEG does not support transparency, any transparent areas in your WebP file will default to a solid background color.' },
            { problem: 'The image looks slightly different.', solution: 'WebP and JPEG use different compression algorithms. Ensure your quality setting is at 85% or higher to minimize visible differences.' }
        ],
        features: ['Converts WebP to universally compatible JPEG', 'Adjustable JPEG quality output', 'Handles both lossy and lossless WebP inputs', 'Preserves image dimensions and color accuracy', 'Batch conversion support'],
        useCases: ['Making web-downloaded WebP images compatible with older software', 'Converting WebP screenshots for sharing', 'Preparing WebP images for print services', 'Opening WebP files on devices that lack support'],
        faqs: [{ question: 'Why can\'t I open WebP files on my computer?', answer: 'WebP is a newer Google format. While modern browsers support it, some older image viewers don\'t. Converting to JPEG ensures compatibility with virtually all software.' }],
        supportedFormats: 'Input: WebP — Output: JPG/JPEG',
        relatedTools: ['png-to-jpeg', 'heic-to-jpg', 'compress-image'],
    },
    'heic-to-jpg': {
        about: 'HEIC to JPG converts iPhone\'s HEIC/HEIF photo format to standard JPEG that works everywhere. Since iOS 11, Apple devices save photos in HEIC format — a newer format that offers better compression but isn\'t universally supported on Windows, Android, and many websites. Convert your iPhone photos to JPG for easy sharing, uploading, and editing.',
        directAnswer: 'The HEIC to JPG tool converts Apple\'s high-efficiency photo format into standard JPEGs. It solves compatibility issues, allowing you to easily view, edit, and upload iPhone photos on Windows PCs, Android devices, and websites that don\'t support HEIC.',
        steps: [
            { title: 'Upload iPhone Photos', description: 'Select the HEIC files directly from your Apple device or computer.' },
            { title: 'Set JPEG Quality', description: 'Choose your desired output quality for the converted photos.' },
            { title: 'Save as JPG', description: 'Download the converted images, ready for universal sharing and viewing.' }
        ],
        commonProblems: [
            { problem: 'My Live Photos only converted as a single image.', solution: 'HEIC to JPG conversion extracts the primary still frame. The video component of Live Photos is not retained in a standard JPEG file.' },
            { problem: 'The tool is having trouble with my large batch of photos.', solution: 'HEIC decoding takes considerable memory. Try converting in smaller batches of 10-20 images at a time for optimal stability.' }
        ],
        features: ['Converts Apple HEIC/HEIF to standard JPEG', 'Adjustable output quality', 'Preserves EXIF metadata from iPhone photos', 'Handles Live Photo stills and burst shots', 'Batch conversion for multiple HEIC files'],
        useCases: ['Converting iPhone photos for sharing with Android and Windows users', 'Uploading HEIC photos to websites that only accept JPEG', 'Preparing iPhone photos for editing in non-Apple software', 'Converting bulk iPhone photo libraries to JPEG'],
        faqs: [{ question: 'Why does my iPhone save photos as HEIC?', answer: 'Since iOS 11, iPhones use HEIC by default because it produces smaller files than JPEG at the same quality. You can change this in Settings > Camera > Formats.' }],
        supportedFormats: 'Input: HEIC, HEIF — Output: JPG/JPEG',
        relatedTools: ['webp-to-jpg', 'png-to-jpeg', 'compress-image'],
    },
    'image-to-text': {
        about: 'Image to Text (OCR) extracts readable text from images using Optical Character Recognition supporting 100+ languages. Upload a photo of a document, receipt, whiteboard, or sign, and the OCR engine will recognize and output editable, copyable text. Supports printed and handwritten text in Latin, Cyrillic, Chinese, Japanese, Korean, Arabic, Hindi, and more.',
        directAnswer: 'The Image to Text tool uses Optical Character Recognition (OCR) to scan photos and extract the text within them. It allows you to quickly convert pictures of documents, receipts, or notes into editable digital text that you can copy and paste.',
        steps: [
            { title: 'Upload Image with Text', description: 'Select a clear photo of a document, sign, or receipt.' },
            { title: 'Select Language', description: 'Choose the language of the text in the image to improve recognition accuracy.' },
            { title: 'Extract and Copy', description: 'Run the OCR process and copy the extracted text to your clipboard.' }
        ],
        commonProblems: [
            { problem: 'The extracted text contains lots of errors.', solution: 'Ensure your image is well-lit, not blurry, and the text is reasonably large. Cropping out background noise before uploading can also vastly improve accuracy.' },
            { problem: 'It\'s not recognizing my handwriting.', solution: 'OCR technology works best on printed text. While it supports some handwriting, cursive or messy writing will have lower accuracy rates.' }
        ],
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
        directAnswer: 'The Signature Maker allows you to create a digital signature by drawing on your screen, typing your name in cursive fonts, or uploading a photo of your signature. It outputs a clean, transparent PNG perfect for signing electronic documents.',
        steps: [
            { title: 'Choose Creation Method', description: 'Select whether to draw, type, or upload your signature.' },
            { title: 'Customize Appearance', description: 'Adjust the pen thickness, color, or select a handwriting font style.' },
            { title: 'Download Signature', description: 'Save your digital signature as a transparent PNG file for document use.' }
        ],
        commonProblems: [
            { problem: 'My drawn signature looks too shaky.', solution: 'Try typing your name and selecting one of the handwriting fonts instead, or use a stylus on a touchscreen device for better control.' },
            { problem: 'The signature has a white background when I paste it.', solution: 'Make sure you are downloading it directly as a transparent PNG, and check that the application you are pasting it into supports image transparency.' }
        ],
        features: ['Draw signatures with mouse, stylus, or finger', 'Type-to-signature with multiple handwriting fonts', 'Upload existing signature images', 'Export as transparent PNG', 'Adjustable pen color and stroke width'],
        useCases: ['Creating digital signatures for PDF documents', 'Generating email signature images', 'Making consistent signatures for contracts and agreements', 'Creating stylized name signatures for branding'],
        faqs: [{ question: 'Can I use this signature on legal documents?', answer: 'The tool creates a visual signature image. Legal validity of digital signatures depends on your jurisdiction and the document type. For legally binding e-signatures, consider dedicated e-signature platforms like DocuSign.' }, { question: 'What format is the signature output?', answer: 'Transparent PNG — perfect for overlaying on documents, PDFs, and emails without a white box background.' }],
        supportedFormats: 'Output: Transparent PNG',
        relatedTools: ['resize-signature', 'merge-photo-and-signature', 'add-text-to-image'],
    },
    'resize-signature': {
        about: 'Resize Signature lets you resize your digital signature to exact dimensions required by applications, forms, and documents. Common presets include 6cm × 2cm (Indian government forms), 3.5cm × 1.5cm, and custom sizes. Enter dimensions in pixels, cm, or mm for precise results. Maintains signature clarity at any size.',
        directAnswer: 'The Resize Signature tool adjusts your signature image to precise physical or pixel dimensions. It is specifically designed to meet strict size requirements for official applications, like the 6x2 cm format often required for government exams and forms.',
        steps: [
            { title: 'Upload Signature', description: 'Select the existing image of your digital signature.' },
            { title: 'Enter Target Dimensions', description: 'Input the required width and height in pixels, centimeters, or millimeters.' },
            { title: 'Resize and Download', description: 'Process the image to scale it precisely and download the resized file.' }
        ],
        commonProblems: [
            { problem: 'The signature looks stretched or distorted.', solution: 'If your target dimensions have a different aspect ratio than your original image, uncheck "Maintain Aspect Ratio" or crop your signature first.' },
            { problem: 'The file size in KB is too large for my form.', solution: 'If the form has a strict KB limit, resize the dimensions here first, then use our Compress Image tool to reduce the file size.' }
        ],
        features: ['Preset sizes: 6×2cm, 3.5×1.5cm, and more', 'Custom dimensions in pixels, cm, or mm', 'Maintains signature clarity and sharpness', 'Supports transparent PNG input/output', 'DPI-aware sizing for print'],
        useCases: ['Resizing signatures for Indian government exam forms (6×2cm)', 'Preparing signature images for job applications', 'Matching exact signature size requirements for official documents', 'Scaling signatures for different document types'],
        faqs: [{ question: 'What size should my signature be for government forms?', answer: 'Most Indian government forms require 6cm × 2cm. Check your specific form requirements. Enter the dimensions and the tool will resize precisely.' }],
        supportedFormats: 'Input: PNG, JPG — Output: PNG, JPG',
        relatedTools: ['generate-signature', 'merge-photo-and-signature', 'resize-image'],
    },
    'merge-photo-and-signature': {
        about: 'Merge Photo & Signature combines your passport-size photo and signature into a single composite image — a common requirement for Indian government exam applications, job forms, and official submissions. Upload both images, position them, and download the merged result meeting exact specifications.',
        directAnswer: 'The Merge Photo & Signature tool combines a passport photo and a signature into a single formatted image. This is primarily used to instantly meet specific application guidelines, such as those required by Indian government and banking exams.',
        steps: [
            { title: 'Upload Both Images', description: 'Select your passport-sized photograph and your signature image.' },
            { title: 'Adjust Positioning', description: 'Align the signature beneath the photo and adjust spacing or scaling.' },
            { title: 'Download Combined Image', description: 'Generate the composite image and save it for your application form.' }
        ],
        commonProblems: [
            { problem: 'The signature appears much wider than the photo.', solution: 'Use the scaling tools to resize the signature so it sits neatly beneath the photo boundaries without stretching.' },
            { problem: 'The combined file is rejected by the application portal.', solution: 'Check the exact pixel and file size (KB) requirements of the portal. You may need to compress the final merged image to fit within their limits.' }
        ],
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
        directAnswer: 'The Photo Metadata Viewer allows you to easily extract and read hidden EXIF data from your images, including camera settings, date taken, and GPS locations, directly in your browser without uploading files.',
        steps: [
            { title: 'Upload Image', description: 'Select a JPG, PNG, or TIFF image to view its hidden metadata.' },
            { title: 'Analyze Metadata', description: 'The tool instantly extracts EXIF data like camera model, exposure settings, and location.' },
            { title: 'Review Details', description: 'Scroll through the categorized metadata fields to verify image properties and authenticity.' }
        ],
        commonProblems: [
            { problem: 'No GPS data is showing.', solution: 'Your camera or phone might have location services disabled when taking the picture, or the image was shared via an app that strips metadata.' },
            { problem: 'Metadata appears empty.', solution: 'The image may have been processed by social media platforms or optimization tools that automatically remove EXIF data for privacy.' }
        ],
        features: ['Full EXIF data display: camera, lens, settings', 'GPS coordinates and location data', 'Date/time information', 'Image dimensions, resolution, and color space', 'Client-side processing — images never uploaded'],
        useCases: ['Photographers reviewing camera settings of their shots', 'Verifying image authenticity and origin', 'Checking GPS location embedded in photos', 'Analyzing image technical properties'],
        faqs: [{ question: 'What metadata can I see?', answer: 'You can view camera make/model, lens info, shutter speed, aperture, ISO, GPS coordinates, date taken, dimensions, DPI, color space, software used, and more.' }, { question: 'Can I see where a photo was taken?', answer: 'If the photo has GPS data embedded (common with smartphone photos), you\'ll see the exact coordinates and can view the location on a map.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, TIFF, HEIC',
        relatedTools: ['photo-exif-editor', 'remove-image-metadata', 'convert-dpi'],
    },
    'photo-exif-editor': {
        about: 'Edit Metadata lets you modify EXIF data in your images — change the date taken, update camera information, edit GPS coordinates, modify copyright details, and more. Essential for photographers organizing their libraries, correcting wrong dates, updating copyright information, and managing image metadata for publishing.',
        directAnswer: 'The Photo EXIF Editor lets you modify or add hidden metadata tags to your images, such as correcting the capture date, updating camera settings, or adding copyright information for professional publishing.',
        steps: [
            { title: 'Select Image', description: 'Upload the photo containing the EXIF data you want to modify.' },
            { title: 'Edit EXIF Tags', description: 'Modify the date, camera model, artist, or GPS coordinates in the editable fields.' },
            { title: 'Save Image', description: 'Download the newly updated image with the modified metadata embedded.' }
        ],
        commonProblems: [
            { problem: 'Edited dates are not showing in my photo viewer.', solution: 'Some viewers cache old data. Try refreshing the folder or using a dedicated EXIF viewer to confirm the changes.' },
            { problem: 'Cannot edit certain fields.', solution: 'Some proprietary maker notes cannot be safely modified without corrupting the file, so we restrict edits to standard EXIF tags.' }
        ],
        features: ['Edit date/time, camera info, GPS coordinates', 'Update copyright and author information', 'Modify image description and tags', 'Batch metadata editing', 'Client-side processing for privacy'],
        useCases: ['Correcting wrong dates on photos after timezone travel', 'Adding copyright information before publishing', 'Updating GPS coordinates for location accuracy', 'Organizing photo libraries with consistent metadata'],
        faqs: [{ question: 'Can I change the date a photo was taken?', answer: 'Yes! You can modify the DateTimeOriginal and other date fields to correct timestamps, helpful when your camera date was wrong or for organizing photos.' }],
        supportedFormats: 'JPG, JPEG, PNG, WebP, TIFF',
        relatedTools: ['photo-metadata-viewer', 'remove-image-metadata'],
    },
    'remove-image-metadata': {
        about: 'Remove Metadata strips all EXIF and metadata from your images for privacy protection. Photos from smartphones and cameras contain hidden data including GPS location, device information, date/time, and more. Removing metadata before sharing online prevents others from seeing where, when, and with what device your photos were taken.',
        directAnswer: 'The Remove Image Metadata tool completely strips hidden EXIF data, including GPS locations and camera details, from your photos to protect your privacy before sharing them online.',
        steps: [
            { title: 'Upload Photo', description: 'Select the image you want to sanitize. You can upload multiple files for batch processing.' },
            { title: 'Strip Metadata', description: 'The tool instantly removes all EXIF, IPTC, and XMP tags without altering the image quality.' },
            { title: 'Download Safe Image', description: 'Save the cleaned image, which is now safe to share without revealing your private data.' }
        ],
        commonProblems: [
            { problem: 'The file size barely changed.', solution: 'Metadata only takes up a few kilobytes. Removing it will not significantly reduce the overall file size of a large photo.' },
            { problem: 'Image still has a timestamp.', solution: 'The visible timestamp on the photo itself is part of the image pixels, not metadata. This tool only removes hidden EXIF data.' }
        ],
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
        directAnswer: 'Compress PDF drastically reduces the file size of large PDF documents by optimizing internal images and structures, making them small enough to send via email without losing readability.',
        steps: [
            { title: 'Upload PDF', description: 'Select a large PDF document that you need to make smaller for sharing.' },
            { title: 'Choose Compression', description: 'Select a compression level (low, medium, or high) based on your quality and size requirements.' },
            { title: 'Download PDF', description: 'Save the compressed PDF, which is now optimized and ready for email attachments.' }
        ],
        commonProblems: [
            { problem: 'PDF didn\'t compress much.', solution: 'Text-heavy PDFs are already highly optimized. Compression works best on PDFs containing large or uncompressed images.' },
            { problem: 'Images look blurry after compression.', solution: 'High compression reduces image resolution. Try using the Medium or Low compression setting to preserve better image quality.' }
        ],
        features: ['Three compression levels: low, medium, high', 'Handles text-heavy and image-heavy PDFs', 'Maintains readable text quality', 'Significant file size reduction (50-90%)', 'Secure processing with automatic cleanup'],
        useCases: ['Reducing PDF size for email attachments under 10 MB', 'Compressing scanned documents for upload portals', 'Optimizing large reports for web distribution', 'Reducing storage usage for PDF archives'],
        faqs: [{ question: 'How much can I compress a PDF?', answer: 'Compression depends on content type. Image-heavy PDFs can be reduced by 50-90%. Text-only PDFs have less room for compression. Try different levels to find the best balance.' }, { question: 'Will compressed PDFs still be readable?', answer: 'Yes. Text remains sharp and readable at all compression levels. Images may show slight quality reduction at high compression but remain clear.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['merge-pdf', 'split-pdf', 'compress-image'],
    },
    'merge-pdf': {
        about: 'Merge PDF combines multiple PDF files into a single document. Upload PDFs, drag to reorder, and download the merged result. Perfect for combining report sections, merging scanned pages, creating document packages, and organizing multi-part files into one cohesive PDF.',
        directAnswer: 'Merge PDF allows you to combine multiple PDF files into a single continuous document. You can easily drag and drop files to reorder them before joining them together.',
        steps: [
            { title: 'Select PDFs', description: 'Upload two or more PDF files that you want to combine into a single document.' },
            { title: 'Reorder Files', description: 'Drag and drop the uploaded files into the exact sequence you want them to appear.' },
            { title: 'Merge & Download', description: 'Click merge to combine the files, then download your single, unified PDF document.' }
        ],
        commonProblems: [
            { problem: 'Merged file is too large.', solution: 'Combining many large PDFs will result in a huge file. Use the Compress PDF tool afterward to reduce the final file size.' },
            { problem: 'Pages are in the wrong order.', solution: 'Make sure to visually verify the file sequence in the drag-and-drop preview area before clicking the merge button.' }
        ],
        features: ['Combine unlimited PDF files into one', 'Drag and drop to reorder files', 'Preserves original formatting and quality', 'Handles standard PDF inputs', 'Fast processing'],
        useCases: ['Combining multiple report sections into one document', 'Merging scanned document pages into a single PDF', 'Creating application packages from separate files', 'Organizing invoices and receipts into monthly compilations'],
        faqs: [{ question: 'Is there a limit on the number of PDFs I can merge?', answer: 'There is no strict limit. You can merge dozens of PDF files. For very large batches, we recommend keeping total file size under 50 MB for optimal performance.' }, { question: 'Will the formatting be preserved?', answer: 'Yes, each page retains its original formatting, fonts, images, and layout. The merge simply concatenates pages in your specified order.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['split-pdf', 'compress-pdf', 'reorder-pdf-pages', 'image-to-pdf'],
    },
    'split-pdf': {
        about: 'Split PDF lets you extract specific pages or divide a PDF into multiple smaller files. Select individual pages, page ranges, or split at fixed intervals. Perfect for extracting chapters from books, separating specific pages from reports, and breaking large PDFs into manageable sections.',
        directAnswer: 'Split PDF helps you break a large PDF document into smaller files or extract specific pages and page ranges into a brand new PDF document.',
        steps: [
            { title: 'Upload PDF', description: 'Select a multi-page PDF document that you want to separate or extract pages from.' },
            { title: 'Select Pages', description: 'Choose specific page ranges to extract, or set fixed intervals to split the document evenly.' },
            { title: 'Save Splits', description: 'Download your extracted pages as a new PDF or download a ZIP file of all split sections.' }
        ],
        commonProblems: [
            { problem: 'Cannot extract from a protected PDF.', solution: 'You cannot split an encrypted PDF. Use the Unlock PDF tool first to remove the password protection.' },
            { problem: 'Output ZIP file is corrupted.', solution: 'Ensure your download completes fully before opening the ZIP. Large splits may take a moment to generate properly.' }
        ],
        features: ['Extract specific pages or page ranges', 'Split into equal-sized sections', 'Select individual pages with visual preview', 'Download each split section separately', 'Preserves original page quality'],
        useCases: ['Extracting specific chapters from e-books', 'Separating individual pages from multi-page reports', 'Breaking large documents into emailable sections', 'Isolating forms or certificates from bundled PDFs'],
        faqs: [{ question: 'Can I extract non-consecutive pages?', answer: 'Yes! Select any combination of pages — consecutive or non-consecutive. For example, extract pages 1, 3, 7-10, 15 into a single new PDF.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['merge-pdf', 'compress-pdf', 'delete-pdf-pages', 'reorder-pdf-pages'],
    },
    'pdf-to-jpg': {
        about: 'PDF to JPG converts each page of your PDF document into high-quality JPG or PNG images. Set the output resolution and quality, then download individual page images or all pages as a ZIP file. Perfect for extracting images from PDFs, creating presentation slides from PDF reports, and sharing PDF content as images on social media.',
        directAnswer: 'PDF to JPG extracts every page of your PDF document and converts them into high-quality JPEG images, perfect for sharing document previews on social media.',
        steps: [
            { title: 'Upload PDF', description: 'Select the PDF document you wish to convert into image files.' },
            { title: 'Set Quality', description: 'Choose your desired output resolution (e.g., 150 DPI for web, 300 DPI for print).' },
            { title: 'Download Images', description: 'Download individual pages as JPGs or grab the entire set at once in a ZIP archive.' }
        ],
        commonProblems: [
            { problem: 'Text looks blurry in the JPG.', solution: 'The default resolution might be too low. Increase the DPI setting to 300 for crisp, readable text.' },
            { problem: 'Transparent backgrounds turned black.', solution: 'JPG doesn\'t support transparency. If your PDF has transparent elements, try converting to PNG instead.' }
        ],
        features: ['Convert each PDF page to JPG or PNG', 'Adjustable output resolution and quality', 'Download individual pages or all as ZIP', 'High-quality rendering of text and graphics', 'Handles multi-page PDFs of any length'],
        useCases: ['Extracting pages as images for presentations', 'Converting PDF reports to images for social media sharing', 'Creating image previews of PDF documents', 'Converting PDF certificates and diplomas to image format'],
        faqs: [{ question: 'What resolution are the output images?', answer: 'You can set the output resolution. Higher DPI produces larger, sharper images. 150 DPI is good for screen viewing, 300 DPI for printing.' }],
        supportedFormats: 'Input: PDF — Output: JPG, PNG',
        relatedTools: ['image-to-pdf', 'compress-pdf', 'split-pdf'],
    },
    'rotate-pdf': {
        about: 'Rotate PDF lets you rotate individual pages or all pages in your PDF document by 90°, 180°, or 270°. Fix scanned documents that were fed sideways, correct orientation for specific pages, and ensure consistent page orientation throughout your document.',
        directAnswer: 'Rotate PDF allows you to permanently fix the orientation of upside-down or sideways pages in your PDF document by rotating them 90 or 180 degrees.',
        steps: [
            { title: 'Upload PDF', description: 'Select a PDF document that contains pages with incorrect orientation.' },
            { title: 'Rotate Pages', description: 'Use the preview thumbnails to rotate individual pages, or apply a rotation to all pages at once.' },
            { title: 'Apply & Save', description: 'Apply the rotation settings and download the permanently corrected PDF file.' }
        ],
        commonProblems: [
            { problem: 'Rotation is only temporary in my viewer.', solution: 'Some PDF readers only rotate your view temporarily. Our tool permanently modifies the file so it opens correctly everywhere.' },
            { problem: 'Only half the page rotated.', solution: 'PDF rotation applies to the entire page canvas. If the content looks cut off, the original PDF may have cropped bounding boxes.' }
        ],
        features: ['Rotate individual pages or all pages at once', 'Options: 90° clockwise, 90° counterclockwise, 180°', 'Visual page preview before rotation', 'Preserves all content and formatting', 'Handles multi-page PDFs'],
        useCases: ['Fixing sideways-scanned documents', 'Correcting orientation of specific pages in mixed-orientation PDFs', 'Rotating landscape pages to portrait or vice versa', 'Standardizing page orientation for professional documents'],
        faqs: [{ question: 'Can I rotate only specific pages?', answer: 'Yes! Select individual pages to rotate while leaving others unchanged. This is helpful for PDFs with mixed portrait and landscape pages.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['reorder-pdf-pages', 'split-pdf', 'merge-pdf'],
    },
    'add-watermark-pdf': {
        about: 'PDF Watermark adds text or image watermarks to every page or selected pages of your PDF. Add "CONFIDENTIAL", "DRAFT", company logos, or custom text overlays. Control position, size, opacity, rotation, and color. Essential for protecting intellectual property and marking document status.',
        directAnswer: 'PDF Watermark allows you to stamp text (like "DRAFT") or image logos across your PDF pages to protect your intellectual property and indicate document status.',
        steps: [
            { title: 'Upload Document', description: 'Select the PDF file you want to protect with a watermark.' },
            { title: 'Customize Watermark', description: 'Type your text or upload a logo, then adjust the opacity, rotation, and placement on the page.' },
            { title: 'Apply & Download', description: 'Stamp the watermark onto your selected pages and download the finalized PDF.' }
        ],
        commonProblems: [
            { problem: 'Watermark is blocking the text.', solution: 'Reduce the opacity setting to make the watermark semi-transparent, allowing the document text to remain readable.' },
            { problem: 'Watermark only applied to the first page.', solution: 'Check your page range settings. Ensure you have selected "All Pages" if you want it applied to the entire document.' }
        ],
        features: ['Text and image watermark options', 'Adjustable opacity, position, and rotation', 'Apply to all pages or selected pages', 'Custom font, size, and color for text watermarks', 'Diagonal and centered positioning options'],
        useCases: ['Marking documents as CONFIDENTIAL or DRAFT', 'Adding company logos to internal documents', 'Protecting PDF content from unauthorized redistribution', 'Branding client deliverables and reports'],
        faqs: [{ question: 'Can I watermark only specific pages?', answer: 'Yes! Choose to apply the watermark to all pages, odd pages only, even pages only, or select specific page numbers.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['protect-pdf', 'compress-pdf', 'merge-pdf'],
    },
    'protect-pdf': {
        about: 'Protect PDF secures your document with password-based encryption so only people with the password can open it. Upload a PDF, set a password, and download a protected copy for private sharing, client handoffs, or internal document control.',
        directAnswer: 'Protect PDF encrypts your document with a secure password, ensuring that unauthorized users cannot open, read, or print the file without the correct credentials.',
        steps: [
            { title: 'Upload PDF', description: 'Select the sensitive PDF document you want to lock.' },
            { title: 'Set Password', description: 'Enter and confirm a strong password that will be required to open the document.' },
            { title: 'Download Secure File', description: 'Save the newly encrypted PDF, which is now safe to send over email or messaging apps.' }
        ],
        commonProblems: [
            { problem: 'I forgot the password I just set.', solution: 'Because the encryption is secure, we cannot recover forgotten passwords. Keep a backup of the original unencrypted file.' },
            { problem: 'File won\'t encrypt.', solution: 'Ensure the PDF isn\'t already encrypted or corrupted. Try opening it in a standard viewer first.' }
        ],
        features: ['Password-based PDF encryption', 'Creates a separate protected copy for download', 'Works for private sharing, client delivery, and access control', 'Simple password entry and confirmation flow'],
        useCases: ['Protecting contracts, invoices, and reports before sharing', 'Sending private PDF attachments with access control', 'Securing internal documents before upload or distribution'],
        faqs: [{ question: 'How does Protect PDF work?', answer: 'Upload your PDF, enter a password, and download a newly encrypted copy. Anyone opening that protected file will need the password.' }, { question: 'Does Protect PDF change my original file?', answer: 'No. The original file is left unchanged. The tool creates a separate protected PDF for download.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['unlock-pdf', 'add-watermark-pdf', 'compress-pdf'],
    },
    'unlock-pdf': {
        about: 'Unlock PDF removes password protection from a PDF when you know the current password. Upload the file, enter the correct password, and download a separate unlocked copy for easier editing, printing, or sharing inside trusted workflows.',
        directAnswer: 'Unlock PDF permanently removes the password security from your PDF file so you can easily edit, print, or share it without entering a password every time.',
        steps: [
            { title: 'Upload Locked PDF', description: 'Select the encrypted PDF document that you want to remove security from.' },
            { title: 'Enter Password', description: 'Provide the current correct password to verify you have authorization to unlock it.' },
            { title: 'Save Unlocked PDF', description: 'Download the new version of your PDF, which is now permanently unlocked and accessible.' }
        ],
        commonProblems: [
            { problem: 'It says incorrect password.', solution: 'You must know the current file password to remove it. This tool does not hack or bypass unknown passwords.' },
            { problem: 'Still cannot print the document.', solution: 'Some PDFs have separate "Owner" passwords restricting printing. Make sure you provided the owner password, not just the user read password.' }
        ],
        features: ['Remove password protection from a PDF', 'Requires the current PDF password', 'Creates a separate unlocked copy for download', 'Useful for trusted internal workflows and editing'],
        useCases: ['Removing passwords before editing or printing a PDF', 'Preparing trusted internal copies of protected documents', 'Simplifying repeated access to PDFs you already own'],
        faqs: [{ question: 'Do I need the current password to unlock a PDF?', answer: 'Yes. You must provide the correct existing password before the tool can generate an unlocked copy.' }, { question: 'Will Unlock PDF remove security from my original file?', answer: 'No. The original stays unchanged, and the tool returns a separate unlocked version for download.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['protect-pdf', 'compress-pdf', 'merge-pdf'],
    },
    'reorder-pdf-pages': {
        about: 'Reorder PDF Pages lets you rearrange the page order in your PDF document using an intuitive drag-and-drop interface. See page thumbnails, drag pages to new positions, and download the reorganized PDF. Perfect for fixing page order mistakes, reorganizing content flow, and customizing document structure.',
        directAnswer: 'Reorder PDF Pages allows you to visually rearrange the sequence of pages in your document using a simple drag-and-drop thumbnail interface.',
        steps: [
            { title: 'Upload PDF', description: 'Select a multi-page document that needs its pages reorganized.' },
            { title: 'Drag to Reorder', description: 'Click and drag the page thumbnails into your desired sequence.' },
            { title: 'Apply & Download', description: 'Save the updated document with the new, permanently applied page order.' }
        ],
        commonProblems: [
            { problem: 'Thumbnails are too small to read.', solution: 'The thumbnails are meant for visual sorting. If you need to read the text to sort them, try zooming in on your browser or noting the page numbers beforehand.' },
            { problem: 'Dragging is glitchy on mobile.', solution: 'If touch drag-and-drop is unresponsive, try switching to a desktop browser for easier management of large documents.' }
        ],
        features: ['Drag-and-drop page reordering', 'Visual page thumbnails for easy identification', 'Move single or multiple pages at once', 'Preserves page content and formatting', 'Handles multi-page PDFs'],
        useCases: ['Fixing page order mistakes in scanned documents', 'Reorganizing report sections for better flow', 'Moving appendices and references to the correct position', 'Customizing document structure for different audiences'],
        faqs: [{ question: 'Can I move multiple pages at once?', answer: 'Yes, select multiple pages and drag them to a new position as a group. This makes reorganizing large documents much faster.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['split-pdf', 'merge-pdf', 'delete-pdf-pages', 'rotate-pdf'],
    },
    'delete-pdf-pages': {
        about: 'Delete PDF Pages removes unwanted pages from any PDF document. Select the pages you want to delete using the visual interface, and download a clean PDF with only the pages you need. Perfect for removing blank pages, cover pages, advertisements, and irrelevant content from downloaded documents.',
        directAnswer: 'Delete PDF Pages lets you quickly remove blank, duplicate, or unwanted pages from your document by selecting their thumbnails and exporting a clean file.',
        steps: [
            { title: 'Upload PDF', description: 'Choose the document containing the pages you wish to remove.' },
            { title: 'Select Pages to Delete', description: 'Click the trash icon on the thumbnails of the pages you no longer want.' },
            { title: 'Download Clean PDF', description: 'Save the newly generated PDF containing only your kept pages.' }
        ],
        commonProblems: [
            { problem: 'I accidentally deleted the wrong page.', solution: 'Your original file is safe. Simply refresh the page or re-upload the original document to start over.' },
            { problem: 'File size didn\'t decrease after deletion.', solution: 'If the deleted pages contained only text, the file size won\'t drop significantly. The document structure overhead remains similar.' }
        ],
        features: ['Visual page selection for easy identification', 'Delete single or multiple pages', 'Preserves remaining pages exactly as they are', 'Page thumbnail preview before deletion', 'Handles multi-page PDFs of any size'],
        useCases: ['Removing blank pages from scanned documents', 'Deleting cover pages and table of contents', 'Removing advertisements from downloaded PDFs', 'Cleaning up exam papers by removing instruction pages'],
        faqs: [{ question: 'Can I undo page deletion?', answer: 'The original file is not modified. If you need the deleted pages, simply re-upload the original PDF. Always keep a backup of important documents.' }],
        supportedFormats: 'Input/Output: PDF',
        relatedTools: ['reorder-pdf-pages', 'split-pdf', 'merge-pdf'],
    },
    'add-page-numbers-to-pdf': {
        about: 'Add Page Numbers to PDF lets you automatically insert page numbers across your entire PDF document. You can customize the numbering format (e.g., "1", "Page 1", "1 of 5"), choose exactly where the numbers appear on the page (bottom, top, left, right), and adjust the font size and margins. The tool processes files completely in the browser for maximum privacy and speed.',
        directAnswer: 'Add Page Numbers to PDF automatically inserts consecutive page numbering into your document headers or footers, offering customizable formats and positioning.',
        steps: [
            { title: 'Upload Document', description: 'Select the PDF file that requires page numbering.' },
            { title: 'Format Numbers', description: 'Choose your placement (e.g., bottom center) and format (e.g., "Page 1 of 10").' },
            { title: 'Apply Numbers', description: 'Generate and download the new PDF with perfectly aligned page numbers.' }
        ],
        commonProblems: [
            { problem: 'Numbers overlap with document text.', solution: 'Adjust the margin settings to push the page numbers further towards the edge of the paper, away from your content.' },
            { problem: 'Numbers don\'t match my existing index.', solution: 'Currently, the tool starts numbering from page 1 of the PDF file. You cannot yet set a custom starting number offset.' }
        ],
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
        directAnswer: 'The SVG to PNG Converter transforms your scalable vector graphics into high-resolution raster images while perfectly preserving transparent backgrounds for universal compatibility.',
        steps: [
            { title: 'Upload SVG', description: 'Select the vector graphic file you want to convert to a raster format.' },
            { title: 'Set Dimensions', description: 'Optionally scale the output resolution up or down for a sharper PNG.' },
            { title: 'Download PNG', description: 'Save the converted image file, complete with preserved transparency.' }
        ],
        commonProblems: [
            { problem: 'The output PNG looks blurry.', solution: 'Because PNG is a raster format, it loses infinite scalability. Set a larger output dimension before converting if you need a higher-resolution image.' },
            { problem: 'Custom fonts in the SVG didn\'t render.', solution: 'If your SVG uses external web fonts, they may not render. Convert text to paths/outlines in your vector editor before converting.' }
        ],
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
        directAnswer: 'SVG to JPG converts vector illustrations and icons into compressed JPEG images, automatically filling transparent areas with a solid white background.',
        steps: [
            { title: 'Select SVG File', description: 'Upload the vector image you need to convert into a standard photo format.' },
            { title: 'Adjust Quality', description: 'Select your preferred output size and JPEG compression level.' },
            { title: 'Save Image', description: 'Download the finalized JPG file, ready to upload or share.' }
        ],
        commonProblems: [
            { problem: 'My image has a white background now.', solution: 'JPGs do not support transparency. All transparent areas in the original SVG are replaced with a solid white background during conversion.' },
            { problem: 'Colors look slightly different.', solution: 'JPG compression can sometimes cause minor color shifting. Try using a higher quality setting (90%+) for better color accuracy.' }
        ],
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
        directAnswer: 'WebP to PNG converts modern, highly compressed WebP images back into standard PNG files, ensuring full compatibility with older software while keeping backgrounds transparent.',
        steps: [
            { title: 'Upload WebP', description: 'Select the WebP image that you are having trouble opening in your software.' },
            { title: 'Convert Format', description: 'The tool instantly decodes the WebP file and re-encodes it losslessly into PNG.' },
            { title: 'Download Image', description: 'Save the compatible PNG file and use it in any standard image editor.' }
        ],
        commonProblems: [
            { problem: 'The new PNG file is much larger.', solution: 'This is normal. WebP uses highly advanced compression. PNG is an older format and takes up more file size to represent the exact same image data.' },
            { problem: 'Animation was lost.', solution: 'If you uploaded an animated WebP, this tool only extracts and converts the first frame into a static PNG image.' }
        ],
        features: ['100% lossless conversion', 'Preserves alpha-channel transparency', 'No software installation required', 'Processes files in seconds'],
        useCases: ['Converting downloaded WebP images for Photoshop editing', 'Fixing images that won\'t open in older software', 'Preparing graphics for older email clients', 'Standardizing assets for legacy systems'],
        faqs: [
            { question: 'Will the image lose quality?', answer: 'No, converting from WebP to PNG is a completely lossless process, meaning your image will look exactly the same as the original.' }
        ],
        supportedFormats: 'Input: WebP | Output: PNG',
        relatedTools: ['webp-to-jpg', 'png-to-jpeg', 'remove-image-background'],
    },
    'linearize-pdf': {
        about: 'Fast Web View (Linearize PDF) optimizes your PDF files for internet streaming. By rearranging the internal structure of the PDF document, it allows a web browser to display the first page almost instantly while the rest of the file downloads in the background. This is a critical optimization for large PDF files hosted on websites.',
        directAnswer: 'Linearize PDF reorganizes the internal structure of your document for "Fast Web View," allowing web browsers to display the first page instantly while the rest downloads.',
        steps: [
            { title: 'Select Document', description: 'Upload a large PDF that you plan to host on a website or send via a link.' },
            { title: 'Optimize for Web', description: 'The tool rearranges the internal bytes so the first page data loads instantly.' },
            { title: 'Download File', description: 'Save the linearized PDF and upload it to your server for improved user experience.' }
        ],
        commonProblems: [
            { problem: 'The file size stayed the same.', solution: 'Linearizing does not compress the PDF; it only reorders the internal data structure for faster streaming. Use Compress PDF to reduce size.' },
            { problem: 'I don\'t see any difference.', solution: 'You will only notice the benefit when the file is hosted on a web server and viewed in a browser over a slow internet connection.' }
        ],
        features: ['Instant rendering of first page', 'Reduces perceived loading time', 'Optimizes document structure', 'Maintains original visual quality', 'Ensures high compatibility with web servers'],
        useCases: ['Optimizing large reports or eBooks for website embedding', 'Speeding up PDF delivery on slow network connections', 'Enhancing user experience for web-hosted documents', 'Fulfilling technical SEO requirements for fast content loading'],
        faqs: [
            { question: 'What does "Linearize" mean?', answer: 'Linearizing a PDF reorders its internal data so that the information required to display the first page is at the very beginning of the file. This allows web browsers to render the first page immediately.' },
            { question: 'Will linearizing a PDF change its contents?', answer: 'No, the content and visual appearance of the PDF remain exactly the same. Only the internal byte structure is reorganized for efficiency.' }
        ],
        supportedFormats: 'Input: PDF | Output: PDF',
        relatedTools: ['compress-pdf', 'merge-pdf', 'split-pdf'],
    },
};
