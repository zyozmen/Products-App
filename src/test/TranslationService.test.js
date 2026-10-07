import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import translationService from '../services/TranslationService.js';
import { ORDER_STATUSES } from '../services/OrderService.js';

const componentsDirectory = path.resolve(process.cwd(), 'src/components');

const getComponentFiles = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    const nestedFiles = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return getComponentFiles(entryPath);
        }
        return entry.name.endsWith('.jsx') || entry.name.endsWith('.js')
            ? [entryPath]
            : [];
    }));

    return nestedFiles.flat();
};

describe('TranslationService component coverage', () => {
    it('keeps the Spanish and English dictionaries in sync', () => {
        expect(Object.keys(translationService.translations.EN).sort())
            .toEqual(Object.keys(translationService.translations.ES).sort());
    });

    it('translates every order status in both languages', () => {
        for (const status of ORDER_STATUSES) {
            const key = `order_status_${status.toLowerCase()}`;
            expect(translationService.translations.ES[key]).toBeTruthy();
            expect(translationService.translations.EN[key]).toBeTruthy();
        }
    });

    it('defines every static translation key referenced by a component', async () => {
        const componentFiles = await getComponentFiles(componentsDirectory);
        const missingKeys = [];
        const translationCall = /\bt\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

        for (const filePath of componentFiles) {
            const source = await readFile(filePath, 'utf8');
            for (const match of source.matchAll(translationCall)) {
                const key = match[1];
                for (const language of ['ES', 'EN']) {
                    if (!translationService.translations[language][key]) {
                        missingKeys.push(`${path.relative(componentsDirectory, filePath)}: ${key} (${language})`);
                    }
                }
            }
        }

        expect(missingKeys).toEqual([]);
    });
});
