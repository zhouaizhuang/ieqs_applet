import { HOST } from '../config/index'
const app = getApp()
// 上报错误到小程序后台
const log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
const username = wx.getStorageSync('username')
const phone = wx.getStorageSync('phone')
export const reportError = function (err) {
  if (!log) {return}
  let errStr = err
  if(isError(err)) {
    const {message, stack } = err
    errStr = stack ? String(stack) : String(message)
    errStr = errStr || String(err)
  } else if(isObject(err)) {
    errStr = JSON.stringify(err)
  }
  log.error.call(log, `${username}-${phone}-${errStr}`)
}
export const reportInfo = function (info) {
  if (!log) {return}
  let errStr = info
  if(isError(info)) {
    const {message, stack } = info
    errStr = stack ? String(stack) : String(message)
    errStr = errStr || String(info)
  } else if(isObject(info)) {
    errStr = JSON.stringify(info)
  }
  log.info.call(log, `${username}-${phone}-${errStr}`)
}
/*
 * 二次封装wx.request()
 * url:请求的接口地址
 * options:{method:请求方式, data: 请求传参, header: 请求头信息}
 */
export const get = function (url, data) {
  return request(url, { data }).then(res => res)
}
export const post =  function (url, data) {
  return request(url, { method: 'POST', data }).then(res => res)
}
export function request (url, options = {}) {
  const oldToken = wx.getStorageSync('token')
  options.data = formatJSON(options.data)
  const newOptions = {
    method: 'GET',
    header: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }, // 默认值 ,另一种是 "content-type": "application/x-www-form-urlencoded"
    ...options
  }
  newOptions.method = newOptions.method.toUpperCase()
  if(newOptions.method === 'POST') {
    url = url.includes('?') ? url + '&' : url + '?'
    url += `token=${oldToken || ''}`
  } else {
    newOptions.data.token = oldToken
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: HOST['master'] + url,
      ...newOptions,
      success: res => {
        const { code, token } = res.data
        if (code === 401) {
          toLogin()
        } else if(res.statusCode >= 400 && res.statusCode <= 600) {
          reportError(`请求失败!url:${host + url}<==>statusCode:${res.statusCode}<==>data:${JSON.stringify(res.data)}`)
          reportError(JSON.stringify(res.data))
          throw new Error(JSON.stringify(res.data))
        } else {
          if (token !== oldToken && code) {
            app.globalData.token = token
            wx.setStorageSync('token', token)
          }
          resolve(res.data)
        }
      },
      fail: err => {   //请求失败
        // log('请求失败 (>_<)')
        reject(err)
        reportError(`请求失败：${err}`)
      },
      complete: () => {
        // complete
      }
    })
  })
}


