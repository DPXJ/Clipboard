import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Trash2, Check, Tag, Monitor, Cloud, FileText } from 'lucide-react';
import './ClipboardCard.css';

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
  deviceId: string;
  tags?: string[];
  syncStatus: 'local' | 'synced' | 'failed';
}

interface ClipboardCardProps {
  item: ClipboardItem;
  onDelete: (id: string) => void;
  isElectron?: boolean;
  darkTheme?: boolean;
}

const ClipboardCard: React.FC<ClipboardCardProps> = React.memo(({ item, onDelete, isElectron = false, darkTheme = false }) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [flomoSyncing, setFlomoSyncing] = useState(false);
  const [flomoSyncResult, setFlomoSyncResult] = useState<'success' | 'error' | null>(null);
  const [feishuSyncing, setFeishuSyncing] = useState(false);
  const [feishuSyncResult, setFeishuSyncResult] = useState<'success' | 'error' | null>(null);
  
  // 检查是否已同步到Flomo (持久化状态)
  const [isFlomoSynced, setIsFlomoSynced] = useState(() => {
    const syncedItems = JSON.parse(localStorage.getItem('flomo_synced_items') || '[]');
    return syncedItems.includes(item.id);
  });

  // 检查是否已同步到飞书 (持久化状态)
  const [isFeishuSynced, setIsFeishuSynced] = useState(() => {
    const syncedItems = JSON.parse(localStorage.getItem('feishu_synced_items') || '[]');
    return syncedItems.includes(item.id);
  });

  // 时间格式化
  const formattedTime = useMemo(() => {
    const now = new Date();
    const itemTime = new Date(item.timestamp);
    const diff = now.getTime() - itemTime.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    // 检查时间戳是否有效
    if (isNaN(itemTime.getTime())) {
      console.error('无效的时间戳:', item.timestamp);
      return '时间无效';
    }
    
    // 更精确的时间显示
    if (seconds < 0) {
      // 如果时间戳是未来时间，显示具体时间
      return itemTime.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (seconds < 10) {
      return '刚刚';
    } else if (seconds < 60) {
      return `${seconds}秒前`;
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      // 超过一周显示具体日期
      return itemTime.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, [item.timestamp]);

  // 内容截断
  const truncatedText = useMemo(() => {
    const maxLength = 150;
    if (item.content.length <= maxLength) return item.content;
    return item.content.substring(0, maxLength) + '...';
  }, [item.content]);

  // 同步状态信息
  const syncStatusInfo = useMemo(() => {
    switch (item.syncStatus) {
      case 'synced':
        return { icon: <Cloud size={12} />, color: '#4CAF50', text: '已同步' };
      case 'failed':
        return { icon: <Cloud size={12} />, color: '#f44336', text: '同步失败' };
      default:
        return { icon: <Cloud size={12} />, color: '#ff9800', text: '本地' };
    }
  }, [item.syncStatus]);

  // 复制到剪切板
  const copyToClipboard = useCallback(async () => {
    try {
      if (isElectron && window.electronAPI) {
        await window.electronAPI.setClipboardText(item.content);
      } else {
        await navigator.clipboard.writeText(item.content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = item.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [item.content, isElectron]);

  // 删除确认
  const handleDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onDelete(item.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, onDelete, item.id]);

  // 切换显示完整内容
  const toggleFullContent = useCallback(() => {
    setShowFullContent(!showFullContent);
  }, [showFullContent]);

  // 同步到Flomo
  const syncToFlomo = useCallback(async () => {
    // 检查是否已配置Flomo API
    const savedConfig = localStorage.getItem('flomo_config');
    if (!savedConfig) {
      alert('请先配置Flomo API。点击VIP按钮 -> 同步Flomo进行配置。');
      return;
    }

    let config;
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      alert('Flomo配置解析失败，请重新配置。');
      return;
    }

    if (!config.apiUrl) {
      alert('Flomo API URL未配置，请重新配置。');
      return;
    }

    setFlomoSyncing(true);
    setFlomoSyncResult(null);

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `${item.content} #clipboard-sync`
        })
      });

      if (response.ok) {
        setFlomoSyncResult('success');
        
        // 保存同步状态到localStorage
        const syncedItems = JSON.parse(localStorage.getItem('flomo_synced_items') || '[]');
        if (!syncedItems.includes(item.id)) {
          syncedItems.push(item.id);
          localStorage.setItem('flomo_synced_items', JSON.stringify(syncedItems));
          setIsFlomoSynced(true);
        }
        
        setTimeout(() => setFlomoSyncResult(null), 3000);
      } else {
        setFlomoSyncResult('error');
        setTimeout(() => setFlomoSyncResult(null), 3000);
      }
    } catch (error) {
      console.error('Flomo同步失败:', error);
      setFlomoSyncResult('error');
      setTimeout(() => setFlomoSyncResult(null), 3000);
    } finally {
      setFlomoSyncing(false);
    }
  }, [item.content]);

  // 同步到飞书
  const syncToFeishu = useCallback(async () => {
    // 检查是否已配置飞书API
    const savedConfig = localStorage.getItem('feishu-config');
    if (!savedConfig) {
      alert('请先配置飞书API。点击VIP按钮 -> 同步飞书表格进行配置。');
      return;
    }

    let config;
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      alert('飞书配置解析失败，请重新配置。');
      return;
    }

    if (!config.enabled || !config.appId || !config.appSecret || !config.appToken || !config.tableId) {
      alert('飞书API配置不完整，请重新配置。');
      return;
    }

    setFeishuSyncing(true);
    setFeishuSyncResult(null);

    try {
      // 1. 获取access token
      const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: config.appId,
          app_secret: config.appSecret,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (tokenData.code !== 0) {
        throw new Error(`获取token失败: ${tokenData.msg}`);
      }

      // 清理Table ID，移除可能的view参数
      const cleanTableId = config.tableId.split('&')[0];
      
      // 2. 创建记录
      const recordData = {
        fields: {
          '内容': item.content,
          '日期': Math.floor(new Date(item.timestamp).getTime() / 1000), // 使用时间戳格式
          '设备': item.deviceId || '未知设备',
          '状态': '已同步'
        }
      };
      
      console.log('发送到飞书的数据:', recordData);
      console.log('原始Table ID:', config.tableId);
      console.log('清理后Table ID:', cleanTableId);
      console.log('API URL:', `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${cleanTableId}/records`);
      
      const createResponse = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${cleanTableId}/records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.tenant_access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData)
        }
      );

      const responseData = await createResponse.json();
      
      if (createResponse.ok && responseData.code === 0) {
        console.log('飞书同步成功:', responseData);
        setFeishuSyncResult('success');
        
        // 保存同步状态到localStorage
        const syncedItems = JSON.parse(localStorage.getItem('feishu_synced_items') || '[]');
        if (!syncedItems.includes(item.id)) {
          syncedItems.push(item.id);
          localStorage.setItem('feishu_synced_items', JSON.stringify(syncedItems));
          setIsFeishuSynced(true);
        }
        
        setTimeout(() => setFeishuSyncResult(null), 3000);
      } else {
        console.error('飞书API错误响应:', responseData);
        throw new Error(`创建记录失败: ${responseData.msg || responseData.error_msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('飞书同步失败:', error);
      setFeishuSyncResult('error');
      setTimeout(() => setFeishuSyncResult(null), 3000);
    } finally {
      setFeishuSyncing(false);
    }
  }, [item.content, item.timestamp, item.deviceId]);

  return (
    <div className={`clipboard-card ${darkTheme ? 'dark-theme' : 'light-theme'} ${showFullContent ? 'expanded' : ''}`}>
      <div className="card-header">
        <div className="card-time">
          <span className="time-icon">🕒</span>
          {formattedTime}
        </div>
        <div className="card-actions">
          <button
            className={`card-btn copy ${copied ? 'copied' : ''}`}
            onClick={copyToClipboard}
            title={copied ? '已复制到剪切板' : '复制到剪切板'}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            className={`card-btn flomo ${flomoSyncing ? 'syncing' : ''} ${flomoSyncResult === 'success' ? 'success' : flomoSyncResult === 'error' ? 'error' : ''} ${isFlomoSynced ? 'synced' : ''}`}
            onClick={syncToFlomo}
            title={
              flomoSyncing ? '同步中...' : 
              flomoSyncResult === 'success' ? '同步成功' : 
              flomoSyncResult === 'error' ? '同步失败' : 
              isFlomoSynced ? '已同步到Flomo' : '同步到Flomo'
            }
            disabled={flomoSyncing}
          >
            <span className="flomo-icon">
              {isFlomoSynced ? '✓' : 'F'}
            </span>
          </button>
          <button
            className={`card-btn feishu ${feishuSyncing ? 'syncing' : ''} ${feishuSyncResult === 'success' ? 'success' : feishuSyncResult === 'error' ? 'error' : ''} ${isFeishuSynced ? 'synced' : ''}`}
            onClick={syncToFeishu}
            title={
              feishuSyncing ? '同步中...' : 
              feishuSyncResult === 'success' ? '同步成功' : 
              feishuSyncResult === 'error' ? '同步失败' : 
              isFeishuSynced ? '已同步到飞书' : '同步到飞书'
            }
            disabled={feishuSyncing}
          >
            <span className="feishu-icon">
              {isFeishuSynced ? '✓' : '飞'}
            </span>
          </button>
          <button
            className={`card-btn delete ${showDeleteConfirm ? 'confirm' : ''}`}
            onClick={handleDelete}
            title={showDeleteConfirm ? '点击确认删除' : '删除'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <div className="content-text">
          {showFullContent ? item.content : truncatedText}
        </div>
        {item.content.length > 150 && (
          <button 
            className="show-full-btn"
            onClick={toggleFullContent}
          >
            {showFullContent ? '收起内容' : `显示完整内容 (${item.content.length} 字符)`}
          </button>
        )}
      </div>
      
      <div className="card-footer">
        <div className="footer-left">
          <div className="content-stats">
            <span className="char-count">{item.content.length} 字符</span>
            <span className="content-type">
              {item.content.includes('\n') ? '多行文本' : '单行文本'}
            </span>
          </div>
        </div>
        <div className="footer-right">
          <div className="device-info" title={`设备: ${item.deviceId}`}>
            <Monitor size={10} />
            <span>{item.deviceId.split('-')[0]}</span>
          </div>
          <div 
            className="sync-status" 
            title={syncStatusInfo.text}
            style={{ color: syncStatusInfo.color }}
          >
            {syncStatusInfo.icon}
          </div>
          {item.tags && item.tags.length > 0 && (
            <div className="tags-info" title={`标签: ${item.tags.join(', ')}`}>
              <Tag size={10} />
              <span>{item.tags.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ClipboardCard; 