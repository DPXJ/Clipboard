import React, { useState, useEffect } from 'react';
import ClipboardCard from './components/ClipboardCard';
import './App.css';

// 声明全局Electron API类型
declare global {
  interface Window {
    electronAPI?: {
      getClipboardText: () => Promise<string>;
      setClipboardText: (text: string) => Promise<void>;
      onToggleMonitoring: (callback: (isMonitoring: boolean) => void) => void;
      onClearRecords: (callback: () => void) => void;
      sendMonitoringStatus: (isMonitoring: boolean) => void;
      onClipboardChanged: (callback: (content: string) => void) => void;
      getMonitoringStatus: () => Promise<boolean>;
      setMonitoringStatus: (status: boolean) => Promise<boolean>;
    };
  }
}

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
  deviceId: string;
  tags?: string[];
  syncStatus: 'local' | 'synced' | 'failed';
}

function App() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);

  // 检查是否在Electron环境中
  useEffect(() => {
    const electronDetected = !!window.electronAPI;
    setIsElectron(electronDetected);
    console.log('Electron环境检测:', electronDetected);

    if (electronDetected && window.electronAPI) {
      // 监听剪切板变化
      window.electronAPI.onClipboardChanged((content) => {
        console.log('前端收到剪切板内容变化:', content);
        if (content && content.trim()) {
          const newItem: ClipboardItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: content.trim(),
            timestamp: new Date(),
            deviceId: 'desktop-main',
            syncStatus: 'local'
          };
          setClipboardItems(prev => {
            // 检查是否已经存在相同内容的记录
            const exists = prev.some(item => item.content === content.trim());
            if (exists) {
              console.log('内容已存在，跳过添加');
              return prev;
            }
            console.log('添加新的剪切板记录');
            return [newItem, ...prev.slice(0, 9)];
          });
        }
      });

      // 监听监控状态变化
      window.electronAPI.onToggleMonitoring((monitoring) => {
        console.log('监控状态变化:', monitoring);
        setIsMonitoring(monitoring);
      });

      // 监听清空记录
      window.electronAPI.onClearRecords(() => {
        console.log('清空记录');
        setClipboardItems([]);
      });

      // 获取初始监控状态
      window.electronAPI.getMonitoringStatus().then(status => {
        console.log('初始监控状态:', status);
        setIsMonitoring(status);
      });
    }
  }, []);

  // 读取剪切板内容
  const readClipboard = async () => {
    try {
      let text = '';
      
      if (isElectron && window.electronAPI) {
        text = await window.electronAPI.getClipboardText();
      } else {
        text = await navigator.clipboard.readText();
      }
      
      if (text && text.trim()) {
        const newItem: ClipboardItem = {
          id: Date.now().toString(),
          content: text.trim(),
          timestamp: new Date(),
          deviceId: 'desktop-main',
          syncStatus: 'local'
        };
        setClipboardItems(prev => [newItem, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('读取剪切板失败:', error);
    }
  };

  // 开始监控
  const startMonitoring = async () => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.setMonitoringStatus(true);
    } else {
      setIsMonitoring(true);
    }
    console.log('开始监控剪切板');
  };

  // 停止监控
  const stopMonitoring = async () => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.setMonitoringStatus(false);
    } else {
      setIsMonitoring(false);
    }
    console.log('停止监控剪切板');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 剪切板监控器 {isElectron && <span className="electron-badge">桌面版</span>}</h1>
        <div className="controls">
          <button 
            className={`control-btn ${isMonitoring ? 'stop' : 'start'}`}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? '⏹️ 停止监控' : '▶️ 开始监控'}
          </button>
          <button 
            className="control-btn test"
            onClick={readClipboard}
          >
            📋 手动测试剪切板
          </button>
          <button 
            className="control-btn clear"
            onClick={() => setClipboardItems([])}
            disabled={clipboardItems.length === 0}
          >
            🗑️ 清空记录
          </button>
        </div>
        {isElectron && (
          <div className="electron-info">
            <p>🔧 监控状态: {isMonitoring ? '开启' : '关闭'}</p>
            <p>💾 记录数量: {clipboardItems.length}</p>
          </div>
        )}
      </header>

      <main className="app-main">
        {clipboardItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>暂无剪切板记录</h3>
            <p>点击"开始监控"按钮开始记录剪切板内容</p>
            {isElectron && (
              <p className="debug-info">
                调试信息: Electron环境已检测到，监控状态: {isMonitoring ? '开启' : '关闭'}
              </p>
            )}
          </div>
        ) : (
          <div className="clipboard-grid">
            {clipboardItems.map((item) => (
              <ClipboardCard
                key={item.id}
                item={item}
                onDelete={(id) => {
                  setClipboardItems(prev => prev.filter(item => item.id !== id));
                }}
                isElectron={isElectron}
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