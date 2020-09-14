/*
File:           popup.js
Version:        1.2.1
Last changed:   2020/09/12
Last changes:   NRB moved to JSON format from XML, so changes to support that.

Purpose:        Javascript functions to populate data into popup. Connects to Nepal Rastra Bank (NRB), 
                gets exchange rate data and shows in chart.
Author:         Sharad Subedi, Amit Jain, Dipesh Shrestha
Product:        Nepal Foreign Currency Exchange

Note:
Chrome cross-domain request -> "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --allow-file-access-from-files  --user-data-dir="~/forexnrb/" --disable-web-security
NRB url -> https://www.nrb.org.np/exportForexXML.php?YY=2016&MM=03&DD=31&YY1=2016&MM1=04&DD1=30
*/


'use strict';

(function() {

  /**
   *
   * Setup event listeners
   *
   */
  var App = function(clickHandler) {

    this.init = function() {

      document.querySelector('#baseCur').addEventListener('change', function() {
        clickHandler.chooseCurrency(this.value);
      });

      var chartArr = document.getElementsByClassName("np-chart");
      for (var i = 0; i < chartArr.length; i++) {
        chartArr[i].addEventListener('click', function() {
          clickHandler.chooseChartType(this.id);
        });
      }

      var labelArr = document.getElementsByClassName("np-label");
      for (var i = 0; i < labelArr.length; i++) {
        labelArr[i].addEventListener('click', function() {
          clickHandler.chooseTrendLabel(this.id);
        });
      }

      clickHandler.render();
    }
  }

  /**
   *
   * Helper to get/set data into localStorage, create dates
   * -- currency, chartType, chartData, todayRate, trendDays are stored in localStorage
   *
   */
  var Helper = function() {
    var minDate, maxDate,
      MAX_DAYS = 182;

    return {
      getMinDate: function() {
        return minDate || localStorage.getItem('minDate') || this.formatDate1(this.getNST(new Date()));
      },
      getMaxDate: function() {
        return maxDate || localStorage.getItem('maxDate') || this.formatDate1(this.getNST(new Date()));
      },
      setMinDate: function(val) {
        minDate = val;
        localStorage.getItem('minDate');
      },
      setMaxDate: function(val) {
        maxDate = val;
        localStorage.getItem('maxDate');
      },
      getCurrentBaseCurrency: function() {
        if (localStorage.curBaseCurrency) {
          return localStorage.curBaseCurrency;
        }
        return "USD"; // default
      },

      setCurrentBaseCurrency: function(curBaseCurrency) {
        localStorage.curBaseCurrency = curBaseCurrency;
      },

      getChartType: function() {
        if (localStorage.chartType) {
          return localStorage.chartType;
        }
        return "column"; // default
      },

      setChartType: function(chartType) {
        localStorage.chartType = chartType;
      },

      getTrendDays: function() {
        if (localStorage.days) {
          return localStorage.days;
        }
        return "7"; // default
      },

      setTrendDays: function(days) {
        localStorage.days = days;
      },

      getTodayRate: function() {
        if (localStorage.todayRate) {
          return localStorage.todayRate;
        }
        return "N/A"; // default
      },

      setTodayRate: function(todayRate) {
        localStorage.todayRate = todayRate;
      },

      // Get cached data for the current currency
      // 
      //  example of cached data for 7days
      //  k518400000 = {"data":{"USD":[..], "JPN":[..], ...}, "date":"29-05-2016"}
      //  
      getCachedChartData: function(days) {
        var key = "k" + days;
        var curData = this._getCachedChartData(days);
        var cur = this.getCurrentBaseCurrency();
        if (curData[cur] && curData[cur].length > 0) {
          return curData[cur];
        }
        return null; // default
      },
      _getCachedChartData: function(days) {
        var key = "k" + days;
        if (localStorage[key]) {
          var o = JSON.parse(localStorage[key]);
          if (o !== null && this.getToDateParts() === o.date) {
            var curData = o.data;
            return curData;
          }
        }
        return {};
      },
      /**
       * Not all days data is returned from NRB!!
       * 
       * [getCachedChartData description]
       * @param  {[type]} fromDateStr [description]
       * @param  {[type]} toDateStr   [description]
       * @return {[type]}           [description]
       */
      getCachedChartData1: function(fromDateStr, toDateStr) {
        const diff = this.dateDiff(this.getNST(new Date(toDateStr)), this.getNST(new Date(fromDateStr))) + 1;
        var payload = [],
          localMinDate = null;
        var y = localStorage.getItem(fromDateStr);
        if (!y) return false;
        y = localStorage.getItem(toDateStr);
        if (!y) return false;

        for (var i = 0; i < diff; i++) {
          var k = this.changeAndFormatDate(fromDateStr, i); //this.formatDate1(this.changeDate(fromDateStr, i));
          var t = localStorage.getItem(k);
          //if (!t) {
          //  return false;
          //}
          payload.push(JSON.parse(t));
        }

        var curBaseCurrency = this.getCurrentBaseCurrency(),
          chartD = [];
        return this.generateChartData(payload.flat(), fromDateStr, toDateStr)
      },

      setCachedChartData1: function(payload) {
        payload.forEach(p => {
          if (this.getMinDate() > p.date) // no need to create date object
            this.setMinDate(p.date);
          if (this.getMaxDate() < p.date)
            this.setMaxDate(p.date);
          p.rates.forEach(r => r.date = p.date);
          localStorage.setItem(p.date, JSON.stringify(p.rates));
        });

        this.pruneCachedChartData();
      },
      // https://stackoverflow.com/questions/7763327/how-to-calculate-date-difference-in-javascript
      dateDiff: function(date1, date2) {
        date1.setHours(0);
        date1.setMinutes(0, 0, 0);
        date2.setHours(0);
        date2.setMinutes(0, 0, 0);
        var diff = date1.getTime() - date2.getTime(); // difference 
        return parseInt(diff / (24 * 60 * 60 * 1000), 10); //Convert values days and return value      
      },
      changeDate: function(dateStr, diff) {
        var tmpDate = this.getNST(new Date(dateStr));
        if (diff == 0) return tmpDate;
        return this.getNST(new Date(tmpDate.setDate(tmpDate.getDate() + diff)));
      },
      changeAndFormatDate: function(dateStr, diff) {
        var tmpDate = new Date(dateStr);
        if (diff != 0) {
          if (diff < 0) diff++;
          tmpDate = new Date(tmpDate.setDate(tmpDate.getDate() + diff));
        }

        var d = this.getNST(new Date(tmpDate))
        var yy = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
        var mm = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d)
        var dd = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)

        return `${yy}-${mm}-${dd}`;
      },
      /**
       * Remove the dates minDate to newMinDate from the localStorage
       *
       * minDate --- newMinDate --- maxDate
       * 
       * @return
       */
      pruneCachedChartData: function() {
        const newMinDate = this.changeDate(this.getMaxDate(), -MAX_DAYS)

        const diff = this.dateDiff(newMinDate, this.getNST(new Date(this.getMinDate())));
        for (var i = 0; i < diff - 1; i++) {
          var k = this.changeAndFormatDate(newMinDate, i); //this.formatDate1(this.changeDate(newMinDate, i));
          localStorage.removeItem(k);
        }
        if (diff > 0)
          this.setMinDate(this.formatDate1(newMinDate));
      },

      /**
       * return date in YYYY-MM-DD format
       * 
       * @param  {[type]} val [description]
       * @return {[String]}     [description]
       */
      formatDate1: function(val) {
        var d = this.getNST(new Date(val))
        var yy = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
        var mm = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d)
        var dd = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)

        return `${yy}-${mm}-${dd}`;
      },

      generateChartData: function(payload, fromDate, toDate) {
        var curBaseCurrency = this.getCurrentBaseCurrency(),
          chartD = [];

        payload.
        /*flatMap(p => {
                  p.rates.forEach(r => r.date = p.date);
                  return p.rates;
                }).*/
        filter(r => r && r.currency && r.currency.iso3 == curBaseCurrency).forEach(r =>
          chartD.push({
            label: new String(r.date),
            y: parseFloat(r.sell)
          })
        );

        return chartD;
      },
      setCachedChartData: function(days, data) {
        var key = "k" + days;
        var curData = this._getCachedChartData(days) || {};
        var cur = this.getCurrentBaseCurrency();
        curData[cur] = data;

        var o = { "data": curData, "date": this.getToDateParts() }
        var str = JSON.stringify(o);
        localStorage[key] = str;
      },

      // this is needed because all calculations should be based on the NST (Nepal Standard Time)
      getNST: function(date) {
        return new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (345 * 60000));
      },

      getToDateParts: function(date) {
        if (date == null) {
          date = this.getNST(new Date());
        }
        return this.formatDate(date);
      },

      getFromDateStr: function(days) {
        var date = this.getNST(new Date());
        return this.changeAndFormatDate(date, -days); //this.formatDate1(this.changeDate(date, -days));
      },
      getToDateStr: function(date) {
        if (date == null) {
          date = this.getNST(new Date());
        }
        return this.formatDate1(date);
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
        return [day, month, year].join('-');
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
        for (var p in localStorage) {
          localStorage.removeItem(p);
        }
      },
      // get trend label to be displayed in chart
      getTrendLabel: function(days) {
        var label;
        if (days == 91)
          label = "3 months";
        else if (days == 182)
          label = "6 months";
        else if (days == 365)
          label = "1 year";
        else
          label = days + " days";
        return label;
      }
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
  var ClickHandler = function(helper, exchangeDataLoader, chartCreator) {

    return {
      chooseCurrency: function(currency) {
        helper.setCurrentBaseCurrency(currency);
        this.render();
      },
      chooseChartType: function(type) {
        helper.setChartType(type);
        this.render();
      },
      chooseTrendLabel: function(days) {
        helper.setTrendDays(days);
        this.render();
      },
      render: function() {
        var fromDate = helper.getFromDateStr(helper.getTrendDays()), //helper.getFromDateParts(helper.getTrendDays()),
          toDate = helper.getToDateStr(); //helper.getToDateParts();
        this.showLoading();

        // if data is already present don't make a call
        //var days = helper.unFormatDate(toDate) - helper.unFormatDate(fromDate);
        var cachedData = helper.getCachedChartData1(fromDate, toDate);

        if (!cachedData) {
          // if the fromDate is less than minDate
          var localMinDate = helper.getMinDate(),
            localMaxDate = helper.getMaxDate();
          if (helper.dateDiff(helper.getNST(new Date(localMinDate)), helper.getNST(new Date(fromDate))) > 0) {
            localMinDate = fromDate;
          }
          if (helper.dateDiff(helper.getNST(new Date(localMaxDate)), helper.getNST(new Date(toDate))) < 0) {
            localMaxDate = toDate;
          }
          var success = this.showChart1.bind(this),
            failure = this.showError.bind(this);
          exchangeDataLoader.load(localMinDate, localMaxDate, success, failure);
        } else {
          this.showChartFromData(cachedData);
        }
      },
      showChart: function(respData) {
        chartCreator.generateChart(respData, "chartPlaceholder", helper.getChartType(),
          helper.getFromDateParts(helper.getTrendDays()), helper.getToDateParts());

        this.show();
      },
      showChart1: function(payload) {
        helper.setCachedChartData1(payload);
        var fromDate = helper.getFromDateStr(helper.getTrendDays()),
          toDate = helper.getToDateStr();
        var chartData = helper.getCachedChartData1(fromDate, toDate);
        //chartCreator.generateChartFromData(payload);
        this.showChartFromData(chartData);
        //this.show();
      },
      /*
      generateChartData: function(payload, fromDate, toDate) {
        var curBaseCurrency = this.getCurrentBaseCurrency(),
          chartD = [];

        payload.flatMap(p => {
          p.rates.forEach(r => r.date = p.date);
          return p.rates;
        }).filter(r => r.currency.iso3 == curBaseCurrency).forEach(r =>
          chartD.push({
            label: new String(r.date),
            y: parseFloat(r.sell)
          })
        );

        return chartD;
      },
      */
      //payload
      showChartFromData: function(chartData) {
        chartCreator.generateChartFromData(chartData, "chartPlaceholder", helper.getChartType(),
          helper.getFromDateParts(helper.getTrendDays()), helper.getToDateParts());

        this.show();
      },
      show: function() {
        var curBaseCurrency = helper.getCurrentBaseCurrency(),
          todayRate = helper.getTodayRate(),
          innerval = "Current exchange rate 1&nbsp;" + curBaseCurrency + " = " + todayRate + "&nbsp;" + "NRS";
        document.getElementById("exchangeRate").innerHTML = innerval;
        document.getElementById('curDate').innerHTML = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        document.getElementById('baseCur').value = curBaseCurrency;

        this.showPlaceholder("chartPlaceholder");

        this.showBold(document.getElementsByClassName('np-label'), helper.getTrendDays());
        this.showBold(document.getElementsByClassName('np-chart'), helper.getChartType());
      },
      showLoading: function() {
        this.showPlaceholder("loadingPlaceholder");
      },
      showError: function(res) {
        console.error(res);
        this.showPlaceholder("errorPlaceholder");
      },
      showPlaceholder: function(elemId) {
        var elemIds = ["chartPlaceholder", "loadingPlaceholder", "errorPlaceholder"],
          i;
        for (i in elemIds) {
          if (elemId == elemIds[i]) {
            this.showHide(elemIds[i], true);
          } else {
            this.showHide(elemIds[i], false);
          }
        }
      },
      showHide: function(elemId, isShow) {
        var e;
        if (elemId == null || !(e = document.getElementById(elemId))) {
          return;
        }
        if (isShow) {
          e.classList.remove('hidden');
        } else {
          e.classList.add('hidden');
        }
      },
      showBold: function(elems, elemId) {
        for (var i = 0; i < elems.length; i++) {
          if (elemId == elems[i].id) {
            this.boldUnbold(elems[i], true);
          } else {
            this.boldUnbold(elems[i], false);
          }
        }
      },
      boldUnbold: function(e, isBold) {
        if (e == null) {
          return;
        }
        if (isBold) {
          e.classList.add('bold');
        } else {
          e.classList.remove('bold');
        }
      }
    }
  }

  /**
   *
   * Get data from NRB
   *
   */
  var ExchangeDataLoader = function() {

    // TODO: check the 'pages' parameter in response
    // and if it's > 1 then do subsequent ajax calls to fetch all data
    this.load = function(fromDate, toDate, onSuccess, onFailure) {

      var exchangeRateUrl = 'https://www.nrb.org.np/api/forex/v1/rates' +
        '?from=' + fromDate +
        '&to=' + toDate +
        '&per_page=100&page=1';

      const myHeaders = new Headers();
      //myHeaders.append('pragma', 'no-cache');
      //myHeaders.append('Cache-Control', 'no-cache');

      const myRequest = new Request(exchangeRateUrl, {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors',
        cache: 'no-cache',
      });

      fetch(myRequest)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data && data.status && data.status.code != 200) {
            throw new Error(JSON.stringify(data.errors.validation));
          }
          onSuccess(data.data && data.data.payload || []);
        })
        .catch(error => {
          onFailure(error);
        });
    }
  }

  /**
   *
   * Create Chart
   * convert data from NRB & show chart
   *
   */
  var ChartCreator = function(helper) {

    return {
      getChartMinRate: function(chartData) {
        return Math.floor(Math.min.apply(Math, chartData.map(function(o) { return o.y; })));
      },
      getChartMaxRate: function(chartData) {
        return Math.ceil(Math.max.apply(Math, chartData.map(function(o) { return o.y; })));
      },

      // the last one is the latest
      getChartTodayRate: function(chartData) {
        if (chartData) {
          return chartData[chartData.length - 1].y;
        }
        return "N/A";
      },
      generateChart: function(respData, chartPlaceholder, chartType, fromDate, toDate) {
        var chartData = helper.generateChartData(respData, fromDate, toDate);

        // store in the localStorage!
        var days = helper.unFormatDate(toDate) - helper.unFormatDate(fromDate);
        helper.setCachedChartData(days, chartData);
        helper.setTodayRate(this.getChartTodayRate(chartData));

        this.generateChartFromData(chartData, chartPlaceholder, chartType, fromDate, toDate);
      },
      generateChartFromData: function(chartData, chartPlaceholder, chartType, fromDate, toDate) {
        var chartOptions = this.generateChartOptions(chartData, chartType),
          chart = new CanvasJS.Chart(chartPlaceholder, chartOptions);

        // store in the localStorage!
        helper.setTodayRate(this.getChartTodayRate(chartData));
        chart.render();
      },
      /*
            generateChartData: function(payload, fromDate, toDate) {
              var curBaseCurrency = helper.getCurrentBaseCurrency(),
                chartD = [];

              payload.flatMap(p => {
                p.rates.forEach(r => r.date = p.date);
                return p.rates;
              }).filter(r => r.currency.iso3 == curBaseCurrency).forEach(r =>
                chartD.push({
                  label: new String(r.date),
                  y: parseFloat(r.sell)
                })
              );

              return chartD;
            },
      */
      generateChartOptions: function(chartData, chartType) {

        var minRate = this.getChartMinRate(chartData),
          maxRate = this.getChartMaxRate(chartData),
          chartText = helper.getCurrentBaseCurrency() + "/NRS " +
          helper.getTrendLabel(helper.getTrendDays()) + " trend";

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
          data: [{
            type: chartType,
            lineThickness: 2,
            dataPoints: chartData
          }]
        }
      }
    }
  }

  /**
   *
   * Inject dependencies and start
   *
   */
  function onLoad() {

    var helper = new Helper();
    var exchangeDataLoader = new ExchangeDataLoader();
    var chartCreator = new ChartCreator(helper);
    var clickHandler = new ClickHandler(helper, exchangeDataLoader, chartCreator);
    var app = new App(clickHandler);

    helper.flushLocalStorage(); //only for DEBUG!
    app.init();
  }

  document.addEventListener('DOMContentLoaded', onLoad);
})();