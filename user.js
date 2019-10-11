// ==UserScript==
// @name         Add to Vocabulary
// @namespace    https://github.com/takvol
// @version      0.1
// @description  add a word to vocabulary
// @author       takvol
// @include      *
// @grant        GM_xmlhttpRequest
// @connect      example.com
// @connect      rapidapi.com
// @connect      googleapis.com
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @run-at       context-menu
// ==/UserScript==

let X_RAPID_API_KEY = 'X_RAPID_API_KEY';
let GOOGLE_SCRIPT_WEB_APP_ID = 'GOOGLE_SCRIPT_WEB_APP_ID';

function generateUrl(url, params) {
    var newUrl = url;
    var keys = Object.keys(params);

    if(keys.length > 0) {
        newUrl += '?' +
        keys
          .filter(function(key){
            return params[key] ? true : false;
          })
          .map(function(key){
            return key + '=' + encodeURIComponent(params[key]);
          })
          .join('&');
    }

    return newUrl;
}

function WordsApi(text){
    var promises = [];

    text.split(/[\s,\-._]+/)
      .filter(function(word){
        return word !== '';
      })
      .map(function(word){
        return encodeURIComponent(word);
      })
      .forEach(function(word){
        let wordPromise = new Promise(function(resolve, reject) {
            GM_xmlhttpRequest({
                method: 'GET',
                url: "https://wordsapiv1.p.rapidapi.com/words/"+encodeURIComponent(word)+"/pronunciation",
                headers: {
                    "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
                    "x-rapidapi-key": X_RAPID_API_KEY
                },
                onload: function(response) {
                    if (response.status != 200) {
                        reject(response);
                    }
                    let json_data = JSON.parse(response.responseText);
                    resolve(json_data.pronunciation[Object.keys(json_data.pronunciation)[0]]);
                },
                onerror: reject
            });
        });
        promises.push(wordPromise);
      });

    return new Promise(function(resolve, reject) {
        Promise.all(promises)
          .then(function(values) {
            resolve(values.join(' '));
          })
          .catch(reject);
    });
}

function GoogleTranslate(text) {
  var googleTranslateUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=uk&hl=uk&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dj=1&q=';

  return new Promise(function(resolve, reject) {
      GM_xmlhttpRequest({
          method: 'GET',
          url: googleTranslateUrl + encodeURIComponent(text),
          headers: {"Accept": "application/json"},
          onload: function(response) {
              if (response.status != 200) {
                  reject(response);
              }
              let json_data = JSON.parse(response.responseText);

              try {
                  resolve({
                      definition: json_data.definitions ? json_data.definitions.slice(0, 2).map(function(item){return item.entry[0].gloss}).join("\n") : null,
                      transcription: json_data.sentences[1].src_translit || null,
                      translation: json_data.dict ? json_data.dict.slice(0, 5).map(function(item){return item.terms.join(', ')}).join("\n") : json_data.sentences[0].trans
                  });
              } catch(e) {
                reject(e);
              }
          },
          onerror: reject
      });
  });
}

(function() {
    'use strict';

    var vocabularyUrl = `https://script.google.com/macros/s/${GOOGLE_SCRIPT_WEB_APP_ID}/exec`;
    var selection = document.getSelection();
    var text = selection.toString().trim().toLowerCase();

    if(!text) {
        GM_notification({text: 'Error: No text found.', title:'Vocabulary', timeout: 4000, silent: true});
        return;
    }
    var nodeText = selection.getRangeAt(0).startContainer.parentNode.innerText;
    var sentences = nodeText.replace(/([.?!])\s/g, "$1|").split("|");
    var context = sentences.filter(function(sentence) {
        return sentence.includes(selection);
    }).join("\n…\n");

    Promise.all([GoogleTranslate(text), WordsApi(text)])
      .then(function(values) {
        var gt = values[0];
        var wa = values[1];
        var url = generateUrl(vocabularyUrl, {
            token: 'gPdcizs0Z7xnqn3',
            text: text,
            context: context,
            transcription: wa || gt.transcription,
            definition: gt.definition,
            translation: gt.translation,
            source: document.title,
            sourceURL: document.URL
        });
        return url;
      })
      .then(function(url) {
         return new Promise(function(resolve, reject) {
             GM_xmlhttpRequest({
                 method: 'GET',
                 url: url,
                 onload: function(response) {
                     if (response.status != 200) {
                         reject(response);
                     } else {
                         let json_data = JSON.parse(response.responseText);

                         if(!json_data || json_data.status != 201) {
                             reject(json_data);
                         }
                     }
                     resolve('Saved!');
                 },
                 onerror: reject
             });
         });
      })
      .then(function(response) {
          GM_notification({text: response, title:'Vocabulary', timeout: 4000, silent: true});
      })
      .catch(function(reason) {
          GM_notification({text: 'Something went wrong :(', title:'Vocabulary', timeout: 4000, silent: true});
          console.error('Vocabulary error.', reason);
      });
})();