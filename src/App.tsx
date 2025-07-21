import React, { useState, useEffect, useCallback } from 'react';
import ClipboardCard from './components/ClipboardCard';
import DataFilter from './components/DataFilter';
import FlomoConfigModal from './components/FlomoConfigModal';
import FeishuConfigModal from './components/FeishuConfigModal';
import { localStorage } from './utils/storage';
import { autoSyncToFeishu, isFeishuAutoSyncEnabled } from './utils/autoSync';
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
  const [showFilter, setShowFilter] = useState(true); // 默认显示筛选
  const [darkTheme, setDarkTheme] = useState(false); // 默认亮色主题
  const [showVipDropdown, setShowVipDropdown] = useState(false);
  const [showFlomoConfig, setShowFlomoConfig] = useState(false);
  const [showFeishuConfig, setShowFeishuConfig] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

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
      window.electronAPI.onClipboardChanged(async (content) => {
        console.log('前端收到剪切板内容变化:', content);
        if (content && content.trim()) {
          const newItem = localStorage.addClipboardItem(content.trim());
          if (newItem) {
            setClipboardItems(prev => {
              const updated = [newItem, ...prev];
              setFilteredItems(updated);
              return updated;
            });

            // 自动同步到飞书
            if (isFeishuAutoSyncEnabled()) {
              console.log('飞书自动同步已启用，开始同步新项目');
              const syncResult = await autoSyncToFeishu(newItem);
              if (syncResult) {
                console.log('飞书自动同步成功');
                // 更新项目的同步状态
                setClipboardItems(prev => 
                  prev.map(item => 
                    item.id === newItem.id 
                      ? { ...item, syncStatus: 'synced' as const }
                      : item
                  )
                );
              } else {
                console.log('飞书自动同步失败');
                // 更新项目的同步状态
                setClipboardItems(prev => 
                  prev.map(item => 
                    item.id === newItem.id 
                      ? { ...item, syncStatus: 'failed' as const }
                      : item
                  )
                );
              }
            } else {
              console.log('飞书自动同步未启用');
            }
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

          // 自动同步到飞书
          if (isFeishuAutoSyncEnabled()) {
            console.log('飞书自动同步已启用，开始同步新项目');
            const syncResult = await autoSyncToFeishu(newItem);
            if (syncResult) {
              console.log('飞书自动同步成功');
              // 更新项目的同步状态
              setClipboardItems(prev => 
                prev.map(item => 
                  item.id === newItem.id 
                    ? { ...item, syncStatus: 'synced' as const }
                    : item
                )
              );
            } else {
              console.log('飞书自动同步失败');
              // 更新项目的同步状态
              setClipboardItems(prev => 
                prev.map(item => 
                  item.id === newItem.id 
                    ? { ...item, syncStatus: 'failed' as const }
                    : item
                )
              );
            }
          } else {
            console.log('飞书自动同步未启用');
          }
        }
      }
    } catch (error) {
      console.error('读取剪切板失败:', error);
    }
  };

  // 导出为TXT文件
  const exportToTxt = () => {
    // 根据搜索模式决定导出的数据
    const itemsToExport = isSearchMode ? filteredItems : (filteredItems.length > 0 ? filteredItems : clipboardItems);
    
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

  // 全局搜索功能
  const performGlobalSearch = useCallback((keyword: string) => {
    console.log('执行搜索，关键词:', keyword);
    console.log('总数据量:', clipboardItems.length);
    
    if (!keyword.trim()) {
      console.log('关键词为空，清除筛选结果');
      setFilteredItems([]);
      setIsSearchMode(false);
      return;
    }

    setIsSearchMode(true);
    const searchLower = keyword.toLowerCase();
    const searchResults = clipboardItems.filter(item =>
      item.content.toLowerCase().includes(searchLower)
    );

    console.log('搜索结果数量:', searchResults.length);
    setFilteredItems(searchResults);
  }, [clipboardItems]);

  // 应用筛选 - 增强版
  const applyFilter = (options: {
    month?: string;
    timeRange?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
    deviceId?: string;
    tags?: string[];
  }) => {
    // 如果当前在搜索模式，不执行筛选
    if (isSearchMode) {
      console.log('搜索模式激活，跳过筛选操作');
      return;
    }
    
    let filtered = [...clipboardItems];

    // 时间范围筛选
    if (options.timeRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (options.timeRange) {
        case 'today':
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= monthAgo;
          });
          break;
        case 'custom':
          if (options.startDate && options.endDate) {
            const startDate = new Date(options.startDate);
            const endDate = new Date(options.endDate + 'T23:59:59');
            filtered = filtered.filter(item => {
              const itemDate = new Date(item.timestamp);
              return itemDate >= startDate && itemDate <= endDate;
            });
          }
          break;
      }
    }

    // 月份筛选（兼容旧版本）
    if (options.month) {
      filtered = filtered.filter(item => {
        const itemMonth = new Date(item.timestamp).toISOString().slice(0, 7);
        return itemMonth === options.month;
      });
    }

    // 关键词搜索
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase();
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(keyword)
      );
    }

    // 设备筛选
    if (options.deviceId) {
      filtered = filtered.filter(item => item.deviceId === options.deviceId);
    }

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
            className="control-btn filter"
            onClick={() => setShowFilter(!showFilter)}
            title={showFilter ? '隐藏筛选面板' : '显示筛选面板'}
          >
            🔍 {showFilter ? '隐藏筛选' : '展开筛选'}
          </button>
          <button 
            className="control-btn clear"
            onClick={() => {
              localStorage.clearAllItems();
              setClipboardItems([]);
              setFilteredItems([]);
              setIsSearchMode(false);
            }}
            disabled={clipboardItems.length === 0}
          >
            🗑️ 清空记录
          </button>

          <button 
            className="control-btn export"
            onClick={exportToTxt}
            disabled={(() => {
              const itemsToExport = isSearchMode ? filteredItems : (filteredItems.length > 0 ? filteredItems : clipboardItems);
              return itemsToExport.length === 0;
            })()}
          >
            📄 导出TXT
          </button>
          <div className="vip-dropdown-container">
            <button 
              className="control-btn vip"
              onClick={() => setShowVipDropdown(!showVipDropdown)}
              onMouseEnter={() => setShowVipDropdown(true)}
            >
              👑 VIP
            </button>
            {showVipDropdown && (
              <div 
                className="vip-dropdown"
                onMouseLeave={() => setShowVipDropdown(false)}
              >
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    setShowFlomoConfig(true);
                    setShowVipDropdown(false);
                  }}
                >
                  📝 同步 Flomo
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    setShowFeishuConfig(true);
                    setShowVipDropdown(false);
                  }}
                >
                  📊 同步飞书表格
                </button>
              </div>
            )}
          </div>
          <button 
            className="control-btn theme"
            onClick={toggleTheme}
          >
            {darkTheme ? '☀️ 亮色主题' : '🌙 暗色主题'}
          </button>
          
          {/* 搜索功能 */}
          <div className="search-container">
            <button 
              className="control-btn search"
              onClick={() => setShowSearch(!showSearch)}
              title="快速搜索"
            >
              🔍
            </button>
            {showSearch && (
              <div className="search-box">
                <input
                  type="text"
                  placeholder="搜索剪切板内容..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      console.log('Enter键按下，开始搜索:', searchKeyword);
                      performGlobalSearch(searchKeyword);
                    }
                  }}
                  autoFocus
                />
                <div className="search-buttons">
                  <button 
                    className="search-btn-clear"
                    onClick={() => {
                      setSearchKeyword('');
                      setFilteredItems([]);
                      setShowSearch(false);
                      setIsSearchMode(false);
                    }}
                  >
                    重置
                  </button>
                  <button 
                    className="search-btn-primary"
                    onClick={() => performGlobalSearch(searchKeyword)}
                  >
                    搜索
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {isElectron && (
          <div className="electron-info">
            <p>🔧 监控状态: {isMonitoring ? '已开启监控' : '已关闭监控'}</p>
            <p>💾 记录数量: {clipboardItems.length}</p>
          </div>
        )}
      </header>

      <DataFilter
        onFilterChange={applyFilter}
        stats={localStorage.getStats()}
        filteredItems={filteredItems}
        darkTheme={darkTheme}
        isVisible={showFilter}
        onToggleVisibility={() => setShowFilter(!showFilter)}
      />

      <main className="app-main">
        {(() => {
          // 根据搜索模式决定显示的数据
          const displayItems = isSearchMode ? filteredItems : (filteredItems.length > 0 ? filteredItems : clipboardItems);
          
          if (displayItems.length === 0) {
            return (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>{isSearchMode ? '未找到匹配的记录' : '暂无剪切板记录'}</h3>
                <p>{isSearchMode ? '请尝试其他关键词或清除搜索条件' : '监控已开启，复制任何内容都会自动记录'}</p>
                {!isSearchMode && isElectron && (
                  <p className="debug-info">
                    调试信息: Electron环境已检测到，监控状态: {isMonitoring ? '已开启' : '已关闭'}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div className="clipboard-grid">
              {displayItems.map((item) => (
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
          );
        })()}
      </main>

      {/* Flomo配置模态框 */}
      <FlomoConfigModal
        isOpen={showFlomoConfig}
        onClose={() => setShowFlomoConfig(false)}
        darkTheme={darkTheme}
      />

      {/* 飞书配置模态框 */}
      <FeishuConfigModal
        isOpen={showFeishuConfig}
        onClose={() => setShowFeishuConfig(false)}
        darkTheme={darkTheme}
      />
    </div>
  );
}

export default App; 