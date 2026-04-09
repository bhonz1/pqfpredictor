import { NextRequest, NextResponse } from 'next/server';

interface PredictionRequest {
  features: string;
  totalHours: number;
  totalWeeks: number;
  inputType: string;
  modelType: string;
}

interface ModelPrediction {
  level: number;
  confidence: number;
  levelScores: Record<number, number>;
  reasoning: string;
}

interface LLMPrediction {
  level: number;
  confidence: number;
  reasoning: string;
  skillsIdentified: string[];
}

interface HybridPredictionResponse {
  level: number;
  confidence: number;
  analysis: string;
  reasoning: string;
  hybridScore: number;
  modelPrediction: ModelPrediction;
  llmPrediction: LLMPrediction;
  ensembleMethod: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PredictionRequest = await request.json();
    const { features, totalHours, totalWeeks, inputType, modelType } = body;

    // Step 1: Get Structured Model Prediction (Rule-based/Keyword)
    const modelPrediction = runModelPrediction(features, totalHours, totalWeeks, modelType);

    // Step 2: Get Contextual LLM Prediction from Cloudflare Workers AI
    const llmPrediction = await runLLMPrediction(
      features,
      totalHours,
      totalWeeks,
      inputType,
      modelPrediction // Pass model prediction for LLM context
    );

    // Step 3: Combine predictions using Hybrid Ensemble
    const hybridResult = combinePredictions(
      modelPrediction,
      llmPrediction,
      features,
      totalHours,
      totalWeeks
    );

    return NextResponse.json(hybridResult);

  } catch (error) {
    console.error('Hybrid Prediction API error:', error);
    
    // Return fallback prediction on error
    const fallback = runModelPrediction('Error occurred', 0, 0, 'fallback');
    const llmFallback = {
      level: fallback.level,
      confidence: fallback.confidence,
      reasoning: 'Fallback due to error',
      skillsIdentified: []
    };
    return NextResponse.json(combinePredictions(fallback, llmFallback, '', 0, 0));
  }
}

function buildPredictionPrompt(
  features: string,
  totalHours: number,
  totalWeeks: number,
  inputType: string,
  modelPrediction: ModelPrediction
): string {
  return `Please analyze the following student data and determine their PQF level.

**Student Accomplishments Data:**
${inputType === 'skills_gained' ? 'Skills Gained:' : 'Performed Activities:'}
${features}

**Experience Metrics:**
- Total Hours Rendered: ${totalHours} hours
- Duration: ${totalWeeks} weeks

**Reference Analysis (Structured Model Prediction):**
The rule-based classifier suggests Level ${modelPrediction.level} with ${modelPrediction.confidence}% confidence.
Key scoring factors: ${Object.entries(modelPrediction.levelScores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([level, score]) => `Level ${level} (${score.toFixed(1)} pts)`)
    .join(', ')}.

**Your Task:**
Analyze the text contextually and provide your independent assessment. Consider:
1. Technical complexity and sophistication of skills demonstrated
2. Scope of responsibilities and autonomy level
3. Industry-standard competency frameworks
4. The structured model's assessment as one data point, not the final answer

Respond ONLY with a JSON object:
{
  "level": <number 1-6>,
  "confidence": <number 0-100>,
  "reasoning": "<detailed explanation of contextual assessment>",
  "skillsIdentified": ["<skill1>", "<skill2>", "..."],
  "agreementWithModel": "<agree|disagree|partial>"
}`;
}

async function runLLMPrediction(
  features: string,
  totalHours: number,
  totalWeeks: number,
  inputType: string,
  modelPrediction: ModelPrediction
): Promise<LLMPrediction> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return {
      level: modelPrediction.level,
      confidence: modelPrediction.confidence * 0.8,
      reasoning: 'LLM unavailable - using model prediction as fallback',
      skillsIdentified: []
    };
  }

  const prompt = buildPredictionPrompt(features, totalHours, totalWeeks, inputType, modelPrediction);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert PQF (Philippine Qualifications Framework) level assessor specializing in contextual text analysis.

PQF Levels Context:
- Level 1: Beginner - Basic concepts, fundamentals
- Level 2: Foundation - Variables, conditionals, basic syntax
- Level 3: Advanced/Intermediate - OOP, data structures, algorithms
- Level 4: Professional - Debugging, version control, databases, deployment
- Level 5: Specialist/Senior - Frameworks, API design, full stack, DevOps
- Level 6: Master/Expert - Architecture, leadership, AI/ML, cloud architecture

