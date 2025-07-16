import React, { useState, useEffect, useCallback } from 'react';
import ClipboardCard from './components/ClipboardCard';
import FeishuConfigModal from './components/FeishuConfigModal';
import DataFilter, { FilterOptions } from './components/DataFilter';
import { localStorage, ClipboardItem, FeishuConfig, AppSettings } from './utils/storage';
import './App.css';

// 声明全局Electron API类型
declare global {
  interface Window {
    electronAPI?: {
      onToggleMonitoring: (callback: (isMonitoring: boolean) => void) => void;
      onClearRecords: (callback: () => void) => void;
      sendMonitoringStatus: (isMonitoring: boolean) => void;
      getClipboardText: () => string;
      setClipboardText: (text: string) => void;
    };
  }
}

function App() {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ClipboardItem[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [showFeishuConfig, setShowFeishuConfig] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(localStorage.getDefaultSettings());
  const [stats, setStats] = useState(localStorage.getStats());

  // 检查是否在Electron环境中
  useEffect(() => {
    console.log('Checking Electron environment...');
    console.log('window.electronAPI:', window.electronAPI);
    const electronDetected = !!window.electronAPI;
    setIsElectron(electronDetected);
    console.log('isElectron set to:', electronDetected);
    
    // 加载设置
    const savedSettings = localStorage.loadSettings();
    setSettings(savedSettings);
    
    // 在Electron环境中自动开始监控
    if (electronDetected) {
      console.log('自动开始监控剪切板...');
      setIsMonitoring(true);
    }
  }, []);

  // 加载本地数据
  useEffect(() => {
    const items = localStorage.loadClipboardItems();
    setClipboardItems(items);
    setFilteredItems(items);
    setStats(localStorage.getStats());
  }, []);

  // 读取剪切板内容
  const readClipboard = useCallback(async () => {
    try {
      console.log('开始读取剪切板...');
      let text = '';
      
      if (isElectron && window.electronAPI) {
        // 使用Electron API读取剪切板（异步）
        console.log('使用Electron API读取剪切板');
        console.log('window.electronAPI.getClipboardText:', typeof window.electronAPI.getClipboardText);
        text = await window.electronAPI.getClipboardText();
        console.log('Electron剪切板内容:', text);
      } else {
        // 使用浏览器API读取剪切板
        console.log('使用浏览器API读取剪切板');
        text = await navigator.clipboard.readText();
        console.log('浏览器剪切板内容:', text);
      }
      
      if (text && text.trim()) {
        console.log('检测到剪切板内容:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        
        // 保存到本地存储
        const newItem = localStorage.addClipboardItem(text.trim());
        
        // 只有当有新内容时才更新状态
        if (newItem) {
          console.log('添加新的剪切板记录');
          setClipboardItems(prev => {
            const updated = [newItem, ...prev];
            setFilteredItems(updated);
            return updated;
          });
          
          setStats(localStorage.getStats());
          
          // TODO: 如果启用了飞书同步，这里可以调用同步API
          if (settings.feishuConfig.enabled) {
            console.log('飞书同步已启用，准备同步数据...');
            // await syncToFeishu(newItem);
          }
        } else {
          console.log('内容未变化或已存在，跳过更新');
        }
      } else {
        console.log('剪切板内容为空或无效');
      }
    } catch (error) {
      console.error('读取剪切板失败:', error);
    }
  }, [isElectron, settings.feishuConfig.enabled]);

  // 手动测试剪切板读取
  const testClipboard = useCallback(() => {
    console.log('=== 手动测试剪切板读取 ===');
    console.log('isElectron:', isElectron);
    console.log('window.electronAPI:', window.electronAPI);
    if (window.electronAPI) {
      console.log('getClipboardText function:', typeof window.electronAPI.getClipboardText);
    }
    readClipboard();
  }, [isElectron, readClipboard]);

  // 开始监控剪切板
  const startMonitoring = useCallback(() => {
    console.log('开始监控剪切板...');
    setIsMonitoring(true);
    // 立即读取一次
    readClipboard();
    
    // 设置定时器，每秒检查一次
    const interval = setInterval(() => {
      console.log('定时检查剪切板...');
      readClipboard();
    }, 1000);
    
    // 监听剪切板变化事件（如果浏览器支持）
    const handleClipboardChange = () => {
      console.log('检测到剪切板变化事件');
      readClipboard();
    };
    
    document.addEventListener('copy', handleClipboardChange);
    document.addEventListener('paste', handleClipboardChange);
    
    return () => {
      console.log('停止监控剪切板');
      clearInterval(interval);
      document.removeEventListener('copy', handleClipboardChange);
      document.removeEventListener('paste', handleClipboardChange);
    };
  }, [readClipboard]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    console.log('停止监控剪切板');
    setIsMonitoring(false);
  }, []);

  // 清空所有记录
  const clearAll = useCallback(() => {
    console.log('清空所有记录');
    localStorage.clearAllItems();
    setClipboardItems([]);
    setFilteredItems([]);
    setStats(localStorage.getStats());
  }, []);

  // 删除单个记录
  const deleteItem = useCallback((id: string) => {
    console.log('删除记录:', id);
    localStorage.deleteClipboardItem(id);
    setClipboardItems(prev => prev.filter(item => item.id !== id));
    setFilteredItems(prev => prev.filter(item => item.id !== id));
    setStats(localStorage.getStats());
  }, []);

  // 处理数据筛选
  const handleFilterChange = useCallback((filters: FilterOptions) => {
    const filtered = localStorage.filterItems(filters);
    setFilteredItems(filtered);
  }, []);

  // 处理飞书配置保存
  const handleFeishuConfigSave = useCallback((config: FeishuConfig) => {
    const updatedSettings = { ...settings, feishuConfig: config };
    setSettings(updatedSettings);
    localStorage.saveSettings(updatedSettings);
    console.log('飞书配置已保存:', config);
  }, [settings]);

  // 监听Electron主进程消息
  useEffect(() => {
    if (isElectron && window.electronAPI) {
      console.log('设置Electron消息监听器');
      // 监听监控状态切换
      window.electronAPI.onToggleMonitoring((isMonitoring) => {
        console.log('收到监控状态切换消息:', isMonitoring);
        setIsMonitoring(isMonitoring);
      });
      
      // 监听清空记录命令
      window.electronAPI.onClearRecords(() => {
        console.log('收到清空记录命令');
        clearAll();
      });
    }
  }, [isElectron, clearAll]);

  // 监控状态变化时通知主进程
  useEffect(() => {
    if (isElectron && window.electronAPI) {
      console.log('通知主进程监控状态:', isMonitoring);
      window.electronAPI.sendMonitoringStatus(isMonitoring);
    }
  }, [isMonitoring, isElectron]);

  useEffect(() => {
    if (isMonitoring) {
      console.log('监控状态为true，启动监控');
      const cleanup = startMonitoring();
      return cleanup;
    } else {
      console.log('监控状态为false，停止监控');
    }
  }, [isMonitoring, startMonitoring]);

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
            className="control-btn clear"
            onClick={clearAll}
            disabled={clipboardItems.length === 0}
          >
            🗑️ 清空记录
          </button>
          <button 
            className="control-btn test"
            onClick={testClipboard}
          >
            📋 手动测试剪切板
          </button>
          <button 
            className="control-btn feishu"
            onClick={() => setShowFeishuConfig(true)}
          >
            🪶 飞书同步配置
          </button>
        </div>
        {isElectron && (
          <div className="electron-info">
            <p>💡 快捷键: Ctrl+Shift+V 显示/隐藏窗口 | Ctrl+Shift+C 切换监控</p>
            <p>💡 右键系统托盘图标可快速操作</p>
            <p>🔧 调试信息: 监控状态 = {isMonitoring ? '开启' : '关闭'}</p>
            <p>🪶 飞书同步: {settings.feishuConfig.enabled ? '已启用' : '未配置'}</p>
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
          <>
            <DataFilter onFilterChange={handleFilterChange} stats={stats} />
            <div className="clipboard-grid">
              {filteredItems.map((item) => (
                <ClipboardCard
                  key={item.id}
                  item={item}
                  onDelete={deleteItem}
                  isElectron={isElectron}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {isMonitoring && (
        <div className="monitoring-indicator">
          <div className="pulse"></div>
          <span>正在监控剪切板...</span>
        </div>
      )}

      <FeishuConfigModal
        isOpen={showFeishuConfig}
        onClose={() => setShowFeishuConfig(false)}
        onSave={handleFeishuConfigSave}
        currentConfig={settings.feishuConfig}
      />
    </div>
  );
}

export default App; 