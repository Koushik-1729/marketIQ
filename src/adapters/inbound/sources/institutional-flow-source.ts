import type { InstitutionalFlow } from "@/domain/ports/institutional-flow-repository";
import { NseIndia } from "stock-nse-india";

// Simple fallback mock data mechanism since public FII/DII APIs are notorious for blocking bots
export async function fetchInstitutionalFlows(): Promise<InstitutionalFlow[]> {
  try {
    const nse = new NseIndia();
    const data = await nse.getDataByEndpoint('/api/fiidiiTradeReact');
    
    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid format from NSE API");
    }

    const flows: InstitutionalFlow[] = data.map((item: any) => {
      // NSE returns e.g. "24-Apr-2026"
      const parsedDate = new Date(item.date);
      // FII/FPI or DII
      const investorType = item.category.includes("FII") ? "FII" : "DII";
      
      return {
        id: "temp", // will be ignored by Prisma creation
        date: parsedDate.toISOString(),
        investorType,
        marketSegment: "EQUITY",
        buyValue: parseFloat(item.buyValue),
        sellValue: parseFloat(item.sellValue),
        netValue: parseFloat(item.netValue),
        source: "NSE_OFFICIAL",
        createdAt: new Date().toISOString()
      };
    });

    return flows;
  } catch (error) {
    console.warn("[institutional-flow-source] Real NSE API unreachable. Falling back to NO_DATA.", error);
    return [];
  }
}
