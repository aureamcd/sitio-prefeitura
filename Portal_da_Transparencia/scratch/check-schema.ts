import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log("Querying distinct REFERENCIA_NOME from database...");

    const { data, error } = await supabase
        .schema('transparencia')
        .from('remuneracoes')
        .select('raw_json')
        .limit(100000);

    if (error) {
        console.error("Error querying remuneracoes:", error.message);
        return;
    }

    const refs = new Set<string>();
    const tipos = new Set<string>();

    for (const row of data || []) {
        const item = row.raw_json;
        if (!item) continue;

        if (Array.isArray(item)) {
            for (const sub of item) {
                if (sub.REFERENCIA_NOME) refs.add(sub.REFERENCIA_NOME);
            }
        } else {
            if (item.REFERENCIA_NOME) refs.add(item.REFERENCIA_NOME);
        }
    }

    // Também verificar se já existe a coluna tipo preenchida em algum registro
    const { data: colTipoData, error: colTipoErr } = await supabase
        .schema('transparencia')
        .from('remuneracoes')
        .select('tipo')
        .limit(5);
    
    console.log("Sample 'tipo' columns in DB:", colTipoData);

    console.log("\nDistinct REFERENCIA_NOME found in DB:");
    console.log(Array.from(refs).sort());
}

main().catch(console.error);
