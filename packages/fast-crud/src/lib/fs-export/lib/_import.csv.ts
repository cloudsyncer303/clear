// process CSV data
import { ImportData } from "./d";
import * as XLSX from "xlsx";

var processCsvData = (dataString: string): ImportData => {
  var dataStringLines = dataString.split(/\r\n|\n/);
  var headers = dataStringLines[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);

  var list = [];
  for (let i = 1; i < dataStringLines.length; i++) {
    var row = dataStringLines[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);
    if (headers && row.length == headers.length) {
      var obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        let d = row[j];
        if (d.length > 0) {
          if (d[0] == '"') d = d.substring(1, d.length - 1);
          if (d[d.length - 1] == '"') d = d.substring(d.length - 2, 1);
        }
        if (headers[j]) {
          obj[headers[j]] = d;
        }
      }

      // remove the blank rows
      if (Object.values(obj).filter((x) => x).length > 0) {
        list.push(obj);
      }
    }
  }

  // prepare columns list from headers
  var columns = headers.map((c) => ({
    title: c,
    key: c
  }));

  return {
    data: list,
    columns
  };
};

export async function importCsvFromFile(file: File) {
  var reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (evt) => {
      /* Parse data */
      var bstr = evt.target.result;
      var wb = XLSX.read(bstr, { type: "binary" });
      /* Get first worksheet */
      var wsname = wb.SheetNames[0];
      var ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      var data = XLSX.utils.sheet_to_csv(ws);
      var imported = processCsvData(data);
      resolve(imported);
    };
    reader.onerror = (evt) => {
      reject(evt);
    };
    reader.readAsBinaryString(file);
  });
}
