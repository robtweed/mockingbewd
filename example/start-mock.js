/*
  To start MockingbEWD, create a startup JavaScript file such as this one in the
  same directory as the one in which you ran 

    npm install mockingbewd. 

  Then:

     node <startup file name>

     eg:

     cd ~/ewdjs
     node start-mock

*/


var mockingbewd = require('mockingbewd');

function testit(query) {
  return {
    testit: query
  };
}

mockingbewd.start({
  httpPort: 8082, // listener port

  ewdjs: true,    // true = emulate an EWD.js system | false = simple Web Service / REST server

  keys: {
                  // if emulation an EWD.js system, define any accessId: secretKey pairs used by test clients
    rob: 'rob123'
  },
  delay: 5000,   // no of ms to delay the response (eg for server time-out / slow server testing.  Set to 0 for immediate response

  mock: {
                 // define EWD.js mock services in terms of applicationName: {operationName: {responseObject}}
                 // response properties can be static or functions with query (URL name/value pair) object as argument

    demoServices: {
      
      parse: {
        i_am: 'ewd-mock',
        you_requested: 'demoServices/parse',
        test: function(query) {
          return query.timestamp;
        }
      },

                 // the entire response object can be defined in a function if you wish:
      test2: testit,

      errorTest: {
        error: {
          statusCode: 402,
          restCode: 'DemoError',
          message: 'This is a demonstration of a generated error response'
        }
      }

    },

                // for non-EWD.js systems, define the mock service in terms of urlPath: {responseObject}
                // functions can be used just as for EWD.js mock service response definitions (see above)
    '/x/y/z': {
      response: 'This is the /x/y/z service'
    }
  },

                // optionally you can over-ride the built-in default response for un-recognised incoming requests
                // that aren't handled with a mock response:
  defaultResponse: {
    response: 'This is my customised default response'
  }
});


