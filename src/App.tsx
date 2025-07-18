import React, { useState, useEffect } from 'react';
import ClipboardCard from './components/ClipboardCard';
import DataFilter from './components/DataFilter';
import { localStorage } from './utils/storage';
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
  const [filteredItems, setFilteredItems] = useState<ClipboardItem[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  // 检查是否在Electron环境中并加载数据
  useEffect(() => {
    const electronDetected = !!window.electronAPI;
    setIsElectron(electronDetected);
    console.log('Electron环境检测:', electronDetected);

    // 加载本地存储的数据
    const savedItems = localStorage.loadClipboardItems();
    setClipboardItems(savedItems);
    setFilteredItems(savedItems);

    if (electronDetected && window.electronAPI) {
      // 监听剪切板变化
      window.electronAPI.onClipboardChanged((content) => {
        console.log('前端收到剪切板内容变化:', content);
        if (content && content.trim()) {
          const newItem = localStorage.addClipboardItem(content.trim());
          if (newItem) {
            setClipboardItems(prev => {
              const updated = [newItem, ...prev];
              setFilteredItems(updated);
              return updated;
            });
          }
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
        localStorage.clearAllItems();
        setClipboardItems([]);
        setFilteredItems([]);
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
        const newItem = localStorage.addClipboardItem(text.trim());
        if (newItem) {
          setClipboardItems(prev => {
            const updated = [newItem, ...prev];
            setFilteredItems(updated);
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('读取剪切板失败:', error);
    }
  };

  // 导出为TXT文件
  const exportToTxt = () => {
    const itemsToExport = filteredItems.length > 0 ? filteredItems : clipboardItems;
    const content = itemsToExport.map((item, index) => {
      const time = item.timestamp.toLocaleString('zh-CN');
      return `${index + 1}. [${time}] ${item.content}\n`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `剪切板记录_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 应用筛选
  const applyFilter = (options: {
    month?: string;
    keyword?: string;
    deviceId?: string;
    tags?: string[];
  }) => {
    const filtered = localStorage.filterItems(options);
    setFilteredItems(filtered);
  };

  // 重置筛选
  const resetFilter = () => {
    setFilteredItems(clipboardItems);
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
            onClick={() => {
              localStorage.clearAllItems();
              setClipboardItems([]);
              setFilteredItems([]);
            }}
            disabled={clipboardItems.length === 0}
          >
            🗑️ 清空记录
          </button>
          <button 
            className="control-btn filter"
            onClick={() => setShowFilter(!showFilter)}
          >
            🔍 筛选数据
          </button>
          <button 
            className="control-btn export"
            onClick={exportToTxt}
            disabled={clipboardItems.length === 0}
          >
            📄 导出TXT
          </button>
        </div>
        {isElectron && (
          <div className="electron-info">
            <p>🔧 监控状态: {isMonitoring ? '开启' : '关闭'}</p>
            <p>💾 记录数量: {clipboardItems.length}</p>
          </div>
        )}
      </header>

      {showFilter && (
        <DataFilter
          onFilterChange={applyFilter}
          stats={localStorage.getStats()}
          filteredItems={filteredItems}
        />
      )}

      <main className="app-main">
        {(filteredItems.length > 0 ? filteredItems : clipboardItems).length === 0 ? (
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
            {(filteredItems.length > 0 ? filteredItems : clipboardItems).map((item) => (
              <ClipboardCard
                key={item.id}
                item={item}
                onDelete={(id) => {
                  localStorage.deleteClipboardItem(id);
                  setClipboardItems(prev => prev.filter(item => item.id !== id));
                  setFilteredItems(prev => prev.filter(item => item.id !== id));
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