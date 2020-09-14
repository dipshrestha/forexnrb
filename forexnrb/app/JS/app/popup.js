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
Chrome cross-domain request -> "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --allow-file-access-from-files  --user-data-dir="/tmp" --disable-web-security
NRB url -> https://www.nrb.org.np/api/forex/v1/rates?from=2020-09-01&to=2020-09-15&per_page=100&page=1
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

    return {
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
          delete localStorage[p];
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
        var fromDate = helper.getFromDateParts(helper.getTrendDays()),
          toDate = helper.getToDateParts();
        this.showLoading();

        // if data is already present don't make a call
        var days = helper.unFormatDate(toDate) - helper.unFormatDate(fromDate);
        var cachedData = helper.getCachedChartData(days);

        if (!cachedData) {
          var success = this.showChart.bind(this),
            failure = this.showError.bind(this);
          exchangeDataLoader.load(fromDate, toDate, success, failure);
        } else {
          this.showChartFromData(cachedData);
        }
      },
      showChart: function(respData) {
        chartCreator.generateChart(respData, "chartPlaceholder", helper.getChartType(),
          helper.getFromDateParts(helper.getTrendDays()), helper.getToDateParts());

        this.show();
      },
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

    // https://www.nrb.org.np/exportForexXML.php?YY=2016&MM=03&DD=31&YY1=2016&MM1=04&DD1=30
    // check the 'pages' parameter in response
    // and if it's > 1 then do subsequent ajax calls to fetch all data
    this.load = function(fromDate, toDate, onSuccess, onFailure) {

      var fromDateParts = fromDate.split('-'),
        toDateParts = toDate.split('-'),
        exchangeRateUrl = 'https://www.nrb.org.np/api/forex/v1/rates' +
        '?from=' + fromDateParts[2] + '-' + fromDateParts[1] + '-' + fromDateParts[0] +
        '&to=' + toDateParts[2] + '-' + toDateParts[1] + '-' + toDateParts[0] +
        '&per_page=100';

      const myHeaders = new Headers();
      //myHeaders.append('pragma', 'no-cache');
      //myHeaders.append('Cache-Control', 'no-cache');

      const settings = {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors',
        //cache: 'no-cache',
      };
      const myRequest = new Request(exchangeRateUrl + '&page=1', settings);

      fetch(myRequest)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          let payloads = [];
          if (data && data.status && data.status.code != 200) {
            throw new Error(JSON.stringify(data.errors.validation));
          }
          const pages = data.pagination && data.pagination.pages;
          payloads = data.data && data.data.payload || [];
          if (pages > 1) {
            const requests = [];
            for (var i = 2; i <= pages; i++) {
              requests.push(new Request(exchangeRateUrl + '&page=' + i, settings));
            }
            Promise.all(requests.map(r => fetch(r))).then(responses =>
              Promise.all(responses.map(res => res.json()))
            ).then(jsons => {
              payloads = payloads.concat(jsons.flatMap(i => i.data && i.data.payload) || []);
              onSuccess(payloads);
            })
          } else {
            onSuccess(payloads);
          }
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
        var chartData = this.generateChartData(respData, fromDate, toDate);

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

    // helper.flushLocalStorage(); //only for DEBUG!
    app.init();
  }

  document.addEventListener('DOMContentLoaded', onLoad);
})();