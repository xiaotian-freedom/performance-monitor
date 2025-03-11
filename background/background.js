// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.type === 'PERFORMANCE_DATA') {
    // 存储性能数据
    chrome.storage.local.set({
      [`performance_${Date.now()}`]: {
        url: sender.tab.url,
        tabId: sender.tab.id,
        timestamp: Date.now(),
        data: request.data
      }
    });
  }
});

// 存储当前活动的窗口ID
let activePopupWindowId = null;

// 处理扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  const popupURL = chrome.runtime.getURL('popup.html');
  chrome.windows.create({
    url: popupURL,
    type: 'popup',
    width: 400,
    height: 600,
    focused: true,
    top: 100,
    left: 100
  }, (window) => {
    activePopupWindowId = window.id;
  });
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && activePopupWindowId) {
    // 向popup发送更新消息
    chrome.runtime.sendMessage({
      type: 'TAB_UPDATED',
      tabId: tabId,
      url: tab.url
    });
  }
});

// 监听标签页激活
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (activePopupWindowId) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      // 向popup发送标签页切换消息
      chrome.runtime.sendMessage({
        type: 'TAB_CHANGED',
        tabId: activeInfo.tabId,
        url: tab.url
      });
    });
  }
});

// 监听窗口关闭
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === activePopupWindowId) {
    activePopupWindowId = null;
  }
}); 