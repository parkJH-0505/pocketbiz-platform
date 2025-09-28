/**
 * @fileoverview VDR (Virtual Data Room) 타입 정의
 * @description 문서 관리 시스템 타입
 * @author PocketCompany
 * @since 2025-01-20
 */

export interface VDRDocument {
  id: string;
  name: string;
  type?: string;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  description?: string;
  category?: string;
  uploadedAt?: string | Date;
  uploadedBy?: {
    name?: string;
    avatar?: string;
    role?: string;
  };
  status?: 'approved' | 'rejected' | 'pending' | 'draft';
  importance?: 'critical' | 'high' | 'medium' | 'low' | 'optional';
  tags?: string[];
}