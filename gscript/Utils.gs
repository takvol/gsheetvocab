var Utils = {
  objectToArray: function(obj) {
    return Object
      .keys(obj)
      .map(function(key){
        return obj[key];
      });
  },
  
  overwrite: function(origin, target) {
    for(var field in origin) {
      if(target[field]) {
        origin[field] = target[field];
      }
    }
  }
}
