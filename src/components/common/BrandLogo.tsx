import React from 'react';

interface BrandLogoProps {
  iconOnly?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  iconOnly = false,
  showSubtitle = true,
  subtitleText = 'Estudo Inteligente',
  size = 'md',
  className = '',
}) => {
  const iconBoxSize =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  const titleSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-[17px]';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Logo Mark: Gradiente Violeta/Indigo + Livro Aberto + Estrela Dourada */}
      <div
        className={`relative flex ${iconBoxSize} shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset ring-white/20`}
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 55%, #6d28d9 100%)',
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[72%] w-[72%]"
        >
          {/* Estrela dourada acima do livro */}
          <path
            d="M18 4.2L19.45 7.45L22.95 7.82L20.32 10.18L21.05 13.62L18 11.82L14.95 13.62L15.68 10.18L13.05 7.82L16.55 7.45L18 4.2Z"
            fill="#FACC15"
          />
          {/* Página esquerda do livro aberto */}
          <path
            d="M6.5 14.8C6.5 13.97 7.17 13.3 8 13.3C11.15 13.3 14.35 14.15 17.1 16.05V28.4C14.3 26.6 11.1 25.8 7.85 25.8C7.1 25.8 6.5 25.2 6.5 24.45V14.8Z"
            fill="#FFFFFF"
            fillOpacity="0.96"
          />
          {/* Página direita do livro aberto */}
          <path
            d="M29.5 14.8C29.5 13.97 28.83 13.3 28 13.3C24.85 13.3 21.65 14.15 18.9 16.05V28.4C21.7 26.6 24.9 25.8 28.15 25.8C28.9 25.8 29.5 25.2 29.5 24.45V14.8Z"
            fill="#EDE9FE"
            fillOpacity="0.96"
          />
          {/* Linhas sutis nas páginas */}
          <path
            d="M9.6 17.6C11.4 17.8 13.2 18.4 14.8 19.3M9.6 21.1C11.4 21.3 13.2 21.8 14.8 22.6"
            stroke="#7C3AED"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          <path
            d="M26.4 17.6C24.6 17.8 22.8 18.4 21.2 19.3M26.4 21.1C24.6 21.3 22.8 21.8 21.2 22.6"
            stroke="#7C3AED"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSize} tracking-tight text-stone-900 dark:text-white`}>
              <span className="font-medium opacity-90">my </span>
              <span className="font-extrabold">cronograma</span>
            </span>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400"
              aria-hidden="true"
            />
          </div>
          {showSubtitle && (
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 mt-0.5">
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
