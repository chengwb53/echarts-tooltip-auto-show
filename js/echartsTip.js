/**
 * Created by chengwb on 2016/9/3.
 */
(function (global, $) {
    global.tools = global.tools || {};

    /**
     * 自动轮播echarts的tooltip
     * @param chart echarts对象
     * @param option echarts数据，setOption的参数
     * @param timeInterval 轮播时间间隔，单位毫秒
     */
    tools.autoShowToolTip = function(chart, option, timeInterval) {
        var timer = 0;
        var counts = 0;
        var tooltip = chart.component.tooltip;
        var seriesIndex = 0;
        var dataCounts = option.series[seriesIndex].data.length;

        //var config = echarts.config;
        //分axis触发和item触发，hover只对item有效
        chart.on('hover', function(param) {
            counts = param.dataIndex + 1;

            if (timer) {
                clearInterval(timer);
                timer = 0;
            }
        });

        var zRender = chart.getZrender();
        zRender.on('mousemove', function (param) {
            if(param.event){
                //阻止canvas上的鼠标移动事件冒泡
                param.event.cancelBubble = true;
            }

            if (timer) {
                clearInterval(timer);
                timer = 0;
            }
        });

        $(window.document).on('mousemove', function (param) {
            if (!timer) {
                //如果鼠标在非canvas上移动，则表示已经离开canvas，继续tip轮播
                autoShowTip();
            }
        });

        /**
         * 目前不管是item触发还是axis触发都是遍历所有数据点
         * 可以优化，区分item还是axis，如果是axis，只需要循环遍历series[0]的series的data
         */
        function showTip() {
            var dataIndex = counts % dataCounts;

            //3.0以上版本的showTip使用方式
            //chart.dispatchAction({type: 'showTip', seriesIndex: seriesIndex, dataIndex: dataIndex});
            tooltip.showTip({seriesIndex: seriesIndex, dataIndex: dataIndex});

            counts += 1;
            if(counts === dataCounts) {
                counts = 0;
                seriesIndex += 1;

                if(!option.series[seriesIndex]) {
                    seriesIndex = 0;
                }

                dataCounts = option.series[seriesIndex].data.length;
            }
        }

        function autoShowTip() {
            timer = setInterval(showTip, timeInterval);
        }

        showTip();
        autoShowTip();
    };
})(window, jQuery);
