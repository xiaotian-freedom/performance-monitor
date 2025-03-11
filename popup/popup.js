let updateTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前活动标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 向内容脚本发送消息获取性能数据
  chrome.tabs.sendMessage(tab.id, { type: 'GET_PERFORMANCE_METRICS' }, (response) => {
    if (response) {
      document.getElementById('loadTime').textContent = `${response.loadTime}ms`;
      document.getElementById('domCount').textContent = response.domCount;
      document.getElementById('resourceCount').textContent = response.resourceCount;
      document.getElementById('memoryUsage').textContent = `${response.memoryUsage}MB`;
    }
  });
});

// 标签切换
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}Tab`).classList.remove('hidden');
    
    if (btn.dataset.tab === 'history') {
      loadHistory();
    }
  });
});

// 加载性能数据
const loadPerformanceData = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    console.log('No active tab found');
    return;
  }

  try {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_PERFORMANCE_METRICS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Error:', chrome.runtime.lastError);
        return;
      }

      if (response) {
        // 先更新加载时间
        document.getElementById('loadTime').textContent = 
          response.loadTime ? `${response.loadTime}ms` : '等待中...';

        // 只有在加载时间存在时才更新性能评分
        const scoreElement = document.getElementById('performanceScore');
        const score = response.performanceScore;
        
        if (!response.loadTime || response.loadTime === 0) {
          scoreElement.textContent = '评估中...';
          scoreElement.style.backgroundColor = '#9E9E9E';  // 灰色
        } else if (score === undefined || score === 0) {
          scoreElement.textContent = '评估中...';
          scoreElement.style.backgroundColor = '#9E9E9E';  // 灰色
        } else {
          scoreElement.textContent = `${score}分`;
          scoreElement.style.backgroundColor = 
            score >= 90 ? '#4CAF50' :  // 绿色
            score >= 70 ? '#FFC107' :  // 黄色
            '#F44336';                 // 红色
        }
        
        // 更新其他指标
        document.getElementById('domCount').textContent = 
          response.domCount || '等待中...';
        document.getElementById('resourceCount').textContent = 
          response.resourceCount || '等待中...';
        document.getElementById('memoryUsage').textContent = 
          response.memoryUsage ? `${response.memoryUsage}MB` : '等待中...';
        
        // 更新 Web Vitals
        document.getElementById('fcp').textContent = 
          response.fcp ? `${response.fcp}ms` : '等待中...';
        document.getElementById('lcp').textContent = 
          response.lcp ? `${response.lcp}ms` : '等待中...';
        document.getElementById('fid').textContent = 
          response.fid ? `${response.fid}ms` : '等待中...';
        document.getElementById('cls').textContent = 
          response.cls !== undefined ? response.cls : '等待中...';
        
        // 更新资源统计
        document.getElementById('jsCount').textContent = 
          response.jsCount !== undefined ? response.jsCount : '等待中...';
        document.getElementById('cssCount').textContent = 
          response.cssCount !== undefined ? response.cssCount : '等待中...';
        document.getElementById('imageCount').textContent = 
          response.imageCount !== undefined ? response.imageCount : '等待中...';
        document.getElementById('totalSize').textContent = 
          response.totalSize ? formatFileSize(response.totalSize) : '等待中...';
      }
    });
  } catch (error) {
    console.log('Error:', error);
  }
};

// 加载历史记录
const loadHistory = async () => {
  const history = await chrome.storage.local.get(null);
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  Object.entries(history)
    .filter(([key]) => key.startsWith('performance_'))
    .sort(([, a], [, b]) => b.timestamp - a.timestamp)
    .forEach(([key, data]) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-item-title">${data.url}</div>
        <div class="history-item-meta">
          <span>${new Date(data.timestamp).toLocaleString()}</span>
          <span>加载时间: ${data.data.timing.loadEventEnd - data.data.timing.navigationStart}ms</span>
        </div>
      `;
      
      // 添加点击事件处理
      item.addEventListener('click', () => {
        // 在新标签页中打开URL
        chrome.tabs.create({ url: data.url });
      });
      
      historyList.appendChild(item);
    });
};

// 导出报告
document.getElementById('exportBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'GET_PERFORMANCE_METRICS' }, (response) => {
    if (response) {
      const report = {
        url: tab.url,
        timestamp: new Date().toISOString(),
        metrics: response
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${new Date().getTime()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    }
  });
});

// 清除历史
document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
  if (confirm('确定要清除所有历史记录吗？')) {
    const keys = Object.keys(await chrome.storage.local.get(null))
      .filter(key => key.startsWith('performance_'));
    await chrome.storage.local.remove(keys);
    loadHistory();
  }
});

