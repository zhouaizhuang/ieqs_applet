// pages/login/login.js
import { showToast, request, post, getWxCode, getUserInfo } from '../../utils/request'
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isShowUserInfo: false, // 用户信息是否展示
    isShowModel: false, // 是否显示授权页面
  },
  // 登录
  login: async function () {
    const code = await getWxCode()
    let { code: errCode, data, token, msg } = await request('/api/auth/applet-login', {
      method: 'POST',
      data: { code }
    })
    // token = ''
    // data.openid = 'asdasd'
    if(!errCode) { // 接口返回出错了，打印出提示信息
      return showToast(msg)
    }
    if(token) { // 如果直接返回token代表之前注册过了。那么保存token并进入首页。否则返回openid代表没有登陆。那么走授权流程
      wx.setStorageSync('token', token)
      app.globalData.token = token
      wx.redirectTo({ url: '/pages/index/index' })
    } else if(data.openid) { // 返回数据是openid则显示授权
      this.setData({ isShowModel: true })
    } else {
      this.setData({ isShowModel: true })
    }
  },
  bindgetuserinfo(e){
    this.setData({isShowUserInfo: false})
  },
  // 获取手机号
  getPhoneNumber: function (e) {
    const { iv, encryptedData } = e.detail
    // 微信手机号绑定
    if(!iv || !encryptedData) { return showToast('请授权登录') }
    // console.log(encryptedData)
    // console.log(iv)
    // wx.getSetting({
    //   success: res => {
    //     console.log(res)
    //     if (res.authSetting['scope.userInfo']) {
    //       this.getPhoneBindApplet({ encryptedData, iv })
    //     }
    //   },
    //   fail: () => {
    //     this.setData({isShowUserInfo: true})
    //   }
    // })
    this.getPhoneBindApplet({ encryptedData, iv })
    this.setData({isShowModel: false})
  },
  // 获取用户信息
  getPhoneBindApplet: async function (params) {
    const { encryptedData, iv, userInfo } = await getUserInfo()
    // console.log(userInfo)
    // wx.setStorageSync('username',)
    wx.setStorageSync('userInfo', JSON.stringify(userInfo))
    const code = await getWxCode()
    const {code: appCode, msg, token } = await post('/api/auth/phone-bind-applet',{ encryptedData, iv, code, userInfo: JSON.stringify(userInfo), ...params })
    if(appCode && token) {
      wx.setStorageSync('token', token)
      app.globalData.token = token
      wx.redirectTo({ url: '/pages/index/index' })
    } else {
      showToast(msg)
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const userInfo =  wx.getStorageSync('userInfo')
    this.setData({isShowUserInfo: !userInfo})
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})