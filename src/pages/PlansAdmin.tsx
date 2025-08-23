import { useState } from "react";

export default function PlansAdmin() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleCreate = async () => {
    setStatus("loading");
    setErr(null);
    setResult(null);

    try {
      const res = await fetch(
        "https://hbjobpbiordnwflfhjnu.supabase.co/functions/v1/create-pagarme-plans", // 👈 URL da sua função no Supabase
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResult(json);
      setStatus("done");
    } catch (e: any) {
      setErr(e?.message ?? "Erro desconhecido");
      setStatus("error");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Criar Planos via API (Pagar.me Sandbox)</h1>
      <p>Use apenas em desenvolvimento. Remova esta página após criar os planos.</p>

      <button onClick={handleCreate} disabled={status === "loading"}>
        {status === "loading" ? "Criando planos..." : "Criar Planos via API"}
      </button>

      {status === "done" && (
        <div style={{ marginTop: 16 }}>
          <h3>Planos criados com sucesso</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          <p>
            Anote os IDs retornados (ex.: <code>monthly</code> e <code>semiannual</code>).
          </p>
        </div>
      )}
      {status === "error" && <p style={{ color: "red" }}>Erro: {err}</p>}
    </div>
  );
}
