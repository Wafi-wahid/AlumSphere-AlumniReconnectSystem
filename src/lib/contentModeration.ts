// Content moderation utility for community posts

// Negative keywords and phrases that violate community policy
const NEGATIVE_KEYWORDS = [
  // Hate speech and discrimination
  'hate', 'racist', 'racism', 'sexist', 'sexism', 'homophobic', 'transphobic',
  'discriminate', 'discrimination', 'bigot', 'bigotry', 'prejudice',
  
  // Harassment and bullying
  'bully', 'bullying', 'harass', 'harassment', 'abuse', 'abusive',
  'threat', 'threaten', 'threatening', 'intimidate', 'intimidation',
  'stalker', 'stalk', 'cyberbully',
  
  // Inappropriate language
  'fuck', 'shit', 'damn', 'hell', 'bitch', 'bastard', 'asshole',
  'crap', 'piss', 'screw', 'screwed', 'screw you',
  
  // Violence and harmful content
  'kill', 'murder', 'death', 'die', 'suicide', 'self harm', 'cut',
  'violent', 'violence', 'weapon', 'guns', 'knife', 'attack',
  
  // Spam and promotional content indicators
  'buy now', 'click here', 'limited offer', 'act now', 'urgent',
  'congratulations you won', 'free money', 'get rich', 'make money fast',
  
  // Negative sentiment indicators
  'terrible', 'awful', 'horrible', 'disgusting', 'pathetic', 'useless',
  'stupid', 'idiot', 'dumb', 'moron', 'loser', 'failure', 'worthless',
  'bad', 'worst', 'sucks', 'hate', 'terrible', 'awful', 'horrible',
  'crap', 'garbage', 'trash', 'junk', 'disappointing', 'disappointed',
];

// Positive keywords that should be allowed
const POSITIVE_KEYWORDS = [
  'happy', 'excited', 'proud', 'achieved', 'success', 'accomplished',
  'graduated', 'promotion', 'new job', 'opportunity', 'growth', 'learning',
  'helpful', 'support', 'collaborate', 'network', 'community', 'alumni',
];

