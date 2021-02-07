import {
  getQrCode, showToast, post, go,
  reportError, JSON2url, formatJSON, toLogin,
  showModal,
  showLoading,
  hideLoading
} from "../../utils/request"
import { convertInvoce } from '../../utils/util'
const app = getApp()

export const checkPerson = function (e) {
  const { item } = e.currentTarget.dataset
  let { personList } = this.data
  personList = personList.map(v => {
    let { isChecked } = v
    if(v.id === item.id) {
      isChecked = !isChecked
    } else {
      isChecked = false
    }
    return { ...v, isChecked}
  })
  this.setData({ personList })
}
export const switchChange = function (e) {
  const is_verify = e.detail.value ? '1' : '0'
  this.setData({ is_verify })
}
export const bindScan = async function () {
  const token =  wx.getStorageSync('token') || app.globalData.token
  if(!token) {
    return showModal('登录提示', '登录后才能扫码').then(res => {
      if(res.confirm) { toLogin() }
    }).catch(e => {
      showToast(e)
      reportError(e)
    })
  }
  try{
    const { is_verify, claimant } = this.data
    const { result } = await getQrCode()
    const syncNo = wx.getStorageSync('no') || ''
    let { data } = await post('/api/invoce/scan', {
      claimant, is_verify, result, no: syncNo
    })
    goCheckSame.call(this, data)
  } catch (e){
    console.log(e)
    reportError(e)
  }
}
export const goCheckSame = function (data) {
  const syncNo = wx.getStorageSync('no') || ''
  const { is_verify, claimant } = this.data
  let { invoce, msg, status, no } = formatJSON(data)
  msg = msg.includes('报销') ? `您扫描的发票在${invoce.created_at}已报销` : msg
  invoce = convertInvoce(invoce)
  app.globalData.invoceDetail = { invoce, msg, status: String(status) }
  if(!syncNo && no) {
    wx.setStorageSync('no', no)
  }
  go(JSON2url('/pages/checkSame/index', formatJSON({claimant, is_verify})))
}
// 输入框输入搜索内容的时候
export const handleInputChange = function (e){
  const keyword = e.detail.value
  this.setData({keyword})
  const personList = this.data.personListCopy.filter(item => item.name.includes(keyword))
  this.setData({personList, isSpread: !!keyword})
  // const token =  wx.getStorageSync('token') || app.globalData.token
  // if(!token) { return }
  // getPersonList({ keyword: keyword}).then(({code, msg, personList}) => {
  //   if(code) {
  //     this.setData({ personList })
  //   } else {
  //     showToast(msg)
  //   }
  // })
}
export const clear = function () {
  this.setData({claimant: ''})
}
// 用户点击下拉箭头
export const bindSelect = function () {
  const { isSpread } = this.data
  this.setData({isSpread: !isSpread})
}
// 用户取消选择
export const bindcancel = function (){
  const { isSpread } = this.data
  this.setData({isSpread: !isSpread})
}
// 用户选择报销人
export const bindPicker = function (e){
  const index = e.detail.value
  const { isSpread, personList } = this.data
  const claimant = personList[index].name
  this.setData({isSpread: !isSpread, claimant })
}
export const bindUpload = function () {
  const token =  wx.getStorageSync('token') || app.globalData.token
  if(!token) {
    return showModal('登录提示', '登录后才能上传图片').then(res => {
      if(res.confirm) { toLogin() }
    }).catch(e => {
      console.log(e)
      showToast(e)
      reportError(e)
    })
  }
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
            showToast(err)
            console.log(err)
          })
        },
        fail: err => {showToast(err);console.log(err)}
      })
    },
    fail: err => {
      console.log(err)
      reportError(err)
    }
  })
}
// 选择联系人
export const checkClaimant = function (e){
  const { name } = e.currentTarget.dataset
  const personList = this.data.personListCopy.filter(item => item.name.includes(name))
  this.setData({claimant: name, isSpread: false, keyword: name, personList})
}
export const handleFocus = function () {
  this.setData({ isSpread: true })
}
export const handleBlur = function () {
  this.setData({ isSpread: false })
}