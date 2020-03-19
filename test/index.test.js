const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const axiomUtils = require('../index.js');
const fs = require('fs').promises;
const testData = __dirname + "/data";
const testJsonData = require(`${testData}/data.js`);

describe('Should return correct json for csv', function() {
	describe('check CSV2JSON', function() {
    it('should return correct json for " as escape & enclose character', function(done) {
    	 fs.readFile(`${testData}/doubleQuoteTest.csv`, {encoding: 'utf-8'})
    	 .then((result) => {
    	 		let jsonData = axiomUtils.CSV2JSON(result, null, '\n', ',', null, '"', '"');
    	 		expect(jsonData).to.deep.equal(testJsonData.withEncloseAndEscapeCSVTest);
    	 		done();
    	 })
    	 .catch((error) => {
    	 	console.log('error', error);
        done();
    	 }) 
    });

    it('should return correct json for \\ as escape & " as enclose character', function(done) {
    	 fs.readFile(`${testData}/backSlashTest.csv`, {encoding: 'utf-8'})
    	 .then((result) => {
    	 		let jsonData = axiomUtils.CSV2JSON(result, null, '\n', ',', null, '"', '\\');
    	 		expect(jsonData).to.deep.equal(testJsonData.withEncloseAndEscapeCSVTest);
    	 		done();
    	 })
    	 .catch((error) => {
    	 	console.log('error', error);
        done();
    	 }) 
    });

    it('should return incorrect json for data with invalid column count', function(done) {
    	 fs.readFile(`${testData}/errorTestData.csv`, {encoding: 'utf-8'})
    	 .then((result) => {
    	 		let jsonData = axiomUtils.CSV2JSON(result, null, '\n', ',', null, '"', '"');
    	 		expect(jsonData).to.deep.equal(testJsonData['errorCSVTest']);
    	 		done();
    	 })
    	 .catch((error) => {
    	 	console.log('error', error);
        done();
    	 }) 
    });

    it('should return correct json for data without enclose  & escape character', function(done) {
    	 fs.readFile(`${testData}/withouEncloseAndEscapeChar.csv`, {encoding: 'utf-8'})
    	 .then((result) => {
    	 		let jsonData = axiomUtils.CSV2JSON(result, null, '\n', ',', null, '"', '"');
    	 		expect(jsonData).to.deep.equal(testJsonData['w/oEncloseAndEscape']);
    	 		done();
    	 })
    	 .catch((error) => {
    	 	console.log('error', error);
        done();
    	 }) 
    });

    it('should return correct json for data with custom header', function(done) {
    	 fs.readFile(`${testData}/withouEncloseAndEscapeChar.csv`, {encoding: 'utf-8'})
    	 .then((result) => {
    	 		let jsonData1 = axiomUtils.CSV2JSON(result, ['Col A', 'Col B'], '\n', ',', null);
          let jsonData2 = axiomUtils.CSV2JSON(result, ['Col A', 'Col B'], '\n', ',', null, false, false);
          let jsonData3 = axiomUtils.CSV2JSON(result, ['Col A', 'Col B'], '\n', ',', null, null, null);
          expect(jsonData1).to.deep.equal(testJsonData['w/oEncloseAndEscapeWithCustomHeader']);
          expect(jsonData2).to.deep.equal(testJsonData['w/oEncloseAndEscapeWithCustomHeader']);
    	 		expect(jsonData3).to.deep.equal(testJsonData['w/oEncloseAndEscapeWithCustomHeader']);
    	 		done();
    	 })
    	 .catch((error) => {
    	 	console.log('error', error);
        done();
    	 }) 
    });

  });
});