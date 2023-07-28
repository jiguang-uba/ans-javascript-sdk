

import { globalWindow } from '../../constant/index'
import sendData from '../sendData'
import fillData from '../fillData'
import { lengthCheck, attrCheck } from '../../utils/verify/index'
import { getSuperProperty } from '../../store/core'
import { eventAttribute } from '../../store/eventAttribute'
import { config } from "../../store/config"
import { autoClickBlackListCheck } from '../../utils/verify/index'
import { assign } from '../../utils/object'
import { getPageProperty } from '../../store/pageProperty'

function pageView (pageName?: string, properties?: object, fn?: Function) {

  // 排除黑名单
  if (autoClickBlackListCheck(config.pageViewBlackList)) {
    return
  }

  const eventName = '$pageview'
  let userObj = {}, customProperties = {}
  
  if (lengthCheck(pageName)) {
    userObj['$title'] = pageName
    if (properties) {
      customProperties = attrCheck(properties, eventName)
    }
  }

  userObj = assign({}, customProperties, userObj)
  

  // 获取上报数据模块
  const res = fillData(eventName)

  // 重置webstay触发时间
  eventAttribute.webstay.xwhen = 0
  // 记录浏览页面时间
  eventAttribute.pageview.xwhen = res.xwhen

  // 合并通用属性 // 绑定页面属性 // 绑定传入的属性
  res.xcontext = assign({}, res.xcontext, getSuperProperty(), getPageProperty(), userObj)
  
  // 执行beforePageView钩子，返回false则停止上报
  const beforePageView = config.beforePageView
  if (beforePageView) {
    const obj = {...res, xcontext: {...res.xcontext}}

    // 设置属性
    const setAttrs = (attrs: object) => {
      let obj = attrCheck(attrs, '$pageview')
      res.xcontext = assign({}, res.xcontext, obj)
      return res.xcontext
    }

    if (beforePageView.call(globalWindow.AnalysysAgent, obj, setAttrs) === false) {
      return res
    }
  }

  // 缓存当前pv上报的title
  eventAttribute.pageview['$title'] = res.xcontext['$title']
  
  sendData(res, fn)
  return res
}

export default pageView