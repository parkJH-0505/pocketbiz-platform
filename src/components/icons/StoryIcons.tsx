import React from 'react'

// 잠수함 아이콘 (심해)
export const SubmarineIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="submarine-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="50" rx="35" ry="20" fill="url(#submarine-gradient)" opacity="0.9"/>
    <rect x="35" y="30" width="30" height="15" rx="7" fill="#60A5FA" opacity="0.8"/>
    <circle cx="25" cy="50" r="8" fill="#93C5FD" opacity="0.6"/>
    <circle cx="75" cy="50" r="8" fill="#93C5FD" opacity="0.6"/>
    <rect x="48" y="20" width="4" height="15" fill="#60A5FA"/>
    <circle cx="50" cy="18" r="3" fill="#DBEAFE"/>
    <circle cx="30" cy="50" r="2" fill="#FFFFFF" opacity="0.8"/>
    <circle cx="40" cy="48" r="2" fill="#FFFFFF" opacity="0.8"/>
    <circle cx="60" cy="48" r="2" fill="#FFFFFF" opacity="0.8"/>
    <circle cx="70" cy="50" r="2" fill="#FFFFFF" opacity="0.8"/>
  </svg>
)

// 로켓 아이콘 (우주)
export const RocketIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rocket-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="fire-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
    </defs>
    <path d="M50 10 L65 40 L65 60 L55 70 L45 70 L35 60 L35 40 Z" fill="url(#rocket-gradient)"/>
    <path d="M50 10 L55 25 L50 30 L45 25 Z" fill="#C4B5FD"/>
    <circle cx="50" cy="35" r="6" fill="#1E293B" opacity="0.3"/>
    <circle cx="50" cy="35" r="4" fill="#60A5FA"/>
    <path d="M35 40 L30 50 L35 55 Z" fill="#9333EA"/>
    <path d="M65 40 L70 50 L65 55 Z" fill="#9333EA"/>
    <path d="M45 70 L43 80 L47 85 L50 80 L53 85 L57 80 L55 70 Z" fill="url(#fire-gradient)" opacity="0.9"/>
    <ellipse cx="50" cy="75" rx="8" ry="12" fill="url(#fire-gradient)" opacity="0.6"/>
  </svg>
)

// 나침반 아이콘 (발견)
export const CompassIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="compass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" stroke="url(#compass-gradient)" strokeWidth="3" fill="none"/>
    <circle cx="50" cy="50" r="30" fill="#ECFDF5" opacity="0.3"/>
    <path d="M50 20 L60 40 L50 50 L40 40 Z" fill="#DC2626"/>
    <path d="M50 80 L40 60 L50 50 L60 60 Z" fill="#1E293B" opacity="0.5"/>
    <circle cx="50" cy="50" r="5" fill="#10B981"/>
    <text x="50" y="15" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">N</text>
    <text x="85" y="53" textAnchor="middle" fill="#6B7280" fontSize="10">E</text>
    <text x="50" y="93" textAnchor="middle" fill="#6B7280" fontSize="10">S</text>
    <text x="15" y="53" textAnchor="middle" fill="#6B7280" fontSize="10">W</text>
  </svg>
)

// 전구 아이콘 (인사이트)
export const LightbulbIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bulb-glow">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="100%" stopColor="#FCD34D" opacity="0"/>
      </radialGradient>
      <linearGradient id="bulb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="35" r="30" fill="url(#bulb-glow)" opacity="0.5"/>
    <path d="M50 15 C35 15 25 25 25 35 C25 45 30 50 35 55 L35 65 L65 65 L65 55 C70 50 75 45 75 35 C75 25 65 15 50 15 Z" 
          fill="url(#bulb-gradient)" opacity="0.9"/>
    <rect x="40" y="65" width="20" height="5" fill="#92400E"/>
    <rect x="40" y="70" width="20" height="3" fill="#92400E" opacity="0.8"/>
    <rect x="40" y="73" width="20" height="3" fill="#92400E" opacity="0.6"/>
    <path d="M45 30 L50 40 L55 30 L50 45 Z" fill="#FFFFFF" opacity="0.8"/>
  </svg>
)

// 기어 아이콘 (설계)
export const GearIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gear-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6B7280" />
        <stop offset="100%" stopColor="#374151" />
      </linearGradient>
    </defs>
    <path d="M50 10 L55 20 L65 18 L68 28 L78 30 L75 40 L85 45 L80 55 L88 62 L78 70 L82 80 L70 78 L68 88 L58 82 L50 90 L42 82 L32 88 L30 78 L18 80 L22 70 L12 62 L20 55 L15 45 L25 40 L22 30 L32 28 L35 18 L45 20 Z" 
          fill="url(#gear-gradient)"/>
    <circle cx="50" cy="50" r="20" fill="#1F2937"/>
    <circle cx="50" cy="50" r="15" fill="#374151"/>
    <circle cx="50" cy="50" r="8" fill="#6B7280"/>
  </svg>
)

