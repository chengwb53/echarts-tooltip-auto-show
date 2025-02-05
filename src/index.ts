import type { EChartsType } from 'echarts/core';
import type { EChartsOption } from 'echarts/types/dist/echarts';
import type { Payload } from 'echarts/types/dist/shared';

export interface IEChartsToolOptions {
  interval: number;
  loopSeries: boolean;
  seriesIndex: number;
  updateData?: (() => void) | null;
  bounce?: ((data: any, seriesIndex: number, dataIndex: number) => void) | null;
}

export interface IEChartsToolResult {
  clearLoop: () => void;
  pause: () => void;
  resume: () => void;
}

export type IEChartsToolReturn = IEChartsToolResult | undefined;

const browser = {
  versions: (function versions() {
    const u = navigator.userAgent;
    // const app = navigator.appVersion;

    // 移动终端浏览器版本信息
    return {
      // 是否为移动终端
      mobile: Boolean(u.match(/AppleWebKit.*Mobile.*/)),
      // ios终端
      ios: Boolean(u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)),
      // android终端或者uc浏览器
      android: u.includes('Android') || u.includes('Linux'),
      // 是否为iPhone或者QQHD浏览器
      iPhone: u.includes('iPhone'),
      // 是否iPad
      iPad: u.includes('iPad'),
    };
  })(),
  language: navigator.language.toLowerCase(),
};

/**
 * 循环显示tooltip工具
 * @param chart echarts实例对象
 * @param chartOption echarts配置项对象
 * @param options 配置项对象
 */
