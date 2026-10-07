import en from './translations/en.js';
import es from './translations/es.js';

const LANG_STORAGE_KEY = 'growShopLanguage';
const TRANSLATIONS = { ES: es, EN: en };

class TranslationService {
    constructor() {
        this.listeners = [];
        this.currentLanguage = this.loadLanguage();
        this.translations = TRANSLATIONS;
    }

    loadLanguage() {
        try {
            return localStorage.getItem(LANG_STORAGE_KEY) === 'EN' ? 'EN' : 'ES';
        } catch (error) {
            console.error('Error loading language from storage:', error);
            return 'ES';
        }
    }

    getLanguage() {
        return this.currentLanguage;
    }

    setLanguage(language) {
        const nextLanguage = language === 'EN' ? 'EN' : 'ES';
        if (this.currentLanguage === nextLanguage) return;

        this.currentLanguage = nextLanguage;
        try {
            localStorage.setItem(LANG_STORAGE_KEY, nextLanguage);
        } catch (error) {
            console.error('Error saving language to storage:', error);
        }
        this.notifyListeners();
    }

    notifyListeners() {
        this.listeners.forEach((listener) => listener(this.currentLanguage));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        listener(this.currentLanguage);
        return () => {
            this.listeners = this.listeners.filter((registered) => registered !== listener);
        };
    }

    t(key) {
        return this.translations[this.currentLanguage][key]
            ?? this.translations.ES[key]
            ?? key;
    }
}

const translationService = new TranslationService();
export default translationService;
