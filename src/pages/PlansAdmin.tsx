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
      <h1>Teste API Pagar.me</h1>
      <p>Testando criação de plano básico primeiro.</p>

      <button onClick={handleCreate} disabled={status === "loading"}>
        {status === "loading" ? "Testando..." : "Testar Criação de Plano"}
      </button>

      {status === "done" && (
        <div style={{ marginTop: 16, backgroundColor: '#f0f8f0', padding: 16, borderRadius: 8 }}>
          <h3>✅ Resposta recebida</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {status === "error" && (
        <div style={{ marginTop: 16, backgroundColor: '#fff0f0', padding: 16, borderRadius: 8 }}>
          <h3>❌ Erro encontrado</h3>
          <p style={{ color: "red" }}>{err}</p>
        </div>
      )}
    </div>
  );
}
