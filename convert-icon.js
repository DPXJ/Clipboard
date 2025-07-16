const fs = require('fs');
const path = require('path');

// 简单的SVG到PNG转换（使用Canvas）
const { createCanvas, loadImage } = require('canvas');

async function convertSvgToPng() {
  try {
    // 读取SVG文件
    const svgPath = path.join(__dirname, 'electron', 'icon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // 创建一个简单的PNG图标（256x256）
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#357ABD');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // 绘制原子核
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(128, 128, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#2E5BBA';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#4A90E2';
    ctx.beginPath();
    ctx.arc(128, 128, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制电子轨道
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    
    // 轨道1
    ctx.beginPath();
    ctx.ellipse(128, 128, 60, 25, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 轨道2
    ctx.beginPath();
    ctx.ellipse(128, 128, 45, 35, Math.PI / 3, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 轨道3
    ctx.beginPath();
    ctx.ellipse(128, 128, 35, 45, 2 * Math.PI / 3, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 绘制电子
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(188, 128, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(173, 93, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(163, 173, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // 保存PNG文件
    const pngPath = path.join(__dirname, 'electron', 'icon.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pngPath, buffer);
    
    console.log('图标转换完成！');
  } catch (error) {
    console.error('转换失败:', error);
  }
}

convertSvgToPng(); 