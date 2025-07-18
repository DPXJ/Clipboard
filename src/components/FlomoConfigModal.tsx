import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './FlomoConfigModal.css';

interface FlomoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkTheme?: boolean;
}

const FlomoConfigModal: React.FC<FlomoConfigModalProps> = ({
  isOpen,
  onClose,
  darkTheme = false
}) => {
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // 加载已保存的配置
      const savedConfig = localStorage.getItem('flomo_config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setApiUrl(config.apiUrl || '');
        } catch (error) {
          console.error('加载flomo配置失败:', error);
        }
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      setTestResult('请输入API URL');
      return;
    }

    setIsLoading(true);
    try {
      const config = {
        apiUrl: apiUrl.trim()
      };
      localStorage.setItem('flomo_config', JSON.stringify(config));
      setTestResult('配置保存成功！');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      setTestResult('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      setTestResult('请输入API URL');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const testResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '测试连接 #flomo-test'
        })
      });

      if (testResponse.ok) {
        setTestResult('连接成功！测试消息已发送到flomo');
      } else {
        setTestResult('连接失败，请检查API URL是否正确');
      }
    } catch (error) {
      setTestResult('网络错误，请检查网络连接和API URL');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`flomo-modal-overlay ${darkTheme ? 'dark' : 'light'}`} 
      onClick={onClose}
    >
      <div 
        className="flomo-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flomo-modal-header">
          <h2>配置 Flomo 同步</h2>
          <button 
            className="flomo-close-btn" 
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flomo-modal-body">
          <div className="flomo-config-section">
            <h3>API 配置</h3>
            <div className="flomo-form-group">
              <label htmlFor="apiUrl">Flomo API URL</label>
              <input
                type="text"
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://flomoapp.com/iwh/YOUR_TOKEN/YOUR_SECRET/"
              />
              <small>
                请输入您的 Flomo API URL，格式如：https://flomoapp.com/iwh/YOUR_TOKEN/YOUR_SECRET/
              </small>
            </div>
          </div>

          <div className="flomo-help-section">
            <h4>如何获取 Flomo API？</h4>
            <ol>
              <li>登录 <a href="https://flomoapp.com" target="_blank" rel="noopener noreferrer">Flomo</a></li>
              <li>进入设置页面</li>
              <li>找到"API"选项</li>
              <li>复制完整的API URL</li>
              <li>粘贴到上方输入框中</li>
            </ol>
          </div>

          {testResult && (
            <div className={`flomo-test-result ${testResult.includes('成功') ? 'success' : 'error'}`}>
              {testResult}
            </div>
          )}
        </div>

        <div className="flomo-modal-footer">
          <button 
            className="flomo-btn flomo-btn-test"
            onClick={handleTest}
            disabled={isLoading || !apiUrl.trim()}
          >
            {isLoading ? '测试中...' : '测试连接'}
          </button>
          <button 
            className="flomo-btn flomo-btn-secondary"
            onClick={onClose}
          >
            取消
          </button>
          <button 
            className="flomo-btn flomo-btn-primary"
            onClick={handleSave}
            disabled={isLoading || !apiUrl.trim()}
          >
            {isLoading ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlomoConfigModal; 