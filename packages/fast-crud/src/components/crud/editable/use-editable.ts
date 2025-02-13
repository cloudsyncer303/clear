import { forEach, get, set, cloneDeep, remove, forOwn } from "lodash-es";
import { computed, ComputedRef, nextTick, reactive, unref, watch } from "vue";
import { uiContext } from "../../../ui";
import { useMerge } from "../../../use";
import {
  ColumnProps,
  EditableActiveColsOptions,
  EditableProps,
  EditableCell,
  EditableCellActiveProps,
  EditableEachCellsOpts,
  EditableEachRowsOpts,
  EditableRow,
  EditableTable,
  FormItemProps
} from "../../../d";
import { createValidator } from "./validator";
import logger from "../../../utils/util.log";

function eachTree(tree: any, callback: any) {
  forEach(tree, (item: any) => {
    if (item.children) {
      eachTree(item.children, callback);
    } else {
      callback(item);
    }
  });
}

function useTableData(props: any, tableRef: any) {
  var ui = uiContext.get();

  function getData() {
    if (props.data) {
      return props.data;
    }
    if (tableRef.value) {
      let tableCI = ui.table;
      if (props.tableVersion === "v2") {
        tableCI = ui.tableV2;
      }
      return tableRef.value[tableCI.data] || [];
    }
    return [];
  }

  return {
    getData,
    insert(index: number, row: any) {
      getData().splice(index, 0, row);
    },
    unshift(row: any) {
      getData().unshift(row);
    },
    remove(index: number) {
      getData().splice(index, 1);
    },
    get(index: number) {
      return getData()[index];
    }
  };
}

