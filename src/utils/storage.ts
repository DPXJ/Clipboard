// 本地数据存储工具
export interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
  deviceId: string;
  tags?: string[];
  syncStatus: 'local' | 'synced' | 'failed';
}

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
  enabled: boolean;
}

export interface AppSettings {
  feishuConfig: FeishuConfig;
  syncStrategy: 'realtime' | 'batch' | 'scheduled';
  maxLocalItems: number;
  autoSync: boolean;
}

class LocalStorage {
  private readonly CLIPBOARD_KEY = 'clipboard_items';
  private readonly SETTINGS_KEY = 'app_settings';
  private readonly DEVICE_ID_KEY = 'device_id';
  private readonly LAST_CONTENT_KEY = 'last_clipboard_content';
  private lastContent: string = '';
  
  // 添加内存缓存
  private cachedItems: ClipboardItem[] | null = null;
  private cachedStats: any = null;
  private lastLoadTime: number = 0;
  private readonly CACHE_DURATION = 5000; // 缓存5秒

  // 获取设备ID
  getDeviceId(): string {
    let deviceId = window.localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `PC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      window.localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  // 获取上次读取的内容
  getLastContent(): string {
    if (!this.lastContent) {
      this.lastContent = window.localStorage.getItem(this.LAST_CONTENT_KEY) || '';
    }
    return this.lastContent;
  }

  // 设置上次读取的内容
  setLastContent(content: string): void {
    this.lastContent = content;
    window.localStorage.setItem(this.LAST_CONTENT_KEY, content);
  }

  // 检查内容是否为新内容
  isNewContent(content: string): boolean {
    const lastContent = this.getLastContent();
    return content.trim() !== lastContent.trim();
  }

  // 检查缓存是否有效
  private isCacheValid(): boolean {
    return this.cachedItems !== null && 
           (Date.now() - this.lastLoadTime) < this.CACHE_DURATION;
  }

  // 清除缓存
  private clearCache(): void {
    this.cachedItems = null;
    this.cachedStats = null;
  }

  // 保存剪切板数据（优化版本）
  saveClipboardItems(items: ClipboardItem[]): void {
    try {
      const serializedItems = items.map(item => ({
        ...item,
        timestamp: item.timestamp.toISOString()
      }));
      window.localStorage.setItem(this.CLIPBOARD_KEY, JSON.stringify(serializedItems));
      
      // 更新缓存
      this.cachedItems = items;
      this.lastLoadTime = Date.now();
    } catch (error) {
      console.error('保存剪切板数据失败:', error);
      this.clearCache(); // 清除缓存，下次重新加载
    }
  }

  // 加载剪切板数据（优化版本，带缓存）
  loadClipboardItems(): ClipboardItem[] {
    // 检查缓存是否有效
    if (this.isCacheValid()) {
      return this.cachedItems!;
    }

    try {
      const data = window.localStorage.getItem(this.CLIPBOARD_KEY);
      if (!data) {
        this.cachedItems = [];
        this.lastLoadTime = Date.now();
        return [];
      }
      
      const items = JSON.parse(data);
      const parsedItems = items.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      
      // 更新缓存
      this.cachedItems = parsedItems;
      this.lastLoadTime = Date.now();
      
      return parsedItems;
    } catch (error) {
      console.error('加载剪切板数据失败:', error);
      this.clearCache();
      return [];
    }
  }

  // 添加新的剪切板项目（优化版本）
  addClipboardItem(content: string, tags?: string[]): ClipboardItem | null {
    const trimmedContent = content.trim();
    
    // 检查是否为新内容
    if (!this.isNewContent(trimmedContent)) {
      return null;
    }

    // 使用缓存的数据，避免重复加载
    const items = this.loadClipboardItems();
    
    // 检查是否已存在相同内容
    const exists = items.some(item => item.content === trimmedContent);
    if (exists) {
      return null;
    }

    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content: trimmedContent,
      timestamp: new Date(),
      deviceId: this.getDeviceId(),
      tags: tags || [],
      syncStatus: 'local'
    };

    // 保存新内容为最后读取的内容
    this.setLastContent(trimmedContent);
    
    // 添加到开头
    items.unshift(newItem);
    
    // 应用数据量限制
    const settings = this.loadSettings();
    const maxItems = settings.maxLocalItems || 1000;
    
    if (items.length > maxItems) {
      // 删除最旧的记录
      items.splice(maxItems);
    }
    
    this.saveClipboardItems(items);
    
    return newItem;
  }

  // 删除剪切板项目（优化版本）
  deleteClipboardItem(id: string): void {
    const items = this.loadClipboardItems();
    const filteredItems = items.filter(item => item.id !== id);
    this.saveClipboardItems(filteredItems);
  }

  // 清空所有数据
  clearAllItems(): void {
    window.localStorage.removeItem(this.CLIPBOARD_KEY);
    this.clearCache();
  }

  // 保存应用设置
  saveSettings(settings: AppSettings): void {
    try {
      window.localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  // 加载应用设置
  loadSettings(): AppSettings {
    try {
      const data = window.localStorage.getItem(this.SETTINGS_KEY);
      if (!data) {
        return this.getDefaultSettings();
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('加载设置失败:', error);
      return this.getDefaultSettings();
    }
  }

  // 获取默认设置
  getDefaultSettings(): AppSettings {
    return {
      feishuConfig: {
        appId: '',
        appSecret: '',
        appToken: '',
        tableId: '',
        enabled: false
      },
      syncStrategy: 'realtime',
      maxLocalItems: 1000,
      autoSync: false
    };
  }

  // 更新飞书配置
  updateFeishuConfig(config: Partial<FeishuConfig>): void {
    const settings = this.loadSettings();
    settings.feishuConfig = { ...settings.feishuConfig, ...config };
    this.saveSettings(settings);
  }

  // 按条件筛选数据（优化版本，使用缓存）
  filterItems(options: {
    month?: string; // 格式: "2024-07"
    keyword?: string;
    deviceId?: string;
    tags?: string[];
  }): ClipboardItem[] {
    const items = this.loadClipboardItems();
    
    return items.filter(item => {
      // 按月份筛选
      if (options.month) {
        const itemMonth = item.timestamp.toISOString().substring(0, 7);
        if (itemMonth !== options.month) return false;
      }

      // 按关键词筛选
      if (options.keyword) {
        if (!item.content.toLowerCase().includes(options.keyword.toLowerCase())) {
          return false;
        }
      }

      // 按设备筛选
      if (options.deviceId) {
        if (item.deviceId !== options.deviceId) return false;
      }

      // 按标签筛选
      if (options.tags && options.tags.length > 0) {
        const hasMatchingTag = options.tags.some(tag => 
          item.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }

  // 获取统计数据（优化版本，带缓存）
  getStats(): {
    totalItems: number;
    itemsByMonth: Record<string, number>;
    itemsByDevice: Record<string, number>;
  } {
    // 检查缓存是否有效
    if (this.cachedStats && this.isCacheValid()) {
      return this.cachedStats;
    }

    const items = this.loadClipboardItems();
    const stats = {
      totalItems: items.length,
      itemsByMonth: {} as Record<string, number>,
      itemsByDevice: {} as Record<string, number>
    };

    items.forEach(item => {
      const month = item.timestamp.toISOString().substring(0, 7);
      stats.itemsByMonth[month] = (stats.itemsByMonth[month] || 0) + 1;
      stats.itemsByDevice[item.deviceId] = (stats.itemsByDevice[item.deviceId] || 0) + 1;
    });

    // 缓存统计结果
    this.cachedStats = stats;
    
    return stats;
  }

  // 清理过期数据（新增方法）
  cleanupOldData(daysToKeep: number = 30): void {
    const items = this.loadClipboardItems();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredItems = items.filter(item => item.timestamp > cutoffDate);
    
    if (filteredItems.length !== items.length) {
      this.saveClipboardItems(filteredItems);
      console.log(`清理了 ${items.length - filteredItems.length} 条过期数据`);
    }
  }

  // 获取存储使用情况（新增方法）
  getStorageInfo(): {
    totalItems: number;
    totalSize: number;
    maxItems: number;
  } {
    const items = this.loadClipboardItems();
    const settings = this.loadSettings();
    const dataString = JSON.stringify(items);
    
    return {
      totalItems: items.length,
      totalSize: new Blob([dataString]).size,
      maxItems: settings.maxLocalItems || 1000
    };
  }
}

export const localStorage = new LocalStorage(); 