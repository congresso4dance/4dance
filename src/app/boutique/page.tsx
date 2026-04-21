import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./boutique.module.css";
import Image from "next/image";
import Link from "next/link";

const PRODUCTS = [
  {
    id: 1,
    name: "4Dance Preset Pack v1",
    category: "Presets",
    price: "R$ 149,00",
    image: "/logo/Logo l 4dance_BRANCA.png", // Using logo as placeholder
  },
  {
    id: 2,
    name: "Digital High-Res Pack (10 Eventos)",
    category: "Assinatura",
    price: "R$ 499,00",
    image: "/logo/Logo l 4dance_BRANCA.png",
  },
  {
    id: 3,
    name: "Consultoria de Fluxo Fotográfico",
    category: "Educação",
    price: "R$ 890,00",
    image: "/logo/Logo l 4dance_BRANCA.png",
  }
];

export default function BoutiquePage() {
  return (
    <main className={styles.main}>
      <Navbar />
      
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>BOUTIQUE</h1>
          <p className={styles.subtitle}>
            Artefatos digitais e serviços premium para elevar o seu acervo pessoal e profissional.
          </p>
        </header>

        <div className={styles.grid}>
          {PRODUCTS.map((product) => (
            <div key={product.id} className={styles.card}>
              <div className={styles.image}>
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  style={{ objectFit: 'contain', padding: '4rem' }}
                  className={styles.img}
                />
              </div>
              <div className={styles.info}>
                <span className={styles.tag}>{product.category}</span>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.price}>{product.price}</p>
                <Link href="/contrate" className={styles.buyBtn}>
                  Adquirir Agora
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
