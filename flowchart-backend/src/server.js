const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PlaywrightCrawler } = require('crawlee');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Flowchart backend is running' });
});

// 恢复 PlaywrightCrawler 版本的 /api/crawl 端点
app.post('/api/crawl', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`[CRAWL START - Crawler Mode] URL: ${url}`);
    
    let crawlResult = null;
    let handlerError = null; 
    
    const crawler = new PlaywrightCrawler({
      headless: true,
      maxRequestsPerCrawl: 1,
      requestHandlerTimeoutSecs: 120, 
      navigationTimeoutSecs: 90,     
      // logLevel: LogLevel.DEBUG, // 保留注释掉，以防需要
      
      async requestHandler({ page, request, log }) {
        log.info(`[HANDLER START] Processing page via Crawler: ${request.url}`);
        try {
          // 注意：这里不再需要 page.goto，因为 requestHandler 被调用时，
          // Crawlee 通常已经导航到了 request.url 对应的页面。
          // 我们直接执行等待和评估。
          
          log.info('[HANDLER] Waiting for network idle...');
          await page.waitForLoadState('networkidle', { timeout: 60000 }); 
          log.info('[HANDLER] Network is idle.');

          log.info('[HANDLER] Evaluating page content...');
          const extractedData = await page.evaluate(() => {
            // 尝试选择文章主体
            const articleElement = document.querySelector('article') || 
                                 document.querySelector('main') || 
                                 document.querySelector('.content') ||
                                 document.querySelector('.article') ||
                                 document.body;
            
            // 移除脚本、样式、导航等无关内容
            const elementsToRemove = articleElement.querySelectorAll('script, style, nav, header, footer, aside, iframe, .ads, .navigation, .menu, .sidebar');
            elementsToRemove.forEach(el => el.remove());
            
            // 基本的清理文本（保留段落分隔）
            const cleanText = (articleElement.textContent || '')
              .replace(/\s+/g, ' ')
              .trim();
              
            // 获取结构化内容，保留段落、标题等信息
            const structuredContent = [];
            // 标题
            const headers = articleElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headers.forEach(header => {
              const level = parseInt(header.tagName.substring(1));
              const text = header.textContent?.trim();
              if (text) structuredContent.push({ type: 'header', level, text });
            });
            // 段落
            const paragraphs = articleElement.querySelectorAll('p');
            paragraphs.forEach(para => {
              const text = para.textContent?.trim();
              if (text && text.length > 10) structuredContent.push({ type: 'paragraph', text });
            });
            // 列表
            const lists = articleElement.querySelectorAll('ul, ol');
            lists.forEach(list => {
              const items = [];
              const listItems = list.querySelectorAll('li');
              listItems.forEach(li => {
                const text = li.textContent?.trim();
                if (text) items.push(text);
              });
              if (items.length > 0) {
                structuredContent.push({ type: 'list', items, isordered: list.tagName.toLowerCase() === 'ol' });
              }
            });
            
            // Fallback if structure is empty
            if (structuredContent.length === 0) {
              const allText = cleanText;
              const splitByNewLine = allText.split(/\n+/);
              splitByNewLine.forEach(text => {
                const trimmed = text.trim();
                if (trimmed.length > 30) {
                  structuredContent.push({ type: 'paragraph', text: trimmed });
                }
              });
            }
            
            return {
              cleanText,
              structuredContent
            };
          });
          log.info('[HANDLER] Page evaluation finished.');

          const title = await page.title();
          log.info(`[HANDLER] Page title: ${title}`);
          
          log.info('[HANDLER] Assigning crawl result...');
          crawlResult = {
            url: request.url,
            title: title,
            content: extractedData.cleanText,
            structuredContent: extractedData.structuredContent
          };
          log.info('[HANDLER] Crawl result assigned.');

        } catch (error) {
          log.error(`[HANDLER ERROR] Error during request handling for ${request.url}: ${error.message}`, { stack: error.stack });
          handlerError = error; 
        }
        log.info(`[HANDLER END] Finished processing page: ${request.url}`);
      },
      
      failedRequestHandler({ request, log }) {
         log.error(`[FAILED HANDLER] Request ${request.url} failed too many times or due to navigation error.`);
         if (!handlerError) { 
            handlerError = new Error(`Request failed for ${request.url}, possibly due to navigation or network issues.`);
         } 
      },
    });
    
    console.log('[CRAWLER] Attempting to run crawler...');
    await crawler.run([url]);
    console.log('[CRAWLER] Crawler run finished.');
    
    // 检查结果和错误 (保持之前的逻辑)
    if (!crawlResult && handlerError) {
      console.error(`[CRAWL END - Crawler Mode] Failed due to handler error: ${handlerError.message}`);
      return res.status(500).json({
        error: 'Error during page processing',
        message: handlerError.message || String(handlerError)
      });
    }
    if (!crawlResult) {
      console.error('[CRAWL END - Crawler Mode] Failed: No crawl result obtained and no specific handler error recorded.');
      return res.status(500).json({ error: 'Failed to crawl the URL', message: 'The crawler finished, but no content was successfully extracted. The target page might be inaccessible, protected, or timed out.' });
    }
    
    console.log(`[CRAWL SUCCESS - Crawler Mode] URL: ${url}`);
    res.json({
      url: crawlResult.url,
      title: crawlResult.title,
      content: crawlResult.content,
      structuredContent: crawlResult.structuredContent
    });
    
  } catch (error) {
    console.error(`[CRAWL END - Crawler Mode] Uncaught crawler error: ${error.message}`, { 
      stack: error.stack, 
      details: error 
    });
    res.status(500).json({
      error: 'An unexpected error occurred during crawling setup or execution',
      message: error.message || String(error)
    });
  }
});

