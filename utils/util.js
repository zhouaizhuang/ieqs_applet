import { formatMoney, round } from './request'
// 转换商品数据
export const convertVer = function (ver = []){
  let newArr = ver.map(item =>{
    return item.data.reduce((prev, item) => {
      let { name, content } = item
      if(['quantity', 'unitPrice', 'amount'].includes(name)) {
        content = content ? round(content, 2) : ''
      }
      if('taxRate' === name){
        content = String(Number(content) * 100) + '%'
      }
      prev[item.name] = content
      return prev
    }, {})
  })
  newArr = newArr.map((item, index) => ({...item, isShow: index === 0 }))
  return newArr
}
// 转换开票数据
export const convertInvoce = function (invoce) {
  const { totalAmount, totalTax, amountTax, created_at, ver } = invoce
  return {
    ...invoce,
    _totalAmount: round(totalAmount, 2),
    _totalTax: round(totalTax, 2),
    _amountTax: round(amountTax, 2),
    _created_at: created_at.slice(0, 10),
    _ver: convertVer(ver)
  }
}