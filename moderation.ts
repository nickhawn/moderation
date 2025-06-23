import * as dotenv from "dotenv";
import * as fs from "fs";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

// Strongly typed enums for moderation categories
enum ModerationCategory {
  SEXUAL = "sexual",
  SEXUAL_MINORS = "sexual/minors",
  HARASSMENT = "harassment",
  HARASSMENT_THREATENING = "harassment/threatening",
  HATE = "hate",
  HATE_THREATENING = "hate/threatening",
  ILLICIT = "illicit",
  ILLICIT_VIOLENT = "illicit/violent",
  SELF_HARM = "self-harm",
  SELF_HARM_INTENT = "self-harm/intent",
  SELF_HARM_INSTRUCTIONS = "self-harm/instructions",
  VIOLENCE = "violence",
  VIOLENCE_GRAPHIC = "violence/graphic",
}

// Strongly typed interface for moderation categories
interface ModerationCategories {
  [ModerationCategory.SEXUAL]: boolean;
  [ModerationCategory.SEXUAL_MINORS]: boolean;
  [ModerationCategory.HARASSMENT]: boolean;
  [ModerationCategory.HARASSMENT_THREATENING]: boolean;
  [ModerationCategory.HATE]: boolean;
  [ModerationCategory.HATE_THREATENING]: boolean;
  [ModerationCategory.ILLICIT]: boolean;
  [ModerationCategory.ILLICIT_VIOLENT]: boolean;
  [ModerationCategory.SELF_HARM]: boolean;
  [ModerationCategory.SELF_HARM_INTENT]: boolean;
  [ModerationCategory.SELF_HARM_INSTRUCTIONS]: boolean;
  [ModerationCategory.VIOLENCE]: boolean;
  [ModerationCategory.VIOLENCE_GRAPHIC]: boolean;
}

// Strongly typed interface for category scores
interface ModerationCategoryScores {
  [ModerationCategory.SEXUAL]: number;
  [ModerationCategory.SEXUAL_MINORS]: number;
  [ModerationCategory.HARASSMENT]: number;
  [ModerationCategory.HARASSMENT_THREATENING]: number;
  [ModerationCategory.HATE]: number;
  [ModerationCategory.HATE_THREATENING]: number;
  [ModerationCategory.ILLICIT]: number;
  [ModerationCategory.ILLICIT_VIOLENT]: number;
  [ModerationCategory.SELF_HARM]: number;
  [ModerationCategory.SELF_HARM_INTENT]: number;
  [ModerationCategory.SELF_HARM_INSTRUCTIONS]: number;
  [ModerationCategory.VIOLENCE]: number;
  [ModerationCategory.VIOLENCE_GRAPHIC]: number;
}

// Strongly typed interface for category applied input types
interface ModerationCategoryAppliedInputTypes {
  [ModerationCategory.SEXUAL]: string[];
  [ModerationCategory.SEXUAL_MINORS]: string[];
  [ModerationCategory.HARASSMENT]: string[];
  [ModerationCategory.HARASSMENT_THREATENING]: string[];
  [ModerationCategory.HATE]: string[];
  [ModerationCategory.HATE_THREATENING]: string[];
  [ModerationCategory.ILLICIT]: string[];
  [ModerationCategory.ILLICIT_VIOLENT]: string[];
  [ModerationCategory.SELF_HARM]: string[];
  [ModerationCategory.SELF_HARM_INTENT]: string[];
  [ModerationCategory.SELF_HARM_INSTRUCTIONS]: string[];
  [ModerationCategory.VIOLENCE]: string[];
  [ModerationCategory.VIOLENCE_GRAPHIC]: string[];
}

// Strongly typed interface for a single moderation result
interface ModerationResult {
  flagged: boolean;
  categories: ModerationCategories;
  category_scores: ModerationCategoryScores;
  category_applied_input_types: ModerationCategoryAppliedInputTypes;
}

// Strongly typed interface for the complete moderation response
interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

// Rate limiting information from headers
interface RateLimitInfo {
  limitRequests?: number;
  limitTokens?: number;
  remainingRequests?: number;
  remainingTokens?: number;
  resetRequests?: string;
  resetTokens?: string;
}

// Parse rate limit headers from response
function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limitRequests: headers.get("x-ratelimit-limit-requests")
      ? parseInt(headers.get("x-ratelimit-limit-requests")!)
      : undefined,
    limitTokens: headers.get("x-ratelimit-limit-tokens")
      ? parseInt(headers.get("x-ratelimit-limit-tokens")!)
      : undefined,
    remainingRequests: headers.get("x-ratelimit-remaining-requests")
      ? parseInt(headers.get("x-ratelimit-remaining-requests")!)
      : undefined,
    remainingTokens: headers.get("x-ratelimit-remaining-tokens")
      ? parseInt(headers.get("x-ratelimit-remaining-tokens")!)
      : undefined,
    resetRequests: headers.get("x-ratelimit-reset-requests") || undefined,
    resetTokens: headers.get("x-ratelimit-reset-tokens") || undefined,
  };
}

