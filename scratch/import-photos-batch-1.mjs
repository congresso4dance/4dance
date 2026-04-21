import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const [key, ...vals] = line.split('=');
    if (!key) return null;
    return [key.trim(), vals.join('=').trim()];
  }).filter(Boolean)
);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

const batchData = [
  {
    event_id: "670404fa-5fc6-407b-b38d-173616aeecdf", // Reduto
    photos: [
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/633230552_1493292882800355_8249565377461483962_n.jpg?stp=dst-jpg_s417x417_tt6&_nc_cat=103&ccb=1-7&_nc_sid=dd6889&_nc_ohc=uzgwJoVIOWYQ7kNvwFHBcFQ&_nc_oc=AdoEVSHe94JElZQrWaa_jsgtNKIO2GeqYCbtAU1DdBApiW_RFA3AlZr3qJ5akcZGXYMXN11qGWOCwSHkHYUGDPVd&_nc_zt=23&_nc_ht=scontent.fbsb4-1.fna&_nc_gid=3b4PMG1nYO14KNKd54EeGQ&_nc_ss=7a3a8&oh=00_Af2Iqo_XJLibNstv1RcOO6mlL3_GBXNQl8Ti9riH3hmd2g&oe=69EC1250",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/633135483_1493292912800352_3986319226620372975_n.jpg?stp=dst-jpg_s417x417_tt6&_nc_cat=108&ccb=1-7&_nc_sid=dd6889&_nc_ohc=JjqcBoqV_YoQ7kNvwFsCWOV&_nc_oc=AdpCS_NotD6L8rUs5npDBgqZ5-Zd9fYVgnpS4dDr751lFcPTV04qLDzkF5klEOWmp8dwkw7wlzW-OfUa0zvQ7FLQ&_nc_zt=23&_nc_ht=scontent.fbsb4-1.fna&_nc_gid=3b4PMG1nYO14KNKd54EeGQ&_nc_ss=7a3a8&oh=00_Af3jhDZOpKm6tdzNjnGovoKQCBcax_TndgZaXubnl6nr1g&oe=69EBFA4B",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/633351532_1493292859467024_8053435372000125840_n.jpg?stp=dst-jpg_s417x417_tt6&_nc_cat=104&ccb=1-7&_nc_sid=dd6889&_nc_ohc=xX4PUBY5cGAQ7kNvwFka0l7&_nc_oc=AdpQ4IZvjANFOLiOmZjcwS7nDVWeUJd3eE6linhLmoMtWsexxWed4ItJh8SW87JTfBJ28GZRlSpgg2njNGPPPxTV&_nc_zt=23&_nc_ht=scontent.fbsb4-1.fna&_nc_gid=3b4PMG1nYO14KNKd54EeGQ&_nc_ss=7a3a8&oh=00_Af2eIGI1QDuZO3nD0kBKA9iBZcd0OYuM_LiV4EzDmIFbFg&oe=69EC1ECF",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/633266599_1493293089467001_6256344312756430617_n.jpg?stp=dst-jpg_s417x417_tt6&_nc_cat=102&ccb=1-7&_nc_sid=dd6889&_nc_ohc=x_NINzb8SjEQ7kNvwFRIWIX&_nc_oc=AdrA3gSolKbXgZaIMbd61JoNvNRWMGGkWaaG3TtdTVCUEAMPlqbgaOVZaKgdO3WjIix8o5Y6_EJJ-4ocD6vGqKzl&_nc_zt=23&_nc_ht=scontent.fbsb4-1.fna&_nc_gid=3b4PMG1nYO14KNKd54EeGQ&_nc_ss=7a3a8&oh=00_Af29GZPk_PMwnjp-_CMVHgJ95ATELewE5zts7Cw7cAWfSw&oe=69EC0F79"
    ]
  },
  {
    event_id: "936d6a13-4ae3-470a-a538-6cfb0b727f2c", // Marcelo Amorim
    photos: [
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/622774369_1477105334419110_8685497801826703868_n.jpg?stp=dst-jpg_s417x417_tt6&_nc_cat=111&ccb=1-7&_nc_sid=dd6889&_nc_ohc=IDnBdQZUt2AQ7kNvwE9IFx-&_nc_oc=AdppBk1p31SOmyG3Wvq9_8nzo3rTPQfS0aUteRbvphMVliBJLON1F6B-RvRCTI7mZZDHEwHByS4prNEuWf4aXMjs&_nc_zt=23&_nc_ht=scontent.fbsb4-1.fna&_nc_gid=FgCN3BYzfhAhgofwXju95Q&_nc_ss=7a3a8&oh=00_Af1UOfLFwKMHY6sxDUgSKIk5U33Vz8_oj-vFKnRqpFgiNw&oe=69EBFCC2",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/622762856_1477105191085791_3295130561522714913_n.jpg?stp=dst-jpg_s417x417_tt6&_nc_cat=102&ccb=1-7&_nc_sid=dd6889&_nc_ohc=pRgCh1hfge4Q7kNvwFaq8v-&_nc_oc=AdrP4wRbVr1xQBtbZ8TyiIgLrg_3DeDbu7jbWCZXC5_7zkH58fksjf4TwTATmdoUtfht89EGL_xEBRwrTOh-K70M&_nc_zt=23&_nc_ht=scontent.fbsb4-1.fna&_nc_gid=FgCN3BYzfhAhgofwXju95Q&_nc_ss=7a3a8&oh=00_Af1tM6rvG-LnV2AT13U7wGBzHWkV8Jq2X5ZB9tAINE07_w&oe=69EBF60A",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/621782941_1477105237752453_4236470913329945434_n.jpg?stp=dst-jpg_s417x417_tt6&_nc_cat=100&ccb=1-7&_nc_sid=dd6889&_nc_ohc=TN9CRXtHaPQQ7kNvwFCrQaD&_nc_oc=AdoTqhk3YH-_RNpfqGHZxzcp_Jk2ewsfcD7z_bd432rhgCKhil-lb7YjHfjZz7sJ9PAGQqdhpMUnu8DtjX0qcCXB&_nc_zt=23&_nc_ht=scontent.fbsb4-1.fna&_nc_gid=FgCN3BYzfhAhgofwXju95Q&_nc_ss=7a3a8&oh=00_Af0XGUY6TYyZcuVY-ndMwSmUQuQ0tmRCUDZOYnW2LRiUEA&oe=69EBEE02"
    ]
  },
  {
    event_id: "e305e9a4-1a3b-4835-be02-b2f5686001a1", // R2
    photos: [
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/589646039_1425552496241061_4751023421720997985_n.jpg?stp=dst-jpg_s417x417_tt6",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/589547620_1425552629574381_5271922209993018609_n.jpg?stp=dst-jpg_s417x417_tt6",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/589901962_1425551942907783_3051290172019320295_n.jpg?stp=dst-jpg_s417x417_tt6"
    ]
  },
  {
    event_id: "758509c1-4202-4d2d-9477-96a94850ae72", // Altobelli
    photos: [
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/557992177_1379002714229373_417547047728986978_n.jpg?stp=dst-jpg_s417x417_tt6",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/560041250_1379002620896049_9159603230949624902_n.jpg?stp=dst-jpg_s417x417_tt6",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/558417229_1379001480896163_5714613716095480372_n.jpg?stp=dst-jpg_s417x417_tt6"
    ]
  },
  {
    event_id: "d04e571e-cd8d-4e92-9905-f376f9ba7b04", // LambaSwag Domingo
    photos: [
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/553754562_1367211015408543_919815337581491513_n.jpg?stp=dst-jpg_s417x417_tt6",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/555111224_1367210995408545_8640080508347909057_n.jpg?stp=dst-jpg_s417x417_tt6",
      "https://scontent.fbsb4-1.fna.fbcdn.net/v/t39.30808-6/554990984_1367211078741870_6755080866101256628_n.jpg?stp=dst-jpg_s417x417_tt6"
    ]
  }
];

async function importPhotos() {
  console.log('📸 Iniciando importação do Lote 1...');
  
  for (const item of batchData) {
    console.log(`Preenchendo evento ${item.event_id}...`);
    
    // Insert photos
    const photosToInsert = item.photos.map(url => ({
      event_id: item.event_id,
      full_res_url: url,
      thumbnail_url: url
    }));
    
    const { error: photoError } = await supabase.from('photos').insert(photosToInsert);
    if (photoError) console.error(`Erro ao inserir fotos:`, photoError.message);
    
    // Update cover URL
    const { error: eventError } = await supabase.from('events').update({
      cover_url: item.photos[0]
    }).eq('id', item.event_id);
    
    if (eventError) console.error(`Erro ao definir capa:`, eventError.message);
  }
  
  console.log('✅ Lote 1 importado com sucesso!');
}

importPhotos();