// 注释掉或删除直接 Playwright 测试版本的 /api/crawl 端点
/*
app.post('/api/crawl', async (req, res) => {
  let browser = null;
  try {
    // ... Direct Playwright test code ...
  } catch (error) {
    // ... Error handling ...
  }
});
*/

// 内容处理API端点
app.post('/api/extract', (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    console.log(`处理内容: ${title || 'Untitled'}`);
    
    // 简单分割文本为段落
    const paragraphs = content
      .split(/\n+/)
      .filter(para => para.trim().length > 20) // 过滤掉太短的段落
      .slice(0, 10); // 限制段落数量，避免图太大
    
    // 创建节点
    const nodes = paragraphs.map((paragraph, index) => ({
      id: `node-${index + 1}`,
      type: 'custom',
      position: { x: 250, y: 100 + index * 150 }, // 垂直排列节点
      data: {
        label: paragraph.substring(0, 30) + (paragraph.length > 30 ? '...' : ''), // 简短标签
        description: paragraph, // 完整段落作为描述
        type: index % 3 === 0 ? 'typeA' : (index % 3 === 1 ? 'typeB' : 'typeC'), // 轮换节点类型
        handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
        flipped: false
      }
    }));
    
    // 创建边 (简单顺序连接)
    const edges = paragraphs.slice(1).map((_, index) => ({
      id: `edge-${index + 1}-${index + 2}`,
      source: `node-${index + 1}`,
      target: `node-${index + 2}`,
      type: 'custom',
      data: {
        label: index === 0 ? '开始' : (index === paragraphs.length - 2 ? '结束' : '接着')
      }
    }));
    
    // 返回结果
    res.json({
      nodes,
      edges
    });
    
  } catch (error) {
    console.error('内容处理错误:', error);
    res.status(500).json({
      error: 'An error occurred while processing content',
      message: error.message || String(error)
    });
  }
});

