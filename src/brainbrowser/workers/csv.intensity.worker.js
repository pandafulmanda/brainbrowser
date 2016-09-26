
(function() {
  "use strict";
  
  self.addEventListener("message", function(e) {
    var input = e.data;

    var result = parse(input.data, input.options);
    self.postMessage(result, [result.values.buffer]);
  });
  
  function parse(string, options) {
    var columnHeader = options.columnHeader;
    var result = {};
    var i, count, min, max;
  
    var stack = string.trim().split(/\n+/);
    result.values = new Float32Array(stack.length - 1);

    var colIndex = getColumnIndex(columnHeader, stack[0]) || 0;

    result.values[0] = parseFloat(stack[1].trim().split(/,/)[colIndex]);
    min = result.values[0];
    max = result.values[0];

    for(i = 2, count = result.values.length; i <= count; i++) {
      result.values[i - 1] = parseFloat(stack[i].trim().split(/,/)[colIndex]);
      min = Math.min(min, result.values[i - 1]);
      max = Math.max(max, result.values[i - 1]);
    }

    result.min = min;
    result.max = max;

    return result;
  }
 
  function getColumnIndex(headerName, header) {
    return header.split(/,/).indexOf(headerName);
  }

})();
