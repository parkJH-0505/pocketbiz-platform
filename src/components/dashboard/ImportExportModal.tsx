/**
 * Import/Export Modal Component
 * 레이아웃 가져오기/내보내기 모달
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Upload,
  FileJson,
  Copy,
  Check,
  AlertCircle,
  X,
  FileDown,
  FileUp,
  Archive,
  RefreshCw
} from 'lucide-react';
import { useDashboardLayoutStore } from '../../stores/dashboardLayoutStore';
import { LayoutStorage } from '../../utils/layoutStorage';
import { LayoutVersionManager } from '../../utils/layoutVersionManager';
import type { DashboardLayout } from './grid/GridLayoutConfig';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup'>('export');
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'json' | 'formatted'>('formatted');
  const [importData, setImportData] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    layouts,
    currentLayout,
    exportLayout,
    exportAllLayouts,
    importLayout,
    importLayouts
  } = useDashboardLayoutStore();

  // 내보내기 처리
  const handleExport = useCallback(() => {
    try {
      setError(null);
      let exportData = '';

      if (selectedLayouts.length === 0 && currentLayout) {
        // 현재 레이아웃만 내보내기
        exportData = exportLayout();
      } else if (selectedLayouts.length === 1) {
        // 선택한 레이아웃 내보내기
        exportData = exportLayout(selectedLayouts[0]);
      } else {
        // 여러 레이아웃 내보내기
        const layoutsToExport = layouts.filter(l => selectedLayouts.includes(l.id));
        exportData = JSON.stringify(layoutsToExport, null, exportFormat === 'formatted' ? 2 : 0);
      }

      // 다운로드 파일 생성
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-layouts-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`${selectedLayouts.length || 1}개 레이아웃이 내보내기되었습니다`);
    } catch (err) {
      setError('내보내기 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
    }
  }, [selectedLayouts, currentLayout, exportLayout, layouts, exportFormat]);

  // 클립보드로 복사
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const exportData = selectedLayouts.length === 0 && currentLayout
        ? exportLayout()
        : exportLayout(selectedLayouts[0]);

      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('복사 실패');
    }
  }, [selectedLayouts, currentLayout, exportLayout]);

  // 가져오기 처리
  const handleImport = useCallback(async () => {
    if (!importData.trim()) {
      setError('가져올 데이터를 입력해주세요');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 단일 레이아웃인지 여러 레이아웃인지 확인
      const parsed = JSON.parse(importData);

      if (Array.isArray(parsed)) {
        // 여러 레이아웃 가져오기
        await importLayouts(importData);
        setSuccess(`${parsed.length}개 레이아웃을 가져왔습니다`);
      } else {
        // 단일 레이아웃 가져오기
        await importLayout(importData);
        setSuccess('레이아웃을 성공적으로 가져왔습니다');
      }

      setImportData('');
    } catch (err) {
      setError('가져오기 실패: 올바른 JSON 형식이 아닙니다');
    } finally {
      setIsProcessing(false);
    }
  }, [importData, importLayout, importLayouts]);

  // 파일 선택 처리
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  }, []);

  // 백업 생성
  const handleCreateBackup = useCallback(() => {
    try {
      const blob = LayoutStorage.createBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('백업이 생성되었습니다');
    } catch (err) {
      setError('백업 생성 실패');
    }
  }, []);

  // 백업 복원
  const handleRestoreBackup = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const success = await LayoutStorage.restoreBackup(file);

    if (success) {
      setSuccess('백업이 복원되었습니다. 페이지를 새로고침합니다...');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setError('백업 복원 실패');
    }

    setIsProcessing(false);
  }, []);

  // 레이아웃 선택 토글
  const toggleLayoutSelection = useCallback((layoutId: string) => {
    setSelectedLayouts(prev => {
      if (prev.includes(layoutId)) {
        return prev.filter(id => id !== layoutId);
      }
      return [...prev, layoutId];
    });
  }, []);

  // 전체 선택/해제
  const toggleSelectAll = useCallback(() => {
    if (selectedLayouts.length === layouts.length) {
      setSelectedLayouts([]);
    } else {
      setSelectedLayouts(layouts.map(l => l.id));
    }
  }, [selectedLayouts, layouts]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-dark">
                레이아웃 가져오기/내보내기
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-gray" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-neutral-200">
              {[
                { key: 'export', label: '내보내기', icon: FileDown },
                { key: 'import', label: '가져오기', icon: FileUp },
                { key: 'backup', label: '백업', icon: Archive }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2
                      ${activeTab === tab.key
                        ? 'bg-primary-main text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {/* Export Tab */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-dark mb-2">
                      내보낼 레이아웃 선택
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={toggleSelectAll}
                        className="text-sm text-primary-main hover:text-primary-dark"
                      >
                        {selectedLayouts.length === layouts.length ? '전체 해제' : '전체 선택'}
                      </button>
                      <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg">
                        {layouts.length === 0 ? (
                          <p className="p-4 text-center text-neutral-gray">
                            저장된 레이아웃이 없습니다
                          </p>
                        ) : (
                          layouts.map(layout => (
                            <label
                              key={layout.id}
                              className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedLayouts.includes(layout.id)}
                                onChange={() => toggleLayoutSelection(layout.id)}
                                className="w-4 h-4 text-primary-main rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm text-neutral-dark">
                                  {layout.name}
                                </p>
                                {layout.description && (
                                  <p className="text-xs text-neutral-gray">
                                    {layout.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-neutral-gray">
                                {new Date(layout.updatedAt).toLocaleDateString('ko-KR')}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-dark mb-2">
                      내보내기 형식
                    </h3>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={exportFormat === 'formatted'}
                          onChange={() => setExportFormat('formatted')}
                          className="text-primary-main"
                        />
                        <span className="text-sm">포맷된 JSON (읽기 쉬움)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={exportFormat === 'json'}
                          onChange={() => setExportFormat('json')}
                          className="text-primary-main"
                        />
                        <span className="text-sm">압축된 JSON (용량 절약)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExport}
                      className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      파일로 내보내기
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      disabled={selectedLayouts.length > 1}
                      className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          클립보드 복사
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Tab */}
              {activeTab === 'import' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-dark mb-2">
                      JSON 데이터 입력
                    </h3>
                    <textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="JSON 데이터를 붙여넣거나 파일을 선택하세요..."
                      className="w-full h-48 p-3 border border-neutral-200 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-main"
                    />
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-main transition-colors flex items-center justify-center gap-2 text-neutral-600"
                    >
                      <FileJson className="w-5 h-5" />
                      JSON 파일 선택
                    </button>
                  </div>

                  <button
                    onClick={handleImport}
                    disabled={!importData.trim() || isProcessing}
                    className="w-full px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        가져오는 중...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        레이아웃 가져오기
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Backup Tab */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900 mb-1">
                          백업 정보
                        </h4>
                        <p className="text-xs text-blue-700">
                          백업에는 모든 레이아웃, 프로필 설정, 버전 히스토리가 포함됩니다.
                          복원 시 현재 데이터가 덮어써집니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-dark mb-2">
                      백업 생성
                    </h3>
                    <button
                      onClick={handleCreateBackup}
                      className="w-full px-4 py-3 bg-accent-green text-white rounded-lg hover:bg-accent-green/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Archive className="w-5 h-5" />
                      전체 백업 생성
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-dark mb-2">
                      백업 복원
                    </h3>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="hidden"
                      id="backup-restore"
                    />
                    <label
                      htmlFor="backup-restore"
                      className="w-full px-4 py-3 border-2 border-dashed border-accent-orange/50 bg-accent-orange/5 rounded-lg hover:border-accent-orange transition-colors flex items-center justify-center gap-2 text-accent-orange cursor-pointer"
                    >
                      <RefreshCw className="w-5 h-5" />
                      백업 파일 선택하여 복원
                    </label>
                  </div>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="mt-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0" />
                  <p className="text-sm text-accent-red">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 p-3 bg-accent-green/10 border border-accent-green/20 rounded-lg flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent-green flex-shrink-0" />
                  <p className="text-sm text-accent-green">{success}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};