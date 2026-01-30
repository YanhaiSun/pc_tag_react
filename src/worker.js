// 导入所需的库
import XLSX from 'xlsx'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

// 监听消息
self.onmessage = async (e) => {
  const { type, payload } = e.data

  try {
    switch (type) {
      case 'parseExcel':
        await handleParseExcel(payload)
        break
      case 'generatePDF':
        await handleGeneratePDF(payload)
        break
      default:
        self.postMessage({ type: 'error', error: 'Unknown task type' })
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message })
  }
}

// 处理 Excel 文件解析
async function handleParseExcel(payload) {
  const { fileData } = payload
  
  try {
    const data = new Uint8Array(fileData)
    const workbook = XLSX.read(data, { type: 'array' })
    
    // 检查是否有工作表
    if (workbook.SheetNames.length === 0) {
      throw new Error('文件中没有工作表')
    }
    
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)
    
    // 检查是否有数据
    if (jsonData.length === 0) {
      throw new Error('文件中没有数据')
    }
    
    // 验证必要的列是否存在
    const requiredColumns = ['data_id', '品牌', '类别', '序列号', '来源']
    const hasAllColumns = requiredColumns.every(col => 
      jsonData.some(row => row[col] !== undefined && row[col] !== null && row[col] !== '')
    )
    
    if (!hasAllColumns) {
      throw new Error('文件缺少必要的列或列数据为空，请确保包含：data_id, 品牌, 类别, 序列号, 来源')
    }
    
    self.postMessage({ type: 'parseExcelSuccess', data: jsonData })
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message })
  }
}

// 处理 PDF 生成
async function handleGeneratePDF(payload) {
  const { data, options } = payload
  
  try {
    // 分批生成 PDF，每批处理 50 条数据
    const batchSize = 50
    const totalBatches = Math.ceil(data.length / batchSize)
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize
      const endIndex = Math.min((batchIndex + 1) * batchSize, data.length)
      const batchData = data.slice(startIndex, endIndex)
      
      // 创建 PDF 文档
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [73, 25]
      })

      for (let i = 0; i < batchData.length; i++) {
        const item = batchData[i]
        const globalIndex = startIndex + i
        
        // 生成二维码数据 URL
        const base_url = 'https://www.jiandaoyun.com/dashboard/app/6912cdd2a1396f1d50a5e8f2/form/6912cee796ea9c29dcdd0f9b/data/{data_id}/qr_link'
        const qrData = base_url.replace('{data_id}', item.data_id)
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 60,
          margin: 1
        })

        // 清除当前页内容
        doc.clear()
        
        // 添加二维码
        doc.addImage(qrUrl, 'PNG', 5, 5, 15, 15)
        
        // 添加文本信息
        let yPos = 7
        doc.setFontSize(8)
        
        if (options.brand) {
          doc.text(`品牌: ${item.品牌}`, 25, yPos)
          yPos += 4
        }
        
        if (options.category) {
          doc.text(`类别: ${item.类别}`, 25, yPos)
          yPos += 4
        }
        
        if (options.serial) {
          doc.text(`序列号: ${item.序列号}`, 25, yPos)
          yPos += 4
        }
        
        if (options.source) {
          doc.text(`来源: ${item.来源}`, 25, yPos)
        }
        
        // 如果不是最后一页，添加新页
        if (i < batchData.length - 1) {
          doc.addPage([73, 25], 'landscape')
        }
      }

      // 生成 PDF 并发送回主线程
      const pdfBlob = doc.output('blob')
      self.postMessage({ 
        type: 'generatePDFSuccess', 
        pdfBlob, 
        batchIndex, 
        totalBatches,
        startIndex, 
        endIndex 
      }, [pdfBlob])
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message })
  }
}