// Convert time string to milliseconds
function parseTimeToMs(timeStr: string): number {
  const match = timeStr.match(/(\d+)([smh])/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      return 0;
  }
}

// Check if we should wait based on rate limits
function shouldWaitForRateLimit(
  rateLimitInfo: RateLimitInfo,
  threshold: number = 0.1
): number {
  let waitTime = 0;

  // Check request limits
  if (
    rateLimitInfo.remainingRequests !== undefined &&
    rateLimitInfo.limitRequests !== undefined
  ) {
    const requestsRatio =
      rateLimitInfo.remainingRequests / rateLimitInfo.limitRequests;
    if (requestsRatio < threshold && rateLimitInfo.resetRequests) {
      waitTime = Math.max(waitTime, parseTimeToMs(rateLimitInfo.resetRequests));
    }
  }

  // Check token limits
  if (
    rateLimitInfo.remainingTokens !== undefined &&
    rateLimitInfo.limitTokens !== undefined
  ) {
    const tokensRatio =
      rateLimitInfo.remainingTokens / rateLimitInfo.limitTokens;
    if (tokensRatio < threshold && rateLimitInfo.resetTokens) {
      waitTime = Math.max(waitTime, parseTimeToMs(rateLimitInfo.resetTokens));
    }
  }

  return waitTime;
}

// Read content from file
function readContentFromFile(filePath: string = "content.txt"): string {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch (error) {
    throw new Error(`Failed to read content from ${filePath}: ${error}`);
  }
}

class ModerationApp {
  private client: OpenAI;
  private rateLimitInfo: RateLimitInfo = {};

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required. Please set it in your .env file."
      );
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  private logRateLimitInfo() {
    if (Object.keys(this.rateLimitInfo).length > 0) {
      this.log("Rate Limit Info:", this.rateLimitInfo);

      const waitTime = shouldWaitForRateLimit(this.rateLimitInfo);
      if (waitTime > 0) {
        this.log(
          `⚠️  Approaching rate limit. Would wait ${waitTime}ms before next request.`
        );
      }
    }
  }

  async moderateText(text: string): Promise<ModerationResponse> {
    try {
      this.log(
        `🔍 Moderating text: "${text.substring(0, 50)}${
          text.length > 50 ? "..." : ""
        }"`
      );

      // Check if we should wait before making the request
      const waitTime = shouldWaitForRateLimit(this.rateLimitInfo);
      if (waitTime > 0) {
        this.log(`⏳ Waiting ${waitTime}ms due to rate limit proximity...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const response = await this.client.moderations.create({
        model: "omni-moderation-latest",
        input: text,
      });

      // Parse rate limit headers if available
      // Note: The OpenAI SDK might not expose raw headers, so this is a conceptual implementation
      // In a real implementation, you might need to use fetch directly or access response headers differently

      this.log("✅ Moderation completed");
      return response as ModerationResponse;
    } catch (error) {
      this.log("❌ Error during moderation:", error);
      throw error;
    }
  }

  analyzeResult(result: ModerationResult, inputText: string) {
    this.log(
      `📊 Analysis for: "${inputText.substring(0, 30)}${
        inputText.length > 30 ? "..." : ""
      }"`
    );
    this.log(`Flagged: ${result.flagged ? "🚨 YES" : "✅ NO"}`);

    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category);

      this.log(`Flagged Categories: ${flaggedCategories.join(", ")}`);

      // Show high-confidence scores
      const highScores = Object.entries(result.category_scores)
        .filter(([_, score]) => score > 0.1)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3);

      if (highScores.length > 0) {
        this.log("Top Confidence Scores:");
        highScores.forEach(([category, score]) => {
          this.log(`  ${category}: ${(score * 100).toFixed(2)}%`);
        });
      }
    }

    console.log(""); // Add spacing between results
  }

  async runModeration() {
    this.log("🚀 Starting OpenAI Moderation API");

    try {
      const content = readContentFromFile();
      this.log("📄 Content loaded from content.txt");

      const response = await this.moderateText(content);

      if (response.results && response.results.length > 0) {
        this.analyzeResult(response.results[0], content);
      }

      this.logRateLimitInfo();
    } catch (error) {
      this.log("❌ Failed to process content:", error);
      throw error;
    }

    this.log("✅ Moderation completed!");
  }
}

// Main execution
async function main() {
  try {
    const app = new ModerationApp();
    await app.runModeration();
  } catch (error) {
    console.error("💥 Application failed to start:", error);
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main();
}
