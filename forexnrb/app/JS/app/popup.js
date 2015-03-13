/*
File:           popup.js
Version:        1.0
Last changed:   2015/03/08
Purpose:        Javascript functions to populate data into popup
Author:         Sharad Subedi
Copyright:      
Product:        foreign currency exchange NRB
*/

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
var chartType = "column";
var minRate = 0;
var maxRate = 0;

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
    getExchangeRateUrl: 'http://www.nrb.org.np/exportForexXML.php?YY=' + year1 + '&MM=' + month1 + '&DD=' + day1 + '&YY1=' + year + '&MM1=' + month + '&DD1=' + day + '',
    /**
     * Sends an XHR GET request to grab photos of lots and lots of kittens. The
     * XHR's 'onload' event is hooks up to the 'showPhotos_' method.
     *
     * @public
     */
    LoadExchangeRate: function () {     
        var abc = [];       
        var req = new XMLHttpRequest();
        req.open("GET", this.getExchangeRateUrl, true);
        req.onload = this.showGetResponseData.bind(this);
              
        req.send(null);     
    },

    showGetResponseData: function (respData) {
        //alert('test');
        var xmlDoc = respData.target.responseXML;
		
		//get country specific exchabge rate for given period
		var path="/CurrencyConversion/CurrencyConversionResponse[BaseCurrency=\'"+ curBaseCurrency +"\']/ConversionRate";
		var nodes=xmlDoc.evaluate(path, xmlDoc, null, XPathResult.ANY_TYPE, null);
			var result=nodes.iterateNext();
			var res = "";
			while (result)
			{
				res = res + result.childNodes[0].nodeValue + "<br>";
				result=nodes.iterateNext();
			}
			document.getElementById('testdata').innerHTML = res;
		//upto here
		
        document.getElementById('curDate').innerHTML = d.toLocaleDateString("en-US",  {weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
       var x = xmlDoc.getElementsByTagName("CurrencyConversionResponse");
       var innerval = "";
       var jsonArr = [];
       var chartD = [];
       var todayDate=day+'-'+month+'-'+year;
        for (i = 0; i < x.length; i++) {          
            var ConversionTime = x[i].getElementsByTagName("ConversionTime")[0].childNodes[0].nodeValue;

            var from = x[i].getElementsByTagName("BaseCurrency")[0].childNodes[0].nodeValue;
            var to = x[i].getElementsByTagName("TargetCurrency")[0].childNodes[0].nodeValue;
            var rate = x[i].getElementsByTagName("ConversionRate")[0].childNodes[0].nodeValue;
           // alert(curBaseCurrency);
            if (ConversionTime == todayDate && from == curBaseCurrency) {
                innerval = innerval + "<div> Today's exchange rate 1&nbsp;&nbsp;" + from + " = " + rate + "&nbsp;&nbsp;"+to+"</div>";
            }
            //jsonArr.push({
            //    TargetCurrency: from,
            //    ConversionRate: parseFloat(rate),
            //    ConversionTime: ConversionTime

            //});

            if (from == curBaseCurrency)
            {
                chartD.push({
                    label: new String(ConversionTime),
                    y: parseFloat(rate)
                })
            }
        }

      
        this.generateChart(chartD);

        

        result = "";
       // result += jsonPath(jsonData, $.CurrencyConversion.CurrencyConversionResponse[*].ConversionTime).toJSONString());
       // alert(result);
        document.getElementById("exchangeRate").innerHTML = innerval;
    },

    generateChart: function (chartData) {

        minRate = Math.round(Math.min.apply(Math, chartData.map(function (o) { return o.y; })) - 3);
        maxRate = Math.round(Math.max.apply(Math, chartData.map(function (o) { return o.y; })) + 2);

       // alert('Min' + minRate + 'Max ' + maxRate);
           var chart = new CanvasJS.Chart("chartContainer", {
            theme: "theme2",//theme1
            title: {
                text: curBaseCurrency+"/NRS 7 days trend"
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
                lineThickness: 1,
                dataPoints: chartData               
            }
            ]
        });
        chart.render();
    }  
};

// Run exchangeDataLoader  script as DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
    exchangeDataLoader.LoadExchangeRate();
    document.querySelector('#baseCur').addEventListener('change', changeBaseCur);
    document.querySelector('#hrLine').addEventListener('click', ChooseChartType());
    document.querySelector('#hrColumn').addEventListener('click', ChooseChartType());
});



function changeBaseCur() {
    var x = document.getElementById("baseCur").value;
    curBaseCurrency = x;
    exchangeDataLoader.LoadExchangeRate();
}

function ChooseChartType(button) {
    chartType = 'line';
    //alert(chartType);
   // exchangeDataLoader.generateChart();
};