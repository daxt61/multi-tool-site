import { useState, useEffect } from "react";
import { Plus, Trash2, Printer, RotateCcw, AlertCircle } from "lucide-react";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

const MAX_LENGTH = 100000;

export function InvoiceGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [companyName, setCompanyName] = useState(initialData?.companyName || "");
  const [clientName, setClientName] = useState(initialData?.clientName || "");
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || "");
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(initialData?.taxRate ?? 20);
  const [currency, setCurrency] = useState(initialData?.currency || "€");
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [error, setError] = useState("");

  useEffect(() => {
    onStateChange?.({ companyName, clientName, invoiceNumber, items, taxRate, currency, issueDate, dueDate });
  }, [companyName, clientName, invoiceNumber, items, taxRate, currency, issueDate, dueDate, onStateChange]);

  const handleTextChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    if (val.length > MAX_LENGTH) {
      setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
    } else {
      setError("");
    }
  };

  const handleClear = () => {
    setCompanyName("");
    setClientName("");
    setInvoiceNumber("");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setTaxRate(20);
    setCurrency("€");
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate("");
    setError("");
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
        >
          <RotateCcw className="w-3 h-3" /> Effacer
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label htmlFor="company-name" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
            Informations Émetteur
          </label>
          <input
            id="company-name"
            type="text"
            value={companyName}
            onChange={(e) => handleTextChange(setCompanyName, e.target.value)}
            className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border ${companyName.length > MAX_LENGTH ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl outline-none focus:ring-2 ${companyName.length > MAX_LENGTH ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all dark:text-white font-bold`}
            placeholder="Nom de votre entreprise"
          />
        </div>
        <div className="space-y-4">
          <label htmlFor="client-name" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
            Informations Client
          </label>
          <input
            id="client-name"
            type="text"
            value={clientName}
            onChange={(e) => handleTextChange(setClientName, e.target.value)}
            className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border ${clientName.length > MAX_LENGTH ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl outline-none focus:ring-2 ${clientName.length > MAX_LENGTH ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all dark:text-white font-bold`}
            placeholder="Nom du client"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label htmlFor="issue-date" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
            Date d'émission
          </label>
          <input
            id="issue-date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white font-bold"
          />
        </div>
        <div className="space-y-4">
          <label htmlFor="due-date" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
            Date d'échéance
          </label>
          <input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label htmlFor="invoice-number" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
            Détails Facture
          </label>
          <input
            id="invoice-number"
            type="text"
            value={invoiceNumber}
            onChange={(e) => handleTextChange(setInvoiceNumber, e.target.value)}
            className={`w-full p-4 bg-slate-50 dark:bg-slate-900/50 border ${invoiceNumber.length > MAX_LENGTH ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl outline-none focus:ring-2 ${invoiceNumber.length > MAX_LENGTH ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all dark:text-white font-mono`}
            placeholder="N° de facture (ex: FAC-2024-001)"
          />
        </div>
        <div className="space-y-4">
          <label htmlFor="tax-rate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">
            Taux de TVA (%)
          </label>
          <input
            id="tax-rate"
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white font-bold"
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          Devise
        </label>
        <div className="flex gap-2">
          {["€", "$", "£"].map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              aria-pressed={currency === curr}
              className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                currency === curr
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between items-center">
          Articles & Services
          <span className="text-[10px] font-bold text-indigo-500">Total Articles: {items.length}</span>
        </label>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800/50 transition-all hover:border-indigo-500/20 group"
            >
              <div className="md:col-span-6 space-y-2">
                <label htmlFor={`item-desc-${index}`} className="text-[10px] font-bold uppercase text-slate-400 md:hidden">Description</label>
                <input
                  id={`item-desc-${index}`}
                  type="text"
                  value={item.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateItem(index, "description", val);
                    if (val.length > MAX_LENGTH) {
                      setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
                    } else {
                      setError("");
                    }
                  }}
                  className={`w-full p-3 bg-white dark:bg-slate-800 border ${item.description.length > MAX_LENGTH ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-medium`}
                  placeholder="Désignation du produit ou service"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label htmlFor={`item-qty-${index}`} className="text-[10px] font-bold uppercase text-slate-400 md:hidden">Quantité</label>
                <input
                  id={`item-qty-${index}`}
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", Number(e.target.value))
                  }
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-mono text-center"
                  placeholder="Qté"
                  min="1"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label htmlFor={`item-price-${index}`} className="text-[10px] font-bold uppercase text-slate-400 md:hidden">Prix Unitaire ({currency})</label>
                <input
                  id={`item-price-${index}`}
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", Number(e.target.value))
                  }
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors text-sm font-mono"
                  placeholder="Prix"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="md:col-span-1 flex items-end md:items-center justify-end">
                <button
                  onClick={() => removeItem(index)}
                  className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-indigo-500 hover:border-indigo-500/50 hover:bg-indigo-50/30 transition-all w-full justify-center"
        >
          <Plus className="w-4 h-4" /> Ajouter une ligne
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl space-y-3">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Aperçu rapide</p>
          <p className="text-sm text-indigo-800/70 dark:text-indigo-300/70 leading-relaxed">
            Remplissez les informations ci-dessus pour générer votre facture. Vous pourrez ensuite l'imprimer ou la sauvegarder en PDF.
          </p>
        </div>

        <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 space-y-4">
          <div className="flex justify-between items-center text-slate-400 text-sm font-bold uppercase tracking-widest px-2">
            <span>Sous-total HT</span>
            <span className="font-mono text-white">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-widest px-2">
            <span>TVA ({taxRate}%)</span>
            <span className="font-mono text-indigo-400">{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
          </div>
          <div className="h-px bg-slate-800 my-4 mx-2"></div>
          <div className="flex justify-between items-center px-2">
            <span className="text-white font-black uppercase tracking-tighter text-xl">Total TTC</span>
            <span className="text-4xl font-black text-white font-mono tracking-tighter">
              {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{currency}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={printInvoice}
        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group"
      >
        <Printer className="w-6 h-6 group-hover:scale-110 transition-transform" />
        Imprimer / Sauvegarder PDF
      </button>
    </div>
  );
}
