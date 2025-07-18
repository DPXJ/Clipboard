const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 监听主进程消息
  onToggleMonitoring: (callback) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('注册toggle-monitoring监听器');
    }
    ipcRenderer.on('toggle-monitoring', (event, isMonitoring) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('收到toggle-monitoring消息:', isMonitoring);
      }
      callback(isMonitoring);
    });
    
    // 同时监听monitoring-status-changed事件
    ipcRenderer.on('monitoring-status-changed', (event, isMonitoring) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('收到monitoring-status-changed消息:', isMonitoring);
      }
      callback(isMonitoring);
    });
  },
  
  onClearRecords: (callback) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('注册clear-records监听器');
    }
    ipcRenderer.on('clear-records', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('收到clear-records消息');
      }
      callback();
    });
  },
  
  // 发送消息给主进程
  sendMonitoringStatus: (isMonitoring) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('发送监控状态到主进程:', isMonitoring);
    }
    ipcRenderer.send('monitoring-status', { isMonitoring });
  },
  
  // 获取剪切板内容（通过IPC调用主进程）
  getClipboardText: async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('getClipboardText被调用');
    }
    try {
      // 通过IPC调用主进程读取剪切板
      const text = await ipcRenderer.invoke('get-clipboard-text');
      if (process.env.NODE_ENV === 'development') {
        console.log('读取到的剪切板内容:', text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : '(空)');
      }
      return text;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('读取剪切板失败:', error);
      }
      return '';
    }
  },
  
  // 设置剪切板内容（通过IPC调用主进程）
  setClipboardText: async (text) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('setClipboardText被调用:', text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : '(空)');
    }
    try {
      // 通过IPC调用主进程设置剪切板
      const result = await ipcRenderer.invoke('set-clipboard-text', text);
      if (process.env.NODE_ENV === 'development') {
        console.log('剪切板内容设置成功:', result);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('设置剪切板失败:', error);
      }
    }
  },

  // 监听剪切板变化
  onClipboardChanged: (callback) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('注册clipboard-changed监听器');
    }
    ipcRenderer.on('clipboard-changed', (event, content) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('收到clipboard-changed消息:', content ? `"${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"` : '(空)');
      }
      callback(content);
    });
  },

  // 获取监控状态
  getMonitoringStatus: async () => {
    try {
      return await ipcRenderer.invoke('get-monitoring-status');
    } catch (error) {
      console.error('获取监控状态失败:', error);
      return false;
    }
  },

  // 设置监控状态
  setMonitoringStatus: async (status) => {
    try {
      return await ipcRenderer.invoke('set-monitoring-status', status);
    } catch (error) {
      console.error('设置监控状态失败:', error);
      return false;
    }
  }
}); 