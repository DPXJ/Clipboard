const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 监听主进程消息
  onToggleMonitoring: (callback) => {
    ipcRenderer.on('toggle-monitoring', (event, isMonitoring) => {
      callback(isMonitoring);
    });
  },
  
  onClearRecords: (callback) => {
    ipcRenderer.on('clear-records', () => {
      callback();
    });
  },
  
  // 发送消息给主进程
  sendMonitoringStatus: (isMonitoring) => {
    ipcRenderer.send('monitoring-status', { isMonitoring });
  },
  
  // 获取剪切板内容（使用Node.js的clipboard模块）
  getClipboardText: () => {
    const { clipboard } = require('electron');
    return clipboard.readText();
  },
  
  // 设置剪切板内容
  setClipboardText: (text) => {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
  }
}); 