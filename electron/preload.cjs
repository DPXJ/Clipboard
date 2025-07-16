const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is loading...');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 监听主进程消息
  onToggleMonitoring: (callback) => {
    console.log('注册toggle-monitoring监听器');
    ipcRenderer.on('toggle-monitoring', (event, isMonitoring) => {
      console.log('收到toggle-monitoring消息:', isMonitoring);
      callback(isMonitoring);
    });
  },
  
  onClearRecords: (callback) => {
    console.log('注册clear-records监听器');
    ipcRenderer.on('clear-records', () => {
      console.log('收到clear-records消息');
      callback();
    });
  },
  
  // 发送消息给主进程
  sendMonitoringStatus: (isMonitoring) => {
    console.log('发送监控状态到主进程:', isMonitoring);
    ipcRenderer.send('monitoring-status', { isMonitoring });
  },
  
  // 获取剪切板内容（通过IPC调用主进程）
  getClipboardText: async () => {
    console.log('getClipboardText被调用');
    try {
      // 通过IPC调用主进程读取剪切板
      const text = await ipcRenderer.invoke('get-clipboard-text');
      console.log('读取到的剪切板内容:', text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : '(空)');
      return text;
    } catch (error) {
      console.error('读取剪切板失败:', error);
      return '';
    }
  },
  
  // 设置剪切板内容（通过IPC调用主进程）
  setClipboardText: async (text) => {
    console.log('setClipboardText被调用:', text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : '(空)');
    try {
      // 通过IPC调用主进程设置剪切板
      const result = await ipcRenderer.invoke('set-clipboard-text', text);
      console.log('剪切板内容设置成功:', result);
    } catch (error) {
      console.error('设置剪切板失败:', error);
    }
  }
});

console.log('Preload script加载完成，electronAPI已暴露'); 