import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Database, Copy, Check, Trash2, Plus, Sparkles, Download, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_TABLES = 8;
const MAX_COLUMNS_PER_TABLE = 10;
const MAX_JOINS = 5;
const MAX_WHERE = 10;
const MAX_ORDER_BY = 5;

type Dialect = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver';
type JoinType = 'INNER JOIN' | 'LEFT JOIN' | 'RIGHT JOIN' | 'FULL JOIN';
type AggregateFunc = 'NONE' | 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT';
type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';

interface ColumnDef {
  id: string;
  name: string;
  table: string;
  aggregate: AggregateFunc;
  alias: string;
}

interface JoinDef {
  id: string;
  type: JoinType;
  table: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface WhereDef {
  id: string;
  conjunction: 'AND' | 'OR';
  table: string;
  column: string;
  operator: Operator;
  value: string;
}

interface OrderByDef {
  id: string;
  table: string;
  column: string;
  direction: 'ASC' | 'DESC';
}

const PRESETS = {
  ecommerce: {
    name: 'ecommerce',
    mainTable: 'orders',
    dialect: 'postgresql' as Dialect,
    distinct: false,
    limit: '50',
    offset: '0',
    columns: [
      { id: 'c1', table: 'orders', name: 'id', aggregate: 'NONE' as AggregateFunc, alias: 'order_id' },
      { id: 'c2', table: 'users', name: 'email', aggregate: 'NONE' as AggregateFunc, alias: 'customer_email' },
      { id: 'c3', table: 'orders', name: 'total_amount', aggregate: 'SUM' as AggregateFunc, alias: 'total_revenue' },
      { id: 'c4', table: 'orders', name: 'status', aggregate: 'NONE' as AggregateFunc, alias: '' }
    ],
    joins: [
      { id: 'j1', type: 'INNER JOIN' as JoinType, table: 'users', fromColumn: 'user_id', toTable: 'orders', toColumn: 'user_id' }
    ],
    where: [
      { id: 'w1', conjunction: 'AND' as const, table: 'orders', column: 'status', operator: '=' as Operator, value: 'completed' }
    ],
    groupBy: ['orders.status', 'orders.id', 'users.email'],
    orderBy: [
      { id: 'o1', table: 'orders', column: 'id', direction: 'DESC' as const }
    ]
  },
  blog: {
    name: 'blog',
    mainTable: 'posts',
    dialect: 'mysql' as Dialect,
    distinct: false,
    limit: '20',
    offset: '0',
    columns: [
      { id: 'c1', table: 'posts', name: 'title', aggregate: 'NONE' as AggregateFunc, alias: '' },
      { id: 'c2', table: 'authors', name: 'name', aggregate: 'NONE' as AggregateFunc, alias: 'author_name' },
      { id: 'c3', table: 'comments', name: 'id', aggregate: 'COUNT' as AggregateFunc, alias: 'comment_count' }
    ],
    joins: [
      { id: 'j1', type: 'LEFT JOIN' as JoinType, table: 'authors', fromColumn: 'author_id', toTable: 'posts', toColumn: 'author_id' },
      { id: 'j2', type: 'LEFT JOIN' as JoinType, table: 'comments', fromColumn: 'post_id', toTable: 'posts', toColumn: 'id' }
    ],
    where: [
      { id: 'w1', conjunction: 'AND' as const, table: 'posts', column: 'is_published', operator: '=' as Operator, value: '1' }
    ],
    groupBy: ['posts.title', 'authors.name'],
    orderBy: [
      { id: 'o1', table: 'comments', column: 'id', direction: 'DESC' as const }
    ]
  },
  saas: {
    name: 'saas',
    mainTable: 'subscriptions',
    dialect: 'sqlite' as Dialect,
    distinct: false,
    limit: '100',
    offset: '0',
    columns: [
      { id: 'c1', table: 'subscriptions', name: 'plan_name', aggregate: 'NONE' as AggregateFunc, alias: '' },
      { id: 'c2', table: 'subscriptions', name: 'mrr', aggregate: 'AVG' as AggregateFunc, alias: 'avg_mrr' },
      { id: 'c3', table: 'subscriptions', name: 'id', aggregate: 'COUNT' as AggregateFunc, alias: 'active_subscribers' }
    ],
    joins: [],
    where: [
      { id: 'w1', conjunction: 'AND' as const, table: 'subscriptions', column: 'status', operator: '=' as Operator, value: 'active' }
    ],
    groupBy: ['subscriptions.plan_name'],
    orderBy: [
      { id: 'o1', table: 'subscriptions', column: 'mrr', direction: 'DESC' as const }
    ]
  }
};

export function SQLQueryBuilder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const mainTableInputRef = useRef<HTMLInputElement>(null);

