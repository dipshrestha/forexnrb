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
var d = new Date();
var month = ("0" + (d.getMonth() + 1)).slice(-2);
var day = ("0" + d.getDate()).slice(-2);
var year = d.getFullYear();
var d1 = new Date();
d1.setDate(d1.getDate() - 15);

var month1 = ("0" + (d1.getMonth() + 1)).slice(-2);
var day1 = ("0" + d1.getDate()).slice(-2);
var year1 = d1.getFullYear();


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

     // alert(this.getExchangeRateUrl);
        var abc = [];       
        var req = new XMLHttpRequest();
        req.open("GET", this.getExchangeRateUrl, true);
        req.onload = this.showGetResponseData.bind(this);
        //req.onreadystatechange = function () {
        //    if (req.readyState == 4 && req.status == 200) {
        //        // alert(req.responseText);
              
        //        var xmlDoc = req.responseXML;
        //        // var json = $.xml2json(xmlDoc);
        //        //alert(json.CurrencyConversion[0]);
        //        //alert(json.CurrencyConversion.CurrencyConversionResponse[0].BaseCurrency.text);//["CurrencyConversionResponse"]);
        //        var x = xmlDoc.getElementsByTagName("CurrencyConversionResponse");
             
        //        var innerval = "";

        //        for (i = 0; i < x.length; i++) {

        //            document.getElementById('curDate').innerHTML = d;
        //            var ConversionTime = x[i].getElementsByTagName("ConversionTime")[0].childNodes[0].nodeValue;

        //            var from = x[i].getElementsByTagName("BaseCurrency")[0].childNodes[0].nodeValue;
        //            var to = x[i].getElementsByTagName("TargetCurrency")[0].childNodes[0].nodeValue;
        //            var rate = x[i].getElementsByTagName("ConversionRate")[0].childNodes[0].nodeValue;
        //            innerval = innerval + "<div>" + from + " &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + rate + "</div>";

        //            jsonArr.push({
        //                label:from,
        //                y:  parseFloat(rate)
        //            });

                   
        //        }

        //       // abc = jsonArr;
             

        //        document.getElementById("exchangeRate").innerHTML = innerval;

        //        return jsonArr;
              
                  
        //}
      
        req.send(null);
      //  alert(JSON.stringify(jsonArr));
     
    },

    showGetResponseData: function (respData) {
        //alert('test');
        var xmlDoc = respData.target.responseXML;
        document.getElementById('curDate').innerHTML = d;
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
            if (ConversionTime == todayDate) {
                innerval = innerval + "<div>" + from + " &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + rate + "</div>";
            }
            jsonArr.push({
                TargetCurrency: from,
                ConversionRate: parseFloat(rate),
                ConversionTime: ConversionTime

            });

            if (from == 'USD')
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
           var chart = new CanvasJS.Chart("chartContainer", {
            theme: "theme2",//theme1
            title: {
                text: "USD/NRS 7 days trend"
            },
            animationEnabled: false,   // change to true
            data: [
            {
                // Change type to "bar", "splineArea", "area", "spline", "pie",etc.
                type: "column",
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
});
