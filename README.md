# echarts tooltip carousel
echarts中tooltip自动轮播工具

## api
function loopShowTooltip (chart, chartOption, options);
|参数|说明|
----------
| chart        |    ECharts实例                       |
-------------------------------------------------------
| chartOption  |    ECharts配置信息                   |
-------------------------------------------------------
|options|    {
              interval    轮播时间间隔，单位毫秒，默认为2000
         	 loopSeries  boolean类型，默认为false。
         	               true表示循环所有series的tooltip，false则显示指定seriesIndex的tooltip
         	 seriesIndex 默认为0，指定某个系列（option中的series索引）循环显示tooltip，
         	 	            当loopSeries为true时，从seriesIndex系列开始执行。
         	  updateData  自定义更新数据的函数，默认为null；
         	              用于类似于分页的效果，比如总数据有20条，chart一次只显示5条，全部数据可以分4次显示。
         	  }|
返回值：
{clearLoop: clearLoop}