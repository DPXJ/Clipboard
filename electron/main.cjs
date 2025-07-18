const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');

let mainWindow;
let tray;
let isMonitoring = false;
let lastClipboardContent = '';
let clipboardCheckInterval = null;

// 检测可用的开发服务器端口
async function findDevServerPort() {
  const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
  
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const client = net.createConnection(port, 'localhost');
        client.on('connect', () => {
          client.destroy();
          resolve(port);
        });
        client.on('error', () => {
          reject();
        });
        client.setTimeout(2000, () => {
          client.destroy();
          reject();
        });
      });
      console.log(`找到开发服务器端口: ${port}`);
      return port;
    } catch (error) {
      console.log(`端口 ${port} 不可用`);
      continue;
    }
  }
  console.log('未找到可用的开发服务器端口');
  return null; // 返回null表示没有找到
}

// 创建主窗口
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#667eea'
  });

  // 加载应用
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  console.log('开发环境检测:', isDev, 'NODE_ENV:', process.env.NODE_ENV, 'isPackaged:', app.isPackaged);
  
  // 暂时总是使用本地构建的文件，确保稳定性
  console.log('加载本地构建文件');
  await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  
  if (isDev) {
    // 在开发模式下打开开发者工具
    mainWindow.webContents.openDevTools();
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 窗口关闭时隐藏到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // 窗口最小化时隐藏到托盘
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

// 创建系统托盘
function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon);
  tray.setToolTip('剪切板监控器');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: isMonitoring ? '停止监控' : '开始监控',
      click: () => {
        toggleMonitoring();
      }
    },
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '清空记录',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('clear-records');
        }
      }
    },
    { type: 'separator' },
    {
      label: '重启应用',
      click: () => {
        app.relaunch();
        app.exit();
      }
    },
    {
      label: '退出',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 显示/隐藏窗口
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // 切换监控状态
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    toggleMonitoring();
  });
}

// 切换监控状态
function toggleMonitoring() {
  isMonitoring = !isMonitoring;
  
  if (isMonitoring) {
    startMonitoring();
  } else {
    stopMonitoring();
  }
  
  updateTrayMenu();
  
  if (mainWindow) {
    mainWindow.webContents.send('toggle-monitoring', isMonitoring);
  }
}

// 开始监控
function startMonitoring() {
  console.log('开始监控剪切板...');
  
  // 如果已经在监控，先停止之前的监控
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
    clipboardCheckInterval = null;
  }
  
  // 初始化时设置当前剪切板内容，但不触发通知
  try {
    const currentContent = clipboard.readText();
    if (currentContent && currentContent.trim()) {
      lastClipboardContent = currentContent.trim();
      console.log('初始化剪切板内容:', lastClipboardContent.substring(0, 50) + '...');
    }
  } catch (error) {
    // 忽略错误
  }
  
  // 设置定期检查
  clipboardCheckInterval = setInterval(() => {
    if (isMonitoring) {
      readClipboardContent();
    }
  }, 1000); // 1秒检查一次
}

// 停止监控
function stopMonitoring() {
  console.log('停止监控剪切板');
  isMonitoring = false;
  
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
    clipboardCheckInterval = null;
  }
}

// 读取剪切板内容（优化版本）
function readClipboardContent() {
  try {
    const content = clipboard.readText();
    
    // 检查内容是否发生变化（更严格的检查）
    if (content && content.trim() && content.trim() !== lastClipboardContent) {
      const trimmedContent = content.trim();
      console.log('剪切板内容变化:', trimmedContent.substring(0, 50) + '...');
      lastClipboardContent = trimmedContent;
      
      // 通知渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('clipboard-changed', trimmedContent);
      }
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 更新托盘菜单
function updateTrayMenu() {
  if (tray) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: isMonitoring ? '停止监控' : '开始监控',
        click: () => {
          toggleMonitoring();
        }
      },
      {
        label: '显示主窗口',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: '清空记录',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('clear-records');
          }
        }
      },
      { type: 'separator' },
      {
        label: '重启应用',
        click: () => {
          app.relaunch();
          app.exit();
        }
      },
      {
        label: '退出',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
  }
}

// 应用准备就绪
app.whenReady().then(async () => {
  await createWindow();
  createTray();
  registerGlobalShortcuts();
  
  // 默认开启监控
  isMonitoring = true;
  startMonitoring();
  updateTrayMenu();
  
  // 在 macOS 上，当所有窗口都关闭时，重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  app.isQuiting = true;
  stopMonitoring();
  
  if (tray) {
    tray.destroy();
  }
  
  // 注销全局快捷键
  globalShortcut.unregisterAll();
});

// IPC 通信处理
ipcMain.handle('get-clipboard-text', () => {
  return clipboard.readText();
});

ipcMain.handle('set-clipboard-text', (event, text) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('get-monitoring-status', () => {
  return isMonitoring;
});

ipcMain.handle('set-monitoring-status', (event, status) => {
  isMonitoring = status;
  if (isMonitoring) {
    startMonitoring();
  } else {
    stopMonitoring();
  }
  updateTrayMenu();
  
  // 向渲染进程发送状态更新
  if (mainWindow) {
    mainWindow.webContents.send('monitoring-status-changed', isMonitoring);
  }
  
  return true;
});

// 监听渲染进程的监控状态变化
ipcMain.on('monitoring-status-changed', (event, status) => {
  isMonitoring = status;
  updateTrayMenu();
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});