import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import PortfolioSection from "@/components/PortfolioSection";
import TimelineSection from "@/components/TimelineSection";
import EcosystemSection from "@/components/EcosystemSection";
import SocialProof from "@/components/SocialProof";
import CallToAction from "@/components/CallToAction";
import { createClient } from "@/utils/supabase/server";
import { signSingleUrl } from "@/utils/storage-helper";

export default async function Home() {
  const supabase = await createClient();

  // Fetch more events for the dynamic Hero pool and Portfolio
  const { data: rawEvents } = await supabase
    .from('events')
    .select('*')
    .eq('is_public', true)
    .order('event_date', { ascending: false })
    .limit(20);

  const events = rawEvents
    ? await Promise.all(
        rawEvents.map(async (e) => {
          let coverUrl = e.cover_url;

          // 🔄 Fallback: Se não houver capa, pegar a primeira foto do evento
          if (!coverUrl) {
            const { data: firstPhoto } = await supabase
              .from('photos')
              .select('full_res_url')
              .eq('event_id', e.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle();
            
            if (firstPhoto) {
              coverUrl = firstPhoto.full_res_url;
            }
          }

          return {
            ...e,
            cover_url: (await signSingleUrl(coverUrl)) ?? coverUrl,
          };
        })
      )
    : [];
  
  // Fetch testimonials for Social Proof
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main>
      <Navbar />
      <Hero events={events} />
      
      {/* Narrative Flow */}
      <PortfolioSection events={events} />
      
      <TimelineSection />
      
      <EcosystemSection />
      
      <SocialProof testimonials={testimonials || []} />
      
      <CallToAction />
      
      <Footer />
    </main>
  );
}
