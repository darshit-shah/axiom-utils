module.exports = {
  "withEncloseAndEscapeCSVTest": [
    { "Col1": 'a,x', "Col2": 'abcd"f' },
    { "Col1": 'ay', "Col2": 'abcdf\ng' },
    { "Col1": '"a"bcd"ef"', "Col2": 'bcsf' },
    { "Col1": 'abc","', "Col2": 'xyz' },
    { "Col1": 'abc', "Col2": '' }
  ],
  "errorCSVTest": [
    { "Col1": 'a,x', "Col2": 'abcd"f' },
    { "Col1": 'ay', "Col2": 'abcdf\ng' },
    { "Col1": '"a"bcd"ef"', "Col2": 'bcsf' },
    { "Col1": 'abc","', "Col2": 'xyz' },
    { "Col1": 'abc', "Col2": '', 'undefined': 'abc' }
  ],
  "w/oEncloseAndEscape": [
    { "Col1": 'ax', "Col2": 'abcdf' },
    { "Col1": 'abcdef', "Col2": 'bcsf' }
  ],
  "w/oEncloseAndEscapeWithCustomHeader": [
    { "Col A": 'ax', "Col B": 'abcdf' },
    { "Col A": 'abcdef', "Col B": 'bcsf' }
  ]
}