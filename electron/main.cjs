const { app, BrowserWindow, Tray, Menu, nativeImage, clipboard, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let tray;
let isMonitoring = false;

// 检测可用端口
async function findAvailablePort() {
  const net = require('net');
  
  for (let port = 5173; port <= 5180; port++) {
    try {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(port, () => {
          server.close();
          resolve(port);
        });
        server.on('error', () => {
          reject();
        });
      });
      return port;
    } catch (error) {
      continue;
    }
  }
  return 5173; // 默认端口
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
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default',
    frame: true,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true
  });

  // 加载应用
  if (isDev) {
    // 直接加载Vite开发服务器
    const url = 'http://localhost:5173';
    console.log(`Loading app from: ${url}`);
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Electron window is ready and visible');
  });

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 窗口最小化到托盘
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // 窗口关闭到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
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
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '开始监控',
      type: 'checkbox',
      checked: isMonitoring,
      click: (menuItem) => {
        isMonitoring = menuItem.checked;
        if (mainWindow) {
          mainWindow.webContents.send('toggle-monitoring', isMonitoring);
        }
        updateTrayMenu();
      }
    },
    { type: 'separator' },
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
      label: '退出',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // 托盘图标点击事件
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// 更新托盘菜单
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
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
      label: '开始监控',
      type: 'checkbox',
      checked: isMonitoring,
      click: (menuItem) => {
        isMonitoring = menuItem.checked;
        if (mainWindow) {
          mainWindow.webContents.send('toggle-monitoring', isMonitoring);
        }
        updateTrayMenu();
      }
    },
    { type: 'separator' },
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
      label: '退出',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// 注册全局快捷键
function registerShortcuts() {
  // Ctrl+Shift+V 显示/隐藏窗口
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

  // Ctrl+Shift+C 切换监控状态
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    isMonitoring = !isMonitoring;
    if (mainWindow) {
      mainWindow.webContents.send('toggle-monitoring', isMonitoring);
    }
    updateTrayMenu();
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 应用退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  app.isQuiting = true;
  globalShortcut.unregisterAll();
});

// 处理渲染进程消息
app.on('web-contents-created', (event, contents) => {
  contents.on('ipc-message', (event, channel, data) => {
    if (channel === 'monitoring-status') {
      isMonitoring = data.isMonitoring;
      updateTrayMenu();
    }
  });
});

// 注册IPC处理器
ipcMain.handle('get-clipboard-text', () => {
  try {
    console.log('主进程: 读取剪切板内容');
    const text = clipboard.readText();
    console.log('主进程: 剪切板内容:', text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : '(空)');
    return text;
  } catch (error) {
    console.error('主进程: 读取剪切板失败:', error);
    return '';
  }
});

ipcMain.handle('set-clipboard-text', (event, text) => {
  try {
    console.log('主进程: 设置剪切板内容:', text ? `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"` : '(空)');
    clipboard.writeText(text);
    console.log('主进程: 剪切板内容设置成功');
    return true;
  } catch (error) {
    console.error('主进程: 设置剪切板失败:', error);
    return false;
  }
}); 