// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Global variable containing the query we'd like to pass to Flickr. In this
 * case, kittens!
 *
 * @type {string}
 */
var QUERY = 'kittens';
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

//alert(d1);

var kittenGenerator = {
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
              
        //        var chart = new CanvasJS.Chart("chartContainer", {
        //            theme: "theme2",
        //            title: {
        //                text: "Basic Column Chart - CanvasJS"
        //            },
        //            animationEnabled: true, 
        //            data: [
        //            {
        //                // Change type to "bar", "splineArea", "area", "spline", "pie",etc.
        //                type: "column",
        //                dataPoints: jsonArr
        //            }
        //            ]
        //        });
        //        chart.render();
               
        //    }
            
        //}
      
        req.send(null);
      //  alert(JSON.stringify(jsonArr));
     
    },

    showGetResponseData: function (respData) {
        //alert('test');
        var xmlDoc = respData.target.responseXML;
       // alert(xmlDoc);
       var x = xmlDoc.getElementsByTagName("CurrencyConversionResponse");
       var innerval = "";
       var jsonArr = [];
       var chartD = [];
       var todayDate=day+'-'+month+'-'+year;
        for (i = 0; i < x.length; i++) {
           // document.getElementById('curDate').innerHTML = d;
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
       // var jsonData = eval(jsonArr);
       // alert(jsonData);
      //  alert(jsonData[0].label);
       // alert(jsonData[0].y);
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
                text: "Basic Column Chart - CanvasJS"
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

    /**
     * Handle the 'onload' event of our kitten XHR request, generated in
     * 'requestKittens', by generating 'img' elements, and stuffing them into
     * the document for display.
     *
     * @param {ProgressEvent} e The XHR ProgressEvent.
     * @private
     */
    /*
  showPhotos_: function (e) {
    var kittens = e.target.responseXML.querySelectorAll('photo');
    for (var i = 0; i < kittens.length; i++) {
      var img = document.createElement('img');
      img.src = this.constructKittenURL_(kittens[i]);
      img.setAttribute('alt', kittens[i].getAttribute('title'));
      document.body.appendChild(img);
    }
  },
  */

    /**
     * Given a photo, construct a URL using the method outlined at
     * http://www.flickr.com/services/api/misc.urlKittenl
     *
     * @param {DOMElement} A kitten.
     * @return {string} The kitten's URL.
     * @private
     */
    /*
  constructKittenURL_: function (photo) {
    return "http://farm" + photo.getAttribute("farm") +
        ".static.flickr.com/" + photo.getAttribute("server") +
        "/" + photo.getAttribute("id") +
        "_" + photo.getAttribute("secret") +
        "_s.jpg";
  }*/
};

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
     kittenGenerator.LoadExchangeRate();
    //alert(result);
});
