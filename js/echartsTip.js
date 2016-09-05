/**
 * Created by chengwb on 2016/9/3.
 */
(function (global, $) {
    global.tools = global.tools || {};

    /**
     * 自动轮播echarts的tooltip（类型支持line、bar、scatter、k、radar、map、pie、chord）
     * @param chart echarts对象
     * @param timeInterval 轮播时间间隔，单位毫秒
     */
    tools.autoShowToolTip = function(chart, timeInterval) {
        var timer = 0;
        var counts = 0;
        var tooltip = chart.component.tooltip;
        var seriesIndex = 0;

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
                //param.event.cancelBubble = true;

                //判断鼠标是否在canvas上
                var $dom = $(chart.dom);
                var chartPosition = $dom.offset();
                var domWidth = $dom.width() - 5;
                var domHeight = $dom.height() - 5;

                if(event.x >= chartPosition.left && event.x <= chartPosition.left + domWidth &&
                    event.y >= chartPosition.top && event.y <= chartPosition.top + domHeight){
                    if (timer) {
                        clearInterval(timer);
                        timer = 0;
                    }
                }
            }
        });

        //监听这两个事件才能较好的触发自动
        $(window.document).on('mousemove', function (param) {
            if (!timer) {
                //如果鼠标在非canvas上移动，则表示已经离开canvas，继续tip轮播
                autoShowTip();
            }
        });
        zRender.on('globalout', function () {
            if (!timer) {
                autoShowTip();
            }
        });

        //待完善监听canvas上滚动条变化，重置counts=0

        /**
         * 目前不管是item触发还是axis触发都是遍历所有数据点
         * 可以优化，区分item还是axis，如果是axis，只需要循环遍历series[0]的series的data
         *
         * tooltip.showTip()的参数只针对当前canvas上可见的数据有效
         */
        function showTip() {
            //每次都获取数据个数，获取canvas上可见的数据个数
            var series = chart.getSeries();
            var dataCounts = series[seriesIndex].data.length;
            var dataIndex = counts % dataCounts;
            var chartType = series[seriesIndex].type;

            //3.0以上版本的showTip使用方式
            //chart.dispatchAction({type: 'showTip', seriesIndex: seriesIndex, dataIndex: dataIndex});

            /**
             * 参数格式：{ seriesIndex: 0, seriesName:'', dataIndex:0 } // line、bar、scatter、k、radar，其中dataIndex必须，seriesIndex、seriesName指定一个即可
             * 参数格式：{ seriesIndex: 0, seriesName:'', name:'' } // map、pie、chord，其中name必须，seriesIndex、seriesName指定一个即可
             */
            var params = {seriesIndex: seriesIndex};
            switch(chartType) {
                case 'map':
                case 'pie':
                case 'chord':
                    params.name = series[seriesIndex].data[dataIndex].name;
                    break;
                default:
                    params.dataIndex = dataIndex;
                    break;
            }
            tooltip.showTip(params);

            counts += 1;
            if(counts === dataCounts) {
                counts = 0;
                seriesIndex += 1;

                if(!series[seriesIndex]) {
                    seriesIndex = 0;
                }
            }
        }

        function autoShowTip() {
            timer = setInterval(showTip, timeInterval);
        }

        showTip();
        autoShowTip();
    };
})(window, jQuery);