// 添加自动更新函数
const startAutoUpdate = () => {
  // 每3秒更新一次数据
  updateTimer = setInterval(loadPerformanceData, 3000);
};

const stopAutoUpdate = () => {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
};

// 修改初始化代码
document.addEventListener('DOMContentLoaded', () => {
  loadPerformanceData();
  startAutoUpdate();
});

// 添加页面可见性变化监听
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoUpdate();
  } else {
    startAutoUpdate();
  }
});

// 添加窗口焦点变化监听
window.addEventListener('focus', startAutoUpdate);
window.addEventListener('blur', stopAutoUpdate);

// 在页面关闭时清理
window.addEventListener('unload', stopAutoUpdate);

// 在 loadPerformanceData 函数中修改 Web Vitals 的显示逻辑
const formatMetricValue = (value, unit = 'ms') => {
  if (value === undefined) return '等待数据...';
  return `${value}${unit}`;
};

// 添加文件大小格式化函数
const formatFileSize = (sizeInKB) => {
  if (sizeInKB === undefined || sizeInKB === 0) return '0 KB';
  if (sizeInKB < 1024) return `${sizeInKB} KB`;
  return `${(sizeInKB / 1024).toFixed(2)} MB`;
};

// 添加消息监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TAB_UPDATED' || message.type === 'TAB_CHANGED') {
    // 重新获取性能数据
    updatePerformanceData(message.tabId);
  }
});

// 更新性能数据的函数
function updatePerformanceData(tabId) {
  chrome.storage.local.get(null, (items) => {
    // 筛选当前标签页的性能数据
    const performanceEntries = Object.entries(items)
      .filter(([key, value]) => key.startsWith('performance_'))
      .filter(([key, value]) => {
        // 根据URL匹配相关数据
        return value.tabId === tabId;
      })
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    // 更新UI显示
    displayPerformanceData(performanceEntries);
  });
}

// 显示性能数据的函数
function displayPerformanceData(entries) {
  // 根据你的UI结构更新显示
  // ... 更新UI的代码 ...
}

// 初始化时获取当前标签页数据
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    updatePerformanceData(tabs[0].id);
  }
});

// 强制刷新按钮点击处理
document.getElementById('refreshBtn').addEventListener('click', async () => {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // 清除性能指标显示
  resetPerformanceDisplay();

  // 先清除缓存
  try {
    await chrome.browsingData.removeCache({
      "since": Date.now() - 1000
    });
  } catch (error) {
    console.log('清除缓存失败:', error);
  }

  // 强制重新加载当前页面
  chrome.tabs.reload(tab.id, {
    bypassCache: true
  });

  // 显示加载动画
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.classList.add('loading');
  refreshBtn.disabled = true;

  // 3秒后恢复按钮状态
  setTimeout(() => {
    refreshBtn.classList.remove('loading');
    refreshBtn.disabled = false;
  }, 3000);
});

// 普通刷新按钮点击处理
document.getElementById('normalRefreshBtn').addEventListener('click', async () => {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // 清除性能指标显示
  resetPerformanceDisplay();

  // 普通刷新页面
  chrome.tabs.reload(tab.id, {
    bypassCache: false  // 使用缓存
  });

  // 显示加载动画
  const normalRefreshBtn = document.getElementById('normalRefreshBtn');
  normalRefreshBtn.classList.add('loading');
  normalRefreshBtn.disabled = true;

  // 3秒后恢复按钮状态
  setTimeout(() => {
    normalRefreshBtn.classList.remove('loading');
    normalRefreshBtn.disabled = false;
  }, 3000);
});

// 重置性能指标显示
function resetPerformanceDisplay() {
  // 重置综合得分
  const scoreElement = document.getElementById('performanceScore');
  scoreElement.textContent = '评估中...';
  scoreElement.style.backgroundColor = '#9E9E9E';  // 灰色

  // 重置基础指标
  document.getElementById('loadTime').textContent = '等待中...';
  document.getElementById('domCount').textContent = '等待中...';
  document.getElementById('resourceCount').textContent = '等待中...';
  document.getElementById('memoryUsage').textContent = '等待中...';
  
  // 重置 Web Vitals
  document.getElementById('fcp').textContent = '等待中...';
  document.getElementById('lcp').textContent = '等待中...';
  document.getElementById('fid').textContent = '等待中...';
  document.getElementById('cls').textContent = '等待中...';
  
  // 重置资源统计
  document.getElementById('jsCount').textContent = '等待中...';
  document.getElementById('cssCount').textContent = '等待中...';
  document.getElementById('imageCount').textContent = '等待中...';
  document.getElementById('totalSize').textContent = '等待中...';
} 