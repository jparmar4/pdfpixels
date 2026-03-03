import { NextRequest, NextResponse } from 'next/server';

const CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0',
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const action = (formData.get('action') as string) || 'protect';

        if (!file) {
            return NextResponse.json({ error: 'No PDF file provided' }, { status: 400, headers: CACHE_HEADERS });
        }

        if (action === 'unlock') {
            return NextResponse.json(
                {
                    error: 'PDF unlock is temporarily unavailable',
                    details: 'This endpoint currently does not implement reliable password-based decryption. To avoid misleading output, unlock is disabled until full encryption support is added.',
                },
                { status: 501, headers: CACHE_HEADERS }
            );
        }

        return NextResponse.json(
            {
                error: 'PDF password protection is temporarily unavailable',
                details: 'This endpoint currently does not implement true PDF encryption (AES/password lock). To avoid false security expectations, protect is disabled until full encryption support is added.',
            },
            { status: 501, headers: CACHE_HEADERS }
        );
    } catch (error) {
        console.error('PDF protect/unlock error:', error);
        return NextResponse.json(
            { error: 'Failed to process PDF', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: CACHE_HEADERS }
        );
    }
}
