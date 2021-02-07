import { formatMoney, get, goBack, hideLoading, showLoading } from "../../utils/request"

// pages/total/total.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    claimant: '', // 报销人
    number: '0', // 发票入账数量
    _price: '0', // 金额总计
  },
  goBack2(){
    goBack(2)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { claimant } = options
    const no = wx.getStorageSync('no') || ''
    this.setData({claimant})
    if(no) {
      showLoading()
      const {data: { number, price }} = await get('/api/invoce/batch-invoce', { no })
      hideLoading()
      this.setData({ number, _price: formatMoney(price) })
      wx.setStorageSync('no', '')
    } else {
      this.setData({number: '0', _price: '0'})
    }
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