'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Debounce hook for performance
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

const LandingV4Enhanced: React.FC = () => {
  const navigate = useNavigate()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSection, setCurrentSection] = useState(0)
  const [depth, setDepth] = useState(-1000)
  const [isVisible, setIsVisible] = useState<boolean[]>(new Array(10).fill(false))
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLDivElement[]>([])
  const mouseFollowerRef = useRef<HTMLDivElement>(null)

  // 섹션 정의
  const sections = [
    { id: 'problem', title: '문제 인식', depth: -1000, icon: '🌊' },
    { id: 'goal', title: '목표 설정', depth: -800, icon: '🎯' },
    { id: 'assets', title: '자산 인벤토리', depth: -600, icon: '🔍' },
    { id: 'market', title: '시장 분석', depth: -400, icon: '📊' },
    { id: 'insight', title: '핵심 인사이트', depth: -200, icon: '💡' },
    { id: 'design', title: '설계 원칙', depth: 0, icon: '⚙️' },
    { id: 'core5', title: 'Core5 시스템', depth: 200, icon: '🎨' },
    { id: 'product', title: '제품 기능', depth: 500, icon: '📱' },
    { id: 'ecosystem', title: '3층 생태계', depth: 1000, icon: '🚀' },
    { id: 'vision', title: '최종 비전', depth: 10000, icon: '🌌' }
  ]

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 초기 로딩
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // 마우스 팔로워
  useEffect(() => {
    if (isMobile) return
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      if (mouseFollowerRef.current) {
        mouseFollowerRef.current.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile])

  // Intersection Observer with performance optimization
  useEffect(() => {
    const observerOptions = {
      threshold: isMobile ? 0.1 : 0.3,
      rootMargin: '0px'
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = sectionsRef.current.findIndex(ref => ref === entry.target)
        if (index !== -1) {
          setIsVisible(prev => {
            const newVisible = [...prev]
            newVisible[index] = entry.isIntersecting
            return newVisible
          })
        }
      })
    }, observerOptions)

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section)
      })
    }
  }, [isMobile])

  // 스크롤 이벤트 디바운싱
  const handleScroll = useDebounce(() => {
    if (!containerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const maxScroll = scrollHeight - clientHeight
    const progress = Math.min((scrollTop / maxScroll) * 100, 100)
    
    setScrollProgress(progress)
    
    const sectionIndex = Math.floor((progress / 100) * sections.length)
    setCurrentSection(Math.min(sectionIndex, sections.length - 1))
    
    const currentDepth = -1000 + (progress / 100) * 11000
    setDepth(currentDepth)
  }, 10)

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll()
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  // 배경 색상 계산
  const getBackgroundGradient = () => {
    const progress = (depth + 1000) / 11000
    
    if (progress < 0.2) {
      return 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
    } else if (progress < 0.4) {
      return 'linear-gradient(180deg, #1a1f3a 0%, #1e3a5f 100%)'
    } else if (progress < 0.6) {
      return 'linear-gradient(180deg, #1e3a5f 0%, #2e5a8f 100%)'
    } else if (progress < 0.8) {
      return 'linear-gradient(180deg, #2e5a8f 0%, #87CEEB 100%)'
    } else {
      return 'linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%)'
    }
  }

  // 진행 아이콘
  const getProgressIcon = () => {
    const progress = (depth + 1000) / 11000
    if (progress < 0.2) return '🤿'
    if (progress < 0.4) return '🚤'
    if (progress < 0.6) return '⛵'
    if (progress < 0.8) return '✈️'
    return '🚀'
  }

  // 패럴랙스 속도
  const getParallaxOffset = (speed: number) => {
    return scrollProgress * speed * -1
  }

  // 스무스 스크롤 네비게이션
  const scrollToSection = (index: number) => {
    sectionsRef.current[index]?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    })
  }

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌊</div>
          <h1 className="text-3xl font-bold text-white mb-4">PocketBiz</h1>
          <div className="flex space-x-2 justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 마우스 팔로워 (데스크톱만) */}
      {!isMobile && (
        <>
          <div 
            ref={mouseFollowerRef}
            className="fixed w-10 h-10 pointer-events-none z-[100] transition-transform duration-100"
            style={{ willChange: 'transform' }}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-xl" />
          </div>
          <div 
            className="fixed w-2 h-2 bg-white rounded-full pointer-events-none z-[101]"
            style={{ 
              transform: `translate(${mousePosition.x - 4}px, ${mousePosition.y - 4}px)`,
              transition: 'transform 0.05s ease-out'
            }}
          />
        </>
      )}

      {/* 배경 레이어 */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: getBackgroundGradient() }}
      />
      
      {/* 패럴랙스 배경 요소 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 느린 레이어 (0.3x) */}
        <div 
          className="absolute w-full h-full"
          style={{ 
            transform: `translateY(${getParallaxOffset(0.3)}px)`,
            willChange: 'transform'
          }}
        >
          {depth < 0 && (
            <>
              {[...Array(isMobile ? 10 : 20)].map((_, i) => (
                <div
                  key={`bubble-${i}`}
                  className="absolute bg-white/10 rounded-full animate-float"
                  style={{
                    width: Math.random() * 40 + 10 + 'px',
                    height: Math.random() * 40 + 10 + 'px',
                    left: Math.random() * 100 + '%',
                    bottom: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 5 + 's',
                    animationDuration: Math.random() * 10 + 10 + 's'
                  }}
                />
              ))}
            </>
          )}
        </div>

        {/* 중간 레이어 (0.6x) */}
        {!isMobile && (
          <div 
            className="absolute w-full h-full"
            style={{ 
              transform: `translateY(${getParallaxOffset(0.6)}px)`,
              willChange: 'transform'
            }}
          >
            {depth > 0 && depth < 5000 && (
              <>
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`cloud-${i}`}
                    className="absolute bg-white/20 rounded-full blur-xl"
                    style={{
                      width: Math.random() * 200 + 100 + 'px',
                      height: Math.random() * 60 + 30 + 'px',
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                    }}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* 별 배경 (우주 섹션) */}
      {depth > 5000 && (
        <div className="absolute inset-0">
          {[...Array(isMobile ? 50 : 100)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's'
              }}
            />
          ))}
        </div>
      )}

      {/* 스크롤 진행 표시기 */}
      <div className={`fixed ${isMobile ? 'left-4 bottom-20' : 'left-8 top-1/2 -translate-y-1/2'} z-50`}>
        <div className="flex flex-col items-center space-y-4">
          {/* 깊이/고도 미터 */}
          <div className="text-white/60 text-sm font-mono">
            {depth < 0 ? `${Math.abs(depth).toFixed(0)}m ↓` : `${depth.toFixed(0)}m ↑`}
          </div>
          
          {/* 진행 아이콘 */}
          <div className="text-4xl animate-bounce">
            {getProgressIcon()}
          </div>
          
          {/* 진행 바 */}
          <div className={`w-1 ${isMobile ? 'h-20' : 'h-40'} bg-white/20 rounded-full relative`}>
            <div 
              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ height: `${scrollProgress}%` }}
            />
          </div>
          
          {/* 섹션 인디케이터 (데스크톱만) */}
          {!isMobile && (
            <div className="flex flex-col space-y-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-150 ${
                    index <= currentSection ? 'bg-white' : 'bg-white/30'
                  }`}
                  aria-label={`Go to ${section.title}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 컨테이너 */}
      <div 
        ref={containerRef}
        className="relative h-full overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Section 1: 문제 인식 (심해) */}
        <section 
          ref={el => sectionsRef.current[0] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 animate-float">🌊</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              프로젝트가 끝나면,<br />관계도 끝났다
            </h1>
            <div className="text-lg md:text-xl text-white/80 space-y-4">
              <p className="animate-fade-in" style={{ animationDelay: '0.5s' }}>포켓컴퍼니 3년차</p>
              <p className="animate-fade-in" style={{ animationDelay: '0.7s' }}>빌드업 프로젝트 성공적 수행</p>
              <p className="animate-fade-in" style={{ animationDelay: '0.9s' }}>하지만 매번 일회성, 매출 정체</p>
            </div>
            <div className="mt-16 text-white/60 animate-pulse">
              스크롤하여 여정을 시작하세요 ↓
            </div>
          </div>
        </section>

        {/* Section 2: 목표 설정 */}
        <section 
          ref={el => sectionsRef.current[1] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">🎯</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 text-center">
              구독 모델로 전환하라
            </h2>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <p className="text-xl md:text-2xl text-white mb-4">대표님 지시사항:</p>
              <blockquote className="text-lg md:text-xl text-white/90 italic border-l-4 border-blue-500 pl-4 md:pl-6">
                "월 15만원 구독을 베이스로,<br />
                PM 미팅과 프로그램으로 업셀되는<br />
                SaaS 1.0을 설계하자"
              </blockquote>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
                {['KPI 관리', 'PM 스케줄', 'VDR', '네트워킹'].map((item, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-2 md:p-3 hover:bg-white/20 transition-all">
                    <div className="text-xs md:text-sm text-white/60">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: 자산 인벤토리 */}
        <section 
          ref={el => sectionsRef.current[2] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-6xl mx-auto transition-all duration-1000 ${
            isVisible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">🔍</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 md:mb-12 text-center">
              우리가 이미 가진 보물들
            </h2>
            
            {/* 모바일: 카드 레이아웃 / 데스크톱: 오비탈 애니메이션 */}
            {isMobile ? (
              <div className="space-y-4">
                {[
                  { title: '실행 자산', items: ['IR/PSST', '개발/마케팅', '브랜딩'], color: 'from-blue-500 to-blue-600' },
                  { title: '네트워크', items: ['VC 연결', '파트너사', '전문가'], color: 'from-purple-500 to-purple-600' },
                  { title: '콘텐츠', items: ['포켓멘토', '템플릿', '가이드'], color: 'from-green-500 to-green-600' }
                ].map((asset, i) => (
                  <div 
                    key={i}
                    className={`bg-gradient-to-br ${asset.color} rounded-2xl p-6 shadow-2xl animate-fade-in`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <h3 className="text-xl font-bold text-white mb-3">{asset.title}</h3>
                    <ul className="text-sm text-white/80 space-y-1">
                      {asset.items.map((item, j) => (
                        <li key={j}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative h-96 mb-12">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-32 h-32 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" />
                  
                  <div className="relative w-96 h-96 animate-spin-slow">
                    {[
                      { title: '실행 자산', items: ['IR/PSST', '개발/마케팅', '브랜딩'], color: 'from-blue-500 to-blue-600', pos: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
                      { title: '네트워크', items: ['VC 연결', '파트너사', '전문가'], color: 'from-purple-500 to-purple-600', pos: 'bottom-0 left-0 translate-x-1/2 translate-y-1/2' },
                      { title: '콘텐츠', items: ['포켓멘토', '템플릿', '가이드'], color: 'from-green-500 to-green-600', pos: 'bottom-0 right-0 -translate-x-1/2 translate-y-1/2' }
                    ].map((asset, i) => (
                      <div key={i} className={`absolute ${asset.pos}`}>
                        <div className={`bg-gradient-to-br ${asset.color} rounded-2xl p-6 w-48 shadow-2xl hover:scale-110 transition-transform`}>
                          <h3 className="text-xl font-bold text-white mb-2">{asset.title}</h3>
                          <ul className="text-sm text-white/80 space-y-1">
                            {asset.items.map((item, j) => (
                              <li key={j}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xl md:text-2xl text-white text-center font-semibold animate-pulse">
              "이 모든 것을 하나의 제품 루프로 묶을 수 있다"
            </p>
          </div>
        </section>

        {/* Section 4: 시장 분석 */}
        <section 
          ref={el => sectionsRef.current[3] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">📊</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 md:mb-12 text-center">
              밖을 보니 답이 보였다
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">경쟁사 패턴</h3>
                {['웰로비즈: 정보 과잉', '노하우: 일회성 매칭', '엑시토: 시점 의존적'].map((item, i) => (
                  <div 
                    key={i}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 group animate-fade-in"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <p className="text-sm md:text-base text-white/80 group-hover:line-through">{item}</p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">고객의 목소리</h3>
                {[
                  '"정보는 많은데 우리한테 맞는 건지..."',
                  '"지원서 쓰다가 하루가 다 가요"',
                  '"전문가 만나도 그 다음이 없어요"'
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="bg-blue-500/10 backdrop-blur-md rounded-xl p-4 border border-blue-500/30 animate-fade-in"
                    style={{ animationDelay: `${i * 0.3 + 0.5}s` }}
                  >
                    <p className="text-sm md:text-base text-white/90 italic">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: 핵심 인사이트 */}
        <section 
          ref={el => sectionsRef.current[4] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">💡</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 md:mb-16 text-center">
              고객은 선택하고 싶지 않다
            </h2>
            
            <div className="space-y-6 md:space-y-8">
              {[
                { wrong: '"프로그램 뭐가 있나요?"', right: '"지금 뭘 해야 하나요?"' },
                { wrong: '"전문가 소개해주세요"', right: '"이 문제 해결해주세요"' },
                { wrong: '"자료 있나요?"', right: '"따라만 가면 되는 거 없나요?"' }
              ].map((item, i) => (
                <div key={i} className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-center space-x-8'}`}>
                  <div className={`${isMobile ? 'w-full' : 'flex-1 text-right'}`}>
                    <div className={`${isMobile ? 'block' : 'inline-block'} bg-red-500/20 backdrop-blur-md rounded-xl p-4 border border-red-500/30`}>
                      <span className="text-2xl md:text-4xl mr-3">❌</span>
                      <span className="text-base md:text-xl text-white/60">{item.wrong}</span>
                    </div>
                  </div>
                  <div className={`text-2xl md:text-4xl animate-pulse ${isMobile ? 'text-center' : ''}`}>↓</div>
                  <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                    <div className={`${isMobile ? 'block' : 'inline-block'} bg-green-500/20 backdrop-blur-md rounded-xl p-4 border border-green-500/30`}>
                      <span className="text-2xl md:text-4xl mr-3">✅</span>
                      <span className="text-base md:text-xl text-white">{item.right}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: 설계 원칙 */}
        <section 
          ref={el => sectionsRef.current[5] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[5] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">⚙️</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 md:mb-12 text-center">
              따라가게 만드는 설계
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[
                { title: '선택 제거', desc: '대시보드 커스터마이징 금지', icon: '🚫' },
                { title: '즉시 실행', desc: '모든 분석은 액션으로', icon: '⚡' },
                { title: '객관 증빙', desc: '자료 기반 스코어링', icon: '📊' },
                { title: '자동 매칭', desc: '룰 기반 추천', icon: '🎯' },
                { title: '락인 설계', desc: 'KPI 이력 = 자산', icon: '🔒' }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-105 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="text-3xl md:text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm md:text-base text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Core5 시스템 */}
        <section 
          ref={el => sectionsRef.current[6] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[6] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">🎨</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 md:mb-12 text-center">
              모든 스타트업을 25개 좌표로
            </h2>
            
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20">
              {/* 레이더 차트 - 반응형 크기 */}
              <div className="relative h-60 md:h-80 mb-8">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                  {[1, 2, 3, 4, 5].map(level => (
                    <polygon
                      key={level}
                      points="200,80 295,150 260,260 140,260 105,150"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                      transform={`scale(${level * 0.2}) translate(${200 * (1 - level * 0.2)}, ${200 * (1 - level * 0.2)})`}
                    />
                  ))}
                  
                  <polygon
                    points="200,120 250,160 240,220 160,220 150,160"
                    fill="rgba(59, 130, 246, 0.3)"
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                  
                  <text x="200" y="60" fill="white" textAnchor="middle" className="text-base md:text-lg font-bold">GO</text>
                  <text x="310" y="150" fill="white" textAnchor="middle" className="text-base md:text-lg font-bold">EC</text>
                  <text x="280" y="280" fill="white" textAnchor="middle" className="text-base md:text-lg font-bold">PT</text>
                  <text x="120" y="280" fill="white" textAnchor="middle" className="text-base md:text-lg font-bold">PF</text>
                  <text x="90" y="150" fill="white" textAnchor="middle" className="text-base md:text-lg font-bold">TO</text>
                </svg>
              </div>
              
              <div className="grid grid-cols-5 gap-2 md:gap-4 text-center">
                {[
                  { name: 'GO', desc: '시장성' },
                  { name: 'EC', desc: '경제성' },
                  { name: 'PT', desc: '제품력' },
                  { name: 'PF', desc: '성과' },
                  { name: 'TO', desc: '팀역량' }
                ].map((axis, i) => (
                  <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="text-lg md:text-2xl font-bold text-white mb-1">{axis.name}</div>
                    <div className="text-xs md:text-sm text-white/60">{axis.desc}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-lg md:text-xl text-white">
                  5개 섹터 × 5개 단계 = <span className="text-2xl md:text-3xl font-bold text-blue-400">25개 클러스터</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: 제품 기능 */}
        <section 
          ref={el => sectionsRef.current[7] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[7] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">📱</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 md:mb-12 text-center">
              작동하는 Growth OS
            </h2>
            
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6 md:gap-8`}>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Zero Thinking Dashboard</h3>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-xs md:text-sm">
                  <p className="text-green-400 mb-2">월요일 아침:</p>
                  <div className="text-white/90 space-y-2">
                    <p>📌 이번 주 할 일</p>
                    <p className="pl-4">1. IR 자료 5페이지 보완 [D-3]</p>
                    <p className="pl-4">2. 시드 프로그램 지원 [D-7]</p>
                    <p className="text-white/50 mt-3">선택 없음. 그냥 따라오세요.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">성장 폐루프</h3>
                <div className="space-y-3">
                  {[
                    '진단 → Core5 스코어',
                    '로드맵 → NBA 생성',
                    '실행 → 빌드업 착수',
                    '증빙 → VDR 저장',
                    '매칭 → 자동 발견',
                    '↻ 다시 진단으로'
                  ].map((step, i) => (
                    <div 
                      key={i}
                      className="flex items-center space-x-2 text-sm md:text-base text-white/80 animate-fade-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className={`w-2 h-2 rounded-full ${i === 5 ? 'bg-purple-500' : 'bg-blue-500'}`} />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 text-center">매주 반복되는 성장 루틴</h3>
              <div className="flex justify-between items-center">
                {['월', '화', '수', '목', '금'].map((day, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto hover:bg-white/30 transition-all cursor-pointer">
                      <span className="text-white font-bold text-sm md:text-base">{day}</span>
                    </div>
                    <div className="text-xs text-white/60">
                      {['확인', '진단', '매칭', '실행', '측정'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 9: 3층 생태계 */}
        <section 
          ref={el => sectionsRef.current[8] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-6xl mx-auto transition-all duration-1000 ${
            isVisible[8] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 text-center animate-float">🚀</div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-8 md:mb-12 text-center">
              세 개의 궤도, 하나의 시스템
            </h2>
            
            {/* 모바일에서는 카드 레이아웃, 데스크톱에서는 오비탈 뷰 */}
            {!isMobile && (
              <div className="relative h-96 mb-12">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl animate-pulse" />
                  
                  {[
                    { radius: 250, label: '스타트업', desc: '월 15만원 구독', color: 'from-blue-500 to-cyan-500' },
                    { radius: 180, label: '빌더', desc: '프로젝트 수행', color: 'from-purple-500 to-pink-500' },
                    { radius: 100, label: '관리자', desc: '전체 운영', color: 'from-orange-500 to-red-500' }
                  ].map((orbit, i) => (
                    <div
                      key={i}
                      className={`absolute border-2 border-white/20 rounded-full animate-spin-slow`}
                      style={{
                        width: `${orbit.radius}px`,
                        height: `${orbit.radius}px`,
                        animationDuration: `${20 + i * 10}s`
                      }}
                    >
                      <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br ${orbit.color} rounded-xl p-4 shadow-2xl`}>
                        <h3 className="text-lg font-bold text-white">{orbit.label}</h3>
                        <p className="text-sm text-white/80">{orbit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[
                { 
                  title: '1층: 스타트업', 
                  items: ['월 15만원 구독', 'Core5 진단', 'NBA 제공', '자동 매칭'],
                  color: 'from-blue-500/20 to-cyan-500/20'
                },
                { 
                  title: '2층: 빌더', 
                  items: ['프로젝트 수행', '스타트업 매칭', '성과 트래킹', '수수료 정산'],
                  color: 'from-purple-500/20 to-pink-500/20'
                },
                { 
                  title: '3층: 관리자', 
                  items: ['KPI 관리', '가중치 설정', '프로그램 등록', '생태계 모니터링'],
                  color: 'from-orange-500/20 to-red-500/20'
                }
              ].map((layer, i) => (
                <div 
                  key={i}
                  className={`bg-gradient-to-br ${layer.color} backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:scale-105 transition-transform cursor-pointer`}
                >
                  <h3 className="text-lg md:text-xl font-bold text-white mb-4">{layer.title}</h3>
                  <ul className="space-y-2">
                    {layer.items.map((item, j) => (
                      <li key={j} className="text-sm md:text-base text-white/80 flex items-center">
                        <span className="mr-2">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 10: 최종 비전 (우주) */}
        <section 
          ref={el => sectionsRef.current[9] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 md:px-8"
        >
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible[9] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl md:text-6xl mb-8 animate-float">🌌</div>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-8 md:mb-12 animate-pulse">
              Startup Growth OS
            </h2>
            <div className="text-lg md:text-xl text-white/80 space-y-4 mb-12">
              <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>더 이상 정보를 찾지 마세요.</p>
              <p className="animate-fade-in" style={{ animationDelay: '0.4s' }}>더 이상 선택하지 마세요.</p>
              <p className="animate-fade-in" style={{ animationDelay: '0.6s' }}>더 이상 헤매지 마세요.</p>
              <p className="text-xl md:text-2xl text-white font-bold mt-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                PocketBiz가 길이 되겠습니다.
              </p>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '1s' }}>
              <button
                onClick={() => navigate('/?role=startup')}
                className="group relative px-8 md:px-12 py-4 md:py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg md:text-xl font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50"
              >
                <span className="relative z-10">지금 시작하기</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              </button>
              <p className="text-white/60 mt-6 text-sm md:text-base">첫 달 무료 • 카드 등록 불필요</p>
            </div>
            
            <div className="mt-20 p-6 md:p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-base md:text-lg text-white/70">
                이것이 우리가 만든 필연적 솔루션입니다.
              </p>
              <p className="text-sm md:text-base text-white/50 mt-2">
                매주 따라오기만 하면, 매주 성장합니다.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 우측 네비게이션 도트 (데스크톱만) */}
      {!isMobile && (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50">
          <div className="flex flex-col space-y-3">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(index)}
                className="group flex items-center justify-end"
              >
                <span className={`text-xs text-white/60 mr-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                  currentSection === index ? 'opacity-100' : ''
                }`}>
                  {section.title}
                </span>
                <div className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-150 ${
                  currentSection === index 
                    ? 'bg-white scale-125' 
                    : 'bg-white/30 hover:bg-white/60'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingV4Enhanced