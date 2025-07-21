import React, { useState, useEffect } from 'react';
import './FeishuConfigModal.css';

interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
  enabled: boolean;
  autoSync: boolean;
}

interface FeishuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkTheme: boolean;
}

const FeishuConfigModal: React.FC<FeishuConfigModalProps> = ({ isOpen, onClose, darkTheme }) => {
  const [config, setConfig] = useState<FeishuConfig>({
    appId: '',
    appSecret: '',
    appToken: '',
    tableId: '',
    enabled: false,
    autoSync: false
  });

  const [testResult, setTestResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [isLoading, setIsLoading] = useState(false);

  // 加载保存的配置
  useEffect(() => {
    if (isOpen) {
      const savedConfig = localStorage.getItem('feishu-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // 确保新字段存在，避免配置不兼容
        setConfig({
          appId: parsedConfig.appId || '',
          appSecret: parsedConfig.appSecret || '',
          appToken: parsedConfig.appToken || '',
          tableId: parsedConfig.tableId || '',
          enabled: parsedConfig.enabled || false,
          autoSync: parsedConfig.autoSync || false
        });
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      // 保存配置
      localStorage.setItem('feishu-config', JSON.stringify(config));
      setTestResult({ type: 'success', message: '配置保存成功！' });
      
      setTimeout(() => {
        onClose();
        setTestResult({ type: null, message: '' });
      }, 1500);
    } catch (error) {
      setTestResult({ type: 'error', message: '保存失败：' + error });
    }
  };

  const handleTest = async () => {
    if (!config.appId || !config.appSecret) {
      setTestResult({ type: 'error', message: '请填入App ID和App Secret' });
      return;
    }

    setIsLoading(true);
    setTestResult({ type: null, message: '' });

    try {
      // 测试获取access token
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
      
      if (tokenData.code === 0) {
        setTestResult({ type: 'success', message: '连接成功！API配置有效。' });
      } else {
        setTestResult({ type: 'error', message: `连接失败：${tokenData.msg || '未知错误'}` });
      }
    } catch (error) {
      setTestResult({ type: 'error', message: '连接失败：网络错误或API地址不可达' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTestResult({ type: null, message: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`feishu-modal-overlay ${darkTheme ? 'dark' : 'light'}`}>
      <div className="feishu-modal-content">
        <div className="feishu-modal-header">
          <h2>📊 飞书表格配置</h2>
          <button className="feishu-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="feishu-modal-body">
          <div className="feishu-config-section">
            <h3>🔑 应用信息</h3>
            <p className="feishu-config-tip">
              在飞书开放平台创建企业自建应用后获取
            </p>
            
            <div className="feishu-input-group">
              <label>App ID</label>
              <input
                type="text"
                placeholder="cli_xxxxxxxxxxxx"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                className="feishu-input"
              />
            </div>

            <div className="feishu-input-group">
              <label>App Secret</label>
              <input
                type="password"
                placeholder="应用密钥"
                value={config.appSecret}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                className="feishu-input"
              />
            </div>
          </div>

          <div className="feishu-config-section">
            <h3>📋 表格信息</h3>
            <p className="feishu-config-tip">
              从多维表格URL中获取：https://feishu.cn/base/<strong>appToken</strong>?table=<strong>tableId</strong>
            </p>
            
            <div className="feishu-input-group">
              <label>App Token (多维表格ID)</label>
              <input
                type="text"
                placeholder="bascnxxxxxxxxxxxxxxx"
                value={config.appToken}
                onChange={(e) => setConfig({ ...config, appToken: e.target.value })}
                className="feishu-input"
              />
            </div>

            <div className="feishu-input-group">
              <label>Table ID (数据表ID)</label>
              <input
                type="text"
                placeholder="tblxxxxxxxxxxxxxxx"
                value={config.tableId}
                onChange={(e) => setConfig({ ...config, tableId: e.target.value })}
                className="feishu-input"
              />
              <small style={{color: '#666', fontSize: '12px', marginTop: '5px'}}>
                注意：如果URL包含 &view=xxx，请只保留 table= 后面的部分
              </small>
            </div>
          </div>

          <div className="feishu-config-section">
            <div className="feishu-switch-group">
              <label className="feishu-switch">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                />
                <span className="feishu-slider"></span>
              </label>
              <span className="feishu-switch-label">启用飞书同步</span>
            </div>
            
            <div className="feishu-switch-group" style={{marginTop: '15px'}}>
              <label className="feishu-switch">
                <input
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                  disabled={!config.enabled}
                />
                <span className="feishu-slider"></span>
              </label>
              <span className="feishu-switch-label" style={{opacity: config.enabled ? 1 : 0.5}}>
                自动同步（复制后自动同步到飞书）
              </span>
            </div>
          </div>

          {testResult.type && (
            <div className={`feishu-test-result ${testResult.type}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="feishu-modal-footer">
          <button 
            className="feishu-btn feishu-test-btn" 
            onClick={handleTest}
            disabled={isLoading}
          >
            {isLoading ? '测试中...' : '🔍 测试连接'}
          </button>
          <button 
            className="feishu-btn feishu-save-btn" 
            onClick={handleSave}
          >
            💾 保存配置
          </button>
          <button 
            className="feishu-btn feishu-cancel-btn" 
            onClick={handleClose}
          >
            取消
          </button>
        </div>

        <div className="feishu-help-section">
          <details>
            <summary>📖 配置帮助</summary>
            <div className="feishu-help-content">
              <h4>1. 创建飞书应用</h4>
              <p>访问 <a href="https://open.feishu.cn/app" target="_blank">飞书开放平台</a> 创建企业自建应用</p>
              
              <h4>2. 申请权限</h4>
              <p>为应用申请以下权限：</p>
              <ul>
                <li>bitable:app - 多维表格应用权限</li>
                <li>bitable:record - 记录读写权限</li>
              </ul>
              
              <h4>3. 获取表格ID</h4>
              <p>在多维表格URL中：https://xxx.feishu.cn/base/<strong>appToken</strong>?table=<strong>tableId</strong></p>
              <p><strong>重要：</strong>如果URL包含 &view=xxx，请只保留 table= 后面的部分作为Table ID</p>
              
              <h4>4. 表格字段要求</h4>
              <p>请确保表格包含以下字段：</p>
              <ul>
                <li>内容 - 多行文本</li>
                <li>设备 - 单行文本</li>
                <li>状态 - 单选（可选）</li>
              </ul>
              <p><strong>注意：</strong>时间字段将使用飞书表格的"创建时间"自动生成</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default FeishuConfigModal; 