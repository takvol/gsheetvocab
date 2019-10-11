function VocabularyModel(options) {
  this.attributes = ['text', 'transcription', 'context', 'definition', 'translation', 'source'];
  this.errors = [];
  
  this.attributes.forEach(function(attribute) {
    this[attribute] = options[attribute];
  }, this);
  
  this.sourceURL = options.sourceURL;
}

VocabularyModel.prototype.load = function(options) {
  this.attributes.forEach(function(attribute) {
    if(options[attribute] !== undefined) {
      this[attribute] = options[attribute];
    }
  }, this);
}

VocabularyModel.prototype.validate = function() {
  this.errors = [];
  
  if(!this.text) {
    this.errors.push('Text is missing');
  }
  
  return this.errors.length ? false : true;
}

VocabularyModel.prototype.save = function(validate) {
  validate = validate === false ? false : true;
  
  if(validate && !this.validate()){
    return false;
  }
  
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];
  var bold = SpreadsheetApp.newTextStyle().setBold(true).build();
  var data = [];
  var source = this.source;
  var context = this.context;
  var contextOffset = context.indexOf(this.text);
  var textLength = this.text.length;
  var rtv = SpreadsheetApp.newRichTextValue().setText(context);
  var lastRow = sheet.getLastRow();
  
  if(this.sourceURL) {
    this.source = '=HYPERLINK("' + this.sourceURL + '","' +  source.replace(/"/g,'""') + '")';
  }

  while (contextOffset !== -1) {
    rtv.setTextStyle(contextOffset, contextOffset + textLength, bold);
    contextOffset = context.toLowerCase().indexOf(this.text, contextOffset + textLength);
  }
  
  this.context = null;

  this.attributes.forEach(function(attribute) {
    data.push(this[attribute] || '');
  }, this);
  
  this.source = source;
  this.context = context;

  sheet.getRange(lastRow + 1, 1, 1, this.attributes.length).setValues([data]);
  sheet.getRange(lastRow + 1, this.attributes.indexOf('context') + 1).setRichTextValue(rtv.build());

  return true;
}