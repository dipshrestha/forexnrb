/*
File:           popup.js
Version:        1.0
Last changed:   2015/03/08
Purpose:        Javascript functions to populate data into popup
Author:         Sharad Subedi
Copyright:      
Product:        foreign currency exchange NRB
*/

var mytest = "abc";

var exURl = "http://rate-exchange.appspot.com/currency?from=USD&to=EUR";
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
var curBaseCurrency = 'USD';// document.getElementById("baseCur").value;
var chartType = "line";
var minRate = 0;
var maxRate = 0;

var chartD = [];
var trendDays = "7 days";
var exchangeDataLoader = {
    /**
     * Flickr URL that will give us lots and lots of whatever we're looking for.
     *
     * See http://www.flickr.com/services/api/flickr.photos.search.html for
     * details about the construction of this URL.
     *
     * @type {string}
     * @private
     */
    //getExchangeRateUrl: 'http://rate-exchange.appspot.com/currency?from=USD&to=NPR',
    //getExchangeRateUrl: 'http://www.nrb.org.np/exportForexXML.php?YY=' + year1 + '&MM=' + month1 + '&DD=' + day1 + '&YY1=' + year + '&MM1=' + month + '&DD1=' + day + '',
    /**
     * Sends an XHR GET request to grab photos of lots and lots of kittens. The
     * XHR's 'onload' event is hooks up to the 'showPhotos_' method.
     *
     * @public
     */
    LoadExchangeRate: function () {     
        var abc = [];
		var getExchangeRateUrl = 'http://www.nrb.org.np/exportForexXML.php?YY=' + year1 + '&MM=' + month1 + '&DD=' + day1 + '&YY1=' + year + '&MM1=' + month + '&DD1=' + day + '';
        var req = new XMLHttpRequest();
        req.open("GET", getExchangeRateUrl, true);
        req.onload = this.showGetResponseData.bind(this);
              
        req.send(null);     
    },

    showGetResponseData: function (respData) {
        //alert('test');
        var xmlDoc = respData.target.responseXML;		
		//get country specific exchabge rate for given period
		
		
		var todayDate=day+'-'+month+'-'+year;
		document.getElementById('curDate').innerHTML = d.toLocaleDateString("en-US",  {weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
		
		var intPath = "/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'"+ curBaseCurrency +"\' and ConversionTime=\'"+todayDate+"\']/ConversionRate";
		var intervalNode = xmlDoc.evaluate(intPath, xmlDoc, null, XPathResult.ANY_TYPE, null);
		var todayRate = intervalNode.iterateNext().childNodes[0].nodeValue;
		var innerval = "";
        innerval = innerval + "<div> Today's exchange rate 1&nbsp;&nbsp;" + curBaseCurrency + " = " + todayRate + "&nbsp;&nbsp;"+"NRS"+"</div>";        
		
		var ratepath="/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'"+ curBaseCurrency +"\']";
		var nodes=xmlDoc.evaluate(ratepath, xmlDoc, null, XPathResult.ANY_TYPE, null);
		var result=nodes.iterateNext();		
		chartD = [];		
		while (result)
		{
			/*res = res + result.getElementsByTagName("BaseCurrency")[0].childNodes[0].nodeValue + " ";
			result=nodes.iterateNext();
			count++;*/
			var ConversionTime = result.getElementsByTagName("ConversionTime")[0].childNodes[0].nodeValue;

            //var from = result.getElementsByTagName("BaseCurrency")[0].childNodes[0].nodeValue;
            //var to = result.getElementsByTagName("TargetCurrency")[0].childNodes[0].nodeValue;
            var rate = result.getElementsByTagName("ConversionRate")[0].childNodes[0].nodeValue;
            
			chartD.push({
				label: new String(ConversionTime),
				y: parseFloat(rate)
			})
            			
			result=nodes.iterateNext();
		}
        this.generateChart(chartD);

        result = "";
        document.getElementById("exchangeRate").innerHTML = innerval;
    },

    generateChart: function (chartData) {

        minRate = Math.round(Math.min.apply(Math, chartData.map(function (o) { return o.y; })) - 3);
        maxRate = Math.round(Math.max.apply(Math, chartData.map(function (o) { return o.y; })) + 2);

       // alert('Min' + minRate + 'Max ' + maxRate);
           var chart = new CanvasJS.Chart("chartContainer", {
            theme: "theme2",//theme1
            title: {
                text: curBaseCurrency+"/NRS " + trendDays +" trend"
            },
            animationEnabled: false,   // change to true
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
                // Change type to "bar", "splineArea", "area", "spline", "pie",etc.
                type: chartType,
                lineThickness: 2,
                dataPoints: chartData               
            }
            ]
        });
        chart.render();
    }  
};


function changeBaseCur() {
    var x = document.getElementById("baseCur").value;
    curBaseCurrency = x;
    exchangeDataLoader.LoadExchangeRate();
};

function ChooseChartType(hitId) {
    chartType = hitId;
    exchangeDataLoader.generateChart(chartD);
};

function setFromDate(days){
	d1 = new Date( sysDate.getTime() + (sysDate.getTimezoneOffset() * 60000) + (345* 60000));
	d1.setDate(d1.getDate() - days);

	month1 = ("0" + (d1.getMonth() + 1)).slice(-2);
	day1 = ("0" + d1.getDate()).slice(-2);
	year1 = d1.getFullYear();
	mytest = "asd";
	if(days==91)
		trendDays = "3 months";
	else if(days==182)
		trendDays = "6 months";
	else if(days==365)
		trendDays = "1 year";
	else
		trendDays = days+" days";
	exchangeDataLoader.LoadExchangeRate();
};

// Run exchangeDataLoader  script as DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
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

