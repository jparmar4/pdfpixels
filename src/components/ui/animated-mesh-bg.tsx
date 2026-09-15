'use client';

/**
 * AnimatedMeshBg - Lightweight CSS gradient background.
 * Uses pure CSS animations instead of Framer Motion for better performance.
 * Removed mouse tracking and heavy blur filters.
 */
export function AnimatedMeshBg() {
    return (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Static gradient base - no JS animation, pure CSS.
                Motion is further gated by prefers-reduced-motion in globals.css. */}
            <div className="absolute inset-0 mesh-gradient-blobs" />
        </div>
    );
}
