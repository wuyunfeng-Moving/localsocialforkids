const fs = require('fs');
const path = require('path');

// 确保目录存在
const assetsDir = path.resolve(__dirname, '../assets/images');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('Created assets/images directory');
}

// 1x1 透明 PNG 的 base64 编码
const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// 创建必要的图像文件
const imageFiles = ['favicon.png', 'icon.png', 'splash.png', 'adaptive-icon.png'];
for (const file of imageFiles) {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(transparentPngBase64, 'base64'));
    console.log(`Created ${file} at ${filePath}`);
  }
} 