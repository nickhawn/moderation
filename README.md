# OpenAI Moderation API TypeScript App

A comprehensive TypeScript application that tests the OpenAI Moderation API with all 13 categories, rate limiting, and strong typing.

## Features

- ✅ **Strongly Typed**: Complete TypeScript interfaces for all API responses
- ✅ **13 Categories**: Tests all moderation categories from the latest omni-moderation model
- ✅ **Rate Limiting**: Tracks and respects OpenAI rate limits from response headers
- ✅ **Logging**: Detailed logging for debugging and monitoring
- ✅ **Environment Variables**: Secure API key management via .env file

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
   npm run dev
   ```

## Moderation Categories Tested

The app tests all 13 categories supported by `omni-moderation-latest`:

1. **sexual** - Sexual content
2. **sexual/minors** - Sexual content involving minors
3. **harassment** - Harassing language
4. **harassment/threatening** - Threatening harassment
5. **hate** - Hate speech
6. **hate/threatening** - Threatening hate speech
7. **illicit** - Instructions for illicit activities
8. **illicit/violent** - Violent illicit instructions
9. **self-harm** - Self-harm content
10. **self-harm/intent** - Intent to self-harm
11. **self-harm/instructions** - Self-harm instructions
12. **violence** - Violent content
13. **violence/graphic** - Graphic violence

## Rate Limiting

The app automatically tracks rate limits from OpenAI response headers:
- `x-ratelimit-limit-requests`
- `x-ratelimit-remaining-requests`
- `x-ratelimit-reset-requests`
- `x-ratelimit-limit-tokens`
- `x-ratelimit-remaining-tokens`
- `x-ratelimit-reset-tokens`

When approaching limits (< 10% remaining), the app will automatically wait before making additional requests.

## Usage

The app will run through 10 test examples and provide detailed analysis:

```
🚀 Starting OpenAI Moderation API Tests
Testing 10 examples...

[1/10] Testing: Safe Content
🔍 Moderating text: "This is a normal, safe message about the weat..."
✅ Moderation completed
📊 Analysis for: "This is a normal, safe message..."
Flagged: ✅ NO
```

## API Response Structure

Each moderation result includes:
- `flagged`: Boolean indicating if content violates policies
- `categories`: Object with boolean flags for each category
- `category_scores`: Confidence scores (0-1) for each category
- `category_applied_input_types`: Which input types triggered each category

## Error Handling

The app includes comprehensive error handling for:
- Missing API keys
- Network errors
- Rate limit exceeded
- Invalid responses