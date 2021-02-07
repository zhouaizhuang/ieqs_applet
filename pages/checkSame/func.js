import { go, getQrCode, post, formatJSON, formatMoney, showLoading, hideLoading } from "../../utils/request"
import { convertInvoce } from '../../utils/util'

export const bindEndTotal = function (){
  const { claimant } = this.data
  go(`/pages/total/index?claimant=${claimant}`)  
}
export const bindNext = async function () {
  const { claimant, is_verify } = this.data
  const { result } = await getQrCode() // 调用扫码拿到结果
  const no = wx.getStorageSync('no') || ''
  let { data } = await post('/api/invoce/scan', {
    claimant, is_verify, result, no
  })
  let { invoce, msg, status, no: newNo } = formatJSON(data)
  msg = msg.includes('报销') ? `您扫描的发票在${invoce.created_at}已报销` : msg
  if(!wx.getStorageSync('no') && newNo) { // 如果localstorage没有no代表发票都是已经报销的。拿到新的no才需要存起来
    wx.setStorageSync('no', newNo)
  }
  invoce = convertInvoce(invoce)
  this.setData({ invoce, msg, status: String(status), isShowMore: true })
}
export const bindUpload = function () {
  wx.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: res => {
      // tempFilePath可以作为img标签的src属性显示图片
      const tempFilePaths = res.tempFilePaths
      showLoading('识别中...')
      wx.getFileSystemManager().readFile({ // 转成base64
        filePath: tempFilePaths[0],
        encoding:'base64',
        success: file => {
          //返回临时文件路径
          const {data} = file
          const { is_verify, claimant } = this.data
          const syncNo = wx.getStorageSync('no') || ''
          post('/api/invoce/scan', {
            claimant, is_verify, img: data, no: syncNo
          }).then(photoRes => {
            hideLoading()
            const { code, data, msg } = photoRes
            if(code) {
              goCheckSame.call(this, data)
            } else {
              showToast(msg)
            }
          }).catch(err => {
            console.log(err)
          })
        },
        fail: err => console.log(err)
      })
    },
    fail: err => {
      console.log(err)
      reportError(err)
    }
  })
}
export const goCheckSame = function (data) {
  const syncNo = wx.getStorageSync('no') || ''
  // const { is_verify, claimant } = this.data
  let { invoce, msg, status, no: newNo } = formatJSON(data)
  msg = msg.includes('报销') ? `您扫描的发票在${invoce.created_at}已报销` : msg
  invoce = convertInvoce(invoce)
  if(!syncNo && newNo) { // 如果localstorage没有no代表发票都是已经报销的。拿到新的no才需要存起来
    wx.setStorageSync('no', newNo)
  }
  this.setData({ invoce, msg, status: String(status), isShowMore: true })
  // go(JSON2url('/pages/checkSame/index', formatJSON({claimant, is_verify})))
}
export const showMore = function (){
  let { invoce } = this.data
  const newVer = invoce._ver.map(item => ({ ...item, isShow: true }))
  invoce = { ...invoce, _ver: newVer }
  this.setData({ invoce, isShowMore: false })
}
export const collect = function () {
  let { invoce } = this.data
  const newVer = invoce._ver.map((item, index) => ({ ...item, isShow: index === 0 }))
  invoce = { ...invoce, _ver: newVer }
  this.setData({ invoce, isShowMore: true })
}