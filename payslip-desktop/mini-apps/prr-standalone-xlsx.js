/* Standalone PRR XLSX export: generate a valid workbook without the damaged legacy template. */
'use strict';
(function(){
  function x(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
  function col(i){var n=i+1,s='';while(n){s=String.fromCharCode(65+(n-1)%26)+s;n=Math.floor((n-1)/26);}return s;}
  function makeCell(value,row,column,header){
    var ref=col(column)+row;
    if(!header&&column===4&&value!==''&&value!=null&&Number.isFinite(Number(value))){
      return '<c r="'+ref+'" s="2"><v>'+Number(value)+'</v></c>';
    }
    return '<c r="'+ref+'"'+(header?' s="1"':'')+' t="inlineStr"><is><t xml:space="preserve">'+x(value)+'</t></is></c>';
  }
  function createWorksheet(rows){
    var headers=PRR_COLUMNS;
    if(!Array.isArray(headers)||headers.length!==12)throw new Error('Expected 12 PRR export columns.');
    if(!Array.isArray(rows)||!rows.length)throw new Error('No PRR rows are available. Add at least one employee.');
    var lines=[headers].concat(rows);
    var sheetRows=lines.map(function(values,index){
      if(!Array.isArray(values)||values.length!==headers.length)throw new Error('PRR row '+index+' does not have 12 columns.');
      var n=index+1;
      return '<row r="'+n+'"'+(index===0?' ht="26" customHeight="1"':'')+'>'+values.map(function(value,ci){return makeCell(value,n,ci,index===0);}).join('')+'</row>';
    }).join('');
    var last=lines.length;
    var widths=[24,22,37,22,18,16,16,16,16,26,22,26];
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<dimension ref="A1:L'+last+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
      '<sheetFormatPr defaultRowHeight="17"/><cols>'+widths.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('')+'</cols>'+
      '<sheetData>'+sheetRows+'</sheetData><autoFilter ref="A1:L'+last+'"/><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/></worksheet>';
  }
  function buildArchive(rows){
    if(typeof JSZip==='undefined')throw new Error('Excel packaging library unavailable.');
    var zip=new JSZip();
    zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
      '<sheets><sheet name="PRR" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'+
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    zip.file('xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>'+
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF163E68"/><bgColor indexed="64"/></patternFill></fill></fills>'+
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
      '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>');
    zip.file('xl/worksheets/sheet1.xml',createWorksheet(rows));
    return zip;
  }
  window.prrStandaloneCreateWorkbook=async function(rows){
    return buildArchive(rows).generateAsync({type:'blob',compression:'DEFLATE'});
  };
  prrDownloadXLSX=async function(){
    var country=state.country,config=prrCountryConfig(country),rows=prrBuildRows(country);
    var zip=buildArchive(rows);
    var output=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
    var filename='PRR_DEMO_'+config.label+' Local Monthly_template.xlsx';
    download(output,filename);
  };
})();
