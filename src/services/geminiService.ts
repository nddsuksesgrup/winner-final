import { GoogleGenAI, Type } from "@google/genai";
import { 
  KeywordOutput, 
  StrategyOutput, 
  WritingOutput, 
  ImageOutput, 
  RevisionOutput, 
  SEOOutput, 
  PublishOutput, 
  RatingOutput 
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export const geminiService = {
  async runKeywordAgent(niche: string, targetMarket: string): Promise<KeywordOutput> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Niche: ${niche}\nTarget Market: ${targetMarket}`,
      config: {
        systemInstruction: "You are a Keyword Research Agent. Find high-potential keywords for leads.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryKeyword: { type: Type.STRING },
            secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            searchIntent: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            keywordAngle: { type: Type.STRING },
            recommendedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["primaryKeyword", "secondaryKeywords", "searchIntent", "targetAudience", "keywordAngle", "recommendedTitles"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async runStrategyAgent(keywordData: KeywordOutput): Promise<StrategyOutput> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: JSON.stringify(keywordData),
      config: {
        systemInstruction: "You are a Content Strategy Agent. Define the 'brain' of the article.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            uniqueAngle: { type: Type.STRING },
            ctaDirection: { type: Type.STRING },
            structure: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["goal", "painPoints", "uniqueAngle", "ctaDirection", "structure"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async runWritingAgent(strategyData: StrategyOutput): Promise<WritingOutput> {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: JSON.stringify(strategyData),
      config: {
        systemInstruction: "You are a Content Writing Agent. Write a high-quality article based on the strategy. Use short paragraphs (max 3 lines), natural language, and subtle selling.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            intro: { type: Type.STRING },
            sections: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              } 
            },
            closing: { type: Type.STRING },
            cta: { type: Type.STRING },
            fullContent: { type: Type.STRING }
          },
          required: ["title", "intro", "sections", "closing", "cta", "fullContent"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async runImageAgent(writingData: WritingOutput): Promise<ImageOutput> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: writingData.fullContent,
      config: {
        systemInstruction: "You are an Image Asset Agent. Generate prompts for featured and section images, plus SEO metadata.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            featuredImagePrompt: { type: Type.STRING },
            sectionImagePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
            seo: {
              type: Type.OBJECT,
              properties: {
                filename: { type: Type.STRING },
                altText: { type: Type.STRING }
              }
            }
          },
          required: ["featuredImagePrompt", "sectionImagePrompts", "seo"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async runRevisionAgent(writingData: WritingOutput, imageData: ImageOutput): Promise<RevisionOutput> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Article: ${writingData.fullContent}\nImages: ${JSON.stringify(imageData)}`,
      config: {
        systemInstruction: "You are a Revision Agent. Check for grammar, flow, natural tone, clear CTA, and AI-likeness.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["LULUS", "REVISI"] },
            checklist: {
              type: Type.OBJECT,
              properties: {
                grammar: { type: Type.BOOLEAN },
                flow: { type: Type.BOOLEAN },
                natural: { type: Type.BOOLEAN },
                ctaClear: { type: Type.BOOLEAN },
                notTooAI: { type: Type.BOOLEAN }
              }
            },
            feedback: { type: Type.STRING }
          },
          required: ["status", "checklist"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async runSEOAgent(writingData: WritingOutput): Promise<SEOOutput> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: writingData.fullContent,
      config: {
        systemInstruction: "You are an SEO Optimization Agent. Generate meta tags, slug, and link suggestions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metaTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            slug: { type: Type.STRING },
            keywordPlacement: { type: Type.ARRAY, items: { type: Type.STRING } },
            internalLinkSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["metaTitle", "metaDescription", "slug", "keywordPlacement", "internalLinkSuggestions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async runPublishAgent(allData: any): Promise<PublishOutput> {
    // Simulated publishing
    return {
      status: 'Published',
      checklist: {
        uploaded: true,
        imagesWebp: true,
        linksActive: true,
        tagsSet: true
      }
    };
  },

  async runRatingAgent(allData: any): Promise<RatingOutput> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: JSON.stringify(allData),
      config: {
        systemInstruction: "You are a Rating Agent. Score the published article on SEO, Readability, and Conversion.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoScore: { type: Type.NUMBER },
            readabilityScore: { type: Type.NUMBER },
            conversionScore: { type: Type.NUMBER },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["seoScore", "readabilityScore", "conversionScore", "improvementSuggestions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }
};
