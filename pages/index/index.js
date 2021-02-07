//index.js
//获取应用实例
const app = getApp()
import { reportError, showLoading, hideLoading, showToast } from '../../utils/request'
import { getPersonList } from '../../utils/api'
import {
  checkPerson, bindScan, bindUpload,  switchChange, bindSelect, bindPicker,
  bindcancel, handleInputChange, clear, checkClaimant, handleFocus, handleBlur,
} from './func'
Page({
  data: {
    personList: [
      // {id: 1, name: '张三', isChecked: false},
    ],
    personListCopy: [], // 保存一哥personList的副本
    is_verify: '0',
    keyword: '', // 搜索关键字
    claimant: '', // select选择的报销人
    isSpread: false, // 是否处于下拉状态
  },
  checkPerson, bindScan, switchChange, bindUpload, bindSelect, bindPicker, bindcancel, handleInputChange,
  clear, checkClaimant, handleFocus, handleBlur,
  onLoad: async function () {
    const token =  wx.getStorageSync('token') || app.globalData.token
    if(token) {
      try {
        showLoading()
        const { personList }  = await getPersonList()
        hideLoading()
        this.setData({personList, personListCopy: personList})
      } catch (err) {
        reportError(err)
        showToast(err)
        console.log(err)
      }
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