// 高级内容处理API端点 - 更智能的结构分析和流程图生成
app.post('/api/extract-advanced', async (req, res) => {
  try {
    const { content, title, originalUrl, structuredContent } = req.body;
    
    if (!content && !structuredContent) {
      return res.status(400).json({ error: 'Content or structuredContent is required' });
    }
    
    console.log(`高级处理内容: ${title || 'Untitled'}`);
    
    // 有两种处理途径：
    // 1. 如果提供了structuredContent（从爬虫提供的结构化内容），优先使用它
    // 2. 如果没有structuredContent，则使用analyzeContentStructure函数分析纯文本
    
    let analyzedStructure;
    
    if (structuredContent && Array.isArray(structuredContent) && structuredContent.length > 0) {
      console.log('使用爬虫提供的结构化内容');
      // 直接使用爬虫提供的结构化内容，但添加标题
      analyzedStructure = [];
      
      // 添加页面标题作为第一个元素（如果它不是标题内容中的第一个标题）
      if (title && (!structuredContent[0] || 
         (structuredContent[0].type !== 'header' && 
          structuredContent[0].text !== title))) {
        analyzedStructure.push({
          type: 'title',
          text: title,
          level: 0
        });
      }
      
      // 合并爬虫的结构化内容
      analyzedStructure = [...analyzedStructure, ...structuredContent];
    } else {
      console.log('使用文本分析来创建结构化内容');
      // 使用文本分析来识别结构
      analyzedStructure = analyzeContentStructure(content, title);
    }
    
    // 限制数量以避免图表过大，优先保留标题和结构信息
    // 首先分离标题和其他内容
    const titleElements = analyzedStructure.filter(
      item => item.type === 'title' || item.type === 'header'
    );
    const otherElements = analyzedStructure.filter(
      item => item.type !== 'title' && item.type !== 'header'
    );
    
    // 如果有太多非标题元素，只保留最重要的部分
    let finalStructure;
    if (titleElements.length + otherElements.length > 15) {
      // 最多保留15个项目，优先保留标题
      const availableOtherSlots = Math.max(0, 15 - titleElements.length);
      const keepOtherElements = otherElements.slice(0, availableOtherSlots);
      finalStructure = [...titleElements, ...keepOtherElements];
    } else {
      finalStructure = analyzedStructure;
    }
    
    // 根据分析的结构生成流程图
    const { nodes, edges } = generateFlowFromStructure(finalStructure);
    
    // 返回结果
    res.json({
      nodes,
      edges
    });
    
  } catch (error) {
    console.error('高级内容处理错误:', error);
    res.status(500).json({
      error: 'An error occurred while processing content with advanced method',
      message: error.message || String(error)
    });
  }
});

/**
 * 分析内容结构，识别标题、列表和段落等元素
 * @param {string} content - 文本内容
 * @param {string} title - 页面标题
 * @returns {Array} 结构化的内容数组
 */
function analyzeContentStructure(content, title) {
  // 结构化内容数组，每个项目包含类型和文本
  const structuredContent = [];
  
  // 添加标题作为第一个元素
  if (title) {
    structuredContent.push({
      type: 'title',
      text: title,
      level: 0
    });
  }
  
  // 尝试识别文本中的标题（通过模式如数字+句点或特殊标记）
  const lines = content.split(/\n+/);
  
  // 标题正则模式
  const headerPatterns = [
    { regex: /^(第[一二三四五六七八九十\d]+[章节篇部])[：:\s]+(.+)$/i, level: 1 }, // 第一章: 标题
    { regex: /^([一二三四五六七八九十]{1,2}[、\.\s]+)(.+)$/i, level: 2 }, // 一、标题
    { regex: /^(\d+[\.\s]+)(.+)$/i, level: 2 }, // 1. 标题
    { regex: /^([A-Z][\.\s]+)(.+)$/i, level: 2 }, // A. 标题
  ];
  
  // 列表项正则模式
  const listItemPatterns = [
    { regex: /^[•\-\*\+◦○●♦※][\s]+(.+)$/i }, // • - * + 列表项
    { regex: /^(\(\d+\)|\d+\))[\s]+(.+)$/i }, // (1) 或 1) 列表项
    { regex: /^([a-z](\)|\.))\s+(.+)$/i }, // a) 或 a. 列表项
  ];
  
  let currentListItems = [];
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return; // 跳过空行
    
    // 判断行是否是标题
    let isHeader = false;
    for (const pattern of headerPatterns) {
      const match = trimmedLine.match(pattern.regex);
      if (match) {
        // 如果有待处理的列表项，先添加它们
        if (currentListItems.length > 0) {
          structuredContent.push({
            type: 'list',
            items: [...currentListItems]
          });
          currentListItems = [];
        }
        
        structuredContent.push({
          type: 'header',
          text: match[2] || match[0],
          level: pattern.level
        });
        isHeader = true;
        break;
      }
    }
    if (isHeader) return;
    
    // 判断行是否是列表项
    let isListItem = false;
    for (const pattern of listItemPatterns) {
      const match = trimmedLine.match(pattern.regex);
      if (match) {
        const itemText = match[match.length - 1] || match[0];
        currentListItems.push(itemText);
        isListItem = true;
        break;
      }
    }
    if (isListItem) return;
    
    // 如果不是标题或列表项，判断是否是段落
    // 实际逻辑中可能需要更复杂的判断，比如句子长度、标点符号等
    if (trimmedLine.length > 20) {
      // 如果有待处理的列表项，先添加它们
      if (currentListItems.length > 0) {
        structuredContent.push({
          type: 'list',
          items: [...currentListItems]
        });
        currentListItems = [];
      }
      
      structuredContent.push({
        type: 'paragraph',
        text: trimmedLine
      });
    }
  });
  
  // 处理末尾可能剩余的列表项
  if (currentListItems.length > 0) {
    structuredContent.push({
      type: 'list',
      items: [...currentListItems]
    });
  }
  
  // 对结构化内容进行处理，限制数量避免图太大
  return structuredContent.slice(0, 15);
}

