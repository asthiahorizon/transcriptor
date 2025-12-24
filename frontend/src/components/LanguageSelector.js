import { useLanguage, AVAILABLE_LANGUAGES } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector({ className = '' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="appearance-none bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-slate-700 cursor-pointer hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
      >
        {AVAILABLE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <Globe className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}
