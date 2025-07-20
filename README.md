# Moderation

One of the most underrated OpenAI models in my opinion is `omni-moderation-2024-09-26`. It’s a ✨free✨ moderation model that helps flag harmful content. This playground gives a quick demo of how the API can be used.

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up your OpenAI API key:**

   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Run the application:**
   ```bash
   pnpm start
   ```

## Example

```
🚀 Starting OpenAI Moderation API
📄 Content loaded from content.txt
🔍 Moderating text: "Content goes here."
✔️ Moderation completed
📊 Analysis for: "Content goes here."
Flagged: ✔️ NO

✔️ Moderation completed!
```
