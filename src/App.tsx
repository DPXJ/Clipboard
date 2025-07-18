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
  const [isMonitoring, setIsMonitoring] = useState(true); // 默认开启监控
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ClipboardItem[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false); // 默认亮色主题

  // 切换主题
  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  // 检查是否在Electron环境中并加载数据
  useEffect(() => {
    const electronDetected = !!window.electronAPI;
    setIsElectron(electronDetected);
    console.log('Electron环境检测:', electronDetected);

    // 加载本地存储的数据
    const savedItems = localStorage.loadClipboardItems();
    console.log('加载的历史数据:', savedItems.length, '条');
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

      // 获取当前监控状态
      window.electronAPI.getMonitoringStatus().then(status => {
        console.log('获取到的监控状态:', status);
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
    
    // 生成文件头部信息
    const now = new Date();
    const header = `剪切板数据导出
导出时间: ${now.toLocaleString('zh-CN')}
共导出 ${itemsToExport.length} 条记录

${'='.repeat(80)}

`;

    // 格式化每条记录
    const content = itemsToExport.map((item, index) => {
      const time = item.timestamp.toLocaleString('zh-CN');
      const deviceInfo = item.deviceId.split('-')[0];
      const contentType = item.content.includes('\n') ? '多行文本' : '单行文本';
      
      // 每条记录的格式
      const recordContent = `${index + 1}. 记录详情
时间: ${time}
设备: ${deviceInfo}
类型: ${contentType}
字符数: ${item.content.length}
${item.syncStatus === 'synced' ? '状态: 已同步' : '状态: 本地'}

内容:
${item.content}`;

      // 添加分割线（最后一条记录不加分割线）
      const separator = index < itemsToExport.length - 1 ? `\n\n${'-'.repeat(80)}\n\n` : '';
      
      return recordContent + separator;
    }).join('');
    
    const fullContent = header + content;
    
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
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
    <div className={`app ${darkTheme ? 'dark-theme' : 'light-theme'}`}>
      <header className="app-header">
        <h1>📋 剪切板监控器 {isElectron && <span className="electron-badge">桌面版</span>}</h1>
        <div className="controls">
          <button 
            className={`control-btn ${isMonitoring ? 'monitoring' : 'stopped'}`}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? '🟢 已开始监控' : '🔴 已停止监控'}
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
          <button 
            className="control-btn theme"
            onClick={toggleTheme}
          >
            {darkTheme ? '☀️ 亮色主题' : '🌙 暗色主题'}
          </button>
        </div>
        {isElectron && (
          <div className="electron-info">
            <p>🔧 监控状态: {isMonitoring ? '已开启监控' : '已关闭监控'}</p>
            <p>💾 记录数量: {clipboardItems.length}</p>
          </div>
        )}
      </header>

      {showFilter && (
        <DataFilter
          onFilterChange={applyFilter}
          stats={localStorage.getStats()}
          filteredItems={filteredItems}
          darkTheme={darkTheme}
        />
      )}

      <main className="app-main">
        {(filteredItems.length > 0 ? filteredItems : clipboardItems).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>暂无剪切板记录</h3>
            <p>监控已开启，复制任何内容都会自动记录</p>
            {isElectron && (
              <p className="debug-info">
                调试信息: Electron环境已检测到，监控状态: {isMonitoring ? '已开启' : '已关闭'}
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
                darkTheme={darkTheme}
              />
            ))}
          </div>
        )}
      </main>


    </div>
  );
}

export default App; 