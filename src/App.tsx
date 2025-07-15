import React, { useState, useEffect, useCallback } from 'react';
import ClipboardCard from './components/ClipboardCard';
import './App.css';

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
}

function App() {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // 读取剪切板内容
  const readClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const newItem: ClipboardItem = {
          id: Date.now().toString(),
          content: text.trim(),
          timestamp: new Date()
        };
        
        setClipboardItems(prev => {
          // 检查是否已存在相同内容
          const exists = prev.some(item => item.content === newItem.content);
          if (exists) return prev;
          
          // 倒序排列，最新的在前面
          return [newItem, ...prev].slice(0, 50); // 最多保存50条记录
        });
      }
    } catch (error) {
      console.error('读取剪切板失败:', error);
    }
  }, []);

  // 开始监控剪切板
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    // 立即读取一次
    readClipboard();
    
    // 设置定时器，每秒检查一次
    const interval = setInterval(readClipboard, 1000);
    
    // 监听剪切板变化事件（如果浏览器支持）
    const handleClipboardChange = () => {
      readClipboard();
    };
    
    document.addEventListener('copy', handleClipboardChange);
    document.addEventListener('paste', handleClipboardChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('copy', handleClipboardChange);
      document.removeEventListener('paste', handleClipboardChange);
    };
  }, [readClipboard]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // 清空所有记录
  const clearAll = useCallback(() => {
    setClipboardItems([]);
  }, []);

  // 删除单个记录
  const deleteItem = useCallback((id: string) => {
    setClipboardItems(prev => prev.filter(item => item.id !== id));
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [isMonitoring, startMonitoring]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 剪切板监控器</h1>
        <div className="controls">
          <button 
            className={`control-btn ${isMonitoring ? 'stop' : 'start'}`}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? '⏹️ 停止监控' : '▶️ 开始监控'}
          </button>
          <button 
            className="control-btn clear"
            onClick={clearAll}
            disabled={clipboardItems.length === 0}
          >
            🗑️ 清空记录
          </button>
        </div>
      </header>

      <main className="app-main">
        {clipboardItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>暂无剪切板记录</h3>
            <p>点击"开始监控"按钮开始记录剪切板内容</p>
          </div>
        ) : (
          <div className="clipboard-grid">
            {clipboardItems.map((item) => (
              <ClipboardCard
                key={item.id}
                item={item}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </main>

      {isMonitoring && (
        <div className="monitoring-indicator">
          <div className="pulse"></div>
          <span>正在监控剪切板...</span>
        </div>
      )}
    </div>
  );
}

export default App; 