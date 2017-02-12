(function parseAtlasIntensity() {
  "use strict";

  self.addEventListener("message", function(e) {
    var input = e.data;

    importScripts(input.url + 'utils/csv-parser.js');

    var atlasResultAndBuffers = imports['csv-parser'].parseCSV(input.data.atlas, input.options.atlas);
    var dataResultAndBuffers = imports['csv-parser'].parseCSV(input.data.values, input.options.values);

    var dataLink = input.options.values.link || 'ID';
    var atlasLink = input.options.atlas.link || 'label ID';

    var atlas = atlasResultAndBuffers[0];
    var data = dataResultAndBuffers[0];

    var buffers = [];
    var result = {};

    var dataByID = {};
    var properties = Object.keys(data);
    var property;
    properties.splice(properties.indexOf(dataLink), 1)

    for(var index = 0; index < data[dataLink].values.length; index++){
      dataByID[data[dataLink].values[index]] = {};
      forEachProperty(function(property){
        dataByID[data[dataLink].values[index]][property] = data[property].values[index];
      });
    }

    forEachProperty(function(property){
      result[property] = {};
      result[property].values = new Float32Array(atlas[atlasLink].values.length);
      result[property].atlasValuesByVertex = atlas[atlasLink].values
      result[property].min = data[property].min;
      result[property].max = data[property].max;
    });

    for(var atlasIndex = 0; atlasIndex < atlas[atlasLink].values.length; atlasIndex++){
      forEachProperty(function(property){
        var atlasLabelID = atlas[atlasLink].values[atlasIndex];
        result[property].values[atlasIndex] = dataByID[atlasLabelID] && dataByID[atlasLabelID][property];
      });
    }

    forEachProperty(function(property){
      buffers.push(result[property].values.buffer);
    });

    function forEachProperty(handleEach){
      for(var propertyIndex in properties){
        handleEach(properties[propertyIndex]);
      }
    }
    self.postMessage.apply(self, [result, buffers]);
  });

})();
