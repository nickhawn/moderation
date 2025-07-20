import * as dotenv from "dotenv";
import * as fs from "fs";
import OpenAI from "openai";

dotenv.config();

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

interface ModerationResult {
  flagged: boolean;
  categories: ModerationCategories;
  category_scores: ModerationCategoryScores;
  category_applied_input_types: ModerationCategoryAppliedInputTypes;
}

interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

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

function readContentFromFile(filePath: string = "content.txt"): string {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch (error) {
    throw new Error(`Failed to read content from ${filePath}: ${error}`);
  }
}

class ModerationApp {
  private client: OpenAI;

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
    console.log(message);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async moderateText(text: string): Promise<ModerationResponse> {
    try {
      this.log(
        `🔍 Moderating text: "${text.substring(0, 50)}${
          text.length > 50 ? "..." : ""
        }"`
      );

      const response = await this.client.moderations.create({
        model: "omni-moderation-latest",
        input: text,
      });

      this.log("✔️ Moderation completed");
      return response as ModerationResponse;
    } catch (error) {
      this.log("✖️ Error during moderation:", error);
      throw error;
    }
  }

  analyzeResult(result: ModerationResult, inputText: string) {
    this.log(
      `📊 Analysis for: "${inputText.substring(0, 30)}${
        inputText.length > 30 ? "..." : ""
      }"`
    );
    this.log(`Flagged: ${result.flagged ? "🚨 YES" : "✔️ NO"}`);

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

    console.log("");
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
    } catch (error) {
      this.log("❌ Failed to process content:", error);
      throw error;
    }

    this.log("✔️ Moderation completed!");
  }
}

async function main() {
  try {
    const app = new ModerationApp();
    await app.runModeration();
  } catch (error) {
    console.error("💥 Application failed to start:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
