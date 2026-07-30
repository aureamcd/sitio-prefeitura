const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const F = '\uFFFD';
const dict = {
    [`59${F}`]: '59º',
    [`60${F}`]: '60º',
    [`ACESS${F}RIOS`]: 'ACESSÓRIOS',
    [`ADMINISTRA${F}${F}O`]: 'ADMINISTRAÇÃO',
    [`ADVOCAT${F}CIOS`]: 'ADVOCATÍCIOS',
    [`ALIMENTA${F}!ÒO`]: 'ALIMENTAÇÃO',
    [`ALIMENTA${F}${F}O`]: 'ALIMENTAÇÃO',
    [`Alimenta${F}${F}o`]: 'Alimentação',
    [`ALIMENT${F}CIOS`]: 'ALIMENTÍCIOS',
    [`AL${F}M`]: 'ALÉM',
    [`AMPLIA${F}${F}O`]: 'AMPLIAÇÃO',
    [`ANIVERS${F}RIO`]: 'ANIVERSÁRIO',
    [`APERFEI${F}OAMENTO`]: 'APERFEIÇOAMENTO',
    [`AQUISI${F}${F}O`]: 'AQUISIÇÃO',
    [`ARA${F}aJO`]: 'ARAÚJO',
    [`ARRECADA${F}${F}O`]: 'ARRECADAÇÃO',
    [`ART${F}STICO`]: 'ARTÍSTICO',
    [`ASSIST${F}NCIA`]: 'ASSISTÊNCIA',
    [`ATRAV${F}S`]: 'ATRAVÉS',
    [`AUTOM${F}VEL`]: 'AUTOMÓVEL',
    [`A${F}${F}ES`]: 'AÇÕES',
    [`B${F}SICA`]: 'BÁSICA',
    [`b${F}sica`]: 'básica',
    [`CAMINH${F}O`]: 'CAMINHÃO',
    [`CAPACITA${F}${F}ES`]: 'CAPACITAÇÕES',
    [`CARACTER${F}STICAS`]: 'CARACTERÍSTICAS',
    [`CART${F}ES`]: 'CARTÕES',
    [`CA${F}AMBA`]: 'CAÇAMBA',
    [`COMBUST${F}VEIS`]: 'COMBUSTÍVEIS',
    [`COMBUST${F}VEL`]: 'COMBUSTÍVEL',
    [`COMPAT${F}VEIS`]: 'COMPATÍVEIS',
    [`COMUNICA${F}${F}O`]: 'COMUNICAÇÃO',
    [`COMUNIT${F}RIO`]: 'COMUNITÁRIO',
    [`CONCRETIZA${F}${F}O`]: 'CONCRETIZAÇÃO',
    [`CONDU${F}${F}O`]: 'CONDUÇÃO',
    [`CONFEC${F}${F}O`]: 'CONFECÇÃO',
    [`CONFER${F}NCIA`]: 'CONFERÊNCIA',
    [`CONFIGURA${F}${F}O`]: 'CONFIGURAÇÃO',
    [`CONG${F}NERES`]: 'CONGÊNERES',
    [`CONSTRU${F}${F}O`]: 'CONSTRUÇÃO',
    [`CONTRATA${F}${F}ES`]: 'CONTRATAÇÕES',
    [`CONTRATA${F}${F}O`]: 'CONTRATAÇÃO',
    [`contrata${F}${F}o`]: 'contratação',
    [`CONT${F}BEIS`]: 'CONTÁBEIS',
    [`CONV${F}NIOS`]: 'CONVÊNIOS',
    [`Conv${F}nio`]: 'Convênio',
    [`CORRESPOND${F}NCIA`]: 'CORRESPONDÊNCIA',
    [`CORRE${F}${F}O`]: 'CORREÇÃO',
    [`CRIA${F}${F}O`]: 'CRIAÇÃO',
    [`C${F}MBIO`]: 'CÂMBIO',
    [`C${F}RTER`]: 'CÁRTER',
    [`DECIS${F}ES`]: 'DECISÕES',
    [`DEDETIZA${F}${F}O`]: 'DEDETIZAÇÃO',
    [`DENT${F}RIAS`]: 'DENTÁRIAS',
    [`DESPERD${F}CIO`]: 'DESPERDÍCIO',
    [`DESRATIZA${F}${F}O`]: 'DESRATIZAÇÃO',
    [`DIAGN${F}STICOS`]: 'DIAGNÓSTICOS',
    [`DIRE${F}${F}O`]: 'DIREÇÃO',
    [`disposi${F}${F}o`]: 'disposição',
    [`disp${F}e`]: 'dispõe',
    [`DISTRIBU${F}DOS`]: 'DISTRIBUÍDOS',
    [`d${F}"água`]: 'd\'água',
    [`EDITORA${F}${F}O`]: 'EDITORAÇÃO',
    [`EDUCA${F}!ÒO`]: 'EDUCAÇÃO',
    [`EDUCA${F}${F}O`]: 'EDUCAÇÃO',
    [`Educa${F}${F}o`]: 'Educação',
    [`educa${F}${F}o`]: 'educação',
    [`EFICI${F}NCIA`]: 'EFICIÊNCIA',
    [`ELABORA${F}${F}O`]: 'ELABORAÇÃO',
    [`ELETR${F}NICA`]: 'ELETRÔNICA',
    [`EL${F}TRICOS`]: 'ELÉTRICOS',
    [`ESPECIFICA${F}${F}ES`]: 'ESPECIFICAÇÕES',
    [`Especifica${F}${F}es`]: 'Especificações',
    [`ESPEC${F}FICOS`]: 'ESPECÍFICOS',
    [`ESTAR${F}O`]: 'ESTARÃO',
    [`ESTRAT${F}GICAS`]: 'ESTRATÉGICAS',
    [`EXECU${F}${F}O`]: 'EXECUÇÃO',
    [`EXERC${F}CIO`]: 'EXERCÍCIO',
    [`Exerc${F}cio`]: 'Exercício',
    [`exerc${F}cio`]: 'exercício',
    [`FARM${F}CIA`]: 'FARMÁCIA',
    [`FISCALIZA${F}${F}O`]: 'FISCALIZAÇÃO',
    [`F${F}BRICA`]: 'FÁBRICA',
    [`GEST${F}O`]: 'GESTÃO',
    [`GR${F}FICOS`]: 'GRÁFICOS',
    [`G${F}NEROS`]: 'GÊNEROS',
    [`G${F}\`NEROS`]: 'GÊNEROS',
    [`HIDR${F}ULICA`]: 'HIDRÁULICA',
    [`HIDR${F}ULICOS`]: 'HIDRÁULICOS',
    [`ILUMINA${F}${F}O`]: 'ILUMINAÇÃO',
    [`IMPLANTA${F}${F}O`]: 'IMPLANTAÇÃO',
    [`IMPRESS${F}ES`]: 'IMPRESSÕES',
    [`IM${F}VEIS`]: 'IMÓVEIS',
    [`IM${F}VEL`]: 'IMÓVEL',
    [`INCLUS${F}O`]: 'INCLUSÃO',
    [`INFORMATIZA${F}${F}O`]: 'INFORMATIZAÇÃO',
    [`INFORMA${F}${F}O`]: 'INFORMAÇÃO',
    [`INFORM${F}TICA`]: 'INFORMÁTICA',
    [`INJET${F}VEIS`]: 'INJETÁVEIS',
    [`INSTALA${F}${F}ES`]: 'INSTALAÇÕES',
    [`JAC${F} `]: 'JACÓ ',
    [`JUR${F}DICA`]: 'JURÍDICA',
    [`JUR${F}DICOS`]: 'JURÍDICOS',
    [`LICITA${F}${F}ES`]: 'LICITAÇÕES',
    [`LOCA${F}${F}O`]: 'LOCAÇÃO',
    [`L${F}QUIDOS`]: 'LÍQUIDOS',
    [`MANUTEN${F}${F}O`]: 'MANUTENÇÃO',
    [`MAT${F}RIA`]: 'MATÉRIA',
    [`MEC${F}NICOS`]: 'MECÂNICOS',
    [`METAL${F}RGICOS`]: 'METALÚRGICOS',
    [`MET${F}LICAS`]: 'METÁLICAS',
    [`MINIST${F}RIO`]: 'MINISTÉRIO',
    [`MOBILIZA${F}${F}O`]: 'MOBILIZAÇÃO',
    [`MONOCROM${F}TICA`]: 'MONOCROMÁTICA',
    [`MUNIC${F}PIO`]: 'MUNICÍPIO',
    [`Munic${F}pio`]: 'Município',
    [`M${F}DICOS`]: 'MÉDICOS',
    [`M${F}NIMA65`]: 'MÍNIMA65',
    [`M${F}NIMO`]: 'MÍNIMO',
    [`M${F}O`]: 'MÃO',
    [`m${F}o`]: 'mão',
    [`M${F}QUINA`]: 'MÁQUINA',
    [`M${F}QUINAS`]: 'MÁQUINAS',
    [`m${F}quinas`]: 'máquinas',
    [`N${F}O`]: 'NÃO',
    [`n${F}`]: 'nº',
    [`OCORR${F}NCIA`]: 'OCORRÊNCIA',
    [`OPERA${F}${F}O`]: 'OPERAÇÃO',
    [`ORGANIZA${F}${F}O`]: 'ORGANIZAÇÃO',
    [`PEDAG${F}GICO`]: 'PEDAGÓGICO',
    [`PETR${F}LEO`]: 'PETRÓLEO',
    [`PE${F}AS`]: 'PEÇAS',
    [`PNEUM${F}TICOS`]: 'PNEUMÁTICOS',
    [`POSS${F}VEL`]: 'POSSÍVEL',
    [`POT${F}NCIA`]: 'POTÊNCIA',
    [`PO${F}O`]: 'POÇO',
    [`PO${F}OS`]: 'POÇOS',
    [`PRA${F}A`]: 'PRAÇA',
    [`PRESERVA${F}${F}O`]: 'PRESERVAÇÃO',
    [`PRESTA${F}${F}O`]: 'PRESTAÇÃO',
    [`PREVEN${F}${F}O`]: 'PREVENÇÃO',
    [`PREVIDENCI${F}RIA`]: 'PREVIDENCIÁRIA',
    [`PREVIDENCI${F}RIO`]: 'PREVIDENCIÁRIO',
    [`PREVID${F}NCIA`]: 'PREVIDÊNCIA',
    [`PRE${F}MBULO`]: 'PREÂMBULO',
    [`PRODU${F}${F}O`]: 'PRODUÇÃO',
    [`PROGRAMA${F}${F}O`]: 'PROGRAMAÇÃO',
    [`PR${F}DIO`]: 'PRÉDIO',
    [`PR${F}TESES`]: 'PRÓTESES',
    [`PSICOTR${F}PICOS`]: 'PSICOTRÓPICOS',
    [`P${F}BLICA`]: 'PÚBLICA',
    [`P${F}BLICO`]: 'PÚBLICO',
    [`P${F}BLICOS`]: 'PÚBLICOS',
    [`P${F}TIO`]: 'PÁTIO',
    [`RAZ${F}O`]: 'RAZÃO',
    [`REALIZA${F}${F}O`]: 'REALIZAÇÃO',
    [`realiza${F}${F}o`]: 'realização',
    [`RECEP${F}${F}O`]: 'RECEPÇÃO',
    [`REDA${F}${F}O`]: 'REDAÇÃO',
    [`REFEI${F}${F}ES`]: 'REFEIÇÕES',
    [`REFER${F}NCIA`]: 'REFERÊNCIA',
    [`Refer${F}ncia`]: 'Referência',
    [`REFRIGERA${F}${F}O`]: 'REFRIGERAÇÃO',
    [`REPOSI${F}${F}O`]: 'REPOSIÇÃO',
    [`RES${F}DUOS`]: 'RESÍDUOS',
    [`RETRANSMISS${F}O`]: 'RETRANSMISSÃO',
    [`REUNI${F}ES`]: 'REUNIÕES',
    [`resolu${F}${F}o`]: 'resolução',
    [`RO${F}O`]: 'ROÇO',
    [`R${F}DIO/CD`]: 'RÁDIO/CD',
    [`SANIT${F}RIAS`]: 'SANITÁRIAS',
    [`SA${F}DE`]: 'SAÚDE',
    [`SA${F}aDE`]: 'SAÚDE',
    [`SERVI${F}O`]: 'SERVIÇO',
    [`SERVI${F}OS`]: 'SERVIÇOS',
    [`SER${F}`]: 'SERÁ',
    [`SER${F}O`]: 'SERÃO',
    [`SEXAG${F}SIMO`]: 'SEXAGÉSIMO',
    [`SOLICITA${F}${F}O`]: 'SOLICITAÇÃO',
    [`SONORIZA${F}${F}O`]: 'SONORIZAÇÃO',
    [`SUPERVIS${F}O`]: 'SUPERVISÃO',
    [`S${F}PTICAS`]: 'SÉPTICAS',
    [`TAMB${F}M`]: 'TAMBÉM',
    [`TARC${F}SIO`]: 'TARCÍSIO',
    [`TRANSCRI${F}${F}O`]: 'TRANSCRIÇÃO',
    [`T${F}CNICA`]: 'TÉCNICA',
    [`T${F}CNICO`]: 'TÉCNICO',
    [`T${F}CNICOS`]: 'TÉCNICOS',
    [`VE${F}CULOS`]: 'VEÍCULOS',
    [`X${F}ROX`]: 'XÉROX',
    [`${F}rgãos`]: 'órgãos',
    [`${F}nibus`]: 'ônibus',
    [`${F}1${F}`]: 'º',
    [`${F}GUA`]: 'ÁGUA',
    [`${F}LCOOL`]: 'ÁLCOOL',
    [`${F}MBITO`]: 'ÂMBITO',
    [`${F}REA`]: 'ÁREA',
    [`${F}REAS`]: 'ÁREAS',
    [`${F}RG${F}OS`]: 'ÓRGÃOS',
    [`${F}RVORES`]: 'ÁRVORES',
    [`${F}S`]: 'ÀS',
    [`${F}anico`]: 'ânico',
    [`${F}mbito`]: 'âmbito'
};