export function loopShowTooltip(chart: EChartsType, chartOption: EChartsOption, options: IEChartsToolOptions): IEChartsToolReturn {
  const defaultOptions = {
    interval: 2000,
    loopSeries: false,
    seriesIndex: 0,
    updateData: null,
    bounce: null,
  };

  if (!chart || !chartOption || !chartOption.series) {
    return;
  }
  let dataIndex = 0; // 数据索引，初始化为-1，是为了判断是否是第一次执行
  let seriesIndex = 0; // 系列索引
  let timeTicket = 0;
  const seriesLen = Array.isArray(chartOption.series) ? chartOption.series.length : 1; // 系列个数
  let dataLen = 0; // 某个系列数据个数
  let chartType = ''; // 系列类型
  let first = true;
  // let lastShowSeriesIndex = 0;
  // let lastShowDataIndex = 0;

  // 待处理列表
  // 不循环series时seriesIndex指定显示tooltip的系列，不指定默认为0，指定多个则默认为第一个
  // 循环series时seriesIndex指定循环的series，不指定则从0开始循环所有series，指定单个则相当于不循环，指定多个
  // 要不要添加开始series索引和开始的data索引？

  if (options) {
    options.interval = options.interval ?? defaultOptions.interval;
    options.loopSeries = options.loopSeries ?? defaultOptions.loopSeries;
    options.seriesIndex = options.seriesIndex ?? defaultOptions.seriesIndex;
    options.updateData = options.updateData ?? defaultOptions.updateData;
    options.bounce = options.bounce ?? defaultOptions.bounce;
  } else {
    options = defaultOptions;
  }

  // 如果设置的seriesIndex无效，则默认为0
  if (options.seriesIndex < 0 || options.seriesIndex >= seriesLen) {
    seriesIndex = 0;
  } else {
    seriesIndex = options.seriesIndex;
  }

  /**
   * 取消高亮
   */
  function cancelHighlight() {
    /**
     * 如果dataIndex为0表示上次系列完成显示，如果是循环系列，且系列索引为0则上次是seriesLen-1，否则为seriesIndex-1；
     * 如果不是循环系列，则就是当前系列；
     * 如果dataIndex>0则就是当前系列。
     */
    const tempSeriesIndex = dataIndex === 0
      ? (options.loopSeries
          ? (seriesIndex === 0 ? seriesLen - 1 : seriesIndex - 1)
          : seriesIndex)
      : seriesIndex;
    if (chartOption.series) {
      const tempType = Array.isArray(chartOption.series) ? chartOption.series[tempSeriesIndex].type : chartOption.series.type;

      if (tempType === 'pie' || tempType === 'radar' || tempType === 'map') {
        // wait 系列序号为0且循环系列，则要判断上次的系列类型是否是pie、radar
        chart.dispatchAction({
          type: 'downplay',
          // seriesIndex: lastShowSeriesIndex,
          // dataIndex: lastShowDataIndex
        });
      }
    }
  }

  /**
   * 自动轮播tooltip
   */
  function autoShowTip() {
    // 已经在轮播了，则不执行
    if (timeTicket) {
      return;
    }

    function showTip() {
      // chart不在页面中时，销毁定时器
      const dom = chart.getDom();
      if (!document.documentElement.contains(dom)) {
        clearLoop();
        return;
      }

      // 判断是否更新数据
      if (dataIndex === 0 && !first && typeof options.updateData === 'function') {
        options.updateData();
        chart.setOption(chartOption);
      }

      const series = Array.isArray(chartOption.series) ? chartOption.series : [chartOption.series];
      const currSeries = series[seriesIndex];
      if (!series || series.length === 0
        || !currSeries || !currSeries.type || !currSeries.data
        || !Array.isArray(currSeries.data)) {
        return;
      }
      chartType = currSeries.type; // 系列类型
      dataLen = currSeries.data.length; // 某个系列的数据个数
      const currentItemData = currSeries.data[dataIndex];

      const tipParams: Payload = {
        type: '',
        seriesIndex,
      };
      switch (chartType) {
        case 'pie':
        case 'map':
        case 'chord':
          tipParams.name = currentItemData.name;
          break;
        case 'radar': // 雷达图
          tipParams.seriesIndex = seriesIndex;
          tipParams.dataIndex = dataIndex;
          break;
        default:
          tipParams.seriesIndex = seriesIndex;
          tipParams.dataIndex = dataIndex;
          break;
      }

      if (chartType === 'pie' || chartType === 'radar' || chartType === 'map') {
        if (!first) {
          cancelHighlight();
        }

        // 高亮当前图形
        chart.dispatchAction({
          type: 'highlight',
          seriesIndex,
          dataIndex,
        });
      }

      // 防止updateData时先处理tooltip后刷新数据导出tooltip显示不正确
      setTimeout(() => {
        tipParams.type = 'hideTip';
        chart.dispatchAction(tipParams);
        tipParams.type = 'showTip';
        chart.dispatchAction(tipParams);
        if (options.bounce && typeof options.bounce === 'function') {
          options.bounce(currentItemData, seriesIndex, dataIndex);
        }
      }, 0);

      // lastShowSeriesIndex = seriesIndex;
      // lastShowDataIndex = dataIndex;
      dataIndex = (dataIndex + 1) % dataLen;
      // 数据索引归0表示当前系列数据已经循环完
      if (options.loopSeries && dataIndex === 0) {
        seriesIndex = (seriesIndex + 1) % seriesLen;
      }

      first = false;
    }

    if (first) {
      showTip();
    }
    timeTicket = window.setInterval(showTip, options.interval);
  }

  // 关闭轮播
  function stopAutoShow() {
    if (timeTicket) {
      clearInterval(timeTicket);
      timeTicket = 0;

      if (chartType === 'pie' || chartType === 'radar' || chartType === 'map') {
        cancelHighlight();
      }
    }
  }

  const zRender = chart.getZr();

  function zRenderMouseMove(param: any) {
    if (param.event) {
      // 阻止canvas上的鼠标移动事件冒泡
      param.event.cancelBubble = true;
    }

    stopAutoShow();
  }

  // 离开echarts图时恢复自动轮播
  function zRenderGlobalOut() {
    if (!timeTicket) {
      autoShowTip();
    }
  }

  function mouseHover(e: any) {
    // 取消其它高亮
    chart?.dispatchAction({
      type: 'downplay',
      seriesIndex: e.seriesIndex,
    });
    // 高亮当前图形
    chart?.dispatchAction({
      type: 'highlight',
      seriesIndex: e.seriesIndex,
      dataIndex: e.dataIndex,
    });
    chart?.dispatchAction({
      type: 'showTip',
      seriesIndex: e.seriesIndex,
      dataIndex: e.dataIndex,
    });
    if (chartOption.series && Array.isArray(chartOption.series) && typeof e.seriesIndex !== 'undefined') {
      const targetSeries = chartOption.series[e.seriesIndex];
      if (targetSeries && Array.isArray(targetSeries.data)) {
        const itemData = targetSeries.data[e.dataIndex];

        // 需要在判断一下，ts无法检查
        if (options.bounce && typeof options.bounce === 'function') {
          options.bounce(itemData, e.seriesIndex, e.dataIndex);
        }
      }
    }
  }

  function mouseOut(e: any) {
    // 高亮当前图形
    chart?.dispatchAction({
      type: 'highlight',
      seriesIndex: e.seriesIndex,
      dataIndex: e.dataIndex,
    });
  }

  // 鼠标在echarts图上时停止轮播
  if (browser.versions.mobile || browser.versions.ios || browser.versions.android
    || browser.versions.iPhone || browser.versions.iPad) {
    chart.on('touchstart', stopAutoShow);
    zRender.on('touchstart', zRenderMouseMove);
    // zRender.on('touchcancel', zRenderGlobalOut);
    zRender.on('touchend', zRenderGlobalOut);
  } else {
    chart.on('mousemove', stopAutoShow);
    zRender.on('mousemove', zRenderMouseMove);
    zRender.on('globalout', zRenderGlobalOut);

    if (options.bounce && typeof options.bounce === 'function') {
      chart.on('mouseover', mouseHover);
      chart.on('mouseout', mouseOut);
    }
  }

  autoShowTip();

  /**
   * 清除定时器
   */
  function clearLoop() {
    if (timeTicket) {
      clearInterval(timeTicket);
      timeTicket = 0;
    }

    if (browser.versions.mobile || browser.versions.ios || browser.versions.android
      || browser.versions.iPhone || browser.versions.iPad) {
      chart.off('touchstart', stopAutoShow);
      zRender.off('touchstart', zRenderMouseMove);
      zRender.off('touchend', zRenderGlobalOut);
      // zRender.off('touchcancel', zRenderGlobalOut);
    } else {
      chart.off('mousemove', stopAutoShow);
      zRender.off('mousemove', zRenderMouseMove);
      zRender.off('globalout', zRenderGlobalOut);

      chart.off('mouseover', mouseHover);
      chart.off('mouseout', mouseOut);
    }
  }

  return {
    clearLoop,
    pause: stopAutoShow,
    resume: autoShowTip,
  };
}
