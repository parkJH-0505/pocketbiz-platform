'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'

// 컴포넌트 분리 및 메모이제이션
const ProgressIndicator = React.memo(({ scrollProgress, currentSection, sections, depth, progressIcon }: any) => (
  <div className="fixed left-2 md:left-8 top-1/2 -translate-y-1/2 z-50 hidden sm:block">
    <div className="flex flex-col items-center space-y-2 md:space-y-4">
      <div className="text-white/60 text-sm font-mono">
        {depth < 0 ? `${Math.abs(depth).toFixed(0)}m ↓` : `${depth.toFixed(0)}m ↑`}
      </div>
      
      <div className="text-4xl animate-bounce">
        {progressIcon}
      </div>
      
      <div className="w-1 h-40 bg-white/20 rounded-full relative">
        <div 
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        {sections.map((section: any, index: number) => (
          <div
            key={section.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index <= currentSection ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  </div>
))

const LandingV4Refined: React.FC = () => {
  const navigate = useNavigate()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSection, setCurrentSection] = useState(0)
  const [depth, setDepth] = useState(-1000)
  const [isVisible, setIsVisible] = useState<boolean[]>(new Array(10).fill(false))
  const [showAboutModal, setShowAboutModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLDivElement[]>([])

  // 섹션 정의 - 한국어 개선
  const sections = [
    { id: 'problem', title: '시작', depth: -1000, icon: '🌊' },
    { id: 'why', title: '원인', depth: -800, icon: '🤔' },
    { id: 'goal', title: '전환점', depth: -600, icon: '🎯' },
    { id: 'assets', title: '자산', depth: -400, icon: '🔍' },
    { id: 'insight', title: '깨달음', depth: -200, icon: '💡' },
    { id: 'design', title: '설계', depth: 0, icon: '⚙️' },
    { id: 'core5', title: '체계', depth: 200, icon: '🎨' },
    { id: 'product', title: '작동', depth: 500, icon: '📱' },
    { id: 'ecosystem', title: '생태계', depth: 1000, icon: '🚀' },
    { id: 'vision', title: '미래', depth: 10000, icon: '🌌' }
  ]

  // Intersection Observer for animations - 최적화된 옵션
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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
      },
      { 
        threshold: 0.3,
        rootMargin: '50px'
      }
    )

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section)
      })
    }
  }, [])

  // 스크롤 이벤트 처리 - throttle 적용
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking && containerRef.current) {
        window.requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = containerRef.current!
          const maxScroll = scrollHeight - clientHeight
          const progress = (scrollTop / maxScroll) * 100
          
          setScrollProgress(progress)
          
          const sectionIndex = Math.floor((progress / 100) * sections.length)
          setCurrentSection(Math.min(sectionIndex, sections.length - 1))
          
          const currentDepth = -1000 + (progress / 100) * 11000
          setDepth(currentDepth)
          
          ticking = false
        })
        ticking = true
      }
    }

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
  }, [sections.length])

  // 배경 색상 계산 - 메모이제이션
  const backgroundGradient = useMemo(() => {
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
  }, [depth])

  // 진행 아이콘 - 메모이제이션
  const progressIcon = useMemo(() => {
    const progress = (depth + 1000) / 11000
    if (progress < 0.2) return '🤿'
    if (progress < 0.4) return '🚤'
    if (progress < 0.6) return '⛵'
    if (progress < 0.8) return '✈️'
    return '🚀'
  }, [depth])

  // 패럴랙스 속도 - 콜백 메모이제이션
  const getParallaxOffset = useCallback((speed: number) => {
    return scrollProgress * speed * -1
  }, [scrollProgress])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 배경 레이어 */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: backgroundGradient }}
      />
      
      {/* 패럴랙스 배경 요소 */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-full h-full"
          style={{ transform: `translateY(${getParallaxOffset(0.3)}px)` }}
        >
          {depth < 0 && (
            <>
              {useMemo(() => [...Array(20)].map((_, i) => {
                const size = Math.random() * 40 + 10
                return (
                  <div
                    key={`bubble-${i}`}
                    className="absolute bg-white/10 rounded-full animate-float"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: `${Math.random() * 100}%`,
                      bottom: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${Math.random() * 10 + 10}s`
                    }}
                  />
                )
              }), [])}
            </>
          )}
        </div>

        <div 
          className="absolute w-full h-full"
          style={{ transform: `translateY(${getParallaxOffset(0.6)}px)` }}
        >
          {depth > 0 && depth < 5000 && (
            <>
              {useMemo(() => [...Array(10)].map((_, i) => {
                const width = Math.random() * 200 + 100
                const height = Math.random() * 60 + 30
                return (
                  <div
                    key={`cloud-${i}`}
                    className="absolute bg-white/20 rounded-full blur-xl"
                    style={{
                      width: `${width}px`,
                      height: `${height}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                )
              }), [])}
            </>
          )}
        </div>
      </div>
      
      {/* 별 배경 (우주 섹션) */}
      {depth > 5000 && (
        <div className="absolute inset-0">
          {useMemo(() => [...Array(100)].map((_, i) => {
            const size = Math.random() * 3
            return (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            )
          }), [])}
        </div>
      )}

      {/* 스크롤 진행 표시기 - 분리된 컴포넌트 사용 */}
      <ProgressIndicator 
        scrollProgress={scrollProgress}
        currentSection={currentSection}
        sections={sections}
        depth={depth}
        progressIcon={progressIcon}
      />

      {/* 메인 컨텐츠 컨테이너 */}
      <div 
        ref={containerRef}
        className="relative h-full overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Section 1: 문제 인식 (심해) - 개선된 한국어 */}
        <section 
          ref={el => sectionsRef.current[0] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 animate-float">🌊</div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-12 leading-tight">
              프로젝트가 끝나면<br />
              <span className="text-blue-400">고객도 떠났습니다</span>
            </h1>
            <div className="text-xl text-white/80 space-y-4 max-w-2xl mx-auto">
              <p className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                포켓컴퍼니 7년.
              </p>
              <p className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
                성공적인 프로젝트 수행, 만족스러운 결과.
              </p>
              <p className="animate-fade-in text-white/60" style={{ animationDelay: '0.9s' }}>
                그런데 왜 매출은 제자리일까요?
              </p>
            </div>
            <div className="mt-16 text-white/50 animate-pulse text-sm">
              아래로 스크롤하여 답을 찾아보세요 ↓
            </div>
          </div>
        </section>

        {/* Section 2: 원인 분석 - 왜 그런가? */}
        <section 
          ref={el => sectionsRef.current[1] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 text-center animate-float">🤔</div>
            <div className="mb-12 text-center">
              <p className="text-lg text-white/60 mb-2">물론 고무적인 성과도 많았지만...</p>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white">
                <span className="text-red-400">큰 폭의 성장</span>은 맛본지 오래입니다
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* 문제점 분석 카드들 */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-md rounded-2xl p-6 border border-red-500/20">
                  <div className="text-2xl mb-3">📉</div>
                  <h3 className="text-xl font-bold text-white mb-3">단발성 관계</h3>
                  <p className="text-white/70">
                    프로젝트가 끝나면 관계도 끝.
                    <br />3개월 후 다시 연락? <span className="text-red-400">이미 늦었습니다.</span>
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20">
                  <div className="text-2xl mb-3">🔄</div>
                  <h3 className="text-xl font-bold text-white mb-3">반복되는 영업</h3>
                  <p className="text-white/70">
                    똑같은 제안서, 똑같은 미팅.
                    <br />매번 처음부터 <span className="text-orange-400">다시 시작</span>합니다.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/10 to-green-500/10 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/20">
                  <div className="text-2xl mb-3">💸</div>
                  <h3 className="text-xl font-bold text-white mb-3">비용 부담</h3>
                  <p className="text-white/70">
                    초기 프로젝트 비용이 부담스러워
                    <br />작은 고객은 <span className="text-yellow-400">포기</span>합니다.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/20">
                  <div className="text-2xl mb-3">🔗</div>
                  <h3 className="text-xl font-bold text-white mb-3">지속성 부족</h3>
                  <p className="text-white/70">
                    프로젝트 후 follow-up이 없으면
                    <br />고객은 <span className="text-green-400">자연스럽게 이탈</span>합니다.
                  </p>
                </div>
              </div>
              
              {/* 핵심 메시지 */}
              <div className="text-center mt-12">
                <div className="inline-block bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <p className="text-xl text-white/70 mb-4">
                    단건 베이스, 맨파워에 의존?
                  </p>
                  <p className="text-2xl text-white font-medium">
                    포켓에게도 <span className="text-blue-400">다음 스텝</span>이 필요하단 것을
                  </p>
                  <p className="text-xl text-white/80">
                    우리 모두 알고있습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: 전환점 - 성장의 한계 */}
        <section 
          ref={el => sectionsRef.current[2] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 text-center animate-float">🪜</div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-12 text-center">
              우리도 <span className="text-purple-400">벽</span>에 부딪혔습니다
            </h2>
            
            {/* 깨달음의 순간 */}
            <div className="relative mb-16">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-3xl" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <p className="text-2xl text-white/90 font-medium mb-4">
                    N년간 6,000개+ 스타트업과 함께하며 깨달았습니다
                  </p>
                  
                  {/* 주마등처럼 스쳐지나간 수많은 만남들 */}
                  <div className="relative my-8 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 z-10" />
                    <img 
                      src="/startup-collage.png" 
                      alt="수많은 스타트업과의 만남" 
                      className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <p className="text-sm text-white/60 text-center">
                        수많은 프로젝트, 수많은 만남, 그리고 하나의 깨달음
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xl text-white/70">
                    문제는 우리가 아닌 <span className="text-purple-400 font-bold">'구조'</span>에 있었습니다
                  </p>
                </div>
                
                {/* Before & After 비교 */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white/60 flex items-center">
                      <span className="text-red-400 mr-2">✗</span> 컨설팅의 한계
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2" />
                        <div>
                          <p className="text-white/80">우리 성장 = 프로젝트 수 × 단가</p>
                          <p className="text-sm text-white/50">선형적 성장의 한계</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2" />
                        <div>
                          <p className="text-white/80">매번 새로운 고객, 매번 처음부터</p>
                          <p className="text-sm text-white/50">축적되지 않는 관계</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2" />
                        <div>
                          <p className="text-white/80">우리가 없으면 멈추는 성장</p>
                          <p className="text-sm text-white/50">의존적 구조의 문제</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white/60 flex items-center">
                      <span className="text-green-400 mr-2">✓</span> 깨달은 진실
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2" />
                        <div>
                          <p className="text-white/80">고객이 성장해야 우리도 성장</p>
                          <p className="text-sm text-white/50">함께 크는 구조 필요</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2" />
                        <div>
                          <p className="text-white/80">일회성이 아닌 지속적 파트너십</p>
                          <p className="text-sm text-white/50">관계의 재정의</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2" />
                        <div>
                          <p className="text-white/80">플랫폼화로 지수적 성장 가능</p>
                          <p className="text-sm text-white/50">스케일의 혁신</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* 진화의 결단 - 컨설팅에서 플랫폼으로 */}
        <section className="py-24 relative overflow-hidden min-h-screen flex items-center">
          <div className="container mx-auto px-6">
            {/* 섹션 타이틀 */}
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-white mb-4">
                단건에서 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">생태계</span>로
              </h2>
              <p className="text-xl text-white/60">
                1:1 컨설팅의 한계를 넘어, N:N 플랫폼으로의 진화
              </p>
            </div>

            {/* 3단계 대각선 레이아웃 */}
            <div className="relative h-[600px] max-w-7xl mx-auto">
              
              {/* Step 1: 컨설팅 모델 (왼쪽 하단) */}
              <div className="absolute left-0 bottom-0 w-80 z-20">
                <div className="bg-gradient-to-b from-gray-900/50 to-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-3">🏢</div>
                    <h3 className="text-xl font-semibold text-white mb-1">컨설팅 회사</h3>
                    <p className="text-gray-400 text-sm">1:1 단건 프로젝트</p>
                  </div>
                  
                  {/* 1:1 구조 시각화 */}
                  <div className="flex justify-center items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">우리</span>
                    </div>
                    <div className="text-gray-500 text-sm">━━</div>
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">고객</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start text-gray-400">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>한 번에 한 기업만</span>
                    </li>
                    <li className="flex items-start text-gray-400">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>높은 비용</span>
                    </li>
                    <li className="flex items-start text-gray-400">
                      <span className="text-red-400 mr-2">✗</span>
                      <span>지식의 단절</span>
                    </li>
                  </ul>
                  
                  <div className="text-center mt-4">
                    <p className="text-xs text-gray-500">수면 아래</p>
                  </div>
                </div>
              </div>

              {/* Step 2: 전환 과정 (중앙) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-30">
                {/* 화살표 애니메이션 */}
                <div className="absolute -left-32 -top-20 text-4xl text-purple-400/50 animate-pulse">↗</div>
                <div className="absolute -right-32 -bottom-20 text-4xl text-purple-400/50 animate-pulse">↗</div>
                
                {/* TRANSFORMATION */}
                <div className="mb-8">
                  <div className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg shadow-purple-500/30">
                    <span className="text-white font-bold text-lg">TRANSFORMATION</span>
                  </div>
                </div>
                
                {/* 임팩트 수치 */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      100x
                    </div>
                    <p className="text-white/60 text-sm">도달 기업</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      1/10
                    </div>
                    <p className="text-white/60 text-sm">비용 절감</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      24/7
                    </div>
                    <p className="text-white/60 text-sm">즉시 이용</p>
                  </div>
                </div>
                
                {/* 결심의 순간 */}
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
                  <p className="text-2xl text-white font-bold mb-3">
                    그래서 우리는 결심했습니다
                  </p>
                  <p className="text-lg text-purple-400">
                    "더 많은 스타트업이 <span className="text-white font-semibold">함께 성장</span>할 수 있도록"
                  </p>
                  <p className="text-base text-white/80 mt-3">
                    시스템 자체를 <span className="text-purple-400">재설계</span>하기로.
                  </p>
                </div>
              </div>

              {/* Step 3: 플랫폼 모델 (오른쪽 상단) */}
              <div className="absolute right-0 top-0 w-80 z-20">
                <div className="bg-gradient-to-b from-purple-900/30 to-blue-900/20 rounded-2xl p-6 border border-purple-500/50 shadow-2xl shadow-purple-500/20">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-3">🚀</div>
                    <h3 className="text-xl font-semibold text-white mb-1">플랫폼 기업</h3>
                    <p className="text-purple-400 text-sm">N:N 생태계</p>
                  </div>
                  
                  {/* N:N 구조 시각화 */}
                  <div className="relative h-24 mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* 중앙 플랫폼 */}
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
                        <span className="text-white text-xs font-bold">HUB</span>
                      </div>
                      
                      {/* 연결된 노드들 */}
                      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <div
                          key={i}
                          className="absolute w-8 h-8 bg-purple-600/30 rounded-full border border-purple-400/50"
                          style={{
                            transform: `rotate(${angle}deg) translateX(40px) rotate(-${angle}deg)`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start text-white/80">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>수천 개 스타트업</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>합리적 비용</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>지식의 축적</span>
                    </li>
                  </ul>
                  
                  <div className="text-center mt-4">
                    <p className="text-xs text-purple-400">수면 위로</p>
                  </div>
                </div>
              </div>

              {/* 연결선 (점선 화살표) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(168, 85, 247, 0.5)" />
                  </marker>
                </defs>
                {/* 왼쪽 하단에서 중앙으로 */}
                <line
                  x1="280"
                  y1="480"
                  x2="45%"
                  y2="50%"
                  stroke="rgba(168, 85, 247, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                />
                {/* 중앙에서 오른쪽 상단으로 */}
                <line
                  x1="55%"
                  y1="50%"
                  x2="calc(100% - 280px)"
                  y2="120"
                  stroke="rgba(168, 85, 247, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* Section 4: 경쟁사 분석 - 완전 재설계 */}
        <section 
          ref={el => sectionsRef.current[3] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-7xl mx-auto transition-all duration-1000 ${
            isVisible[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {/* 메인 타이틀 */}
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-4">
                시장을 <span className="text-gradient bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">분석</span>했더니
              </h2>
              <p className="text-2xl text-white/60">명확한 답이 보였습니다</p>
            </div>
            
            {/* 경쟁사 비교 카드 - 3D 효과 */}
            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {[
                { 
                  company: '웰로비즈',
                  logo: '📚',
                  strength: '방대한 정보',
                  weakness: '선택 장애 유발',
                  userSays: '"정보는 많은데 뭐부터..."',
                  color: 'from-purple-600 to-purple-800'
                },
                { 
                  company: '노하우',
                  logo: '🤝',
                  strength: '전문가 매칭',
                  weakness: '일회성 연결',
                  userSays: '"연결됐는데 그 다음이..."',
                  color: 'from-green-600 to-green-800'
                },
                { 
                  company: '엑시토',
                  logo: '📅',
                  strength: '다양한 행사',
                  weakness: '단순 행사 나열',
                  userSays: '"그냥 행사 목록이네..."',
                  color: 'from-blue-600 to-blue-800'
                }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="relative group transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  {/* 카드 배경 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                  
                  {/* 메인 카드 */}
                  <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all shadow-2xl">
                    {/* 회사 헤더 */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">{item.logo}</div>
                        <h3 className="text-xl font-bold text-white">{item.company}</h3>
                      </div>
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color} animate-pulse`} />
                    </div>
                    
                    {/* 강점/약점 분석 */}
                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">✓</span>
                          <span className="text-white/80">{item.strength}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-400">✗</span>
                          <span className="text-white/80">{item.weakness}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 고객 목소리 */}
                    <div className="relative bg-black/30 rounded-xl p-4 border border-white/5">
                      <div className="absolute -top-2 -left-2 text-3xl opacity-20">"</div>
                      <p className="text-sm text-white/60 italic">{item.userSays}</p>
                      <div className="absolute -bottom-2 -right-2 text-3xl opacity-20 rotate-180">"</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 인사이트 섹션 */}
            <div className="relative">
              {/* 중앙 분리선 */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* 포켓비즈 차별점 */}
              <div className="relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl">
                <div className="text-center">
                  <div className="inline-block mb-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-3xl font-bold text-white mb-2">포켓비즈의 답</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-8 mb-10">
                    <div className="text-center group">
                      <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">🎬</div>
                      <h4 className="text-lg font-bold text-white mb-2">즉시 실행</h4>
                      <p className="text-white/60 text-sm">정보 제공이 아닌<br/>직접 실행 지원</p>
                    </div>
                    <div className="text-center group">
                      <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">🔄</div>
                      <h4 className="text-lg font-bold text-white mb-2">지속 관리</h4>
                      <p className="text-white/60 text-sm">일회성이 아닌<br/>장기적 파트너십</p>
                    </div>
                    <div className="text-center group">
                      <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">⚡</div>
                      <h4 className="text-lg font-bold text-white mb-2">상시 대응</h4>
                      <p className="text-white/60 text-sm">시기 제한 없는<br/>365일 서비스</p>
                    </div>
                  </div>
                  
                  <div className="inline-block relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-xl opacity-50" />
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-2xl">
                      큐레이션이 아닌 <span className="text-yellow-300">실행 파트너</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: 핵심 인사이트 - 개선된 한국어 */}
        <section 
          ref={el => sectionsRef.current[4] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 text-center animate-float">💡</div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-16 text-center">
              고객은 <span className="text-red-400">결정</span>하기 싫어합니다
            </h2>
            
            {/* 질문의 진화 - 개선된 디자인 */}
            <div className="space-y-8">
              {[
                { 
                  wrong: '어떤 프로그램이 있나요?', 
                  right: '지금 뭘 해야 하나요?',
                  insight: '선택이 아닌 지시'
                },
                { 
                  wrong: '전문가 연결해주세요', 
                  right: '이 문제 해결해주세요',
                  insight: '연결이 아닌 해결'
                },
                { 
                  wrong: '자료 좀 주세요', 
                  right: '따라만 하면 되나요?',
                  insight: '정보가 아닌 실행'
                }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="flex items-center justify-center space-x-8">
                    <div className="flex-1 text-right">
                      <div className="inline-block relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl" />
                        <div className="relative bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-md rounded-2xl p-6 border border-red-500/30">
                          <span className="text-3xl mr-3">❌</span>
                          <span className="text-xl text-white/60">{item.wrong}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="text-3xl text-white animate-pulse">→</div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/40 whitespace-nowrap">
                        {item.insight}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="inline-block relative">
                        <div className="absolute inset-0 bg-green-500/20 blur-xl" />
                        <div className="relative bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/30">
                          <span className="text-3xl mr-3">✅</span>
                          <span className="text-xl text-white font-medium">{item.right}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: 설계 원칙 - 개선된 한국어 */}
        <section 
          ref={el => sectionsRef.current[5] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[5] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 text-center animate-float">⚙️</div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 text-center">
              따라오기만 하면 되는
            </h2>
            <p className="text-2xl text-white/70 text-center mb-12">완벽한 설계</p>
            
            {/* 5대 설계 원칙 - 개선된 카드 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  title: '선택 제거', 
                  desc: '커스터마이징 없음. 오늘 할 일 2개만', 
                  icon: '🚫',
                  color: 'from-red-500/20 to-red-600/10'
                },
                { 
                  title: '즉시 실행', 
                  desc: '분석은 곧바로 액션으로 연결', 
                  icon: '⚡',
                  color: 'from-yellow-500/20 to-yellow-600/10'
                },
                { 
                  title: '객관적 증빙', 
                  desc: '말이 아닌 자료로 평가', 
                  icon: '📊',
                  color: 'from-blue-500/20 to-blue-600/10'
                },
                { 
                  title: '자동 매칭', 
                  desc: '우리가 찾아서 추천', 
                  icon: '🎯',
                  color: 'from-green-500/20 to-green-600/10'
                },
                { 
                  title: '락인 설계', 
                  desc: 'KPI 이력이 곧 자산', 
                  icon: '🔒',
                  color: 'from-purple-500/20 to-purple-600/10'
                }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  <div className={`relative bg-gradient-to-br ${item.color} backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl`}>
                    <div className="mb-4 flex justify-start">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Core5 시스템 - 개선된 한국어 */}
        <section 
          ref={el => sectionsRef.current[6] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[6] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 text-center animate-float">🧭</div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 text-center">
              좌표를 찾고,
            </h2>
            <p className="text-2xl text-white/70 text-center mb-12">
              <span className="text-blue-400 font-semibold">나아갈 길</span>을 제시합니다
            </p>
            
            {/* 좌표 진단 + 방향 제시 통합 뷰 */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* 왼쪽: Core5 레이더 차트 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">현재 위치 진단</h3>
                  <div className="relative h-64 mb-6">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                    {/* 배경 그리드 */}
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
                    
                    {/* 실제 점수 */}
                    <polygon
                      points="200,120 250,160 240,220 160,220 150,160"
                      fill="url(#gradient)"
                      fillOpacity="0.3"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                    
                    {/* 그라데이션 정의 */}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    
                    {/* 축 라벨 */}
                    <text x="200" y="60" fill="white" textAnchor="middle" className="text-lg font-bold">GO</text>
                    <text x="310" y="150" fill="white" textAnchor="middle" className="text-lg font-bold">EC</text>
                    <text x="280" y="280" fill="white" textAnchor="middle" className="text-lg font-bold">PT</text>
                    <text x="120" y="280" fill="white" textAnchor="middle" className="text-lg font-bold">PF</text>
                    <text x="90" y="150" fill="white" textAnchor="middle" className="text-lg font-bold">TO</text>
                  </svg>
                  </div>
                  
                  {/* 5개 축 설명 */}
                  <div className="grid grid-cols-5 gap-2 text-center mb-4">
                    {[
                      { name: 'GO', desc: '시장 진출' },
                      { name: 'EC', desc: '수익 모델' },
                      { name: 'PT', desc: '제품 완성도' },
                      { name: 'PF', desc: '실제 성과' },
                      { name: 'TO', desc: '팀 역량' }
                    ].map((axis, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {axis.name}
                        </div>
                        <div className="text-xs text-white/60">
                          {axis.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg text-white">
                      <span className="text-2xl font-bold text-blue-400">5 × 5 = 25</span>
                    </p>
                    <p className="text-white/60 text-sm">25개의 정확한 좌표</p>
                  </div>
                </div>
              </div>
              
              {/* 오른쪽: 방향 제시 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 blur-3xl" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">맞춤형 성장 경로</h3>
                  
                  {/* 성장 단계 로드맵 */}
                  <div className="space-y-4 mb-6">
                    {[
                      { 
                        stage: '현재', 
                        score: 'Level 2.8',
                        status: '제품 고도화 필요',
                        action: 'MVP 개선',
                        color: 'from-blue-500 to-blue-600'
                      },
                      { 
                        stage: '3개월', 
                        score: 'Level 3.5',
                        status: '시장 검증 단계',
                        action: 'PMF 달성',
                        color: 'from-purple-500 to-purple-600'
                      },
                      { 
                        stage: '6개월', 
                        score: 'Level 4.2',
                        status: '성장 가속화',
                        action: '시리즈A 준비',
                        color: 'from-green-500 to-green-600'
                      }
                    ].map((item, i) => (
                      <div key={i} className="relative">
                        {/* 연결선 */}
                        {i < 2 && (
                          <div className="absolute left-7 top-14 w-0.5 h-8 bg-gradient-to-b from-white/20 to-transparent" />
                        )}
                        
                        <div className="flex items-center space-x-4">
                          {/* 타임라인 노드 */}
                          <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                            <span className="text-white font-bold text-sm">{i + 1}</span>
                            {i === 0 && (
                              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                            )}
                          </div>
                          
                          {/* 정보 카드 */}
                          <div className="flex-1 bg-black/20 rounded-xl p-3 border border-white/10">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-bold text-white">{item.stage}</span>
                              <span className="text-xs text-green-400 font-mono">{item.score}</span>
                            </div>
                            <p className="text-xs text-white/70 mb-1">{item.status}</p>
                            <p className="text-sm text-blue-400 font-medium">→ {item.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 핵심 액션 아이템 */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-white/20">
                    <h4 className="text-sm font-bold text-white mb-3">🎯 다음 단계 핵심 과제</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        <span className="text-xs text-white/80">제품 안정성 85% → 95%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        <span className="text-xs text-white/80">월 매출 500만원 달성</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                        <span className="text-xs text-white/80">핵심 인력 2명 충원</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: 제품 기능 - 개선된 한국어 */}
        <section 
          ref={el => sectionsRef.current[7] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible[7] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 text-center animate-float">📱</div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 text-center">
              매일 쓸 수밖에 없는
            </h2>
            <p className="text-2xl text-white/70 text-center mb-12">
              <span className="text-green-400 font-semibold">Growth OS</span>
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Zero Thinking Dashboard - 개선 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent blur-xl" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="w-2 h-6 bg-blue-500 mr-3 rounded-full" />
                    생각할 필요 없는 대시보드
                  </h3>
                  <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                    <p className="text-green-400 mb-3">월요일 아침 9시</p>
                    <div className="text-white/90 space-y-3">
                      <div className="flex items-start">
                        <span className="text-blue-400 mr-2">1.</span>
                        <div>
                          <p>IR 덱 5페이지 보완</p>
                          <p className="text-white/50 text-xs mt-1">[3시간] • D-3</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-blue-400 mr-2">2.</span>
                        <div>
                          <p>팁스 프로그램 지원</p>
                          <p className="text-white/50 text-xs mt-1">[1시간] • D-7</p>
                        </div>
                      </div>
                      <p className="text-white/40 mt-4 text-xs">
                        더 이상 고민하지 마세요. 그냥 하세요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 폐루프 구조 - 개선 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent blur-xl" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="w-2 h-6 bg-purple-500 mr-3 rounded-full" />
                    성장의 운영체제
                  </h3>
                  <div className="space-y-3">
                    {[
                      { step: '진단', desc: 'Core5 점수 측정', icon: '📊' },
                      { step: '처방', desc: 'NBA 액션 생성', icon: '💊' },
                      { step: '실행', desc: '빌드업 프로젝트', icon: '🔨' },
                      { step: '증명', desc: 'VDR에 증빙 저장', icon: '📁' },
                      { step: '매칭', desc: '새 기회 자동 발견', icon: '🎯' },
                      { step: '재진단', desc: '다시 측정하고 개선', icon: '🔄' }
                    ].map((item, i) => (
                      <div 
                        key={i}
                        className="flex items-center space-x-3 text-white/80 animate-fade-in"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <div className="mr-3">
                        <span className="text-lg">{item.icon}</span>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-white">{item.step}</span>
                          <span className="text-white/50 text-sm ml-2">→ {item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 주간 루틴 - 요일별 구체적 표현 */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-2xl" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6 text-center">매주 반복되는 성장 루틴</h3>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { 
                      day: '월', 
                      task: '"이번 주 할 일" 확인', 
                      desc: '대시보드에서',
                      time: '평균 30분 소요',
                      color: 'from-blue-500 to-blue-600' 
                    },
                    { 
                      day: '화', 
                      task: 'KPI 업데이트', 
                      desc: '개선점 발견',
                      time: '평균 30분 소요',
                      color: 'from-green-500 to-green-600' 
                    },
                    { 
                      day: '수', 
                      task: '매칭된 프로그램', 
                      desc: '신청하기',
                      time: '평균 30분 소요',
                      color: 'from-yellow-500 to-yellow-600' 
                    },
                    { 
                      day: '목', 
                      task: '빌드업 프로젝트', 
                      desc: '진행하기',
                      time: '평균 30분 소요',
                      color: 'from-orange-500 to-orange-600' 
                    },
                    { 
                      day: '금', 
                      task: 'VDR로 투자자와', 
                      desc: '공유하기',
                      time: '평균 30분 소요',
                      color: 'from-purple-500 to-purple-600' 
                    }
                  ].map((item, i) => (
                    <div key={i} className="text-center group cursor-pointer">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg group-hover:scale-110 transition-transform`}>
                        <span className="text-white font-bold text-base sm:text-lg">{item.day}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm text-white font-medium leading-tight">
                          {item.task}
                        </div>
                        <div className="text-xs text-white/70">
                          {item.desc}
                        </div>
                        <div className="text-xs text-blue-400/80 font-light">
                          {item.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 9: 3층 생태계 - 개선된 한국어 */}
        <section 
          ref={el => sectionsRef.current[8] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-6xl mx-auto transition-all duration-1000 ${
            isVisible[8] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 text-center animate-float">🚀</div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 text-center">
              3개 층이
            </h2>
            <p className="text-2xl text-white/70 text-center mb-12">
              <span className="text-orange-400 font-semibold">하나로</span> 움직입니다
            </p>
            
            {/* 3층 구조 - 네트워크 허브 생태계 뷰 */}
            <div className="relative mb-16 h-[600px] flex items-center justify-center">
              {/* 중앙 허브 - 포켓 컨설턴트 */}
              <div className="absolute z-30">
                <div className="relative">
                  {/* 광채 효과 */}
                  <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                  
                  {/* 메인 허브 */}
                  <div className="relative w-32 h-32 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🌟</div>
                      <h3 className="text-sm font-bold text-white">포켓</h3>
                      <p className="text-xs text-white/90">컨설턴트</p>
                    </div>
                  </div>
                  
                  {/* 연결선 생성 애니메이션 */}
                  {[...Array(8)].map((_, i) => {
                    const angle = (i * 45) * Math.PI / 180;
                    const endX = Math.cos(angle) * 250;
                    const endY = Math.sin(angle) * 250;
                    return (
                      <svg
                        key={i}
                        className="absolute inset-0 w-[500px] h-[500px] -left-[184px] -top-[184px] pointer-events-none"
                      >
                        <line
                          x1="250"
                          y1="250"
                          x2={250 + endX}
                          y2={250 + endY}
                          stroke="url(#gradient-line)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="animate-pulse"
                          style={{ animationDelay: `${i * 0.1}s` }}
                          opacity="0.3"
                        />
                        <defs>
                          <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(251, 146, 60, 0.8)" />
                            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)" />
                          </linearGradient>
                        </defs>
                      </svg>
                    );
                  })}
                </div>
              </div>
              
              {/* 스타트업 노드들 - 외곽 */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45) * Math.PI / 180;
                const x = Math.cos(angle) * 250;
                const y = Math.sin(angle) * 250;
                return (
                  <div
                    key={`startup-${i}`}
                    className="absolute"
                    style={{
                      left: `calc(50% + ${x}px - 40px)`,
                      top: `calc(50% + ${y}px - 40px)`
                    }}
                  >
                    <div className="relative group">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-blue-400/30 hover:border-blue-400/60 transition-all cursor-pointer">
                        <div className="text-center">
                          <div className="text-lg">🚀</div>
                          <p className="text-xs text-white/80 font-semibold">스타트업</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* 빌더 노드들 - 중간 */}
              {[...Array(6)].map((_, i) => {
                const angle = (i * 60 + 30) * Math.PI / 180;
                const x = Math.cos(angle) * 150;
                const y = Math.sin(angle) * 150;
                return (
                  <div
                    key={`builder-${i}`}
                    className="absolute"
                    style={{
                      left: `calc(50% + ${x}px - 35px)`,
                      top: `calc(50% + ${y}px - 35px)`
                    }}
                  >
                    <div className="relative group">
                      <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="relative w-[70px] h-[70px] bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-purple-400/30 hover:border-purple-400/60 transition-all cursor-pointer">
                        <div className="text-center">
                          <div className="text-base">⚡</div>
                          <p className="text-xs text-white/80 font-semibold">빌더</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* 데이터 플로우 애니메이션 */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-blue-400 rounded-full animate-ping"
                    style={{
                      left: '50%',
                      top: '50%',
                      animationDelay: `${i * 2}s`,
                      animationDuration: '3s'
                    }}
                  />
                ))}
              </div>
              
              {/* 설명 텍스트 */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center">
                <p className="text-lg text-white/80">
                  <span className="text-orange-400 font-bold">포켓 컨설턴트</span>가 만드는
                </p>
                <p className="text-xl text-white font-bold">
                  연결과 성장의 <span className="text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">생태계</span>
                </p>
              </div>
            </div>
            
            {/* 상세 설명 - 개선 */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  title: '스타트업 층', 
                  subtitle: '성장의 주인공',
                  items: [
                    '월 15만원 구독',
                    'Core5 진단 도구',
                    '주간 NBA 제공',
                    '자동 기회 매칭'
                  ],
                  gradient: 'from-blue-500/20 to-cyan-500/10',
                  border: 'border-blue-500/30'
                },
                { 
                  title: '빌더 층', 
                  subtitle: '성장의 조력자',
                  items: [
                    '프로젝트 수주',
                    '스타트업 매칭',
                    '성과 트래킹',
                    '수익 공유'
                  ],
                  gradient: 'from-purple-500/20 to-pink-500/10',
                  border: 'border-purple-500/30'
                },
                { 
                  title: '포켓 컨설턴트 층', 
                  subtitle: '성장의 설계자',
                  items: [
                    'KPI 라이브러리',
                    '가중치 설정',
                    '프로그램 등록',
                    '생태계 모니터링'
                  ],
                  gradient: 'from-orange-500/20 to-red-500/10',
                  border: 'border-orange-500/30'
                }
              ].map((layer, i) => (
                <div 
                  key={i}
                  className={`group relative`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${layer.gradient} blur-xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                  <div className={`relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border ${layer.border} hover:scale-105 transition-transform cursor-pointer`}>
                    <h3 className="text-xl font-bold text-white mb-1">{layer.title}</h3>
                    <p className="text-sm text-white/60 mb-4">{layer.subtitle}</p>
                    <ul className="space-y-2">
                      {layer.items.map((item, j) => (
                        <li key={j} className="text-white/80 text-sm flex items-center">
                          <span className="w-1 h-1 bg-white rounded-full mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 통합 컴포넌트: 분산된 5가지를 하나로 */}
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 overflow-visible">
          <div className="max-w-6xl mx-auto overflow-visible">
            <p className="text-lg text-white/80 text-center mb-4">
              포켓이 보유한 핵심 자산과 역량을 통해 스타트업의 성공을 가속화합니다
            </p>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white text-center mb-16">
              분산된 <span className="text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">5가지</span>를 <span className="text-gradient bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">하나로</span> 통합
            </h2>
            
            {/* 통합 비주얼라이제이션 */}
            <div className="relative h-[800px] flex items-center justify-center overflow-visible">
              {/* 중앙 포켓비즈 코어 */}
              <div className="absolute z-20">
                <div className="relative">
                  {/* 빛나는 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-60 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  
                  {/* 메인 실드 */}
                  <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 border-2 border-purple-500/50 shadow-2xl">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white mb-2">포켓비즈</div>
                      <div className="text-xl text-purple-400">성장 OS</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 주변 5가지 요소들 - 포켓의 핵심 자산들 */}
              {[
                { title: '실행 자산', subtitle: 'IR/PSST·개발·마케팅 등', icon: '⚡', angle: 0, color: 'from-cyan-500 to-blue-600' },
                { title: '브릿지 자산', subtitle: '포켓데이(VC/파트너)', icon: '🌉', angle: 72, color: 'from-blue-500 to-indigo-600' },
                { title: '콘텐츠 자산', subtitle: '포켓멘토(교육/템플릿)', icon: '📚', angle: 144, color: 'from-indigo-500 to-purple-600' },
                { title: '인프라 자산', subtitle: 'VC,창업가,전문가 네트워크', icon: '🌐', angle: 216, color: 'from-purple-500 to-blue-600' },
                { title: '성장 로드맵', subtitle: '스타트업의 성장 경로', icon: '🚀', angle: 288, color: 'from-amber-500 to-orange-600' }
              ].map((item, index) => {
                const radian = (item.angle * Math.PI) / 180;
                const x = Math.cos(radian) * 280;
                const y = Math.sin(radian) * 280;
                
                return (
                  <div
                    key={`item-${index}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      zIndex: 40
                    }}
                  >
                    {/* 아이템 박스 */}
                    <div className={`relative bg-gradient-to-br ${item.color} rounded-2xl p-4 shadow-xl hover:scale-110 transition-transform cursor-pointer group`}>
                      <div className="text-3xl mb-2 text-center">{item.icon}</div>
                      <div className="text-sm font-bold text-white text-center whitespace-nowrap">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-white/80 text-center mt-1 whitespace-nowrap">{item.subtitle}</div>
                      )}
                      
                      {/* 호버 효과 */}
                      <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
              
              {/* 회전하는 궁도 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] border border-purple-500/20 rounded-full animate-spin-slow" />
                <div className="absolute w-[400px] h-[400px] border border-blue-500/20 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
                <div className="absolute w-[300px] h-[300px] border border-pink-500/20 rounded-full animate-spin-slow" style={{ animationDuration: '25s' }} />
              </div>
            </div>
            
            {/* 하단 설명 */}
            <div className="text-center mt-16">
              <p className="text-xl text-white/60 mb-4">
                포켓이 보유한 핵심 자산과 역량을 통해
              </p>
              <p className="text-2xl text-white/80">
                <span className="text-cyan-400">실행력</span>, <span className="text-blue-400">네트워크</span>, <span className="text-indigo-400">콘텐츠</span>, <span className="text-purple-400">인프라</span>, <span className="text-orange-400">성장경로</span>
              </p>
              <p className="text-3xl text-white font-bold mt-4">
                <span className="text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">포켓비즈 성장 OS</span>로 스타트업의 성공을 가속화합니다
              </p>
            </div>
            
            {/* 포켓컴퍼니의 다음 단계: 수익 극대화 전략 */}
            <div className="relative mt-20">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 blur-3xl" />
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl p-8 border border-yellow-500/30 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30 mb-4">
                    <span className="text-sm text-yellow-400 font-semibold">NEXT PHASE</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    <span className="text-5xl mb-4 block">💰</span>
                    포켓컴퍼니의 <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">성장 전략</span>
                  </h3>
                  <p className="text-lg text-white/70">
                    검증된 비즈니스 모델을 기반으로 한 수익 극대화 로드맵
                  </p>
                </div>
                
                {/* 수익 확장 로드맵 - 개선된 버전 */}
                <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-6 mb-8">
                  {[
                    { 
                      stage: '₩15만', 
                      label: '진입 장벽 낮추기', 
                      desc: '월 구독으로 시작',
                      icon: '🎯', 
                      color: 'from-blue-500 to-cyan-500',
                      detail: '부담 없는 가격으로\n모든 스타트업이 시작'
                    },
                    { 
                      stage: '₩500만+', 
                      label: '가치 증명하기', 
                      desc: '프로젝트로 확장',
                      icon: '🚀', 
                      color: 'from-cyan-500 to-green-500',
                      detail: '필요에 따라\n심화 프로젝트 진행'
                    },
                    { 
                      stage: '₩2000만+', 
                      label: '파트너십 구축', 
                      desc: '연간 계약 체결',
                      icon: '💎', 
                      color: 'from-green-500 to-yellow-500',
                      detail: '장기 파트너로\n함께 성장하기'
                    }
                  ].map((item, i) => (
                    <div key={i} className="relative flex-1 w-full md:w-auto">
                      <div className="relative group">
                        {/* 배경 효과 */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity`} />
                        
                        {/* 카드 */}
                        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
                          <div className="text-4xl mb-3">{item.icon}</div>
                          <div className="text-3xl font-bold text-white mb-1">{item.stage}</div>
                          <div className="text-sm text-white font-semibold mb-2">{item.label}</div>
                          <div className="text-xs text-white/60 whitespace-pre-line">{item.detail}</div>
                        </div>
                      </div>
                      
                      {/* 화살표 */}
                      {i < 2 && (
                        <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-2xl text-yellow-400/60 z-10 animate-pulse">
                          →
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* 핵심 전략 설명 */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 mb-6">
                  <p className="text-lg text-white/90 text-center leading-relaxed">
                    <span className="text-yellow-400 font-bold">"구독에서 시작해 프로젝트로 성장"</span><br/>
                    <span className="text-sm text-white/70 mt-2 block">
                      고객의 성장 단계에 맞춰 자연스럽게 확장되는 수익 모델
                    </span>
                  </p>
                </div>
                
                {/* 전략 실행 방안 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { 
                      icon: '📈', 
                      label: '업셀 전략',
                      desc: '구독 → 프로젝트',
                      color: 'from-green-500/20 to-green-600/10'
                    },
                    { 
                      icon: '🔗', 
                      label: '크로스셀',
                      desc: '연계 서비스 확대',
                      color: 'from-blue-500/20 to-blue-600/10'
                    },
                    { 
                      icon: '🎯', 
                      label: 'LTV 극대화',
                      desc: '장기 고객 전환',
                      color: 'from-purple-500/20 to-purple-600/10'
                    },
                    { 
                      icon: '💎', 
                      label: '프리미엄화',
                      desc: '고부가가치 창출',
                      color: 'from-orange-500/20 to-orange-600/10'
                    }
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className={`group relative bg-gradient-to-br ${item.color} backdrop-blur-sm rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 cursor-pointer border border-white/10 hover:border-white/20`}
                    >
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <div className="text-sm font-bold text-white mb-1">{item.label}</div>
                      <div className="text-xs text-white/60">{item.desc}</div>
                    </div>
                  ))}
                </div>
                
                {/* 예상 성과 */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/60">예상 고객당 연간 가치</div>
                    <div className="text-2xl font-bold text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      2,400만원+
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 10: 최종 비전 (우주) - 개선된 한국어 */}
        <section 
          ref={el => sectionsRef.current[9] = el!}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 py-20 mb-20"
        >
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible[9] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="text-5xl sm:text-6xl mb-6 sm:mb-8 animate-float">🌌</div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-4">
              성장의 운영체제
            </h2>
            <p className="text-3xl md:text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-pulse">
              PocketBiz
            </p>
            
            <div className="text-xl text-white/80 space-y-4 mb-12 max-w-3xl mx-auto">
              <p className="animate-fade-in text-2xl" style={{ animationDelay: '0.2s' }}>
                프로젝트 중심에서 <span className="text-yellow-400">관계 중심</span>으로
              </p>
              <p className="animate-fade-in text-2xl" style={{ animationDelay: '0.4s' }}>
                단발성에서 <span className="text-blue-400">지속성</span>으로
              </p>
              <p className="animate-fade-in text-2xl" style={{ animationDelay: '0.6s' }}>
                비용에서 <span className="text-purple-400">가치</span>로
              </p>
              
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-3xl text-white font-bold animate-fade-in" style={{ animationDelay: '0.8s' }}>
                  <span className="text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Startup Growth OS</span>
                </p>
                <p className="text-lg text-white/60 mt-4 animate-fade-in" style={{ animationDelay: '1s' }}>
                  우리가 만드는 새로운 표준
                </p>
              </div>
            </div>
            
            {/* 각 환경 체험 버튼들 */}
            <div className="animate-fade-in" style={{ animationDelay: '1s' }}>
              <h3 className="text-2xl font-bold text-white mb-12">시작하실 준비가 되셨나요?</h3>
              
              {/* 메인 CTA - 스타트업 체험 */}
              <div className="flex flex-col items-center space-y-8">
                <button
                  onClick={() => navigate('/startup/dashboard')}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl px-12 py-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  {/* 애니메이션 배경 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                  
                  {/* 버튼 콘텐츠 */}
                  <div className="relative z-10">
                    <div className="text-3xl font-bold text-white mb-2">스타트업으로 시작하기</div>
                    <div className="text-sm text-white/90">창업자를 위한 성장 대시보드 체험</div>
                  </div>
                  
                  {/* 화살표 아이콘 */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 text-white text-2xl group-hover:translate-x-2 transition-transform">
                    →
                  </div>
                </button>
                
                {/* 기타 환경 - 서브 옵션 */}
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => navigate('/admin/kpi-library')}
                    className="group relative bg-white/10 backdrop-blur-md rounded-xl px-8 py-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:bg-white/15"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-white/70 group-hover:text-white font-medium transition-colors">관리자 환경</span>
                      <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">Beta</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/internal-builder/dashboard')}
                    className="group relative bg-white/10 backdrop-blur-md rounded-xl px-8 py-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:bg-white/15"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-white/70 group-hover:text-white font-medium transition-colors">내부 빌더</span>
                      <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">Beta</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/partner/programs')}
                    className="group relative bg-white/10 backdrop-blur-md rounded-xl px-8 py-4 border border-white/20 hover:border-white/40 transition-all duration-300 hover:bg-white/15"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-white/70 group-hover:text-white font-medium transition-colors">외부 빌더</span>
                      <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">Beta</span>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* 추가 링크 */}
              <div className="flex justify-center space-x-6 text-sm mt-12">
                <a 
                  href="https://github.com/pocketcompany" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors flex items-center"
                >
                  <span className="mr-2">🐱</span> GitHub
                </a>
                <a 
                  href="#" 
                  className="text-white/60 hover:text-white transition-colors flex items-center"
                >
                  <span className="mr-2">🌐</span> Website
                </a>
                <a 
                  href="#" 
                  className="text-white/60 hover:text-white transition-colors flex items-center"
                >
                  <span className="mr-2">📚</span> Docs
                </a>
              </div>
            </div>
            
            {/* 푸터 - 위치 조정 */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                  <p className="text-sm text-white/60">
                    © 2024 PocketBiz. All rights reserved.
                  </p>
                  <p className="text-sm text-white/80 mt-1">
                    Product Design & Strategy by <span className="text-blue-400 font-bold">박준홍</span>
                  </p>
                </div>
                
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => setShowAboutModal(true)}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    About Project
                  </button>
                  <a 
                    href="#" 
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 우측 네비게이션 도트 */}
      <div className="fixed right-2 md:right-8 top-1/2 -translate-y-1/2 z-50 hidden md:block">
        <div className="flex flex-col space-y-3">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => {
                sectionsRef.current[index]?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group flex items-center justify-end"
            >
              <span className={`text-xs text-white/60 mr-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                currentSection === index ? 'opacity-100' : ''
              }`}>
                {section.title}
              </span>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSection === index 
                  ? 'bg-white scale-125' 
                  : 'bg-white/30 hover:bg-white/60'
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* About 버튼 - 우측 상단 */}
      <button
        onClick={() => setShowAboutModal(true)}
        className="fixed top-6 right-6 z-50 bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-md rounded-full px-4 py-2 border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 group shadow-lg"
        aria-label="About this project"
      >
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm font-bold">About</span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
        </div>
      </button>

      {/* UI로 바로가기 버튼 - 우측 하단 */}
      <button
        onClick={() => {
          const lastSection = sectionsRef.current[sectionsRef.current.length - 1]
          if (lastSection) {
            lastSection.scrollIntoView({ behavior: 'smooth' })
          }
        }}
        className="fixed bottom-8 right-8 z-50 group"
        aria-label="UI로 바로가기"
      >
        <div className="relative">
          {/* 배경 애니메이션 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity animate-pulse" />
          
          {/* 메인 버튼 */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-6 py-3 shadow-2xl border border-white/20 backdrop-blur-md group-hover:scale-105 transition-transform">
            <div className="flex items-center space-x-2">
              <span className="text-white font-semibold text-sm">UI로 바로가기</span>
              <svg 
                className="w-4 h-4 text-white animate-bounce" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* About 모달 */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* 배경 오버레이 */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAboutModal(false)}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-6">포켓비즈 플랫폼 설계</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">총괄 기획</h4>
                <p className="text-xl text-blue-400 font-bold">박준홍</p>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-semibold text-white/60 mb-2">주요 담당 업무</h4>
                <ul className="space-y-1 text-sm text-white/80">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>비즈니스 모델 설계 및 수익 구조 기획</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>UX/UI 아키텍처 및 사용자 경험 설계</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>Core5 진단 체계 및 KPI 프레임워크 구축</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>3층 생태계 구조 및 성장 전략 수립</span>
                  </li>
                </ul>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-white/40">
                  Product Owner at PocketBiz | 2024
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default LandingV4Refined