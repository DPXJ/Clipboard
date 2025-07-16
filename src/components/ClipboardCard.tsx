import React, { useState } from 'react';
import { Copy, Trash2, Check } from 'lucide-react';
import './ClipboardCard.css';

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
}

interface ClipboardCardProps {
  item: ClipboardItem;
  onDelete: (id: string) => void;
  isElectron?: boolean;
}

const ClipboardCard: React.FC<ClipboardCardProps> = ({ item, onDelete, isElectron = false }) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 复制内容到剪切板
  const copyToClipboard = async () => {
    try {
      if (isElectron && window.electronAPI) {
        // 使用Electron API复制
        window.electronAPI.setClipboardText(item.content);
      } else {
        // 使用浏览器API复制
        await navigator.clipboard.writeText(item.content);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
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
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 截断长文本
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 删除确认
  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(item.id);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="clipboard-card">
      <div className="card-header">
        <div className="card-time">
          <span className="time-icon">🕒</span>
          {formatTime(item.timestamp)}
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
          {truncateText(item.content)}
        </div>
        {item.content.length > 200 && (
          <div className="content-full" title={item.content}>
            <details>
              <summary>显示完整内容</summary>
              <div className="full-text">{item.content}</div>
            </details>
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <div className="content-length">
          字符数: {item.content.length}
        </div>
        <div className="content-type">
          {item.content.includes('\n') ? '多行文本' : '单行文本'}
        </div>
      </div>
    </div>
  );
};

export default ClipboardCard; 