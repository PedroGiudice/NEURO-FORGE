
import { pipeline, env } from '@xenova/transformers';
import { ModelStatus, AnalysisResult } from '../types';

// Configure environment
env.allowLocalModels = false; // Fetch from Hub first
env.useBrowserCache = true;   // Cache heavily

// Define model types
type PipelineType = 'text-generation' | 'text-classification';
type TaskType = 'generator' | 'classifier';

class AIService {
  private static instance: AIService;
  private pipelines: Record<string, any> = {};
  
  // Lightweight models chosen for browser performance
  private models = {
    generator: 'Xenova/distilgpt2',
    classifier: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
  };

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Initialize a specific model task
   */
  public async loadModel(
    task: TaskType, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (this.pipelines[task]) return;

    const pipelineName = task === 'generator' ? 'text-generation' : 'text-classification';
    const modelName = this.models[task];

    try {
      this.pipelines[task] = await pipeline(pipelineName, modelName, {
        progress_callback: (data: any) => {
          if (data.status === 'progress' && onProgress) {
            onProgress(data.progress);
          }
        }
      });
    } catch (error) {
      console.error(`Failed to load ${task} model:`, error);
      throw error;
    }
  }

  /**
   * Generate text completion
   */
  public async generate(prompt: string, maxNewTokens: number = 50): Promise<string> {
    if (!this.pipelines.generator) throw new Error("Generator model not loaded");

    const result = await this.pipelines.generator(prompt, {
      max_new_tokens: maxNewTokens,
      temperature: 0.8,
      do_sample: true,
      top_k: 40,
      return_full_text: false, // Only return the new text
    });

    // Handle standard transformers.js output format
    return Array.isArray(result) ? result[0].generated_text : result.generated_text;
  }

  /**
   * Analyze sentiment/tone
   * Fix: Updated return type to align with AnalysisResult requirements
   */
  public async analyze(text: string): Promise<Pick<AnalysisResult, 'label' | 'score'>> {
    if (!this.pipelines.classifier) throw new Error("Classifier model not loaded");

    // Truncate if too long to avoid token limit errors
    const truncated = text.slice(0, 500); 
    const result = await this.pipelines.classifier(truncated);

    // Format: [{ label: 'POSITIVE', score: 0.99 }]
    const item = Array.isArray(result) ? result[0] : result;
    // Fix: Explicitly cast the model's string label to the AnalysisResult union type
    return {
      label: item.label as AnalysisResult['label'],
      score: item.score
    };
  }

  public isModelLoaded(task: TaskType): boolean {
    return !!this.pipelines[task];
  }
}

export const aiService = AIService.getInstance();