/**
 * 根据结构化内容生成流程图节点和边
 * @param {Array} structuredContent - 结构化内容数组
 * @returns {Object} 包含节点和边的对象
 */
function generateFlowFromStructure(structuredContent) {
  const nodes = [];
  const edges = [];
  
  // 节点ID计数器
  let nodeId = 1;
  
  // 记录上一个节点ID，用于连接
  let lastNodeId = null;
  // 记录当前所属的标题节点ID
  let currentHeaderId = null;
  // 记录当前所属层次的标题节点ID，按层级索引
  const headerNodesByLevel = {};
  
  structuredContent.forEach((item, index) => {
    let newNodeId = `node-${nodeId++}`;
    
    switch(item.type) {
      case 'title':
      case 'header':
        // 为标题创建节点
        nodes.push({
          id: newNodeId,
          type: 'custom',
          position: { x: 250, y: 100 + nodes.length * 150 }, // 位置稍后会通过自动布局调整
          data: {
            label: item.text.substring(0, 40) + (item.text.length > 40 ? '...' : ''), // 标题可以稍长
            description: item.text,
            type: item.type === 'title' ? 'typeA' : 'typeB', // 标题使用蓝色节点，子标题使用绿色
            handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
            flipped: false
          }
        });
        
        // 记录标题节点ID
        if (item.level !== undefined) {
          headerNodesByLevel[item.level] = newNodeId;
          
          // 如果存在上一级标题，连接到它
          if (item.level > 0 && headerNodesByLevel[item.level - 1]) {
            edges.push({
              id: `edge-${headerNodesByLevel[item.level - 1]}-${newNodeId}`,
              source: headerNodesByLevel[item.level - 1],
              target: newNodeId,
              type: 'custom',
              data: {
                label: '包含'
              }
            });
          }
        }
        
        // 更新当前标题ID
        currentHeaderId = newNodeId;
        lastNodeId = newNodeId;
        break;
        
      case 'list':
        // 为列表创建一个节点
        nodes.push({
          id: newNodeId,
          type: 'custom',
          position: { x: 250, y: 100 + nodes.length * 150 },
          data: {
            label: `列表 (${item.items.length}项)`,
            description: item.items.join('\n• '),
            type: 'typeC', // 列表使用黄色节点
            handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
            flipped: false
          }
        });
        
        // 如果有当前标题，连接到标题
        if (currentHeaderId) {
          edges.push({
            id: `edge-${currentHeaderId}-${newNodeId}`,
            source: currentHeaderId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '列表'
            }
          });
        } 
        // 否则连接到上一个节点
        else if (lastNodeId) {
          edges.push({
            id: `edge-${lastNodeId}-${newNodeId}`,
            source: lastNodeId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '接着'
            }
          });
        }
        
        lastNodeId = newNodeId;
        break;
        
      case 'paragraph':
        // 为段落创建节点
        nodes.push({
          id: newNodeId,
          type: 'custom',
          position: { x: 250, y: 100 + nodes.length * 150 },
          data: {
            label: item.text.substring(0, 30) + (item.text.length > 30 ? '...' : ''),
            description: item.text,
            type: 'typeB', // 段落使用绿色节点
            handleCounts: { top: 1, bottom: 1, left: 1, right: 1 },
            flipped: false
          }
        });
        
        // 如果有当前标题，连接到标题
        if (currentHeaderId) {
          edges.push({
            id: `edge-${currentHeaderId}-${newNodeId}`,
            source: currentHeaderId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '内容'
            }
          });
        } 
        // 否则连接到上一个节点
        else if (lastNodeId) {
          edges.push({
            id: `edge-${lastNodeId}-${newNodeId}`,
            source: lastNodeId,
            target: newNodeId,
            type: 'custom',
            data: {
              label: '接着'
            }
          });
        }
        
        lastNodeId = newNodeId;
        break;
    }
  });
  
  return { nodes, edges };
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 