import React, { useState, useEffect } from 'react';
import { localStorage } from '../utils/storage';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  isVisible: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isVisible }) => {
  const [storageInfo, setStorageInfo] = useState({
    totalItems: 0,
    totalSize: 0,
    maxItems: 1000
  });
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    if (!isVisible) return;

    const updateInfo = () => {
      // 获取存储信息
      const info = localStorage.getStorageInfo();
      setStorageInfo(info);

      // 获取内存信息（如果可用）
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const percentage = (used / total) * 100;
        
        setMemoryInfo({
          used: Math.round(used / 1024 / 1024), // MB
          total: Math.round(total / 1024 / 1024), // MB
          percentage: Math.round(percentage)
        });
      }
    };

    updateInfo();
    const interval = setInterval(updateInfo, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <span>📊 性能监控</span>
      </div>
      <div className="monitor-content">
        <div className="monitor-item">
          <span className="label">存储使用:</span>
          <span className="value">
            {storageInfo.totalItems} / {storageInfo.maxItems} 条记录
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(storageInfo.totalItems / storageInfo.maxItems) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="monitor-item">
          <span className="label">存储大小:</span>
          <span className="value">
            {(storageInfo.totalSize / 1024).toFixed(1)} KB
          </span>
        </div>

        {memoryInfo.total > 0 && (
          <>
            <div className="monitor-item">
              <span className="label">内存使用:</span>
              <span className="value">
                {memoryInfo.used} / {memoryInfo.total} MB
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill memory" 
                  style={{ width: `${memoryInfo.percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="monitor-item">
              <span className="label">内存占用:</span>
              <span className="value">
                {memoryInfo.percentage}%
              </span>
            </div>
          </>
        )}

        <div className="monitor-actions">
          <button 
            className="cleanup-btn"
            onClick={() => {
              localStorage.cleanupOldData(7); // 清理7天前的数据
              window.location.reload(); // 刷新页面更新显示
            }}
            title="清理7天前的数据"
          >
            🧹 清理旧数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 