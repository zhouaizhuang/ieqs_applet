import { get, reportError } from "./request"

export const getPersonList = function ({ keyword = '' } = {}){
  return get('/api/claimant/all', { keyword }).then(res => {
    const { code, data, msg } = res
    return { personList: data, code, msg}
  }).catch(e => {
    console.log(e)
    reportError(e)
  })
}