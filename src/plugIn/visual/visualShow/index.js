import { isElmentReady } from './common/index.js'
import { visualConfig } from './common/config.js'
import { sendMsg, getMsg } from './common/iframeMsg.js'
import { addVisualListener, delEvents, showVisualEvent, delVisualEvent, openVisualEvent, hiddenVisualEvent, backProInputList, openDebugModule, openDebugEvent, setVisualStatus } from './visual/index.js'
import Util from '../utils'

var isVisaulInit = true
var visualStatus = false
var highlightStatus = true

/**
 * 监听服务端iframeMessage消息
 *
 * @param {JSON} msg 消息
 */
function processMsg (msg) {
  if (!isVisaulInit) {
    return
  }
  var eventList = []
  var type = msg.type
  // var url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.hash
  switch (type) {
    case 'INIT': // 初始化验证
      if (msg.appid !== visualConfig.appkey) {
        sendMsg({
          code: 400,
          type: 'INIT',
          msg: 'appkey不相同'
        })
        isVisaulInit = false
        return
      }
      sendMsg({
        code: 200,
        type: 'INIT',
        isNewVisual: true
      })
      var obj = {
        type: 'checkUrl',
        code: 200,
        url: window.location.href,
        skip: true
      }
      sendMsg(obj)
      setVisualStatus(msg.isNewVisual || false)
      sendChangeUrl()
      break
    case 'point_list': // 所有已埋点元素绑定debug模式

      eventList = msg.data || []
      if (highlightStatus === false) {
        return
      }
      if (!isElmentReady() || document.readyState !== 'complete') {
        setTimeout(function () {
          processMsg(msg)
        }, 1000)
        return
      } else {
        var pageList = showVisualEvent(eventList)
        sendMsg({
          type: 'check_points',
          list: pageList
        })
      }
      break
    // case 'EVENT_URL':
    //   // 验证埋点元素是否为当前页元素

    //   var eventUrlObj = {
    //     type: 'checkUrl',
    //     code: 200,
    //     url: url,
    //     skip: msg.url === url
    //   }
    //   sendMsg(eventUrlObj)
    //   break
    case 'VISUAL':
      if (highlightStatus === false) {
        visualStatus = msg.visual || false
        return
      }
      if (msg.visual === true) {
        // 开始初始化可视化埋点
        openDebugModule(false)

      } else if (msg.debugmode === true) {
        // 开始初始化debug模式
        openDebugModule(true)
      }
      if (highlightStatus === true) {
        addVisualListener()
      }
      break
    case 'change_update':
      if (highlightStatus === false) {
        return
      }
      if (msg.path && msg.path.length > 0) {
        // if (msg.path[0].url.charAt(msg.path[0].url.length - 1) === '/' && url.charAt(url.length - 1) !== '/') {
        //   url += '/'
        // }
        // if (url !== msg.path[0].url) {
        //   sendMsg({
        //     type: 'change_page',
        //     code: 200,
        //     msg: '跳转埋点页面',
        //     path: msg.path,
        //     url: url
        //   })
        // } else {
        openVisualEvent(msg.path[0])
        // }
      }
      break
    case 'change_delete':
      if (visualStatus === false) {
        openDebugModule(false)
      }

      if (msg.path && msg.path.length > 0) {
        delVisualEvent(msg.path[0])
        sendMsg({
          code: 200,
          type: 'change_delete'
        })
      } else {
        sendMsg({
          code: 400,
          type: 'change_delete',
          msg: '删除失败'
        })
      }
      break
    case 'add_success':
      sendMsg({
        code: 200,
        type: 'add_success',
        msg: '添加成功'
      })
      break
    case 'success_update':
      if (msg.path && msg.path.length > 0) {
        showVisualEvent(msg.path)
      }
      break
    case 'debug':
      // openDebugBox(msg)
      openDebugEvent(msg)
      break
    case 'highlight':
      highlightStatus = msg.highlight
      // if (highlightStatus === true) {
      //   showVisualEvent(eventList)
      // }
      // if (visualStatus) {
      hiddenVisualEvent(highlightStatus)

      // } else {
      //   hiddenVisualEvent(highlightStatus)

      // }
      break
    case 'like_pro':
      backProInputList(msg)
      break
  }
}
/**
 * [initHeatmap description]初始化可视化并建立通讯
 * @return {[type]} [description]
 */
function initVisual () {
  Util.changeHash(function () {
    highlightStatus = true
    visualStatus = true
    delEvents()
    hiddenVisualEvent(true)
    sendChangeUrl()
  })
}
// }
function sendChangeUrl () {
  // var url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.hash
  sendMsg({
    type: 'change_page_now',
    code: 200,
    msg: '跳转埋点页面',
    url: window.location.href.replace('?visual=true&', '?').replace('?visual=true', '')
  })
}

initVisual()

getMsg((msg)=> {
  processMsg(msg)
})

// window.AnalysysModule = Util.objMerge(window.AnalysysModule || {}, {
//   visual: {
//     init: initVisual,
//     msg: processMsg,
//     version: '4.5.1'
//   }
// })