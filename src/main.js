import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/globals.css';
import { installErrorLogging } from '@/services/errorLogService.js';

installErrorLogging();

async function bootstrap() {
    await import('@/lib/dayjs.js');
    await import('@/services/i18nService.js');

    const { App } = await import('./app/App.jsx');

    const rootElement = document.getElementById('root');

    if (!rootElement) {
        throw new Error('Missing #root mount node');
    }

    createRoot(rootElement).render(
        createElement(StrictMode, null, createElement(App))
    );
}

void bootstrap().catch((error) => {
    console.error(error);
});
