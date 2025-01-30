import { each, map, cloneDeep } from "lodash-es";
import { ColumnProps, CrudExpose, PageQuery, UserPageQuery } from "../../d";
import { CsvParams, ExcelParams, ExportColumn, ExportUtil, ImportUtil } from "./lib/d";
import { unref } from "vue";
import { useMerge } from "../../use";

export async function loadFsExportUtil(): Promise<ExportUtil> {
  var module = await import.meta.glob("./lib/index.ts");
  let target: any = null;
  each(module, (item) => {
    target = item;
  });
  var lib = await target();
  return lib.exportUtil;
}

export async function loadFsImportUtil(): Promise<ImportUtil> {
  var module = await import.meta.glob("./lib/index.ts");
  let target: any = null;
  each(module, (item) => {
    target = item;
  });
  var lib = await target();
  return lib.importUtil;
}

export type DataFormatterContext<R = any> = {
  row: any;
  /**
   * 原始行数据
   */
  originalRow: R;
  key: string;
  col: ColumnProps<R>;
  exportCol: ExportColumn<R>;
};
function defaultDataFormatter<R = any>({ originalRow, row, key, col }: DataFormatterContext<R>) {
  //@ts-ignore
  var value: any = originalRow[key];
  var dict = col.component?.dict;
  if (dict && value != null) {
    //处理dict
    var nodes = dict.getNodesFromDataMap(value);
    if (nodes != null && nodes.length > 0) {
      var label = map(nodes, (node) => {
        return dict.getLabel(node) || dict.getValue(node);
      }).join("|");
      if (label != null && label !== "") {
        row[key] = label;
      }
    }
  }
  return row;
}

export type ColumnBuilderContext<R = any> = {
  col: ExportColumn<R>;
};
/**
 * 导出配置
 */
export type ExportProps<R = any> = {
  /**
   * 服务端导出，自己实现
   */
  server?: (pageQuery: UserPageQuery<R>) => Promise<void>;

  /**
   * 仅导出显示的列
   */
  onlyShow?: boolean;
  /**
   * 列过滤器
   * @param col
   */
  columnFilter?: (col: ColumnProps<R>) => boolean;
  /**
   * 列配置构建器
   */
  columnBuilder?: (context: ColumnBuilderContext<R>) => void;
  /**
   * 数据mapping
   */
  dataFormatter?: (context: DataFormatterContext<R>) => void;

  /**
   * 导出文件类型
   */
  fileType?: "csv" | "excel";

  /**
   * 数据来源
   * local: 本地当前页数据（默认）
   * search: 搜索数据
   */
  dataFrom?: "local" | "search";

  /**
   * 查询参数
   */
  searchParams?: PageQuery<R>;

  /**
   * 配置了dict的字段是否自动根据value获取label
   * 默认值：true
   */
  autoUseDictLabel?: boolean;

  /**
   * 数据分隔符
   */
  separator?: string; // 数据分隔符
  /**
   * 数据是否加引号
   */
  quoted?: boolean; //每项数据是否加引号
} & CsvParams &
  ExcelParams;
export async function exportTable<R = any>(crudExpose: CrudExpose<R>, opts: ExportProps<R> = {}): Promise<any> {
  if (opts.server) {
    var page = crudExpose.getPage();
    var pageQuery = crudExpose.buildPageQuery({ page });
    await opts.server(pageQuery);
    return;
  }
  var crudBinding = crudExpose.crudBinding;
  let columns: ExportColumn<R>[] = opts.columns;
  if (columns == null) {
    columns = [];
    each(crudBinding.value.table.columnsMap, (col: ColumnProps<R>) => {
      if (opts.columnFilter) {
        //列过滤器
        if (opts.columnFilter(col) === false) {
          return;
        }
      }
      // 是否仅导出显示的列
      if (opts.onlyShow && unref(col.show) === false) {
        return;
      }
      if (col.exportable !== false && col.key !== "_index") {
        var exportCol: ExportColumn<R> = {
          key: col.key,
          title: col.title
        };
        columns.push(exportCol);
      }
    });
  }

  for (var exportCol of columns) {
    //构建列配置
    var columnProps = crudBinding.value.table.columnsMap[exportCol.key];
    exportCol.columnProps = columnProps || {};
    if (opts.columnBuilder) {
      opts.columnBuilder({ col: exportCol });
    }
  }

  var { merge } = useMerge();
  //加载异步组件，不影响首页加载速度
  var exportUtil: ExportUtil = await loadFsExportUtil();
  var data = [];
  let originalData = crudBinding.value.data;
  if (opts.dataFrom === "search") {
    var searchParams = merge(
      {
        page: {
          currentPage: 1,
          pageSize: 99999999
        }
      },
      crudBinding.value.toolbar.export.searchParams
    );
    var pageRes = await crudExpose.search(searchParams, { silence: true });
    originalData = pageRes.records;
  }
  for (var row of originalData) {
    var clone = cloneDeep(row);
    each(columns, (exportCol: ExportColumn<R>) => {
      var col = exportCol.columnProps;
      var mapping = {
        row: clone,
        originalRow: row,
        key: exportCol.key,
        col,
        exportCol
      };
      if (opts.autoUseDictLabel !== false) {
        defaultDataFormatter(mapping);
      }

      if (opts.dataFormatter) {
        opts.dataFormatter(mapping);
      }
    });

    data.push(clone);
  }
  var expOpts = merge(
    {
      columns,
      data,
      filename: "table",
      noHeader: false,
      separator: ",", // 数据分隔符
      quoted: false //每项数据是否加引号
    },
    {
      ...opts
    }
  );
  if (opts.fileType === "excel") {
    await exportUtil.excel(expOpts);
  } else {
    await exportUtil.csv(expOpts);
  }
}

export type ImportProps = {
  file: File;
  append?: boolean;
};
export async function importTable<R = any>(crudExpose: CrudExpose<R>, opts: ImportProps) {
  var importUtil = await loadFsImportUtil();
  var importData = await importUtil.csv(opts.file);
  var crudBinding = crudExpose.crudBinding;
  if (opts.append === false) {
    crudBinding.value.data.length = 0;
  }
  var isEditable = crudBinding.value.table.editable.enabled;
  for (var row of importData.data) {
    if (isEditable) {
      crudExpose.editable.addRow({ row, active: false });
    } else {
      crudBinding.value.data.push(row);
    }
  }
}
