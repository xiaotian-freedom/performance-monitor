# 网页性能监测器

[![许可证](https://img.shields.io/badge/许可证-MIT-blue.svg)](LICENSE)
[![版本](https://img.shields.io/badge/版本-1.0-brightgreen.svg)](https://github.com/xiaotian-freedom/performance-monitor/releases)

## 简介

网页性能监测器是一个浏览器扩展，用于实时监测网页的加载性能和资源使用情况。它可以帮助开发者快速识别性能瓶颈，优化网页加载速度，提升用户体验。

## 目录

- [特性](#特性)
- [安装](#安装)
- [使用方法](#使用方法)
- [性能指标说明](#性能指标说明)
- [贡献指南](#贡献指南)
- [许可证](#许可证)
- [联系方式](#联系方式)

## 特性

- 实时监测页面加载时间、DOM 节点数量和资源请求数
- 提供核心 Web Vitals 指标监测（FCP、LCP、FID、CLS）
- 资源使用统计（JS、CSS、图片数量及总大小）
- 性能评分系统
- 历史记录保存和对比
- 数据导出功能
- 支持强制刷新和普通刷新

## 安装

### 从 Chrome 应用商店安装

1. 访问 [Chrome 网上应用店](https://chrome.google.com/webstore/category/extensions)（链接待更新）
2. 搜索"网页性能监测器"
3. 点击"添加至 Chrome"

### 手动安装

1. 下载本仓库代码

   ```bash
   git clone https://github.com/xiaotian-freedom/performance-monitor.git
   ```

2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择下载的仓库文件夹

## 使用方法

1. 安装扩展后，在浏览器工具栏中点击扩展图标打开监测面板
2. 访问需要监测的网页
3. 查看实时性能数据
4. 使用"强制刷新"或"普通刷新"按钮重新检测性能
5. 切换到"历史"标签查看历史记录
6. 点击"导出报告"下载性能数据

## 性能指标说明

### 基础指标

- **页面加载时间**：从页面开始加载到完全加载完成的时间
- **DOM 节点数量**：页面中的 DOM 元素总数
- **资源请求数**：加载页面所需的所有资源请求数量
- **内存使用**：页面消耗的内存量

### Web Vitals 指标

- **FCP (首次内容绘制)**：首次有内容渲染到屏幕上的时间
- **LCP (最大内容绘制)**：视口内最大内容元素的渲染时间
- **FID (首次输入延迟)**：用户首次与页面交互到浏览器响应的时间
- **CLS (累积布局偏移)**：页面加载过程中意外布局偏移的程度

### 资源统计

- **JS/CSS/图片数量**：各类资源文件的数量
- **总资源大小**：所有资源的总下载大小

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m '添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

项目维护者: [xiaotian-freedom](https://github.com/xiaotian-freedom)

项目链接: [https://github.com/xiaotian-freedom/performance-monitor](https://github.com/xiaotian-freedom/performance-monitor)

---

用 ❤️ 制作