  const [dialect, setDialect] = useState<Dialect>(initialData?.dialect || 'postgresql');
  const [mainTable, setMainTable] = useState<string>(initialData?.mainTable || PRESETS.ecommerce.mainTable);
  const [distinct, setDistinct] = useState<boolean>(initialData?.distinct ?? false);
  const [columns, setColumns] = useState<ColumnDef[]>(initialData?.columns || PRESETS.ecommerce.columns);
  const [joins, setJoins] = useState<JoinDef[]>(initialData?.joins || PRESETS.ecommerce.joins);
  const [where, setWhere] = useState<WhereDef[]>(initialData?.where || PRESETS.ecommerce.where);
  const [groupBy, setGroupBy] = useState<string[]>(initialData?.groupBy || PRESETS.ecommerce.groupBy);
  const [orderBy, setOrderBy] = useState<OrderByDef[]>(initialData?.orderBy || PRESETS.ecommerce.orderBy);
  const [limit, setLimit] = useState<string>(initialData?.limit || '50');
  const [offset, setOffset] = useState<string>(initialData?.offset || '0');
  const [copied, setCopied] = useState(false);

  // Available tables list
  const availableTables = useMemo(() => {
    const list = new Set<string>();
    if (mainTable.trim()) list.add(mainTable.trim());
    joins.forEach(j => {
      if (j.table.trim()) list.add(j.table.trim());
      if (j.toTable.trim()) list.add(j.toTable.trim());
    });
    return Array.from(list);
  }, [mainTable, joins]);