/*
**************公共方法********************
*/
export const isType = type => val => type === Object.prototype.toString.call(val).slice(8, -1)
export const isArray = isType('Array')
export const isObject = isType('Object')
export const isNull = isType('Null')
export const isUndefined = isType('Undefined')
export const isFunction = isType('Function')
export const isRegExp = isType('RegExp')
export const isString = isType('String')
export const isNumber = isType('Number')
export const isDate = isType('Date')
export const isError = isType('Error')
// 判断是否为空
export const isEmpty = val => ['', undefined, null].includes(val)
export const deepCopy = function (obj) {
  if(!(isArray(obj) || isObject(obj))) { return obj }  // 数字、日期、正则、函数、字符串、undefined、null、Symbol直接返回
  let res = isArray(obj) ? [] : {}
  return Object.keys(obj).reduce((prev, item) => {
    prev[item] = (isArray(obj[item]) || isObject(obj[item])) ? deepCopy(obj[item]) : obj[item]
    return prev
  }, res)
}
// 获取唯一ID
export const guID = function () {
  return Number(Math.random().toString().substr(3, 8) + Date.now()).toString(36)
}
// 函数防抖。http://note.youdao.com/noteshare?id=bb75a919b3598b39ec65f7a27ca907ef&sub=548443C6E98143A3A0CF2E0CE0BEFEE2
export const debounce = function (fn, wait=3e3) {
  let timeout = null  // 使用闭包，让每次调用时点击定时器状态不丢失
  return function () { 
    clearTimeout(timeout) // 如果用户在定时器（上一次操作）执行前再次点击，那么上一次操作将被取消
    timeout = setTimeout(()=> {
      fn(...arguments)
    }, wait)
  }
}
// 函数节流。http://note.youdao.com/noteshare?id=bb75a919b3598b39ec65f7a27ca907ef&sub=548443C6E98143A3A0CF2E0CE0BEFEE2
export const throttling = function  (fn, wait=3e3) {
  let timeout = null // 使用闭包，让每次调用时点击定时器状态不丢失
  let start = +new Date() // 记录第一次点击时的时间戳
  return function () {
    clearTimeout(timeout)
    let end = +new Date() // 记录第一次以后的每次点击的时间戳
    if (end - start >= wait) { // 当时间到达设置的延时时间则立即调用数据处理函数
      fn(...arguments)
      start = end // 执行处理函数后，将结束时间设置为开始时间，重新开始记时
    } else {
      timeout = setTimeout(() => { // 后续点击没有到达设置的延时，定时器设定延时进行调用
        fn(...arguments)
      }, wait)
    }
  }
}
// 检测是否是手机号码
export const isPhoneNum = function(str) {
  // return /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(str)
  return /^1[3456789]\d{9}$/.test(str)
}
// 获取当前滚动距离顶部的距离
export const getScrollTop = function() {
  return (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
}
// 获取操作系统类型
export const getOS = function() {
  const userAgent = 'navigator' in window && 'userAgent' in navigator && navigator.userAgent.toLowerCase() || ''
  // const vendor = 'navigator' in window && 'vendor' in navigator && navigator.vendor.toLowerCase() || ''
  const appVersion = 'navigator' in window && 'appVersion' in navigator && navigator.appVersion.toLowerCase() || ''
  if (/iphone/i.test(userAgent) || /ipad/i.test(userAgent) || /ipod/i.test(userAgent)) return 'ios'
  if (/android/i.test(userAgent)) return 'android'
  if (/win/i.test(appVersion) && /phone/i.test(userAgent)) return 'windowsPhone'
  if (/mac/i.test(appVersion)) return 'MacOSX'
  if (/win/i.test(appVersion)) return 'windows'
  if (/linux/i.test(appVersion)) return 'linux'
}
// 获取元素相对于浏览器的位置, 返回一个对象
export const getPosition = function (e) {
  const offsety = Number(e.offsetTop)
  const offsetx = Number(e.offsetLeft)
  if (e.offsetParent !== null) {
    getPosition(e.offsetParent)
  }
  return { Left: offsetx, Top: offsety }
}

/*
**************字符串操作********************
*/
// 去除字符串的首尾空格
export const trim = function (str = '') {
  return String(str).replace(/(^\s*)|(\s*$)/g, '')
}
// 固定裁剪几个字符之后显示省略号。举例：sliceStr('张三李四王五', 2) ----> "张三..."
export const sliceStr = function (str, num) {
  str = String(str)
  let newStr = str.substr(0, num)
  str.length > num && (newStr += '...')
  return newStr
}
// 字符串前置补0。举例: addZero('1', 2) ==> '01'
export const addZero = function (str, num) {
  return (Array(num+1).join('0') + str).slice(-num)
}
// 完美的统计字符串长度，能正确统计占四个字节的Unicode字符。举例：length('x\uD83D\uDE80y') ----> 3
export const length = function (str) {
  return [...str].length
}
/*
**************数组操作********************
*/
// 按照某个字段进行排序。举例：sortByProp([{name:'ss', age:30}, {name:'dd', age:14}], 'age'), increase不传默认升序， 传false降序
export const sortByProp = function (arr, str, increase = true) {
  return arr.sort((a, b) => increase ? a[str] - b[str] : b[str] - a[str])
}

/*
**************JSON操作********************
*/
// 格式化JSON, 将null, undefined,转换为''，否则后端会认为undefined和null为字符串导致bug
export const formatJSON = function (obj) {
  if(!isObject(obj)) {
    return {}
  }
  return Object.keys(obj).reduce((prev, item) => {
    prev[item] = isNull(obj[item]) || isUndefined(obj[item]) || ['undefined', 'null'].includes(obj[item]) ? '' : obj[item]
    if(isObject(prev[item])) {
      prev[item] = formatJSON(prev[item])
    }
    return prev
  }, {})
}
// 检查表单必填项是否为空，空则返回第一个为空的字段名。举例：checkParams({name:'zaz', age:'', school:''}) ----> 'age'
export const checkJSON = function (obj) {
  return Object.keys(obj).find(item => isEmpty(obj[item])) || ''
}
// JSON转url
export const JSON2url = function (url = '', params = {}){
  params = formatJSON(params)
  return Object.keys(params).reduce((prev, item, index) => {
    prev += index === 0 ? '?' : '&'
    prev += `${item}=${params[item]}`
    return prev
  }, url) || ''
}
//递归解析数组中某个字段最深层该字段数组平铺。举例子：
// const arr = [{ 
//   name: 'a',
//   child:[{
//       name:'b',
//       child: [ { name:'c' }]
//   }]
// }]
//------> {name:'c'}
export const getAreaFlat = function (arr, props) {
  if(arr.some(item => isArray(item[props]) && item[props].length)) {
    arr = arr.reduce((prev, item) => isArray(item[props]) && item[props].length ? [...prev, ...item[props]] : [...prev, item], [])
    return getAreaFlat(arr, props)
  } else {
    return arr
  }
}
// 获取某个数组中某个字段的值，拼接成字符串。[{name:'a'}, {name:'b'}]----> 'a,b'
export const getField = function (arr, field, split = ',') {
  return arr.reduce((prev, item) => [...prev, item[field]], []).join(split)
}
// 获取某个数组中字段isChecked为true的条目。并取出其中特定字段。[{id:1, isChecked: true}, {id:2, isChecked:false}, {id:2, isChecked:true}] ---> 1,2
export const getChecked = function (arr, field, split = ',') {
  return arr.reduce((prev, item) => (item.isChecked && prev.push(item[field]), prev), []).join(split)
}
// 获取部分字段。举例：
// const obj = {name:'', age:123,school:{hh:11, kj:true}, asd:'qqwq'}
// getProps(obj, {name:'', school:{hh:''}, asd:''}) ----> 得到其中部分字段。这个函数可以用户提升小程序列表页和详情页大量数据的渲染性能
// 还可以直接传入对象数组像这种[{...},{...},{...},{...}]，返回相应字段的对象数组
// 主要运用于优化移动端大量数据下拉加载更多导致setData的数据很庞大
export const getProps = function (obj, props) {
  if(!isObject(props)) {
    throw new Error('参数有误，参数必须为object')
  }
  if(isArray(obj)) {
    return obj.map(item => {
      return Object.keys(props).reduce((prev, v) => {
        prev[v] = isObject(props[v]) ? getProps(item[v], props[v]) : item[v] || ''
        return prev
      }, {})
    })
  }else if(isObject(obj)) {
    return Object.keys(props).reduce((prev, item) => {
      prev[item] = isObject(props[item]) ? getProps(obj[item], props[item]) : obj[item] || ''
      return prev
    }, {})
  } else {
    return obj
  }
}
// 保证json格式数据的可靠获取, 举例子：safeGet(() => window.a.b.d.c.adf, '0')
export const safeGet = function (run, defaultValue = '') {
  try {
    return run() || defaultValue
  } catch(e) {
    return defaultValue 
  } 
}

/*
**************金额操作********************
*/
/*
  * 参数说明：
  * n：要格式化的数字
  * type：float->小数形式。  intFloat->当整数的时候不需要带两个小数0，带小数时，保留几位小数
  * prec：保留几位小数
  * dec：小数点符号
  * sep：千分位符号
  * 
  * 举例：formatMoney(12322.1223, 'float',  2, '.', ',') ----- > "12,322.12"
  * 举例：formatMoney(12322, 'intFloat', 2, '.', ',') ------> 12322
*/
export const formatMoney = function (n, type = 'float', prec = 2, dec = '.', sep = ',') {
  n = String(Number(n)).replace(/[^0-9+-Ee.]/g, '') || '0'
  if(n === '0') {
    return '0'
  }
  if(type === 'intFloat' && !n.includes('.')) {
    return n
  }
  let s = (prec ? round(n, prec) : round(n)).split('.')
  let re = /(-?\d+)(\d{3})/
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, "$1" + sep + "$2")
  }
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || ''
    s[1] += new Array(prec - s[1].length + 1).join('0')
  }
  return s.join(dec)
}
// 金额计算，四舍五入最多保留prec位小数===> 返回字符串round(100.1234, 2) --->'100.12'
export const round = function (num, prec = 0) {
  const k = Math.pow(10, prec)
  return String(Math.round(num * k) / k)
}
// 金额计算，四舍五入最多保留prec位小数===> 返回数字roundNum(100.1234,2) ---> 100.12
export const roundNum = function (num, prec = 0) {
  const k = Math.pow(10, prec)
  return Math.round(num * k) / k
}
// 上限为lower
export const range = function (num, min = null, max = null) {
  if(min) {
    num = num > min ? num : min
  }
  if(max) {
    num = num > max ? max : num
  }
  return num
}
/*
**************日期时间操作********************
*/
// 获取日期字符串。举例：今天日期:getDateStr(0)--->20200904  |  明天日期用-分割：getDateStr(1, '-')--->2020-09-05
// 2020-11-01后一天日期:getDateStr(1, '-', '2020-11-01')--->2020-11-02
export const getDateStr = function (AddDayCount = 0, split = '', start = '') {
  const dt = start ? new Date(start) : new Date()
  dt.setDate(dt.getDate() + Number(AddDayCount)) // 获取AddDayCount天后的日期
  return `0000${dt.getFullYear()}`.slice(-4) + split + `00${(dt.getMonth() + 1)}`.slice(-2) + split + `00${dt.getDate()}`.slice(-2)
}
// 获取传入日期是星期几, 不传默认是今天
export const getDay = function (date) {
  let day = date ? new Date(date).getDay() : new Date().getDay()
  return '星期' + "日一二三四五六"[day]
}
// 获取实时   年-月-周-日-时-分-秒
export const socketTime = function (date = new Date()) {
  const dt = new Date(date)
  const year = String(dt.getFullYear())
  const _month = String(dt.getMonth() + 1)
  const month = addZero(_month, 2)
  const day = addZero(dt.getDate(), 2)
  const _day = String(dt.getDate())
  const weekDay = String(dt.getDay())
  const _weekDay = '星期' + "日一二三四五六"[weekDay]
  const hour = addZero(dt.getHours(), 2)
  const minutes = addZero(dt.getMinutes(), 2)
  const seconds = addZero(dt.getSeconds(), 2)
  return { year, month, _month, day, _day, weekDay, _weekDay, hour, minutes, seconds }
}
// 获取两个日期之间间隔的天数。举例子getDaysInterval('2020-10-11', '202010-12') //1
export const getDaysInterval = function (startDate, endDate) {
  if(!startDate || !endDate) {return 0}
  const start = new Date(startDate)
  const end = new Date(endDate)
  const milliseconds = end.getTime() - start.getTime()
  const daymilliseconds = 3600 * 24 * 1000
  return Math.round(milliseconds / daymilliseconds)
}
/*
**************小程序api操作********************
*/
// export const disableBtn = function () {
//   showLoading()
//   this.enableBtn = false
// }
// export const enableBtn = function (time = 200) {
//   hideLoading()
//   setTimeout(() => { this.enableBtn = true }, time)
// }
// 显示loading
export const showLoading = function (title = '加载中', duration = 0, mask = true) {
  wx.showLoading({ title, mask})
  if(duration) {
    hideLoading(duration)
  }
}
// 关闭loading
export const hideLoading = function (time = 0) {
  setTimeout(() => { wx.hideLoading() }, time)
}
// 显示提示弹框
export const showToast = (title, duration = 3000, icon='none') => {
  if(isError(title)) {
    const {message, stack } = title
    title = stack ? String(stack) : String(message)
    title = title || String(err)
  } else if(isObject(title)) {
    title = JSON.stringify(title)
  }
  if(title) {
    wx.showToast({ title, icon, duration})
    setTimeout(() => wx.hideToast(),duration)
  }
}
export const showModal = function (title, content){
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success: res => {
        if (res.confirm) {
          resolve(res)
        } else if (res.cancel) {
          reject()
        }
      },
      fail: err => { reject(err)}
    })
  })
}
// 页面跳转
export const go = function (url = '', time = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      wx.navigateTo({
        url,
        success: res => { resolve(res) },
        fail: err => { reject(err) }
      })
    }, time)
  })
}
// 返回页面栈前面N页, 延时time毫秒执行, 返回promise对象
export const goBack = function (delta = 1, time = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      wx.navigateBack({
        delta,
        success: res => { resolve(res) },
        fail: err => { reject(err) }
      })
    }, time)
  })
}
// 设置当前页面的标题
export const setPageTitle = function (title = '') {
  return new Promise((resolve, reject) => {
    wx.setNavigationBarTitle({
      title,
      success: res => { resolve(res) },
      fail: err => { reject(err) }
    })
  })
}

// 跳转到登录页
export const toLogin = function () {
  wx.redirectTo({ url: '/pages/login/index' })
}
export const getQrCode = function (params = {}){
  return new Promise((resolve, reject) => {
    wx.scanCode({
      onlyFromCamera: true,
      ...params,
      success: res => { resolve(res) },
      fail: err => { reject(err) }
    })
  })
}
export const getWxCode = function (){
  return new Promise((resolve, reject) => {
    wx.login({
      success: res => { resolve(res.code) },
      fail: err => { reject(err) }
    })
  })
}
export const getUserInfo = function () {
  return new Promise((resolve, reject) => {
    wx.getUserInfo({
      withCredentials: 'false',
      lang: 'zh_CN',
      timeout:10000,
      success: res => { resolve(res) },
      fail: err => { reject(err) }
    })
  })
}