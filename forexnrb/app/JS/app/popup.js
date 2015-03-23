/*
File:           popup.js
Version:        1.0
Last changed:   2015/03/08
Purpose:        Javascript functions to populate data into popup
Author:         Sharad Subedi, Amit Jain, Dipesh Shrestha
Product:        Foreign Currency Exchange NRB
*/

var sysDate = new Date();
var d= new Date( sysDate.getTime() + (sysDate.getTimezoneOffset() * 60000) + (345* 60000));

var month = ("0" + (d.getMonth() + 1)).slice(-2);
var day = ("0" + d.getDate()).slice(-2);
var year = d.getFullYear();
var d1 = new Date( sysDate.getTime() + (sysDate.getTimezoneOffset() * 60000) + (345* 60000));
d1.setDate(d1.getDate() - 7);

var month1 = ("0" + (d1.getMonth() + 1)).slice(-2);
var day1 = ("0" + d1.getDate()).slice(-2);
var year1 = d1.getFullYear();

var chartD = [];
var curBaseCurrency = "USD";
if(localStorage.curBaseCurrency !== undefined & localStorage.curBaseCurrency != "") {
    curBaseCurrency = localStorage.curBaseCurrency;
}

var chartType = "column";
if(localStorage.chartType !== undefined & localStorage.chartType != "") {
    chartType = localStorage.chartType;
}

var trendDays = "7 days";
if(localStorage.trendDays !== undefined & localStorage.trendDays != "") {
    trendDays = localStorage.trendDays;
}

var exchangeDataLoader = {

    LoadExchangeRate: function () {
		var getExchangeRateUrl = 'http://www.nrb.org.np/exportForexXML.php?YY=' + year1 + '&MM=' + month1 + '&DD=' + day1 + '&YY1=' + year + '&MM1=' + month + '&DD1=' + day + '';
        var req = new XMLHttpRequest();
        req.open("GET", getExchangeRateUrl, true);
        req.setRequestHeader("If-Modified-Since", "Wed, 01 Jan 2020 00:00:00 GMT");
        req.onload = this.showGetResponseData.bind(this);
        req.send(null);

        // for analytics
        var req1 = new XMLHttpRequest();
        req1.open("GET", "http://www3.clustrmaps.com/stats/maps-no_clusters/nepelasedevelopers.me-thumb.jpg", true);
        req1.setRequestHeader("If-Modified-Since", "Sat, 01 Jan 2005 00:00:00 GMT");
        req1.send(null);
    },

    showGetResponseData: function (respData) {

        var xmlDoc = respData.target.responseXML;		
		var todayDate=day+'-'+month+'-'+year;
		var intPath = "/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'"+ curBaseCurrency +"\' and ConversionTime=\'"+todayDate+"\']/ConversionRate";
		var intervalNode = xmlDoc.evaluate(intPath, xmlDoc, null, XPathResult.ANY_TYPE, null);
		var todayRate = intervalNode.iterateNext().childNodes[0].nodeValue;
		var ratepath="/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'"+ curBaseCurrency +"\']";
		var nodes=xmlDoc.evaluate(ratepath, xmlDoc, null, XPathResult.ANY_TYPE, null);
		var result=nodes.iterateNext();		
		chartD = [];
		while (result)
		{
			var ConversionTime = result.getElementsByTagName("ConversionTime")[0].childNodes[0].nodeValue;
            var rate = result.getElementsByTagName("ConversionRate")[0].childNodes[0].nodeValue;
            
			chartD.push({
				label: new String(ConversionTime),
				y: parseFloat(rate)
			});
            			
			result=nodes.iterateNext();
		}

        this.generateChart(chartD);
        var innerval = "Today's exchange rate 1&nbsp;" + curBaseCurrency + " = " + todayRate + "&nbsp;"+"NRS";
        document.getElementById("exchangeRate").innerHTML = innerval;
        document.getElementById('curDate').innerHTML = sysDate.toLocaleDateString("en-US",{weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
    },

    generateChart: function (chartData) {
        var minRate = Math.floor(Math.min.apply(Math, chartData.map(function (o) { return o.y; })));
        var maxRate = Math.ceil(Math.max.apply(Math, chartData.map(function (o) { return o.y; })));
        if(minRate == maxRate && minRate % 1 === 0) {
            minRate--;
            maxRate++;
        }

        var chart = new CanvasJS.Chart("chartContainer", {
            theme: "theme2",
            title: {
                text: curBaseCurrency+"/NRS " + trendDays +" trend",
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
        });
        chart.render();
    }  
};

function loadBaseCru() {
    var dd = document.getElementById('baseCur');
    for (var i = 0; i < dd.options.length; i++) {
        if (dd.options[i].text === curBaseCurrency) {
            dd.selectedIndex = i;
            break;
        }
    }
}

function changeBaseCur() {
    curBaseCurrency = document.getElementById("baseCur").value;
    localStorage.curBaseCurrency = curBaseCurrency;
    exchangeDataLoader.LoadExchangeRate();
}

function ChooseChartType(hitId) {
    chartType = hitId;
    localStorage.chartType = chartType;
    exchangeDataLoader.generateChart(chartD);
}

function setFromDate(days){
	d1 = new Date( sysDate.getTime() + (sysDate.getTimezoneOffset() * 60000) + (345* 60000));
	d1.setDate(d1.getDate() - days);

	month1 = ("0" + (d1.getMonth() + 1)).slice(-2);
	day1 = ("0" + d1.getDate()).slice(-2);
	year1 = d1.getFullYear();
	if(days==91)
		trendDays = "3 months";
	else if(days==182)
		trendDays = "6 months";
	else if(days==365)
		trendDays = "1 year";
	else
		trendDays = days+" days";
    localStorage.trendDays = trendDays;
	exchangeDataLoader.LoadExchangeRate();
}

// Run exchangeDataLoader  script as DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
    loadBaseCru();
    exchangeDataLoader.LoadExchangeRate();
    document.querySelector('#baseCur').addEventListener('change', changeBaseCur);
    document.getElementById('line').addEventListener('click', function () {
        ChooseChartType(this.id);
    });
    document.getElementById('column').addEventListener('click', function () {
        ChooseChartType(this.id);
    });
	document.getElementById('seven').addEventListener('click', function () {
        setFromDate(7);		
    });
	document.getElementById('fifteen').addEventListener('click', function () {
        setFromDate(15);
    });
	document.getElementById('thirty').addEventListener('click', function () {
        setFromDate(30);
    });
	document.getElementById('sixty').addEventListener('click', function () {
        setFromDate(60);
    });
	document.getElementById('three').addEventListener('click', function () {
        setFromDate(91);
    });
	document.getElementById('six').addEventListener('click', function () {
        setFromDate(182);
    });
	document.getElementById('one').addEventListener('click', function () {
        setFromDate(365);
    });
});