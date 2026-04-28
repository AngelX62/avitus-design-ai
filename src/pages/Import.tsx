import { useState } from "react";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Upload, Check } from "lucide-react";
import { toast } from "sonner";

const TARGETS = [
  { key: "skip", label: "— Skip —" },
  { key: "full_name", label: "Name", aliases: ["name", "full name", "client", "customer"] },
  { key: "email", label: "Email", aliases: ["email", "e-mail", "mail"] },
  { key: "phone", label: "Phone", aliases: ["phone", "mobile", "whatsapp", "contact"] },
  { key: "source", label: "Source", aliases: ["source", "channel", "from"] },
  { key: "project_type", label: "Project type", aliases: ["project", "project type", "type"] },
  { key: "property_type", label: "Property type", aliases: ["property", "property type"] },
  { key: "location", label: "Location", aliases: ["location", "city", "area", "address"] },
  { key: "budget_range", label: "Budget", aliases: ["budget", "price"] },
  { key: "timeline", label: "Timeline", aliases: ["timeline", "start", "when"] },
  { key: "style_preference", label: "Style", aliases: ["style", "aesthetic"] },
  { key: "raw_inquiry", label: "Notes / inquiry", aliases: ["notes", "message", "inquiry", "brief", "comments"] },
  { key: "custom", label: "Custom field" },
];

const guess = (header: string) => {
  const h = header.toLowerCase().trim();
  for (const t of TARGETS) {
    if (t.aliases?.some((a) => h.includes(a))) return t.key;
  }
  return "custom";
};

const Import = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const onFile = (file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const data = res.data as any[];
        if (!data.length) { toast.error("CSV is empty"); return; }
        const h = res.meta.fields || Object.keys(data[0]);
        setHeaders(h);
        setRows(data);
        const m: Record<string, string> = {};
        h.forEach((col) => { m[col] = guess(col); });
        setMapping(m);
        setStep(2);
      },
      error: (err) => toast.error(err.message),
    });
  };

  const runImport = async () => {
    setBusy(true);
    setStep(4);
    const { data, error } = await supabase.functions.invoke("import-leads", { body: { rows, mapping } });
    setBusy(false);
    if (error || !data?.ok) { toast.error(data?.error || error?.message || "Import failed"); return; }
    toast.success(`Imported ${data.inserted} leads · AI cleanup running in background`);
    navigate("/leads");
  };

  return (
    <div className="px-6 md:px-12 py-10 max-w-5xl">
      <PageHeader
        eyebrow="STUDIO · IMPORT"
        title="Import a sheet."
        subtitle="Upload a messy CSV. Avitus suggests column mappings, preserves your custom fields, and runs cleanup after import."
      />

      <div className="flex items-center gap-3 mb-10">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-3">
            <div className={`w-7 h-7 flex items-center justify-center text-xs border ${step >= n ? "bg-ink text-ivory border-ink" : "border-border text-stone"}`}>
              {step > n ? <Check size={12} /> : n}
            </div>
            {n < 4 && <div className={`w-12 h-px ${step > n ? "bg-ink" : "bg-border"}`} />}
          </div>
        ))}
        <div className="ml-4 micro-label text-stone">{["UPLOAD", "PREVIEW", "MAP COLUMNS", "IMPORT"][step - 1]}</div>
      </div>

      {step === 1 && (
        <label className="block border border-dashed border-border bg-card p-16 text-center cursor-pointer hover:border-ink/40 transition-colors">
          <Upload size={28} strokeWidth={1.25} className="mx-auto text-stone mb-4" />
          <div className="font-serif text-2xl text-ink mb-2">Choose a CSV file</div>
          <div className="text-sm text-stone">Headers in the first row. Up to 1,000 leads per import.</div>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      )}

      {step === 2 && (
        <div>
          <div className="micro-label mb-3">PREVIEW · {rows.length} ROWS · {headers.length} COLUMNS</div>
          <div className="border border-border bg-card overflow-x-auto mb-6">
            <table className="text-sm min-w-full">
              <thead className="bg-secondary">
                <tr>{headers.map((h) => <th key={h} className="text-left px-4 py-3 micro-label whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    {headers.map((h) => <td key={h} className="px-4 py-3 text-stone whitespace-nowrap max-w-[200px] truncate">{r[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-6 py-3 border border-border text-xs uppercase tracking-[0.18em]">Back</button>
            <button onClick={() => setStep(3)} className="px-8 py-3 bg-ink text-ivory text-xs uppercase tracking-[0.22em]">Continue to mapping</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="micro-label mb-3">MAP COLUMNS</div>
          <p className="text-sm text-stone mb-6 max-w-xl">Avitus suggested mappings based on your headers. Anything left as Custom field will be preserved on the lead record but not used for scoring.</p>
          <div className="border border-border bg-card divide-y divide-border mb-6">
            {headers.map((h) => (
              <div key={h} className="grid grid-cols-2 gap-4 px-5 py-4 items-center">
                <div>
                  <div className="font-serif text-lg text-ink">{h}</div>
                  <div className="text-xs text-stone truncate">{rows[0]?.[h]}</div>
                </div>
                <select value={mapping[h]} onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                  className="bg-transparent border border-border focus:border-ink outline-none px-3 py-2 text-sm text-ink">
                  {TARGETS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-6 py-3 border border-border text-xs uppercase tracking-[0.18em]">Back</button>
            <button onClick={runImport} disabled={busy} className="px-8 py-3 bg-ink text-ivory text-xs uppercase tracking-[0.22em] disabled:opacity-60">
              Import {rows.length} leads
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="border border-border bg-card p-12 text-center">
          <div className="font-serif text-2xl text-ink mb-3">Importing…</div>
          <div className="text-sm text-stone">Avitus is creating leads and running AI cleanup in the background.</div>
        </div>
      )}
    </div>
  );
};

export default Import;
