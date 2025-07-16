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
}

export interface FilterOptions {
  month?: string;
  keyword?: string;
  deviceId?: string;
  tags?: string[];
}

const DataFilter: React.FC<DataFilterProps> = ({ onFilterChange, stats, filteredItems }) => {
  const [filters, setFilters] = useState<FilterOptions>({});
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
    const fileName = `clipboard_data_${timestamp}.txt`;

    // 格式化数据内容
    const exportContent = filteredItems.map((item, index) => {
      const date = new Date(item.timestamp).toLocaleString('zh-CN');
      const content = item.content;
      
      // 用分割线分隔不同内容
      const separator = '\n' + '='.repeat(50) + '\n';
      
      return `${index + 1}. 时间: ${date}\n内容:\n${content}${index < filteredItems.length - 1 ? separator : ''}`;
    }).join('');

    // 添加文件头部信息
    const header = `剪切板数据导出\n导出时间: ${now.toLocaleString('zh-CN')}\n筛选条件: ${JSON.stringify(filters, null, 2)}\n共导出 ${filteredItems.length} 条记录\n\n`;
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

  return (
    <div className="data-filter">
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
        </div>
      </div>

      {isExpanded && (
        <div className="filter-content">
          <div className="filter-row">
            <div className="filter-group">
              <label>按月份筛选</label>
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

          <div className="filter-row">
            <div className="filter-group">
              <label>关键词搜索</label>
              <input
                type="text"
                placeholder="输入关键词搜索内容..."
                value={filters.keyword || ''}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
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