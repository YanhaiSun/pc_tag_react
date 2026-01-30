import React, { useState, useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Card, Upload, Button, Checkbox, message, Progress, Typography, Table, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import './App.css'

const { Title, Text } = Typography

function App() {
  const [fileList, setFileList] = useState([])
  const [data, setData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [previewDataList, setPreviewDataList] = useState([])
  const [options, setOptions] = useState({
    brand: true,
    source: true,
    serial: true,
    category: true
  })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const qrCodeRef = useRef(null)
  const pdfBatchesRef = useRef([])
  const multiplePreviewRefs = useRef({})

  // 清理函数
  useEffect(() => {
    // 清理临时 URL 等资源
    return () => {
      // 清理逻辑
    }
  }, [])


  const columns = [
    { title: 'data_id', dataIndex: 'data_id', key: 'data_id' },
    { title: '品牌', dataIndex: '品牌', key: '品牌' },
    { title: '类别', dataIndex: '类别', key: '类别' },
    { title: '来源', dataIndex: '来源', key: '来源' },
    { title: '序列号', dataIndex: '序列号', key: '序列号' }
  ]

  const handleFileChange = (info) => {
    let fileList = [...info.fileList]

    // 过滤掉已上传的文件，只保留最新的一个
    fileList = fileList.slice(-1)

    // 文件大小限制：10MB
    const maxFileSize = 100 * 1024 * 1024
    fileList = fileList.map(file => {
      if (file.size > maxFileSize) {
        file.status = 'error'
        file.error = '文件大小不能超过100MB'
        message.error('文件大小不能超过100MB')
      } else if (file.originFileObj) {
        // 如果文件对象存在，设置状态为done
        file.status = 'done'
      }
      return file
    })

    setFileList(fileList)

    // 自动预览：当文件上传完成后，自动触发预览
    const latestFile = fileList[fileList.length - 1]
    if (latestFile && latestFile.originFileObj) {
      console.log('文件上传完成，自动触发预览:', latestFile.name)
      handlePreview(latestFile)
    }
  }

  // 测试按钮点击事件，用于验证控制台日志
  const testConsoleLog = () => {
    console.log('=== 测试控制台日志 ===')
    console.log('当前时间:', new Date().toLocaleString())
    console.log('数据状态:', data)
    console.log('文件列表:', fileList)
    console.log('加载状态:', loading)
    message.info('测试日志已输出到控制台')
  }

  const handlePreview = async (file) => {
    console.log('=== 开始处理文件预览 ===')
    console.log('文件信息:', file)

    // 验证文件格式
    const validFormats = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'))
    console.log('文件扩展名:', fileExtension)

    if (!validFormats.includes(fileExtension)) {
      console.log('文件格式不支持:', fileExtension)
      message.error('文件格式不支持，请上传.xlsx, .xls或.csv格式的文件')
      return
    }

    setLoading(true)
    console.log('设置loading为true')

    // 确保file.originFileObj存在
    if (!file.originFileObj) {
      console.error('文件对象无效:', file)
      message.error('文件对象无效，请重新上传')
      setLoading(false)
      console.log('设置loading为false - 文件对象无效')
      return
    }

    console.log('开始读取文件:', file.originFileObj.name, '大小:', file.originFileObj.size, 'bytes')

    // 简化文件读取和解析逻辑
    try {
      // 直接使用XLSX读取文件，避免FileReader的复杂性
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          console.log('文件读取完成，开始解析Excel')
          const workbook = XLSX.read(e.target.result, { type: 'binary' })
          console.log('Excel解析成功，工作表:', workbook.SheetNames)

          const firstSheet = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheet]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          console.log('数据转换成功，共', jsonData.length, '条数据')
          console.log('前3条数据:', JSON.stringify(jsonData.slice(0, 3), null, 2))

          // 检查数据是否为空
          if (jsonData.length === 0) {
            console.log('文件中没有数据')
            message.error('文件中没有数据')
            setLoading(false)
            return
          }

          // 处理数据，添加缺失字段
          const processedData = jsonData.map((row, index) => ({
            data_id: `id_${index + 1}`,
            品牌: '未知品牌',
            ...row
          }))

          console.log('数据处理完成，处理后数据:', processedData.length, '条')

          // 设置数据
        setData(processedData)
        setPreviewData(processedData[0])
        
        // 默认全选所有数据
        const allRowKeys = processedData.map(item => item.data_id)
        setSelectedRowKeys(allRowKeys)
        
        // 更新预览数据列表，最多显示10条
        const previewList = processedData.slice(0, 10)
        setPreviewDataList(previewList)

        message.success('文件解析成功，共 ' + processedData.length + ' 条数据')
        console.log('文件解析成功，设置数据完成')

          setLoading(false)
          console.log('设置loading为false - 处理完成')
        } catch (error) {
          console.error('Excel解析错误:', error)
          message.error('Excel解析失败: ' + error.message)
          setLoading(false)
        }
      }

      reader.onerror = () => {
        console.error('文件读取错误')
        message.error('文件读取失败，请重试')
        setLoading(false)
      }

      // 以二进制方式读取文件
      reader.readAsBinaryString(file.originFileObj)
    } catch (error) {
      console.error('文件处理错误:', error)
      message.error('文件处理失败: ' + error.message)
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (data.length === 0) {
      message.error('请先上传并预览数据')
      return
    }

    setLoading(true)
    setProgress(0)
    const hideLoading = message.loading('正在生成PDF...', 0)
    pdfBatchesRef.current = []

    try {
      // 创建PDF文档
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [73, 25] // 标签尺寸
      })

      // 只处理选中的数据
      const selectedData = data.filter(item => selectedRowKeys.includes(item.data_id))
      
      if (selectedData.length === 0) {
        hideLoading()
        message.error('请至少选择一条数据')
        setLoading(false)
        setProgress(0)
        return
      }
      
      // 为每个选中的数据项生成标签
      for (let i = 0; i < selectedData.length; i++) {
        const item = selectedData[i]
        
        // 在canvas上绘制标签
        const canvas = await drawLabelOnCanvas(item, options)
        
        // 将canvas转换为数据URL
        const imgData = canvas.toDataURL('image/png')
        
        // 添加图片到PDF
        doc.addImage(imgData, 'PNG', 0, 0, 73, 25)
        
        // 如果不是最后一页，添加新页
        if (i < selectedData.length - 1) {
          doc.addPage()
        }
        
        // 更新进度
        const currentProgress = Math.round(((i + 1) / selectedData.length) * 100)
        setProgress(currentProgress)
      }

      // 保存PDF
      doc.save('二维码标签.pdf')

      hideLoading()
      message.success('PDF生成成功')
      setLoading(false)
      setProgress(0)
      pdfBatchesRef.current = []
    } catch (error) {
      console.error('PDF生成错误:', error)
      hideLoading()
      message.error('PDF生成失败，请重试')
      setLoading(false)
      setProgress(0)
      pdfBatchesRef.current = []
    }
  }

  const handleOptionChange = (e) => {
    setOptions({
      ...options,
      [e.target.name]: e.target.checked
    })
  }

  // 在canvas上绘制完整标签
  const drawLabelOnCanvas = async (item, options) => {
    return new Promise(async (resolve, reject) => {
      try {
        // 创建canvas元素
        const canvas = document.createElement('canvas')
        // 设置canvas尺寸，使用合适的比例确保清晰
        canvas.width = 730 // 73mm * 10
        canvas.height = 250 // 25mm * 10
        const ctx = canvas.getContext('2d')
        
        // 绘制背景和边框
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)
        
        // 生成二维码
        const base_url = 'https://www.jiandaoyun.com/dashboard/app/6912cdd2a1396f1d50a5e8f2/form/6912cee796ea9c29dcdd0f9b/data/{data_id}/qr_link'
        const qrData = base_url.replace('{data_id}', item.data_id)
        
        // 使用QRCode库生成二维码数据URL
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 180, // 二维码尺寸
          margin: 2
        })
        
        // 创建图像对象加载二维码
        const qrImg = new Image()
        qrImg.crossOrigin = 'anonymous'
        
        qrImg.onload = () => {
          try {
            // 绘制二维码
            ctx.drawImage(qrImg, 50, 35, 180, 180) // 调整位置和大小
            
            // 绘制文本信息
            ctx.fillStyle = '#000000'
            ctx.font = '28px Arial, sans-serif'
            ctx.textBaseline = 'top'
            
            // 行高设置为40
            const lineHeight = 40
            
            // 计算文本的辅助函数，用于预测文本占用的行数
            const calculateTextLines = (text, maxWidth) => {
              const words = text.split(' ')
              const lines = []
              let currentLine = words[0]
              
              for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + ' ' + words[i]
                const metrics = ctx.measureText(testLine)
                const testWidth = metrics.width
                
                if (testWidth <= maxWidth) {
                  currentLine = testLine
                } else {
                  lines.push(currentLine)
                  currentLine = words[i]
                }
              }
              lines.push(currentLine)
              
              // 返回预测的行数
              return lines.length
            }
            
            // 计算实际要显示的文本行数，包括序列号可能的换行
            let actualLineCount = 0
            if (options.brand) actualLineCount++
            if (options.category) actualLineCount++
            
            // 计算序列号可能的行数
            if (options.serial) {
              const serialText = item.序列号 || '无'
              const serialFullText = `序列号: ${serialText}`
              const metrics = ctx.measureText(serialFullText)
              const textWidth = metrics.width
              
              if (textWidth > 400) {
                // 序列号会换行，计算实际行数
                const serialLines = calculateTextLines(serialFullText, 400)
                actualLineCount += serialLines
              } else {
                // 序列号不会换行，只算一行
                actualLineCount++
              }
            }
            
            if (options.source) actualLineCount++
            
            // 计算文本起始位置，使其与二维码垂直居中对齐
            // 二维码高度：180，垂直中心：35 + 180/2 = 125
            // 根据实际行数计算总高度，然后计算起始位置
            const totalTextHeight = actualLineCount * lineHeight
            let textY = 125 - totalTextHeight / 2 + 10
            
            // 绘制文本的辅助函数，支持自动换行
            const drawTextWithWrap = (text, x, y, maxWidth) => {
              const words = text.split(' ')
              const lines = []
              let currentLine = words[0]
              
              for (let i = 1; i < words.length; i++) {
                const testLine = currentLine + ' ' + words[i]
                const metrics = ctx.measureText(testLine)
                const testWidth = metrics.width
                
                if (testWidth <= maxWidth) {
                  currentLine = testLine
                } else {
                  lines.push(currentLine)
                  currentLine = words[i]
                }
              }
              lines.push(currentLine)
              
              // 绘制每一行文本
              for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], x, y + (i * lineHeight))
              }
              
              // 返回实际占用的行数
              return lines.length
            }
            
            // 绘制品牌信息
            if (options.brand) {
              const brandText = item.品牌 || '无'
              ctx.fillText(`品牌: ${brandText}`, 250, textY)
              textY += lineHeight
            }
            
            // 绘制类别信息
            if (options.category) {
              const categoryText = item.类别 || '无'
              ctx.fillText(`类别: ${categoryText}`, 250, textY)
              textY += lineHeight
            }
            
            // 绘制序列号信息
            if (options.serial) {
              const serialText = item.序列号 || '无'
              const serialFullText = `序列号: ${serialText}`
              
              // 计算文本宽度，判断是否需要换行
              const metrics = ctx.measureText(serialFullText)
              const textWidth = metrics.width
              
              // 如果文本宽度超过400像素（根据canvas宽度调整），则自动换行
              if (textWidth > 400) {
                // 分割序列号，允许换行
                const lines = drawTextWithWrap(serialFullText, 250, textY, 400)
                textY += lines * lineHeight
              } else {
                // 不需要换行，直接绘制
                ctx.fillText(serialFullText, 250, textY)
                textY += lineHeight
              }
            }
            
            // 绘制来源信息
            if (options.source) {
              const sourceText = item.来源 || '无'
              ctx.fillText(`来源: ${sourceText}`, 250, textY)
            }
            
            resolve(canvas)
          } catch (error) {
            reject(error)
          }
        }
        
        qrImg.onerror = () => {
          reject(new Error('无法加载二维码图像'))
        }
        
        qrImg.src = qrUrl
      } catch (error) {
        reject(error)
      }
    })
  }

  useEffect(() => {
    if (previewData && qrCodeRef.current) {
      // 生成二维码，使用base_url替换{data_id}生成链接
      const base_url = 'https://www.jiandaoyun.com/dashboard/app/6912cdd2a1396f1d50a5e8f2/form/6912cee796ea9c29dcdd0f9b/data/{data_id}/qr_link'
      const qrData = base_url.replace('{data_id}', previewData.data_id)
      QRCode.toCanvas(qrCodeRef.current, qrData, {
        width: 80, // 增大二维码尺寸以确保可扫描
        margin: 2
      }, (error) => {
        if (error) {
          console.error('二维码生成错误:', error)
        }
      })
    }
  }, [previewData])

  // 为多个预览数据项生成二维码
  useEffect(() => {
    if (previewDataList.length > 0) {
      // 使用requestAnimationFrame确保DOM已经更新，canvas元素已经创建
      requestAnimationFrame(() => {
        const base_url = 'https://www.jiandaoyun.com/dashboard/app/6912cdd2a1396f1d50a5e8f2/form/6912cee796ea9c29dcdd0f9b/data/{data_id}/qr_link'
        
        previewDataList.forEach((item) => {
          const canvas = multiplePreviewRefs.current[item.data_id]
          if (canvas) {
            // 清空canvas，准备绘制新的二维码
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            // 绘制新的二维码
            const qrData = base_url.replace('{data_id}', item.data_id)
            QRCode.toCanvas(canvas, qrData, {
              width: 80, // 增大二维码尺寸以确保可扫描
              margin: 2
            }, (error) => {
              if (error) {
                console.error('二维码生成错误:', error)
              }
            })
          }
        })
      })
    }
  }, [previewDataList])

  return (
    <div className="app-container">
      <Title level={2} className="app-title">二维码标签生成器</Title>

      <Card className="upload-card">
        <Title level={4}>1. 上传Excel文件</Title>
        <Upload
          fileList={fileList}
          onChange={handleFileChange}
          onPreview={handlePreview}
          accept=".xlsx,.xls,.csv"
          maxCount={1}
          listType="button"
          customRequest={() => { }}
        >
          <Button icon={<UploadOutlined />}>上传Excel文件</Button>
        </Upload>

      </Card>

      <Card className="preview-card">
        <Title level={4}>2. 数据预览</Title>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="data_id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => {
              setSelectedRowKeys(keys)
              // 更新预览数据列表，最多显示10条选中的数据
              const selectedData = data.filter(item => keys.includes(item.data_id))
              const previewList = selectedData.slice(0, 10)
              setPreviewDataList(previewList)
            },
            selectAll: true
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条数据`
          }}
          onChange={(pagination, filters, sorter, extra) => {
            // 调试：打印所有参数
            console.log('Table onChange params:', {
              pagination,
              filters,
              sorter,
              extra
            })
            
            // 尝试不同的方式获取当前页的数据
            let currentDataSource = []
            
            // 优先使用方式2：根据分页参数从完整数据中计算
            // 这是最可靠的方式，因为pagination参数总是正确的
            if (pagination && Array.isArray(data)) {
              const { current, pageSize } = pagination
              console.log('Pagination info:', { current, pageSize })
              
              const startIndex = (current - 1) * pageSize
              const endIndex = startIndex + pageSize
              console.log('Calculated indices:', { startIndex, endIndex })
              
              currentDataSource = data.slice(startIndex, endIndex)
              console.log('Current data source length:', currentDataSource.length)
            }
            // 方式1：从extra中获取（备用）
            else if (extra && Array.isArray(extra.currentDataSource)) {
              currentDataSource = extra.currentDataSource
              console.log('Using extra.currentDataSource, length:', currentDataSource.length)
            }
            
            console.log('Current data source:', currentDataSource)
            
            if (Array.isArray(currentDataSource) && currentDataSource.length > 0) {
              const previewList = currentDataSource.slice(0, 10)
              console.log('Updating preview list:', previewList)
              
              // 使用展开运算符创建新数组，确保React能检测到变化
              setPreviewDataList([...previewList])
            }
          }}
          scroll={{ y: 400 }}
        />
      </Card>

      <Card className="tag-preview-card">
        <Title level={4}>3. 标签预览</Title>
        <div className="tag-preview-area">
          {previewDataList.length > 0 ? (
            <div className="multiple-tag-preview">
              {previewDataList.map((item) => (
                <div key={item.data_id} className="tag-preview">
                  <div className="tag-qr-code">
                    <canvas ref={(el) => multiplePreviewRefs.current[item.data_id] = el}></canvas>
                  </div>
                  <div className="tag-info">
                    {options.brand && <div>品牌: {item.品牌 || '无'}</div>}
                    {options.category && <div>类别: {item.类别 || '无'}</div>}
                    {options.serial && <div>序列号: {item.序列号 || '无'}</div>}
                    {options.source && <div>来源: {item.来源 || '无'}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Text>请先上传文件并预览数据</Text>
          )}
        </div>
      </Card>

      <Card className="generate-card">
        <Title level={4}>4. 生成选项</Title>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space>
            <Checkbox name="brand" checked={options.brand} onChange={handleOptionChange}>
              包含品牌信息
            </Checkbox>
            <Checkbox name="source" checked={options.source} onChange={handleOptionChange}>
              包含来源信息
            </Checkbox>
            <Checkbox name="serial" checked={options.serial} onChange={handleOptionChange}>
              包含序列号
            </Checkbox>
            <Checkbox name="category" checked={options.category} onChange={handleOptionChange}>
              包含类别
            </Checkbox>
          </Space>
          {progress > 0 && progress < 100 && (
            <Progress
              percent={progress}
              status="active"
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          )}
          <Button
            type="primary"
            onClick={handleGeneratePDF}
            loading={loading}
            style={{ marginTop: 16 }}
            disabled={data.length === 0}
          >
            生成PDF
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default App
