# 二维码标签生成器

一个用于生成带二维码的设备标签的React应用，支持从Excel文件导入数据，批量生成PDF标签。

## 功能特性

- 📁 **Excel文件导入**：支持上传Excel文件，自动解析数据
- 📱 **二维码生成**：为每个设备生成唯一的二维码，包含设备信息链接
- 🏷️ **标签预览**：实时预览标签效果，支持多标签同时预览
- ✅ **数据选择**：支持勾选需要生成标签的数据，默认全选
- 📄 **PDF批量生成**：为选中的数据批量生成PDF标签
- 🎨 **自定义选项**：可选择是否包含品牌、类别、序列号、来源等信息
- 📱 **响应式设计**：适配不同屏幕尺寸

## 技术栈

- React 18
- Vite
- Ant Design
- QRCode.js
- jsPDF
- html2canvas
- xlsx

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/YanhaiSun/pc_tag_react.git
cd pc_tag_react
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

## 使用方法

### 1. 上传Excel文件

点击「上传Excel文件」按钮，选择包含设备信息的Excel文件。Excel文件应包含以下列：
- 品牌
- 类别
- 序列号
- 来源

### 2. 预览数据

文件上传后，系统会自动解析数据并在表格中显示。您可以：
- 查看所有设备数据
- 翻页浏览数据
- 勾选需要生成标签的数据（默认全选）

### 3. 标签预览

在「标签预览」区域，您可以看到当前页数据的标签预览效果：
- 每个标签包含二维码和设备信息
- 标签会随表格翻页自动更新
- 序列号过长时会自动换行

### 4. 生成选项

在「生成选项」区域，您可以选择标签中包含的信息：
- 包含品牌信息
- 包含来源信息
- 包含序列号
- 包含类别

### 5. 生成PDF

点击「生成PDF」按钮，系统会：
- 为所有选中的数据生成标签
- 自动下载PDF文件
- 显示生成进度

## 部署

### 本地部署

1. 构建生产版本：
   ```bash
   npm run build
   ```

2. 部署到本地服务器：
   - 使用 `npm run preview` 预览生产版本
   - 或使用其他静态文件服务器，如 `serve`：
     ```bash
     npm install -g serve
     serve dist
     ```

### 服务器部署

1. 构建生产版本：
   ```bash
   npm run build
   ```

2. 将 `dist` 目录上传到您的服务器

3. 配置服务器（以Nginx为例）：
   ```nginx
   location /pc-tag {
       alias /path/to/dist/;
       index index.html index.htm;
       try_files $uri $uri/ /pc-tag/index.html;
   }
   ```

## 项目结构

```
pc_tag_react/
├── public/           # 静态资源
│   └── qr.svg        # 二维码图标
├── src/              # 源代码
│   ├── App.jsx       # 主应用组件
│   ├── App.css       # 样式文件
│   └── main.jsx      # 入口文件
├── index.html        # HTML模板
├── vite.config.js    # Vite配置
├── package.json      # 项目配置
└── README.md         # 项目说明
```

## 注意事项

1. **文件大小限制**：Excel文件大小不能超过100MB
2. **数据格式**：Excel文件应包含正确的列名（品牌、类别、序列号、来源）
3. **二维码链接**：二维码包含的链接格式为 `https://www.jiandaoyun.com/dashboard/app/6912cdd2a1396f1d50a5e8f2/form/6912cee796ea9c29dcdd0f9b/data/{data_id}/qr_link`，其中 `{data_id}` 会被替换为实际的设备ID
4. **PDF生成**：大量数据生成PDF可能需要一定时间，请耐心等待

## 故障排除

### 常见问题

1. **文件上传失败**：
   - 检查文件大小是否超过100MB
   - 检查文件格式是否为Excel文件

2. **二维码生成失败**：
   - 检查设备ID是否正确
   - 检查网络连接是否正常

3. **PDF下载失败**：
   - 检查浏览器是否阻止了下载
   - 检查数据量是否过大

4. **标签预览不更新**：
   - 尝试刷新页面
   - 检查浏览器控制台是否有错误信息

## 贡献

欢迎贡献代码、报告问题或提出建议！

## 许可证

MIT License

## 联系方式

- 作者：Yanhai Sun
- GitHub：[YanhaiSun](https://github.com/YanhaiSun)

---

✨ 感谢使用二维码标签生成器！