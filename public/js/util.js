'use strict';
var util = {};
util.partition = function(items, size) {
    //via: http://stackoverflow.com/a/11345570
    var result = _.groupBy(items, function(item, i) {
        return Math.floor(i/size);
    });
    return _.values(result);
}

util.attrs = function(elems, attr) {
  return _.map(elems, function(e) { 
    return $(e).attr(attr);
  });
};

util.get = function(coll, attr, val) {
  return _.filter(coll, function(elem) {
    return elem[attr] === val;
  })[0];
};
