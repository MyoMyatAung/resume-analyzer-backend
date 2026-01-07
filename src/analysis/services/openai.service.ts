import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ResumeQuality {
  skillCoverage: number;
  experienceRelevance: number;
  atsCompatibility: number;
  clarityStructure: number;
  overallScore: number;
}

export interface GapDetection {
  missingSkills: string[];
  underrepresentedExperience: string[];
  weakKeywords: string[];
}

export interface Suggestions {
  resumeImprovement: string[];
  skillRecommendations: string[];
  keywordEnhancement: string[];
}

export interface AnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: string;
  recommendations: string;
  summary: string;
  resumeQuality?: ResumeQuality;
  gapDetection?: GapDetection;
  suggestions?: Suggestions;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  private getModel() {
    return this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async extractTextFromResume(fileContent: Buffer, mimeType: string): Promise<string> {
    this.logger.log(`Extracting text from PDF, size: ${fileContent.length} bytes`);

    if (!mimeType.includes('pdf')) {
      throw new Error('Only PDF files are supported');
    }

    const pdfMagicBytes = '%PDF';
    const fileStart = fileContent.slice(0, 5).toString('ascii');
    if (!fileStart.startsWith(pdfMagicBytes)) {
      throw new Error('Invalid PDF file format');
    }

    try {
      let extractedText: string;
      
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileContent);
        extractedText = pdfData.text.trim();
        this.logger.log(`Extracted ${extractedText.length} characters using pdf-parse`);
      } catch (requireError) {
        this.logger.warn('pdf-parse not available, using manual extraction');
        extractedText = await this.extractPdfTextManually(fileContent);
      }

      if (extractedText.length < 50) {
        this.logger.warn('Extracted text is very short, might be a scanned PDF');
        throw new Error('PDF appears to contain minimal text. Please upload a text-based PDF (not scanned image).');
      }

      return extractedText;
    } catch (error: any) {
      this.logger.error(`PDF parsing error: ${error.message}`);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractPdfTextManually(buffer: Buffer): Promise<string> {
    const text = buffer.toString('latin1');
    
    const textStreamMatches = text.match(/stream\s*([\s\S]*?)\s*endstream/g);
    
    if (textStreamMatches && textStreamMatches.length > 0) {
      let fullText = '';
      for (const stream of textStreamMatches.slice(0, 50)) {
        const textContent = stream
          .replace(/stream\s*/, '')
          .replace(/\s*endstream/, '')
          .replace(/\\[()\\[\\]/g, ' ')
          .replace(/\\[0-9]{1,3}\\s/g, ' ')
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/<[0-9a-fA-F]+>/g, ' ')
          .replace(/[^\\x20-\\x7E]/g, ' ')
          .replace(/\\s+/g, ' ')
          .trim();
        
        if (textContent.length > 10 && /[aeiouAEIOU]/.test(textContent)) {
          fullText += textContent + ' ';
        }
      }
      
      if (fullText.length > 50) {
        return fullText.substring(0, 10000);
      }
    }

    const textInParens = text.match(/\\(([^)]{5,100})\\)/g);
    if (textInParens && textInParens.length > 0) {
      const texts = textInParens.map(t => t.slice(1, -1).trim());
      const filtered = texts.filter(t => {
        const lower = t.toLowerCase();
        return /[a-z]/.test(t) && 
               t.length > 5 &&
               !lower.includes('http') &&
               !lower.includes('www') &&
               !lower.includes('adobe') &&
               !lower.includes('pdf');
      });
      
      if (filtered.length > 20) {
        return filtered.slice(0, 500).join(' ').substring(0, 10000);
      }
    }

    throw new Error('Could not extract text from PDF. The PDF might be scanned or password protected.');
  }

  async analyzeResume(resumeText: string): Promise<string> {
    const prompt = `Analyze this resume and provide a structured summary:

1. Key skills and competencies
2. Years of experience  
3. Notable achievements
4. Education summary
5. Career level assessment

Resume content:
${resumeText}`;

    const result = await this.getModel().generateContent(prompt);
    const response = await result.response;
    return response.text() || '';
  }

  async analyzeResumeQuality(resumeText: string): Promise<{
    quality: ResumeQuality;
    gaps: GapDetection;
    suggestions: Suggestions;
  }> {
    const prompt = `You are an expert resume analyst. Analyze this resume in detail and provide your analysis in the following JSON format (valid JSON only, no additional text):

{
  "quality": {
    "skillCoverage": (score 0-100 based on how well skills are documented and relevant),
    "experienceRelevance": (score 0-100 based on experience clarity and job relevance),
    "atsCompatibility": (score 0-100 based on formatting, keywords, and ATS-friendly structure),
    "clarityStructure": (score 0-100 based on readability, organization, and professionalism),
    "overallScore": (weighted average: skillCoverage 30%, experienceRelevance 30%, atsCompatibility 20%, clarityStructure 20%)
  },
  "gaps": {
    "missingSkills": ["list of important skills not found or poorly demonstrated"],
    "underrepresentedExperience": ["areas of experience that need more emphasis"],
    "weakKeywords": ["industry keywords that are missing or underutilized"]
  },
  "suggestions": {
    "resumeImprovement": ["specific actionable improvements for the resume"],
    "skillRecommendations": ["skills to add or emphasize based on industry standards"],
    "keywordEnhancement": ["keywords to incorporate for better ATS matching"]
  }
}

Resume content:
${resumeText}`;

    const result = await this.getModel().generateContent(prompt);
    const response = await result.response;
    const content = response.text() || '{}';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
      const result = JSON.parse(jsonStr);
      return {
        quality: {
          skillCoverage: Math.max(0, Math.min(100, result.quality?.skillCoverage || 0)),
          experienceRelevance: Math.max(0, Math.min(100, result.quality?.experienceRelevance || 0)),
          atsCompatibility: Math.max(0, Math.min(100, result.quality?.atsCompatibility || 0)),
          clarityStructure: Math.max(0, Math.min(100, result.quality?.clarityStructure || 0)),
          overallScore: Math.max(0, Math.min(100, result.quality?.overallScore || 0)),
        },
        gaps: {
          missingSkills: result.gaps?.missingSkills || [],
          underrepresentedExperience: result.gaps?.underrepresentedExperience || [],
          weakKeywords: result.gaps?.weakKeywords || [],
        },
        suggestions: {
          resumeImprovement: result.suggestions?.resumeImprovement || [],
          skillRecommendations: result.suggestions?.skillRecommendations || [],
          keywordEnhancement: result.suggestions?.keywordEnhancement || [],
        },
      };
    } catch {
      return {
        quality: {
          skillCoverage: 0,
          experienceRelevance: 0,
          atsCompatibility: 0,
          clarityStructure: 0,
          overallScore: 0,
        },
        gaps: {
          missingSkills: [],
          underrepresentedExperience: [],
          weakKeywords: [],
        },
        suggestions: {
          resumeImprovement: [],
          skillRecommendations: [],
          keywordEnhancement: [],
        },
      };
    }
  }

  async matchResumeToJob(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
    const prompt = `You are an expert HR analyst. Analyze the following resume against the job description and provide a detailed match analysis.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide your analysis in the following JSON format (valid JSON only, no additional text):
{
  "matchScore": (percentage 0-100 based on skills match, experience requirements, and qualifications),
  "matchedSkills": [list of skills from the resume that match job requirements],
  "missingSkills": [list of important job requirements missing from the resume],
  "experienceMatch": "brief assessment of how well the candidate's experience matches",
  "recommendations": "specific, actionable recommendations for improving the resume for this role",
  "summary": "2-3 sentence overall summary of the candidate's fit for this position",
  "quality": {
    "skillCoverage": (score 0-100 based on how well skills are documented and relevant),
    "experienceRelevance": (score 0-100 based on experience clarity and job relevance),
    "atsCompatibility": (score 0-100 based on formatting, keywords, and ATS-friendly structure),
    "clarityStructure": (score 0-100 based on readability, organization, and professionalism),
    "overallScore": (weighted average)
  },
  "gaps": {
    "missingSkills": ["list of important skills not found or poorly demonstrated"],
    "underrepresentedExperience": ["areas of experience that need more emphasis"],
    "weakKeywords": ["industry keywords that are missing or underutilized"]
  },
  "suggestions": {
    "resumeImprovement": ["specific actionable improvements for the resume"],
    "skillRecommendations": ["skills to add or emphasize based on job requirements"],
    "keywordEnhancement": ["keywords to incorporate for better ATS matching"]
  }
}`;

    const result = await this.getModel().generateContent(prompt);
    const response = await result.response;
    const content = response.text() || '{}';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
      const result = JSON.parse(jsonStr);
      return {
        matchScore: Math.max(0, Math.min(100, result.matchScore || 0)),
        matchedSkills: result.matchedSkills || [],
        missingSkills: result.missingSkills || [],
        experienceMatch: result.experienceMatch || 'Unable to assess',
        recommendations: result.recommendations || '',
        summary: result.summary || '',
        resumeQuality: result.quality ? {
          skillCoverage: Math.max(0, Math.min(100, result.quality.skillCoverage || 0)),
          experienceRelevance: Math.max(0, Math.min(100, result.quality.experienceRelevance || 0)),
          atsCompatibility: Math.max(0, Math.min(100, result.quality.atsCompatibility || 0)),
          clarityStructure: Math.max(0, Math.min(100, result.quality.clarityStructure || 0)),
          overallScore: Math.max(0, Math.min(100, result.quality.overallScore || 0)),
        } : undefined,
        gapDetection: result.gaps ? {
          missingSkills: result.gaps.missingSkills || [],
          underrepresentedExperience: result.gaps.underrepresentedExperience || [],
          weakKeywords: result.gaps.weakKeywords || [],
        } : undefined,
        suggestions: result.suggestions ? {
          resumeImprovement: result.suggestions.resumeImprovement || [],
          skillRecommendations: result.suggestions.skillRecommendations || [],
          keywordEnhancement: result.suggestions.keywordEnhancement || [],
        } : undefined,
      };
    } catch {
      return {
        matchScore: 0,
        matchedSkills: [],
        missingSkills: [],
        experienceMatch: 'Unable to assess',
        recommendations: 'Unable to generate recommendations',
        summary: 'Analysis failed - could not parse AI response',
      };
    }
  }
}
