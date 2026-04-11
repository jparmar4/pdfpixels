'use client';

/**
 * AnimatedMeshBg - Lightweight CSS gradient background.
 * Uses pure CSS animations instead of Framer Motion for better performance.
 * Removed mouse tracking and heavy blur filters.
 */
export function AnimatedMeshBg() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Static gradient base - no JS animation, pure CSS */}
            <div className="absolute inset-0 mesh-gradient-blobs" />
        </div>
    );
}