async function run() {
    let offset = 0;
    const limit = 1000;
    let contratos = [];
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_v2').select('id, objeto, contratado').range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        contratos = contratos.concat(data);
        offset += limit;
    }
    
    let updated = 0;
    for (const c of contratos) {
        let hasChanges = false;
        let newObjeto = c.objeto;
        let newContratado = c.contratado;
        
        if (newObjeto && newObjeto.includes(F)) {
            for (const [bad, good] of Object.entries(dict)) {
                newObjeto = newObjeto.split(bad).join(good);
            }
            if (newObjeto !== c.objeto) hasChanges = true;
        }
        
        if (newContratado && newContratado.includes(F)) {
            for (const [bad, good] of Object.entries(dict)) {
                newContratado = newContratado.split(bad).join(good);
            }
            if (newContratado !== c.contratado) hasChanges = true;
        }
        
        if (hasChanges) {
            // Remove any leftover isolated replacement characters safely
            newObjeto = newObjeto?.replace(/\uFFFD/g, '');
            newContratado = newContratado?.replace(/\uFFFD/g, '');
            
            await supabase.schema('transparencia').from('contratos_v2').update({ objeto: newObjeto, contratado: newContratado }).eq('id', c.id);
            updated++;
        }
    }
    
    console.log('Total corrigido:', updated);
}
run().catch(console.error);
