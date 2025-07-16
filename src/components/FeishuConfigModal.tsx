import React, { useState, useEffect } from 'react';
import { FeishuConfig, AppSettings } from '../utils/storage';
import './FeishuConfigModal.css';

interface FeishuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: FeishuConfig) => void;
  currentConfig: FeishuConfig;
}

const FeishuConfigModal: React.FC<FeishuConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState<FeishuConfig>(currentConfig);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  useEffect(() => {
    // 验证配置是否完整
    const valid = config.appId.trim() !== '' && 
                  config.appSecret.trim() !== '' && 
                  config.appToken.trim() !== '' && 
                  config.tableId.trim() !== '';
    setIsValid(valid);
  }, [config]);

  const handleInputChange = (field: keyof FeishuConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (isValid) {
      onSave(config);
      onClose();
    }
  };

  const handleTestConnection = async () => {
    // TODO: 实现飞书API连接测试
    alert('飞书API连接测试功能将在后续版本中实现');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🪶 飞书同步配置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="config-section">
            <h3>应用配置</h3>
            <div className="form-group">
              <label>App ID *</label>
              <input
                type="text"
                value={config.appId}
                onChange={(e) => handleInputChange('appId', e.target.value)}
                placeholder="请输入飞书应用的App ID"
              />
            </div>

            <div className="form-group">
              <label>App Secret *</label>
              <input
                type="password"
                value={config.appSecret}
                onChange={(e) => handleInputChange('appSecret', e.target.value)}
                placeholder="请输入飞书应用的App Secret"
              />
            </div>
          </div>

          <div className="config-section">
            <h3>表格配置</h3>
            <div className="form-group">
              <label>App Token *</label>
              <input
                type="text"
                value={config.appToken}
                onChange={(e) => handleInputChange('appToken', e.target.value)}
                placeholder="请输入多维表格的App Token"
              />
              <small>在飞书多维表格URL中可以找到</small>
            </div>

            <div className="form-group">
              <label>Table ID *</label>
              <input
                type="text"
                value={config.tableId}
                onChange={(e) => handleInputChange('tableId', e.target.value)}
                placeholder="请输入表格的Table ID"
              />
              <small>在表格设置中可以找到</small>
            </div>
          </div>

          <div className="config-section">
            <h3>同步设置</h3>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleInputChange('enabled', e.target.checked.toString())}
                />
                启用飞书同步
              </label>
            </div>
          </div>

          <div className="help-section">
            <h4>📖 配置说明</h4>
            <ol>
              <li>在 <a href="https://open.feishu.cn/" target="_blank" rel="noopener noreferrer">飞书开放平台</a> 创建应用</li>
              <li>获取应用的 App ID 和 App Secret</li>
              <li>在飞书中创建多维表格，获取 App Token 和 Table ID</li>
              <li>配置应用权限（多维表格读写权限）</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-test" onClick={handleTestConnection}>
            测试连接
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!isValid}
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeishuConfigModal; 