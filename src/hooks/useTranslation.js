import { useEffect, useState } from 'react';
import translationService from '../services/TranslationService.js';

export default function useTranslation() {
  const [, setLanguage] = useState(() => translationService.getLanguage());

  useEffect(() => translationService.subscribe(setLanguage), []);

  return (key) => translationService.t(key);
}
