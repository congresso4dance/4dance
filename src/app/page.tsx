import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import PortfolioSection from "@/components/PortfolioSection";
import TimelineSection from "@/components/TimelineSection";
import EcosystemSection from "@/components/EcosystemSection";
import SocialProof from "@/components/SocialProof";
import CallToAction from "@/components/CallToAction";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Fetch more events for the dynamic Hero pool and Portfolio
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_public', true)
    .order('event_date', { ascending: false })
    .limit(20);
  
  // Fetch testimonials for Social Proof
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main>
      <Navbar />
      <Hero events={events || []} />
      
      {/* Narrative Flow */}
      <PortfolioSection />
      
      <TimelineSection />
      
      <EcosystemSection />
      
      <SocialProof testimonials={testimonials || []} />
      
      <CallToAction />
      
      <Footer />
    </main>
  );
}
