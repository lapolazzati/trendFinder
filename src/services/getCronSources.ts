import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface Source {
  identifier: string;
  type: 'twitter' | 'reddit' | 'instagram';
  category?: string;
}

export async function getCronSources() {
  try {
    console.log("Fetching sources...");

    const sources: Source[] = [
      // Twitter Sources
      { identifier: "https://x.com/RiccardoTrezzi", type: "twitter", category: "finance" },
      { identifier: "https://x.com/ramit", type: "twitter", category: "finance" },
      { identifier: "https://x.com/GrahamStephan", type: "twitter", category: "finance" },
      { identifier: "https://x.com/elerianm", type: "twitter", category: "finance" },
      { identifier: "https://x.com/Nouriel", type: "twitter", category: "finance" },
      { identifier: "https://x.com/TheStalwart", type: "twitter", category: "finance" },
      { identifier: "https://x.com/lisaabramowicz1", type: "twitter", category: "finance" },
      { identifier: "https://x.com/thefinanceninja", type: "twitter", category: "finance" },
      { identifier: "https://x.com/dollarsanddata", type: "twitter", category: "finance" },
      // Reddit Communities
      { identifier: "r/personalfinance", type: "reddit", category: "finance" },
      { identifier: "r/ItaliaPersonalFinance", type: "reddit", category: "finance" },
      { identifier: "r/FinancialIndependence", type: "reddit", category: "finance" },
      { identifier: "r/investing", type: "reddit", category: "finance" },
      { identifier: "r/Fire", type: "reddit", category: "finance" },
      { identifier: "r/EuropeFIRE", type: "reddit", category: "finance" },
      
      // Instagram Influencers
      { identifier: "@marcelloascani", type: "instagram", category: "finance" },
      { identifier: "@giovannicuniberti", type: "instagram", category: "finance" },
      { identifier: "@ilmercatodeipiccolispa", type: "instagram", category: "finance" },
      { identifier: "@thefinancecoach", type: "instagram", category: "finance" },
      { identifier: "@personalfinanceclub", type: "instagram", category: "finance" },
      { identifier: "@moneywithkatie", type: "instagram", category: "finance" },
      { identifier: "@yourrichbff", type: "instagram", category: "finance" },
      { identifier: "@herfirst100k", type: "instagram", category: "finance" },
    ];

    return sources;
  } catch (error) {
    console.error(error);
    throw error;
  }
} 
  