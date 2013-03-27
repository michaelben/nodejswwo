//Simple demo for World Weather Online using nodejs/express/underscore

var express = require("express");
var _ = require("underscore");
var http = require("http");
var querystring = require("querystring");
var app = express();

//Views

//form validation on client side.
//You should load this script from html header section and put it under
//public/javascript folder for client/server side code separation
var validate = function validateForm() {
    var x=document.forms["myForm"]["q"].value;
    if (x==null || x=="")
        var error = "Empty query, Please enter a query.";
    else if(/\d/.test(x)) {
        var regUKPostcode = /^([a-zA-Z]){1}([0-9][0-9]|[0-9]|[a-zA-Z][0-9][a-zA-Z]|[a-zA-Z][0-9][0-9]|[a-zA-Z][0-9]){1}([ ])([0-9][a-zA-z][a-zA-z]){1}$/;
        var regUSCANZipcode = /(^\d{5}(-\d{4})?$)|(^[ABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Z]{1} *\d{1}[A-Z]{1}\d{1}$)/;
        var regLatLong = /^(-?(90|(\d|[1-8]\d)(\.\d{1,6}){0,1}))\,{1}(-?(180|(\d|\d\d|1[0-7]\d)(\.\d{1,6}){0,1}))$/;
        var validIP = function(ip) {
            var values = ip.split('.');
            if(values.length != 4) return false;

            for(var v in values)
                if(values[v] < 0 || values[v] > 255) return false;

            return true;
        };

        if(validIP(x)) {
            return true;
        } else if(regUSCANZipcode.test(x)) {
            return true;
        } else if(regUKPostcode.test(x)) {
            return true;
        } else if(regLatLong.test(x)) {
            return true;
        } else
            error = "Please enter an valid US/UK/Canada Postal Code or IP or (Lat,Long) query.";
      } else return true

    var newspan = document.createElement('span');
    newspan.setAttribute('id', 'status');
    var newspan_content = document.createTextNode(error);
    newspan.appendChild(newspan_content);
    var oldspan = document.getElementById('status');
    var parentDiv = oldspan.parentNode;

    parentDiv.replaceChild(newspan, oldspan);
    return false;
};

//common block for result view and error view
var htmlheader = 
  '<h1>World Weather Online Demo</h1>\
   <form name="myForm" onsubmit="return validateForm()">\
   City or town name; IP address; US or Canada Postal Code or US Zipcode; (Latitude,longitude): <input type="text" name="q">\
   <input type="submit" value="Submit">\
   </form>\
   <div style="color:#B20528"><span id="status"><%= error %></span></div>';

//error view
function errorView(error) {
  var template = '<script>' + validate.toString() + '</script>' + htmlheader;

    var vars = 
    {
        error: error
    };

        return _.template(template, vars);
}

//result view
function resultView(jsonres, error) {
  var template = '<script>' + validate.toString() + '</script>' + htmlheader +
    '<img src="<%= icon %>" alt="Weather Condition" />\
     <div><b><%= location %></b> </div>\
     <div style="color:#07CFFC"><b><%= date %></b> </div>\
     <div style="color:#1707FC"> <b><%= weatherDesc %></b> </div>\
     <div style="color:#FC071B"><b><%= temp %>\u2103</b></div>\
     <div>\
     <li>Location: <b><%= location %></b></li>\
     <li>Date: <b><%= date %></b></li>\
     <li>Weather Condition: <b><%= weatherDesc %></b></li>\
     <li>Temperature: <b><%= temp %>\u2103</b></li>\
     <li>Max Temperature: <b><%= tempMaxC %>\u2103</b></li>\
     <li>Min Temperature: <b><%= tempMinC %>\u2103</b></li>\
     <li>Cloud Cover: <b><%= cloudcover %></b></li>\
     <li>Humidity: <b><%= humidity %></b></li>\
     <li>Observation Time: <b><%= observation_time %></b></li>\
     <li>Precipitation: <b><%= precipMM %>MM</b></li>\
     <li>Pressure: <b><%= pressure %></b></li>\
     <li>Visibility: <b><%= visibility %></b></li>\
     <li>Wind Direction 16Point: <b><%= winddir16Point %></b></li>\
     <li>Wind Direction Degree: <b><%= winddirDegree %></b></li>\
     <li>Wind Speed: <b><%= windspeed %>Kmph</b></li>\
     </div>';

    var vars = 
    {
        location: jsonres.data.request[0].query,
        date: jsonres.data.weather[0].date,
        temp: jsonres.data.current_condition[0].temp_C,
        weatherDesc: jsonres.data.current_condition[0].weatherDesc[0].value,
        tempMaxC: jsonres.data.weather[0].tempMaxC,
        tempMinC: jsonres.data.weather[0].tempMinC,
        cloudcover: jsonres.data.current_condition[0].cloudcover,
        humidity: jsonres.data.current_condition[0].humidity,
        observation_time: jsonres.data.current_condition[0].observation_time,
        precipMM: jsonres.data.current_condition[0].precipMM,
        pressure: jsonres.data.current_condition[0].pressure,
        visibility: jsonres.data.current_condition[0].visibility,
        winddir16Point: jsonres.data.weather[0].winddir16Point,
        winddirDegree: jsonres.data.weather[0].winddirDegree,
        windspeed: jsonres.data.weather[0].windspeedKmph,
        icon: jsonres.data.current_condition[0].weatherIconUrl[0].value,
        error: error
    };

        return _.template(template, vars);
}

//get data
function getLocalWeather(q, onResult) {
  var baseurl = "http://api.worldweatheronline.com/free/v1/weather.ashx";

  var options = {
    q: q,
    num_of_days: '1',
    format: 'json',
    //you need to replace with your own key by registering on WWO website
    key: 'xkq544hkar4m69qujdgujn7w'
  };

  var query = querystring.stringify(options);
  var url = baseurl + "?" + query;

  //inject error message into template
  function injectError(error) {
    if(getLocalWeather.previousResult == null)
        return errorView(error);
    else
        return resultView(getLocalWeather.previousResult, error);
  }

  //REST API
  http.get(url, function(res) {
    if(res.statusCode == 200) {
      console.log("Got response: " + res.statusCode);
      res.setEncoding('utf8');

      var output = '';
      res.on('data', function (chunk) {
          output += chunk;
      });

      res.on('end', function () {
          var jsonres = JSON.parse(output)
          if(jsonres.data.hasOwnProperty('error'))
              onResult(res.statusCode, injectError(jsonres.data.error[0].msg)); 
          else {
              getLocalWeather.previousResult = jsonres;
              onResult(res.statusCode, resultView(jsonres, null));
            }
      });
    } else
      onResult(res.statusCode, injectError("Something wrong with the server. Status Code: " + res.statusCode));
  }).on('error', function(e) {
      onResult(res.statusCode, injectError(e.message));
  });
}

//for caching previous result
getLocalWeather.previousResult = null;

//routes
app.get("/", function(req, res){
    var onResult = function (statusCode, result) {
        res.send(result);
    };

    var q = req.param('q');
    if(q == null || q == undefined || q == "") 
        if (req.ip == "127.0.0.1" || req.ip.indexOf("192.168.") == 0)
            res.send(errorView(null));
        else
            getLocalWeather(req.ip, onResult);
    else
        getLocalWeather(q, onResult);
});

//start server
app.listen(8000);
console.log("listening on port 8000");