// 차트 아이콘 (Core5)
export const ChartIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <polygon points="50,20 75,35 70,60 30,60 25,35" 
             fill="url(#chart-gradient)" opacity="0.3" 
             stroke="url(#chart-gradient)" strokeWidth="2"/>
    <polygon points="50,30 65,40 62,55 38,55 35,40" 
             fill="url(#chart-gradient)" opacity="0.6"/>
    <circle cx="50" cy="20" r="3" fill="#EC4899"/>
    <circle cx="75" cy="35" r="3" fill="#8B5CF6"/>
    <circle cx="70" cy="60" r="3" fill="#3B82F6"/>
    <circle cx="30" cy="60" r="3" fill="#10B981"/>
    <circle cx="25" cy="35" r="3" fill="#F59E0B"/>
  </svg>
)

// 생태계 아이콘 (3층)
export const EcosystemIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="eco-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="eco-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="eco-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="35" fill="none" stroke="url(#eco-gradient-1)" strokeWidth="2" strokeDasharray="5,5" opacity="0.5"/>
    <circle cx="50" cy="50" r="25" fill="none" stroke="url(#eco-gradient-2)" strokeWidth="2" strokeDasharray="5,5" opacity="0.5"/>
    <circle cx="50" cy="50" r="15" fill="none" stroke="url(#eco-gradient-3)" strokeWidth="2" strokeDasharray="5,5" opacity="0.5"/>
    
    <circle cx="50" cy="15" r="8" fill="url(#eco-gradient-1)"/>
    <circle cx="75" cy="50" r="8" fill="url(#eco-gradient-2)"/>
    <circle cx="25" cy="50" r="8" fill="url(#eco-gradient-3)"/>
    
    <circle cx="50" cy="50" r="5" fill="#1F2937"/>
  </svg>
)

// 대시보드 아이콘
export const DashboardIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="35" height="35" rx="5" fill="#3B82F6" opacity="0.8"/>
    <rect x="55" y="10" width="35" height="35" rx="5" fill="#8B5CF6" opacity="0.8"/>
    <rect x="10" y="55" width="35" height="35" rx="5" fill="#10B981" opacity="0.8"/>
    <rect x="55" y="55" width="35" height="35" rx="5" fill="#F59E0B" opacity="0.8"/>
    <rect x="15" y="15" width="25" height="3" fill="#FFFFFF" opacity="0.9"/>
    <rect x="15" y="22" width="20" height="2" fill="#FFFFFF" opacity="0.7"/>
    <rect x="15" y="28" width="15" height="2" fill="#FFFFFF" opacity="0.5"/>
    <circle cx="72" cy="27" r="8" fill="#FFFFFF" opacity="0.9"/>
    <rect x="15" y="65" width="8" height="20" fill="#FFFFFF" opacity="0.9"/>
    <rect x="27" y="70" width="8" height="15" fill="#FFFFFF" opacity="0.7"/>
    <path d="M65 65 L72 75 L80 70" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
  </svg>
)

// 물결 아이콘 (시작)
export const WaveIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0EA5E9" opacity="0.2"/>
        <stop offset="100%" stopColor="#0C4A6E"/>
      </linearGradient>
    </defs>
    <path d="M10 40 Q25 30 40 40 T70 40 T100 40" stroke="#0EA5E9" strokeWidth="3" fill="none" opacity="0.8"/>
    <path d="M0 50 Q15 40 30 50 T60 50 T90 50 L100 50 L100 100 L0 100 Z" fill="url(#wave-gradient)"/>
    <path d="M0 60 Q20 50 40 60 T80 60 L100 60 L100 100 L0 100 Z" fill="url(#wave-gradient)" opacity="0.7"/>
    <path d="M0 70 Q25 60 50 70 T100 70 L100 100 L0 100 Z" fill="url(#wave-gradient)" opacity="0.5"/>
  </svg>
)

// 목표 아이콘
export const TargetIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" fill="none" stroke="#EF4444" strokeWidth="3" opacity="0.3"/>
    <circle cx="50" cy="50" r="25" fill="none" stroke="#EF4444" strokeWidth="3" opacity="0.5"/>
    <circle cx="50" cy="50" r="15" fill="none" stroke="#EF4444" strokeWidth="3" opacity="0.7"/>
    <circle cx="50" cy="50" r="5" fill="#EF4444"/>
    <path d="M50 10 L50 20 M50 80 L50 90 M10 50 L20 50 M80 50 L90 50" stroke="#EF4444" strokeWidth="2"/>
  </svg>
)

// 성장 아이콘
export const GrowthIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="growth-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>
    </defs>
    <path d="M10 80 L30 60 L50 65 L70 40 L90 20" stroke="url(#growth-gradient)" strokeWidth="3" fill="none"/>
    <circle cx="30" cy="60" r="4" fill="#10B981"/>
    <circle cx="50" cy="65" r="4" fill="#10B981"/>
    <circle cx="70" cy="40" r="4" fill="#10B981"/>
    <circle cx="90" cy="20" r="4" fill="#34D399"/>
    <path d="M75 20 L90 20 L90 35" stroke="#34D399" strokeWidth="2" fill="none"/>
    <path d="M85 25 L90 20 L95 25" stroke="#34D399" strokeWidth="2" fill="none"/>
  </svg>
)