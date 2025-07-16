import React, { useState, useEffect } from 'react';
import './DataFilter.css';

interface DataFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  stats: {
    totalItems: number;
    itemsByMonth: Record<string, number>;
    itemsByDevice: Record<string, number>;
  };
}

export interface FilterOptions {
  month?: string;
  keyword?: string;
  deviceId?: string;
  tags?: string[];
}

const DataFilter: React.FC<DataFilterProps> = ({ onFilterChange, stats }) => {
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
        <button 
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '收起' : '展开'}
        </button>
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
              共 {stats.totalItems} 条记录
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFilter; 