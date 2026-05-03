import { analisarNoticiaIA } from "@/scripts/utils/ai";

async function test() {
  const result = await analisarNoticiaIA(
    "Prefeitura realiza nova obra de pavimentação",
    "A prefeitura municipal iniciou obras de pavimentação em diversas ruas da cidade, visando melhorar a mobilidade urbana."
  );

  console.log(result);
}

test();