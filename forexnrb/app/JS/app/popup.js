/*
File:           popup.js
Version:        1.1.0
Last changed:   2016/05/28
Last changes:   Product name modification, bug fixes, refractoring, loading sign, data caching for optimization

Purpose:        Javascript functions to populate data into popup. Connects to Nepal Rastra Bank (NRB), 
                gets exchange rate data and shows in chart.
Author:         Sharad Subedi, Amit Jain, Dipesh Shrestha
Product:        Nepal Foreign Currency Exchange

Note:
Chrome cross-domain request -> "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --allow-file-access-from-files  --user-data-dir --disable-web-security
NRB url -> http://www.nrb.org.np/exportForexXML.php?YY=2016&MM=03&DD=31&YY1=2016&MM1=04&DD1=30
*/


'use strict';

(function () {

    /**
    *
    * Setup event listeners
    *
    */
    var App = {

        // 
        init: function() {
            // Helper.flushLocalStorage(); //only for DEBUG!

            document.querySelector('#baseCur').addEventListener('change', function() {
                ClickHandler.chooseCurrency(this.options[this.selectedIndex].text);
            });

            var chartArr = document.getElementsByClassName("np-chart");
            for(var i = 0; i < chartArr.length; i++) {
                chartArr[i].addEventListener('click', function () {
                    ClickHandler.chooseChartType(this.id);     
                });
            }

            var labelArr = document.getElementsByClassName("np-label");
            for(var i = 0; i < labelArr.length; i++) {
                labelArr[i].addEventListener('click', function () {
                    ClickHandler.chooseTrendLabel(this.id);     
                });
            }

            ClickHandler.render();
        }
    }

    /**
    *
    * Helper to get/set data into localStorage, create dates
    * -- currency, chartType, chartData, todayRate, trendDays are stored in localStorage
    *
    */
    var Helper = {

        getCurrentBaseCurrency: function() {
            if(localStorage.curBaseCurrency) {
                return localStorage.curBaseCurrency;
            }
            return "USD"; // default
        },

        setCurrentBaseCurrency: function(curBaseCurrency) {
            localStorage.curBaseCurrency = curBaseCurrency;
        },

        getChartType: function() {
            if(localStorage.chartType) {
                return localStorage.chartType;
            }
            return "column"; // default
        },

        setChartType: function(chartType) {
            localStorage.chartType = chartType;
        },

        getTrendDays: function() {
            if(localStorage.days) {
                return localStorage.days;
            }
            return "7"; // default
        },

        setTrendDays: function(days) {
            localStorage.days = days;
        },

        getTodayRate: function() {
            if(localStorage.todayRate) {
                return localStorage.todayRate;
            }
            return "N/A"; // default
        },

        setTodayRate: function(todayRate ) {
            localStorage.todayRate = todayRate;
        },

        // Get cached data for the current currency
        // 
        //  example of cached data for 7days
        //  k518400000 = {"data":{"USD":[..], "JPN":[..], ...}, "date":"29-05-2016"}
        //  
        getCachedChartData: function(days) {
            var key = "k" + days;
            var curData = Helper._getCachedChartData(days);
            var cur = Helper.getCurrentBaseCurrency();
            if(curData[cur]) {
                return curData[cur];
            }
            return null; // default
        },
        _getCachedChartData: function(days) {
            var key = "k" + days;
            if(localStorage[key]) {
                var o = JSON.parse(localStorage[key]);
                if(o !== null && Helper.getToDateParts() === o.date) {
                    var curData = o.data;
                    return curData;
                }
            }
            return {};
        },
        setCachedChartData: function(days, data) {
            var key = "k" + days;
            var curData = Helper._getCachedChartData(days) || {};
            var cur = Helper.getCurrentBaseCurrency();
            curData[cur] = data;

            var o = {"data": curData, "date": Helper.getToDateParts()}
            var str = JSON.stringify(o);
            localStorage[key] = str;
        },

        // this is needed because all calculations should be based on the NST (Nepal Standard Time)
        getNST: function(date) {
            return new Date( date.getTime() + (date.getTimezoneOffset() * 60000) + (345* 60000));
        },

        getToDateParts: function(date) {
            if(date == null) {
                date = this.getNST(new Date());
            }
            return this.formatDate(date);
        },

        getFromDateParts: function(days) {
            var date = this.getNST(new Date());
                date.setDate(date.getDate() - days + 1);
            return this.formatDate(date);
        },
        // return as dd-mm-yyyy
        formatDate: function(date) {
            var day = ("0" + date.getDate()).slice(-2),
                month = ("0" + (date.getMonth() + 1)).slice(-2), // IMP: adding 1
                year = date.getFullYear();
            return  [day, month, year].join('-');
        },
        // return date from dd-mm-yyy
        unFormatDate: function(dateStr) {
            var dateParts = dateStr.split('-'),
                date = new Date();

            date.setFullYear(dateParts[2], dateParts[1], dateParts[0])
            date.setMonth(date.getMonth() - 1); // IMP: subtracting 1

            return date;
        },
        flushLocalStorage: function() {
            for(var p in localStorage) {
                delete localStorage[p];
            }
        },
        // get trend label to be displayed in chart
        getTrendLabel: function(days) {
            var label;
            if(days==91)
                label = "3 months";
            else if(days==182)
                label = "6 months";
            else if(days==365)
                label = "1 year";
            else
                label = days + " days";
            return label;
        }
    }

    /**
    *
    * Handle user events
    * 1) change chart Types
    * 2) change currency
    * 3) change trend
    *
    */
    var ClickHandler = {
        chooseCurrency: function(currency) {
            Helper.setCurrentBaseCurrency(currency);
            ClickHandler.render();
        },
        chooseChartType: function(type) {
            Helper.setChartType(type);
            ClickHandler.render();
        },
        chooseTrendLabel: function(days) {
            Helper.setTrendDays(days);
            ClickHandler.render();
        },
        render: function() {
            var fromDate = Helper.getFromDateParts(Helper.getTrendDays()), toDate = Helper.getToDateParts();
            ClickHandler.showLoading();

            // if data is already present don't make a call
            var days = Helper.unFormatDate(toDate) - Helper.unFormatDate(fromDate);
            var cachedData = Helper.getCachedChartData(days);

            if(!cachedData) {
                ExchangeDataLoader.load(fromDate, toDate, ClickHandler.showChart, ClickHandler.showError);
            }else {
                ClickHandler.showChartFromData(cachedData);
            }
        },
        showChart: function(respData) {
            ChartCreator.generateChart(respData, "chartPlaceholder", Helper.getChartType(), 
                Helper.getFromDateParts(Helper.getTrendDays()), Helper.getToDateParts());

            ClickHandler.show();
        },
        showChartFromData: function(chartData) {
            ChartCreator.generateChartFromData(chartData, "chartPlaceholder", Helper.getChartType(), 
                Helper.getFromDateParts(Helper.getTrendDays()), Helper.getToDateParts());

            ClickHandler.show();
        },
        show:function() {
            var curBaseCurrency = Helper.getCurrentBaseCurrency(),
                todayRate = Helper.getTodayRate(),
                innerval = "Current exchange rate 1&nbsp;" + curBaseCurrency + " = " + todayRate + "&nbsp;"+"NRS";
            document.getElementById("exchangeRate").innerHTML = innerval;
            document.getElementById('curDate').innerHTML = new Date().toLocaleDateString("en-US", 
                        {weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
            document.getElementById('baseCur').value = curBaseCurrency;

            ClickHandler.showPlaceholder("chartPlaceholder");

            ClickHandler.showBold(document.getElementsByClassName('np-label'), Helper.getTrendDays());
            ClickHandler.showBold(document.getElementsByClassName('np-chart'), Helper.getChartType());
        },
        showLoading: function() {
            ClickHandler.showPlaceholder("loadingPlaceholder");
        },
        showError: function() {
            ClickHandler.showPlaceholder("errorPlaceholder");
        },
        showPlaceholder: function(elemId) {
            var elemIds = ["chartPlaceholder", "loadingPlaceholder", "errorPlaceholder"],
                i;
            for(i in elemIds) {
                if(elemId == elemIds[i]) {
                    ClickHandler.showHide(elemIds[i], true);
                } else {
                    ClickHandler.showHide(elemIds[i], false);
                }
            }
        },
        showHide: function(elemId, isShow) {
            var e;
            if(elemId == null || !(e = document.getElementById(elemId)) ) {
                return;
            }
            if(isShow) {
                e.classList.remove('hidden');
            }else {
                e.classList.add('hidden');
            }
        },
        showBold: function(elems, elemId) {
            for(var i = 0; i < elems.length; i++) {
                if(elemId == elems[i].id) {
                    ClickHandler.boldUnbold(elems[i], true);
                } else {
                    ClickHandler.boldUnbold(elems[i], false);
                }
            }
        },
        boldUnbold: function(e, isBold) {
            if(e == null) {
                return;
            }
            if(isBold) {
                e.classList.add('bold');
            }else {
                e.classList.remove('bold');
            }
        }
    }

    /**
    *
    * Get data from NRB
    *
    */
    var ExchangeDataLoader = {

        // http://www.nrb.org.np/exportForexXML.php?YY=2016&MM=03&DD=31&YY1=2016&MM1=04&DD1=30
        load: function(fromDate, toDate, onSuccess, onFailure) {
            var self = this,
                fromDateParts = fromDate.split('-'),
                toDateParts = toDate.split('-'),
                exchangeRateUrl = 'http://www.nrb.org.np/exportForexXML.php'
                + '?YY='  + fromDateParts[2]    + '&MM=' + fromDateParts[1]  + '&DD=' + fromDateParts[0] 
                + '&YY1=' + toDateParts[2]      + '&MM1=' + toDateParts[1]  + '&DD1=' + toDateParts[0];
            var req = new XMLHttpRequest();

            req.open("GET", exchangeRateUrl, true);
            req.onreadystatechange = function (oEvent) {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        onSuccess(req.responseXML);
                    } 
                    else {
                        onFailure();
                    }
                }
            };
            req.setRequestHeader("If-Modified-Since", "Wed, 01 Jan 2080 00:00:00 GMT");
            req.send();
        }
    }

    /**
    *
    * Create Chart
    * convert data from NRB & show chart
    *
    */
    var ChartCreator = {

        getChartMinRate: function(chartData) {
            return Math.floor(Math.min.apply(Math, chartData.map(function (o) { return o.y; })));
        },
        getChartMaxRate: function(chartData) {
            return Math.ceil(Math.max.apply(Math, chartData.map(function (o) { return o.y; })));
        },

        // the last one is the latest
        getChartTodayRate: function(chartData) {
            if(chartData) {
                return chartData[chartData.length - 1].y;
            }
            return "N/A";
        },
        generateChart: function(respData, chartPlaceholder, chartType, fromDate, toDate) {
            var chartData = ChartCreator.generateChartData(respData, fromDate, toDate);

            // store in the localStorage!
            var days = Helper.unFormatDate(toDate) - Helper.unFormatDate(fromDate);
            Helper.setCachedChartData(days, chartData);
            Helper.setTodayRate(ChartCreator.getChartTodayRate(chartData));

            ChartCreator.generateChartFromData(chartData, chartPlaceholder, chartType, fromDate, toDate);
        },

        generateChartFromData: function(chartData, chartPlaceholder, chartType, fromDate, toDate) {
            var chartOptions = ChartCreator.generateChartOptions(chartData, chartType),
                chart = new CanvasJS.Chart(chartPlaceholder, chartOptions);

            // store in the localStorage!
            Helper.setTodayRate(ChartCreator.getChartTodayRate(chartData));
            chart.render();
        },

        generateChartData: function (respData, fromDate, toDate) {

            var xmlDoc = respData, 
                curBaseCurrency = Helper.getCurrentBaseCurrency(),
                todayDate = toDate,
                intPath = "/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'" 
                    + curBaseCurrency + "\' and ConversionTime=\'" + todayDate + "\']/ConversionRate",
                intervalNode = xmlDoc.evaluate(intPath, xmlDoc, null, XPathResult.ANY_TYPE, null);

            // -------------------------------------------------------------------------------------------- //
            // if the toDate data isn't present, get data of an earlier date.
            // this happens generally before 10am of toDate in NST where NRB hasn't released the rates.
            var tempTodayDate = Helper.unFormatDate(toDate), tempFromDate = Helper.unFormatDate(fromDate);

            while( intervalNode.iterateNext() === null && tempTodayDate > tempFromDate) {
                tempTodayDate.setDate(tempTodayDate.getDate() - 1);
                intPath = "/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'" + curBaseCurrency 
                    + "\' and ConversionTime=\'" + Helper.formatDate(tempTodayDate) + "\']/ConversionRate";
                intervalNode = xmlDoc.evaluate(intPath, xmlDoc, null, XPathResult.ANY_TYPE, null);
            }
            // -------------------------------------------------------------------------------------------- //

            var ratePath = "/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'"+ curBaseCurrency +"\']",
                nodes = xmlDoc.evaluate(ratePath, xmlDoc, null, XPathResult.ANY_TYPE, null),
                result = nodes.iterateNext(),
                chartD = [],
                conversionTime,
                conversionRate;
            while (result)
            {
                conversionTime = result.getElementsByTagName("ConversionTime")[0].childNodes[0].nodeValue,
                conversionRate = result.getElementsByTagName("ConversionRate")[0].childNodes[0].nodeValue;
                
                chartD.push({
                    label: new String(conversionTime),
                    y: parseFloat(conversionRate)
                });
                            
                result=nodes.iterateNext();
            }

            return chartD;
        },

        generateChartOptions: function(chartData, chartType) {

            var minRate = this.getChartMinRate(chartData),
                maxRate = this.getChartMaxRate(chartData),
                chartText = Helper.getCurrentBaseCurrency() +"/NRS " 
                        + Helper.getTrendLabel(Helper.getTrendDays()) +" trend";

            return {
                theme: "theme1",
                title: {
                    text: chartText,
                    fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                    fontWeight: "bold",
                    fontColor: "#CCCC99"
                },
                animationEnabled: false,
                axisY: {
                    valueFormatString: "##0.##",
                    interval: 0.50,
                    minimum: minRate,
                    maximum: maxRate,
                    lineThickness: 1,
                    gridThickness: 1
                },
                axisX: {
                    lineThickness: 1,
                    gridThickness: 1
                },
                data: [
                {
                    type: chartType,
                    lineThickness: 2,
                    dataPoints: chartData               
                }
                ]
            }
        }
    }

    document.addEventListener('DOMContentLoaded', App.init);
})();