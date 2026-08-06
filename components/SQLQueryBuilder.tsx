import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Database, Plus, Trash2, Copy, Check, RotateCcw, HelpCircle, ArrowRightLeft, Settings, Filter, List, ArrowDownAz, Server, Sparkles, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Kbd } from "./ui/Kbd";
import { toast } from "sonner";

// DoS Mitigation Limits
const MAX_TABLES = 8;
const MAX_COLUMNS_PER_TABLE = 10;
const MAX_JOINS = 5;
const MAX_WHERE = 10;
const MAX_ORDER_BY = 5;

interface Column {
  id: string;
  name: string;
  type: "INT" | "VARCHAR" | "DECIMAL" | "BOOLEAN" | "TIMESTAMP" | "TEXT";
}

interface Table {
  id: string;
  name: string;
  columns: Column[];
}

interface SelectField {
  tableId: string;
  tableName: string;
  columnId: string;
  columnName: string;
  alias: string;
  aggregate: "NONE" | "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
}

interface JoinClause {
  id: string;
  leftTable: string; // tableName
  joinType: "INNER JOIN" | "LEFT JOIN" | "RIGHT JOIN" | "FULL JOIN";
  rightTable: string; // tableName
  leftColumn: string; // columnName
  rightColumn: string; // columnName
}

interface WhereClause {
  id: string;
  field: string; // "tableName.columnName"
  operator: "=" | "!=" | "<" | ">" | "<=" | ">=" | "LIKE" | "IN" | "IS NULL" | "IS NOT NULL";
  value: string;
  link: "AND" | "OR";
}

interface OrderByClause {
  id: string;
  field: string; // "tableName.columnName"
  direction: "ASC" | "DESC";
}