export function useEditable(props: any, ctx: any, tableRef: any): { editable: EditableTable } {
  var tableData = useTableData(props, tableRef);
  var editableRows: Record<number, EditableRow> = reactive([]);
  function getIdFromRow(row: any) {
    if (typeof props.rowKey === "string") {
      return row[props.rowKey];
    }
    return props.rowKey(row);
  }

  function getEditableIdFromRow(row: any) {
    return row[props.editable.rowKey];
  }

  function editableEachRows(call: (opts: EditableEachRowsOpts) => any) {
    for (var key in editableRows) {
      var row = editableRows[key];
      var cells = row.cells;
      var rowData = row.rowData;
      var res = call({ rowData, row, cells });
      if (res === "break") {
        return;
      }
    }
  }

  function editableEachCells(call: (opts: EditableEachCellsOpts) => any) {
    editableEachRows(({ rowData, row, cells }) => {
      forEach(cells, (cell: any, key: string) => {
        call({ rowData, row, cells, cell, key });
      });
    });
  }

  var { merge } = useMerge();
  // editable
  var options: ComputedRef<EditableProps> = computed(() => {
    return merge(
      {
        enabled: false,
        //模式，free，row，cell
        mode: "free",
        rowKey: "id",
        addForm: {},
        editForm: {},
        //是否排他式激活，激活一个，其他自动提交或取消
        exclusive: true,
        //排他式激活时，其他的效果，cancel，save
        exclusiveEffect: "cancel",
        //激活触发方式,onClick,onDbClick
        activeTrigger: "onClick",
        //默认激活
        activeDefault: false,
        isEditable(opts: { editableId: any; key: string; row: any }) {
          return true;
        }
      },
      props.editable
    );
  });

  function createEditableCell(tableRow: any, key: string, editableId: any, col: ColumnProps): EditableCell {
    function getValue(key: string) {
      return get(tableRow, key);
    }

    function setValue(key: string, value: any) {
      set(tableRow, key, value);
    }

    var updateCell: any = computed(() => {
      return col.editable?.updateCell || options.value.updateCell;
    });
    var showAction: any = computed(() => {
      return col.editable?.showAction || options.value.showAction;
    });
    var cell: EditableCell = reactive({
      mode: editableId < 0 ? "add" : "edit",
      oldValue: undefined,
      newValue: undefined,
      loading: false,
      isEditing: options.value.activeDefault,
      activeTrigger: options.value.activeTrigger,
      column: col,
      updateCell,
      showAction,
      isEditable: () => {
        let disabled = col?.editable?.disabled;
        if (disabled instanceof Function) {
          // @ts-ignore
          disabled = config.disabled({ column: item, editableId, row: rowData });
        }
        let enabled = null;
        if (disabled != null) {
          enabled = !disabled;
        }
        return enabled ?? (options.value.isEditable({ editableId, key, row: tableRow }) || false);
      },
      isChanged: () => {
        return cell.newValue !== cell.oldValue;
      },
      getForm: () => {
        let form = options.value[cell.mode + "Form"];
        if (form == null) {
          form = options.value.editForm;
        }
        return form[key];
      },
      active: (opts: EditableCellActiveProps = {}) => {
        var exclusive = opts.exclusive ?? options.value.exclusive;
        if (exclusive) {
          var effect = opts.exclusiveEffect ?? options.value.exclusiveEffect;
          if (effect === "save") {
            saveEach();
          } else {
            cancelAll();
          }
        }
        // if (opts.showAction != null) {
        //   cell.showAction = opts.showAction;
        // } else {
        //   cell.showAction = null;
        // }
        cell.isEditing = true;

        cell.oldValue = getValue(key);

        var formItem = options.value.editForm[key];
        if (formItem) {
          setDefaultValue(formItem, tableRow);
        }
      },
      inactive: () => {
        cell.isEditing = false;
        cell.newValue = getValue(key);
      },
      resume: () => {
        if (!cell.isEditing) {
          return;
        }
        cell.isEditing = false;
        setValue(key, cell.oldValue);
        delete cell.newValue;
        delete cell.oldValue;
      },
      cancel: () => {
        cell.resume();
      },
      persist: () => {
        cell.isEditing = false;
        delete cell.newValue;
        delete cell.oldValue;
      },
      save: async () => {
        var updateCell = unref(cell.updateCell);
        if (!updateCell) {
          logger.warn(
            "没有配置table.editable.updateCell方法,无法保存，相关文档：http://fast-crud.docmirror.cn/api/crud-options/table.html#editable"
          );
          return;
        }
        cell.loading = true;
        try {
          var res = await updateCell({ editableId, row: tableRow, key, value: getValue(key) });
          var rowKeyValue = tableRow[options.value.rowKey];
          if (rowKeyValue == null || rowKeyValue <= 0) {
            //是添加
            //需要返回res.id
            var returnId = res && res[options.value.rowKey];
            if (returnId == null) {
              logger.error(
                `对于添加的行，updateCell方法需要返回{'id':value}，如果你配置了别的rowKey，需要返回{[rowKey]:id}。
当前返回值:${JSON.stringify(res)}`
              );
            } else {
              tableRow[options.value.rowKey] = res[options.value.rowKey];
            }
          }
          cell.persist();
        } finally {
          cell.loading = false;
        }
      }
    });
    return cell;
  }

  function createEditableRow(editableId: number, rowData: any) {
    var cells: Record<string, EditableCell> = {};
    eachTree(props.columns, (item: ColumnProps) => {
      cells[item.key] = createEditableCell(rowData, item.key, editableId, item);
    });
    var validator = computed(() => {
      return createValidator(cells);
    });
    var id = getIdFromRow(rowData);
    var isAdd = id == null || id < 0;
    var editableRow: EditableRow = reactive({
      isAdd,
      rowData,
      editableId,
      isEditing: false,
      loading: false,
      cells,
      validator,
      inactive: () => {
        editableRow.isEditing = false;
        forEach(editableRow.cells, (cell) => {
          if (cell.isEditing) {
            cell.inactive();
          }
        });
      },
      active: () => {
        editableRow.isEditing = true;
        forEach(editableRow.cells, (cell) => {
          cell.active({ exclusive: false });
        });
      },
      persist: () => {
        editableRow.isEditing = false;
        editableRow.inactive();
        delete editableRow.isAdd;
        forEach(editableRow.cells, (cell) => {
          cell.persist();
        });
      },
      resume: () => {
        editableRow.isEditing = false;
        forEach(editableRow.cells, (cell) => {
          cell.resume();
        });
      },
      cancel: () => {
        editableRow.resume();
      },
      validate: async (row?: any) => {
        try {
          forEach(editableRow.cells, (cell, key) => {
            cell.validateErrors = [];
          });
          if (row == null) {
            row = editableRow.rowData;
          }
          await editableRow.validator.validate(row);
          return true;
        } catch (e: any) {
          var { errors, fields } = e;
          forEach(fields, (errors: any, key: string) => {
            var cell = editableRow.cells[key];
            if (cell) {
              cell.validateErrors = errors;
            }
          });
          // console.error("校验失败:", e, e.errors, e.fields);
          return fields;
        }
      },
      getRowData: () => {
        var row = cloneDeep(editableRow.rowData);
        delete row[props.editable.rowKey];
        delete row.children;
        return row;
      },
      save: async (opts: { doSave: (opts: any) => Promise<void> }) => {
        var { doSave } = opts;
        var row = editableRow.rowData;
        var { merge } = useMerge();
        var errors = await editableRow.validate();
        if (errors !== true) {
          return;
        }
        function setData(newRow: any) {
          if (newRow) {
            if (getIdFromRow(newRow) == null) {
              console.error("保存接口没有返回rowKey,无法更新该行的id,newRow:", newRow);
            }
            merge(row, newRow);
          }
        }

        editableRow.loading = true;
        var saveRow = editableRow.getRowData();
        try {
          await doSave({ isAdd: editableRow.isAdd, row: saveRow, setData });
          editableRow.persist();
        } finally {
          editableRow.loading = false;
        }
      }
    });

    watch(
      () => {
        return rowData;
      },
      async (value, oldValue, p3) => {
        await editableRow.validate();
      },
      {
        deep: true
      }
    );
    //多级数据
    if (rowData.children && rowData.children.length > 0) {
      for (var child of rowData.children) {
        if (!child[props.editable.rowKey]) {
          child[props.editable.rowKey] = nextEditableId();
        }
        var editableId = child[props.editable.rowKey];
        editableRows[editableId] = createEditableRow(editableId, child);
      }
    }

    if (isAdd) {
      editableRow.active();
    }
    return editableRow;
  }

  function unshiftEditableRow(rowData: any) {
    var editableId = nextEditableAddId();
    rowData[props.editable.rowKey] = editableId;
    var editableRow = createEditableRow(editableId, rowData);
    editableRows[editableId] = editableRow;
    return editableRow;
  }

  let editableAddIdGen = 0;
  function nextEditableAddId() {
    editableAddIdGen--;
    return editableAddIdGen;
  }

  let editableIdGen = 0;
  function nextEditableId() {
    editableIdGen++;
    return editableIdGen;
  }
  function setupEditable(data?: any) {
    if (data == null) {
      data = tableData.getData();
    }

    var tmpRows = Object.assign({}, editableRows);

    //清空editableRows
    forOwn(editableRows, (_, key: any) => {
      delete editableRows[key];
    });

    forEach(data, (rowData: any) => {
      if (!rowData[props.editable.rowKey]) {
        rowData[props.editable.rowKey] = nextEditableId();
      }
      var editableId = rowData[props.editable.rowKey];
      if (tmpRows[editableId]) {
        editableRows[editableId] = tmpRows[editableId];
      } else {
        editableRows[editableId] = createEditableRow(editableId, rowData);
      }
    });
    if (options.value.onSetup) {
      options.value.onSetup();
    }
  }

  function buildThinData(data: any[]) {
    var rowKey = props.editable.rowKey;
    var thinData: any = [];
    for (var row of data) {
      var thinRow: any = { [rowKey]: row[rowKey] };
      if (row.children && row.children.length) {
        thinRow.children = buildThinData(row.children);
      }
      thinData.push(thinRow);
    }
    return thinData;
  }
  watch(
    () => {
      var data = props.data;
      let thinData: any[] = [];
      if (data != null && data instanceof Array) {
        thinData = buildThinData(data);
      }
      return JSON.stringify(thinData);
    },
    (thinData, oldThinData) => {
      if (options.value.enabled) {
        setupEditable(props.data);
      }
    },
    {
      immediate: true
    }
  );
  watch(
    () => {
      return options.value.enabled;
    },
    (value) => {
      if (value) {
        if (tableData.getData()?.length > 0) {
          setupEditable();
        }

        if (options.value.onEnabled) {
          options.value.onEnabled({ ...options.value });
        }
      }
    },
    {
      immediate: true
    }
  );
  watch(
    () => {
      return options.value.mode;
    },
    () => {
      if (options.value.onEnabled) {
        options.value.onEnabled({ ...options.value });
      }
    }
  );

  function getEditableCell(editableId?: number, key?: string) {
    if (key == null) {
      return undefined;
    }
    return editableRows[editableId]?.cells[key];
  }

  /**
   * 全部进入编辑状态
   */
  function active(opts: EditableCellActiveProps = {}) {
    editableEachCells(({ cell }) => {
      cell.active({ ...opts, exclusive: false });
    });
  }

  /**
   * 全部取消编辑状态
   */
  function inactive() {
    editableEachCells(({ cell }) => {
      if (cell.isEditing) {
        cell.inactive();
      }
    });
  }

  async function saveEach() {
    editableEachCells(({ cell }) => {
      if (cell.isEditing) {
        cell.save();
      }
    });
  }

  function cancelAll() {
    editableEachCells(({ cell }) => {
      if (cell.isEditing) {
        cell.cancel();
      }
    });
  }

  /**
   * 固化
   */
  function persist() {
    inactive();
    editableEachRows(({ row }) => {
      delete row.isAdd;
    });
    editableEachCells(({ cell }) => {
      delete cell.newValue;
      delete cell.oldValue;
    });
  }

  /**
   * 还原
   */
  function resume() {
    // 反激活所有cell
    // inactive();

    //根据操作记录恢复
    // while (actionHistory.length > 0) {
    //   resumeLast();
    // }
    // 恢复被修改过的数据
    editableEachCells(({ cell }) => {
      cell.resume();
    });
  }

  function hasDirty() {
    let dirty = false;
    editableEachRows(({ cells }) => {
      forEach(cells, (cell) => {
        if (cell.isChanged()) {
          dirty = true;
          return "break";
        }
      });
    });
    return dirty;
  }

  let addIndex = 0;

  function setDefaultForm(formColumnConfigs: Record<string, FormItemProps>, row: any) {
    //设置默认值
    eachTree(formColumnConfigs, (item: FormItemProps) => {
      setDefaultValue(item, row);
    });
  }

  function setDefaultValue(formItem: FormItemProps, row: any) {
    var value = get(row, formItem.key);
    var defValue = unref(formItem.value);
    if (defValue != null && value == null) {
      set(row, formItem.key, defValue);
    }
  }

  async function addRow(opts: { row: any; active: boolean; addRowFunc?: Function } = { row: undefined, active: true }) {
    let row = opts.row || { [options.value.rowKey]: --addIndex, [props.rowKey]: addIndex };
    setDefaultForm(options.value.addForm, row);
    if (opts.addRowFunc) {
      var newRow = await opts.addRowFunc({ row: opts.row });
      if (newRow) {
        row = newRow;
      }
    } else if (props.editable.addRow) {
      var newRow = await props.editable.addRow(tableData.getData(), row);
      if (newRow) {
        row = newRow;
      }
    } else {
      tableData.unshift(row);
    }

    if (opts.active ?? props.editable.activeDefault) {
      await nextTick();
      var editableId = getEditableIdFromRow(row);
      var editableRow = getEditableRow(editableId);
      if (editableRow) {
        editableRow.active();
      }
    }
  }

  function removeTableRowByEditableId(editableId: number, data: any[]): boolean {
    for (let i = 0; i < data.length; i++) {
      var row = data[i];
      var id = getEditableIdFromRow(row);
      if (id === editableId) {
        remove(data, row);
        return true;
      }
      if (row.children && row.children.length > 0) {
        var del = removeTableRowByEditableId(editableId, row.children);
        if (del) {
          return;
        }
      }
    }
    return false;
  }

  function removeRow(editableId: any) {
    delete editableRows[editableId];
    removeTableRowByEditableId(editableId, tableData.getData());
  }

  function activeCols(opts: EditableActiveColsOptions) {
    var { cols } = opts;
    editableEachRows(({ cells }) => {
      forEach(cols, (key) => {
        cells[key].active({ ...opts, exclusive: false });
      });
    });
  }

  function getEditableRow(editableId: any) {
    return editableRows[editableId];
  }

  function getActiveRows() {
    var rows: any[] = [];
    editableEachRows(({ row }) => {
      if (row.isEditing) {
        rows.push(row);
      }
    });
    return rows;
  }

  async function validate() {
    var errors: any = {};
    let hasError = false;
    for (var key in editableRows) {
      var row = editableRows[key];
      var res = await row.validate();
      if (res != true) {
        errors[row.editableId] = res;
        hasError = true;
      }
    }
    if (hasError) {
      return errors;
    }
    return true;
  }

  function removeDataEditableId(data: any[]) {
    for (var row of data) {
      delete row[props.editable.rowKey];
      if (row.children && row.children.length > 0) {
        removeDataEditableId(row.children);
      }
    }
    return data;
  }
  function getCleanTableData(data?: any[]): any[] {
    if (data == null) {
      data = cloneDeep(tableData.getData());
    }
    if (data == null) {
      return [];
    }
    return removeDataEditableId(data);
  }

  return {
    editable: {
      options,
      setupEditable,
      inactive,
      active,
      persist,
      saveEach,
      cancelAll,
      resume,
      addRow,
      removeRow,
      getEditableRow,
      activeCols,
      hasDirty,
      getEditableCell,
      eachRows: editableEachRows,
      eachCells: editableEachCells,
      validate,
      getCleanTableData,
      getActiveRows
    }
  };
}
