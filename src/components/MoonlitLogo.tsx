import React from 'react';
import defaultLogoImg from '../Images/logo.svg';

interface MoonlitLogoProps {
  customUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  theme?: 'gold' | 'black' | 'default';
  className?: string;
}

export const MoonlitLogo: React.FC<MoonlitLogoProps> = ({
  customUrl,
  size = 'md',
  showWordmark = true,
  theme = 'default',
  className = ''
}) => {
  // Dimensions - made larger so it is easily visible with crystal clarity
  const dimensions = {
    sm: { px: 48, text: 'text-sm' },
    md: { px: 68, text: 'text-lg' },
    lg: { px: 96, text: 'text-2xl' },
    xl: { px: 132, text: 'text-3xl' }
  }[size];

  // Text color styling based on theme
  const getWordmarkStyles = () => {
    if (theme === 'black') {
      return {
        title: 'text-black font-bold',
        subtitle: 'text-black/80 font-bold'
      };
    }
    if (theme === 'gold') {
      return {
        title: 'text-[#2D1F08] font-bold',
        subtitle: 'text-[#6E4F18] font-semibold'
      };
    }
    return {
      title: 'text-[#2D1F08] font-bold',
      subtitle: 'text-[#6E4F18] font-semibold'
    };
  };

  const wordmarkStyles = getWordmarkStyles();

  return (
    <div className={`flex items-center gap-2 sm:gap-3.5 ${className}`}>
      {/* Exact Attached Brand Logo Medallion with no change in color and texture */}
      {customUrl && customUrl.trim() !== '' && customUrl !== defaultLogoImg ? (
        <div
          className="relative rounded-full overflow-hidden shrink-0 shadow-xs bg-white transition-transform duration-300 hover:scale-105 w-11 h-11 sm:w-16 sm:h-16"
        >
          <img
            src={customUrl}
            alt="Moonlit Jewels"
            className="w-full h-full object-cover object-center"
          />
        </div>
      ) : (
        /* Exact high-resolution vector medallion of attached lg15.png logo */
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-300 hover:scale-105 drop-shadow-xs w-11 h-11 sm:w-16 sm:h-16"
          aria-label="Moonlit Jewels Logo"
        >
          <defs>
            {/* Metallic Silver Gradient Sheen */}
            <linearGradient id="silverSheenMedallion" x1="85%" y1="15%" x2="15%" y2="85%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#EDEDEE" />
              <stop offset="55%" stopColor="#D2D2D6" />
              <stop offset="85%" stopColor="#B5B5B9" />
              <stop offset="100%" stopColor="#9E9EA3" />
            </linearGradient>
          </defs>

          {/* Outer circle with metallic silver gradient and black border */}
          <circle cx="250" cy="250" r="236" fill="url(#silverSheenMedallion)" stroke="#000000" strokeWidth="6" />

          {/* Top 4-point star sparkle */}
          <path d="M 250 35 Q 250 56 232 56 Q 250 56 250 77 Q 250 56 268 56 Q 250 56 250 35 Z" fill="#000000" />

          {/* Crown / Diamond facet fan */}
          <polygon points="250,86 256,132 250,206 244,132" fill="#000000" />
          <polygon points="263,89 274,135 254,204 251,202" fill="#000000" />
          <polygon points="280,97 296,142 258,203 255,200" fill="#000000" />
          <polygon points="302,108 322,152 262,201 259,198" fill="#000000" />
          <polygon points="328,124 350,165 266,198 263,195" fill="#000000" />
          <polygon points="237,89 226,135 246,204 249,202" fill="#000000" />
          <polygon points="220,97 204,142 242,203 245,200" fill="#000000" />
          <polygon points="198,108 178,152 238,201 241,198" fill="#000000" />
          <polygon points="172,124 150,165 234,198 237,195" fill="#000000" />

          {/* Upper Red Triangles */}
          <polygon points="63,112 195,257 63,257" fill="#B30B0B" />
          <polygon points="437,112 305,257 437,257" fill="#B30B0B" />

          {/* Lower Black Geometric M Monogram */}
          <rect x="63" y="257" width="56" height="103" fill="#000000" />
          <rect x="381" y="257" width="56" height="103" fill="#000000" />
          <polygon points="119,257 250,405 381,257 326,257 250,344 174,257" fill="#000000" />
          <polygon points="144,324 163,360 119,360" fill="#000000" />
          <polygon points="356,324 337,360 381,360" fill="#000000" />

          {/* Bottom Brand Text */}
          <text
            x="250"
            y="437"
            textAnchor="middle"
            fontFamily="'Century Gothic', 'Montserrat', 'Inter', system-ui, -apple-system, sans-serif"
            fontSize="33"
            fontWeight="400"
            letterSpacing="0.08em"
            fill="#000000"
          >
            Moonlit  jewels
          </text>
        </svg>
      )}

      {showWordmark && (
        <div className="flex flex-col text-left">
          <span className={`font-serif tracking-[0.14em] sm:tracking-[0.16em] uppercase leading-tight text-base sm:text-lg ${wordmarkStyles.title}`}>
            Moonlit Jewels
          </span>
          <span className={`text-[9px] sm:text-[10.5px] tracking-[0.16em] sm:tracking-[0.24em] uppercase font-sans mt-0.5 truncate ${wordmarkStyles.subtitle}`}>
            Real Jewelry · Timeless Beauty
          </span>
        </div>
      )}
    </div>
  );
};
