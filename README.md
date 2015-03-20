# MockingbEWD: Mock Web Service & REST Server, including EWD.js emulation
 
Rob Tweed <rtweed@mgateway.com>  
20 March 2015, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)


## Installing

       npm install mockingbewd

## What is MockingbEWD?

MockingbEWD is a simple, lightweight Node.js-based mock platform for emulating Web Service servers and REST Servers.  
A key use of MockingbEWD is to emulate a Web Service-enabled EWD.js server, but this is optional - it can
emulate any Web Service or REST server.

MockingbEWD can be configured to return hard-coded or programmatically-defined responses for specified incoming requests,
making it a useful tool for unit testing of Web Service or REST clients.

MockingbEWD can also be configured to return mock error messages, and its response-time can be configured to allow
you to run client timeout tests.

Currently MockingbEWD only supports HTTP requests.  SSL support will be made available in a later release.

Emulation of the web socket interface provided by EWD.js is planned for a future releases of MockingbEWD.

	   
## Using MockingbEWD

MockingvEWD is started by using a startup JavaScript file that defines its configuration and mock responses.
Configuration is via a JSON object passed to MockingbEWD's start() function.

See the commented example startup file in the /example directory which demonstrates/documents all the available options.


## License

 Copyright (c) 2015 M/Gateway Developments Ltd,                           
 Reigate, Surrey UK.                                                      
 All rights reserved.                                                     
                                                                           
  http://www.mgateway.com                                                  
  Email: rtweed@mgateway.com                                               
                                                                           
                                                                           
  Licensed under the Apache License, Version 2.0 (the "License");          
  you may not use this file except in compliance with the License.         
  You may obtain a copy of the License at                                  
                                                                           
      http://www.apache.org/licenses/LICENSE-2.0                           
                                                                           
  Unless required by applicable law or agreed to in writing, software      
  distributed under the License is distributed on an "AS IS" BASIS,        
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
  See the License for the specific language governing permissions and      
   limitations under the License.      
