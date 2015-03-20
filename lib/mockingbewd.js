/*

 ----------------------------------------------------------------------------
 | mockingbewd: EWD.js Mock Testing Platform                                |
 |                                                                          |
 | Copyright (c) 2013-15 M/Gateway Developments Ltd,                        |
 | Reigate, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

*/

var http = require('http');
var url = require('url');
var queryString = require('querystring');
var crypto = require('crypto');
var traverse = require('traverse');

var signature = '/json';
var ewd = {};;

function loadDefaults(params) {
  ewd.buildNo = 1;
  ewd.buildDate = '20 March 2015';
  ewd.started = new Date().toUTCString();
  ewd.delay = 0;
  ewd.defaultResponse = {
    i_am: 'mock-ewd',
    response: 'This is my default response.  I did not recognise your request'
  };
  
  for (var name in params) {
    ewd[name] = params[name];
  }
}

function escape(string, encode) {
  if (encode === "escape") {
    var unreserved = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';
    var escString = '';
    var c;
    var hex;
    for (var i=0; i< string.length; i++) {
      c = string.charAt(i);
      if (unreserved.indexOf(c) !== -1) {
        escString = escString + c;
      }
      else {
        hex = string.charCodeAt(i).toString(16).toUpperCase();
        //console.log(string + "; c=" + c + "; hex = " + hex);
        if (hex.length === 1) hex = '0' + hex;
        escString = escString + '%' + hex;
      }
    }
    return escString;
  }
  else {
    var enc = encodeURIComponent(string);
    return enc.replace(/\*/g, "%2A").replace(/\'/g, "%27").replace(/\!/g, "%21").replace(/\(/g, "%28").replace(/\)/g, "%29");
  }
}

function createStringToSign(requestObj, includePort) {
  var stringToSign;
  var name;
  var amp = '';
  var value;
  var keys = [];
  var index = 0;
  var pieces;
  var host = requestObj.host;
  if (!includePort) { 
    if (host.indexOf(":") !== -1) {
      pieces = host.split(":");
      host = pieces[0];
    }
  }
  var url = requestObj.uri;
  var method = 'GET';
  stringToSign = method + '\n' + host + '\n' + url + '\n';
  for (name in requestObj.query) {
    if (name !== 'signature') {
      keys[index] = name;
      index++;
    }
  }
  keys.sort();
  for (var i=0; i < keys.length; i++) {
    name = keys[i];
    value = requestObj.query[name];
    //console.log("name = " + name + "; value = " + value);
    stringToSign = stringToSign + amp + escape(name, 'uri') + '=' + escape(value, 'uri');
    amp = '&';
  }
  return stringToSign;
}

function digest(string, key, type) {
  // type = sha1|sha256|sha512
  var hmac = crypto.createHmac(type, key.toString());
  hmac.update(string);
  return hmac.digest('base64');
}

function signatureMatches(messageObj, secretKey) {
  //console.log('messageObj: ' + JSON.stringify(messageObj));
  var type = 'sha256';
  var stringToSign = createStringToSign(messageObj, false);
  //console.log("stringToSign: " + stringToSign, 3);
  var hash = digest(stringToSign, secretKey, type);
  var signature = messageObj.query.signature.split(' ').join('+');
  if (hash !== signature) {
    console.log('*** signature in incoming request (' + signature + ') did not match calculated value (' + hash + ') ***');
  }
  else {
    console.log('*** EWD.js digital signature OK');
  }
  return (hash === signature);
}

function display404(response) {
  response.writeHead(404, {"Content-Type" : "text/plain" });  
  response.write("404 Not Found \n");  
  response.end();  
}

function errorResponse(errorObj, response) {
  console.log('in errorResponse with errorObj = ' + JSON.stringify(errorObj));
  var header = {
    'Date': new Date().toUTCString(),
    'Content-Type': 'application/json'
  };
  var statusCode = 400;
  if (errorObj.statusCode) {
    statusCode = errorObj.statusCode;
    delete errorObj.statusCode;
  }
  if (errorObj.error && errorObj.error.statusCode) {
    statusCode = errorObj.error.statusCode;
    delete errorObj.error.statusCode;
  }
  response.writeHead(statusCode, header); 
  response.write(JSON.stringify(errorObj));  
  response.end(); 
}

function wsResponse(json, response) {
  console.log('in wsResponse with json = ' + JSON.stringify(json));
  if (json.error) {
    errorResponse(json.error, response);
    /*
    if (ewd.ewdjs) {
      errorResponse(json, response);
    }
    else {
      errorResponse(json.error, response);
    }
    */
  }
  else {
    setTimeout(function() {
      console.log('Response sent: ' + JSON.stringify(json, null, 2));
      response.writeHead(200, {'Content-Type': 'application/json'});
      response.write(JSON.stringify(json, null, 2));
      response.end();
    },ewd.delay);
  }
}

function mapToJSON(obj, rawData) {
  var clone = traverse(obj).clone();
  var json = traverse(clone).forEach(function(value) {
    if (typeof value === 'function') this.update(value(rawData));  
  });
  return json;
};

function handleWebServiceRequest(uri, urlObj, request, postedData, response) {
  console.log("incoming JSON Web Service request: " + uri);
  //console.log("*** postedData = " + postedData + '***');
  var pieces = uri.split('/');
  var appName = pieces[2];
  if (!appName) {
    errorResponse({error: 'Application Name not specified'}, response);
    return;
  }
  var serviceName = pieces[3];
  if (!serviceName) {
    errorResponse({error: 'Service Name not specified'}, response);
    return;
  }
  var query = urlObj.query;
  console.log("Web Service request: query = " + JSON.stringify(query, null, 2));
  console.log("Request mapped to app: " + appName + "; service: " + serviceName);

  var requestObj = {
    appName: appName,
    serviceName: serviceName,
    query: query,
    uri: uri,
    host: request.headers.host,
    post_data: postedData
  };

  if (ewd.ewdjs) {
    if (!query.accessId || !query.signature || !query.timestamp) {
      console.log("** One or more of the following name/value pairs is missing: accessId, signature, timestamp **"); 
      errorResponse({error: 'Missing Access Credentials'}, response);
      return;
    }
    if (!(new Date(query.timestamp).getFullYear() > 0)) {
      console.log('timestamp is invalid: ' + query.timestamp + ' ***');
      errorResponse({error: 'Invalid timestamp'}, response);
      return;
    }
    var secretKey = ewd.keys[query.accessId];
    if (!secretKey) {
      console.log('AccessId ' + query.accessId + ' not included in startup configuration lookup ***'); 
      errorResponse({error: 'Unknown AccessId: ' + query.accessId}, response);
      return;
    }
    if (!signatureMatches(requestObj, secretKey)) {
      errorResponse({error: 'Invalid signature'}, response);
      return;
    }
  }
  var json;
  
  if (typeof ewd.mock === 'undefined') {
    console.log('No mock responses defined');
    json = {test_ok: true}
    wsResponse(json, response);
    return;
  }
  if (!ewd.mock[appName]) {
    console.log('No mock response defined for application ' + appName);
    json = ewd.defaultResponse;
    wsResponse(json, response);
    return;
  }
  if (!ewd.mock[appName][serviceName]) {
    console.log('No mock response defined for application ' + appName + ' - service ' + serviceName);
    json = ewd.defaultResponse;
    wsResponse(json, response);
    return;
  }
  if (typeof ewd.mock[appName][serviceName] === 'function') {
    json = ewd.mock[appName][serviceName](query);
    wsResponse(json, response);
  }
  else {
    json = mapToJSON(ewd.mock[appName][serviceName], query);
    wsResponse(json, response);
  }
}

function webserverCallback(request, response) {

  function clearDown() {
    request = null;
    response = null;
    content = null;
  }

  var content = '';
  request.on("data", function(chunk) {
    content += chunk;
  });
	
  //console.log('**** url = ' + request.url);  
  request.once("end", function(){
    var urlObj = url.parse(request.url, true); 
    var postedData;
    //console.log('method: ' + request.method);
    if (request.headers['content-type'] === 'application/json' && request.method === 'POST') {
      try {
        postedData = JSON.parse(content);
      }
      catch(err) {
        display404(response);
        return;
      }
      for (var name in urlObj.query) {
        if (!postedData[name]) postedData[name] = urlObj.query[name];
      } 
    }
    else {
      postedData = queryString.parse(content);
      for (var name in urlObj.query) {
        if (!postedData[name]) postedData[name] = urlObj.query[name];
      } 
    }
    var uri = urlObj.pathname;
    if (uri === '/favicon.ico') {
      display404(response);
      uri = null;
      urlObj = null;
      return;
    }

    console.log('******');
    console.log('Incoming request: ' + uri);
    console.log('postedData: ' + JSON.stringify(postedData));

    var json;
    if (ewd.ewdjs) {
      if (uri.substr(0, signature.length) === signature) {
        /*		    
          incoming request to invoke a JSON-based Web Service
          eg example URL /json/myApp/serviceName?param1=xxx&param2=yyy&userId=rob123&signature=1234567
        */
          
        handleWebServiceRequest(uri, urlObj, request, postedData, response);
        return;
      }
      else {
        // otherwise return a 404
        console.log('MockingbEWD configured as EWD.js server - request not recognised as an EWD Web Service Request');
        console.log('404 response returned');
        display404(response);
      }
    }
    else {
      if (ewd.mock && ewd.mock[uri]) {
        json = ewd.mock[uri];
        wsResponse(json, response);
      }
      else {
        if (ewd.defaultResponse) {
        json = ewd.defaultResponse;
        wsResponse(json, response);
        }
        else {
          // otherwise return a 404
          display404(response);
        }
      }
    }
  });
}



module.exports = {
  start: function(params, callback) {

    loadDefaults(params);
	
    console.log('   ');
    console.log('**********************************************************************');
    console.log('**** MockingbEWD: EWD.js Mock Platform: Build ' + ewd.buildNo + ' (' + ewd.buildDate + ') ******');
    console.log('**********************************************************************');
    console.log('  ');
    console.log('Started: ' + ewd.started);
    console.log('Master process: ' + process.pid);
    if (ewd.delay > 0) console.log('Responses will be delayed by ' + ewd.delay + 'ms');

    var ws = http.createServer(webserverCallback);
    ws.listen(ewd.httpPort);

    if (callback) callback(ewd);

  }
};



