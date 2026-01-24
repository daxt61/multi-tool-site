import { useState } from "react";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState("");
  const [clientName, setClientName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(20);

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nom de l'entreprise
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Votre entreprise"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nom du client
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nom du client"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Numéro de facture
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="FAC-001"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Taux de TVA (%)
          </label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Articles
        </label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <input
                type="text"
                value={item.description}
                onChange={(e) =>
                  updateItem(index, "description", e.target.value)
                }
                className="p-2 border border-gray-300 rounded md:col-span-2"
                placeholder="Description"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", Number(e.target.value))
                }
                className="p-2 border border-gray-300 rounded"
                placeholder="Qté"
                min="1"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", Number(e.target.value))
                  }
                  className="p-2 border border-gray-300 rounded flex-1"
                  placeholder="Prix"
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Ajouter un article
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span>Sous-total HT:</span>
          <span className="font-semibold">{subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between">
          <span>TVA ({taxRate}%):</span>
          <span className="font-semibold">{taxAmount.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-xl font-bold border-t pt-2">
          <span>Total TTC:</span>
          <span className="text-green-600">{total.toFixed(2)} €</span>
        </div>
      </div>

      <button
        onClick={printInvoice}
        className="w-full py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
      >
        Imprimer / Sauvegarder PDF
      </button>
    </div>
  );
}
