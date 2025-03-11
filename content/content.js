// 性能评分计算
const calculatePerformanceScore = (metrics) => {
  // 如果加载时间未完成，返回 undefined
  if (!metrics.loadTime || metrics.loadTime === 0) {
    return undefined;
  }

  // 对于超长加载时间，直接返回极低分数
  if (metrics.loadTime > 30000) return 0;  // 30秒以上直接给0分
  if (metrics.loadTime > 20000) return 10; // 20-30秒给10分
  if (metrics.loadTime > 10000) return 20; // 10-20秒给20分
  if (metrics.loadTime > 5000) return 30;  // 5-10秒给30分

  const scores = {
    // 加载时间更严格的分级
    loadTime: metrics.loadTime < 500 ? 100 : 
              (metrics.loadTime < 1000 ? 80 : 
              (metrics.loadTime < 2000 ? 60 : 
              (metrics.loadTime < 3000 ? 40 : 
              (metrics.loadTime < 4000 ? 20 : 10)))),
    
    // FCP
    fcp: metrics.fcp < 500 ? 100 : 
         (metrics.fcp < 1000 ? 80 : 
         (metrics.fcp < 2000 ? 50 : 10)),
    
    // LCP
    lcp: metrics.lcp < 800 ? 100 : 
         (metrics.lcp < 1500 ? 80 : 
         (metrics.lcp < 2500 ? 50 : 10)),
    
    // FID
    fid: metrics.fid < 40 ? 100 : 
         (metrics.fid < 80 ? 80 : 
         (metrics.fid < 150 ? 50 : 10)),
    
    // CLS
    cls: metrics.cls < 0.03 ? 100 : 
         (metrics.cls < 0.08 ? 80 : 
         (metrics.cls < 0.12 ? 50 : 10)),

    // 内存使用更严格的分级
    memoryUsage: metrics.memoryUsage < 30 ? 100 : 
                 (metrics.memoryUsage < 50 ? 80 : 
                 (metrics.memoryUsage < 100 ? 50 : 10)),

    // DOM节点数更严格的分级
    domCount: metrics.domCount < 300 ? 100 : 
              (metrics.domCount < 600 ? 80 : 
              (metrics.domCount < 1000 ? 50 : 10)),

    // 资源数量更严格的分级
    resourceCount: metrics.resourceCount < 15 ? 100 : 
                  (metrics.resourceCount < 30 ? 80 : 
                  (metrics.resourceCount < 50 ? 50 : 10))
  };
  
  // 显著增加加载时间的权重，降低其他指标的权重
  const weights = {
    loadTime: 5.0,        // 加载时间权重大幅提升
    fcp: 1.0,
    lcp: 1.2,
    fid: 0.8,
    cls: 0.8,
    memoryUsage: 0.8,
    domCount: 0.7,
    resourceCount: 0.7
  };

  // 计算加权平均分
  const validScores = Object.entries(scores)
    .filter(([key, value]) => metrics[key] !== undefined && metrics[key] !== 0)
    .map(([key, value]) => ({
      score: value,
      weight: weights[key]
    }));

  // 确保至少有加载时间这个指标
  if (!validScores.find(item => scores.loadTime !== undefined)) {
    return undefined;
  }

  const totalWeight = validScores.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = validScores.reduce((sum, item) => sum + item.score * item.weight, 0);

  // 最终分数
  const finalScore = Math.round(weightedScore / totalWeight);

  // 如果加载时间超过3秒，最高分不超过60
  if (metrics.loadTime > 3000) {
    return Math.min(finalScore, 60);
  }

  return finalScore;
};

// 收集 Web Vitals 指标
let webVitals = {
  lcp: { value: 0, recorded: false },
  fid: { value: 0, recorded: false },
  cls: { value: 0, recorded: false },
  fcp: { value: 0, recorded: false }
};

// FCP
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    webVitals.fcp = {
      value: fcpEntry.startTime,
      recorded: true
    };
  }
}).observe({ entryTypes: ['paint'], buffered: true });

// LCP
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  if (entries.length > 0) {
    webVitals.lcp = {
      value: entries[entries.length - 1].startTime,
      recorded: true
    };
  }
}).observe({ entryTypes: ['largest-contentful-paint'], buffered: true });

// FID
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  if (entries.length > 0) {
    webVitals.fid = {
      value: entries[0].processingStart - entries[0].startTime,
      recorded: true
    };
  }
}).observe({ entryTypes: ['first-input'], buffered: true });

// CLS
let clsValue = 0;
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  entries.forEach(entry => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  });
  webVitals.cls = {
    value: clsValue,
    recorded: true
  };
}).observe({ entryTypes: ['layout-shift'], buffered: true });

// 监听来自弹出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PERFORMANCE_METRICS') {
    // 尝试从 performance.getEntriesByType('navigation') 获取导航数据
    const navEntry = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    
    const metrics = {
      // 基础指标
      loadTime: navEntry ? Math.round(navEntry.loadEventEnd) : 
                Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart),
      domCount: document.getElementsByTagName('*').length,
      resourceCount: resources.length,
      memoryUsage: Math.round(performance.memory?.usedJSHeapSize / (1024 * 1024)) || 0,
      
      // Web Vitals
      fcp: webVitals.fcp.recorded ? Math.round(webVitals.fcp.value) : undefined,
      lcp: webVitals.lcp.recorded ? Math.round(webVitals.lcp.value) : undefined,
      fid: webVitals.fid.recorded ? Math.round(webVitals.fid.value) : undefined,
      cls: webVitals.cls.recorded ? Math.round(webVitals.cls.value * 1000) / 1000 : undefined,
      
      // 资源统计
      jsCount: resources.filter(r => r.initiatorType === 'script').length,
      cssCount: resources.filter(r => r.initiatorType === 'css').length,
      imageCount: resources.filter(r => r.initiatorType === 'img').length,
      totalSize: Math.round(resources.reduce((total, r) => {
        const size = r.transferSize || r.encodedBodySize || 0;
        return total + size;
      }, 0) / 1024) || 0
    };
    
    metrics.performanceScore = calculatePerformanceScore(metrics);
    sendResponse(metrics);
  }
  return true;
});

// 记录页面性能数据
const recordPerformance = () => {
  // 延迟执行以确保所有性能数据都已收集
  setTimeout(() => {
    const performanceData = {
      timing: performance.timing,
      memory: performance.memory,
      resources: performance.getEntriesByType('resource'),
      webVitals: {
        fcp: webVitals.fcp,
        lcp: webVitals.lcp,
        fid: webVitals.fid,
        cls: webVitals.cls
      }
    };
    
    chrome.runtime.sendMessage({
      type: 'PERFORMANCE_DATA',
      data: performanceData
    });
  }, 3000);
};

// 在页面加载完成后开始记录性能数据
window.addEventListener('load', recordPerformance); 