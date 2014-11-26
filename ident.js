'use strict';

var googlePlusUserLoader = (function() {
  var btnSignin;
  var btnSend;

  var START_STATE=1;
  var STATE_ACQUIRING_AUTHTOKEN=2;
  var STATE_AUTHTOKEN_ACQUIRED=3;

  var state = START_STATE;
  var theToken;

  function disableButton(button) { button.setAttribute('disabled', 'disabled'); }
  function enableButton(button) { button.removeAttribute('disabled'); }

  function changeState(newState) {
    state = newState;

    switch(state) {
      case START_STATE:
        console.log('START_STATE');
        enableButton(btnSignin);
        break;
      case STATE_ACQUIRING_AUTHTOKEN:
        console.log('acquiring token..');
        disableButton(btnSignin);
        break;
      case STATE_AUTHTOKEN_ACQUIRED:
        console.log('STATE_AUTHTOKEN_ACQUIRED');
        disableButton(btnSignin);
        break;
    }
  }

  function iSignIn() {
    console.log('iSignIn..');
    changeState(STATE_ACQUIRING_AUTHTOKEN);
    chrome.identity.getAuthToken({'interactive' : true }, function(token) {
      if(chrome.runtime.lastError) {
        console.log('last error.. %s', chrome.runtime.lastError);
        changeState(START_STATE);
      } else {
        console.log('token acquired: %s , see chrome://identity-internals for details', token);
        theToken = token;
        iSent();
        // **** insert send to sever code here... **** //
        changeState(STATE_AUTHTOKEN_ACQUIRED);
      }
    });
  }

  function iSent() {
    console.log('submit clicked..');
    chrome.tabs.getSelected(null,function(tab) {
      // console.log('tabs.getSelected()..');
      if(theToken == undefined) { iSignIn(); }
      // console.log('linked clicked: %s', tab.url);
      var tabLink = tab.url;

      var postdata = "link="+tab.url+"&token=" + theToken;
      var link = 'http://monkey-nodejs-71725.usw1.nitrousbox.com:8080/submitArticle?'+postdata;

      // * ponder this.. have it get a token each time ?...
      // * doens't look like the trap is working... need to include it in the code
      // * below..  have it pull the token each time submition is pressed..
      // * also need to include some sort of response the close..
      // *************************************************************************

      console.log(link + '\n\n');

      var req = new XMLHttpRequest();
      // post isn't working.. should try get..  include components in url..
      req.open("GET", link, true);
      req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
      req.responseType = 'blob';

      req.onreadystatechange = function() {

        if(req.readyState == 4 && req.status == 200) {

          var reader = new FileReader();

          reader.addEventListener("loadend", function() {
             // reader.result contains the contents of blob as a typed array
             console.log(reader.result);
          });

          reader.readAsText(req.response);
        }
      };

      console.log('\n\nsending post data:\n' + postdata);
      req.send(postdata);
    });
  }

  return {
    onload: function() {
      btnSignin = document.querySelector('#login');
      btnSignin.addEventListener('click', iSignIn);

      btnSend = document.querySelector('#submit');
      btnSend.addEventListener('click', iSignIn);
    }
  };
})();

window.onload = googlePlusUserLoader.onload;
