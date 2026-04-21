import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manual .env.local parsing
const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const [key, ...vals] = line.split('=');
    if (!key) return null;
    return [key.trim(), vals.join('=').trim()];
  }).filter(Boolean)
);

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const albumTitles = [
  "Reduto da Gafieira - Bday Ariel Muniz", "A HIstoria de quem dança - Marcelo Amorim", "Aniversario R2", "Baile do Altobelli 2", "LambaSwag Domingo", "LambaSwag", "Congresso Gerações", "Aniversario Planet 2025", "Samba ao Quadrado", "Dançart - Casa de Vidro", "Academia Olimpo - Ultimo Baile", "Forró a Bordo - 2024", "Q Baile - 23 de novembo", "Olimpo - Halloween", "Bachata Vibe Halloween", "Reduto do Samba", "B DAY AMANDA NATY", "BDAY RAAB E INAUGURAÇÂO OLIMPO ESCOLA DE DANÇA", "Forro Com Pizza", "Gabs Party - São Paulo", "Q BAILE 18 05", "Aniversario do Daniel Xexeu", "Workshop Clemilson Rodrigues - Studio Dançarts", "Q Baile", "O Baile 2 - Ferias", "Baguncinha - Carnaval", "Forro da puta - Carnaval - Studio Dançarts", "Zouk Na Mamsão - 3° edção", "Zouk Na Mansão - Segundo dia", "Forro a Bordo", "ZOUK NA MANSÃO - Primeiro dia", "O BAILE - Bday Agnaldo Moita", "ZOUK RESERVA - 05 11 23", "ACADEMIA DANÇART", "ZOUK NO RESERVA 61", "CHAPA NO ZOUK -DOMINGO", "Chapa no Zouk - SABADO", "Chapa No Zouk - SEXTA FEIRA", "CHAPA NO ZOUK - QUINTA FEIRA", "Resenha do piseiro", "Resenha Latina", "ZOUK RESENHA", "RESENHA DO PISEIRO", "ZOUK RESENHA -WHITE PARTY", "Bodas de algodão - Cassio e Fernanda", "Studio Victor Vaz - Final de ano", "#issoehbrasilia", "Zouk resenha", "resenha do piseiro", "One zouk - São Paulo", "Resenha do Piseiro", "Zouk Resenha - 4° edição", "zouk resenha - part 2", "ZONA ZOUK - curitba", "Zouk resenha - part 1", "Studio de dança victor vaz", "ZOUKIDS", "zouk sense - terceiro dia - Baile", "zouk sense - terceiro dia", "ZOUK SENSE - SEGUNDO DIA - BAILE", "ZOUK SENSE - SEGUNDO DIA", "ZOUK SENSE - PRIMEIRO DIA - BAILE", "ZOUK SENSE - PRIMEIRO DIA PARTE 2", "Zouk sense Primeiro dia", "Zouk Resenha - Segunda edição", "Zouk Resenha", "UFB - UNIÃO DOS FORROZEIROS DO BRASIL", "Paulo Mac em Brasilia - Sabado e Domingo", "Forzouk", "Zouk Army", "Circuito Uaizouk Brasilia", "Zouk Day Night", "Zouk Friday", "Nossa resenha - 2 ° dia", "Zouk Friday - segundo dia", "Nossa resenha", "Zouk Friday - 17 06", "ZOUK INVASION", "Forro na chacara", "Zouk No Quadradim", "Zouk no Quadradim", "LADIM BIRTHDAY - 22 01 22", "Zouk Essence - 11/01/2022", "B-day - Agnaldo Moita", "Ultimo essence do ano", "BLACK ZOUK NIGTH - GOIANIA", "Workshop Paloma Alves Followers", "ZOUK SENSE - DOMINGO", "ZOUK SENSE - SABADO", "ZOUK SENSE - SEXTA FEIRA", "ZOUK ESSENCE", "LANÇAMENTO DO DJ CAIO LINS", "FBSB - Campeonato de forro eletronico", "Workshop ZOUK EM BRASILIA", "Zouk de Meia", "ZoukTime - Aulas", "ZoukTime - Baile", "Nação Zouk - 07/03/20", "Naçao Zouk 24 02 20", "Brasilia Tango Festival - Terceiro dia", "Brasilia Tango Festival - Segundo dia", "Brasilia Tango Festival", "Zouk Essence - 27 01 20", "Nação Zouk - Aniverario do Pedrinho Santos", "Zouk Essence - 07-01-19", "Forro no Barco - 22 12 19", "Zouk Essence - 10/12/19", "Telebar - 6 Anos Forro 100 dó", "Forro Essence - 08 12 19", "Zouk Essence - 03 12 19", "Nação Zouk - 07 12 19", "7° Edição Forró na chácara", "Nação zouk /09/11/2019", "Zouk Essence - Bday Agnaldo Moita", "CARMENS", "Zouk Essence", "Nação Zouk - B-day Ronaldo Jose - Retrô", "8° Boteco do Gabriel Mendoça", "Aniversario de dois anos EU SOU TOP", "WBB - WORKSHOP BRASILIEIRO DE BOLERO", "Zouk Essence - 10 09 19", "Nação Zouk - 14 09 19", "Zouk Essence - 03 09 19", "Zeijo Samba Club - Edição Primavera", "Zouk Essence - 20 08 19", "Zouk Essence - 13 08 19", "B-Day Jorge Luis", "Nação Zouk - 10 09 19", "Telebar - Aniversario da Vivi", "Zouk Essence - 16/07/19", "Zouk Essence - 09/07/19", "Arraia Dos Forrozeiros", "Nação Zouk - 13/07/19", "ZOUK ESSENCE - 03 07 19 - B-Day Pri Borges", "Zouk Essence - 25 06 19", "Zouk Essence - 18 06 19", "Aniversario do Professor Virtor vaz", "Congresso Nação Zouk - Segundo Baile", "Congresso Nação Zouk - Primeiro Baie", "SWING ZOUK WEEKEND", "Swing ZOUK Weeknd 2019", "Zouk Essence - 21 05 19", "Forró na chácara - 26 05 19", "Forro No Barco 19 - 05 18", "Zouk Essence - 07 05 19", "Nação Zouk 11 05 19", "Baile de Aniversário do Ariel Muniz", "Zouk Essence - Toda terça - SEGUNDO DIA", "URBAN ZOUK BRASILIA - BAILE", "URBAN ZOUK BRASILIA - AULAS", "♛ Diboa IN Sampa Day ♛", "ZOUK ESSENCE - PRIMEIRO", "Nação Zouk - 13 04 19", "Circuito Uaizouk - Brasilia", "Zouk do Pijama - B-day do Caio Lins", "Zouk Oasis - O ULTIMO", "Sensation Latina", "ZOUK OASIS 06 03 19", "Nação Zouk - Carnaval", "Zouk Oasis - 13 02 19", "Zouk Oasis 06 02 19", "Zouk oasis - Dj KaKah - 30 01 19", "Canaval no barco dos Forrozeiros", "Workshop na UNB - KAKAH E THIAGÃO", "Zouk Oasis - 23 01 18", "Nação Zouk - Aniversario do Pedrinho Santos", "ZOUK OASIS - ALDO +", "Aniversario Da Bia Alexia", "Zouk Oasis - DJ Jansen", "ZOUK OASIS - PRIMEIRO DO ANO", "ZOUK OASIS - ULTIMO DO ANO", "Gafieira Brasil Centro Oeste", "Zouk no oasis - Beneficente", "Raises do sertão + Agnaldo Moita em Goiania", "ZOUK OASIS 12 12 18", "CHURRAS B-DAY PL", "zouk oasis 05 12 1", "CONFRATERNIZAÇÃO DOS FORROZEIROS", "Zouk Oasis - 30 11 18", "Zouk oasis - 21 11 18", "Gafieira Brasil - Centro Oeste - Campeonato", "Gafieira Brasil - Centro Oeste - Aulas(sabado)", "Gafieira Brasil - Baile de Sexta", "Gafieira Brasil Centro oeste - Feijoada 15/11/18", "Zouk Oasis 13/11/18", "Salsa Em Evidência - 11/11/18", "Salsa em Evidência - 10/11/18", "Latinos em evidência - 1º dia de aula", "Latinos em evidência 09/11 - Baile Inaugural", "Zouk Oasis 07 11", "Zouk Oasis 31 10", "Zouk Oasis 24 10", "Zouk Oasis 17 10", "Zouk Oasis - 10/10", "Zouk Oasis - 19 09 18", "Zouk Oasis - 12 09 18", "Zouk Na Buddy - Dj Kakah Outra vez", "Zouk na Buddy - Kakah", "Zouk Na Buddy - 28 08 18", "deep Produções - Esquenta UaiZouk", "Zouk de Otramanera - Ultimo capitulo", "UFB - Apresentações", "Zouk de Otramanera 16 09 18", "zouk de otramanera", "Nação Zouk e Up Dance - Fotos do Ronaldo", "Zouk de Otramanera - Ultimo Parte II", "Nação Zouk e Up Dance - Aulas", "Zouk de otramanera manera - Ulitmo", "Nação Zouk e Up dance - Segundo baile (14/07/18)", "Nação zouk e Up Dance - Primeiro baile (13/07/18)", "Zouk de otramanera - Festa junina", "Zouk de Otramanera - Paloma Alves", "ZOUK DE OTRAMANERA 28 06 18", "Zouk de Otramanera - Varios Dias", "ZOUK DE OTRAMANERA - DIA DOS NAMORADOS", "Zouk de Otramanera 15 05 18", "Zouk de Otramanera - Especial na quinta", "Zouk e Bachata de Otramanera 17 04 18", "Zouk e Bachata de Otramanera 27 03 18", "ZOUK E BACHATA DE OTRAMANERA", "JuKaka 1 ano (Part 1)", "Zouk e Bachata de Otramanera", "B-Day Ana Viana", "Zouk de otramanera 13 03 18", "Zouk de Otramanera 06 03 18", "4Dance - Todos os Ritmos", "Otramanera 27 02 18", "Baile de zouk - La na dança", "Zouk de Otramanera 20 -02 -18", "Buena Vista Social Club", "Carnazouk No Otramanara -13 02 18", "Canarzouk 2018 - Sexta feira CDMA", "Zouk de Otramanera", "Baile do Ariel Muniz", "Zouk De Otramanera - Noite delas", "4Dance - Baile de Domingo (08/10/2017)", "4Dance - Aulas de Domingo (08/10/2017)", "4Dance - Baile Glow (07/10/2017)", "4Dance - Aulas de Sábado (07/08/2017)", "4Dance - Baile de Sexta (06/10/2017)", "Pré-Congresso 4Dance", "Pré - Congresso 4Dance", "1º Forró Music Festival - 01 e 02 de Fev", "Forro Essence - Todo Domingo", "Dominão Essence Gama", "Domingão Bakuk", "B-day jorge luis", "Zouk Essence - 16 07 19", "Zouk Essence - 09/07"
].reverse(); // Process from OLD to NEW

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

function extractDate(title) {
  const match = title.match(/(\d{2}[\/\-\s]\d{2}[\/\-\s]\d{2})/);
  if (match) {
    const parts = match[1].split(/[\/\-\s]/);
    return `20${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

async function bulkCreate() {
  console.log('🚀 Iniciando criação de 214 eventos...');
  
  // Clean up partial data from previous run (if any duplicated titles exist)
  await supabase.from('events').delete().neq('slug', 'congresso-4dance-2024');

  let baseDate = new Date('2017-10-01');

  for (let i = 0; i < albumTitles.length; i++) {
    const title = albumTitles[i];
    const slug = `${slugify(title)}-${i}`;
    const extractedDate = extractDate(title);
    
    // Increment date slightly for items without dates to preserve order
    const eventDate = extractedDate || new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`[${i+1}/214] Criando: ${title}...`);
    
    const { error } = await supabase.from('events').insert({
      title,
      slug,
      event_date: eventDate,
      description: `Galeria de fotos do evento ${title}.`,
      is_public: true
    });

    if (error) console.error(`Erro ao criar ${title}:`, error.message);
  }

  console.log('🏁 Sucesso! 214 eventos criados.');
}

bulkCreate();
