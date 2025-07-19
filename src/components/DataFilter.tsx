import React, { useState, useEffect } from 'react';
import './DataFilter.css';

interface DataFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  stats: {
    totalItems: number;
    itemsByMonth: Record<string, number>;
    itemsByDevice: Record<string, number>;
  };
  filteredItems: any[]; // 添加筛选后的数据
  darkTheme?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export interface FilterOptions {
  month?: string;
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  deviceId?: string;
  tags?: string[];
}

const DataFilter: React.FC<DataFilterProps> = ({ onFilterChange, stats, filteredItems, darkTheme = false, isVisible = true, onToggleVisibility }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    // 移除默认的今天筛选，避免与搜索功能冲突
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof FilterOptions, value: string | string[] | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // 导出筛选后的数据
  const exportFilteredData = () => {
    if (filteredItems.length === 0) {
      alert('没有数据可导出');
      return;
    }

    // 生成导出文件名
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `clipboard_filtered_${timestamp}.txt`;

    // 生成文件头部信息
    const header = `剪切板筛选数据导出
导出时间: ${now.toLocaleString('zh-CN')}
筛选条件: ${JSON.stringify(filters, null, 2)}
共导出 ${filteredItems.length} 条记录

${'='.repeat(80)}

`;

    // 格式化每条记录
    const exportContent = filteredItems.map((item, index) => {
      const date = new Date(item.timestamp).toLocaleString('zh-CN');
      const deviceInfo = item.deviceId.split('-')[0];
      const contentType = item.content.includes('\n') ? '多行文本' : '单行文本';
      
      // 每条记录的格式
      const recordContent = `${index + 1}. 记录详情
时间: ${date}
设备: ${deviceInfo}
类型: ${contentType}
字符数: ${item.content.length}
${item.syncStatus === 'synced' ? '状态: 已同步' : '状态: 本地'}

内容:
${item.content}`;

      // 添加分割线（最后一条记录不加分割线）
      const separator = index < filteredItems.length - 1 ? `\n\n${'-'.repeat(80)}\n\n` : '';
      
      return recordContent + separator;
    }).join('');

    const fullContent = header + exportContent;

    // 创建并下载文件
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`已导出 ${filteredItems.length} 条记录到文件: ${fileName}`);
  };

  const getMonthOptions = () => {
    const months = Object.keys(stats.itemsByMonth).sort().reverse();
    return months.map(month => {
      const date = new Date(month + '-01');
      const monthName = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      return { value: month, label: `${monthName} (${stats.itemsByMonth[month]}条)` };
    });
  };

  const getDeviceOptions = () => {
    return Object.keys(stats.itemsByDevice).map(deviceId => ({
      value: deviceId,
      label: `${deviceId} (${stats.itemsByDevice[deviceId]}条)`
    }));
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  // 如果不可见，不显示任何内容（隐藏悬浮按钮）
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`data-filter ${darkTheme ? 'dark-theme' : 'light-theme'}`}>
      <div className="filter-header">
        <div className="filter-title">
          <span>🔍 数据筛选</span>
          {hasActiveFilters && <span className="active-indicator">●</span>}
        </div>
        <div className="filter-actions-header">
          <button 
            className="export-btn"
            onClick={exportFilteredData}
            disabled={filteredItems.length === 0}
            title="导出筛选后的数据为文本文件"
          >
            📥 导出数据 ({filteredItems.length})
          </button>
          <button 
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '收起' : '展开'}
          </button>
          <button 
            className="close-filter-btn"
            onClick={onToggleVisibility}
            title="隐藏筛选面板"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="filter-content">
          <div className="filter-row">
            <div className="filter-group">
              <label>时间范围</label>
              <select
                value={filters.timeRange || ''}
                onChange={(e) => handleFilterChange('timeRange', e.target.value || undefined)}
              >
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
                <option value="custom">自定义时间段</option>
              </select>
            </div>

            <div className="filter-group">
              <label>按设备筛选</label>
              <select
                value={filters.deviceId || ''}
                onChange={(e) => handleFilterChange('deviceId', e.target.value || undefined)}
              >
                <option value="">全部设备</option>
                {getDeviceOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 自定义时间范围 */}
          {filters.timeRange === 'custom' && (
            <div className="filter-row">
              <div className="filter-group">
                <label>开始日期</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>结束日期</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="filter-row">
            <div className="filter-group">
              <label>内容搜索</label>
              <input
                type="text"
                placeholder="输入关键词搜索内容..."
                value={filters.keyword || ''}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
            </div>
          </div>

          {/* 保留月份筛选作为备用选项 */}
          <div className="filter-row">
            <div className="filter-group">
              <label>按月份筛选（旧版本兼容）</label>
              <select
                value={filters.month || ''}
                onChange={(e) => handleFilterChange('month', e.target.value || undefined)}
              >
                <option value="">全部月份</option>
                {getMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button className="clear-btn" onClick={clearFilters}>
              清除筛选
            </button>
            <div className="filter-stats">
              共 {stats.totalItems} 条记录，筛选后 {filteredItems.length} 条
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFilter; 