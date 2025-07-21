// 飞书自动同步工具
interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
  enabled: boolean;
  autoSync: boolean;
}

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
  deviceId: string;
  tags?: string[];
  syncStatus: 'local' | 'synced' | 'failed';
}

// 飞书自动同步
export const autoSyncToFeishu = async (item: ClipboardItem): Promise<boolean> => {
  try {
    // 检查是否已配置飞书API
    const savedConfig = localStorage.getItem('feishu-config');
    if (!savedConfig) {
      console.log('飞书自动同步: 未配置飞书API');
      return false;
    }

    let config: FeishuConfig;
    try {
      config = JSON.parse(savedConfig);
    } catch (error) {
      console.log('飞书自动同步: 配置解析失败');
      return false;
    }

    if (!config.enabled || !config.autoSync || !config.appId || !config.appSecret || !config.appToken || !config.tableId) {
      console.log('飞书自动同步: 配置不完整或未启用自动同步');
      return false;
    }

    // 检查是否已经同步过
    const syncedItems = JSON.parse(localStorage.getItem('feishu_synced_items') || '[]');
    if (syncedItems.includes(item.id)) {
      console.log('飞书自动同步: 项目已同步过', item.id);
      return true;
    }

    console.log('飞书自动同步: 开始同步项目', item.id);

    // 1. 获取access token
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
    if (tokenData.code !== 0) {
      console.error('飞书自动同步: 获取token失败', tokenData.msg);
      return false;
    }

    // 清理Table ID，移除可能的view参数
    const cleanTableId = config.tableId.split('&')[0];

    // 2. 创建记录
    const recordData = {
      fields: {
        '内容': item.content,
        '日期': Math.floor(new Date(item.timestamp).getTime() / 1000), // 使用时间戳格式
        '设备': item.deviceId || '未知设备',
        '状态': '已同步'
      }
    };

    console.log('飞书自动同步: 发送数据', recordData);

    const createResponse = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${cleanTableId}/records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.tenant_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData)
      }
    );

    const responseData = await createResponse.json();

    if (createResponse.ok && responseData.code === 0) {
      console.log('飞书自动同步: 同步成功', responseData);
      
      // 保存同步状态到localStorage
      if (!syncedItems.includes(item.id)) {
        syncedItems.push(item.id);
        localStorage.setItem('feishu_synced_items', JSON.stringify(syncedItems));
      }
      
      return true;
    } else {
      console.error('飞书自动同步: 同步失败', responseData);
      return false;
    }
  } catch (error) {
    console.error('飞书自动同步: 异常错误', error);
    return false;
  }
};

// 检查飞书自动同步是否启用
export const isFeishuAutoSyncEnabled = (): boolean => {
  try {
    const savedConfig = localStorage.getItem('feishu-config');
    if (!savedConfig) {
      console.log('飞书自动同步检查: 未找到配置');
      return false;
    }
    
    const config = JSON.parse(savedConfig);
    console.log('飞书自动同步检查: 当前配置', {
      enabled: config.enabled,
      autoSync: config.autoSync,
      hasAppId: !!config.appId,
      hasAppSecret: !!config.appSecret,
      hasAppToken: !!config.appToken,
      hasTableId: !!config.tableId
    });
    
    const isEnabled = config.enabled && config.autoSync && config.appId && config.appSecret && config.appToken && config.tableId;
    console.log('飞书自动同步检查: 结果', isEnabled);
    return isEnabled;
  } catch (error) {
    console.error('飞书自动同步检查: 配置解析错误', error);
    return false;
  }
}; 