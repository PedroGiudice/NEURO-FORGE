import { pipeline, env } from '@xenova/transformers';

// Configure environment for maximum local performance
env.allowLocalModels = false; 
env.useBrowserCache = true;

if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
  env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency;
}

type TaskType = 'generator' | 'classifier' | 'conflict';

class AIService {
  private static instance: AIService;
  private pipelines: Record<string, any> = {};
  
  // Model Configurations
  public readonly availableModels = {
    classifier: [
      { id: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', name: 'DistilBERT Sentiment (Fast)' },
      { id: 'Xenova/bert-base-multilingual-uncased-sentiment', name: 'Multilingual BERT (Robust)' },
      { id: 'Xenova/toxic-bert', name: 'Toxic Comment Detection' }
    ],
    conflict: 'Xenova/mobilebert-uncased-mnli' // Lightweight Zero-Shot
  };

  private currentClassifierId = this.availableModels.classifier[0].id;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public async setClassifierModel(modelId: string, onProgress?: (p: number) => void) {
    if (this.currentClassifierId === modelId && this.pipelines.classifier) return;
    
    // Dispose old pipeline if exists (soft reset)
    // Note: transformers.js doesn't fully dispose memory easily yet, but we can replace reference
    this.pipelines.classifier = null; 
    this.currentClassifierId = modelId;
    
    await this.loadModel('classifier', onProgress);
  }

  public async loadModel(task: TaskType, onProgress?: (progress: number) => void): Promise<void> {
    // Avoid reloading if already ready
    if (this.pipelines[task]) return;

    let pipelineName = '';
    let modelName = '';

    switch (task) {
      case 'generator':
        pipelineName = 'text-generation';
        modelName = 'Xenova/distilgpt2';
        break;
      case 'classifier':
        pipelineName = 'text-classification';
        modelName = this.currentClassifierId;
        break;
      case 'conflict':
        pipelineName = 'zero-shot-classification';
        modelName = this.availableModels.conflict;
        break;
    }

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

  public async generate(prompt: string, config: { temperature: number, maxTokens: number }): Promise<string> {
    if (!this.pipelines.generator) throw new Error("Generator model not loaded");

    const result = await this.pipelines.generator(prompt, {
      max_new_tokens: config.maxTokens,
      temperature: config.temperature,
      do_sample: true,
      top_k: 40,
      return_full_text: false,
    });

    return Array.isArray(result) ? result[0].generated_text : result.generated_text;
  }

  public async analyze(text: string): Promise<any> {
    if (!this.pipelines.classifier) throw new Error("Classifier model not loaded");
    
    // Basic Sentiment
    const truncated = text.slice(0, 500); 
    const clsResult = await this.pipelines.classifier(truncated);
    const sentimentItem = Array.isArray(clsResult) ? clsResult[0] : clsResult;

    // Conflict Detection (if enabled/loaded)
    let conflictResult = null;
    if (this.pipelines.conflict) {
      // We ask the model if the text is "conflicting" or "consistent"
      const zsResult = await this.pipelines.conflict(truncated, ['conflicting information', 'consistent information']);
      
      // zsResult = { labels: [...], scores: [...] }
      const conflictIndex = zsResult.labels.indexOf('conflicting information');
      conflictResult = {
        label: 'CONFLICT',
        score: zsResult.scores[conflictIndex]
      };
    }

    return {
      sentiment: {
        label: sentimentItem.label,
        score: sentimentItem.score
      },
      conflict: conflictResult
    };
  }

  public isModelLoaded(task: TaskType): boolean {
    return !!this.pipelines[task];
  }
}

export const aiService = AIService.getInstance();