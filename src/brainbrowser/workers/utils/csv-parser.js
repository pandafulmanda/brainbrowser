(function(){
  function parse(string, options) {
    var result = {};
    var buffers = [];
    var i, count, min, max;
  
    var stack = string.trim().split(/\n+/);
    var header = separateToColumns(stack[0]);

    var target_intensities = [];

    if(options.columns){
      header.forEach(function(headerName, columnIndex){
        if(options.columns.indexOf(headerName) > -1){
          target_intensities.push({
            name: headerName,
            index: columnIndex
          });
        }
      });
    } else {
      header.forEach(function(headerName, columnIndex){
        target_intensities.push({
          name: headerName,
          index: columnIndex
        });
      });
    }

    var numberOfIntensities = target_intensities.length;
    var numberOfValues = stack.length - 1;

    var firstRowValues = separateToColumns(stack[1]);
    var lastRowValues = separateToColumns(stack[numberOfValues]);

    for(var intensityIndex = 0; intensityIndex < numberOfIntensities; intensityIndex++) {
      var column = target_intensities[intensityIndex];

      result[column.name] = {
        values: new Float32Array(numberOfValues)
      };

      setInitialValue(result[column.name], firstRowValues[column.index]);
    }

    for(var rowIndex = 2; rowIndex < numberOfValues + 1; rowIndex++) {
      var rowValues = separateToColumns(stack[rowIndex]);

      for(intensityIndex = 0; intensityIndex < numberOfIntensities; intensityIndex++) {
        var column = target_intensities[intensityIndex];
        setValue(result[column.name], rowIndex - 1, rowValues[column.index]);
      }
    }

    for(var intensityIndex = 0; intensityIndex < numberOfIntensities; intensityIndex++) {
      var column = target_intensities[intensityIndex];
      buffers.push(result[column.name].values.buffer);
    }

    return [result, buffers];
  }
 
  function separateToRows(data){
    return data.trim().split(/\n+/);
  }

  function separateToColumns(data){
    return data.trim().split(/,/).map(function(value){
      return value.trim();
    });
  }

  function setInitialValue(intensityObject, value){
    intensityObject.values[0] = value;
    intensityObject.min = value;
    intensityObject.max = value;
  }

  function setValue(intensityObject, valueIndex, value){
    intensityObject.values[valueIndex] = value;
    intensityObject.min = Math.min(intensityObject.min, value);
    intensityObject.max = Math.max(intensityObject.max, value);
  }

  self.imports = self.imports || {};
  self.imports['csv-parser'] = self.imports['csv-parser'] || {};
  self.imports['csv-parser'].parseCSV = self.imports['csv-parser'].parseCSV || parse;

})();