// Negative patterns to detect
const NEGATIVE_PATTERNS = [
  // Institutional criticism patterns
  /\b(is|are|was|were)\s+(bad|terrible|awful|horrible|worst|sucks|crap|garbage|trash)\b/gi,
  /\b(not|don't|doesn't|never)\s+(recommend|like|love|enjoy|support)\b/gi,
  /\b(avoid|stay away|don't go|skip)\b/gi,
  /\b(worst|terrible|awful|horrible)\s+(experience|place|university|college|school|company)\b/gi,
  /\b(disappointed|disappointing)\s+(with|by|in)\b/gi,
  /\b(hate|dislike|can't stand)\s+(this|that|it)\b/gi,
];

export interface ModerationResult {
  isAllowed: boolean;
  confidence: number;
  reason: string;
  suggestions?: string[];
}

export class ContentModerator {
  private static instance: ContentModerator;
  
  static getInstance(): ContentModerator {
    if (!ContentModerator.instance) {
      ContentModerator.instance = new ContentModerator();
    }
    return ContentModerator.instance;
  }

  /**
   * Analyzes content for policy violations
   * @param content The text content to analyze
   * @returns Moderation result with allow/deny decision and reasoning
   */
  analyzeContent(content: string): ModerationResult {
    if (!content || content.trim().length === 0) {
      return {
        isAllowed: false,
        confidence: 1.0,
        reason: "Post content cannot be empty",
        suggestions: ["Please add some content to your post"]
      };
    }

    const normalizedContent = content.toLowerCase().trim();
    const words = normalizedContent.split(/\s+/);
    
    // Check for negative keywords
    const foundNegativeKeywords = NEGATIVE_KEYWORDS.filter(keyword => 
      normalizedContent.includes(keyword.toLowerCase())
    );
    
    // Check for negative patterns
    const foundNegativePatterns: string[] = [];
    NEGATIVE_PATTERNS.forEach(pattern => {
      const matches = normalizedContent.match(pattern);
      if (matches) {
        foundNegativePatterns.push(...matches);
      }
    });
    
    // Check for positive keywords (this can help with context)
    const foundPositiveKeywords = POSITIVE_KEYWORDS.filter(keyword => 
      normalizedContent.includes(keyword.toLowerCase())
    );

    // Calculate negative score
    let negativeScore = 0;
    foundNegativeKeywords.forEach(keyword => {
      // Weight keywords based on severity
      if (['hate', 'kill', 'murder', 'suicide', 'threat'].includes(keyword)) {
        negativeScore += 3;
      } else if (['fuck', 'shit', 'abuse', 'harass'].includes(keyword)) {
        negativeScore += 2;
      } else {
        negativeScore += 1;
      }
    });
    
    // Add score for pattern matches
    foundNegativePatterns.forEach(() => {
      negativeScore += 1.5; // Pattern matches get moderate weight
    });

    // Calculate positive score
    const positiveScore = foundPositiveKeywords.length * 0.5;

    // Net score (negative - positive)
    const netScore = negativeScore - positiveScore;
    
    // Length check (very short posts might be low quality)
    const isTooShort = content.trim().length < 10;
    if (isTooShort && netScore === 0) {
      return {
        isAllowed: false,
        confidence: 0.8,
        reason: "Post is too short and lacks meaningful content",
        suggestions: ["Please provide more details in your post"]
      };
    }

    // Check for excessive caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5) {
      negativeScore += 1;
    }

    // Check for excessive punctuation (often indicates spam/anger)
    const punctuationCount = (content.match(/[!?]/g) || []).length;
    if (punctuationCount > 3) {
      negativeScore += 0.5;
    }

    // Final decision
    const threshold = 1.5; // Adjust this threshold based on testing
    const isAllowed = netScore < threshold;
    const confidence = Math.min(1.0, Math.abs(netScore) / 3);

    if (!isAllowed) {
      const reasons = [];
      const suggestions = [];
      
      if (foundNegativeKeywords.length > 0) {
        reasons.push(`Contains inappropriate language: ${foundNegativeKeywords.slice(0, 3).join(', ')}`);
        suggestions.push("Please use respectful and professional language");
      }
      
      if (foundNegativePatterns.length > 0) {
        reasons.push(`Contains negative or inappropriate content patterns`);
        suggestions.push("Avoid negative criticism and maintain constructive tone");
      }
      
      if (capsRatio > 0.5) {
        reasons.push("Excessive use of capital letters");
        suggestions.push("Avoid using all caps (it may appear as shouting)");
      }
      
      if (punctuationCount > 3) {
        reasons.push("Excessive punctuation");
        suggestions.push("Use punctuation appropriately");
      }
      
      if (netScore >= 3) {
        reasons.push("Content violates community guidelines");
        suggestions.push("Review our community guidelines for appropriate posting");
      }

      return {
        isAllowed: false,
        confidence,
        reason: reasons.join("; "),
        suggestions
      };
    }

    return {
      isAllowed: true,
      confidence: 1 - confidence,
      reason: "Content complies with community guidelines"
    };
  }

  /**
   * Checks if content is appropriate for the community
   * @param content The text content to check
   * @returns boolean indicating if content is allowed
   */
  isContentAllowed(content: string): boolean {
    const result = this.analyzeContent(content);
    return result.isAllowed;
  }

  /**
   * Gets a user-friendly error message for rejected content
   * @param result The moderation result
   * @returns User-friendly error message
   */
  getErrorMessage(result: ModerationResult): string {
    if (result.isAllowed) {
      return "";
    }

    let message = "This post violates our community policy. ";
    
    if (result.reason) {
      message += result.reason;
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      message += " Suggestions: " + result.suggestions.join("; ") + ".";
    }
    
    return message;
  }
}

export default ContentModerator;
