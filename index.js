// Function Commneting is Missing also debug module
! function() {
  if (typeof require === "function") {
    XL = require('xlsx')
    fs = require('fs');
    EasyZip = require('easy-zip2').EasyZip;
    d3 = require('d3');
    ruleEngine = require("axiom-rule-engine");
    xml2json = require("xml2json");
  }
  "use strict";
  const utils = {
    version: "1.0.0"
  };

  utils.convertObjectKeysCaseInsensitive = function(row){
    const updated_row = new Proxy({}, {
      get: function(target, name) {
        if (typeof name !== 'string') {
          return undefined;
        }
        if (!(name.toLowerCase() in target)) {
          return undefined;
        }
        return target[name.toLowerCase()];
      },
      set: function(target, name, value) {
        if (typeof name !== 'string') {
          return undefined;
        }
        target[name.toLowerCase()] = value;
      }
    });
    Object.keys(row).forEach(d=>{updated_row[d]=row[d]});
    updated_row.hasOwnProperty = function(name) {
      return name.toLowerCase() in this;
    }
    return updated_row;
  }

  utils.prepareRule = function (data, rule, inputFields, outputFields, defaultValue) {
    data.forEach(function(d, i) {
      const input = {};
      inputFields.forEach(function(iData) {
        input[iData] = d[iData];
      });
      const output = {};
      outputFields.forEach(function(oData) {
        output[oData] = d[oData];
      });
      rule.addRule(input, output);
    });
    rule.defaultResult = defaultValue;
  }
  
  utils.mergeArraysByProperty = function(keys, jsonData) {
    const finalArray = [];
    const rulesArray = [];

    for (let i = 0; i < jsonData.length; i++) {
      rulesArray[i] = new ruleEngine({
        type: "Lookup",
        keys: keys
      });
      utils.prepareRule(jsonData[i].data, rulesArray[i], keys, jsonData[i].output.map(function(d) { return d.name; }), {});
    }
    for (let i = 0; i < jsonData.length; i++) {
      const statistics = rulesArray[i].getStatistics();

      statistics.forEach(function(d) {
        if (d.count === 0 && d.hasOwnProperty('defaultResult') === false) {
          const objectToSearch = {};
          keys.forEach(function(key) {
            objectToSearch[key] = d.output[key];
          });
          const obj = utils.extend(true, {}, objectToSearch);
          // keep default values for previous array items
          for (let j = 0; j < i; j++) {
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
          for (let j = i + 1; j < jsonData.length; j++) {
            const result = rulesArray[j].getResult(objectToSearch);
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

  utils.getCommonElements = function(keys, jsonData) {
    const finalArray = [];
    const rulesArray = [];

    for (let i = 0; i < jsonData.length; i++) {
      rulesArray[i] = new ruleEngine({
        type: "Lookup",
        keys: keys
      });
      utils.prepareRule(jsonData[i].data, rulesArray[i], keys, jsonData[i].output.map(function(d) { return d.name; }), {});
    }
    const statistics = rulesArray[0].getStatistics();

    statistics.forEach(function(d) {
      if (d.count === 0 && d.hasOwnProperty('defaultResult') === false) {
        const objectToSearch = {};
        keys.forEach(function(key) {
          objectToSearch[key] = d.output[key];
        });
        const obj = utils.extend(true, {}, objectToSearch);
        //keep same values for current array item
        jsonData[0].output.forEach(function(outputCol) {
          obj[outputCol.alias] = d.output[outputCol.name];
        });
        let elementNotFound = false;
        //lookup values from next array items
        for (let j = 1; j < jsonData.length; j++) {
          const result = rulesArray[j].getResult(objectToSearch);
          if(Object.keys(result).length == 0){
            elementNotFound = true;
            break;
          }
          else{
            jsonData[j].output.forEach(function(outputCol) {
              if (keys.indexOf(outputCol.name) == -1 && obj.hasOwnProperty(outputCol.alias)==false) {
                obj[outputCol.alias] = result[outputCol.name] || outputCol.defaultValue;
              }
            });
          }
        }
        if(!elementNotFound){
          finalArray.push(obj);
        }
      }
    });
    
    return finalArray;
  }

  utils.extend = function() {
    let options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
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
          let key;
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
    let mask = '';
    let timestamp = '';
    const timestampLength = 13;
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
    let result = '';
    mask = mask.toString();
    for (let i = length; i > 0; --i) {
      result += mask[Math.round(Math.random() * (mask.length - 1))];
    }
    result += timestamp;
    return result;
  }
  utils.JSON2CSV = function(objArray, requireHeader, fieldSeparator, headerSequence,cb) {
    if (arguments.length < 3 || arguments.length > 5) {
      throw Error("invalid Argument length");
    }

    if (typeof fieldSeparator === 'function') {
      cb = fieldSeparator;
      fieldSeparator = ',';
    }

    if (typeof headerSequence === 'function') {
      cb =  headerSequence;
      headerSequence = []; 
    }
    
    if(fieldSeparator==null || fieldSeparator==undefined){
      fieldSeparator=',';
    }
    const array = typeof objArray != 'object' ? [objArray] : objArray;
    //console.log(typeof objArray);
    let str = '';
    if (array.length > 0) {

      let keys = Object.keys(array[0]);
      if (requireHeader == true) {
        if(Array.isArray(headerSequence) && headerSequence.length > 0) {
          keys = headerSequence
          // str += keys.join(fieldSeparator) + '\r\n';
        }
        str += keys.join(fieldSeparator) + '\r\n';
      }
      //append data
      for (let i = 0; i < array.length; i++) {
        let line = [];

        for (let index = 0; index < keys.length; index++) {
          if (array[i].hasOwnProperty(keys[index])) {
            let val = array[i][keys[index]];

            if (typeof val == 'string' && val != null) {
              if (val.indexOf(fieldSeparator) != -1 || val.indexOf('"')!=-1) {
                if (val != 'null'){
                  val = val.replace(/"/g, '""');
                  line.push('"' + val + '"');
                 } else
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
      if(cb && typeof cb == 'function')
        cb(str);
      else
        return str;
    } else {
      //returning empty arry in callback incase the length of array is 0  
      if(cb && typeof cb == 'function')
        cb([]);
      else
        return [];
    }
  }
  utils.JSON2ARRAY = function(objArray) {
    const array = typeof objArray != 'object' ? [objArray] : objArray;
    //console.log(typeof objArray);
    const arrData = [];
    let str = '';
    if (array.length > 0) {
      const keys = Object.keys(array[0]);
      arrData.push(keys)

      //append data
      for (let i = 0; i < array.length; i++) {
        const line = [];

        for (let index = 0; index < keys.length; index++) {
          if (array[i].hasOwnProperty(keys[index])) {
            const val = array[i][keys[index]];
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
  // Array of array to JSON
  utils.ARRAY2JSON = function(dataArray, headerArray) {
    let arrayJSON = [];
    for(let rowIndex = 0; rowIndex < dataArray.length; rowIndex++) {
      const objJSON = {};
      let currDataArray = dataArray[rowIndex];
      for (let colIndex = 0; colIndex < currDataArray.length; colIndex++) {
        objJSON[headerArray[colIndex]] = currDataArray[colIndex];
      }
      arrayJSON.push(objJSON);
    }
    return arrayJSON;
  }

  utils.JSON2EXCEL = function(jsonData, sheetName, header, dateFormat, filePath,skipHeader) {
    if(!skipHeader){
      skipHeader=false;
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
    const workbook = {};
    if (sheetName.length == jsonData.length && jsonData.length == header.length && header.length == dateFormat.length) {
      workbook['Sheets'] = {};
      workbook['SheetNames'] = [];
      sheetName.forEach(function(ws_name, ws_key) {
        if (!Array.isArray(jsonData[ws_key]) || (header[ws_key] && !Array.isArray(header[ws_key]))) {
          throw Error("Data/Header Passed is not an Array");
        }
        workbook['SheetNames'].push(ws_name);
        /* make worksheet */
        const worksheet = XL.utils.json_to_sheet(jsonData[ws_key], { header: header[ws_key], dateNF: dateFormat[ws_key], skipHeader:skipHeader});
        /* Add the worksheet to the workbook */
        workbook['Sheets'][ws_name] = worksheet;
      });
      XL.writeFile(workbook, filePath);
      return true;
    } else {
      throw Error("SheetName doesn't match with SheetData");
    }
  }

  utils.EXCEL2JSON = function(excelFilePath, sheetName, extraReadFileParams, extraSheetToJsonParams) {
    if (!excelFilePath || !sheetName) {
      throw Error('wrong number of arguements passed');
    }
    const excelfilename = excelFilePath.split('.')
    const excelFormat = excelfilename[excelfilename.length - 1].toLowerCase();
    if (excelFormat == 'xlsx' || excelFormat == 'xls' || excelFormat == 'xlsb') {
      const workbook = XL.readFile(excelFilePath, extraReadFileParams || null);
      if (!workbook.SheetNames.includes(sheetName)) {
        throw Error('Sheet ' + sheetName + ' not present at given path');
      }
      let sheetToJsonParams = {
        header: 1
      };
      if(extraSheetToJsonParams && (typeof extraSheetToJsonParams == 'object')) {
        Object.keys(extraSheetToJsonParams).forEach(param => {
          sheetToJsonParams[param] = extraSheetToJsonParams[param]
        });
      }
      const arrays = XL.utils.sheet_to_json(workbook.Sheets[sheetName], sheetToJsonParams)
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
    let retString = "";
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
    let idNumber = "";
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
  utils.CSV2JSON = function(csvData, headerMapping, lineSeperator, columnSeperator, ignoreNotMatchingLines, enclosedChar, escapeChar) {
    if(!lineSeperator){
      lineSeperator = "\n";
    }
    if(!columnSeperator){
      columnSeperator = ",";
    }
    if(!enclosedChar){
      enclosedChar='"';
    }
    if(!escapeChar){
      escapeChar='"';
    }
    let currentProcessingLine = "";
    let isCurrentProcessingLineEnclosed = false; // = enclosedChar == csvData[0] ? true : false;
    // let jsonData;
    let dataArray = [];
    let colArr = [];
    const addCurrentLineToResponse = (type) => {
      // if (trim) {
      //   currentProcessingLine.trim();
      // }
      if(type.toLowerCase() === 'column') {
        colArr.push(currentProcessingLine.trim());
      } else {
        colArr.push(currentProcessingLine.trim());
        dataArray.push(colArr);
        colArr = [];
      }
      currentProcessingLine = "";
    };
    const checkIfColumnSplitChar = (index) => {
      return columnSeperator.split('').every((c, i) => csvData[index+i] === c);
    }
    const checkIfRowSplitChar = (index) => {
      return lineSeperator.split('').every((c, i) => csvData[index+i] === c);
    }

    for (let i = 0; i < csvData.length; i++) {
      let currentChar = csvData[i];
      let isNextCharEnclosedField = (csvData[i + 1] === enclosedChar);
      let isNextCharEscapeField = csvData[i + 1] === escapeChar;
      
      if(currentChar === escapeChar && isCurrentProcessingLineEnclosed && (isNextCharEnclosedField || isNextCharEscapeField)) {
        // console.log('Case.1', csvData[i]);
        currentProcessingLine += csvData[i + 1];
        i++;
      } else if(currentChar === enclosedChar) {
        // console.log('Case.2', csvData[i], currentChar === enclosedChar);
        isCurrentProcessingLineEnclosed = !isCurrentProcessingLineEnclosed
      } else if(isCurrentProcessingLineEnclosed && currentChar !== enclosedChar) {
        // console.log('Case.3', csvData[i]);
        currentProcessingLine += csvData[i];
      } else if(checkIfColumnSplitChar(i)) {
        // console.log('Case.4', csvData[i]);
        addCurrentLineToResponse('column');
        i+=columnSeperator.length -1;
      } else if(checkIfRowSplitChar(i)) {
        // console.log('Case.5', csvData[i]);
        addCurrentLineToResponse('row');
        i+=lineSeperator.length -1;
      } else {
        // console.log('Case.6', csvData[i]);
        currentProcessingLine += currentChar;
      }
    }
    if(currentProcessingLine)
      addCurrentLineToResponse('row');
    let header = dataArray.splice(0, 1)[0];
    let jsonData = utils.ARRAY2JSON(dataArray, headerMapping ? headerMapping : header);

    return jsonData;
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
  utils.splitByChar = function(line, splitChar, enclosedStartChar, enclosedEndChar, removeEnclosedChar, trim, escapeChar = '"', removeEscapeChar) {
    let counter = 0;
    let response = [];
    let currentProcessingLine = "";
    let isCurrentProcessingLineEnclosed = false; // = enclosedStartChar == line[0] ? true : false;
    const addCurrentLineToResponse = () => {
      if (trim) {
        currentProcessingLine = currentProcessingLine.trim();
      }
      response.push(currentProcessingLine);
      currentProcessingLine = "";
    };
    const checkIfSplitChar = (index) => {
      return splitChar.split('').every((c, i) => line[index+i] === c);
    }

    for (let i = 0; i < line.length; i++) {
      let currentChar = line[i];
      let isNextCharEnclosedField = (line[i + 1] === enclosedStartChar || line[i + 1] === enclosedEndChar);
      let isNextCharEscapeField = line[i + 1] === escapeChar;
      
      if(currentChar === escapeChar && isCurrentProcessingLineEnclosed && (isNextCharEnclosedField || isNextCharEscapeField)) {
        currentProcessingLine += removeEscapeChar ? '' : line[i];
        currentProcessingLine += line[i + 1];
        i++;
      } else if(currentChar === enclosedStartChar && !isCurrentProcessingLineEnclosed) {
        isCurrentProcessingLineEnclosed = true;
        currentProcessingLine += removeEnclosedChar ? '' : currentChar;
      } else if(currentChar === enclosedEndChar && isCurrentProcessingLineEnclosed) {
        isCurrentProcessingLineEnclosed = !isCurrentProcessingLineEnclosed;
        currentProcessingLine += removeEnclosedChar ? '' : currentChar;
      } else if(isCurrentProcessingLineEnclosed && currentChar !== enclosedEndChar) {
        currentProcessingLine += line[i];
      } else if(checkIfSplitChar(i)) {
        addCurrentLineToResponse();
        i+=splitChar.length -1;
      } else {
        currentProcessingLine += currentChar;
      }
    }
    if(currentProcessingLine!=""){
      addCurrentLineToResponse();
    }
    return response;
  }
  utils.gerenateSubsetBasedOnKeys = function(settings, keyArray) {
    function processSetting(array) {
      for (let i = 0; i < array.length; i++) {
        let d = array[i];
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
    const replicatedScreenSetting = utils.extend(true, {}, settings);
    return processSetting(replicatedScreenSetting.application);
  }

  utils.zipFolderAndDownload = function(folderPath, cb) {
    const zip = new EasyZip();
    if(cb){
      zip.zipFolder(folderPath, function() {
        let zipFilePath = folderPath;
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
    }else{
      return new Promise((resolve, reject) => {
        zip.zipFolder(folderPath, function(err) {
          if(err){
            reject(err);
          }
          let zipFilePath = folderPath;
          if (folderPath.slice(-1) == "/") {
            zipFilePath = folderPath.substring(0, folderPath.length - 1);
          }
          //write data to http.Response
          // zip.writeToResponse(res, 'ModelFiles');
          fs.unlink(zipFilePath + ".zip", function(err) {
            zip.writeToFile(zipFilePath + ".zip", function(err) {
              if(err){
                reject(err);
              }else{
                resolve(zipFilePath + ".zip");
              }
            });
          });
        });
      })
    }
  }

  utils.evenDistributionRange = function(json, include, cb) {
    //example evenDistributionRange({input:[{start:1, end:11}],output:[]}, true);
    if(cb){
      if (json.input.length <= 0) {
        console.log(json.output);
        if (cb) {
          cb(json);
        }
        return;
      }
      const currInput = json.input.shift();
      const start = currInput.start;
      const end = currInput.end;
      if (include === true) {
        json.output.push(start);
        json.output.push(end);
        // console.log("start", start);
        // console.log("end", end);
      }
      const middle = Math.floor((start + end) / 2);
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
    }else{
      return new Promise((resolve, reject) => {
        if (json.input.length <= 0) {
          console.log(json.output);
          // if (cb) {
          //   cb(json);
          // }
          // return;
          resolve(json);
        }else{
          const currInput = json.input.shift();
          const start = currInput.start;
          const end = currInput.end;
          if (include === true) {
            json.output.push(start);
            json.output.push(end);
            // console.log("start", start);
            // console.log("end", end);
          }
          const middle = Math.floor((start + end) / 2);
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
            utils.evenDistributionRange(json, false);
          }, 1);
        }
      })
    }
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
    const retData = {};
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
    const result = [];
    let nested_data = d3.nest();
    groupByArray.forEach(function(d, i) {
      nested_data = nested_data.key(function(k) {
        return k[d];
      });
    });
    nested_data = nested_data.rollup(function(allRows) {
      const output = {};
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
    for (let i1 = 0; i1 < data.length; i1++) {
      for (let i2 = i1 + 1; i2 < data.length; i2++) {
        const isChange = sortFields.some(function(field) {
          let fieldName = "";
          let sortASC = true;
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
          let a = data[i1];
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
    const newData = {};
    const fields = Object.keys(data);
    fields.forEach(function(field) {
      let replacedData = data[field];
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
    let top = 0;
    let bottom = array.length;
    let center = Math.floor((top + bottom) / 2);
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
        let val = array[center];
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

  utils.xmlToJson = function(xml) {
    return JSON.parse(xml2json.toJson(xml)); 
  }

  utils.jsonToXml = function(json) {
    return xml2json.toXml(json);
  }
  
  /* Util Library End */
  if (typeof define === "function" && define.amd) this.utils = utils, define(utils);
  else if (typeof module === "object" && module.exports) module.exports = utils;
  else this.utils = utils;
}();