You are part of a Hybrid AI system. A structured rule-based model has provided its assessment. 
Your role is to provide INDEPENDENT contextual analysis of the text, not to simply agree with the model.
Look for nuances, implied competencies, and contextual understanding that keyword matching misses.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.4,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.result?.response) {
      throw new Error('Invalid response from Cloudflare AI');
    }

    const llmOutput = data.result.response;
    let parsedResult;
    
    try {
      const jsonMatch = llmOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = JSON.parse(llmOutput);
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', llmOutput);
      throw new Error('JSON parsing failed');
    }

    return {
      level: Math.max(1, Math.min(6, parsedResult.level || modelPrediction.level)),
      confidence: Math.max(0, Math.min(100, parsedResult.confidence || 70)),
      reasoning: parsedResult.reasoning || 'Contextual analysis completed.',
      skillsIdentified: parsedResult.skillsIdentified || [],
    };

  } catch (error) {
    console.error('LLM prediction failed:', error);
    return {
      level: modelPrediction.level,
      confidence: modelPrediction.confidence * 0.9,
      reasoning: 'LLM analysis unavailable - using structured model prediction',
      skillsIdentified: []
    };
  }
}

function buildAnalysisText(
  result: any,
  features: string,
  totalHours: number,
  totalWeeks: number
): string {
  const skills = result.skillsIdentified || [];
  const skillsText = skills.length > 0 
    ? `Key skills identified: ${skills.join(', ')}.` 
    : '';
  
  return `PQF Level ${result.level} Assessment: ${result.reasoning}

${skillsText}

This assessment is based on ${totalWeeks} weeks of documented experience (${totalHours} total hours). The AI analyzed the student's ${features.length > 100 ? features.substring(0, 100) + '...' : features} to determine competency level.`;
}

// Structured Model Prediction (Rule-based/Keyword matching as proxy for trained model)
function runModelPrediction(
  features: string,
  totalHours: number,
  totalWeeks: number,
  modelType: string
): ModelPrediction {
  const featureText = features.toLowerCase();
  const featureWords = featureText.split(/[\s,;]+/).filter(w => w.length > 2);
  const uniqueWords = new Set(featureWords);

  const keywordDatabase: Record<number, { keywords: string[]; weight: number }> = {
    6: {
      keywords: ['architect', 'leadership', 'mentoring', 'research', 'innovation', 'strategic', 
                 'complex systems', 'enterprise', 'scalability', 'distributed systems', 
                 'machine learning', 'ai', 'artificial intelligence', 'blockchain', 'microservices',
                 'kubernetes', 'docker swarm', 'system design', 'technical leadership',
                 'advanced algorithms', 'optimization', 'performance tuning', 'security architecture',
                 'cloud architecture', 'devops', 'ci/cd pipelines', 'infrastructure as code'],
      weight: 3.0
    },
    5: {
      keywords: ['framework', 'design patterns', 'integration', 'api design', 'database design',
                'backend', 'frontend', 'full stack', 'restful', 'graphql', 'oauth', 'jwt',
                'authentication', 'authorization', 'middleware', 'caching', 'redis', 'message queue',
                'event-driven', 'websocket', 'real-time', 'testing frameworks', 'automation'],
      weight: 2.5
    },
    4: {
      keywords: ['debugging', 'troubleshooting', 'profiling', 'code review', 'refactoring',
                'version control', 'git', 'github', 'gitlab', 'agile', 'scrum', 'jira',
                'sql', 'database', 'orm', 'mvc', 'mvvm', 'component', 'library', 'npm',
                'package management', 'deployment', 'hosting', 'ssl', 'https'],
      weight: 2.0
    },
    3: {
      keywords: ['object-oriented', 'oop', 'inheritance', 'polymorphism', 'encapsulation',
                'interfaces', 'abstract classes', 'data structures', 'arrays', 'lists', 'maps',
                'algorithms', 'sorting', 'searching', 'recursion', 'iteration', 'loops',
                'functions', 'methods', 'classes', 'objects', 'json', 'xml', 'parsing',
                'error handling', 'exceptions', 'logging'],
      weight: 1.5
    },
    2: {
      keywords: ['variables', 'constants', 'data types', 'strings', 'numbers', 'booleans',
                'conditionals', 'if else', 'switch', 'operators', 'arithmetic', 'logical',
                'comparison', 'input', 'output', 'console', 'print', 'basic syntax',
                'hello world', 'comments', 'documentation', 'ide', 'editor'],
      weight: 1.0
    },
    1: {
      keywords: ['introduction', 'overview', 'fundamentals', 'concepts', 'basics',
                'getting started', 'tutorial', 'learning', 'study', 'theory',
                'history', 'terminology', 'definitions', 'examples', 'exercises'],
      weight: 0.5
    }
  };

  const levelScores: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (let level = 1; level <= 6; level++) {
    const { keywords, weight } = keywordDatabase[level];
    let matches = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const exactMatches = (featureText.match(regex) || []).length;
      const partialMatches = featureText.includes(keyword) ? 1 : 0;
      matches += (exactMatches * 2) + (partialMatches * 0.5);
    });
    
    levelScores[level] = matches * weight;
  }

  let hoursLevel = 1;
  if (totalHours >= 600) hoursLevel = 6;
  else if (totalHours >= 480) hoursLevel = 5;
  else if (totalHours >= 360) hoursLevel = 4;
  else if (totalHours >= 240) hoursLevel = 3;
  else if (totalHours >= 120) hoursLevel = 2;
  
  levelScores[hoursLevel] += 3;

  const sortedLevels = Object.entries(levelScores)
    .map(([level, score]) => ({ level: parseInt(level), score }))
    .sort((a, b) => b.score - a.score);

  const predictedLevel = sortedLevels[0]?.level || 1;
  const maxScore = Math.max(...Object.values(levelScores));
  const confidence = maxScore > 0 
    ? Math.round((levelScores[predictedLevel] / maxScore) * 100) 
    : 50;

  return {
    level: predictedLevel,
    confidence: Math.min(confidence, 95),
    levelScores,
    reasoning: `Structured model (${modelType}) prediction using keyword pattern matching and experience metrics.`,
  };
}

