function test() {
  var test_callbacks, status;

  Logger.log('Test started');

  test_callbacks = [
    testSaveToSpreadsheet
  ];
  status = test_callbacks.every(assert) ? 'Test completed successful' : 'Test failed';

  Logger.log(status);
}

function assert(callback){
  return callback();
}

function testSaveToSpreadsheet() {
  var params = {
    text: 'test',
    context: 'this is a test',
    definition: 'just a test',
    translation: 'тест',
    source: 'Build your own',
    sourceURL: 'https://medium.com/@sawyerh/how-i-export-process-and-resurface-my-kindle-highlights-addc9de9af1a'
  };
  var model = new VocabularyModel(params);
  
  if(!model.save()) {
    Logger.log(model.errors);
    return false;
  }
  
  return true;
}