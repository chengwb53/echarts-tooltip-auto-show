# echarts tooltip carousel
echarts中tooltip自动轮播工具
## api
loopShowTooltip: (chart: EChartsType, chartOption: EChartsOption, options: IEChartsToolOptions) => IEChartsToolReturn;

参数 | 类型                  | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                  
---|---|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
chart | EChartsType | ECharts实例                                                                                                                                                                                                                                                                                                                                                                                                                                           
chartOption | EChartsOption | ECharts配置信息                                                                                                                                                                                                                                                                                                                                                                                                                                         
options | IEChartsToolOptions | {<br>interval: number类型， 轮播时间间隔，单位毫秒，默认为2000 <br> loopSeries:  boolean类型，默认为false。true表示循环所有series的tooltip；false则显示指定seriesIndex的tooltip。 <br> seriesIndex: number类型，默认为0，指定某个系列（option中的series索引）循环显示tooltip，当loopSeries为true时，从seriesIndex系列开始执行。 <br> updateData?:  (() => void) \| null, 自定义更新数据的函数，默认为null；用于类似于分页的效果，比如总数据有20条，chart一次只显示5条，全部数据可以分4次显示。 <br> bounce?: ((data: any, seriesIndex: number, dataIndex: number) => void) \| null, 每次tooltip轮播显示后的回调函数，可以处理自定义功能，参数分别是当前显示tooltip的项的数据、系列索引、数据索引。 <br>} 
返回值：| IEChartsToolReturn  | 异常或者错误时返回undefined <br> 正常情况返回：{<br>clearLoop: function(){} 清除轮播,<br>pause: function(){} 暂停轮播, <br>resume: function() {} 恢复轮播（只能恢复暂停的轮播，清除轮播后不可恢复）<br>}                                                                                                                                                                                                                                                                                                                                     

## 安装使用
支持npm安装：
```cmd
npm install echarts echarts-tooltip-auto-show
```

```ts
import * as echarts from 'echarts';
import { loopShowTooltip } from 'echarts-tooltip-auto-show';

const chartOption = {
  title: {
    text: '某地区蒸发量和降水量',
    subtext: '纯属虚构'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['蒸发量', '降水量']
  },
  toolbox: {
    show: true,
    feature: {
      dataView: {show: true, readOnly: false},
      magicType: {show: true, type: ['line', 'bar']},
      restore: {show: true},
      saveAsImage: {show: true}
    }
  },
  calculable: true,
  xAxis: [
    {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    }
  ],
  yAxis: [
    {
      type: 'value'
    }
  ],
  series: [
    {
      name: '蒸发量',
      type: 'bar',
      data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3],
      markPoint: {
        data: [
          {type: 'max', name: '最大值'},
          {type: 'min', name: '最小值'}
        ]
      },
      markLine: {
        data: [
          {type: 'average', name: '平均值'}
        ]
      }
    },
    {
      name: '降水量',
      type: 'bar',
      data: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3],
      markPoint: {
        data: [
          {name: '年最高', value: 182.2, xAxis: 7, yAxis: 183},
          {name: '年最低', value: 2.3, xAxis: 11, yAxis: 3}
        ]
      },
      markLine: {
        data: [
          {type: 'average', name: '平均值'}
        ]
      }
    }
  ]
};

// 基于准备好的dom，初始化echarts图表
const chart = echarts.init(document.getElementById('id'));

// 为echarts对象加载数据
chart.setOption(option);

// 开始轮播显示
const echartsTool = loopShowTooltip(chart, chartOption, {
  loopSeries: true
});

// 暂停轮播
echartsTool.pause();
// 继续轮播
echartsTool.resume();
// 清除轮播
echartsTool.clearLoop();
```

## 例子
[example](https://github.com/chengwubin/echarts-tooltip-cyclic-display/blob/master/examples.html)<br>
```JavaScript
  // 基于准备好的dom，初始化echarts图表
  let chart = echarts.init(document.getElementById('id'));
  let chartOption = {
    // ...
  };

  // 为echarts对象加载数据
  chart.setOption(chartOption);
    
  // 调用本工具接口
  tools.loopShowTooltip(chart, chartOption, {
    loopSeries: true
  });
```
### 更新数据
```JavaScript
  let data = [{
    name: '2000',
     value: 55
  }, {
    name: '2001',
    value: 67
  }, {
    name: '2002',
    value: 60
  }, {
    name: '2003',
    value: 73
    }, {
    name: '2004',
    value: 93
  }, {
    name: '2005',
    value: 100
  }, {
    name: '2006',
    value: 220
  }, {
    name: '2007',
    value: 220
  }, {
    name: '2008',
    value: 220
  }, {
    name: '2009',
    value: 220
  }, {
    name: '2010',
    value: 220
  }];
  
  let currentPage = 0; // 当前页
  let counts = 2; // 每页条数
  let total = data.length; // 总数
  let totalPage = Math.ceil(total / counts); // 总页数
  let chartOption = {
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: []
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: [],
            type: 'bar'
          }]
    };
  
  function updateData() {
    let xAxisData = [];
    let seriesData = [];
  
    let currentData = data.slice(currentPage * counts, (currentPage + 1) * counts);
    currentData.forEach(function (item) {
      xAxisData.push(item.name);
      seriesData.push(item.value);
    });
  
    currentPage = ++currentPage % totalPage;
  
    bar.xAxis.data = xAxisData;
    bar.series[0].data = seriesData;
  }
 
  updateData();

  // 基于准备好的dom，初始化echarts图表
  let chart = echarts.init(document.getElementById('id'));
 
  // 为echarts对象加载数据
  chart.setOption(chartOption);
    
  // 调用本工具接口
  tools.loopShowTooltip(chart, chartOption, {
    loopSeries: true,
    updateData: updateData
  });
```

### 效果展示
![scatter.gif](example%2Fimage%2Fscatter.gif)
![line.gif](example%2Fimage%2Fline.gif)
![bar.gif](example%2Fimage%2Fbar.gif)
![update.gif](example%2Fimage%2Fupdate.gif)

## License
[MIT](https://github.com/chengwubin/echarts-tooltip-cyclic-display/blob/master/LICENSE)