  const escapeIdentifier = useCallback((id: string, currentDialect: Dialect) => {
    const trimmed = id.trim();
    if (!trimmed) return '';
    if (currentDialect === 'mysql') return `\`${trimmed.replace(/`/g, '``')}\``;
    if (currentDialect === 'sqlserver') return `[${trimmed.replace(/\]/g, ']]')}]`;
    return `"${trimmed.replace(/"/g, '""')}"`;
  }, []);

  const generatedSQL = useMemo(() => {
    if (!mainTable.trim()) {
      return '-- Select or enter a primary table name to build your SQL query';
    }

    const esc = (id: string) => escapeIdentifier(id, dialect);

    // 1. SELECT clause
    let selectClause = 'SELECT ';
    if (distinct) selectClause += 'DISTINCT ';

    if (columns.length === 0) {
      selectClause += '*';
    } else {
      const formattedCols = columns.map(c => {
        const tablePrefix = c.table.trim() ? `${esc(c.table)}.` : '';
        const colName = `${tablePrefix}${esc(c.name || '*')}`;

        let expr = colName;
        if (c.aggregate === 'COUNT') expr = `COUNT(${colName})`;
        else if (c.aggregate === 'COUNT_DISTINCT') expr = `COUNT(DISTINCT ${colName})`;
        else if (c.aggregate === 'SUM') expr = `SUM(${colName})`;
        else if (c.aggregate === 'AVG') expr = `AVG(${colName})`;
        else if (c.aggregate === 'MIN') expr = `MIN(${colName})`;
        else if (c.aggregate === 'MAX') expr = `MAX(${colName})`;

        if (c.alias.trim()) {
          expr += ` AS ${esc(c.alias)}`;
        }
        return expr;
      });
      selectClause += formattedCols.join(', ');
    }

    // 2. FROM clause
    let fromClause = `\nFROM ${esc(mainTable)}`;

    // 3. JOIN clause
    let joinClause = '';
    joins.forEach(j => {
      if (j.table.trim() && j.fromColumn.trim() && j.toTable.trim() && j.toColumn.trim()) {
        joinClause += `\n${j.type} ${esc(j.table)} ON ${esc(j.table)}.${esc(j.fromColumn)} = ${esc(j.toTable)}.${esc(j.toColumn)}`;
      }
    });

    // 4. WHERE clause
    let whereClause = '';
    if (where.length > 0) {
      const validConditions = where.filter(w => w.column.trim());
      if (validConditions.length > 0) {
        whereClause = '\nWHERE ';
        whereClause += validConditions.map((w, idx) => {
          const conj = idx === 0 ? '' : `${w.conjunction} `;
          const tablePrefix = w.table.trim() ? `${esc(w.table)}.` : '';
          const colStr = `${tablePrefix}${esc(w.column)}`;

          if (w.operator === 'IS NULL') return `${conj}${colStr} IS NULL`;
          if (w.operator === 'IS NOT NULL') return `${conj}${colStr} IS NOT NULL`;

          let valStr = w.value;
          if (w.operator === 'IN') {
            const list = w.value.split(',').map(v => `'${v.trim().replace(/'/g, "''")}'`).join(', ');
            valStr = `(${list})`;
          } else if (isNaN(Number(w.value)) || w.value === '') {
            valStr = `'${w.value.replace(/'/g, "''")}'`;
          }

          return `${conj}${colStr} ${w.operator} ${valStr}`;
        }).join(' ');
      }
    }

    // 5. GROUP BY clause
    let groupByClause = '';
    const validGroupBy = groupBy.filter(g => g.trim());
    if (validGroupBy.length > 0) {
      const formattedGb = validGroupBy.map(g => {
        const parts = g.split('.');
        if (parts.length === 2) return `${esc(parts[0])}.${esc(parts[1])}`;
        return esc(g);
      });
      groupByClause = `\nGROUP BY ${formattedGb.join(', ')}`;
    }

    // 6. ORDER BY clause
    let orderByClause = '';
    const validOrderBy = orderBy.filter(o => o.column.trim());
    if (validOrderBy.length > 0) {
      const formattedOb = validOrderBy.map(o => {
        const tablePrefix = o.table.trim() ? `${esc(o.table)}.` : '';
        return `${tablePrefix}${esc(o.column)} ${o.direction}`;
      });
      orderByClause = `\nORDER BY ${formattedOb.join(', ')}`;
    }

    // 7. LIMIT / OFFSET clause
    let limitClause = '';
    const numLimit = parseInt(limit, 10);
    const numOffset = parseInt(offset, 10);

    if (dialect === 'sqlserver') {
      if (!isNaN(numOffset) && numOffset >= 0 && validOrderBy.length > 0) {
        limitClause += `\nOFFSET ${numOffset} ROWS`;
        if (!isNaN(numLimit) && numLimit > 0) {
          limitClause += ` FETCH NEXT ${numLimit} ROWS ONLY`;
        }
      }
    } else {
      if (!isNaN(numLimit) && numLimit > 0) {
        limitClause += `\nLIMIT ${numLimit}`;
      }
      if (!isNaN(numOffset) && numOffset > 0) {
        limitClause += ` OFFSET ${numOffset}`;
      }
    }

    return `${selectClause}${fromClause}${joinClause}${whereClause}${groupByClause}${orderByClause}${limitClause};`;
  }, [mainTable, dialect, distinct, columns, joins, where, groupBy, orderBy, limit, offset, escapeIdentifier]);

  useEffect(() => {
    onStateChange?.({ dialect, mainTable, generatedSQL, distinct, columns, joins, where, groupBy, orderBy, limit, offset });
  }, [dialect, mainTable, generatedSQL, distinct, columns, joins, where, groupBy, orderBy, limit, offset, onStateChange]);

  const handleClear = useCallback(() => {
    setMainTable('orders');
    setColumns([]);
    setJoins([]);
    setWhere([]);
    setGroupBy([]);
    setOrderBy([]);
    setLimit('50');
    setOffset('0');
    toast.success(t('sql_query_builder.toast_cleared') || 'Query builder reset!');
    setTimeout(() => mainTableInputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!generatedSQL) return;
    navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    toast.success(t('common.copied') || 'Copied SQL!');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedSQL, t]);

  const handleDownload = useCallback(() => {
    if (!generatedSQL) return;
    const blob = new Blob([generatedSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-${mainTable || 'sql'}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success') || 'Downloaded!');
  }, [generatedSQL, mainTable, t]);

  const loadPreset = useCallback((presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setDialect(preset.dialect);
      setMainTable(preset.mainTable);
      setDistinct(preset.distinct);
      setColumns(preset.columns);
      setJoins(preset.joins);
      setWhere(preset.where);
      setGroupBy(preset.groupBy);
      setOrderBy(preset.orderBy);
      setLimit(preset.limit);
      setOffset(preset.offset);
      toast.success(t('sql_query_builder.preset_loaded') || 'Preset loaded!');
    }
  }, [t]);

  const handlersRef = useRef({
    handleClear,
    handleCopy
  });

  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const { handleClear, handleCopy } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Structural Column Actions
  const addColumn = () => {
    if (columns.length >= MAX_COLUMNS_PER_TABLE * 2) {
      toast.error(t('sql_query_builder.max_columns_reached', { max: MAX_COLUMNS_PER_TABLE * 2 }));
      return;
    }
    setColumns(prev => [
      ...prev,
      { id: `c_${Date.now()}`, table: mainTable || 'orders', name: '', aggregate: 'NONE', alias: '' }
    ]);
  };

  const removeColumn = (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
  };

  // Structural Join Actions
  const addJoin = () => {
    if (joins.length >= MAX_JOINS) {
      toast.error(t('sql_query_builder.max_joins_reached', { max: MAX_JOINS }));
      return;
    }
    setJoins(prev => [
      ...prev,
      { id: `j_${Date.now()}`, type: 'INNER JOIN', table: '', fromColumn: '', toTable: mainTable || '', toColumn: 'id' }
    ]);
  };

  const removeJoin = (id: string) => {
    setJoins(prev => prev.filter(j => j.id !== id));
  };

  // Structural Where Actions
  const addWhere = () => {
    if (where.length >= MAX_WHERE) {
      toast.error(t('sql_query_builder.max_where_reached', { max: MAX_WHERE }));
      return;
    }
    setWhere(prev => [
      ...prev,
      { id: `w_${Date.now()}`, conjunction: 'AND', table: mainTable || '', column: '', operator: '=', value: '' }
    ]);
  };

  const removeWhere = (id: string) => {
    setWhere(prev => prev.filter(w => w.id !== id));
  };

  // Structural OrderBy Actions
  const addOrderBy = () => {
    if (orderBy.length >= MAX_ORDER_BY) {
      toast.error(t('sql_query_builder.max_orderby_reached', { max: MAX_ORDER_BY }));
      return;
    }
    setOrderBy(prev => [
      ...prev,
      { id: `o_${Date.now()}`, table: mainTable || '', column: '', direction: 'ASC' }
    ]);
  };

  const removeOrderBy = (id: string) => {
    setOrderBy(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" role="region" aria-label={t('sql_query_builder.title') || 'SQL Query Builder'}>
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('sql_query_builder.presets_title') || 'Quick Presets:'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadPreset('ecommerce')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sql_query_builder.preset_ecommerce') || 'E-Commerce Orders'}
          </button>
          <button
            onClick={() => loadPreset('blog')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sql_query_builder.preset_blog') || 'Blog Posts & Comments'}
          </button>
          <button
            onClick={() => loadPreset('saas')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {t('sql_query_builder.preset_saas') || 'SaaS Subscriptions'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="main-table-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sql_query_builder.config_title') || 'Query Configuration'}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                title={`${t('common.reset')} (Esc)`}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.reset')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            {/* Dialect & Primary Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="sql-dialect-select" className="text-xs font-bold text-slate-500 px-1">
                  {t('sql_query_builder.dialect') || 'SQL Dialect'}
                </label>
                <select
                  id="sql-dialect-select"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value as Dialect)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 font-semibold cursor-pointer"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="sqlite">SQLite</option>
                  <option value="sqlserver">MS SQL Server</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="main-table-input" className="text-xs font-bold text-slate-500 px-1">
                  {t('sql_query_builder.primary_table') || 'Primary Table (FROM)'}
                </label>
                <input
                  id="main-table-input"
                  ref={mainTableInputRef}
                  type="text"
                  value={mainTable}
                  onChange={(e) => setMainTable(e.target.value)}
                  placeholder="orders"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 font-mono text-sm"
                />
              </div>
            </div>

            {/* DISTINCT Toggle */}
            <div className="flex items-center gap-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={distinct}
                  onChange={(e) => setDistinct(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {t('sql_query_builder.distinct') || 'SELECT DISTINCT'}
                </span>
              </label>
            </div>

            {/* Columns (SELECT) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {t('sql_query_builder.columns') || 'Columns (SELECT)'}
                </span>
                <button
                  onClick={addColumn}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" aria-hidden="true" /> {t('common.add') || 'Add Column'}
                </button>
              </div>

              {columns.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-1">
                  {t('sql_query_builder.all_columns_hint') || 'No explicit columns added. Query will SELECT *.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {columns.map((c, idx) => (
                    <div key={c.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <select
                        value={c.table}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColumns(prev => prev.map(col => col.id === c.id ? { ...col, table: val } : col));
                        }}
                        className="col-span-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-slate-200"
                      >
                        {availableTables.map(tbl => (
                          <option key={tbl} value={tbl}>{tbl}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColumns(prev => prev.map(col => col.id === c.id ? { ...col, name: val } : col));
                        }}
                        placeholder="column_name (*)"
                        className="col-span-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-slate-200"
                      />

                      <select
                        value={c.aggregate}
                        onChange={(e) => {
                          const val = e.target.value as AggregateFunc;
                          setColumns(prev => prev.map(col => col.id === c.id ? { ...col, aggregate: val } : col));
                        }}
                        className="col-span-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold dark:text-slate-200"
                      >
                        <option value="NONE">None</option>
                        <option value="COUNT">COUNT()</option>
                        <option value="COUNT_DISTINCT">COUNT(DISTINCT)</option>
                        <option value="SUM">SUM()</option>
                        <option value="AVG">AVG()</option>
                        <option value="MIN">MIN()</option>
                        <option value="MAX">MAX()</option>
                      </select>

                      <input
                        type="text"
                        value={c.alias}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColumns(prev => prev.map(col => col.id === c.id ? { ...col, alias: val } : col));
                        }}
                        placeholder="alias"
                        className="col-span-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-slate-200"
                      />

                      <button
                        onClick={() => removeColumn(c.id)}
                        className="col-span-1 text-slate-400 hover:text-rose-500 flex justify-center"
                        title={t('common.remove')}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* JOINS */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {t('sql_query_builder.joins') || 'Table Joins'}
                </span>
                <button
                  onClick={addJoin}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" aria-hidden="true" /> {t('common.add') || 'Add Join'}
                </button>
              </div>

              {joins.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-1">
                  {t('sql_query_builder.no_joins') || 'No JOINs added.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {joins.map(j => (
                    <div key={j.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-mono">
                      <select
                        value={j.type}
                        onChange={(e) => {
                          const val = e.target.value as JoinType;
                          setJoins(prev => prev.map(item => item.id === j.id ? { ...item, type: val } : item));
                        }}
                        className="col-span-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200"
                      >
                        <option value="INNER JOIN">INNER JOIN</option>
                        <option value="LEFT JOIN">LEFT JOIN</option>
                        <option value="RIGHT JOIN">RIGHT JOIN</option>
                        <option value="FULL JOIN">FULL JOIN</option>
                      </select>

                      <input
                        type="text"
                        value={j.table}
                        onChange={(e) => {
                          const val = e.target.value;
                          setJoins(prev => prev.map(item => item.id === j.id ? { ...item, table: val } : item));
                        }}
                        placeholder="join_table"
                        className="col-span-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200"
                      />

                      <input
                        type="text"
                        value={j.fromColumn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setJoins(prev => prev.map(item => item.id === j.id ? { ...item, fromColumn: val } : item));
                        }}
                        placeholder="foreign_key"
                        className="col-span-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200"
                      />

                      <span className="col-span-1 text-center font-bold text-slate-400">=</span>

                      <input
                        type="text"
                        value={j.toColumn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setJoins(prev => prev.map(item => item.id === j.id ? { ...item, toColumn: val } : item));
                        }}
                        placeholder="primary_key"
                        className="col-span-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200"
                      />

                      <button
                        onClick={() => removeJoin(j.id)}
                        className="col-span-1 text-slate-400 hover:text-rose-500 flex justify-center"
                        title={t('common.remove')}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WHERE */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {t('sql_query_builder.where_clause') || 'Where Conditions'}
                </span>
                <button
                  onClick={addWhere}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" aria-hidden="true" /> {t('common.add') || 'Add Condition'}
                </button>
              </div>

              {where.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-1">
                  {t('sql_query_builder.no_where') || 'No WHERE filters applied.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {where.map((w, idx) => (
                    <div key={w.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-mono">
                      {idx > 0 ? (
                        <select
                          value={w.conjunction}
                          onChange={(e) => {
                            const val = e.target.value as 'AND' | 'OR';
                            setWhere(prev => prev.map(item => item.id === w.id ? { ...item, conjunction: val } : item));
                          }}
                          className="col-span-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200 font-bold"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      ) : (
                        <div className="col-span-2 text-center text-xs font-bold text-indigo-500 uppercase">WHERE</div>
                      )}

                      <select
                        value={w.table}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhere(prev => prev.map(item => item.id === w.id ? { ...item, table: val } : item));
                        }}
                        className="col-span-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200"
                      >
                        {availableTables.map(tbl => (
                          <option key={tbl} value={tbl}>{tbl}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={w.column}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhere(prev => prev.map(item => item.id === w.id ? { ...item, column: val } : item));
                        }}
                        placeholder="column"
                        className="col-span-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200"
                      />

                      <select
                        value={w.operator}
                        onChange={(e) => {
                          const val = e.target.value as Operator;
                          setWhere(prev => prev.map(item => item.id === w.id ? { ...item, operator: val } : item));
                        }}
                        className="col-span-2 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200"
                      >
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value="LIKE">LIKE</option>
                        <option value="IN">IN</option>
                        <option value="IS NULL">IS NULL</option>
                        <option value="IS NOT NULL">IS NOT NULL</option>
                      </select>

                      <input
                        type="text"
                        disabled={w.operator === 'IS NULL' || w.operator === 'IS NOT NULL'}
                        value={w.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhere(prev => prev.map(item => item.id === w.id ? { ...item, value: val } : item));
                        }}
                        placeholder="value"
                        className="col-span-1 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-200 disabled:opacity-30"
                      />

                      <button
                        onClick={() => removeWhere(w.id)}
                        className="col-span-1 text-slate-400 hover:text-rose-500 flex justify-center"
                        title={t('common.remove')}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ORDER BY & LIMIT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {t('sql_query_builder.order_by') || 'ORDER BY'}
                  </span>
                  <button
                    onClick={addOrderBy}
                    className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" /> {t('common.add')}
                  </button>
                </div>

                {orderBy.map(o => (
                  <div key={o.id} className="flex gap-2 items-center text-xs font-mono">
                    <input
                      type="text"
                      value={o.column}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOrderBy(prev => prev.map(item => item.id === o.id ? { ...item, column: val } : item));
                      }}
                      placeholder="column"
                      className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-slate-200"
                    />
                    <select
                      value={o.direction}
                      onChange={(e) => {
                        const val = e.target.value as 'ASC' | 'DESC';
                        setOrderBy(prev => prev.map(item => item.id === o.id ? { ...item, direction: val } : item));
                      }}
                      className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-slate-200"
                    >
                      <option value="ASC">ASC</option>
                      <option value="DESC">DESC</option>
                    </select>
                    <button onClick={() => removeOrderBy(o.id)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                  {t('sql_query_builder.pagination') || 'Pagination (LIMIT / OFFSET)'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="LIMIT (50)"
                    className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-mono dark:text-slate-300"
                  />
                  <input
                    type="number"
                    value={offset}
                    onChange={(e) => setOffset(e.target.value)}
                    placeholder="OFFSET (0)"
                    className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-mono dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Output Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <label htmlFor="sql-query-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('sql_query_builder.sql_output') || 'Generated SQL Query'}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!generatedSQL}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!generatedSQL}
                title={`${t('common.copy')} (C)`}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />} {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>

          <textarea
            id="sql-query-output"
            value={generatedSQL}
            readOnly
            className="w-full h-[550px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