// Preset Templates
const PRESETS: Record<string, Table[]> = {
  ecommerce: [
    {
      id: "t-users",
      name: "users",
      columns: [
        { id: "c-u1", name: "id", type: "INT" },
        { id: "c-u2", name: "name", type: "VARCHAR" },
        { id: "c-u3", name: "email", type: "VARCHAR" },
        { id: "c-u4", name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      id: "t-orders",
      name: "orders",
      columns: [
        { id: "c-o1", name: "id", type: "INT" },
        { id: "c-o2", name: "user_id", type: "INT" },
        { id: "c-o3", name: "total", type: "DECIMAL" },
        { id: "c-o4", name: "status", type: "VARCHAR" },
        { id: "c-o5", name: "created_at", type: "TIMESTAMP" },
      ],
    },
    {
      id: "t-products",
      name: "products",
      columns: [
        { id: "c-p1", name: "id", type: "INT" },
        { id: "c-p2", name: "title", type: "VARCHAR" },
        { id: "c-p3", name: "price", type: "DECIMAL" },
        { id: "c-p4", name: "stock", type: "INT" },
      ],
    },
    {
      id: "t-order-items",
      name: "order_items",
      columns: [
        { id: "c-oi1", name: "id", type: "INT" },
        { id: "c-oi2", name: "order_id", type: "INT" },
        { id: "c-oi3", name: "product_id", type: "INT" },
        { id: "c-oi4", name: "quantity", type: "INT" },
      ],
    },
  ],
  blog: [
    {
      id: "t-authors",
      name: "authors",
      columns: [
        { id: "c-a1", name: "id", type: "INT" },
        { id: "c-a2", name: "name", type: "VARCHAR" },
        { id: "c-a3", name: "bio", type: "TEXT" },
      ],
    },
    {
      id: "t-posts",
      name: "posts",
      columns: [
        { id: "c-po1", name: "id", type: "INT" },
        { id: "c-po2", name: "author_id", type: "INT" },
        { id: "c-po3", name: "title", type: "VARCHAR" },
        { id: "c-po4", name: "content", type: "TEXT" },
        { id: "c-po5", name: "status", type: "VARCHAR" },
      ],
    },
    {
      id: "t-comments",
      name: "comments",
      columns: [
        { id: "c-co1", name: "id", type: "INT" },
        { id: "c-co2", name: "post_id", type: "INT" },
        { id: "c-co3", name: "author_name", type: "VARCHAR" },
        { id: "c-co4", name: "body", type: "TEXT" },
      ],
    },
  ],
  saas: [
    {
      id: "t-tenants",
      name: "tenants",
      columns: [
        { id: "c-te1", name: "id", type: "INT" },
        { id: "c-te2", name: "name", type: "VARCHAR" },
        { id: "c-te3", name: "subdomain", type: "VARCHAR" },
      ],
    },
    {
      id: "t-susers",
      name: "users",
      columns: [
        { id: "c-su1", name: "id", type: "INT" },
        { id: "c-su2", name: "tenant_id", type: "INT" },
        { id: "c-su3", name: "name", type: "VARCHAR" },
        { id: "c-su4", name: "role", type: "VARCHAR" },
      ],
    },
    {
      id: "t-subscriptions",
      name: "subscriptions",
      columns: [
        { id: "c-sub1", name: "id", type: "INT" },
        { id: "c-sub2", name: "tenant_id", type: "INT" },
        { id: "c-sub3", name: "plan_name", type: "VARCHAR" },
        { id: "c-sub4", name: "active", type: "BOOLEAN" },
      ],
    },
  ],
};

export function SQLQueryBuilder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  // Dialect & State
  const [dialect, setDialect] = useState<"postgres" | "mysql" | "sqlite" | "mssql">(initialData?.dialect || "postgres");
  const [preset, setPreset] = useState<string>(initialData?.preset || "ecommerce");

  // Custom Tables State
  const [tables, setTables] = useState<Table[]>(() => {
    if (initialData?.tables) return initialData.tables;
    return PRESETS.ecommerce;
  });

  // Selected SELECT fields
  const [selectedFields, setSelectedFields] = useState<SelectField[]>(initialData?.selectedFields || [
    { tableId: "t-orders", tableName: "orders", columnId: "c-o1", columnName: "id", alias: "order_id", aggregate: "NONE" },
    { tableId: "t-users", tableName: "users", columnId: "c-u2", columnName: "name", alias: "customer_name", aggregate: "NONE" },
    { tableId: "t-orders", tableName: "orders", columnId: "c-o3", columnName: "total", alias: "", aggregate: "NONE" }
  ]);

  // Joins
  const [joins, setJoins] = useState<JoinClause[]>(initialData?.joins || [
    { id: "j1", leftTable: "orders", joinType: "INNER JOIN", rightTable: "users", leftColumn: "user_id", rightColumn: "id" }
  ]);

  // WHERE constraints
  const [wheres, setWheres] = useState<WhereClause[]>(initialData?.wheres || [
    { id: "w1", field: "orders.status", operator: "=", value: "completed", link: "AND" }
  ]);

  // GROUP BY fields
  const [groupByFields, setGroupByFields] = useState<string[]>(initialData?.groupByFields || []);

  // ORDER BY fields
  const [orderBys, setOrderBys] = useState<OrderByClause[]>(initialData?.orderBys || [
    { id: "ob1", field: "orders.total", direction: "DESC" }
  ]);

  // LIMIT & OFFSET
  const [limit, setLimit] = useState<string>(initialData?.limit || "50");
  const [offset, setOffset] = useState<string>(initialData?.offset || "");

  const [copied, setCopied] = useState(false);

  // Form input states for adding a Table
  const [newTableName, setNewTableName] = useState("");
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<"INT" | "VARCHAR" | "DECIMAL" | "BOOLEAN" | "TIMESTAMP" | "TEXT">("VARCHAR");
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // Sync state changes with the URL sharing system
  useEffect(() => {
    onStateChange?.({
      dialect,
      preset,
      tables,
      selectedFields,
      joins,
      wheres,
      groupByFields,
      orderBys,
      limit,
      offset,
    });
  }, [dialect, preset, tables, selectedFields, joins, wheres, groupByFields, orderBys, limit, offset, onStateChange]);

  // Format Identifier based on SQL dialect
  const formatIdentifier = useCallback((name: string) => {
    if (!name) return "";
    switch (dialect) {
      case "mysql":
        return `\`${name}\``;
      case "mssql":
        return `[${name}]`;
      case "postgres":
      case "sqlite":
      default:
        return `"${name}"`;
    }
  }, [dialect]);

  // Format String literal safely (prevent SQL injection escapes basic quotes)
  const formatLiteral = useCallback((val: string, operator: string) => {
    if (operator === "IS NULL" || operator === "IS NOT NULL") return "";
    if (operator === "IN") {
      const parts = val.split(",").map(p => {
        const trimmed = p.trim();
        if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed;
        return `'${trimmed.replace(/'/g, "''")}'`;
      });
      return `(${parts.join(", ")})`;
    }

    // Check if numeric
    if (/^\d+(\.\d+)?$/.test(val)) return val;

    const escaped = val.replace(/'/g, "''");
    if (operator === "LIKE") {
      return `'%${escaped}%'`;
    }
    return `'${escaped}'`;
  }, []);

  // Compute final generated SQL Query
  const generatedSQL = useMemo(() => {
    const lines: string[] = [];

    // 1. SELECT clause
    if (selectedFields.length === 0) {
      lines.push("SELECT *");
    } else {
      const fieldStrings = selectedFields.map(f => {
        const tableCol = `${formatIdentifier(f.tableName)}.${formatIdentifier(f.columnName)}`;
        let base = tableCol;
        if (f.aggregate !== "NONE") {
          base = `${f.aggregate}(${tableCol})`;
        }
        if (f.alias && f.alias.trim() !== "") {
          base = `${base} AS ${formatIdentifier(f.alias.trim())}`;
        }
        return base;
      });
      lines.push(`SELECT\n  ${fieldStrings.join(",\n  ")}`);
    }

    // 2. FROM clause
    // Determine the base table. Try to find a table that is not a right table in joins, or fallback to the first table
    const rightTablesInJoins = new Set(joins.map(j => j.rightTable));
    const leftTablesInJoins = joins.map(j => j.leftTable);
    const allTableNamesInSelected = new Set(selectedFields.map(f => f.tableName));

    let baseTable = "";
    if (tables.length > 0) {
      // Find a table name that is used in selected fields but not as a right table in joins
      const candidate = tables.find(t => !rightTablesInJoins.has(t.name) && (allTableNamesInSelected.has(t.name) || leftTablesInJoins.includes(t.name)));
      baseTable = candidate ? candidate.name : tables[0].name;
    }

    if (baseTable) {
      lines.push(`FROM ${formatIdentifier(baseTable)}`);
    } else {
      lines.push("FROM [No Tables defined]");
    }

    // 3. JOINS
    joins.forEach(j => {
      if (j.leftTable && j.rightTable && j.leftColumn && j.rightColumn) {
        lines.push(`${j.joinType} ${formatIdentifier(j.rightTable)} ON ${formatIdentifier(j.leftTable)}.${formatIdentifier(j.leftColumn)} = ${formatIdentifier(j.rightTable)}.${formatIdentifier(j.rightColumn)}`);
      }
    });

    // 4. WHERE clause
    if (wheres.length > 0) {
      const whereParts: string[] = [];
      wheres.forEach((w, index) => {
        const [tbl, col] = w.field.split(".");
        if (!tbl || !col) return;
        const formattedField = `${formatIdentifier(tbl)}.${formatIdentifier(col)}`;

        let condition = "";
        if (w.operator === "IS NULL" || w.operator === "IS NOT NULL") {
          condition = `${formattedField} ${w.operator}`;
        } else {
          condition = `${formattedField} ${w.operator} ${formatLiteral(w.value, w.operator)}`;
        }

        const suffix = index < wheres.length - 1 ? ` ${w.link}` : "";
        whereParts.push(`${condition}${suffix}`);
      });
      if (whereParts.length > 0) {
        lines.push(`WHERE ${whereParts.join("\n  ")}`);
      }
    }

    // 5. GROUP BY
    if (groupByFields.length > 0) {
      const groups = groupByFields.map(g => {
        const [tbl, col] = g.split(".");
        return `${formatIdentifier(tbl)}.${formatIdentifier(col)}`;
      });
      lines.push(`GROUP BY ${groups.join(", ")}`);
    }

    // 6. ORDER BY
    if (orderBys.length > 0) {
      const sorts = orderBys.map(ob => {
        const [tbl, col] = ob.field.split(".");
        if (!tbl || !col) return "";
        return `${formatIdentifier(tbl)}.${formatIdentifier(col)} ${ob.direction}`;
      }).filter(Boolean);
      if (sorts.length > 0) {
        lines.push(`ORDER BY ${sorts.join(", ")}`);
      }
    }

    // 7. LIMIT & OFFSET (Dialect specific)
    const limNum = parseInt(limit, 10);
    const offNum = parseInt(offset, 10);

    if (dialect === "mssql") {
      // MS SQL Server uses TOP / OFFSET FETCH
      if (!isNaN(offNum) && offNum >= 0) {
        lines.push(`OFFSET ${offNum} ROWS`);
        if (!isNaN(limNum) && limNum > 0) {
          lines.push(`FETCH NEXT ${limNum} ROWS ONLY`);
        }
      } else if (!isNaN(limNum) && limNum > 0) {
        // Since SELECT TOP is prefixed, we prepend to SELECT if no offset.
        // For simplicity in output string insertion, let's append a standard comment or suffix,
        // or we can modify the SELECT generation above. Let's modify SELECT output line if dialect is mssql & no offset:
        if (lines[0].startsWith("SELECT")) {
          lines[0] = lines[0].replace("SELECT", `SELECT TOP ${limNum}`);
        }
      }
    } else {
      // PostgreSQL, MySQL, SQLite use standard LIMIT / OFFSET
      if (!isNaN(limNum) && limNum >= 0) {
        lines.push(`LIMIT ${limNum}`);
      }
      if (!isNaN(offNum) && offNum >= 0) {
        lines.push(`OFFSET ${offNum}`);
      }
    }

    return lines.join("\n") + ";";
  }, [dialect, tables, selectedFields, joins, wheres, groupByFields, orderBys, limit, offset, formatIdentifier, formatLiteral]);

  // Load Preset
  const handleLoadPreset = (key: string) => {
    if (!PRESETS[key]) return;
    setPreset(key);
    const newTables = PRESETS[key];
    setTables(newTables);

    // Auto populate default select fields for the preset to provide instant value
    if (key === "ecommerce") {
      setSelectedFields([
        { tableId: "t-orders", tableName: "orders", columnId: "c-o1", columnName: "id", alias: "order_id", aggregate: "NONE" },
        { tableId: "t-users", tableName: "users", columnId: "c-u2", columnName: "name", alias: "customer_name", aggregate: "NONE" },
        { tableId: "t-orders", tableName: "orders", columnId: "c-o3", columnName: "total", alias: "", aggregate: "NONE" }
      ]);
      setJoins([
        { id: "j1", leftTable: "orders", joinType: "INNER JOIN", rightTable: "users", leftColumn: "user_id", rightColumn: "id" }
      ]);
      setWheres([
        { id: "w1", field: "orders.status", operator: "=", value: "completed", link: "AND" }
      ]);
      setOrderBys([
        { id: "ob1", field: "orders.total", direction: "DESC" }
      ]);
      setGroupByFields([]);
    } else if (key === "blog") {
      setSelectedFields([
        { tableId: "t-posts", tableName: "posts", columnId: "c-po3", columnName: "title", alias: "post_title", aggregate: "NONE" },
        { tableId: "t-authors", tableName: "authors", columnId: "c-a2", columnName: "name", alias: "author_name", aggregate: "NONE" }
      ]);
      setJoins([
        { id: "j1", leftTable: "posts", joinType: "INNER JOIN", rightTable: "authors", leftColumn: "author_id", rightColumn: "id" }
      ]);
      setWheres([]);
      setOrderBys([]);
      setGroupByFields([]);
    } else if (key === "saas") {
      setSelectedFields([
        { tableId: "t-tenants", tableName: "tenants", columnId: "c-te2", columnName: "name", alias: "tenant_name", aggregate: "NONE" },
        { tableId: "t-subscriptions", tableName: "subscriptions", columnId: "c-sub3", columnName: "plan_name", alias: "", aggregate: "NONE" }
      ]);
      setJoins([
        { id: "j1", leftTable: "subscriptions", joinType: "INNER JOIN", rightTable: "tenants", leftColumn: "tenant_id", rightColumn: "id" }
      ]);
      setWheres([
        { id: "w1", field: "subscriptions.active", operator: "=", value: "true", link: "AND" }
      ]);
      setOrderBys([]);
      setGroupByFields([]);
    } else {
      setSelectedFields([]);
      setJoins([]);
      setWheres([]);
      setOrderBys([]);
      setGroupByFields([]);
    }
    toast.success(t("sql_query_builder.preset_loaded", { name: key }));
  };

  // Add Custom Table
  const handleAddTable = () => {
    const trimmed = newTableName.trim().replace(/\s+/g, "_");
    if (!trimmed) return;
    if (tables.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(t("sql_query_builder.err_table_exists"));
      return;
    }
    if (tables.length >= MAX_TABLES) {
      toast.error(t("sql_query_builder.err_max_tables", { max: MAX_TABLES }));
      return;
    }

    const newT: Table = {
      id: `custom-t-${Date.now()}`,
      name: trimmed,
      columns: [{ id: `custom-c-${Date.now()}`, name: "id", type: "INT" }],
    };
    setTables([...tables, newT]);
    setNewTableName("");
    toast.success(t("sql_query_builder.table_added", { name: trimmed }));
  };

  // Delete Table
  const handleDeleteTable = (id: string) => {
    const tableToDelete = tables.find(t => t.id === id);
    if (!tableToDelete) return;
    setTables(tables.filter(t => t.id !== id));
    // Clean up associated configurations
    setSelectedFields(selectedFields.filter(f => f.tableId !== id));
    setJoins(joins.filter(j => j.leftTable !== tableToDelete.name && j.rightTable !== tableToDelete.name));
    setWheres(wheres.filter(w => !w.field.startsWith(`${tableToDelete.name}.`)));
    setGroupByFields(groupByFields.filter(g => !g.startsWith(`${tableToDelete.name}.`)));
    setOrderBys(orderBys.filter(o => !o.field.startsWith(`${tableToDelete.name}.`)));
    toast.success(t("sql_query_builder.table_deleted", { name: tableToDelete.name }));
  };

  // Add Column to a Table
  const handleAddColumn = (tableId: string) => {
    const trimmed = newColName.trim().replace(/\s+/g, "_");
    if (!trimmed) return;
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) return;

    if (targetTable.columns.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(t("sql_query_builder.err_column_exists"));
      return;
    }
    if (targetTable.columns.length >= MAX_COLUMNS_PER_TABLE) {
      toast.error(t("sql_query_builder.err_max_columns", { max: MAX_COLUMNS_PER_TABLE }));
      return;
    }

    const updatedTables = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: [...t.columns, { id: `custom-c-${Date.now()}`, name: trimmed, type: newColType }]
        };
      }
      return t;
    });

    setTables(updatedTables);
    setNewColName("");
    toast.success(t("sql_query_builder.column_added", { name: trimmed }));
  };

  // Delete Column from Table
  const handleDeleteColumn = (tableId: string, colId: string) => {
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) return;
    const targetCol = targetTable.columns.find(c => c.id === colId);
    if (!targetCol) return;

    const updatedTables = tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          columns: t.columns.filter(c => c.id !== colId)
        };
      }
      return t;
    });
    setTables(updatedTables);
    // Clean up selected/where fields
    setSelectedFields(selectedFields.filter(f => !(f.tableId === tableId && f.columnId === colId)));
    setWheres(wheres.filter(w => w.field !== `${targetTable.name}.${targetCol.name}`));
    setGroupByFields(groupByFields.filter(g => g !== `${targetTable.name}.${targetCol.name}`));
    setOrderBys(orderBys.filter(o => o.field !== `${targetTable.name}.${targetCol.name}`));
    toast.success(t("sql_query_builder.column_deleted", { name: targetCol.name }));
  };

  // Toggle Selection of a field in SELECT clause
  const handleToggleSelectField = (table: Table, column: Column) => {
    const isSelected = selectedFields.some(f => f.tableId === table.id && f.columnId === column.id);
    if (isSelected) {
      setSelectedFields(selectedFields.filter(f => !(f.tableId === table.id && f.columnId === column.id)));
    } else {
      setSelectedFields([
        ...selectedFields,
        {
          tableId: table.id,
          tableName: table.name,
          columnId: column.id,
          columnName: column.name,
          alias: "",
          aggregate: "NONE"
        }
      ]);
    }
  };

  // Update Select Field Options (alias/aggregate)
  const handleUpdateSelectField = (index: number, key: "alias" | "aggregate", value: string) => {
    setSelectedFields(selectedFields.map((f, i) => {
      if (i === index) {
        return { ...f, [key]: value };
      }
      return f;
    }));
  };

  // Add JOIN clause
  const handleAddJoin = () => {
    if (joins.length >= MAX_JOINS) {
      toast.error(t("sql_query_builder.err_max_joins", { max: MAX_JOINS }));
      return;
    }
    if (tables.length < 2) {
      toast.error(t("sql_query_builder.err_need_tables_for_join"));
      return;
    }
    const newJ: JoinClause = {
      id: `j-${Date.now()}`,
      leftTable: tables[0].name,
      joinType: "INNER JOIN",
      rightTable: tables[1].name,
      leftColumn: "id",
      rightColumn: "id"
    };
    setJoins([...joins, newJ]);
  };

  const handleUpdateJoin = (id: string, key: keyof JoinClause, value: string) => {
    setJoins(joins.map(j => {
      if (j.id === id) {
        return { ...j, [key]: value };
      }
      return j;
    }));
  };

  const handleDeleteJoin = (id: string) => {
    setJoins(joins.filter(j => j.id !== id));
  };

  // Add WHERE constraint
  const handleAddWhere = () => {
    if (wheres.length >= MAX_WHERE) {
      toast.error(t("sql_query_builder.err_max_wheres", { max: MAX_WHERE }));
      return;
    }
    const allFields = tables.flatMap(t => t.columns.map(c => `${t.name}.${c.name}`));
    if (allFields.length === 0) {
      toast.error(t("sql_query_builder.err_no_fields"));
      return;
    }
    const newW: WhereClause = {
      id: `w-${Date.now()}`,
      field: allFields[0],
      operator: "=",
      value: "",
      link: "AND"
    };
    setWheres([...wheres, newW]);
  };

  const handleUpdateWhere = (id: string, key: keyof WhereClause, value: string) => {
    setWheres(wheres.map(w => {
      if (w.id === id) {
        return { ...w, [key]: value };
      }
      return w;
    }));
  };

  const handleDeleteWhere = (id: string) => {
    setWheres(wheres.filter(w => w.id !== id));
  };

  // Toggle GROUP BY column
  const handleToggleGroupBy = (field: string) => {
    if (groupByFields.includes(field)) {
      setGroupByFields(groupByFields.filter(f => f !== field));
    } else {
      setGroupByFields([...groupByFields, field]);
    }
  };

  // Add ORDER BY clause
  const handleAddOrderBy = () => {
    if (orderBys.length >= MAX_ORDER_BY) {
      toast.error(t("sql_query_builder.err_max_order_bys", { max: MAX_ORDER_BY }));
      return;
    }
    const allFields = tables.flatMap(t => t.columns.map(c => `${t.name}.${c.name}`));
    if (allFields.length === 0) {
      toast.error(t("sql_query_builder.err_no_fields"));
      return;
    }
    const newOB: OrderByClause = {
      id: `ob-${Date.now()}`,
      field: allFields[0],
      direction: "ASC"
    };
    setOrderBys([...orderBys, newOB]);
  };

  const handleUpdateOrderBy = (id: string, key: keyof OrderByClause, value: string) => {
    setOrderBys(orderBys.map(ob => {
      if (ob.id === id) {
        return { ...ob, [key]: value };
      }
      return ob;
    }));
  };

  const handleDeleteOrderBy = (id: string) => {
    setOrderBys(orderBys.filter(ob => ob.id !== id));
  };

  // Clear / Reset All
  const handleReset = useCallback(() => {
    setTables(PRESETS.ecommerce);
    setPreset("ecommerce");
    setSelectedFields([
      { tableId: "t-orders", tableName: "orders", columnId: "c-o1", columnName: "id", alias: "order_id", aggregate: "NONE" },
      { tableId: "t-users", tableName: "users", columnId: "c-u2", columnName: "name", alias: "customer_name", aggregate: "NONE" },
      { tableId: "t-orders", tableName: "orders", columnId: "c-o3", columnName: "total", alias: "", aggregate: "NONE" }
    ]);
    setJoins([
      { id: "j1", leftTable: "orders", joinType: "INNER JOIN", rightTable: "users", leftColumn: "user_id", rightColumn: "id" }
    ]);
    setWheres([
      { id: "w1", field: "orders.status", operator: "=", value: "completed", link: "AND" }
    ]);
    setGroupByFields([]);
    setOrderBys([
      { id: "ob1", field: "orders.total", direction: "DESC" }
    ]);
    setLimit("50");
    setOffset("");
    toast.success(t("sql_query_builder.reset_success"));
  }, [t]);

  // Copy SQL Output
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    toast.success(t("sql_query_builder.copied_success"));
    setTimeout(() => setCopied(false), 2000);
  }, [generatedSQL, t]);

  // Keyboard Shortcuts Safeguards via useRef to avoid stale closures
  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Controls: Dialect & Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <label htmlFor="dialect-select" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-indigo-500" /> {t("sql_query_builder.dialect_label") || "SQL Dialect"}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["postgres", "mysql", "sqlite", "mssql"] as const).map(d => (
              <button
                key={d}
                onClick={() => setDialect(d)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  dialect === d
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {d === "postgres" ? "PostgreSQL" : d === "mssql" ? "SQL Server" : d.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="preset-select" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {t("sql_query_builder.preset_label") || "Load Template Preset"}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(PRESETS).map(key => (
              <button
                key={key}
                onClick={() => handleLoadPreset(key)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all capitalize ${
                  preset === key
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {t(`sql_query_builder.preset_${key}`) || key}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Visual Configurator: 7 Columns */}
        <div className="lg:col-span-7 space-y-8">
          {/* Table & Columns Manager */}
          <section className="bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Database className="w-4 h-4 text-indigo-500" />
                {t("sql_query_builder.tables_manager") || "Tables & Schema Manager"}
              </h3>
              <div className="text-xs text-slate-400 font-mono">
                {tables.length}/{MAX_TABLES} {t("sql_query_builder.tables")}
              </div>
            </div>

            {/* Existing Tables List */}
            <div className="flex flex-wrap gap-2">
              {tables.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTableId(activeTableId === t.id ? null : t.id)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    activeTableId === t.id
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{t.name}</span>
                  <span className="opacity-60">({t.columns.length})</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                </button>
              ))}
            </div>

            {/* Active Table detail config */}
            {activeTableId && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    {t("sql_query_builder.config_table") || "Configure Table"}: <span className="text-indigo-500">{tables.find(t => t.id === activeTableId)?.name}</span>
                  </h4>
                  <button
                    onClick={() => handleDeleteTable(activeTableId)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    title={t("sql_query_builder.delete_table") || "Delete Table"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Columns inside active table */}
                <div className="grid grid-cols-2 gap-2">
                  {tables.find(t => t.id === activeTableId)?.columns.map(col => (
                    <div key={col.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl text-xs">
                      <span className="font-mono text-slate-700 dark:text-slate-300">{col.name} <span className="opacity-50 text-[10px]">({col.type})</span></span>
                      {col.name !== "id" && (
                        <button
                          onClick={() => handleDeleteColumn(activeTableId, col.id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new column field */}
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <input
                    type="text"
                    placeholder={t("sql_query_builder.col_name_placeholder") || "Column name"}
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                  <select
                    value={newColType}
                    onChange={(e: any) => setNewColType(e.target.value)}
                    className="py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="INT">INT</option>
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="DECIMAL">DECIMAL</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                    <option value="TEXT">TEXT</option>
                  </select>
                  <button
                    onClick={() => handleAddColumn(activeTableId)}
                    className="py-1.5 px-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t("common.add")}
                  </button>
                </div>
              </div>
            )}

            {/* Create new table form */}
            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <input
                type="text"
                placeholder={t("sql_query_builder.table_name_placeholder") || "Create new table..."}
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="flex-1 py-2 px-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
              <button
                onClick={handleAddTable}
                className="py-2 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t("sql_query_builder.create_table") || "Create Table"}
              </button>
            </div>
          </section>

          {/* SELECT Clause Config */}
          <section className="bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <List className="w-4 h-4 text-indigo-500" />
              {t("sql_query_builder.select_fields") || "Select Fields (SELECT)"}
            </h3>

            {/* Quick checkbox selection for all columns */}
            <div className="space-y-4 max-h-48 overflow-y-auto no-scrollbar border border-slate-100 dark:border-slate-800 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              {tables.map(table => (
                <div key={table.id} className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{table.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {table.columns.map(col => {
                      const isSelected = selectedFields.some(f => f.tableId === table.id && f.columnId === col.id);
                      return (
                        <button
                          key={col.id}
                          onClick={() => handleToggleSelectField(table, col)}
                          className={`py-1 px-2.5 rounded-lg text-xs border transition-all ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400 font-bold"
                              : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {col.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* List of active selects with aggregate & alias config */}
            {selectedFields.length > 0 ? (
              <div className="space-y-3">
                {selectedFields.map((f, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-xs">
                    <div className="md:col-span-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {f.tableName}.{f.columnName}
                    </div>

                    <div className="md:col-span-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400">fn:</span>
                      <select
                        value={f.aggregate}
                        onChange={(e) => handleUpdateSelectField(index, "aggregate", e.target.value)}
                        className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      >
                        <option value="NONE">NONE</option>
                        <option value="COUNT">COUNT</option>
                        <option value="SUM">SUM</option>
                        <option value="AVG">AVG</option>
                        <option value="MIN">MIN</option>
                        <option value="MAX">MAX</option>
                      </select>
                    </div>

                    <div className="md:col-span-4 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400">as:</span>
                      <input
                        type="text"
                        placeholder="alias"
                        value={f.alias}
                        onChange={(e) => handleUpdateSelectField(index, "alias", e.target.value)}
                        className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="md:col-span-1 text-right">
                      <button
                        onClick={() => setSelectedFields(selectedFields.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {t("sql_query_builder.no_fields_selected") || "No fields selected. SELECT * will be generated."}
              </p>
            )}
          </section>

          {/* JOIN Builder */}
          <section className="bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                {t("sql_query_builder.joins") || "Table Relations (JOIN)"}
              </h3>
              <button
                onClick={handleAddJoin}
                className="py-1 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> {t("common.add")}
              </button>
            </div>

            {joins.length > 0 ? (
              <div className="space-y-4">
                {joins.map((j, index) => (
                  <div key={j.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-indigo-500">Join #{index + 1}</span>
                      <button
                        onClick={() => handleDeleteJoin(j.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-xs">
                      {/* Left Table Select */}
                      <div className="md:col-span-3">
                        <select
                          value={j.leftTable}
                          onChange={(e) => handleUpdateJoin(j.id, "leftTable", e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        >
                          {tables.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Join Type Select */}
                      <div className="md:col-span-3">
                        <select
                          value={j.joinType}
                          onChange={(e: any) => handleUpdateJoin(j.id, "joinType", e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400"
                        >
                          <option value="INNER JOIN">INNER JOIN</option>
                          <option value="LEFT JOIN">LEFT JOIN</option>
                          <option value="RIGHT JOIN">RIGHT JOIN</option>
                          <option value="FULL JOIN">FULL JOIN</option>
                        </select>
                      </div>

                      {/* Right Table Select */}
                      <div className="md:col-span-3">
                        <select
                          value={j.rightTable}
                          onChange={(e) => handleUpdateJoin(j.id, "rightTable", e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        >
                          {tables.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Column references ON */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <span className="md:col-span-2 text-[10px] font-black uppercase text-slate-400 text-center">ON</span>

                      {/* Left Column Select */}
                      <div className="md:col-span-4">
                        <select
                          value={j.leftColumn}
                          onChange={(e) => handleUpdateJoin(j.id, "leftColumn", e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                        >
                          {tables.find(t => t.name === j.leftTable)?.columns.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          )) || <option value="id">id</option>}
                        </select>
                      </div>

                      <span className="md:col-span-2 text-center font-bold text-slate-400">=</span>

                      {/* Right Column Select */}
                      <div className="md:col-span-4">
                        <select
                          value={j.rightColumn}
                          onChange={(e) => handleUpdateJoin(j.id, "rightColumn", e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                        >
                          {tables.find(t => t.name === j.rightTable)?.columns.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          )) || <option value="id">id</option>}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {t("sql_query_builder.no_joins") || "No relationships defined."}
              </p>
            )}
          </section>

          {/* WHERE Conditions Builder */}
          <section className="bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Filter className="w-4 h-4 text-indigo-500" />
                {t("sql_query_builder.where_conditions") || "Query Filters (WHERE)"}
              </h3>
              <button
                onClick={handleAddWhere}
                className="py-1 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> {t("common.add")}
              </button>
            </div>

            {wheres.length > 0 ? (
              <div className="space-y-4">
                {wheres.map((w, index) => (
                  <div key={w.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-xs">

                    {/* Column Selection */}
                    <div className="md:col-span-3">
                      <select
                        value={w.field}
                        onChange={(e) => handleUpdateWhere(w.id, "field", e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                      >
                        {tables.flatMap(t => t.columns.map(c => (
                          <option key={`${t.id}-${c.id}`} value={`${t.name}.${c.name}`}>{t.name}.{c.name}</option>
                        )))}
                      </select>
                    </div>

                    {/* Operator Selection */}
                    <div className="md:col-span-2">
                      <select
                        value={w.operator}
                        onChange={(e: any) => handleUpdateWhere(w.id, "operator", e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-center"
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value="<">&lt;</option>
                        <option value=">">&gt;</option>
                        <option value="<=">&lt;=</option>
                        <option value=">=">&gt;=</option>
                        <option value="LIKE">LIKE</option>
                        <option value="IN">IN</option>
                        <option value="IS NULL">IS NULL</option>
                        <option value="IS NOT NULL">IS NOT NULL</option>
                      </select>
                    </div>

                    {/* Value Input (Not for NULL operators) */}
                    <div className="md:col-span-4">
                      {w.operator !== "IS NULL" && w.operator !== "IS NOT NULL" ? (
                        <input
                          type="text"
                          placeholder={w.operator === "IN" ? "1, 2, 3 or val1, val2" : "value"}
                          value={w.value}
                          onChange={(e) => handleUpdateWhere(w.id, "value", e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      ) : (
                        <div className="w-full p-2 text-center text-slate-400 italic">No value needed</div>
                      )}
                    </div>

                    {/* Link logic operator (AND/OR) (Only if not the last item) */}
                    <div className="md:col-span-2">
                      {index < wheres.length - 1 ? (
                        <select
                          value={w.link}
                          onChange={(e: any) => handleUpdateWhere(w.id, "link", e.target.value)}
                          className="w-full p-2 bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400 rounded-xl text-xs font-black text-center"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      ) : (
                        <div className="w-full p-2 text-center text-slate-400 font-bold">-</div>
                      )}
                    </div>

                    <div className="md:col-span-1 text-right">
                      <button
                        onClick={() => handleDeleteWhere(w.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                {t("sql_query_builder.no_wheres") || "No filters specified (Retrieves all rows)."}
              </p>
            )}
          </section>

          {/* Group By & Order By Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GROUP BY */}
            <section className="bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wide border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <Settings className="w-4 h-4 text-indigo-500" />
                {t("sql_query_builder.group_by") || "Aggregation (GROUP BY)"}
              </h3>

              <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {tables.flatMap(t => t.columns.map(c => {
                  const fieldStr = `${t.name}.${c.name}`;
                  const isChecked = groupByFields.includes(fieldStr);
                  return (
                    <label key={`${t.id}-${c.id}`} className="flex items-center gap-2 text-xs cursor-pointer select-none py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleGroupBy(fieldStr)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-mono text-slate-600 dark:text-slate-400">{fieldStr}</span>
                    </label>
                  );
                }))}
              </div>
            </section>

            {/* ORDER BY */}
            <section className="bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wide">
                  <ArrowDownAz className="w-4 h-4 text-indigo-500" />
                  {t("sql_query_builder.order_by") || "Sorting (ORDER BY)"}
                </h3>
                <button
                  onClick={handleAddOrderBy}
                  className="py-0.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" /> {t("common.add")}
                </button>
              </div>

              {orderBys.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {orderBys.map((ob) => (
                    <div key={ob.id} className="flex gap-1.5 items-center text-xs">
                      {/* Column Select */}
                      <select
                        value={ob.field}
                        onChange={(e) => handleUpdateOrderBy(ob.id, "field", e.target.value)}
                        className="flex-1 p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono"
                      >
                        {tables.flatMap(t => t.columns.map(c => (
                          <option key={`ob-${t.id}-${c.id}`} value={`${t.name}.${c.name}`}>{t.name}.{c.name}</option>
                        )))}
                      </select>

                      {/* Direction Select */}
                      <select
                        value={ob.direction}
                        onChange={(e: any) => handleUpdateOrderBy(ob.id, "direction", e.target.value)}
                        className="p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400"
                      >
                        <option value="ASC">ASC</option>
                        <option value="DESC">DESC</option>
                      </select>

                      <button
                        onClick={() => handleDeleteOrderBy(ob.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl">
                  {t("sql_query_builder.no_order_bys") || "Default sorting order."}
                </p>
              )}
            </section>
          </div>

          {/* Limit & Offset */}
          <section className="bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wide border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Settings className="w-4 h-4 text-indigo-500" />
              {t("sql_query_builder.pagination") || "Pagination (LIMIT & OFFSET)"}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="limit-input" className="font-bold text-slate-500">LIMIT</label>
                <input
                  id="limit-input"
                  type="number"
                  min="0"
                  max="1000"
                  placeholder="e.g. 50"
                  value={limit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (parseInt(val, 10) >= 0 && parseInt(val, 10) <= 1000)) {
                      setLimit(val);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="offset-input" className="font-bold text-slate-500">OFFSET</label>
                <input
                  id="offset-input"
                  type="number"
                  min="0"
                  max="100000"
                  placeholder="e.g. 0"
                  value={offset}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (parseInt(val, 10) >= 0 && parseInt(val, 10) <= 100000)) {
                      setOffset(val);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl font-mono"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Generated SQL Output: 5 Columns */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
              {t("sql_query_builder.output_label") || "Compiled SQL Output"}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t("common.reset")}
            </button>
          </div>

          <div className="relative group">
            <pre className="w-full h-[650px] p-6 bg-slate-950 text-emerald-400 font-mono text-sm leading-relaxed rounded-3xl overflow-auto select-text shadow-xl border border-slate-800/80 pre-scrollable scrollbar-thin">
              <code>{generatedSQL}</code>
            </pre>

            {/* Quick action buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700 backdrop-blur-md"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t("common.copied") : t("common.copy")}
                {!copied && <Kbd modifier={null} className="ml-1 bg-white/10 border-white/10 text-white/50">C</Kbd>}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white">{t("sql_query_builder.about_title") || "Bilingual Visual SQL Query Builder"}</h4>
              <p>{t("sql_query_builder.about_desc") || "Design standard SQL queries for PostgreSQL, MySQL, SQLite, and SQL Server in real-time, completely offline. Define tables and columns, set join cardinalities, configure filters, aggregation groups, ordering, and select limits seamlessly."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
