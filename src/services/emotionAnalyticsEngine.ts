/**
 * Emotion Analytics Engine
 *
 * 감정 패턴을 분석하고 인사이트를 제공하는 엔진
 */

import type {
  EmotionDataPoint,
  EmotionPatternAnalysis,
  TimeRange,
  TimeSlotAverage,
  DayOfWeekPattern,
  PatternInsight,
  PredictablePattern
} from '../types/analytics.types';
import type { EmotionalState, MoodType } from '../types/emotional.types';
import type { MomentumData } from './momentumEngine';

export class EmotionAnalyticsEngine {
  private readonly STORAGE_KEY = 'emotion-analytics-data';
  private readonly MAX_DATA_POINTS = 10000; // 최대 저장 데이터 수
  private readonly DATA_RETENTION_DAYS = 365; // 데이터 보존 기간

  /**
   * 감정 데이터 포인트 저장
   */
  async saveDataPoint(
    emotionalState: EmotionalState,
    momentum: MomentumData
  ): Promise<void> {
    const dataPoint: EmotionDataPoint = {
      timestamp: new Date(),
      mood: emotionalState.mood,
      energy: emotionalState.energy,
      confidence: emotionalState.confidence,
      motivation: emotionalState.motivation,
      stress: emotionalState.stress,
      momentumScore: momentum.score
    };

    try {
      const existingData = this.loadDataPoints();
      existingData.push(dataPoint);

      // 데이터 정리 (오래된 데이터 제거, 최대 개수 유지)
      const cleanedData = this.cleanupData(existingData);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedData));
    } catch (error) {
      console.error('Failed to save emotion data point:', error);
    }
  }

  /**
   * 감정 패턴 분석
   */
  analyzePatterns(timeRange: TimeRange = '7d'): EmotionPatternAnalysis {
    const dataPoints = this.getDataPointsForRange(timeRange);

    if (dataPoints.length === 0) {
      return this.getEmptyAnalysis(timeRange);
    }

    const hourlyPatterns = this.calculateHourlyPatterns(dataPoints);
    const weeklyPatterns = this.calculateWeeklyPatterns(dataPoints);
    const trends = this.calculateTrends(dataPoints);
    const peaks = this.findPeaks(dataPoints);
    const insights = this.generateInsights(dataPoints, hourlyPatterns, weeklyPatterns);
    const predictablePatterns = this.identifyPredictablePatterns(dataPoints);

    return {
      timeRange,
      dataPoints,
      hourlyPatterns,
      weeklyPatterns,
      trends,
      insights,
      peaks,
      predictablePatterns
    };
  }

  /**
   * 시간대별 패턴 계산
   */
  private calculateHourlyPatterns(dataPoints: EmotionDataPoint[]): TimeSlotAverage[] {
    const hourlyData: Map<number, EmotionDataPoint[]> = new Map();

    // 시간대별로 그룹화
    dataPoints.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(point);
    });

    // 각 시간대별 평균 계산
    const patterns: TimeSlotAverage[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const points = hourlyData.get(hour) || [];
      if (points.length === 0) continue;

      const avgEnergy = this.average(points.map(p => p.energy));
      const avgConfidence = this.average(points.map(p => p.confidence));
      const avgMotivation = this.average(points.map(p => p.motivation));
      const avgStress = this.average(points.map(p => p.stress));
      const avgMomentum = this.average(points.map(p => p.momentumScore));
      const dominantMood = this.findDominantMood(points.map(p => p.mood));

      patterns.push({
        hour,
        avgEnergy,
        avgConfidence,
        avgMotivation,
        avgStress,
        avgMomentum,
        dominantMood,
        dataCount: points.length
      });
    }

    return patterns.sort((a, b) => a.hour - b.hour);
  }

  /**
   * 요일별 패턴 계산
   */
  private calculateWeeklyPatterns(dataPoints: EmotionDataPoint[]): DayOfWeekPattern[] {
    const weeklyData: Map<number, EmotionDataPoint[]> = new Map();

    // 요일별로 그룹화
    dataPoints.forEach(point => {
      const dayOfWeek = new Date(point.timestamp).getDay();
      if (!weeklyData.has(dayOfWeek)) {
        weeklyData.set(dayOfWeek, []);
      }
      weeklyData.get(dayOfWeek)!.push(point);
    });

    // 각 요일별 패턴 계산
    const patterns: DayOfWeekPattern[] = [];
    for (let day = 0; day < 7; day++) {
      const points = weeklyData.get(day) || [];
      if (points.length === 0) continue;

      const avgEnergy = this.average(points.map(p => p.energy));
      const avgConfidence = this.average(points.map(p => p.confidence));
      const avgMotivation = this.average(points.map(p => p.motivation));
      const avgStress = this.average(points.map(p => p.stress));
      const avgMomentum = this.average(points.map(p => p.momentumScore));
      const dominantMood = this.findDominantMood(points.map(p => p.mood));

      // 해당 요일의 최고/최저 시간대 찾기
      const hourlyScores = this.getHourlyScoresForDay(points);
      const bestHour = this.findBestHour(hourlyScores);
      const worstHour = this.findWorstHour(hourlyScores);

      patterns.push({
        dayOfWeek: day,
        avgEnergy,
        avgConfidence,
        avgMotivation,
        avgStress,
        avgMomentum,
        dominantMood,
        bestHour,
        worstHour
      });
    }

    return patterns.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  /**
   * 트렌드 계산
   */
  private calculateTrends(dataPoints: EmotionDataPoint[]) {
    const recentPoints = dataPoints.slice(-Math.min(dataPoints.length, 10));
    const olderPoints = dataPoints.slice(0, Math.min(dataPoints.length, 10));

    return {
      energy: this.getTrend(
        this.average(olderPoints.map(p => p.energy)),
        this.average(recentPoints.map(p => p.energy))
      ),
      confidence: this.getTrend(
        this.average(olderPoints.map(p => p.confidence)),
        this.average(recentPoints.map(p => p.confidence))
      ),
      motivation: this.getTrend(
        this.average(olderPoints.map(p => p.motivation)),
        this.average(recentPoints.map(p => p.motivation))
      ),
      stress: this.getTrend(
        this.average(olderPoints.map(p => p.stress)),
        this.average(recentPoints.map(p => p.stress))
      ),
      momentum: this.getTrend(
        this.average(olderPoints.map(p => p.momentumScore)),
        this.average(recentPoints.map(p => p.momentumScore))
      )
    };
  }

  /**
   * 피크 찾기
   */
  private findPeaks(dataPoints: EmotionDataPoint[]) {
    const highestMomentum = dataPoints.reduce((max, p) =>
      p.momentumScore > max.momentumScore ? p : max
    );
    const lowestMomentum = dataPoints.reduce((min, p) =>
      p.momentumScore < min.momentumScore ? p : min
    );
    const highestEnergy = dataPoints.reduce((max, p) =>
      p.energy > max.energy ? p : max
    );
    const lowestStress = dataPoints.reduce((min, p) =>
      p.stress < min.stress ? p : min
    );

    return {
      highestMomentum: {
        value: highestMomentum.momentumScore,
        timestamp: new Date(highestMomentum.timestamp)
      },
      lowestMomentum: {
        value: lowestMomentum.momentumScore,
        timestamp: new Date(lowestMomentum.timestamp)
      },
      highestEnergy: {
        value: highestEnergy.energy,
        timestamp: new Date(highestEnergy.timestamp)
      },
      lowestStress: {
        value: lowestStress.stress,
        timestamp: new Date(lowestStress.timestamp)
      }
    };
  }

  /**
   * 인사이트 생성
   */
  private generateInsights(
    dataPoints: EmotionDataPoint[],
    hourlyPatterns: TimeSlotAverage[],
    weeklyPatterns: DayOfWeekPattern[]
  ): PatternInsight[] {
    const insights: PatternInsight[] = [];

    // 최고 생산성 시간대 인사이트
    const bestHour = hourlyPatterns.reduce((max, p) =>
      p.avgMomentum > (max?.avgMomentum || 0) ? p : max
    , hourlyPatterns[0]);

    if (bestHour) {
      insights.push({
        id: 'best-hour',
        type: 'positive',
        title: `⏰ 최고의 시간대: ${bestHour.hour}시`,
        description: `당신은 ${bestHour.hour}시에 가장 높은 모멘텀(평균 ${Math.round(bestHour.avgMomentum)}점)을 보입니다.`,
        confidence: Math.min(95, bestHour.dataCount * 5),
        actionable: true,
        recommendation: '중요한 작업은 이 시간대에 배치하세요.'
      });
    }

    // 스트레스 패턴 인사이트
    const avgStress = this.average(dataPoints.map(p => p.stress));
    if (avgStress > 70) {
      insights.push({
        id: 'high-stress',
        type: 'warning',
        title: '⚠️ 높은 스트레스 수준',
        description: `최근 평균 스트레스가 ${Math.round(avgStress)}%로 높습니다.`,
        confidence: 90,
        actionable: true,
        recommendation: '규칙적인 휴식과 명상을 권장합니다.'
      });
    }

    // 주말 vs 평일 패턴
    const weekdayPatterns = weeklyPatterns.filter(p => p.dayOfWeek >= 1 && p.dayOfWeek <= 5);
    const weekendPatterns = weeklyPatterns.filter(p => p.dayOfWeek === 0 || p.dayOfWeek === 6);

    if (weekdayPatterns.length > 0 && weekendPatterns.length > 0) {
      const weekdayAvg = this.average(weekdayPatterns.map(p => p.avgMomentum));
      const weekendAvg = this.average(weekendPatterns.map(p => p.avgMomentum));

      if (weekendAvg > weekdayAvg * 1.2) {
        insights.push({
          id: 'weekend-warrior',
          type: 'neutral',
          title: '🎯 주말 워리어',
          description: '주말에 더 높은 생산성을 보이고 있습니다.',
          confidence: 80,
          actionable: false
        });
      }
    }

    // 성장 트렌드 인사이트
    const recentAvg = this.average(dataPoints.slice(-7).map(p => p.momentumScore));
    const previousAvg = this.average(dataPoints.slice(-14, -7).map(p => p.momentumScore));

    if (recentAvg > previousAvg * 1.1) {
      insights.push({
        id: 'growth-trend',
        type: 'positive',
        title: '📈 성장 중!',
        description: `모멘텀이 ${Math.round((recentAvg - previousAvg) / previousAvg * 100)}% 상승했습니다.`,
        confidence: 85,
        actionable: false
      });
    }

    return insights;
  }

  /**
   * 예측 가능한 패턴 식별
   */
  private identifyPredictablePatterns(dataPoints: EmotionDataPoint[]): PredictablePattern[] {
    const patterns: PredictablePattern[] = [];

    // 월요병 패턴
    const mondayData = dataPoints.filter(p =>
      new Date(p.timestamp).getDay() === 1
    );
    if (mondayData.length >= 3) {
      const mondayAvg = this.average(mondayData.map(p => p.energy));
      const overallAvg = this.average(dataPoints.map(p => p.energy));

      if (mondayAvg < overallAvg * 0.8) {
        patterns.push({
          name: '월요병 패턴',
          description: '월요일에 에너지가 평균보다 20% 이상 낮습니다.',
          confidence: Math.min(90, mondayData.length * 10),
          triggerConditions: ['월요일 아침'],
          nextOccurrence: this.getNextMonday()
        });
      }
    }

    // 오후 슬럼프 패턴
    const afternoonData = dataPoints.filter(p => {
      const hour = new Date(p.timestamp).getHours();
      return hour >= 14 && hour <= 16;
    });

    if (afternoonData.length >= 10) {
      const afternoonAvg = this.average(afternoonData.map(p => p.energy));
      const morningData = dataPoints.filter(p => {
        const hour = new Date(p.timestamp).getHours();
        return hour >= 9 && hour <= 11;
      });
      const morningAvg = this.average(morningData.map(p => p.energy));

      if (afternoonAvg < morningAvg * 0.7) {
        patterns.push({
          name: '오후 슬럼프',
          description: '오후 2-4시에 에너지가 크게 떨어집니다.',
          confidence: 85,
          triggerConditions: ['오후 2시', '점심 식사 후'],
          nextOccurrence: this.getNextAfternoon()
        });
      }
    }

    return patterns;
  }

  /**
   * 유틸리티 함수들
   */
  private loadDataPoints(): EmotionDataPoint[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load emotion data:', error);
    }
    return [];
  }

  private cleanupData(dataPoints: EmotionDataPoint[]): EmotionDataPoint[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.DATA_RETENTION_DAYS);

    // 오래된 데이터 제거
    let cleaned = dataPoints.filter(p =>
      new Date(p.timestamp) > cutoffDate
    );

    // 최대 개수 제한
    if (cleaned.length > this.MAX_DATA_POINTS) {
      cleaned = cleaned.slice(-this.MAX_DATA_POINTS);
    }

    return cleaned;
  }

  private getDataPointsForRange(range: TimeRange): EmotionDataPoint[] {
    const allPoints = this.loadDataPoints();
    const now = new Date();
    const cutoff = new Date();

    switch (range) {
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoff.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return allPoints.filter(p => new Date(p.timestamp) >= cutoff);
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private findDominantMood(moods: MoodType[]): MoodType {
    const counts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<MoodType, number>);

    return Object.entries(counts).reduce((max, [mood, count]) =>
      count > (counts[max] || 0) ? mood as MoodType : max
    , moods[0]);
  }

  private getTrend(older: number, recent: number): 'rising' | 'falling' | 'stable' {
    const change = ((recent - older) / older) * 100;
    if (change > 5) return 'rising';
    if (change < -5) return 'falling';
    return 'stable';
  }

  private getHourlyScoresForDay(points: EmotionDataPoint[]): Map<number, number> {
    const hourlyScores = new Map<number, number>();

    points.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      if (!hourlyScores.has(hour)) {
        hourlyScores.set(hour, 0);
      }
      hourlyScores.set(hour, hourlyScores.get(hour)! + point.momentumScore);
    });

    return hourlyScores;
  }

  private findBestHour(hourlyScores: Map<number, number>): number {
    let bestHour = 0;
    let maxScore = 0;

    hourlyScores.forEach((score, hour) => {
      if (score > maxScore) {
        maxScore = score;
        bestHour = hour;
      }
    });

    return bestHour;
  }

  private findWorstHour(hourlyScores: Map<number, number>): number {
    let worstHour = 0;
    let minScore = Infinity;

    hourlyScores.forEach((score, hour) => {
      if (score < minScore) {
        minScore = score;
        worstHour = hour;
      }
    });

    return worstHour;
  }

  private getNextMonday(): Date {
    const date = new Date();
    const day = date.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(9, 0, 0, 0);
    return date;
  }

  private getNextAfternoon(): Date {
    const date = new Date();
    const hour = date.getHours();

    if (hour < 14) {
      date.setHours(14, 0, 0, 0);
    } else {
      date.setDate(date.getDate() + 1);
      date.setHours(14, 0, 0, 0);
    }

    return date;
  }

  private getEmptyAnalysis(timeRange: TimeRange): EmotionPatternAnalysis {
    return {
      timeRange,
      dataPoints: [],
      hourlyPatterns: [],
      weeklyPatterns: [],
      trends: {
        energy: 'stable',
        confidence: 'stable',
        motivation: 'stable',
        stress: 'stable',
        momentum: 'stable'
      },
      insights: [],
      peaks: {
        highestMomentum: { value: 0, timestamp: new Date() },
        lowestMomentum: { value: 0, timestamp: new Date() },
        highestEnergy: { value: 0, timestamp: new Date() },
        lowestStress: { value: 0, timestamp: new Date() }
      },
      predictablePatterns: []
    };
  }
}

// 싱글톤 인스턴스
export const emotionAnalyticsEngine = new EmotionAnalyticsEngine();