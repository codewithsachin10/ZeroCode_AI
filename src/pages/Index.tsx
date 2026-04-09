import Layout from "@/components/Layout";
import HeroSection from "@/components/sections/HeroSection";
import HomeHighlightsSection from "@/components/sections/HomeHighlightsSection";
import VibeCodingSection from "@/components/sections/VibeCodingSection";
import AgenticCodingSection from "@/components/sections/AgenticCodingSection";
import SystemFlowSection from "@/components/sections/SystemFlowSection";
import PromptEngineeringSection from "@/components/sections/PromptEngineeringSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <HomeHighlightsSection />
      <VibeCodingSection />
      <AgenticCodingSection />
      <SystemFlowSection />
      <PromptEngineeringSection />
    </Layout>
  );
};

export default Index;
