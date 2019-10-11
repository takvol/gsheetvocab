function doGet(e) {
  var res, model;

  res = {
      status: RESPONSE_STATUS.CREATED
  };
  
  if(e.parameter.token !== SECRET) {
    res.status = RESPONSE_STATUS.UNAUTHORIZED;
  } else {
    model = new VocabularyModel(e.parameter);

    if(!model.translation) {
      model.translation = LanguageApp.translate(model.text, VOCABULARY_LANGUAGE, TRANSLATE_LANGUAGE);
    }

    try {
      if(!model.save()){
        res.status = RESPONSE_STATUS.INVALID_REQUEST;
        res.errors = model.errors;
      }
    } catch(e) {
      res.status = RESPONSE_STATUS.INTERNAL_ERROR;
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}
