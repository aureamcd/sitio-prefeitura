/**
 * Utilitário de envio de e-mails automáticos (e-SIC e Ouvidoria)
 * Integração com Resend via API (sem SDK para evitar dependências extras).
 * 
 * Se não houver chave (ambiente local), apenas faz um log simulando o envio.
 */

export async function enviarEmailStatus(
  para: string,
  protocolo: string,
  canal: "e-SIC" | "Ouvidoria",
  status: string,
  linkConsulta: string
) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const REMETENTE = process.env.EMAIL_REMETENTE || "prefeitura@padremarcos.gov.pi.br";

  const assunto = `Atualização no Pedido de ${canal} — Protocolo ${protocolo}`;

  const mensagemHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #173572; margin-top: 0;">Atualização de Protocolo</h2>
      <p style="color: #475569; font-size: 16px;">
        Olá,
      </p>
      <p style="color: #475569; font-size: 16px;">
        O seu pedido de ${canal} (Protocolo <strong>${protocolo}</strong>) teve uma atualização no status e agora consta como <strong>${status}</strong>.
      </p>
      <div style="margin: 30px 0; padding: 20px; background-color: #f8faff; border-left: 4px solid #173572;">
        <p style="margin: 0; color: #1e293b;">
          Para consultar a resposta completa e o histórico do seu pedido, acesse a área pública do portal:
        </p>
        <a href="${linkConsulta}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #173572; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Acessar Meu Protocolo
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; pt-4;">
        Este é um e-mail automático enviado pelo Portal de Transparência. Por favor, não responda.
      </p>
    </div>
  `;

  // Se não houver chave do Resend configurada, apenas simula (útil para dev)
  if (!RESEND_API_KEY) {
    console.log("========================================");
    console.log("📧 E-MAIL AUTOMÁTICO (SIMULAÇÃO)");
    console.log(`Para: ${para}`);
    console.log(`Assunto: ${assunto}`);
    console.log(`Status: ${status}`);
    console.log("Configure a variável RESEND_API_KEY para enviar de verdade.");
    console.log("========================================");
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Portal da Prefeitura <${REMETENTE}>`,
        to: [para],
        subject: assunto,
        html: mensagemHtml,
      }),
    });

    if (!res.ok) {
      console.error("[E-mail] Erro da API Resend:", await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[E-mail] Erro ao enviar:", error);
    return false;
  }
}