// Hybrid Ensemble: Combine Model + LLM predictions
function combinePredictions(
  modelPrediction: ModelPrediction,
  llmPrediction: LLMPrediction,
  features: string,
  totalHours: number,
  totalWeeks: number
): HybridPredictionResponse {
  const modelLevel = modelPrediction.level;
  const llmLevel = llmPrediction.level;
  
  // Calculate weighted ensemble (60% LLM, 40% Model - LLM has better contextual understanding)
  const modelWeight = 0.4;
  const llmWeight = 0.6;
  
  // Agreement detection
  const agreement = modelLevel === llmLevel ? 'full' : 
                   Math.abs(modelLevel - llmLevel) === 1 ? 'partial' : 'disagree';
  
  // Weighted level calculation
  let finalLevel: number;
  let ensembleMethod: string;
  
  if (agreement === 'full') {
    // Full agreement - boost confidence
    finalLevel = modelLevel;
    ensembleMethod = 'consensus';
  } else if (agreement === 'partial') {
    // Partial agreement - weight LLM higher for adjacent levels
    const weightedLevel = (llmLevel * llmWeight) + (modelLevel * modelWeight);
    finalLevel = Math.round(weightedLevel);
    ensembleMethod = 'weighted-average';
  } else {
    // Disagreement - trust LLM for contextual understanding but cap within 1 level of model
    const maxDeviation = 1;
    const minAcceptable = Math.max(1, modelLevel - maxDeviation);
    const maxAcceptable = Math.min(6, modelLevel + maxDeviation);
    finalLevel = Math.max(minAcceptable, Math.min(maxAcceptable, llmLevel));
    ensembleMethod = 'llm-constrained';
  }
  
  // Calculate hybrid confidence
  const baseConfidence = (modelPrediction.confidence * modelWeight) + (llmPrediction.confidence * llmWeight);
  const agreementBoost = agreement === 'full' ? 5 : agreement === 'partial' ? 2 : 0;
  const finalConfidence = Math.min(100, Math.round(baseConfidence + agreementBoost));
  
  // Build hybrid reasoning - focus on assessment, not mechanics
  // Use LLM reasoning directly as it contains the actual assessment of student activities
  const hybridReasoning = llmPrediction.reasoning;
  
  // Calculate hybrid score (composite metric)
  const hybridScore = Math.round(
    (finalConfidence * 0.4) + 
    (finalLevel * 10) + 
    (totalWeeks * 0.5) + 
    (agreement === 'full' ? 10 : agreement === 'partial' ? 5 : 0)
  );
  
  // Build analysis text
  const skillsText = llmPrediction.skillsIdentified?.length > 0 
    ? `Key competencies: ${llmPrediction.skillsIdentified.join(', ')}.` 
    : '';
  
  const analysis = `Hybrid AI Assessment: Level ${finalLevel} (${finalConfidence}% confidence)

${skillsText}

Ensemble Method: ${ensembleMethod}
- Structured Model: Level ${modelLevel} (${modelPrediction.confidence}%)
- Contextual AI: Level ${llmLevel} (${llmPrediction.confidence}%)
- Agreement Level: ${agreement}

Based on ${totalWeeks} weeks (${totalHours} hours) of documented experience.`;

  return {
    level: finalLevel,
    confidence: finalConfidence,
    analysis,
    reasoning: hybridReasoning,
    hybridScore,
    modelPrediction,
    llmPrediction,
    ensembleMethod,
  };
}
