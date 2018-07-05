// Function Commneting is Missing also debug module
! function() {
  if (typeof require === "function") {
    XL = require('xlsx')
    fs = require('fs');
    EasyZip = require('easy-zip').EasyZip;
    d3 = require('d3');
    ruleEngine = require("axiom-rule-engine");
  }
  "use strict";
  var utils = {
    version: "1.0.0"
  };
  utils.mergeArraysByProperty = function(keys, jsonData) {
    var finalArray = [];
    var rulesArray = [];

    function prepareRule(data, rule, inputFields, outputFields, defaultValue) {
      data.forEach(function(d, i) {
        var input = {};
        inputFields.forEach(function(iData) {
          input[iData] = d[iData];
        });
        var output = {};
        outputFields.forEach(function(oData) {
          output[oData] = d[oData];
        });
        rule.addRule(input, output);
      });
      rule.defaultResult = defaultValue;
    }

    for (var i = 0; i < jsonData.length; i++) {
      rulesArray[i] = new ruleEngine({
        type: "Lookup",
        keys: keys
      });
      prepareRule(jsonData[i].data, rulesArray[i], keys, jsonData[i].output.map(function(d) { return d.name; }), {});
    }
    for (var i = 0; i < jsonData.length; i++) {
      var statistics = rulesArray[i].getStatistics();

      statistics.forEach(function(d) {
        if (d.count === 0 && d.hasOwnProperty('defaultResult') === false) {
          var objectToSearch = {};
          keys.forEach(function(key) {
            objectToSearch[key] = d.output[key];
          });
          var obj = utils.extend(true, {}, objectToSearch);
          // keep default values for previous array items
          for (var j = 0; j < i; j++) {
            jsonData[j].output.forEach(function(outputCol) {
              if (keys.indexOf(outputCol.name) == -1) {
                obj[outputCol.alias] = outputCol.defaultValue;
              }
            });
          }
          //keep same values for current array item
          jsonData[i].output.forEach(function(outputCol) {
            obj[outputCol.alias] = d.output[outputCol.name];
          });
          //lookup values from next array items
          for (var j = i + 1; j < jsonData.length; j++) {
            var result = rulesArray[j].getResult(objectToSearch);
            jsonData[j].output.forEach(function(outputCol) {
              if (keys.indexOf(outputCol.name) == -1) {
                obj[outputCol.alias] = result[outputCol.name] || outputCol.defaultValue;
              }
            });
          }
          finalArray.push(obj);
        }
      });
    }
    return finalArray;
  }

  utils.extend = function() {
    var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false,
      toString = Object.prototype.toString,
      hasOwn = Object.prototype.hasOwnProperty,
      push = Array.prototype.push,
      slice = Array.prototype.slice,
      trim = String.prototype.trim,
      indexOf = Array.prototype.indexOf,
      class2type = {
        "[object Boolean]": "boolean",
        "[object Number]": "number",
        "[object String]": "string",
        "[object Function]": "function",
        "[object Array]": "array",
        "[object Date]": "date",
        "[object RegExp]": "regexp",
        "[object Object]": "object"
      },
      jQ = {
        isFunction: function(obj) {
          return jQ.type(obj) === "function"
        },
        isArray: Array.isArray ||
          function(obj) {
            return jQ.type(obj) === "array"
          },
        isWindow: function(obj) {
          return obj != null && obj == obj.window
        },
        isNumeric: function(obj) {
          return !isNaN(parseFloat(obj)) && isFinite(obj)
        },
        type: function(obj) {
          return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
        },
        isPlainObject: function(obj) {
          if (!obj || jQ.type(obj) !== "object" || obj.nodeType) {
            return false
          }
          try {
            if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
              return false
            }
          } catch (e) {
            return false
          }
          var key;
          for (key in obj) {}
          return key === undefined || hasOwn.call(obj, key)
        }
      };
    if (typeof target === "boolean") {
      deep = target;
      target = arguments[1] || {};
      i = 2;
    }
    if (typeof target !== "object" && !jQ.isFunction(target)) {
      target = {}
    }
    if (length === i) {
      target = this;
      --i;
    }
    for (i; i < length; i++) {
      if ((options = arguments[i]) != null) {
        if (jQ.isArray(target)) {
          target = [];
        }
        for (name in options) {
          src = target[name];
          copy = options[name];
          if (target === copy) {
            continue
          }
          if (deep && copy && (jQ.isPlainObject(copy) || (copyIsArray = jQ.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && jQ.isArray(src) ? src : []
            } else {
              clone = src && jQ.isPlainObject(src) ? src : {};
            }
            // WARNING: RECURSION
            target[name] = utils.extend(deep, clone, copy);
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    return target;
  }
  utils.uuid = function(length, chars, extraString) {
    var mask = '';
    var timestamp = '';
    var timestampLength = 13;
    if (length == undefined) length = 16;
    if (chars == undefined) chars = 'aA#';

    // AV on 18-11-2015 for add timestamp
    // checking for invalid length
    if (chars.indexOf('T') > -1 && length <= timestampLength && chars.length > 1) {
      throw Error("invalid length");
    } else if (chars.indexOf('T') > -1 && length > timestampLength && chars.length == 1) {
      mask = (new Date()).getTime();
    }
    chars = chars.split("");
    chars.forEach(function(char) {
      if (char.indexOf('a') > -1)
        mask += 'abcdefghijklmnopqrstuvwxyz';
      else if (char.indexOf('A') > -1)
        mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      else if (char.indexOf('#') > -1)
        mask += '0123456789';
      else if (char.indexOf('!') > -1)
        mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
      else if (char.indexOf('T') > -1) {
        timestamp = (new Date()).getTime();
        length -= timestampLength;
      } else
        throw Error("invalid character found: " + char);
    })
    // if (chars.indexOf('a') > -1)
    //     mask += 'abcdefghijklmnopqrstuvwxyz';
    // if (chars.indexOf('A') > -1)
    //     mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // if (chars.indexOf('#') > -1)
    //     mask += '0123456789';
    // if (chars.indexOf('!') > -1)
    //     mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';

    if (extraString != '' && extraString != null && extraString != undefined)
      mask += extraString;
    var result = '';
    mask = mask.toString();
    for (var i = length; i > 0; --i) {
      result += mask[Math.round(Math.random() * (mask.length - 1))];
    }
    result += timestamp;
    return result;
  }
  utils.JSON2CSV = function(objArray, requireHeader, fieldSeparator, cb) {
    if (arguments.length < 3 || arguments.length > 4) {
      throw Error("invalid Argument length");
    }

    if (typeof fieldSeparator === 'function') {
      cb = fieldSeparator;
      fieldSeparator = ',';
    }
    var array = typeof objArray != 'object' ? [objArray] : objArray;
    //console.log(typeof objArray);
    var str = '';
    if (array.length > 0) {

      var keys = Object.keys(array[0]);
      if (requireHeader == true) {
        str += keys.join(fieldSeparator) + '\r\n';
      }

      //append data
      for (var i = 0; i < array.length; i++) {
        var line = [];

        for (var index = 0; index < keys.length; index++) {
          if (array[i].hasOwnProperty(keys[index])) {
            var val = array[i][keys[index]];

            if (typeof val == 'string' && val != null) {
              val = val.replace(/"/g, '\\"');
              if (val.indexOf(fieldSeparator) != -1) {
                if (val != 'null')
                  line.push('"' + val + '"');
                else
                  line.push('');
              } else {
                if (val != 'null')
                  line.push(val);
                else
                  line.push('');
              }
            } else {
              line.push(val);
            }

          }
        }
        str += line.join(fieldSeparator) + '\r\n';
      }
      cb(str);
    } else {
      //returning empty arry in callback incase the length of array is 0  
      cb([]);
    }
  }
  utils.JSON2ARRAY = function(objArray) {
    var array = typeof objArray != 'object' ? [objArray] : objArray;
    //console.log(typeof objArray);
    var arrData = [];
    var str = '';
    if (array.length > 0) {
      var keys = Object.keys(array[0]);
      arrData.push(keys)

      //append data
      for (var i = 0; i < array.length; i++) {
        var line = [];

        for (var index = 0; index < keys.length; index++) {
          if (array[i].hasOwnProperty(keys[index])) {
            var val = array[i][keys[index]];
            line.push(val);
          } else {
            line.push(null);
          }
        }
        arrData.push(line);
      }
    }
    return arrData;
  }
  // Av : Array of Json to JSON
  utils.ARRAY2JSON = function(objArray, key) {
    var objJSON = {};
    for (var index = 0; index < objArray.length; index++) {
      objJSON[objArray[index][key]] = objArray[index];
    }
    return objJSON;
  }

  utils.JSON2EXCEL = function(jsonData, sheetName, header, dateFormat, filePath,isSkipHeader) {
    if(!isSkipHeader){
      isSkipHeader=false;
    }
    if (!filePath || !sheetName || !jsonData) {
      throw Error("jsonData or SheetName or FilePath is not specified")
    }

    if (!Array.isArray(sheetName)) {
      jsonData = [jsonData];
      sheetName = [sheetName];
      header = [header];
      dateFormat = [dateFormat];
    }
    var workbook = {};
    if (sheetName.length == jsonData.length && jsonData.length == header.length && header.length == dateFormat.length) {
      workbook['Sheets'] = {};
      workbook['SheetNames'] = [];
      sheetName.forEach(function(ws_name, ws_key) {
        if (!Array.isArray(jsonData[ws_key]) || (header[ws_key] && !Array.isArray(header[ws_key]))) {
          throw Error("Data/Header Passed is not an Array");
        }
        workbook['SheetNames'].push(ws_name);
        /* make worksheet */
        var worksheet = XL.utils.json_to_sheet(jsonData[ws_key], { header: header[ws_key], dateNF: dateFormat[ws_key] , skipHeader:isSkipHeader});
        /* Add the worksheet to the workbook */
        workbook['Sheets'][ws_name] = worksheet;
      });
      XL.writeFile(workbook, filePath);
      return true;
    } else {
      throw Error("SheetName doesn't match with SheetData");
    }
  }

  utils.EXCEL2JSON = function(excelFilePath, sheetName) {
    if (!excelFilePath || !sheetName) {
      throw Error('wrong number of arguements passed');
    }
    var excelfilename = excelFilePath.split('.')
    var excelFormat = excelfilename[excelfilename.length - 1];
    if (excelFormat == 'xlsx' || excelFormat == 'xls' || excelFormat == 'xlsb') {
      var workbook = XL.readFile(excelFilePath);
      if (!workbook.SheetNames.includes(sheetName)) {
        throw Error('Sheet ' + sheetName + ' not present at given path');
      }
      var arrays = XL.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })
      let keys = arrays[0];
      let values = arrays.slice(1);
      let objects = values.map(array => {
        let object = {};
        keys.forEach((key, i) => object[key] = array[i]);
        return object;
      });
      return objects;
    } else {
      throw Error('File format not supported');
    }
  }

  utils.concateString = function(stringArray, seperatorArray) {
    if (seperatorArray.length < (stringArray.length - 1)) {
      return {
        status: false,
        error: "Enter Proper Seperator"
      };
    }
    var retString = "";
    seperatorArray.forEach(function(d, i) {
      retString = retString + stringArray[i] + d;
    });
    retString = retString + stringArray[stringArray.length - 1];
    return {
      status: true,
      content: retString
    };

  }
  utils.generateID = function(constant, values, dateObj) {
    var idNumber = "";
    constant = constant[0];
    idNumber = constant.static;
    idNumber = idNumber + constant.seperator + values.value;
    idNumber = idNumber + constant.seperator + (dateObj.getFullYear().toString()).substr(2, 2);
    idNumber = idNumber + constant.seperator + (dateObj.getMonth() + 1);
    idNumber = idNumber + constant.seperator + dateObj.getDate();
    return idNumber;
  }
  //CBT:THis method add pading zero to numbers
  utils.pad = function(n, width, paddingChar, z) {
    z = z || paddingChar;
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
  utils.CSV2JSON = function(csvData, headerMapping, lineSeperator, columnSeperator, ignoreNotMatchingLines, enclosedChar) {
    var retJSONdata = [];
    var headerData = null;
    var all_rows = null;
    var flag = false;
    var retValue = null;
    var columnSeperator = columnSeperator || ",";
    var lineSeperator = lineSeperator || "\n";
    // all_rows = csvData.split(lineSeperator);
    all_rows = utils.splitByChar(csvData, lineSeperator, enclosedChar, enclosedChar, false, false);
    headerData = utils.splitByChar(all_rows[0], columnSeperator, enclosedChar, enclosedChar, true, true);
    all_rows.splice(0, 1);
    flag = all_rows.every(function(d, rowIndex) {
      if (d.length == 0) {
        return true;
      } else {
        var trmpJSON = {};
        var tempRow = utils.splitByChar(d, columnSeperator, enclosedChar, enclosedChar, true, true);
        headerData.forEach(function(d1, i) {
          if (headerMapping != undefined && Array.isArray(headerMapping) === true) {
            if (tempRow[i] != undefined) {
              trmpJSON[headerMapping[i]] = utils.realEscapeString(tempRow[i]);
            } else {
              trmpJSON[headerMapping[i]] = '';
            }
          } else if (headerMapping != undefined && headerMapping[d1] != undefined) {
            trmpJSON[headerMapping[d1]] = tempRow[i];
          } else {
            trmpJSON[d1] = tempRow[i];
          }
        });
        retJSONdata.push(trmpJSON);
        return true;
      }
    });
    if (!flag) {
      throw Error("invalid csv");
    } else {
      retValue = retJSONdata;
    };
    return retValue;
  }
  utils.realEscapeString = function(str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(char) {
      switch (char) {
        case "\0":
          return "\\0";
        case "\x08":
          return "\\b";
        case "\x09":
          return "\\t";
        case "\x1a":
          return "\\z";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case "\"":
        case "'":
        case "\\":
        case "%":
          return "\\" + char; // prepends a backslash to backslash, percent,
          // and double/single quotes
      }
    });
  }
  utils.splitByChar = function(line, splitChar, enclosedStartChar, enclosedEndChar, removeEnclosedChar, trim) {
    var arrFields = [];
    var bracketCounter = 0;
    var currLine = '';
    for (var cnt = 0; cnt < line.length; cnt++) {
      if (line.charAt(cnt) == enclosedStartChar) {
        if (enclosedStartChar == enclosedEndChar && bracketCounter > 0) {
          bracketCounter--;
        } else {
          bracketCounter++;
        }
      } else if (line.charAt(cnt) == enclosedEndChar) {
        bracketCounter--;
      }
      if (bracketCounter == 0) {
        //if (line.charAt(cnt) == splitChar) {
        if (line.substr(cnt, splitChar.length) == splitChar) {
          if (removeEnclosedChar == true) {
            if (currLine.indexOf(enclosedStartChar) == 0) {
              currLine = currLine.substr(1, currLine.length - 2);
            }
          }
          if (trim) {
            currLine = currLine.trim();
          }
          arrFields.push(currLine);
          currLine = "";
          cnt += (splitChar.length - 1);
        } else {
          currLine += line.charAt(cnt);
        }
      } else {
        currLine += line.charAt(cnt);
      }
    }
    if (removeEnclosedChar == true) {
      if (currLine.indexOf(enclosedStartChar) == 0) {
        currLine = currLine.substr(1, currLine.length - 2);
      }
    }
    if (trim) {
      currLine = currLine.trim();
    }
    arrFields.push(currLine);
    return arrFields;
  }
  utils.gerenateSubsetBasedOnKeys = function(settings, keyArray) {
    function processSetting(array) {
      for (var i = 0; i < array.length; i++) {
        var d = array[i];
        if (d.hasOwnProperty('child')) {
          returnArray = processSetting(d.child);
          if (d.child.length === 0) {
            array.splice(i, 1);
            i--;
          }
        } else {
          if (keyArray.indexOf(d.key) === -1) {
            array.splice(i, 1);
            i--;
          }
        }
      }
      return array;
    }
    var replicatedScreenSetting = utils.extend(true, {}, settings);
    return processSetting(replicatedScreenSetting.application);
  }

  utils.zipFolderAndDownload = function(folderPath, cb) {
    var zip = new EasyZip();
    zip.zipFolder(folderPath, function() {
      var zipFilePath = folderPath;
      if (folderPath.slice(-1) == "/") {
        zipFilePath = folderPath.substring(0, folderPath.length - 1);
      }
      //write data to http.Response
      // zip.writeToResponse(res, 'ModelFiles');
      fs.unlink(zipFilePath + ".zip", function() {
        zip.writeToFile(zipFilePath + ".zip", function() {
          cb(zipFilePath + ".zip");
        });
      });
    });
  }

  utils.evenDistributionRange = function(json, include, cb) {
    //example evenDistributionRange({input:[{start:1, end:11}],output:[]}, true);
    if (json.input.length <= 0) {
      console.log(json.output);
      if (cb) {
        cb(json);
      }
      return;
    }
    var currInput = json.input.shift();
    var start = currInput.start;
    var end = currInput.end;
    if (include === true) {
      json.output.push(start);
      json.output.push(end);
      // console.log("start", start);
      // console.log("end", end);
    }
    var middle = Math.floor((start + end) / 2);
    // console.log("middle", middle);
    json.output.push(middle);
    if (middle - start > 1) {
      json.input.push({
        start: start,
        end: middle
      });
    }
    if (end - middle > 1) {
      json.input.push({
        start: middle,
        end: end
      });
    }
    setTimeout(function() {
      utils.evenDistributionRange(json, false, cb);
    }, 1);
  }

  // AV: this function is use for select particular filed in data like sql select
  //Select(data,[{field:"Plant", alias:"Plant"},{field:"Date", alias:"Date"}])
  utils.Select = function(data, fieldArray) {
    return data.map(function(d) {
      return utils.SelectKeys(d, fieldArray);
    });
  }; /* Select() end */

  // AV: this function use in inside Select function
  utils.SelectKeys = function(jsonOBJ, fieldArray) {
    var retData = {};
    fieldArray.forEach(function(f, i) {
      if (typeof f === "string")
        retData[f] = jsonOBJ[f];
      else if (f.hasOwnProperty('field') && f.hasOwnProperty('alias')) {
        retData[f.alias] = jsonOBJ[f.field];
      } else {
        throw Error('Invalid Select structure');
      }
    });
    return retData;
  }; /* SelectKeys() end */

  // This function similar to group by query of sql
  //GroupBy(data, ["Plant", "cluster"], [{field:"Plant", alias:"Plant"}, {field:"AllocQty1to10TruckFinal", aggregation:"sum", alias:"AllocQty1to10TruckFinal"}])
  utils.GroupBy = function(data, groupByArray, filedObjectOfArray) {
    var result = [];
    var nested_data = d3.nest();
    groupByArray.forEach(function(d, i) {
      nested_data = nested_data.key(function(k) {
        return k[d];
      });
    });
    nested_data = nested_data.rollup(function(allRows) {
      var output = {};
      filedObjectOfArray.forEach(function(selectField) {
        if (selectField.hasOwnProperty("aggregation")) {
          if (selectField.aggregation === "sum" || selectField.aggregation === "max" || selectField.aggregation === "min") {
            output[selectField.alias || selectField.field] = d3[selectField.aggregation](allRows, function(d) {
              return parseFloat(d[selectField.field]);
            });
          } else if (selectField.aggregation === "count") {
            output[selectField.alias || selectField.field] = allRows.length;
          }
        } else {
          output[selectField.alias || selectField.field] = allRows[0][selectField.field];
        }
      });
      result.push(output);
      return allRows.length;
    });
    nested_data = nested_data.entries(data);
    return result;
  }; /* GroupBy() end */

  utils.sort = function(data, sortFields) {
    for (var i1 = 0; i1 < data.length; i1++) {
      for (var i2 = i1 + 1; i2 < data.length; i2++) {
        var isChange = sortFields.some(function(field) {
          var fieldName = "";
          var sortASC = true;
          if (typeof field === "string") {
            fieldName = field;
            sortASC = true;
          } else {
            fieldName = field.name;
            if (field.hasOwnProperty("sortASC")) {
              sortASC = field.sortASC;
            }
          }
          if (data[i1][fieldName] === data[i2][fieldName]) {
            return false;
          } else if (data[i1][fieldName] > data[i2][fieldName]) {
            return sortASC;
          } else {
            return !sortASC;
          }
        });
        if (isChange === true) {
          var a = data[i1];
          data[i1] = data[i2];
          data[i2] = a;
        }
      }
    }
    return data;
  };

  // AA : 25APR2016
  // METHOD TO REPLACE " WITH \\"
  utils.stringifyForDB = function(data) {
    var newData = {};
    var fields = Object.keys(data);
    fields.forEach(function(field) {
      var replacedData = data[field];
      if (replacedData != null) {
        // newData[field] = replacedData.toString().replace(/\"/ig, "\\\"");
        newData[field] = replacedData.toString().replace(/\"/ig, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
      } else {
        newData[field] = replacedData
      }
    });
    return JSON.stringify(newData);
  };

  utils.getIndexOf = function(array, number, addIfNotAvailable, key, probableIndex) {
    if (array.length == 0) {
      if (addIfNotAvailable) {
        array.push(number);
        return array.length - 1;
      } else {
        return -1;
      }
    }
    var top = 0;
    var bottom = array.length;
    var center = Math.floor((top + bottom) / 2);
    //if(number<array[0])
    if (((key == undefined) ? (number < array[0]) : (number[key] < array[0][key]))) {
      if (addIfNotAvailable) {
        array.splice(0, 0, number);
        return 0;
      } else {
        if (probableIndex)
          return -1;
        else
          return -1;
      }
    }
    //else if(number>array[bottom-1])
    else if (((key == undefined) ? (number > array[bottom - 1]) : (number[key] > array[bottom - 1][key]))) {
      if (addIfNotAvailable) {
        array.push(number);
        return array.length - 1;
      } else {
        if (probableIndex)
          return bottom;
        else
          return -1;
      }
    } else {
      while (true) {
        var val = array[center];
        //if(number == val)
        if (((key == undefined) ? (number == val) : (number[key] == val[key]))) {
          return center;
        } else if (bottom - top <= 1) {
          if (addIfNotAvailable) {
            array.splice(bottom, 0, number);
            return bottom;
          } else {
            if (probableIndex)
              return top;
            else
              return -1;
          }
        } else {
          //if(number<val)
          if (((key == undefined) ? (number < val) : (number[key] < val[key]))) {
            bottom = center;
            center = Math.floor((top + bottom) / 2);
          } else {
            top = center;
            center = Math.floor((top + bottom) / 2);
          }
        }
      }
    }
  }

  /* Util Library End */
  if (typeof define === "function" && define.amd) this.utils = utils, define(utils);
  else if (typeof module === "object" && module.exports) module.exports = utils;
  else this.utils = utils;
}();
