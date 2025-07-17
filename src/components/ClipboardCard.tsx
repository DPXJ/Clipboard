import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Trash2, Check, Tag, Monitor, Cloud } from 'lucide-react';
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
}

const ClipboardCard: React.FC<ClipboardCardProps> = React.memo(({ item, onDelete, isElectron = false }) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 使用 useMemo 缓存计算结果
  const formattedTime = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - item.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return item.timestamp.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [item.timestamp]);

  const truncatedText = useMemo(() => {
    const maxLength = 150;
    if (item.content.length <= maxLength) return item.content;
    return item.content.substring(0, maxLength) + '...';
  }, [item.content]);

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

  // 复制内容到剪切板
  const copyToClipboard = useCallback(async () => {
    try {
      if (isElectron && window.electronAPI) {
        window.electronAPI.setClipboardText(item.content);
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
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  }, [showDeleteConfirm, onDelete, item.id]);

  return (
    <div className="clipboard-card">
      <div className="card-header">
        <div className="card-time">
          <span className="time-icon">🕒</span>
          {formattedTime}
        </div>
        <div className="card-actions">
          <button
            className={`action-btn copy-btn ${copied ? 'copied' : ''}`}
            onClick={copyToClipboard}
            title="复制到剪切板"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            className={`action-btn delete-btn ${showDeleteConfirm ? 'confirm' : ''}`}
            onClick={handleDelete}
            title={showDeleteConfirm ? '点击确认删除' : '删除'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="card-content">
        <div className="content-text">
          {truncatedText}
        </div>
        {item.content.length > 150 && (
          <div className="content-full" title={item.content}>
            <details>
              <summary>
                <span>▶️</span>
                显示完整内容 ({item.content.length} 字符)
              </summary>
              <div className="full-text">{item.content}</div>
            </details>
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <div className="footer-left">
          <div className="content-length">
            字符数: {item.content.length}
          </div>
          <div className="content-type">
            {item.content.includes('\n') ? '多行文本' : '单行文本'}
          </div>
        </div>
        <div className="footer-right">
          <div className="device-info" title={`设备: ${item.deviceId}`}>
            <Monitor size={12} />
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
              <Tag size={12} />
              <span>{item.tags.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ClipboardCard; 